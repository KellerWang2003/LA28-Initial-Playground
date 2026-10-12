import { useSyncExternalStore } from 'react'
import { eventById, placeById } from '@/data/la28'

// Everything on the fan's own list in Activities: gatherings they host or created,
// and events they said they're going to. Games live in `my-games`.
export type MyPlan = {
  id: string
  title: string
  // 'YYYY-MM-DD' and 'HH:MM', like the mock data
  date: string
  time: string
  where: string
  role: 'hosting' | 'going'
  visibility: 'public' | 'private'
}

function fromEvent(id: string, role: MyPlan['role']): MyPlan {
  const e = eventById(id)!
  return {
    id: e.id,
    title: e.title,
    date: e.date,
    time: e.time,
    where: placeById(e.place).name,
    role,
    visibility: 'public',
  }
}

// Seeded with the gathering this fan is hosting and two they already said yes to.
const SEED: MyPlan[] = [fromEvent('e_dumplings', 'hosting'), fromEvent('e_fanzone', 'going'), fromEvent('e_watch_fb', 'going')]

let plans: MyPlan[] = [...SEED]
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit() {
  listeners.forEach((l) => l())
}

export function usePlans() {
  return useSyncExternalStore(subscribe, () => plans)
}

export function addPlan(plan: MyPlan) {
  plans = [plan, ...plans]
  emit()
}

// Say you're going to a listed event
export function joinEvent(id: string) {
  if (plans.some((p) => p.id === id)) return
  addPlan(fromEvent(id, 'going'))
}

export function leaveEvent(id: string) {
  plans = plans.filter((p) => p.id !== id)
  emit()
}

export function resetPlans() {
  plans = [...SEED]
  emit()
}
