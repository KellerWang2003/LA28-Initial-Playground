import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Hand, Users, X } from 'lucide-react'
import { flag } from '@/data/la28'
import { addConnection, useConnections } from '@/lib/connections'
import { formatCountdown, nowMs, useClock } from '@/lib/clock'
import { gameFor, useMyGames } from '@/lib/my-games'
import { cn } from '@/lib/utils'
import type { PlayCtx } from './screens'
import type { PlaySet } from './schedule'
import {
  answerLabel,
  cheering,
  markFound,
  SIGNALS,
  sideOf,
  startFinding,
  stopFinding,
  twinFor,
  useSocial,
  wave,
  type Side,
  type TwinMatch,
} from './social'

// The social parts of CrowdPlay, on its dark game-show screens: your crowd twin after a round,
// the full-screen signal for finding each other, and your side's cheer during the race.

const pct = (n: number) => `${Math.round(n * 100)}%`

// ---- Crowd twin ----

/** After a round: the fan near you who answered most like you */
export function TwinCard({ ctx, set, compact }: { ctx: PlayCtx; set: PlaySet; compact?: boolean }) {
  const social = useSocial()
  const atVenue = gameFor(useMyGames(), ctx.session.id)?.mode === 'venue'
  const match = twinFor(set, ctx.answers)
  if (!match) return null
  const { twin, same, total, split } = match
  const found = social.found.includes(twin.id)
  const waved = social.waved.includes(twin.id)

  return (
    <section className="animate-pin-pop rounded-3xl bg-background/10 p-4 text-left" aria-label="Your crowd twin">
      <p className="text-[11px] font-semibold tracking-wide uppercase opacity-60">Your crowd twin · {set.title}</p>
      <div className="mt-2 flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-background text-2xl text-foreground" aria-hidden>
          {flag(twin.cc)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-lg leading-tight font-bold">{twin.name}</span>
          <span className="block truncate text-xs opacity-70">
            {atVenue ? `${twin.seat} · about ${twin.startM} m away` : 'In the stands at SoFi'}
          </span>
        </span>
        <MatchDots same={same.length} total={total} />
      </div>
      <p className="mt-3 text-sm">
        <span className="font-semibold">
          Answered like you {same.length} of {total}
        </span>
        {!compact && split && (
          <span className="opacity-70">
            {' '}
            · you split on “{split.question.title}”: {twin.name} said {split.theirs}
          </span>
        )}
      </p>
      {found ? (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-sm font-semibold text-foreground">
          <Check className="size-4" />
          You found each other
        </p>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={waved}
            onClick={() => wave(twin.id)}
            className={cn('h-11 flex-1 rounded-full bg-background/15 text-sm font-semibold transition-transform active:scale-95', waved && 'opacity-60')}
          >
            {waved ? 'Waved 👋' : 'Wave 👋'}
          </button>
          {atVenue && (
            <button
              type="button"
              onClick={() => startFinding(twin.id)}
              className="h-11 flex-1 rounded-full bg-background text-sm font-semibold text-foreground transition-transform active:scale-95"
            >
              Find each other
            </button>
          )}
        </div>
      )}
      {/* Over everything: the card's pop-in transform would trap a fixed screen inside it */}
      {social.finding === twin.id && createPortal(<FindEachOther match={match} answers={ctx.answers} />, document.body)}
    </section>
  )
}

function MatchDots({ same, total }: { same: number; total: number }) {
  return (
    <span className="flex shrink-0 gap-1" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cn('size-2.5 rounded-full', i < same ? 'bg-background' : 'bg-background/25')} />
      ))}
    </span>
  )
}

// How long the pretend walk toward each other takes, in seconds of app time
const FIND_S = 24
const CLOSE_M = 6

/**
 * Full screen, white, one giant shape and a number. Both phones show the same, so you hold yours
 * up and look for the other one in the stands. Signal bars fill as you get closer.
 */
