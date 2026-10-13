import { useSyncExternalStore } from 'react'
import { nowMs, useClock } from '@/lib/clock'
import { gameFor, getMyGames, useMyGames } from '@/lib/my-games'
import { notify } from '@/lib/toasts'
import {
  GROUPS,
  groupById,
  HOST_VIBES,
  hostedGroup,
  canAsk,
  inAskWindow,
  KEEP_TIMING,
  SPOTS,
  SWIM_SESSION,
  tally,
  type Group,
} from '@/features/activity/keep-going'

// In-memory, like the rest of the demo. A reload restores the invitation.
export type KeepState = {
  answer: 'in' | 'out' | null
  // The prompt near the end of the session goes out once
  prompted: boolean
  // Matching: when the current search started, and the groups you passed on
  searchingSince: number | null
  passed: string[]
  // A group on offer, waiting for you to join or pass
  offerId: string | null
  // Where you ended up: a matched group, or a gathering you host
  groupId: string | null
  host: { vibe: string; since: number } | null
  voteId: string | null
  votesClose: number | null
  // The "vote is in" alert goes out once
  decidedNotified: boolean
}

const EMPTY: KeepState = {
  answer: null,
  prompted: false,
  searchingSince: null,
  passed: [],
  offerId: null,
  groupId: null,
  host: null,
  voteId: null,
  votesClose: null,
  decidedNotified: false,
}

let state: KeepState = EMPTY
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit() {
  listeners.forEach((l) => l())
}

function set(next: Partial<KeepState>) {
  state = { ...state, ...next }
  emit()
}

export function useKeepGoing() {
  return useSyncExternalStore(subscribe, () => state)
}

// ---- Reading the state ----

export type KeepStep = 'ask' | 'out' | 'matching' | 'offer' | 'group'

export function keepStep(s: KeepState): KeepStep {
  if (s.answer === 'out') return 'out'
  if (s.answer === null) return 'ask'
  if (s.groupId || s.host) return 'group'
  if (s.offerId) return 'offer'
  return 'matching'
}

// The group you're in right now, as of `now` (a hosted one grows over time)
export function myGroup(s: KeepState, now: number): Group | undefined {
  if (s.host) {
    const vibe = HOST_VIBES.find((v) => v.id === s.host!.vibe)
    return vibe && hostedGroup(vibe, s.host.since, now)
  }
  return s.groupId ? groupById(s.groupId) : undefined
}

export const nextOffer = (s: KeepState) => GROUPS.find((g) => !s.passed.includes(g.id))

export const voteClosed = (s: KeepState, now: number) => s.votesClose !== null && now >= s.votesClose

// ---- Actions ----

export function joinIn() {
  if (state.answer === 'in') return
  set({ ...EMPTY, prompted: true, answer: 'in', searchingSince: nowMs() })
}

export function pass() {
  set({ ...EMPTY, prompted: true, answer: 'out' })
}

export function reopen() {
  set({ ...EMPTY, prompted: true })
}

// Pass on the group on offer and keep looking
export function passOffer() {
  if (!state.offerId) return
  set({ passed: [...state.passed, state.offerId], offerId: null, searchingSince: nowMs() })
}

export function joinOffer() {
  if (!state.offerId) return
  set({ groupId: state.offerId, offerId: null, votesClose: nowMs() + KEEP_TIMING.voteMs })
}

export function hostGathering(vibe: string) {
  const now = nowMs()
  set({ host: { vibe, since: now }, offerId: null, votesClose: now + KEEP_TIMING.voteMs })
}

// Leave the group and go back to matching
export function leaveGroup() {
  set({
    groupId: null,
    host: null,
    voteId: null,
    votesClose: null,
    decidedNotified: false,
    passed: state.groupId ? [...state.passed, state.groupId] : state.passed,
    searchingSince: nowMs(),
  })
}

export function castVote(voteId: string) {
  if (!state.groupId && !state.host) return
  if (voteClosed(state, nowMs())) return
  set({ voteId })
}

export function resetKeepGoing() {
  state = EMPTY
  emit()
}

// ---- Runs once a second from the app root ----

export function tickKeepGoing(now: number) {
  const s = state

  // Near the end of the session, ask the fans who are there
  if (!s.prompted && s.answer === null && inAskWindow(now)) {
    if (gameFor(getMyGames(), SWIM_SESSION)?.mode !== 'venue') return
    set({ prompted: true })
    notify({
      title: 'Swimming wraps up soon',
      body: 'Want to keep going with fans from SoFi after?',
      to: '/events/keep-going',
    })
    return
  }

  // Matching: a group turns up after a short wait
  if (s.answer === 'in' && !s.groupId && !s.host && !s.offerId && s.searchingSince !== null) {
    const next = nextOffer(s)
    const wait = s.passed.length ? KEEP_TIMING.nextMatchMs : KEEP_TIMING.firstMatchMs
    if (next && now >= s.searchingSince + wait) {
      set({ offerId: next.id })
      notify({ title: 'We found you a group', body: `${next.title} · ${next.members.length} people`, to: '/events/keep-going' })
    }
    return
  }

  // The place vote closes
  if (!s.decidedNotified && voteClosed(s, now)) {
    const group = myGroup(s, now)
    if (!group) return
    set({ decidedNotified: true })
    notify({ title: 'The vote is in', body: `Your group is heading to ${tally(group, s.voteId).leader.name}.`, to: '/events/keep-going' })
  }
}

// ---- Debug: start the flow at a given step, as of the current clock ----

export type KeepStage = 'ask' | 'matching' | 'offer' | 'voting' | 'hosting' | 'decided'

export function stageKeepGoing(stage: KeepStage) {
  const now = nowMs()
  const base: KeepState = { ...EMPTY, prompted: true, answer: 'in', searchingSince: now }
  if (stage === 'ask') state = { ...EMPTY }
  else if (stage === 'matching') state = base
  else if (stage === 'offer') state = { ...base, offerId: GROUPS[0].id }
  else if (stage === 'voting') state = { ...base, groupId: GROUPS[0].id, votesClose: now + KEEP_TIMING.voteMs }
  else if (stage === 'hosting')
    state = { ...base, host: { vibe: HOST_VIBES[0].id, since: now }, votesClose: now + KEEP_TIMING.voteMs }
  else state = { ...base, groupId: GROUPS[0].id, voteId: SPOTS[2].id, votesClose: now, decidedNotified: true }
  emit()
}
// Whether this session carries the after-game question: fans at the venue are asked while it runs,
// and once you're in, it stays with the session until the night is planned.
export function useKeepGoingOn(sessionId: string) {
  const keep = useKeepGoing()
  const now = useClock()
  const atVenue = gameFor(useMyGames(), sessionId)?.mode === 'venue'
  if (sessionId !== SWIM_SESSION) return false
  return keep.answer === 'in' || (atVenue && keep.answer === null && canAsk(now))
}

