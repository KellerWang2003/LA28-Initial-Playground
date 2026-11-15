import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Flame, Mic, Tv, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { flag } from '@/data/la28'
import { cn } from '@/lib/utils'
import { GAME, type Party } from './parties'

// CrowdPlay at a watch party: the host runs it on the big screen and every phone is a
// controller. Dark and big, like a game show: one thing to look at, one thing to tap.
// Lobby (pick a side), a swim race you win by tapping, then the results.

type Step = 'lobby' | 'race' | 'results'
type Side = 'BR' | 'MA'

const PLAYERS: [string, number][] = [['BR', 212], ['MA', 188], ['US', 96], ['MX', 41], ['FR', 22]]
const RACE_S = 10

export function CrowdPlay({ party }: { party: Party }) {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('lobby')
  const [side, setSide] = useState<Side | null>(null)
  const [taps, setTaps] = useState(0)

  return (
    <div className="flex h-dvh flex-col bg-foreground pt-[env(safe-area-inset-top)] text-background">
      <header className="flex h-14 shrink-0 items-center justify-between px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Leave" onClick={() => navigate(`/events/tonight/${party.id}`)} className="hover:bg-background/10 hover:text-background">
          <X className="size-5" />
        </Button>
        <span className="flex items-center gap-1.5 rounded-full bg-background/10 px-3 py-1.5 text-sm font-semibold">
          <Mic className="size-4" />
          Ana
        </span>
      </header>

      {step === 'lobby' && <Lobby side={side} onSide={setSide} onReady={() => setStep('race')} />}
      {step === 'race' && side && <Race side={side} taps={taps} onTap={() => setTaps((t) => t + 1)} onDone={() => setStep('results')} />}
      {step === 'results' && side && <Results side={side} taps={taps} onDone={() => navigate(`/events/tonight/${party.id}`)} />}
    </div>
  )
}

function Lobby({ side, onSide, onReady }: { side: Side | null; onSide: (s: Side) => void; onReady: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 pb-[max(env(safe-area-inset-bottom),20px)]">
      <div className="flex flex-col items-center pt-4 text-center">
        <Tv className="size-16" strokeWidth={1.25} />
        <h1 className="mt-3 font-heading text-4xl font-bold">Look up!</h1>
      </div>

      <ul className="mt-6 flex flex-wrap justify-center gap-2">
        {PLAYERS.map(([cc, n]) => (
          <li key={cc} className="flex items-center gap-1.5 rounded-full bg-background/10 px-3 py-1.5 text-base font-semibold tabular-nums">
            <span className="text-lg leading-none">{flag(cc)}</span>
            {n}
          </li>
        ))}
      </ul>

      <div className="mt-auto grid grid-cols-2 gap-3">
        {([GAME.home, GAME.away] as Side[]).map((cc) => (
          <button
            key={cc}
            type="button"
            aria-pressed={side === cc}
            onClick={() => onSide(cc)}
            className={cn(
              'flex aspect-square flex-col items-center justify-center rounded-[2rem] border-4 text-7xl transition-transform active:scale-95',
              side === cc ? 'border-background bg-background' : 'border-background/20 bg-background/5',
            )}
          >
            {flag(cc)}
          </button>
        ))}
      </div>
      <Button size="lg" disabled={!side} onClick={onReady} className="mt-4 h-16 w-full rounded-full bg-background text-lg text-foreground hover:bg-background/90">
        Ready
      </Button>
    </div>
  )
}

function Race({ side, taps, onTap, onDone }: { side: Side; taps: number; onTap: () => void; onDone: () => void }) {
  const [left, setLeft] = useState(RACE_S)
  // Taps re-render the parent, so keep the latest onDone without restarting the timer
  const done = useRef(onDone)
  useEffect(() => {
    done.current = onDone
  })
  useEffect(() => {
    const t = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(t)
  }, [])
  useEffect(() => {
    if (left > 0) return
    const t = window.setTimeout(() => done.current(), 700)
    return () => window.clearTimeout(t)
  }, [left])

  // Your side moves with your taps (and everyone else's); the other side keeps a steady pace
  const gone = RACE_S - left
  const lanes: [Side, number][] = [
    [GAME.home as Side, side === GAME.home ? Math.min(1, 0.05 + taps / 60 + gone * 0.03) : Math.min(1, 0.05 + gone * 0.08)],
    [GAME.away as Side, side === GAME.away ? Math.min(1, 0.05 + taps / 60 + gone * 0.03) : Math.min(1, 0.05 + gone * 0.08)],
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 pb-[max(env(safe-area-inset-bottom),20px)]">
      <div className="flex items-center justify-between pt-2">
        <h1 className="font-heading text-4xl font-bold">Swim!</h1>
        <span className="flex size-16 items-center justify-center rounded-2xl bg-background font-heading text-3xl font-bold text-foreground tabular-nums">{left}</span>
      </div>

      <ul className="mt-6 space-y-3">
        {lanes.map(([cc, p]) => (
          <li key={cc} className={cn('relative h-16 overflow-hidden rounded-2xl', cc === side ? 'bg-background/20 ring-2 ring-background' : 'bg-background/10')}>
            <span className="absolute inset-y-0 left-0 bg-background/25 transition-[width] duration-300" style={{ width: `${p * 100}%` }} />
            <span className="absolute top-1/2 -translate-y-1/2 text-4xl leading-none transition-[left] duration-300" style={{ left: `calc(${p * 100}% - ${p * 3}rem)` }}>
              {flag(cc)}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onTap}
        disabled={left <= 0}
        className="mt-auto flex aspect-square w-full items-center justify-center rounded-[3rem] bg-background font-heading text-5xl font-bold text-foreground shadow-xl transition-transform select-none active:scale-95"
      >
        TAP
      </button>
    </div>
  )
}

function Results({ side, taps, onDone }: { side: Side; taps: number; onDone: () => void }) {
  const torches = 10 + Math.min(40, Math.round(taps / 2))
  const board: [string, number][] = [
    [side, 2410],
    [side === 'BR' ? 'MA' : 'BR', 2180],
    ['US', 960],
    ['MX', 410],
    ['FR', 220],
  ]
  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 pb-[max(env(safe-area-inset-bottom),20px)]">
      <div className="flex flex-col items-center pt-2 text-center">
        <span className="text-7xl leading-none">{flag(side)}</span>
        <h1 className="mt-3 font-heading text-4xl font-bold">You won!</h1>
        <span className="mt-4 flex items-center gap-1.5 rounded-full bg-background px-5 py-2 font-heading text-2xl font-bold text-foreground tabular-nums">
          <Flame className="size-6 fill-current" />+{torches}
        </span>
      </div>

      <ol className="mt-6 space-y-2">
        {board.map(([cc, pts], i) => (
          <li key={cc} className={cn('flex items-center gap-3 rounded-2xl px-4 py-3', cc === side ? 'bg-background text-foreground' : 'bg-background/10')}>
            <span className="w-5 font-heading text-lg font-bold tabular-nums">{i + 1}</span>
            <span className="text-2xl leading-none">{flag(cc)}</span>
            <span className="ml-auto font-heading text-lg font-semibold tabular-nums">{pts.toLocaleString()}</span>
          </li>
        ))}
      </ol>

      <Button size="lg" onClick={onDone} className="mt-auto h-16 w-full rounded-full bg-background text-lg text-foreground hover:bg-background/90">
        Done
      </Button>
    </div>
  )
}
