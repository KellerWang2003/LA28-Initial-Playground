// Turns the LA28 mock data into map layers, one per filter pill on Explore.
import {
  CREW,
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
  pinById,
  placeById,
  sessionById,
  sessionLine,
  type Pin,
  type Place,
  type Session,
  type Shape,
} from '@/data/la28'
import { people } from '@/data/mock'

export type LngLat = [number, number]

export type Layer = 'pins' | 'events' | 'games' | 'watch' | 'shops' | 'people' | 'saved'

export const layers: { id: Layer; label: string }[] = [
  { id: 'pins', label: 'Pins' },
  { id: 'events', label: 'Events' },
  { id: 'games', label: 'Games' },
  { id: 'watch', label: 'Watch parties' },
  { id: 'shops', label: 'Local shops' },
  { id: 'people', label: 'People' },
  { id: 'saved', label: 'Saved' },
]

export type ItemKind = 'pin' | 'event' | 'game' | 'watch' | 'shop' | 'person'

export type MapItem = {
  id: string
  kind: ItemKind
  layer: Layer
  // Groups the sheet list within a layer (Watch parties: Public / Fan-hosted)
  section?: string
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
  // Extra lines on the card (a venue's upcoming games)
  lines?: string[]
  // What the marker is shaped like (people show an avatar instead)
  shape?: Shape
  // Venues: drawn as the venue's outline
  venue?: string
  // Line under the label (sport, host…) and a live timer when something is on
  subtitle?: string
  liveSince?: string
  // Collectible pin on the map (attractions only)
  pin?: Pin
  // Pin you earn by going (events, games, shops); not drawn on the map
  reward?: Pin
  // Where tapping the card goes (pins: the pin's detail page)
  to: string
}

// Fake "current location" (near a downtown hotel) since location is simulated
export const FAKE_USER_LOCATION: LngLat = [-118.2585, 34.0451]

const coordsOf = (p: Place): LngLat => [p.lng, p.lat]
const sessionStart = (s: Session) => `${s.date}T${s.start}`

