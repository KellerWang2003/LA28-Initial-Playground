import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { Session } from '@/data/la28'
import { nowMs, useClock } from '@/lib/clock'
import { recordScore, setMyAnswer, useMyAnswers } from '../crowd'
import { roundsFor } from '../rounds'
import type { Round } from '../types'
import { answerFor, computeScores } from './scoring'
import { roundStateAt } from './timing'

// What the recap's scoring needs on top of crowd.ts (answers, scores): which rounds the fan skipped and
// when they answered (for the quick-tap bonus). In memory only, like crowd.ts.
type Engine = { skipped: Record<string, true>; answeredAt: Record<string, number> }

const EMPTY: Engine = { skipped: {}, answeredAt: {} }
let engines: Record<string, Engine> = {}
const listeners = new Set<() => void>()

const engineOf = (sessionId: string) => engines[sessionId] ?? EMPTY

function update(sessionId: string, patch: (e: Engine) => Engine) {
  engines = { ...engines, [sessionId]: patch(engineOf(sessionId)) }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useEngine(sessionId: string) {
  return useSyncExternalStore(subscribe, () => engineOf(sessionId))
}

/** Lock in an answer. Only works while the round is live, and only once. */
export function submitAnswer(sessionId: string, round: Round, value: string, answers: Record<string, string>) {
  const now = nowMs()
  if (roundStateAt(round, now) !== 'live' || answerFor(answers, round) !== undefined) return
  setMyAnswer(sessionId, round.id, value)
  update(sessionId, (e) => ({ ...e, answeredAt: { ...e.answeredAt, [round.id]: now } }))
}

export function skipRound(sessionId: string, roundId: string) {
  update(sessionId, (e) => ({ ...e, skipped: { ...e.skipped, [roundId]: true } }))
}

// Rounds already written with recordScore, so each one is recorded once
const recorded = new Set<string>()

// Debug: back to how the demo starts
export function resetEngine() {
  engines = {}
  recorded.clear()
  listeners.forEach((l) => l())
}

/**
 * Writes each answered round's score once, in order, as soon as it reveals. The room page and the
 * recap keep this running, so points are there whichever tab the fan is on.
 */
export function useKeepScores(session: Session) {
  const rounds = useMemo(() => roundsFor(session.id), [session.id])
  const answers = useMyAnswers(session.id)
  const engine = useEngine(session.id)
  useRecordScores(session.id, rounds, answers, engine, useClock(), session.status === 'finished')
}

function useRecordScores(
  sessionId: string,
  rounds: Round[],
  answers: Record<string, string>,
  engine: Engine,
  now: number,
  ended: boolean,
) {
  useEffect(() => {
    const scores = computeScores(rounds, answers, engine.answeredAt, now, ended)
    for (const round of rounds) {
      const key = `${sessionId}:${round.id}`
      // After a reset in the debug panel the answer is gone, so allow recording again
      if (answerFor(answers, round) === undefined) recorded.delete(key)
      const score = scores[round.id]
      if (!score || recorded.has(key)) continue
      recorded.add(key)
      recordScore(sessionId, round.id, { points: score.points, correct: score.correct })
    }
  }, [sessionId, rounds, answers, engine.answeredAt, now, ended])
}
