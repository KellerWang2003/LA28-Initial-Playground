import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { groupById, tally } from '@/features/activity/keep-going'
import { joinIn, keepStep, myGroup, pass, reopen, useKeepGoing, voteClosed } from '@/features/activity/keep-going-state'
import { formatCountdown, useClock } from '@/lib/clock'
import { cn } from '@/lib/utils'

const FLOW = '/events/keep-going'

// The after-game question, as a trailing part of the session it belongs to: its card in
// Activities, its row in My activities, and its room. One line, one action, at every step.
// `passed` keeps a way back after "Not tonight" (the room shows it; lists just drop the strip).
export function KeepGoingStrip({ className, passed }: { className?: string; passed?: boolean }) {
  const navigate = useNavigate()
  const keep = useKeepGoing()
  const now = useClock()
  const step = keepStep(keep)

  if (step === 'out') {
    if (!passed) return null
    return (
      <Strip className={className} title="Not tonight" line="You won’t be matched after the game.">
        <Button type="button" size="sm" variant="ghost" onClick={reopen}>
          Undo
        </Button>
      </Strip>
    )
  }

  if (step === 'ask') {
    return (
      <div className={className}>
        <StripText title="Keep going after the game?" line="Get matched with fans from tonight." />
        <div className="mt-2 flex gap-2">
          <Button type="button" size="sm" variant="outline" className="flex-1" onClick={pass}>
            Not tonight
          </Button>
          <Button
            type="button"
            size="sm"
            className="flex-1"
            onClick={() => {
              joinIn()
              navigate(FLOW)
            }}
          >
            I’m in
          </Button>
        </div>
      </div>
    )
  }

  const offer = keep.offerId ? groupById(keep.offerId) : undefined
  const group = myGroup(keep, now)
  let title = 'Finding your group…'
  let line = 'After the game'
  if (step === 'offer' && offer) {
    title = `Matched: ${offer.title}`
    line = `${offer.members.length} people · join or pass`
  } else if (group) {
    const closed = voteClosed(keep, now)
    title = closed ? `Heading to ${tally(group, keep.voteId).leader.name}` : group.title
    line = closed
      ? `${group.members.length + 1} going after the game`
      : `Vote on a place · closes in ${formatCountdown(Math.ceil((keep.votesClose! - now) / 1000))}`
  }

  return (
    <Link to={FLOW} className={cn('flex items-center gap-3 active:opacity-70', className)}>
      <StripText title={title} line={line} />
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}

function Strip({ className, title, line, children }: { className?: string; title: string; line: string; children: ReactNode }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <StripText title={title} line={line} />
      {children}
    </div>
  )
}

function StripText({ title, line }: { title: string; line: string }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-medium">{title}</span>
      <span className="block truncate text-xs text-muted-foreground tabular-nums">{line}</span>
    </span>
  )
}