function FindEachOther({ match, answers }: { match: TwinMatch; answers: Record<string, string> }) {
  const { twin, same } = match
  const now = useClock()
  const [since] = useState(nowMs)
  const [found, setFound] = useState(false)
  const connections = useConnections()
  const signal = SIGNALS[twin.id] ?? { shape: '◆', number: 10 }
  const x = Math.min(1, (now - since) / (FIND_S * 1000))
  const meters = Math.max(2, Math.round(twin.startM * (1 - x) ** 1.3))
  const close = meters <= CLOSE_M
  const bars = Math.min(5, 1 + Math.floor(x * 5))

  if (found) {
    const added = connections.includes(twin.id)
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background px-5 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),16px)] text-foreground">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="animate-stamp-in text-7xl" aria-hidden>
            🤝
          </p>
          <h1 className="mt-5 font-heading text-3xl font-bold">You found {twin.name}</h1>
          <p className="mt-2 text-muted-foreground">Something to start with: you both said</p>
          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {same.map((q) => {
              // On these, theirs is the same as yours
              const option = q.options?.find((o) => o.id === answers[q.id])
              return (
                <li key={q.id} className="rounded-full bg-card px-3 py-1.5 text-sm font-medium">
                  {option?.emoji} {answerLabel(q, answers[q.id])}
                </li>
              )
            })}
          </ul>
          {match.split && (
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              And one to argue about: “{match.split.question.title}” {twin.name} said {match.split.theirs}.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <button
            type="button"
            disabled={added}
            onClick={() => addConnection(twin.id)}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-foreground font-semibold text-background disabled:opacity-60"
          >
            {added ? (
              <>
                <Check className="size-4" /> {twin.name} is in your people
              </>
            ) : (
              `Add ${twin.name} on Palms`
            )}
          </button>
          <button type="button" onClick={() => markFound(twin.id)} className="h-12 w-full font-medium text-muted-foreground">
            Back to CrowdPlay
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background pt-[max(env(safe-area-inset-top),12px)] pb-[max(env(safe-area-inset-bottom),16px)] text-foreground">
      <header className="flex items-center gap-2 px-3">
        <button type="button" onClick={stopFinding} aria-label="Stop looking" className="grid size-10 place-items-center rounded-full bg-card">
          <X className="size-5" />
        </button>
        <p className="min-w-0 flex-1 truncate text-center text-sm font-semibold">
          Looking for {flag(twin.cc)} {twin.name}
        </p>
        <SignalBars bars={bars} />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">Hold up your phone. {twin.name}’s shows the same.</p>
        <div className="relative mt-6 grid size-64 place-items-center">
          <span
            className="absolute inset-0 animate-ping rounded-full bg-foreground/10"
            style={{ animationDuration: close ? '0.7s' : `${2.2 - x * 1.2}s` }}
            aria-hidden
          />
          <span className="relative font-heading text-[11rem] leading-none" aria-label={`Shape ${signal.shape}`}>
            {signal.shape}
          </span>
        </div>
        <p className="mt-2 font-heading text-6xl font-bold tabular-nums">{signal.number}</p>
        <p className="mt-6 text-lg font-semibold tabular-nums" aria-live="polite">
          {close ? `${twin.name} is right around you` : `About ${meters} m away`}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{twin.seat}</p>
      </div>

      <div className="px-5">
        <button
          type="button"
          onClick={() => setFound(true)}
          className={cn(
            'h-14 w-full rounded-full font-semibold transition-colors',
            close ? 'bg-foreground text-background' : 'bg-card text-foreground',
          )}
        >
          We found each other
        </button>
      </div>
    </div>
  )
}

function SignalBars({ bars }: { bars: number }) {
  return (
    <span className="flex h-10 w-10 items-end justify-center gap-0.5 pb-2.5" aria-label={`Signal ${bars} of 5`}>
      {[1, 2, 3, 4, 5].map((b) => (
        <span key={b} className={cn('w-1 rounded-full transition-colors', b <= bars ? 'bg-foreground' : 'bg-foreground/15')} style={{ height: 4 + b * 3 }} />
      ))}
    </span>
  )
}

// ---- Your side ----

