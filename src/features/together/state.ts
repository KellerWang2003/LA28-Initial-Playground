import { useSyncExternalStore } from 'react'

// Collecting a pin together with someone at the spot: who it was, when, and how the stamp
// landed. Plus two bits of hand-off state for the moment after: the pin flying into the
// Passport button, and the stamp still to ink onto its Passport page.
// In-memory only, like the rest of the demo: a reload resets it.

export type CoStamp = {
  pinId: string
  // The other person, as they sign: a first name and a flag
  name: string
  flag: string
  // App time (ms) of the stamp
  at: number
  // The stamp lands a little crooked, the same way every time it's shown
  tilt: number
  // One-tap reactions swapped right after
  sent?: string
  got?: string
  // They took the photo together (the collecting photo)
  photo: boolean
}

// Collected before today with Kenji, matching the seeded Together mark on the pier
const SEED: Record<string, CoStamp> = {
  p_pier: { pinId: 'p_pier', name: 'Kenji', flag: '🇯🇵', at: Date.parse('2028-07-18T18:40'), tilt: -5, sent: '🙌', got: '🇯🇵', photo: true },
}

type State = {
  stamps: Record<string, CoStamp>
  // A pin in the air on its way to the Passport button
  flight: { pinId: string; key: number } | null
  // Landings so far: the Passport button bounces on each new one
  landed: number
  // Pins stamped but not yet seen in the Passport: the button shows a dot, the page inks it in
  fresh: string[]
}

let state: State = { stamps: { ...SEED }, flight: null, landed: 0, fresh: [] }
const listeners = new Set<() => void>()
let flightKey = 0

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function update(next: Partial<State>) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}

export const useCoStamps = () => useSyncExternalStore(subscribe, () => state.stamps)
export const useFlight = () => useSyncExternalStore(subscribe, () => state.flight)
export const useLanded = () => useSyncExternalStore(subscribe, () => state.landed)
export const useFresh = () => useSyncExternalStore(subscribe, () => state.fresh)
export const getCoStamp = (pinId: string) => state.stamps[pinId]

export function addCoStamp(stamp: CoStamp) {
  update({ stamps: { ...state.stamps, [stamp.pinId]: stamp } })
}

export function reactCoStamp(pinId: string, patch: Pick<CoStamp, 'sent'> | Pick<CoStamp, 'got'>) {
  const s = state.stamps[pinId]
  if (s) update({ stamps: { ...state.stamps, [pinId]: { ...s, ...patch } } })
}

// Send a just-collected pin flying into the Passport button (on the map), and mark it fresh
export function startFlight(pinId: string) {
  update({ flight: { pinId, key: ++flightKey }, fresh: state.fresh.includes(pinId) ? state.fresh : [...state.fresh, pinId] })
}

export function landFlight() {
  update({ flight: null, landed: state.landed + 1 })
}

// Its stamp was inked onto the page: no longer new
export function seenFresh(pinId: string) {
  if (state.fresh.includes(pinId)) update({ fresh: state.fresh.filter((p) => p !== pinId) })
}

// Debug: replay a pin's together collect
export function clearCoStamp(pinId: string) {
  if (!(pinId in state.stamps)) return
  update({ stamps: Object.fromEntries(Object.entries(state.stamps).filter(([k]) => k !== pinId)) })
}

export function resetTogether() {
  update({ stamps: { ...SEED }, flight: null, landed: 0, fresh: [] })
}

// A little crooked, never the same twice
export const randomTilt = () => Math.round((Math.random() * 2 - 1) * 8)

// Phones that can buzz do (Android). iOS web has no vibration, so the visuals carry it.
export function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Not allowed here: fine, it's only a nicety
  }
}

// Opening the Passport straight from the collect: no flight, but the page still inks it in
export function markFresh(pinId: string) {
  if (!state.fresh.includes(pinId)) update({ fresh: [...state.fresh, pinId] })
}

// Day of a stamp, the way a passport stamp prints it
export function stampDate(ms: number) {
  const d = new Date(ms)
  return `${d.getDate()} ${d.toLocaleString('en', { month: 'short' }).toUpperCase()} ${d.getFullYear()}`
}
