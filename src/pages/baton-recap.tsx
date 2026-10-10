import { useEffect, useState, type UIEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { RotateCcw, X } from 'lucide-react'
import { MapView, type MapPadding } from '@/components/map-view'
import { BatonArt } from '@/components/baton-art'
import { Button } from '@/components/ui/button'
import { placeCoords } from '@/lib/location'
import { carrierLabel, carrierName, saveRecaps, timeOfDay, useBatonLog, usePendingRecaps, type Recap } from '@/lib/batons'
import { cn } from '@/lib/utils'
import { themeById } from '@/data/batons'
import { placeById } from '@/data/la28'
import type { LngLat } from '@/data/map-layers'

// Time between spots in the playback
const STEP_MS = 1100
const MAP_PADDING: MapPadding = { top: 36, bottom: 36, left: 36, right: 36 }

// End-of-day recap: where each baton the fan carried went today. The map only
// ever shows the spots it rested at, one after another; never a route.
// ?entry= replays one saved in Passport; otherwise it shows tonight's recaps.
export default function BatonRecapPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const pending = usePendingRecaps()
  const log = useBatonLog()
  const entryId = params.get('entry')
  const replay = entryId ? log.find((e) => e.id === entryId)?.recap ?? null : null
  // Kept from the first render: closing clears the pending list on the way out
  const [recaps] = useState<Recap[]>(() => (replay ? [replay] : pending))
  const [page, setPage] = useState(0)

  if (!recaps.length) return <Navigate to="/passport?section=batons" replace />

  function close() {
    if (replay) return navigate(-1)
    saveRecaps()
    navigate('/passport?section=batons', { replace: true })
  }

  function onScroll(e: UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    setPage(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Close" onClick={close}>
          <X className="size-5" />
        </Button>
        <h1 className="font-heading text-lg font-semibold">{replay ? 'Baton recap' : 'Tonight’s baton recap'}</h1>
        {recaps.length > 1 && (
          <span className="ml-auto flex gap-1.5 pr-3" aria-label={`Recap ${page + 1} of ${recaps.length}`}>
            {recaps.map((r, i) => (
              <span key={r.id} className={cn('size-1.5 rounded-full', i === page ? 'bg-foreground' : 'bg-muted-foreground/30')} />
            ))}
          </span>
        )}
      </header>

      {/* One page per baton; swipe between them */}
      <div onScroll={onScroll} className="no-scrollbar flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain">
        {recaps.map((r, i) => (
          <RecapPage key={r.id} recap={r} active={i === page} />
        ))}
      </div>
    </div>
  )
}

function RecapPage({ recap, active }: { recap: Recap; active: boolean }) {
  const theme = themeById(recap.theme)
  const [step, setStep] = useState(0)
  const legs = recap.legs
  const carriers = legs.filter((l) => l.carrier)
  const countries = new Set(carriers.map((l) => l.carrier!.cc)).size
  const spots = new Set(legs.map((l) => l.spot)).size

  // Play the spots in order while this page is showing
  useEffect(() => {
    if (!active || step >= legs.length) return
    const timer = window.setTimeout(() => setStep((s) => s + 1), step === 0 ? 500 : STEP_MS)
    return () => window.clearTimeout(timer)
  }, [active, step, legs.length])

  const coords = legs.map((l) => placeCoords(l.spot))
  const [lng, lat] = coords[0]
  // Pad so a single spot still frames a neighborhood
  const bounds: LngLat[] = [...coords, [lng - 0.01, lat - 0.01], [lng + 0.01, lat + 0.01]]
  const markers = legs.slice(0, step).map((l, i) => ({ id: `leg-${i}`, coords: placeCoords(l.spot) }))

  return (
    <article className="no-scrollbar w-full shrink-0 snap-center overflow-y-auto overscroll-contain px-4 pb-[max(env(safe-area-inset-bottom),24px)]">
      <div className="flex items-center gap-3">
        <BatonArt theme={recap.theme} className="-my-2 size-16 shrink-0" />
        <div className="min-w-0">
          <h2 className="font-heading text-xl leading-tight font-semibold">{theme.name}</h2>
          <p className="text-sm text-muted-foreground">
            {new Date(`${recap.dayKey}T12:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="relative mt-4 h-[36dvh] overflow-hidden rounded-3xl border">
        {active ? (
          <MapView
            markers={markers}
            renderMarker={(id) => {
              const i = Number(id.slice(4))
              return <LegMarker n={i + 1} mine={!!legs[i].carrier?.me} current={i === step - 1} />
            }}
            initialBounds={bounds}
            initialPadding={MAP_PADDING}
            interactive={false}
          />
        ) : (
          <div className="size-full bg-muted" />
        )}
        <Button
          variant="outline"
          size="sm"
          className="absolute right-3 bottom-3 rounded-full bg-background shadow-md"
          onClick={() => setStep(0)}
          disabled={step < legs.length}
        >
          <RotateCcw data-icon="inline-start" />
          Replay
        </Button>
      </div>

      <p className="mt-4 text-sm">
        <span className="font-semibold">{carriers.length}</span> carriers ·{' '}
        <span className="font-semibold">{countries}</span> {countries === 1 ? 'country' : 'countries'} ·{' '}
        <span className="font-semibold">{spots}</span> spots
      </p>

      <ol className="mt-3 space-y-1">
        {legs.map((leg, i) => {
          const mine = !!leg.carrier?.me
          return (
            <li
              key={i}
              className={cn(
                'flex gap-3 rounded-2xl px-3 py-2.5 transition-opacity duration-500',
                mine && 'bg-muted',
                i >= step && 'opacity-30',
              )}
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-foreground text-[11px] font-bold',
                  mine ? 'bg-foreground text-background' : 'bg-background',
                )}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold">{placeById(leg.spot).name}</p>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{leg.carrier ? timeOfDay(leg.at) : 'Morning'}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {leg.carrier
                    ? `${carrierLabel(leg.carrier)}${mine && leg.carrier.anonymous ? ` · shown as ${carrierName(leg.carrier)}` : ''}`
                    : 'Placed here to start the day'}
                </p>
                {leg.note && <p className="mt-1 text-sm">“{leg.note}”</p>}
              </div>
            </li>
          )
        })}
      </ol>
    </article>
  )
}

function LegMarker({ n, mine, current }: { n: number; mine: boolean; current: boolean }) {
  return (
    <span
      className={cn(
        'flex size-7 animate-pin-pop items-center justify-center rounded-full border-2 border-foreground text-xs font-bold shadow-md transition-transform',
        mine ? 'bg-foreground text-background' : 'bg-background',
        current && 'scale-125',
      )}
    >
      {n}
    </span>
  )
}
