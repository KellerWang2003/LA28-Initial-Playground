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

// How far past the Games region the camera can still go, in km.
// Room to wander the counties around it, not a fence on the county line.
const ROAM_KM = 90

// Where LA28 happens in Southern California, as of the 2026 Games plan
// (la28.org venue list / Olympics.com): all of Los Angeles County, Catalina
// included, plus the adjacent cities outside the county that host sports.
// Anaheim (indoor volleyball) and San Clemente / Trestles (surfing), and the
// Orange County cities between those venues and Los Angeles. Oklahoma City
// and the out-of-state football cities are not on this map.
// Rings are simplified from the US Census county boundary and eased outward
// so the real coastline sits inside the line.
export const LA28_AREA_RINGS: LngLat[][] = [
  [
    [-118.9185, 34.8364], [-118.8878, 34.864], [-118.3303, 34.8733], [-117.6319, 34.8687],
    [-117.6221, 34.5979], [-117.5969, 34.3681], [-117.5872, 34.3147], [-117.6149, 34.1825],
    [-117.6657, 34.0224], [-117.6149, 33.9765], [-117.5998, 33.7793], [-117.5703, 33.515],
    [-117.5058, 33.3203], [-117.5805, 33.257], [-117.7445, 33.3347], [-117.8982, 33.4528],
    [-117.9891, 33.5724], [-118.0605, 33.6618], [-118.0862, 33.6944], [-118.1556, 33.7122],
    [-118.1666, 33.6709], [-118.2558, 33.6494], [-118.332, 33.6618], [-118.3752, 33.6845],
    [-118.4384, 33.6924], [-118.458, 33.727], [-118.4231, 33.7552], [-118.4235, 33.7939],
    [-118.4996, 33.9158], [-118.546, 33.9904], [-118.6068, 34.025], [-118.7327, 34.022],
    [-118.8118, 34.018], [-118.8693, 34.0002], [-118.9195, 34.0366], [-119.0092, 34.0486],
    [-119.0053, 34.0816], [-118.851, 34.1868], [-118.7265, 34.1916], [-118.7213, 34.2676],
    [-118.6833, 34.2752], [-118.6997, 34.3618],
  ],
  [
    [-118.6299, 33.4934], [-118.5679, 33.4936], [-118.4356, 33.4543], [-118.338, 33.4145],
    [-118.334, 33.3853], [-118.2797, 33.3239], [-118.3026, 33.2808], [-118.3514, 33.3005],
    [-118.4703, 33.2994], [-118.506, 33.3338], [-118.5121, 33.4383], [-118.5897, 33.4446],
  ],
]

// [[west, south], [east, north]]. Wide of the Games region, so you can travel
// around it — Ventura, the Inland Empire, toward San Diego — and still collect.
export const MAP_LIMIT: [LngLat, LngLat] = (() => {
  let west = Infinity
  let east = -Infinity
  let south = Infinity
  let north = -Infinity
  for (const ring of LA28_AREA_RINGS) {
    for (const [lng, lat] of ring) {
      west = Math.min(west, lng)
      east = Math.max(east, lng)
      south = Math.min(south, lat)
      north = Math.max(north, lat)
    }
  }
  const midLat = (south + north) / 2
  const latPad = ROAM_KM / 111
  const lngPad = ROAM_KM / (111 * Math.cos((midLat * Math.PI) / 180))
  return [
    [west - lngPad, south - latPad],
    [east + lngPad, north + latPad],
  ]
})()

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

// Mocked travel times from you, in minutes, from straight-line distance:
// a detour factor for streets, then rough speeds plus waiting/parking time.
export function travelFromYou(to: LngLat) {
  const km = distance(FAKE_USER_LOCATION, to) * 111
  const route = km * 1.3
  return {
    km,
    walk: Math.max(1, Math.round((route / 5) * 60)),
    transit: Math.round(8 + (route / 18) * 60),
    drive: Math.round(4 + (route / 28) * 60),
  }
}

// 0.43 -> '450 m', 3.21 -> '3.2 km'
export const formatKm = (km: number) => (km < 1 ? `${Math.max(50, Math.round(km * 20) * 50)} m` : `${km.toFixed(1)} km`)

// 12 -> '12 min', 95 -> '1 h 35 min'
export const formatMinutes = (min: number) => (min < 60 ? `${min} min` : `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}`)
