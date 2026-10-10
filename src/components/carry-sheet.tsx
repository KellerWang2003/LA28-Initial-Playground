import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Map as MapIcon, Timer, X } from 'lucide-react'
import { BatonArt } from '@/components/baton-art'
import { Button } from '@/components/ui/button'
import { formatElapsed, useClock } from '@/lib/clock'
import { useFanAt } from '@/lib/location'
import { carrierLabel, closeCarrySheet, dropSpotFor, startDrop, timeOfDay, useCarried, useCarrySheet, type Baton } from '@/lib/batons'
import { cn } from '@/lib/utils'
import { themeById } from '@/data/batons'
import { placeById } from '@/data/la28'

// The baton you're carrying. It opens as you accept, because that's when the
// note left for you is unsealed, and again from the carry bar.
export function CarrySheet() {
  const open = useCarrySheet()
  const carried = useCarried()
  if (!open || !carried) return null
  return <Sheet key={carried.id} baton={carried} />
}

function Sheet({ baton }: { baton: Baton }) {
  const navigate = useNavigate()
  const now = useClock()
  const fan = useFanAt()
  const [shown, setShown] = useState(false)
  const theme = themeById(baton.theme)
  const left = Math.max(0, Math.ceil((baton.expiresAt! - now) / 1000))
  const dropAt = dropSpotFor(baton, fan)
  // The leg that brought it to where you picked it up
  const received = baton.history[baton.history.length - 1]

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true))
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeCarrySheet()
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div role="dialog" aria-modal aria-label={`Carrying the ${theme.name}`} className="fixed inset-0 z-50">
      <div
        aria-hidden
        onClick={closeCarrySheet}
        className={cn('absolute inset-0 bg-black/30 transition-opacity duration-300', shown ? 'opacity-100' : 'opacity-0')}
      />
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 rounded-t-3xl border-t bg-background px-4 pt-4 pb-[max(env(safe-area-inset-bottom),16px)] shadow-xl transition-transform duration-300 ease-out',
          shown ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <header className="flex items-start gap-3">
          <BatonArt theme={baton.theme} className="-my-2 size-20 shrink-0" />
          <div className="min-w-0 flex-1 pt-1">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">You’re carrying</p>
            <h2 className="font-heading text-lg leading-tight font-semibold">{theme.name}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Picked up at {placeById(baton.spot).name}</p>
          </div>
          <Button variant="ghost" size="icon-lg" aria-label="Close" className="-mr-2" onClick={closeCarrySheet}>
            <X className="size-5" />
          </Button>
        </header>

        {/* Unsealed now that it's yours */}
        <div className="mt-4">
          {received.carrier && received.note ? (
            <figure className="rounded-2xl bg-muted px-4 py-3.5">
              <figcaption className="text-xs text-muted-foreground">
                {carrierLabel(received.carrier)} left you a note · {timeOfDay(received.at)}
              </figcaption>
              <blockquote className="mt-1.5 font-heading text-lg leading-snug">“{received.note}”</blockquote>
            </figure>
          ) : received.carrier ? (
            <p className="rounded-2xl bg-muted px-4 py-3.5 text-sm text-muted-foreground">
              {carrierLabel(received.carrier)} brought it here without a note.
            </p>
          ) : (
            <p className="rounded-2xl bg-muted px-4 py-3.5 text-sm text-muted-foreground">
              You’re its first carrier today. Your note will be the first one.
            </p>
          )}
        </div>

        <p className="mt-4 flex items-center gap-2 text-sm">
          <Timer className="size-4 shrink-0" />
          <span className="min-w-0 flex-1">Drop it at another landmark and leave a note for the next fan.</span>
          <span className="shrink-0 font-heading font-semibold tabular-nums">{formatElapsed(left)}</span>
        </p>

        {dropAt ? (
          <Button size="lg" className="mt-4 w-full" onClick={startDrop}>
            Drop baton at {placeById(dropAt).name}
          </Button>
        ) : (
          <Button
            size="lg"
            className="mt-4 w-full"
            onClick={() => {
              closeCarrySheet()
              navigate('/explore')
            }}
          >
            <MapIcon data-icon="inline-start" />
            Show drop spots
          </Button>
        )}
      </div>
    </div>
  )
}