/** Between rounds: the side your prediction put you on, a cheer during the race, then the call */
export function SideCard({ ctx }: { ctx: PlayCtx }) {
  const side = sideOf(ctx.session.id, ctx.answers)
  if (!side) return null
  const { now } = ctx
  const racing = now >= side.raceStart && now < side.resultAt
  const over = now >= side.resultAt
  const called = side.pick === side.winner

  return (
    <section className="rounded-3xl bg-background/10 p-4 text-left" aria-label="Your side">
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden>
          {side.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold tracking-wide uppercase opacity-60">Your side</span>
          <span className="block truncate font-heading text-lg leading-tight font-bold">Team {side.label}</span>
        </span>
        <span className="shrink-0 text-right text-xs tabular-nums opacity-70">
          <Users className="mb-0.5 ml-auto size-3.5" />
          {side.fans.toLocaleString()} · {pct(side.share)}
        </span>
      </div>
      {over ? (
        <p className={cn('mt-3 rounded-2xl px-4 py-3 text-center font-heading text-xl font-bold', called ? 'animate-stamp-in bg-background text-foreground' : 'bg-background/10')}>
          {called ? `You called it! ${side.winnerLabel} wins 🎉` : `${side.winnerLabel} wins. Next time.`}
        </p>
      ) : racing ? (
        <CheerButton side={side} now={now} />
      ) : (
        <p className="mt-3 text-sm opacity-70 tabular-nums">
          {side.question.title.replace('Who wins the ', 'The ').replace('?', '')} starts in{' '}
          {formatCountdown(Math.ceil((side.raceStart - now) / 1000))}. Your side cheers together.
        </p>
      )}
    </section>
  )
}

type Burst = { id: number; x: number; emoji: string }

// Press and hold to cheer with your side. The ring fills, the count swells, emoji float up.
function CheerButton({ side, now }: { side: Side; now: number }) {
  const [holding, setHolding] = useState(false)
  const [bursts, setBursts] = useState<Burst[]>([])
  const nextId = useRef(0)

  useEffect(() => {
    if (!holding) return
    const timer = setInterval(() => {
      const id = nextId.current++
      setBursts((b) => [...b.slice(-14), { id, x: 10 + Math.random() * 80, emoji: Math.random() < 0.5 ? (side.emoji ?? '🔥') : '🔥' }])
    }, 160)
    return () => clearInterval(timer)
  }, [holding, side.emoji])

  const count = cheering(side, now, holding)

  return (
    <div className="relative mt-3">
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-28 overflow-hidden" aria-hidden>
        {bursts.map((b) => (
          <span key={b.id} className="animate-float-up absolute bottom-0 text-2xl" style={{ left: `${b.x}%` }}>
            {b.emoji}
          </span>
        ))}
      </div>
      <button
        type="button"
        onPointerDown={() => setHolding(true)}
        onPointerUp={() => setHolding(false)}
        onPointerLeave={() => setHolding(false)}
        onPointerCancel={() => setHolding(false)}
        onContextMenu={(e) => e.preventDefault()}
        className={cn(
          'flex h-16 w-full touch-none items-center justify-center gap-2 rounded-full font-heading text-lg font-bold transition-all select-none',
          holding ? 'scale-[0.97] bg-background text-foreground' : 'bg-background/15',
        )}
      >
        <Hand className={cn('size-5', holding && 'animate-bounce')} />
        {holding ? 'Cheering!' : `Hold to cheer for ${side.label}`}
      </button>
      <p className="mt-2 text-center text-xs tabular-nums opacity-70" aria-live="polite">
        <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-red-500 align-middle" />
        Race is on · {count.toLocaleString()} on your side cheering
      </p>
    </div>
  )
}

/** Under a prediction's result: the side you just joined */
export function SideNote({ ctx }: { ctx: PlayCtx }) {
  const side = sideOf(ctx.session.id, ctx.answers)
  if (!side) return null
  return (
    <p className="mt-5 rounded-2xl bg-background/10 px-4 py-3 text-sm">
      <span className="font-semibold">
        You’re on Team {side.label} {side.emoji}
      </span>{' '}
      <span className="opacity-70">with {side.fans.toLocaleString()} fans. Cheer together during the race.</span>
    </p>
  )
}

