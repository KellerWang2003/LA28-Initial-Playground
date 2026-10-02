import { useSyncExternalStore } from 'react'

// In-memory only: a reload resets the demo, which is handy for testing flows.
let collected: string[] = []
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
