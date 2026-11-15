import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Check, Flame, Tv, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { flag } from '@/data/la28'
import { cn } from '@/lib/utils'
import { GAME, type Party } from './parties'

// CrowdPlay at a watch party: the host runs it on the big screen and every phone is a
// controller. Same frame and tiles as CrowdPlay in a game room (dark, one thing to read,
// one thing to tap). Pick a side, a swim race you win by tapping, a trivia question, results.

type Step = 'lobby' | 'race' | 'trivia' | 'results'
type Side = 'BR' | 'MA'

const PLAYERS: [string, number][] = [['BR', 212], ['MA', 188], ['US', 96], ['MX', 41], ['FR', 22]]
const RACE_S = 10
const SHAPES = ['▲', '◆', '●', '■']
const TITLES: Record<Step, string> = { lobby: 'CrowdPlay', race: 'Swim race', trivia: 'Trivia', results: 'CrowdPlay' }

const TRIVIA = {
  title: 'How many World Cups has Brazil won?',
  options: ['3', '4', '5', '6'],
  right: 2,
}

export function CrowdPlay({ party, start = 'lobby' }: { party: Party; start?: Step }) {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(start)
  const [side, setSide] = useState<Side | null>(start === 'lobby' ? null : 'BR')
  const [taps, setTaps] = useState(start === 'lobby' ? 0 : 48)
  const [answer, setAnswer] = useState<number | null>(null)
  const torches = (step === 'lobby' || step === 'race' ? 0 : 10 + Math.min(40, Math.round(taps / 2))) + (answer === TRIVIA.right ? 10 : 0)

  return (
    <div className="flex h-dvh flex-col bg-foreground pt-[env(safe-area-inset-top)] text-background">
      <header className="flex h-14 shrink-0 items-center gap-2 px-3">
        <button
          type="button"
          onClick={() => navigate(`/events/tonight/${party.id}`)}
          aria-label="Close CrowdPlay"
          className="grid size-11 place-items-center rounded-full bg-background/10"
        >
          <X className="size-5" />
        </button>
        <p className="min-w-0 flex-1 truncate text-center text-base font-semibold">{TITLES[step]}</p>
        <span className="inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-full bg-background/10 px-3 text-base font-semibold tabular-nums" aria-label={`${torches} Torches`}>
          <Flame className="size-4 fill-current" />
          {torches}
        </span>
      </header>

      {step === 'lobby' && <Lobby side={side} onSide={setSide} onReady={() => setStep('race')} />}
      {step === 'race' && side && <Race side={side} taps={taps} onTap={() => setTaps((t) => t + 1)} onDone={() => setStep('trivia')} />}
      {step === 'trivia' && <Trivia answer={answer} onAnswer={setAnswer} onNext={() => setStep('results')} />}
      {step === 'results' && side && <Results side={side} torches={torches} onDone={() => navigate(`/events/tonight/${party.id}`)} />}
    </div>
  )
}

const BIG_BUTTON = 'mt-4 h-16 w-full rounded-full bg-background text-lg text-foreground hover:bg-background/90'

function Lobby({ side, onSide, onReady }: { side: Side | null; onSide: (s: Side) => void; onReady: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 pb-[max(env(safe-area-inset-bottom),20px)]">
      <div className="flex flex-col items-center pt-6 text-center">
        <Tv className="size-16" strokeWidth={1.25} />
        <h1 className="mt-3 font-heading text-4xl font-bold">Look up!</h1>
      </div>

      <ul className="mt-6 flex flex-wrap justify-center gap-2">
        {PLAYERS.map(([cc, n]) => (
          <li key={cc} className="flex h-10 items-center gap-1.5 rounded-full bg-background/10 px-3.5 text-base font-semibold tabular-nums">
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
              'relative flex aspect-square flex-col items-center justify-center rounded-3xl text-7xl transition-all active:scale-95',
              side === cc ? 'bg-background' : 'bg-background/10',
              side && side !== cc && 'opacity-40',
            )}
          >
            {side === cc && <Check className="absolute top-3 right-3 size-5 text-foreground" aria-hidden />}
            {flag(cc)}
          </button>
        ))}
      </div>
      <Button size="lg" disabled={!side} onClick={onReady} className={BIG_BUTTON}>
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
      <Timer left={left} total={RACE_S} />

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
        className="mt-auto flex aspect-square w-full items-center justify-center rounded-[3rem] bg-background font-heading text-6xl font-bold text-foreground shadow-xl transition-transform select-none active:scale-95"
      >
        TAP
      </button>
    </div>
  )
}

