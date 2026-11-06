import { useSyncExternalStore } from 'react'
import { seedUnit } from '@/features/game-room/seed'
import { GROUPS, SPOTS, tally, type Group, type Member, type Spot } from '@/features/activity/keep-going'
import { myGroup, stageKeepGoing, useKeepGoing, voteClosed } from '@/features/activity/keep-going-state'
import { setMyAnswer } from '@/features/game-room/crowd'
import { collectPin, setCollected } from '@/lib/collected'
import { nowMs, useClock } from '@/lib/clock'
import { metersBetween, moveFan, teleportFan } from '@/lib/location'
import type { LngLat } from '@/data/map-layers'

// The hangout itself, once the group has picked a place: walk over together (everyone's dot heads
// to the spot, and a shared shape helps you spot the group at the door), sit down with tonight's
// CrowdPlay answers as icebreakers, take one group photo, and get the Night Out pin in the Passport.
// In-memory, like the rest of the demo.

export const NIGHT_OUT_PIN = 'p_nightout'
// Close enough to the spot to say you're there
export const HERE_M = 80
// The group's sign at the door: everyone's phone shows this
export const GROUP_SIGNAL = { shape: '▲', number: 52 }

export type HangoutStage = 'off' | 'walking' | 'table' | 'stamped'

type HangoutState = {
  stage: HangoutStage
  // When you set off, so the others' walks line up with yours
  since: number | null
  // Who was in the photo, for the stamp
  inPhoto: string[]
}

const EMPTY: HangoutState = { stage: 'off', since: null, inPhoto: [] }

let state: HangoutState = EMPTY
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function set(next: Partial<HangoutState>) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}

export function useHangout() {
  return useSyncExternalStore(subscribe, () => state)
}

// ---- Reading ----

export const spotCoords = (spot: Spot): LngLat => [spot.lng, spot.lat]

/** The plan everything here hangs off: your group and the place it picked, once the vote is in */
export function usePlan() {
  const keep = useKeepGoing()
  const now = useClock()
  const group = myGroup(keep, now)
  if (!group || !voteClosed(keep, now)) return undefined
  return { group, spot: tally(group, keep.voteId).leader, host: !!keep.host }
}

/** When a member gets to the spot: the person you got talking to first, the rest over a few minutes */
export function arrivesAt(group: Group, member: Member, since: number) {
  const first = member.id === group.metId
  const s = first ? 25 : 45 + Math.round(seedUnit(`arrive:${member.id}`) * 160)
  return since + s * 1000
}

/** How far along their walk a member is, 0 to 1 */
export function walked(group: Group, member: Member, since: number, now: number) {
  const ends = arrivesAt(group, member, since)
  const starts = since - 20_000
  return Math.min(1, Math.max(0, (now - starts) / (ends - starts)))
}

export const metersTo = (from: LngLat, spot: Spot) => Math.round(metersBetween(from, spotCoords(spot)))

/** How far you are from the spot, and whether that counts as there */
export function distanceLeft(spot: Spot, me: LngLat) {
  const meters = metersTo(me, spot)
  return { meters, here: meters <= HERE_M }
}

// ---- Actions ----

export function headOver() {
  if (state.stage !== 'off') return
  set({ stage: 'walking', since: nowMs() })
}

export function arrive() {
  set({ stage: 'table' })
}

/** Prototype shortcut: put the fan at the spot (the debug panel's Where works too) */
export function walkThere(spot: Spot) {
  teleportFan(spotCoords(spot))
}

export function takeGroupPhoto(inPhoto: string[]) {
  set({ stage: 'stamped', inPhoto })
  collectPin(NIGHT_OUT_PIN)
}

export function resetHangout() {
  state = EMPTY
  listeners.forEach((l) => l())
}

// ---- Debug: start at a step, with the vote decided and a few CrowdPlay answers to talk about ----

export type HangoutJump = 'walking' | 'arrived' | 'table' | 'stamped'

const SEED_ANSWERS: Record<string, string> = {
  r_learn: 'ocean',
  r_snack: 'popcorn',
  r_stroke: 'fly',
  r_thisorthat: 'coffee',
  r_predict_200: 'GBR',
  r_fastest: 'free',
}

export function seedCrowdPlayAnswers(sessionId: string) {
  Object.entries(SEED_ANSWERS).forEach(([q, v]) => setMyAnswer(sessionId, q, v))
}

export function stageHangout(stage: HangoutJump, sessionId: string) {
  // Same as the keep-going "decided" step: the first group, voting for the sports bar
  stageKeepGoing('decided')
  const spot = tally(GROUPS[0], SPOTS[2].id).leader
  seedCrowdPlayAnswers(sessionId)
  setCollected(NIGHT_OUT_PIN, false)
  const now = nowMs()
  if (stage === 'walking') {
    moveFan({ place: 'sofi' })
    state = { ...EMPTY, stage: 'walking', since: now }
  } else if (stage === 'arrived') {
    teleportFan(spotCoords(spot))
    state = { ...EMPTY, stage: 'walking', since: now - 150_000 }
  } else if (stage === 'table') {
    teleportFan(spotCoords(spot))
    state = { ...EMPTY, stage: 'table', since: now - 240_000 }
  } else {
    teleportFan(spotCoords(spot))
    state = { ...EMPTY, stage: 'stamped', since: now - 300_000, inPhoto: ['julia', 'kenji', 'amara', 'luca', 'noah'] }
    collectPin(NIGHT_OUT_PIN)
  }
  listeners.forEach((l) => l())
}
