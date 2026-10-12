import { useSyncExternalStore } from 'react'

// Prototype-only switches for testing from a desk. In-memory: a reload resets them.
// Where the fan stands lives in lib/location.ts; when it is, here.

// Moments worth jumping to. null is the mock's NOW (Thu 7:20 PM).
export const CLOCK_STOPS: { time: string | null; label: string }[] = [
  { time: null, label: 'Thu 7:20 PM · Start' },
  { time: '2028-07-20T19:40', label: 'Thu 7:40 PM · City lights open' },
  { time: '2028-07-20T19:55', label: 'Thu 7:55 PM · Sunset' },
  { time: '2028-07-20T20:05', label: 'Thu 8:05 PM · Athletics live' },
  { time: '2028-07-20T20:30', label: 'Thu 8:30 PM · Sunset over' },
  { time: '2028-07-20T21:55', label: 'Thu 9:55 PM · Before the baton recap' },
  { time: '2028-07-21T09:00', label: 'Fri 9:00 AM · Next morning' },
  { time: '2028-07-22T06:30', label: 'Sat 6:30 AM · Sunrise' },
  { time: '2028-07-22T14:10', label: 'Sat 2:10 PM · Brazil vs Japan live' },
]

// 'schedule' follows each venue's session times; the others force every venue
export type VenueGame = 'schedule' | 'before' | 'live' | 'ended'

export type DebugState = {
  // Clock jumped to this time at `jumpedAt` (ms), then runs on
  time: string | null
  jumpedAt: number
  venueGame: VenueGame
  // Other people who join a Together challenge
  others: number
  // How fast the clock runs (1x, 10x, 60x). A speed change re-anchors the
  // clock at `warp` (real ms -> app ms) so time never jumps.
  speed: number
  warp: { real: number; app: number } | null
}

const initial: DebugState = { time: null, jumpedAt: 0, venueGame: 'schedule', others: 1, speed: 1, warp: null }

let state = initial
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useDebug() {
  return useSyncExternalStore(subscribe, () => state)
}

export function getDebug() {
  return state
}

// A new `time` always re-anchors, even to the same value, so jumping back to a
// time you already set restarts it there
export function setDebug(patch: Partial<DebugState>) {
  const jumped = 'time' in patch
  state = { ...state, ...patch, ...(jumped ? { jumpedAt: Date.now(), warp: null } : null) }
  listeners.forEach((l) => l())
}

export function resetDebug() {
  state = initial
  listeners.forEach((l) => l())
}
