import { useSyncExternalStore } from 'react'
import { EVENTS, PINS, TODAY, eventById, placeById, type GameEvent, type Pin, type Session } from '@/data/la28'
import { FAKE_USER_LOCATION, distance, travelFromYou, type LngLat } from '@/data/map-layers'
import { localMinute } from '@/lib/clock'
import type { MyPlan } from '@/lib/plans'

// A day built around a game ticket: what you already planned that day, the trip
// to the venue (leave by, doors), the game, and what comes after. Free time
// between them is a gap with one or two things that fit it and are on the way.

const EVENT_MINUTES = 90
const PIN_MINUTES = 45
// Doors open this long before the start
const DOORS_BEFORE = 60
// A gap needs this much room before it's worth filling
const MIN_GAP = 60
// The day starts here unless it's today, then it starts now
const DAY_START = '09:00'
const DAY_END = '23:30'

export type Suggestion =
  | { kind: 'event'; event: GameEvent; time: string }
  | { kind: 'pin'; pin: Pin; time: string; fromVenue: number }

export type Row =
  | { kind: 'plan'; key: string; time: string; end: string; title: string; where: string; tag: string; to?: string; placeId?: string; added?: boolean }
  | { kind: 'pin'; key: string; time: string; end: string; pin: Pin; added: true }
  | { kind: 'gap'; key: string; time: string; end: string; suggestions: Suggestion[] }
  | { kind: 'leave'; key: string; time: string; minutes: number; to: string }
  | { kind: 'doors'; key: string; time: string }
  | { kind: 'game'; key: string; time: string; end: string; session: Session }

// ---- Pins added from a gap (events go straight into My activities) ----

type PinStop = { date: string; pin: string; time: string }
let pinStops: PinStop[] = []
const listeners = new Set<() => void>()

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function usePinStops() {
  return useSyncExternalStore(subscribe, () => pinStops)
}

export function addPinStop(stop: PinStop) {
  pinStops = [...pinStops.filter((s) => !(s.date === stop.date && s.pin === stop.pin)), stop]
  listeners.forEach((l) => l())
}

export function removePinStop(date: string, pin: string) {
  pinStops = pinStops.filter((s) => !(s.date === date && s.pin === pin))
  listeners.forEach((l) => l())
}

export function resetDayPlan() {
  pinStops = []
  listeners.forEach((l) => l())
}

