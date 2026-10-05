import { useSyncExternalStore } from 'react'
import { SPORTS } from '@/data/la28'

// In-memory, like the rest of the demo: a reload restores this default.
const DEFAULT = ['Swimming', 'Athletics', 'Basketball']

let followed: string[] = [...DEFAULT]
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useFollowedSports() {
  return useSyncExternalStore(subscribe, () => followed)
}

export function toggleFollowedSport(sport: string) {
  followed = followed.includes(sport) ? followed.filter((s) => s !== sport) : [...followed, sport]
  listeners.forEach((l) => l())
}

// Stable order from the sport list, not the order they were toggled
export function followedNames(selected: string[]) {
  return SPORTS.filter((sport) => selected.includes(sport))
}
