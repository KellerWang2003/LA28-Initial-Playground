import { useRef, useState } from 'react'
import { matchPath, useLocation } from 'react-router'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MapView, UserDot, type MapPadding, type MapViewHandle } from '@/components/map-view'
import { BatonBody } from '@/components/baton-art'
import { Control, Segmented } from '@/components/debug-panel'
import { NEAR_M, fanCoords, metersBetween, moveFan, placeCoords, teleportFan, useFanAt, type FanAt } from '@/lib/location'
import { useBatons } from '@/lib/batons'
import { cn } from '@/lib/utils'
import { themeById } from '@/data/batons'
import { COLLECT_RADIUS_M, PLACES, eventById, pinById, placeById, type PlaceType } from '@/data/la28'
import { FAKE_USER_LOCATION, formatKm, type LngLat } from '@/data/map-layers'

export const selectClass = 'h-9 w-full min-w-0 rounded-xl bg-muted px-2 text-xs font-medium'

const PAD: MapPadding = { top: 32, bottom: 32, left: 32, right: 32 }
const ME = 'me'
const PLACE = 'place:'
const BATON = 'baton:'

const groups: { type: PlaceType; label: string }[] = [
  { type: 'attraction', label: 'Attractions' },
  { type: 'venue', label: 'Venues' },
  { type: 'shop', label: 'Local shops' },
  { type: 'public', label: 'Public spaces' },
]
const placesOf = (type: PlaceType) => PLACES.filter((p) => p.type === type).sort((a, b) => a.name.localeCompare(b.name))

// The place the current screen is about (a pin, an event, a place page), if any
function useScreenPlace() {
  const { pathname } = useLocation()
  const pin = matchPath('/explore/pins/:id/*', pathname)?.params.id
  if (pin) return pinById(pin)?.place ?? null
  const event = matchPath('/events/:id', pathname)?.params.id
  if (event) return eventById(event)?.place ?? null
  return matchPath('/places/:id', pathname)?.params.id ?? null
}

// 'Union Station', '2.5 km from Union Station', '600 m from Grand Park'
function describe(fan: FanAt) {
  if (!fan) return 'Downtown hotel'
  if (fan.place) return fan.near ? `${formatKm(NEAR_M / 1000)} from ${placeById(fan.place).name}` : placeById(fan.place).name
  const nearest = PLACES.map((p) => ({ p, m: metersBetween(fan.coords, [p.lng, p.lat]) })).sort((a, b) => a.m - b.m)[0]
  return nearest.m <= COLLECT_RADIUS_M ? `At ${nearest.p.name}` : `${formatKm(nearest.m / 1000)} from ${nearest.p.name}`
}

// Prototype only: where the fan stands, for everything that cares (pins,
// batons, distances). Tap the map anywhere, tap a place, or pick from the list.
export function WhereControls() {
  const fan = useFanAt()
  const batons = useBatons()
  const resting = batons.filter((b) => b.state === 'resting')
  const screenPlace = useScreenPlace()
  const mapRef = useRef<MapViewHandle>(null)
  const [initialBounds] = useState<LngLat[]>(() => [...PLACES.map((p): LngLat => [p.lng, p.lat]), fanCoords(fan)])

  function goTo(place: string | null, near = false) {
    moveFan(place ? { place, near } : null)
    mapRef.current?.flyTo(place ? placeCoords(place) : FAKE_USER_LOCATION, PAD)
  }

  const markers = [
    ...PLACES.map((p) => ({ id: PLACE + p.id, coords: [p.lng, p.lat] as LngLat })),
    ...resting.map((b) => ({ id: BATON + b.id, coords: placeCoords(b.spot), offset: [12, -12] as [number, number] })),
    { id: ME, coords: fanCoords(fan) },
  ]

  function renderMarker(id: string) {
    if (id === ME) return <UserDot />
    if (id.startsWith(BATON)) {
      const baton = resting.find((b) => BATON + b.id === id)
      return baton ? (
        <span title={`${themeById(baton.theme).name} · ${placeById(baton.spot).name}`} className="flex cursor-pointer p-1">
          <BatonBody shape={themeById(baton.theme).shape} className="h-5 w-2 ring-1" />
        </span>
      ) : null
    }
    const place = placeById(id.slice(PLACE.length))
    const on = fan?.place === place.id
    return (
      <span title={place.name} className="flex cursor-pointer p-1.5">
        <span className={cn('block rounded-full border border-background bg-foreground/60', on ? 'size-3.5 bg-foreground' : 'size-2.5')} />
      </span>
    )
  }

  function onMarkerClick(id: string) {
    if (id.startsWith(PLACE)) goTo(id.slice(PLACE.length))
    else if (id.startsWith(BATON)) {
      const baton = resting.find((b) => BATON + b.id === id)
      if (baton) goTo(baton.spot)
    }
  }

  return (
    <div className="space-y-3">
      <Control label="Location" aside={describe(fan)}>
        <div className="relative h-52 overflow-hidden rounded-2xl border">
          <MapView
            ref={mapRef}
            markers={markers}
            renderMarker={renderMarker}
            onMarkerClick={onMarkerClick}
            onBackgroundClick={teleportFan}
            initialBounds={initialBounds}
            initialPadding={PAD}
          />
          <p className="pointer-events-none absolute right-2 bottom-2 rounded-full bg-background/90 px-2 py-0.5 text-[11px] text-muted-foreground shadow-sm">
            Tap to stand there
          </p>
        </div>
      </Control>

      {screenPlace && fan?.place !== screenPlace && (
        <Button size="sm" variant="outline" className="w-full" onClick={() => goTo(screenPlace)}>
          <MapPin data-icon="inline-start" />
          Stand at {placeById(screenPlace).name}
        </Button>
      )}

      <div className="flex gap-1.5">
        <select
          aria-label="Go to a place"
          className={selectClass}
          value={fan ? (fan.place ?? 'point') : ''}
          onChange={(e) => goTo(e.target.value || null, fan?.near)}
        >
          <option value="">Downtown hotel (start)</option>
          {fan && !fan.place && (
            <option value="point" disabled>
              A spot on the map
            </option>
          )}
          {resting.length > 0 && (
            <optgroup label="Batons resting">
              {resting.map((b) => (
                <option key={b.id} value={b.spot}>
                  {placeById(b.spot).name} · {themeById(b.theme).name}
                </option>
              ))}
            </optgroup>
          )}
          {groups.map((g) => (
            <optgroup key={g.type} label={g.label}>
              {placesOf(g.type).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {fan?.place && (
          <div className="w-36 shrink-0">
            <Segmented
              value={fan.near}
              options={[
                { value: false, label: 'At' },
                { value: true, label: formatKm(NEAR_M / 1000) },
              ]}
              onChange={(near) => fan.place && moveFan({ place: fan.place, near })}
            />
          </div>
        )}
      </div>
    </div>
  )
}
