import { useEffect, useState, type ReactNode } from 'react'
import { Lock, MapPin, Timer, X } from 'lucide-react'
import { BatonArt } from '@/components/baton-art'
import { Button } from '@/components/ui/button'
import { useFanAt } from '@/lib/location'
import {
  acceptBaton,
  acceptBlock,
  carrierLabel,
  closeBatonCard,
  metersTo,
  passBaton,
  timeOfDay,
  useBatons,
  useCarryingId,
  useDroppedToday,
  useOpenCard,
  type Baton,
} from '@/lib/batons'
import { cn } from '@/lib/utils'
import { BATON_CONFIG, themeById } from '@/data/batons'
import { placeById } from '@/data/la28'
import { formatKm } from '@/data/map-layers'

// The baton card: what it is, where it has been today, the last note, and
// Accept / Pass. Opened from the map, a nearby alert or a pin collect, so it
// lives at the app root over whatever screen is showing.
export function BatonCard() {
  const id = useOpenCard()
  const batons = useBatons()
  const baton = id ? batons.find((b) => b.id === id) : undefined
  // A carried baton has no public card
  if (!baton || baton.state !== 'resting') return null
  return <CardSheet key={baton.id} baton={baton} />
}

function CardSheet({ baton }: { baton: Baton }) {
  const fan = useFanAt()
  const carrying = useCarryingId()
  const [shown, setShown] = useState(false)
  const theme = themeById(baton.theme)
  const place = placeById(baton.spot)
  const droppedToday = useDroppedToday()
  const block = acceptBlock(baton, carrying, fan, droppedToday)
  const meters = metersTo(baton.spot, fan)
  const carriers = baton.history.filter((leg) => leg.carrier)
  const lastLeg = carriers[carriers.length - 1]

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true))
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeBatonCard()
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div role="dialog" aria-modal aria-label={theme.name} className="fixed inset-0 z-50">
      <div
        aria-hidden
        onClick={closeBatonCard}
        className={cn('absolute inset-0 bg-black/20 transition-opacity duration-300', shown ? 'opacity-100' : 'opacity-0')}
      />
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 flex max-h-[82dvh] flex-col rounded-t-3xl border-t bg-background shadow-xl transition-transform duration-300 ease-out',
          shown ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <header className="flex shrink-0 items-start gap-3 px-4 pt-4">
          <BatonArt theme={baton.theme} className="-my-2 size-24 shrink-0" />
          <div className="min-w-0 flex-1 pt-2">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Baton · rare find</p>
            <h2 className="font-heading text-xl leading-tight font-semibold">{theme.name}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{theme.about}</p>
          </div>
          <Button variant="ghost" size="icon-lg" aria-label="Close" className="-mr-2" onClick={closeBatonCard}>
            <X className="size-5" />
          </Button>
        </header>

        <div className="no-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pt-4 pb-4">
          <p className="flex items-center gap-1.5 text-sm">
            <MapPin className="size-4 shrink-0" />
            <span className="min-w-0 truncate">
              Resting at <span className="font-semibold">{place.name}</span>
            </span>
            <span className="ml-auto shrink-0 text-muted-foreground">
              {meters <= BATON_CONFIG.atSpotRadiusM
                ? 'You’re here'
                : `${formatKm(meters / 1000)} away${meters <= BATON_CONFIG.claimRadiusM ? ' · in reach' : ''}`}
            </span>
          </p>

          {/* The note is for whoever carries it next, so it stays sealed until you claim it */}
          <Block title="Note">
            {lastLeg?.carrier?.me && lastLeg.note ? (
              // Your own note isn't sealed from you
              <figure className="rounded-2xl bg-muted px-3.5 py-3">
                <figcaption className="text-xs text-muted-foreground">Your note for the next fan</figcaption>
                <blockquote className="mt-1 text-sm">“{lastLeg.note}”</blockquote>
              </figure>
            ) : lastLeg?.note ? (
              <div className="flex items-center gap-3 rounded-2xl bg-muted px-3.5 py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background">
                  <Lock className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{carrierLabel(lastLeg.carrier!)} left a note</p>
                  <p className="text-xs text-muted-foreground">Claim the baton to read it.</p>
                </div>
              </div>
            ) : lastLeg ? (
              <p className="text-sm text-muted-foreground">{carrierLabel(lastLeg.carrier!)} brought it here without a note.</p>
            ) : (
              <p className="text-sm text-muted-foreground">Nobody has carried it yet today. You could be first.</p>
            )}
          </Block>

          <Block title="Today’s journey" aside={`${baton.history.length} ${baton.history.length === 1 ? 'spot' : 'spots'}`}>
            <ol className="relative space-y-3 pl-6">
              <span aria-hidden className="absolute top-2 bottom-2 left-[7px] w-px bg-border" />
              {baton.history.map((leg, i) => {
                const now = i === baton.history.length - 1
                return (
                  <li key={`${leg.spot}-${i}`} className="relative">
                    <span
                      aria-hidden
                      className={cn(
                        'absolute top-1 -left-6 size-[15px] rounded-full border-2 border-foreground',
                        now ? 'bg-foreground' : 'bg-background',
                      )}
                    />
                    <p className="text-sm leading-tight font-medium">{placeById(leg.spot).name}</p>
                    <p className="text-xs text-muted-foreground">
                      {leg.carrier ? `${carrierLabel(leg.carrier)} · ${timeOfDay(leg.at)}` : 'Placed here this morning'}
                      {now && ' · resting here now'}
                    </p>
                  </li>
                )
              })}
            </ol>
          </Block>

          <p className="flex gap-2 rounded-2xl border px-3.5 py-3 text-sm">
            <Timer className="mt-0.5 size-4 shrink-0" />
            <span>
              Take it to <span className="font-semibold">another landmark within {BATON_CONFIG.carryMinutes / 60} hour</span> and
              leave a note for the next fan. If the hour runs out, it comes back here.
            </span>
          </p>
        </div>

        <footer className="shrink-0 border-t px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
          {block && block.reason !== 'gone' && (
            <p className="mb-2 text-center text-xs text-muted-foreground">
              {block.reason === 'carrying'
                ? 'You’re already carrying a baton.'
                : block.reason === 'droppedToday'
                ? 'You carried this one today. It’s someone else’s turn now.'
                : `Get within ${formatKm(BATON_CONFIG.claimRadiusM / 1000)} of ${place.name} to take it · ${formatKm(block.meters / 1000)} away`}
            </p>
          )}
          <div className="flex gap-2">
            <Button size="lg" variant="outline" className="flex-1" onClick={() => passBaton(baton.id)}>
              Pass
            </Button>
            <Button size="lg" className="flex-1" disabled={!!block} onClick={() => acceptBaton(baton.id)}>
              Accept
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}

function Block({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {aside && <span className="text-xs text-muted-foreground">{aside}</span>}
      </div>
      {children}
    </section>
  )
}
