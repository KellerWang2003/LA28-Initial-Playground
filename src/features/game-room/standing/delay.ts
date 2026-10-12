import { useSyncExternalStore } from 'react'
import { useClock } from '@/lib/clock'

// "My stream is behind by Xs": the fan's TV, watch party or video feed lags the official
// feed, so the Standing tab shows the room as it was `offsetS` seconds ago. In memory only.

export type StreamDelay = {
  offsetS: number
  /** Replace results and scores with a tap-to-reveal state */
  hideScores: boolean
  /** Result ids the fan tapped open while hiding is on */
  revealed: readonly string[]
}

export const DELAY_PRESETS = [0, 10, 30, 60] as const

let state: StreamDelay = { offsetS: 0, hideScores: false, revealed: [] }
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function set(next: StreamDelay) {
  state = next
  listeners.forEach((l) => l())
}

export const useStreamDelay = () => useSyncExternalStore(subscribe, () => state)

export const resetStreamDelay = () => set({ offsetS: 0, hideScores: false, revealed: [] })

export const setStreamOffset = (offsetS: number) => set({ ...state, offsetS })

// Turning hiding on or off starts fresh: nothing stays revealed
export const setHideScores = (hideScores: boolean) => set({ ...state, hideScores, revealed: [] })

export const revealResult = (id: string) => {
  if (!state.revealed.includes(id)) set({ ...state, revealed: [...state.revealed, id] })
}

// ---- Pure offset logic (kept apart from React so it is easy to reason about) ----

/** The moment the fan's stream is showing, given the official clock. */
export const viewTime = (nowMs: number, offsetS: number) => nowMs - offsetS * 1000

/** Has an official update (at `eventMs`) reached the fan's stream yet? */
export const hasLanded = (eventMs: number, nowMs: number, offsetS: number) => eventMs <= viewTime(nowMs, offsetS)

export type Gate = 'pending' | 'hidden' | 'shown'

/** Not there yet, held back as a spoiler, or visible. */
export function gateOf(landed: boolean, hideScores: boolean, revealed: boolean): Gate {
  if (!landed) return 'pending'
  return hideScores && !revealed ? 'hidden' : 'shown'
}

// ---- Hooks ----

/** The mock clock shifted back by the fan's stream delay. Everything on the tab reads this. */
export function useViewClock() {
  const now = useClock()
  return viewTime(now, useStreamDelay().offsetS)
}

/** Gate for one official update. `id` identifies it for tap-to-reveal. */
export function useResultGate(id: string, eventMs: number): Gate {
  const { offsetS, hideScores, revealed } = useStreamDelay()
  const now = useClock()
  return gateOf(hasLanded(eventMs, now, offsetS), hideScores, revealed.includes(id))
}