function Timer({ left, total }: { left: number; total: number }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div role="progressbar" aria-label="Time left" aria-valuemin={0} aria-valuemax={total} aria-valuenow={left} className="h-2 flex-1 overflow-hidden rounded-full bg-background/15">
        <div className="h-full rounded-full bg-background transition-[width] duration-1000 ease-linear" style={{ width: `${(left / total) * 100}%` }} />
      </div>
      <span className="w-8 text-right font-heading text-2xl font-bold tabular-nums">{left}</span>
    </div>
  )
}

// The same answer tiles as CrowdPlay in a game room
function Trivia({ answer, onAnswer, onNext }: { answer: number | null; onAnswer: (i: number) => void; onNext: () => void }) {
  const locked = answer !== null
  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 pb-[max(env(safe-area-inset-bottom),20px)]">
      <Timer left={locked ? 4 : 7} total={10} />
      <h1 className="mt-6 font-heading text-[1.9rem] leading-tight font-bold">{TRIVIA.title}</h1>

      <div role="group" aria-label={TRIVIA.title} className="mt-auto grid grid-cols-2 gap-3">
        {TRIVIA.options.map((o, i) => {
          const picked = answer === i
          return (
            <button
              key={o}
              type="button"
              disabled={locked}
              aria-pressed={picked}
              onClick={() => onAnswer(i)}
              className={cn(
                'relative flex min-h-36 items-center justify-center rounded-3xl font-heading text-5xl font-bold transition-all active:scale-95',
                picked ? 'bg-background text-foreground' : 'bg-background/10',
                locked && !picked && 'opacity-30',
              )}
            >
              <span className="absolute top-3 left-3.5 text-sm opacity-50" aria-hidden>
                {SHAPES[i]}
              </span>
              {picked && <Check className="absolute top-3 right-3 size-5" aria-hidden />}
              {o}
            </button>
          )
        })}
      </div>
      <Button size="lg" disabled={!locked} onClick={onNext} className={BIG_BUTTON}>
        Next
      </Button>
    </div>
  )
}

function Results({ side, torches, onDone }: { side: Side; torches: number; onDone: () => void }) {
  const board: [string, number][] = [
    [side, 2410],
    [side === 'BR' ? 'MA' : 'BR', 2180],
    ['US', 960],
    ['MX', 410],
    ['FR', 220],
  ]
  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 pb-[max(env(safe-area-inset-bottom),20px)]">
      <div className="flex flex-col items-center pt-4 text-center">
        <span className="text-7xl leading-none">{flag(side)}</span>
        <h1 className="mt-3 font-heading text-4xl font-bold">You won!</h1>
        <span className="mt-4 flex items-center gap-1.5 rounded-full bg-background px-5 py-2 font-heading text-2xl font-bold text-foreground tabular-nums">
          <Flame className="size-6 fill-current" />+{torches}
        </span>
      </div>

      <ol className="mt-6 space-y-2">
        {board.map(([cc, pts], i) => (
          <li key={cc} className={cn('flex h-14 items-center gap-3 rounded-2xl px-4', cc === side ? 'bg-background text-foreground' : 'bg-background/10')}>
            <span className="w-5 font-heading text-lg font-bold tabular-nums">{i + 1}</span>
            <span className="text-2xl leading-none">{flag(cc)}</span>
            <span className="ml-auto font-heading text-lg font-semibold tabular-nums">{pts.toLocaleString()}</span>
          </li>
        ))}
      </ol>

      <Button size="lg" onClick={onDone} className={cn(BIG_BUTTON, 'mt-auto')}>
        Back to the party
      </Button>
    </div>
  )
}
