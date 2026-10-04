import { useSyncExternalStore } from 'react'

// Pins collected before today, so the Passport isn't empty in the demo
export const SEED_COLLECTED = ['p_pier', 'p_venice_half', 'p_hwof', 'p_lacma', 'p_angelsflight', 'p_chinatown', 'p_sol', 'p_papercrane', 'p_sofi']

// In-memory only: a reload resets the demo, which is handy for testing flows.
let collected: string[] = [...SEED_COLLECTED]
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useCollected() {
  return useSyncExternalStore(subscribe, () => collected)
}

export function collectPin(id: string) {
  if (collected.includes(id)) return
  collected = [...collected, id]
  listeners.forEach((l) => l())
}
