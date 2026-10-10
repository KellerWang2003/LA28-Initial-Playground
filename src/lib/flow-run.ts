import { useSyncExternalStore } from 'react'
import { onBatonEvent, type BatonEvent } from '@/lib/batons'

// Prototype only: a flow started from the flow gallery. It runs through the
// real screens; when its last event fires, the pill offers the way back.
export type FlowAction = { label: string; run: () => void }

export type FlowRun = {
  // Distinguishes two runs of the same flow
  id: number
  title: string
  // The events that end the flow
  endsOn: BatonEvent[]
  // Shortcuts for steps a desk can't do, like walking to a spot
  actions: FlowAction[]
  done: boolean
}

let run: FlowRun | null = null
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function set(next: FlowRun | null) {
  run = next
  listeners.forEach((l) => l())
}

onBatonEvent((e) => {
  if (run && !run.done && run.endsOn.includes(e)) set({ ...run, done: true })
})

export function useFlowRun() {
  return useSyncExternalStore(subscribe, () => run)
}

export function startFlowRun(flow: Omit<FlowRun, 'done' | 'id'>) {
  set({ ...flow, id: Date.now(), done: false })
}

export function exitFlowRun() {
  if (run) set(null)
}
