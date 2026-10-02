// Turns the LA28 mock data into map layers, one per filter pill on Explore.
import {
  CREW,
  DROPS,
  EVENTS,
  PINS,
  PLACES,
  PLACE_SHAPE,
  SCHEDULE,
  SPORT_SHAPE,
  WATCH_SPOTS,
  activityAt,
  eventAttendance,
  eventShape,
  flag,
  formatDate,
  formatTime,
  placeById,
  sessionById,
  sessionLine,
  type Pin,
  type Place,
  type Shape,
} from '@/data/la28'
import { people } from '@/data/mock'

export type LngLat = [number, number]

export type Layer = 'pins' | 'drops' | 'events' | 'live' | 'watch' | 'shops' | 'crew' | 'saved'

export const layers: { id: Layer; label: string }[] = [
  { id: 'pins', label: 'Pins' },
  { id: 'drops', label: 'Drops' },
  { id: 'events', label: 'Events' },
  { id: 'live', label: 'Live now' },
  { id: 'watch', label: 'Watch spots' },
  { id: 'shops', label: 'Local shops' },
  { id: 'crew', label: 'Crew' },
  { id: 'saved', label: 'Saved' },
]

export type ItemKind = 'pin' | 'event' | 'live' | 'watch' | 'shop' | 'crew'

export type MapItem = {
  id: string
  kind: ItemKind
  layer: Layer
  title: string
  // Short name shown under the marker
  label: string
  place: Place
  coords: LngLat
  // Pixel shift so items at the same place don't stack exactly
  offset?: [number, number]
  // First badge on the card (time, status, perk…) and an optional second one
  status: string
  meta?: string
  // What the marker is shaped like (crew show an avatar instead)
  shape?: Shape
  pin?: Pin
  // Primary card button
  action: { label: string; to: string }
}

// Fake "current location" (near a downtown hotel) since location is simulated
export const FAKE_USER_LOCATION: LngLat = [-118.2585, 34.0451]

const coordsOf = (p: Place): LngLat => [p.lng, p.lat]

function activityLine(placeId: string) {
  const a = activityAt(placeId)
  return a ? `${a.headingThere} heading there · ${a.level[0].toUpperCase()}${a.level.slice(1)}` : undefined
}

function pinItem(pin: Pin, layer: Layer): MapItem {
  const place = placeById(pin.place)
  const session = SCHEDULE.find((s) => s.pin === pin.id && s.status === 'live')
  const drop = DROPS.find((d) => d.id === pin.id)
  const meta =
    layer === 'drops' && drop
      ? drop.need === 'surprise'
        ? 'Surprise challenge'
        : `Needs ${drop.need} people together`
      : session?.fansOnApp
        ? `${session.fansOnApp.toLocaleString()} fans on the app`
        : activityLine(place.id)
  return {
    id: pin.id,
    kind: 'pin',
    layer,
    title: pin.name,
    label: pin.name.replace(/ Pin$/, ''),
    place,
    coords: coordsOf(place),
    status: pin.label,
    meta,
    pin,
    shape: pin.shape,
    action: { label: "I'm here", to: `/explore/pins/${pin.id}` },
  }
}

// Spread items that share a place side by side
function spread(items: MapItem[]) {
  const seen = new Map<string, number>()
  return items.map((item) => {
    const n = seen.get(item.place.id) ?? 0
    seen.set(item.place.id, n + 1)
    return n ? { ...item, offset: [n * 34, 0] as [number, number] } : item
  })
}

const pinsLayer = PINS.filter((p) => p.onMap).map((p) => pinItem(p, 'pins'))

const dropsLayer = PINS.filter((p) => p.kind === 'drop').map((p) => pinItem(p, 'drops'))

const eventsLayer = EVENTS.map((e): MapItem => {
  const place = placeById(e.place)
  return {
    id: e.id,
    kind: 'event',
    layer: 'events',
    title: e.title,
    label: e.title,
    place,
    coords: coordsOf(place),
    status: `${formatDate(e.date)} · ${formatTime(e.time)}`,
    meta: eventAttendance(e),
    shape: eventShape(e),
    action: { label: 'Details', to: `/events/${e.id}` },
  }
})

const liveLayer = SCHEDULE.filter((s) => s.status === 'live').map((s): MapItem => {
  const place = placeById(s.venue)
  return {
    id: s.id,
    kind: 'live',
    layer: 'live',
    title: `${s.sport}: ${s.title}`,
    label: s.sport,
    place,
    coords: coordsOf(place),
    status: sessionLine(s),
    meta: s.fansOnApp ? `${s.fansOnApp.toLocaleString()} fans on the app` : undefined,
    shape: SPORT_SHAPE[s.sport],
    action: { label: 'Details', to: '/sports' },
  }
})

const watchLayer = WATCH_SPOTS.map((w): MapItem => {
  const place = placeById(w.place)
  const s = sessionById(w.session)!
  return {
    id: `w_${w.place}`,
    kind: 'watch',
    layer: 'watch',
    title: `${s.sport}: ${s.title}`,
    label: place.name,
    place,
    coords: coordsOf(place),
    status: [`${w.screens} ${w.screens === 1 ? 'screen' : 'screens'}`, w.official && 'Official', w.note].filter(Boolean).join(' · '),
    meta: `Crowd: ${w.crowdCountries.join(', ')}`,
    shape: 'tv',
    action: { label: 'Details', to: '/sports' },
  }
})

const shopsLayer = PLACES.filter((p) => p.type === 'shop').map((p): MapItem => ({
  id: `shop_${p.id}`,
  kind: 'shop',
  layer: 'shops',
  title: p.name,
  label: p.name,
  place: p,
  coords: coordsOf(p),
  status: p.perk!,
  meta: p.hostsGatherings ? `Hosts gatherings up to ${p.capacity}` : `Run by ${p.owner}`,
  shape: PLACE_SHAPE[p.id],
  action: { label: 'Details', to: `/places/${p.id}` },
}))

const crewLayer = CREW.filter((c) => c.sharing && c.near).map((c): MapItem => {
  const place = placeById(c.near!)
  const person = people.find((p) => p.name === c.name)
  return {
    id: `crew_${c.name}`,
    kind: 'crew',
    layer: 'crew',
    title: `${flag(c.cc)} ${c.name}`,
    label: c.name,
    place,
    coords: coordsOf(place),
    status: `Updated ${c.updated}`,
    action: { label: 'Message', to: person ? `/people/${person.id}` : '/people' },
  }
})

export const mapLayers: Record<Layer, MapItem[]> = {
  pins: spread(pinsLayer),
  drops: spread(dropsLayer),
  events: spread(eventsLayer),
  live: spread(liveLayer),
  watch: spread(watchLayer),
  shops: spread(shopsLayer),
  crew: spread(crewLayer),
  saved: [],
}

// Every item once, for search (pins win over the same pin in Drops)
export const allItems: MapItem[] = Object.values(mapLayers)
  .flat()
  .filter((item, i, all) => all.findIndex((other) => other.id === item.id) === i)

// Rough distance for sorting "nearby"; fine at city scale
export function distance(a: LngLat, b: LngLat) {
  const dx = (a[0] - b[0]) * Math.cos((a[1] * Math.PI) / 180)
  const dy = a[1] - b[1]
  return Math.sqrt(dx * dx + dy * dy)
}
