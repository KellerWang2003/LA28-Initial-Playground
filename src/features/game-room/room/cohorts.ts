import { choiceDist, countryChoice, shareOf } from '../game/crowd-model'
import { roundsFor } from '../rounds'
import type { Round } from '../types'
import { MIN_GROUP, type Crowd } from './model'

// "Fans like you": synthetic cohorts of fans who answered like the fan did. Cohorts are sizes and
// countries only, and anything under MIN_GROUP is dropped.

const MATCHABLE = new Set<Round['kind']>(['predict', 'this-or-that', 'pick-one', 'poll'])

// Rounds with fixed options that the fan could line up with the crowd on
export const matchableRounds = (sessionId: string) =>
  roundsFor(sessionId).filter((r) => MATCHABLE.has(r.kind) && (r.options?.length ?? 0) > 1)

export type Cohort = {
  /** Questions answered the same as the fan */
  matched: number
  /** Questions the fan answered */
  of: number
  size: number
  /** Biggest countries in the cohort (names are resolved by the caller) */
  countries: string[]
}

/** Rounds needed before cohorts show: 3, or every matchable round when the game has fewer */
export const roundsNeeded = (sessionId: string) => Math.min(3, matchableRounds(sessionId).length)

export function cohortsFor(sessionId: string, answers: Record<string, string>, crowd: Crowd): { answered: number; cohorts: Cohort[] } {
  const mine = matchableRounds(sessionId).flatMap((round) => {
    const options = round.options!.map((o) => o.id)
    const choice = answers[round.id]
    return choice && options.includes(choice) ? [{ round, options, choice }] : []
  })
  const n = mine.length
  if (n === 0 || crowd.total === 0) return { answered: n, cohorts: [] }

  // Chance the crowd matches the fan on each question (the same split the Game reveals show),
  // then P(exactly k matches) over all questions
  const p = mine.map((m) => shareOf(choiceDist(m.round), m.choice))
  let dist = [1]
  for (const pi of p) {
    const next = new Array<number>(dist.length + 1).fill(0)
    dist.forEach((d, k) => {
      next[k] += d * (1 - pi)
      next[k + 1] += d * pi
    })
    dist = next
  }

  const cohorts: Cohort[] = []
  for (let k = n; k >= Math.max(1, n - 3); k--) {
    const size = Math.round(crowd.total * dist[k])
    if (size < MIN_GROUP) continue
    // Each country answers a little differently: weight its fans by how likely they are to match
    const ranked = crowd.visible
      .map((b) => {
        const q = mine.reduce((sum, m) => sum + shareOf(countryChoice(m.round, b), m.choice), 0) / n
        return { code: b.code, score: b.count ** 0.6 * q ** k * (1 - q) ** (n - k) }
      })
      .sort((a, b) => b.score - a.score)
    cohorts.push({ matched: k, of: n, size, countries: ranked.slice(0, 2).map((r) => r.code) })
  }
  return { answered: n, cohorts: cohorts.slice(0, 3) }
}
