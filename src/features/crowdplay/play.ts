import type { Session } from '@/data/la28'
import { setMyAnswer, useAllAnswers } from '@/features/game-room/crowd'
import { choiceDist, clockDist, originDist, type Dist } from '@/features/game-room/game/crowd-model'
import { metaOf } from '@/features/game-room/game/round-meta'
import { seedUnit } from '@/features/game-room/seed'
import { nowMs } from '@/lib/clock'
import { setsFor, type PlaySet, type Question } from './schedule'

// Answers, Torch rewards and the pretend crowd for CrowdPlay. Answers live in the game room's
// answer store (crowd.ts), keyed by question id. No scores and no leaderboard: taking part is
// what earns Torches.

export const TORCHES_PER_ANSWER = 5
export const TORCHES_PER_ROUND = 10

/** Lock in an answer: only while the question is open, and only once. */
export function answerQuestion(sessionId: string, question: Question, value: string, answers: Record<string, string>) {
  const now = nowMs()
  if (now < question.opens || now >= question.closes || question.id in answers) return
  setMyAnswer(sessionId, question.id, value)
}

export const answeredIn = (set: PlaySet, answers: Record<string, string>) => set.questions.filter((q) => q.id in answers).length

/** Torches from one round: every answer, plus a bonus for answering all of it */
export function roundTorches(set: PlaySet, answers: Record<string, string>) {
  const n = answeredIn(set, answers)
  return n * TORCHES_PER_ANSWER + (n === set.questions.length ? TORCHES_PER_ROUND : 0)
}

export const sessionTorches = (sessionId: string, answers: Record<string, string>) =>
  setsFor(sessionId).reduce((sum, set) => sum + roundTorches(set, answers), 0)

/** Every Torch earned in CrowdPlay, across games (for the wallet) */
export function useCrowdPlayTorches() {
  const rooms = useAllAnswers()
  return Object.entries(rooms).reduce((sum, [sessionId, room]) => sum + sessionTorches(sessionId, room.answers), 0)
}

// ---- The pretend crowd ----

/** About two thirds of the fans in the room play */
export const playersIn = (session: Session) => Math.round((session.fansOnApp ?? 1200) * 0.64)

/** How many have answered so far: quick at first, then trailing off, never everyone */
export function answeredSoFar(question: Question, players: number, now: number) {
  const x = Math.min(1, Math.max(0, (now - question.opens) / (question.closes - question.opens)))
  const reach = 0.82 + 0.1 * seedUnit(`cp:reach:${question.id}`)
  return Math.round(players * reach * (1 - (1 - x) ** 2.4))
}

/** What the crowd answered, with the fan's own answer counted */
export function resultOf(question: Question, now: number, mine?: string): Dist {
  if (question.kind === 'pin-map') return originDist(mine)
  if (metaOf(question).reveal === 'clock') return clockDist(question, now, mine)
  return choiceDist(question, mine)
}

/** Trivia has a right answer. Predictions do too, but only once the race is over. */
export const rightAnswer = (question: Question) => (question.kind === 'predict' ? undefined : metaOf(question).correct)