function activityLine(placeId: string) {
  const a = activityAt(placeId)
  return a ? `${a.headingThere} heading there · ${a.level[0].toUpperCase()}${a.level.slice(1)}` : undefined
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

// Pins: tourist attractions only
const pinsLayer = PINS.filter((p) => p.onMap).map((pin): MapItem => {
  const place = placeById(pin.place)
  return {
    id: pin.id,
    kind: 'pin',
    layer: 'pins',
    title: pin.name,
    label: pin.name.replace(/ Pin$/, ''),
    place,
    coords: coordsOf(place),
    status: pin.label,
    meta: activityLine(place.id),
    pin,
    shape: pin.shape,
    to: `/explore/pins/${pin.id}`,
  }
})

// Events: official and sponsored only (games and fan-hosted have their own pills)
const eventsLayer = EVENTS.filter((e) => e.type === 'official' || e.type === 'sponsored').map((e): MapItem => {
  const place = placeById(e.place)
  return {
    id: e.id,
    kind: 'event',
    layer: 'events',
    title: e.title,
    label: e.title,
    subtitle: e.type === 'official' ? 'Official LA28' : 'Sponsored',
    place,
    coords: coordsOf(place),
    status: `${formatDate(e.date)} · ${formatTime(e.time)}`,
    meta: eventAttendance(e),
    shape: eventShape(e),
    reward: e.pin ? pinById(e.pin) : undefined,
    to: `/events/${e.id}`,
  }
})

// Games: one marker per venue, showing what's live there or what's next
const gamesLayer = PLACES.filter((p) => p.type === 'venue').map((venue): MapItem => {
  const sessions = SCHEDULE.filter((s) => s.venue === venue.id).sort((a, b) => sessionStart(a).localeCompare(sessionStart(b)))
  const live = sessions.find((s) => s.status === 'live')
  const upcoming = sessions.filter((s) => s.status === 'upcoming')
  const current = live ?? upcoming[0]
  const later = live ? upcoming : upcoming.slice(1)
  return {
    id: `venue_${venue.id}`,
    kind: 'game',
    layer: 'games',
    title: venue.name,
    label: venue.name,
    venue: venue.id,
    shape: SPORT_SHAPE[current.sport],
    subtitle: live ? `${live.sport} · ${live.title}` : `${current.sport} · ${formatDate(current.date)}, ${formatTime(current.start)}`,
    liveSince: live ? sessionStart(live) : undefined,
    place: venue,
    coords: coordsOf(venue),
    status: live ? sessionLine(live) : `Next: ${current.title}`,
    meta: current.fansOnApp ? `${current.fansOnApp.toLocaleString()} fans on the app` : undefined,
    lines: later.slice(0, 2).map((s) => `${formatDate(s.date)}, ${formatTime(s.start)} · ${s.title}`),
    reward: current.pin ? pinById(current.pin) : undefined,
    to: '/sports',
  }
})

// Watch parties: public screenings, then fan-hosted gatherings
const publicWatch = WATCH_SPOTS.map((w): MapItem => {
  const place = placeById(w.place)
  const s = sessionById(w.session)!
  return {
    id: `w_${w.place}`,
    kind: 'watch',
    layer: 'watch',
    section: 'Public',
    title: `${s.sport}: ${s.title}`,
    label: place.name,
    subtitle: `${s.sport} · ${w.official ? 'Official screening' : 'Public watch party'}`,
    liveSince: s.status === 'live' ? sessionStart(s) : undefined,
    place,
    coords: coordsOf(place),
    status: [`${w.screens} ${w.screens === 1 ? 'screen' : 'screens'}`, w.note].filter(Boolean).join(' · '),
    meta: `Crowd: ${w.crowdCountries.join(', ')}`,
    shape: 'tv',
    to: '/sports',
  }
})

const fanHosted = EVENTS.filter((e) => e.type === 'fan').map((e): MapItem => {
  const place = placeById(e.place)
  return {
    id: e.id,
    kind: 'watch',
    layer: 'watch',
    section: 'Fan-hosted',
    title: e.title,
    label: e.title,
    subtitle: `Hosted by ${flag(e.host!.cc)} ${e.host!.name}`,
    place,
    coords: coordsOf(place),
    status: `${formatDate(e.date)} · ${formatTime(e.time)}`,
    meta: eventAttendance(e),
    shape: eventShape(e),
    reward: e.pin ? pinById(e.pin) : undefined,
    to: `/events/${e.id}`,
  }
})

const shopsLayer = PLACES.filter((p) => p.type === 'shop').map((p): MapItem => ({
  id: `shop_${p.id}`,
  kind: 'shop',
  layer: 'shops',
  title: p.name,
  label: p.name,
  reward: p.pins?.[0] ? pinById(p.pins[0]) : undefined,
  place: p,
  coords: coordsOf(p),
  status: p.perk!,
  meta: p.hostsGatherings ? `Hosts gatherings up to ${p.capacity}` : `Run by ${p.owner}`,
  shape: PLACE_SHAPE[p.id],
  to: `/places/${p.id}`,
}))

// People: crew who share their location with you
const peopleLayer = CREW.filter((c) => c.sharing && c.near).map((c): MapItem => {
  const place = placeById(c.near!)
  const person = people.find((p) => p.name === c.name)
  return {
    id: `person_${c.name}`,
    kind: 'person',
    layer: 'people',
    title: `${flag(c.cc)} ${c.name}`,
    label: c.name,
    place,
    coords: coordsOf(place),
    status: `Updated ${c.updated}`,
    to: person ? `/people/${person.id}` : '/people',
  }
})

export const mapLayers: Record<Layer, MapItem[]> = {
  pins: spread(pinsLayer),
  events: spread(eventsLayer),
  games: spread(gamesLayer),
  watch: spread([...publicWatch, ...fanHosted]),
  shops: spread(shopsLayer),
  people: spread(peopleLayer),
  saved: [],
}

// Every item once, for search
export const allItems: MapItem[] = Object.values(mapLayers).flat()

// Rough distance for sorting "nearby"; fine at city scale
export function distance(a: LngLat, b: LngLat) {
  const dx = (a[0] - b[0]) * Math.cos((a[1] * Math.PI) / 180)
  const dy = a[1] - b[1]
  return Math.sqrt(dx * dx + dy * dy)
}
