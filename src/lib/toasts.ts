import { useSyncExternalStore } from 'react'

// In-app notifications. They stand in for push notifications in the prototype:
// a banner slides down from the top, and tapping it opens `to`.
export type Toast = { id: number; title: string; body?: string; to?: string }

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit() {
  listeners.forEach((l) => l())
}

export function useToasts() {
  return useSyncExternalStore(subscribe, () => toasts)
}

// Newest on top; keep a short stack
export function notify(toast: Omit<Toast, 'id'>) {
  const id = nextId++
  toasts = [{ ...toast, id }, ...toasts].slice(0, 3)
  emit()
  return id
}

export function dismissToast(id: number) {
  if (!toasts.some((t) => t.id === id)) return
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export function clearToasts() {
  if (!toasts.length) return
  toasts = []
  emit()
}
