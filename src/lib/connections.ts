import { useSyncExternalStore } from 'react'
import { people } from '@/data/mock'

// People already on your list. A reload restores this, like the rest of the demo.
export const SEED_CONNECTIONS = people.map((p) => p.id)

let connections: string[] = [...SEED_CONNECTIONS]
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useConnections() {
  return useSyncExternalStore(subscribe, () => connections)
}

// Returns false when they are already in the list, so a second scan is a no-op.
export function addConnection(id: string) {
  if (connections.includes(id)) return false
  connections = [...connections, id]
  listeners.forEach((l) => l())
  return true
}
