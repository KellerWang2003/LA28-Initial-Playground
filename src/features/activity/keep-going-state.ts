import { useSyncExternalStore } from 'react'

// In-memory, like the rest of the demo. A reload restores the invitation.
export type KeepState = {
  answer: 'in' | 'out' | null
  groupId: string | null
  voteId: string | null
}

const EMPTY: KeepState = { answer: null, groupId: null, voteId: null }

let state: KeepState = EMPTY
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit() {
  listeners.forEach((l) => l())
}

function set(next: KeepState) {
  state = next
  emit()
}

export function useKeepGoing() {
  return useSyncExternalStore(subscribe, () => state)
}

export function joinIn() {
  if (state.answer === 'in') return
  set({ ...EMPTY, answer: 'in' })
}

export function pass() {
  set({ ...EMPTY, answer: 'out' })
}

export function reopen() {
  set(EMPTY)
}

export function pickGroup(groupId: string) {
  set({
    answer: 'in',
    groupId,
    voteId: state.groupId === groupId ? state.voteId : null,
  })
}

export function castVote(voteId: string) {
  if (!state.groupId) return
  set({ ...state, voteId })
}

export function resetKeepGoing() {
  set(EMPTY)
}