// ---- Building the day ----

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
const toHhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(Math.round(min) % 60).padStart(2, '0')}`
const coordsOf = (placeId: string): LngLat => {
  const p = placeById(placeId)
  return [p.lng, p.lat]
}
const transit = (from: LngLat, to: LngLat) => travelFromYou(to, from).transit

type Fixed = { key: string; start: number; end: number; coords: LngLat; row: Row }

export function buildDay(session: Session, plans: MyPlan[], stops: PinStop[], collected: readonly string[], nowMs: number): Row[] {
  const date = session.date
  const venue = coordsOf(session.venue)
  const start = toMin(session.start)
  const doors = start - DOORS_BEFORE
  const dayStart = date === TODAY ? Math.max(toMin(DAY_START), toMin(localMinute(nowMs).slice(11))) : toMin(DAY_START)

  // What's already planned that day, plus pins added from gaps
  const fixed: Fixed[] = [
    ...plans
      .filter((p) => p.date === date)
      .map((p): Fixed => {
        const e = eventById(p.id)
        const s = toMin(p.time)
        return {
          key: p.id,
          start: s,
          end: s + EVENT_MINUTES,
          coords: e ? coordsOf(e.place) : venue,
          row: { kind: 'plan', key: p.id, time: p.time, end: toHhmm(s + EVENT_MINUTES), title: p.title, where: p.where, tag: p.role === 'hosting' ? 'Hosting' : 'Going', to: e ? `/events/${e.id}` : undefined, placeId: e?.place },
        }
      }),
    ...stops
      .filter((s) => s.date === date)
      .map((s): Fixed => {
        const pin = PINS.find((p) => p.id === s.pin)!
        const t = toMin(s.time)
        return { key: s.pin, start: t, end: t + PIN_MINUTES, coords: coordsOf(pin.place), row: { kind: 'pin', key: s.pin, time: s.time, end: toHhmm(t + PIN_MINUTES), pin, added: true } }
      }),
  ].sort((a, b) => a.start - b.start)

  const before = fixed.filter((f) => f.start < doors)
  const after = fixed.filter((f) => f.start >= doors)
  const rows: Row[] = []
  const planned = new Set(fixed.map((f) => f.key))

  // Before the game: each planned stop, with a gap in front of it if there's room
  let cursor = dayStart
  let where: LngLat = FAKE_USER_LOCATION
  for (const f of before) {
    const gap = gapRow(date, cursor, f.start, f.start, f.coords, planned, collected)
    if (gap) rows.push(gap)
    rows.push(f.row)
    cursor = Math.max(cursor, f.end)
    where = f.coords
  }

  // Getting there: leave in time to reach the doors from the last stop
  const trip = transit(where, venue)
  const leave = doors - trip
  const gap = gapRow(date, cursor, leave, doors, venue, planned, collected, venue)
  if (gap) rows.push(gap)
  rows.push({ kind: 'leave', key: 'leave', time: toHhmm(leave), minutes: trip, to: placeById(session.venue).name })
  rows.push({ kind: 'doors', key: 'doors', time: toHhmm(doors) })
  rows.push({ kind: 'game', key: session.id, time: session.start, end: session.end, session })

  // After: what's planned, then anything else that night
  let late = toMin(session.end)
  for (const f of after) {
    rows.push(f.row)
    late = Math.max(late, f.end)
  }
  const afterGap = gapRow(date, late, toMin(DAY_END), toMin(DAY_END), venue, planned, collected)
  if (afterGap?.suggestions.some((s) => s.kind === 'event')) rows.push({ ...afterGap, suggestions: afterGap.suggestions.filter((s) => s.kind === 'event') })
  return rows
}

// Free time from `from` to `to` (minutes), with up to two things that fit:
// events that day that start in it and still get you to the next stop by
// `deadline`, and the closest pins you haven't collected near where you're headed.
function gapRow(
  date: string,
  from: number,
  to: number,
  deadline: number,
  next: LngLat,
  planned: Set<string>,
  collected: readonly string[],
  venue?: LngLat,
): Extract<Row, { kind: 'gap' }> | null {
  if (to - from < MIN_GAP) return null
  const events = EVENTS.filter((e) => e.date === date && e.type !== 'game' && !planned.has(e.id))
    .filter((e) => {
      const s = toMin(e.time)
      return s >= from && s + 45 + transit(coordsOf(e.place), next) <= deadline
    })
    .sort((a, b) => distance(coordsOf(a.place), next) - distance(coordsOf(b.place), next))
    .slice(0, 2)
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((event): Suggestion => ({ kind: 'event', event, time: event.time }))

  const pins =
    events.length < 2
      ? PINS.filter((p) => p.onMap && p.status !== 'locked' && !collected.includes(p.id) && !planned.has(p.id))
          .map((pin) => ({ pin, d: distance(coordsOf(pin.place), next), leg: transit(coordsOf(pin.place), next) }))
          .filter(({ d, leg }) => d * 111 < 10 && from + PIN_MINUTES + leg <= deadline)
          .sort((a, b) => a.d - b.d)
          .slice(0, 2 - events.length)
          .map(({ pin, leg }): Suggestion => ({ kind: 'pin', pin, time: toHhmm(Math.max(from, Math.floor((deadline - leg - PIN_MINUTES) / 15) * 15)), fromVenue: venue ? leg : 0 }))
      : []

  return { kind: 'gap', key: `gap-${from}`, time: toHhmm(from), end: toHhmm(to), suggestions: [...events, ...pins] }
}

export const minutesOf = toMin
