import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { formatTime, type Session } from '@/data/la28'
import { formatCountdown, useClock } from '@/lib/clock'
import { cn } from '@/lib/utils'
import { phaseAt } from './schedule'

// Under this, the button counts down instead of showing the start time
const SOON_S = 120

const clockOf = (ms: number) => {
  const d = new Date(ms)
  return formatTime(`${d.getHours()}:${d.getMinutes()}`)
}

// The way into CrowdPlay, floating at the bottom center of the game page. It says what the crowd
// is up to: the next round, a countdown, a round that is live right now, or the recap at the end.
export function CrowdPlayButton({ session }: { session: Session }) {
  const now = useClock()
  const phase = phaseAt(session.id, now)
  if (phase.kind === 'none') return null

  const over = phase.kind === 'over' || session.status === 'finished'
  const live = phase.kind === 'intro' || phase.kind === 'question' || phase.kind === 'result'
  const soon = phase.kind === 'waiting' && phase.left <= SOON_S

  const status = over
    ? 'See how the crowd played'
    : live
      ? phase.kind === 'intro'
        ? `${phase.set.title} · starting`
        : `${phase.set.title} · Q${phase.question.index + 1} of ${phase.set.questions.length}`
      : phase.kind === 'waiting'
        ? soon
          ? `Next round in ${formatCountdown(phase.left)}`
          : `Next round ${clockOf(phase.next.start)}`
        : phase.kind === 'done' && phase.next
          ? `Next round ${clockOf(phase.next.start)}`
          : 'That’s all for tonight'

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),16px)] z-30 flex justify-center px-4">
      <Link
        to={over ? `/sports/games/${session.id}/recap` : `/sports/games/${session.id}/play`}
        className="pointer-events-auto flex h-14 max-w-full items-center gap-3 rounded-full bg-foreground pr-3 pl-5 text-background shadow-xl ring-1 ring-black/10"
      >
        <span className="min-w-0 text-left">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            {live && <span className="size-2 rounded-full bg-red-500" aria-hidden />}
            {live ? 'CrowdPlay is live' : 'CrowdPlay'}
          </span>
          <span className="block truncate text-xs tabular-nums opacity-70">{status}</span>
        </span>
        <span className={cn('flex h-9 shrink-0 items-center gap-0.5 rounded-full px-3 text-xs font-semibold', live ? 'bg-background text-foreground' : 'bg-background/15')}>
          {over ? 'Recap' : live ? 'Join' : 'Open'}
          <ChevronRight className="size-3.5" />
        </span>
      </Link>
    </div>
  )
}
