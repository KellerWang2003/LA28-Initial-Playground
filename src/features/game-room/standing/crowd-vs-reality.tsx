import { Link } from 'react-router'
import { Check, X } from 'lucide-react'
import { formatTime, type Session } from '@/data/la28'
import { cn } from '@/lib/utils'
import { seedShares, seedWinner } from '../seed'
import { contestsFor, type Contest } from './contests'
import { useResultGate, useViewClock } from './delay'
import { flagOf } from './flags'
import { Chip, ResultGate, SectionTitle } from './parts'

// Connects what the room picked to what really happened. The picks are mock numbers
// (seedShares), the outcomes come from the session data.

const icon = (code: string) => (code === 'draw' ? '🤝' : flagOf(code))

// '2028-07-20T19:27' -> '7:27 PM'
const clockText = (ms: number) => {
  const d = new Date(ms)
  return formatTime(`${d.getHours()}:${d.getMinutes()}`)
}

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

function ContestRow({ contest, sessionId }: { contest: Contest; sessionId: string }) {
  const view = useViewClock()
  const key = `standing:${contest.id}`
  const shares = seedShares(key, contest.options)
  const pick = seedWinner(key, contest.options)
  const pct = (code: string) => Math.round(shares[code] * 100)
  const outcome = contest.outcome(view)
  const open = view < contest.closesAt
  const gate = useResultGate(contest.gateId, contest.landedAt)
  const result = !open && outcome && gate === 'shown' ? outcome : undefined
  const called = result?.winner === pick
  const ranked = [...contest.options].sort((a, b) => shares[b] - shares[a])

  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-sm font-medium">{contest.title}</p>
        {result && (
          <span
            className={cn(
              'inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-semibold',
              called ? 'bg-foreground text-background' : 'bg-background',
            )}
          >
            {called ? <Check className="size-3" /> : <X className="size-3" />}
            {!result.final ? 'So far' : called ? 'Called it' : 'Upset'}
          </span>
        )}
      </div>

      {/* One bar split by share of picks; the real winner turns black once it is in */}
      <div className="mt-2.5 flex h-3 gap-0.5 overflow-hidden rounded-full" aria-hidden>
        {ranked.map((code) => (
          <span
            key={code}
            className={cn(
              'h-full',
              result ? (code === result.winner ? 'bg-foreground' : 'bg-foreground/15') : code === pick ? 'bg-foreground/50' : 'bg-foreground/15',
            )}
            style={{ width: `${shares[code] * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs tabular-nums" aria-label="Share of room picks">
        {ranked.map((code) => (
          <li key={code} className={cn(code === result?.winner || (!result && code === pick) ? 'font-semibold' : 'text-muted-foreground')}>
            <span aria-hidden>{icon(code)}</span> {code === 'draw' ? 'Draw' : code} {pct(code)}%
          </li>
        ))}
      </ul>

      <div className="mt-2 text-sm text-muted-foreground">
        {open ? (
          <p>
            Picks close at {clockText(contest.closesAt)}.{' '}
            <Link to={`/sports/games/${sessionId}/play`} className="font-medium text-foreground underline underline-offset-2">
              Pick in CrowdPlay
            </Link>
          </p>
        ) : result ? (
          <p>{capital(result.text)}</p>
        ) : outcome && gate === 'hidden' ? (
          <ResultGate id={contest.gateId} eventMs={contest.landedAt} label="Result hidden. Tap to reveal">
            {null}
          </ResultGate>
        ) : (
          <p>The result is not in yet.</p>
        )}
      </div>
    </li>
  )
}

export function CrowdVsReality({ session }: { session: Session }) {
  const view = useViewClock()
  const contests = contestsFor(session)
  if (contests.length === 0) return null
  // Only picks that have opened; the next one to open gets a single line
  const opened = contests.filter((c) => view >= c.opensAt)
  const later = contests.find((c) => view < c.opensAt)

  return (
    <section aria-label="Crowd versus reality">
      <SectionTitle aside={<Chip tone="quiet">Mock picks</Chip>}>Crowd vs. reality</SectionTitle>
      <div className="rounded-2xl bg-card p-4">
        {opened.length > 0 && (
          <ul className="divide-y divide-background">
            {opened.map((c) => (
              <ContestRow key={c.id} contest={c} sessionId={session.id} />
            ))}
          </ul>
        )}
        {later && (
          <p className={cn('text-sm text-muted-foreground', opened.length > 0 && 'mt-4 border-t border-background pt-4')}>
            Room picks for the {later.title.charAt(0).toLowerCase() + later.title.slice(1)} open at {clockText(later.opensAt)}.
          </p>
        )}
      </div>
    </section>
  )
}
