import { useSyncExternalStore } from 'react'

// Recent searches, newest first. In-memory: a reload resets the demo.
const MAX = 6
let recent: string[] = ['Swimming', 'Watch party']
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit() {
  listeners.forEach((l) => l())
}

export function useRecentSearches() {
  return useSyncExternalStore(subscribe, () => recent)
}

// Moves a repeated search back to the top
export function addRecentSearch(term: string) {
  const text = term.trim()
  if (!text) return
  recent = [text, ...recent.filter((t) => t.toLowerCase() !== text.toLowerCase())].slice(0, MAX)
  emit()
}

export function removeRecentSearch(term: string) {
  recent = recent.filter((t) => t !== term)
  emit()
}

export function clearRecentSearches() {
  recent = []
  emit()
}
