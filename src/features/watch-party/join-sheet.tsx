import { useEffect, useState } from 'react'
import { Minus, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { flag } from '@/data/la28'
import { cn } from '@/lib/utils'
import { BRINGS, teamCc, teamName, type Bring, type Side, type WatchParty } from '@/features/watch-party/crowd'
import { freeOnSide } from '@/features/watch-party/state'

const MAX_PLUS = 3

// Taking a seat: which side you cheer for, what you'll bring, and friends coming
// with you. Opened from an empty seat (its side is picked) or the Pick a seat button.
export function JoinSheet({
  party,
  initialSide,
  onTake,
  onClose,
}: {
  party: WatchParty
  initialSide: Side
  onTake: (seat: { side: Side; bring?: Bring; plus: number }) => void
  onClose: () => void
}) {
  const [shown, setShown] = useState(false)
  const [side, setSide] = useState<Side>(initialSide)
  const [bring, setBring] = useState<Bring | undefined>()
  const [plus, setPlus] = useState(0)
  const free = freeOnSide(party, side)
  const maxPlus = Math.max(0, Math.min(MAX_PLUS, free - 1))

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true))
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  function pickSide(next: Side) {
    setSide(next)
    setPlus((p) => Math.min(p, Math.max(0, Math.min(MAX_PLUS, freeOnSide(party, next) - 1))))
  }

  return (
    <div role="dialog" aria-modal aria-label="Take a seat" className="fixed inset-0 z-40">
      <div aria-hidden onClick={onClose} className={cn('absolute inset-0 bg-black/30 transition-opacity duration-300', shown ? 'opacity-100' : 'opacity-0')} />
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 rounded-t-3xl border-t bg-background px-4 pt-4 pb-[max(env(safe-area-inset-bottom),16px)] shadow-xl transition-transform duration-300 ease-out',
          shown ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <header className="flex items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold">Take a seat</h2>
          <Button variant="ghost" size="icon-lg" aria-label="Close" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </header>

        <p className="mt-1 text-sm font-medium">Which side are you on?</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {party.teams.map((team, i) => {
            const left = freeOnSide(party, i as Side)
            return (
              <button
                key={team}
                type="button"
                aria-pressed={side === i}
                disabled={left === 0}
                onClick={() => pickSide(i as Side)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-2xl border-2 py-3 transition-transform active:scale-95 disabled:opacity-40',
                  side === i ? 'border-foreground' : 'border-transparent bg-card',
                )}
              >
                <span className="text-3xl leading-none">{flag(teamCc(team))}</span>
                <span className="text-sm font-medium">{teamName(team)}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{left === 0 ? 'Full' : `${left} ${left === 1 ? 'seat' : 'seats'} left`}</span>
              </button>
            )
          })}
        </div>

        <p className="mt-5 text-sm font-medium">
          Bringing anything? <span className="font-normal text-muted-foreground">Optional</span>
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {BRINGS.map((b) => (
            <button
              key={b.id}
              type="button"
              aria-pressed={bring === b.id}
              onClick={() => setBring(bring === b.id ? undefined : b.id)}
              className={cn(
                'flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-transform active:scale-95',
                bring === b.id && 'border-foreground bg-foreground text-background',
              )}
            >
              <b.icon className="size-4" />
              {b.label}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Coming with friends?</p>
            <p className="text-xs text-muted-foreground">They sit next to you</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon-sm" aria-label="One fewer" disabled={plus === 0} onClick={() => setPlus(plus - 1)}>
              <Minus />
            </Button>
            <span className="w-8 text-center font-medium tabular-nums">+{plus}</span>
            <Button variant="outline" size="icon-sm" aria-label="One more" disabled={plus >= maxPlus} onClick={() => setPlus(plus + 1)}>
              <Plus />
            </Button>
          </div>
        </div>

        <Button size="lg" className="mt-6 w-full" disabled={free === 0} onClick={() => onTake({ side, bring, plus })}>
          {plus ? `Take ${plus + 1} seats on the ${teamName(party.teams[side])} side` : `Sit on the ${teamName(party.teams[side])} side`}
        </Button>
      </div>
    </div>
  )
}
