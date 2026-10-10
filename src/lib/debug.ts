import { useSyncExternalStore } from 'react'

// Prototype-only switches for testing challenges from a desk. In-memory: a reload resets them.

// Times the clock can jump to. null keeps the mock's NOW (Thu 7:20 PM).
export const CLOCK_STOPS: { time: string | null; label: string }[] = [
  { time: null, label: '7:20 PM' },
  { time: '2028-07-20T19:40', label: '7:40 PM' },
  { time: '2028-07-20T19:55', label: 'Sunset' },
  { time: '2028-07-20T20:30', label: '8:30 PM' },
  { time: '2028-07-22T06:30', label: 'Sat 6:30 AM' },
]

// 'schedule' follows each venue's session times; the others force every venue
export type VenueGame = 'schedule' | 'before' | 'live' | 'ended'

export type DebugState = {
  // Standing inside the pin's radius
  inRadius: boolean
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

const initial: DebugState = { inRadius: true, time: null, jumpedAt: 0, venueGame: 'schedule', others: 1, speed: 1, warp: null }

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

export function setDebug(patch: Partial<DebugState>) {
  const jumped = 'time' in patch && patch.time !== state.time
  state = { ...state, ...patch, ...(jumped ? { jumpedAt: Date.now(), warp: null } : null) }
  listeners.forEach((l) => l())
}

export function resetDebug() {
  state = initial
  listeners.forEach((l) => l())
}
