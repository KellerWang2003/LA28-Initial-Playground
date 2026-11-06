import { useSyncExternalStore } from 'react'
import { joinEvent, leaveEvent } from '@/lib/plans'
import type { Bring, Side, WatchParty } from '@/features/watch-party/crowd'

// The fan's seat at each watch party: which side, what they bring, how many
// friends come with them, and whether they've checked in. Joining also puts the
// party in My activities (lib/plans). In-memory: a reload resets it.

export type MySeat = {
  side: Side
  bring?: Bring
  // Friends from your own party, seated next to you
  plus: number
  checkedIn: boolean
}

// Already going to Saturday's Brazil vs Japan party (it's seeded in plans too)
const SEED: Record<string, MySeat> = {
  e_watch_fb: { side: 0, plus: 0, checkedIn: false },
}

let seats: Record<string, MySeat> = { ...SEED }
// Waiting for a seat at a full party
let standby: string[] = []
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit() {
  listeners.forEach((l) => l())
}

const without = (all: Record<string, MySeat>, id: string) => Object.fromEntries(Object.entries(all).filter(([k]) => k !== id))

export function useMySeat(eventId: string): MySeat | undefined {
  return useSyncExternalStore(subscribe, () => seats[eventId])
}

export function getMySeat(eventId: string): MySeat | undefined {
  return seats[eventId]
}

export function useStandby(eventId: string) {
  return useSyncExternalStore(subscribe, () => standby.includes(eventId))
}

export function takeSeat(eventId: string, seat: Omit<MySeat, 'checkedIn'>) {
  seats = { ...seats, [eventId]: { ...seat, checkedIn: false } }
  standby = standby.filter((id) => id !== eventId)
  joinEvent(eventId)
  emit()
}

export function giveUpSeat(eventId: string) {
  seats = without(seats, eventId)
  leaveEvent(eventId)
  emit()
}

export function checkIn(eventId: string) {
  const seat = seats[eventId]
  if (!seat || seat.checkedIn) return
  seats = { ...seats, [eventId]: { ...seat, checkedIn: true } }
  emit()
}

export function toggleStandby(eventId: string) {
  standby = standby.includes(eventId) ? standby.filter((id) => id !== eventId) : [...standby, eventId]
  emit()
}

// Debug: put the fan at a step of the flow
export type WatchStep = 'browsing' | 'joined' | 'checked-in'

export function stageWatchParty(eventId: string, step: WatchStep) {
  const rest = without(seats, eventId)
  seats = step === 'browsing' ? rest : { ...rest, [eventId]: { side: 0, bring: 'flag', plus: 0, checkedIn: step === 'checked-in' } }
  if (step === 'browsing') leaveEvent(eventId)
  else joinEvent(eventId)
  emit()
}

export function resetWatchParties() {
  seats = { ...SEED }
  standby = []
  emit()
}

// ---- Seats on each side ----

export type SeatView =
  | { kind: 'taken'; number: number; cc: string; bring?: Bring; host?: boolean; here: boolean; plusOne?: boolean }
  | { kind: 'mine'; number: number; bring?: Bring; here: boolean }
  | { kind: 'friend'; number: number; here: boolean }
  | { kind: 'empty'; number: number }

// The room as two halves, crowd first, then you and your friends, then empty seats
export function seatsBySide(party: WatchParty, mine: MySeat | undefined, now: number): [SeatView[], SeatView[]] {
  const half = (side: Side): SeatView[] => {
    const base = side * party.seatsPerSide
    const views: SeatView[] = party.crowd
      .filter((s) => s.side === side)
      .map((s) => ({ kind: 'taken', number: 0, cc: s.cc, bring: s.bring, host: s.host, plusOne: s.plusOne, here: now >= Date.parse(`${party.event.date}T${s.arrives}`) }))
    if (mine?.side === side) {
      views.push({ kind: 'mine', number: 0, bring: mine.bring, here: mine.checkedIn })
      for (let i = 0; i < mine.plus; i++) views.push({ kind: 'friend', number: 0, here: mine.checkedIn })
    }
    while (views.length < party.seatsPerSide) views.push({ kind: 'empty', number: 0 })
    return views.slice(0, party.seatsPerSide).map((v, i) => ({ ...v, number: base + i + 1 }))
  }
  return [half(0), half(1)]
}

export const freeOnSide = (party: WatchParty, side: Side, mine?: MySeat) =>
  party.seatsPerSide - party.crowd.filter((s) => s.side === side).length - (mine?.side === side ? 1 + mine.plus : 0)

export const mySeatNumber = (party: WatchParty, mine: MySeat) =>
  mine.side * party.seatsPerSide + party.crowd.filter((s) => s.side === mine.side).length + 1
