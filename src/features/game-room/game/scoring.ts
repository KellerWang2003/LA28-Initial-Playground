import { CROWD_COUNTRIES, crowdCountry } from '../crowd'
import { seedUnit } from '../seed'
import type { Round } from '../types'
import { GUESS_TRUTH, participants, roomFavourite, sizeOf } from './crowd-model'
import { metaOf } from './round-meta'
import { hasResults, roundStateAt, roundTimes } from './timing'

// Points: take part, be quick, match the room (or be right), keep a streak.
// "correct" means right for predictions and guesses, and "with the room" for opinion rounds,
// so the streak rewards both.

export type ScorePart = { label: string; points: number }
export type RoundScore = { points: number; correct: boolean; parts: ScorePart[] }

const PARTICIPATION = 50
const FAST_BONUS = 40
const WITH_ROOM_BONUS = 50
const PREDICT_RIGHT = 300
const PREDICT_PLAYED = 20
const GUESS_MAX = 300
const GOAL_JOIN = 50
const GOAL_REACHED = 100
const STREAK_STEP = 15
const STREAK_CAP = 5

/** The fan's answer for a round: crowd.ts stores every answer under its round id */
export const answerFor = (answers: Record<string, string>, round: Round): string | undefined => answers[round.id]

function fastBonus(round: Round, answeredAt: number | undefined): ScorePart[] {
  const window = Math.min(round.seconds, 30) * 1000
  const elapsed = answeredAt === undefined ? window / 2 : Math.max(0, answeredAt - roundTimes(round).opens)
  const points = Math.round(FAST_BONUS * Math.max(0, 1 - elapsed / window))
  return points > 0 ? [{ label: 'Quick tap', points }] : []
}

export function scoreRound(round: Round, answer: string, answeredAt: number | undefined, streakBefore: number): RoundScore {
  const parts: ScorePart[] = []
  let correct = true

  switch (round.kind) {
    case 'pin-map':
    case 'hello':
      parts.push({ label: 'Joined in', points: PARTICIPATION }, ...fastBonus(round, answeredAt))
      break
    case 'guess-crowd': {
      const diff = Math.abs((parseInt(answer, 10) || 0) - GUESS_TRUTH)
      const closeness = Math.round(GUESS_MAX * Math.max(0, 1 - diff / GUESS_TRUTH))
      parts.push({ label: 'Played', points: PREDICT_PLAYED }, { label: diff ? `Off by ${diff}` : 'Spot on', points: closeness })
      correct = diff <= 3
      break
    }
    case 'goal':
      parts.push({ label: 'Joined the goal', points: GOAL_JOIN }, { label: 'Goal reached', points: GOAL_REACHED })
      break
    default: {
      const right = metaOf(round).correct
      if (right) {
        correct = answer === right
        if (correct) parts.push({ label: 'Right pick', points: PREDICT_RIGHT }, ...fastBonus(round, answeredAt))
        else parts.push({ label: 'Played', points: PREDICT_PLAYED })
      } else {
        correct = answer === roomFavourite(round)
        parts.push({ label: 'Joined in', points: PARTICIPATION }, ...fastBonus(round, answeredAt))
        if (correct) parts.push({ label: 'With the room', points: WITH_ROOM_BONUS })
      }
    }
  }

  if (correct && streakBefore > 0) {
    parts.push({ label: `${streakBefore + 1} in a row`, points: STREAK_STEP * Math.min(streakBefore, STREAK_CAP) })
  }
  return { points: parts.reduce((sum, p) => sum + p.points, 0), correct, parts }
}

/**
 * Scores for every round the fan answered that has revealed, worked out in order so the streak
 * carries from one round to the next. The same function feeds the screen and `recordScore`.
 */
export function computeScores(
  rounds: Round[],
  answers: Record<string, string>,
  answeredAt: Record<string, number>,
  now: number,
  ended = false,
): Record<string, RoundScore> {
  const out: Record<string, RoundScore> = {}
  let streak = 0
  for (const round of rounds) {
    if (!ended && !hasResults(roundStateAt(round, now))) continue
    const answer = answerFor(answers, round)
    if (answer === undefined) continue
    const score = scoreRound(round, answer, answeredAt[round.id], streak)
    out[round.id] = score
    streak = score.correct ? streak + 1 : 0
  }
  return out
}

// ---- Country teams ----

export type TeamRow = { code: string; name: string; flag: string; points: number; fans: number; mine: boolean }

/**
 * Team scores for the whole room. Each country's fans earn points as rounds go by, so the totals
 * grow with the clock; the fan's own points are added to their country on top.
 */
export function teamScores(rounds: Round[], now: number, myCountry: string, myPoints: number): TeamRow[] {
  return CROWD_COUNTRIES.map((c) => {
    let points = 0
    for (const round of rounds) {
      const { opens, revealAt } = roundTimes(round)
      if (now < opens) continue
      const progress = Math.min(1, (now - opens) / Math.max(1, revealAt - opens + 30_000))
      const perFan = 28 + 70 * seedUnit(`team:${c.code}:${round.id}`)
      points += participants(round.id, c) * perFan * 0.05 * progress
    }
    const mine = c.code === myCountry
    return { code: c.code, name: c.name, flag: c.flag, fans: sizeOf(c), points: Math.round(points + (mine ? myPoints : 0)), mine }
  }).sort((a, b) => b.points - a.points)
}

/** Teams for one round: how much each country earned in it (reveal mini leaderboard) */
export function roundTeamRows(round: Round, myCountry: string, myPoints: number): TeamRow[] {
  return CROWD_COUNTRIES.map((c) => {
    const perFan = 28 + 70 * seedUnit(`team:${c.code}:${round.id}`)
    const mine = c.code === myCountry
    const points = Math.round(participants(round.id, c) * perFan * 0.05 + (mine ? myPoints : 0))
    return { code: c.code, name: c.name, flag: c.flag, fans: sizeOf(c), points, mine }
  }).sort((a, b) => b.points - a.points)
}

export const flagOf = (code: string) => crowdCountry(code)?.flag ?? '🏳️'
