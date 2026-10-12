import type { Round } from '../types'
import { metaOf } from './round-meta'

// upcoming -> live (answer window) -> locked (waiting) -> reveal (featured result) -> past
export type RoundState = 'upcoming' | 'live' | 'locked' | 'reveal' | 'past'

// A fresh result takes over the tab for this long (a newer live round takes over sooner)
export const REVEAL_FEATURED_S = 60
const DEFAULT_REVEAL_DELAY_S = 3

export function roundTimes(round: Round) {
  const opens = Date.parse(round.opensAt)
  const closes = opens + round.seconds * 1000
  const revealAt = closes + (metaOf(round).revealDelayS ?? DEFAULT_REVEAL_DELAY_S) * 1000
  return { opens, closes, revealAt, revealEnds: revealAt + REVEAL_FEATURED_S * 1000 }
}

export function roundStateAt(round: Round, now: number): RoundState {
  const t = roundTimes(round)
  if (now < t.opens) return 'upcoming'
  if (now < t.closes) return 'live'
  if (now < t.revealAt) return 'locked'
  return now < t.revealEnds ? 'reveal' : 'past'
}

// Results exist from the reveal on
export const hasResults = (state: RoundState) => state === 'reveal' || state === 'past'

/** Whole seconds until `ms`, never negative */
export const secondsUntil = (ms: number, now: number) => Math.max(0, Math.ceil((ms - now) / 1000))

/**
 * The round that should take over the tab: a live one first, then one that is locked or has just
 * revealed (the most recent). Room goals run for a long time, so they live in the lobby instead.
 */
export function featuredRound(rounds: Round[], now: number): Round | undefined {
  const takeover = rounds.filter((r) => r.kind !== 'goal')
  const live = takeover.find((r) => roundStateAt(r, now) === 'live')
  if (live) return live
  const recent = takeover.filter((r) => {
    const state = roundStateAt(r, now)
    return state === 'locked' || state === 'reveal'
  })
  return recent[recent.length - 1]
}
