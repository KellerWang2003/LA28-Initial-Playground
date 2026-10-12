import type { Session } from '@/data/la28'
import { seedUnit } from '../seed'
import { endMs, NOW_MS, phaseAt, type Phase } from './status'

// What a two-team game looks like at the fan's moment (see useViewClock).
// The live Serbia v Australia game is scripted so the score actually moves with the mock
// clock, which is what makes the stream delay visible: at NOW it is exactly the 38–35, Q2 4:12
// from SCHEDULE, and it runs on from there. Other games use their fixed data.

export const QUARTER_S = 600
export const GAME_S = 4 * QUARTER_S
// Seconds into the game at NOW (Q2 with 4:12 left)
const ANCHOR_G = QUARTER_S + (QUARTER_S - 252)

export type Play = { g: number; team: 0 | 1; pts: 1 | 2 | 3 }

function buildScript(anchor: [number, number]): Play[] {
  const plays: Play[] = []
  const pickPts = (u: number): Play['pts'] => (u < 0.2 ? 3 : u < 0.85 ? 2 : 1)

  // Backwards from the anchor score, so the totals add up to it exactly
  const left = [...anchor]
  let g = ANCHOR_G
  for (let i = 0; left[0] + left[1] > 0; i++) {
    g -= 14 + seedUnit(`bb:back:gap:${i}`) * 26
    let team: 0 | 1 = seedUnit(`bb:back:team:${i}`) < 0.5 ? 0 : 1
    if (left[team] === 0) team = team === 0 ? 1 : 0
    const pts = Math.min(pickPts(seedUnit(`bb:back:pts:${i}`)), left[team]) as Play['pts']
    left[team] -= pts
    plays.push({ g: Math.max(1, g), team, pts })
  }
  plays.reverse()

  // Forwards to the final buzzer
  g = ANCHOR_G
  for (let i = 0; ; i++) {
    g += 14 + seedUnit(`bb:fwd:gap:${i}`) * 26
    if (g > GAME_S) break
    plays.push({ g, team: seedUnit(`bb:fwd:team:${i}`) < 0.5 ? 0 : 1, pts: pickPts(seedUnit(`bb:fwd:pts:${i}`)) })
  }
  return plays
}

const SCRIPT_ID = 's_bball_0720'
const scripts = new Map<string, Play[]>()

function scriptOf(session: Session): Play[] | undefined {
  if (session.id !== SCRIPT_ID || !session.live?.score) return undefined
  let plays = scripts.get(session.id)
  if (!plays) {
    plays = buildScript(session.live.score)
    scripts.set(session.id, plays)
  }
  return plays
}

// 948 -> 'Q2 4:12'
export function gameClock(g: number) {
  const q = Math.min(4, Math.floor(g / QUARTER_S) + 1)
  const left = Math.max(0, q * QUARTER_S - g)
  const secs = Math.ceil(left)
  return `Q${q} ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
}

export type GameState = {
  phase: Phase
  score?: [number, number]
  /** 'Q2 4:12' for a live game */
  clock?: string
  /** Most recent basket, for the live ticker */
  lastPlay?: { text: string; clock: string }
}

export function gameStateAt(session: Session, viewMs: number): GameState {
  const phase = phaseAt(session, viewMs)
  const plays = scriptOf(session)

  if (plays && session.teams) {
    const g = Math.min(GAME_S, ANCHOR_G + (viewMs - NOW_MS) / 1000)
    if (g < 0) return { phase: 'upcoming' }
    const so_far = plays.filter((p) => p.g <= g)
    const score: [number, number] = [0, 0]
    so_far.forEach((p) => (score[p.team] += p.pts))
    const last = so_far[so_far.length - 1]
    const kind = (p: Play) => (p.pts === 3 ? '3-pointer' : p.pts === 1 ? 'free throw' : 'basket')
    return {
      phase: g >= GAME_S ? 'finished' : 'live',
      score,
      clock: g >= GAME_S ? 'Full time' : gameClock(g),
      lastPlay: last && { text: `${session.teams[last.team]} ${kind(last)}`, clock: gameClock(last.g) },
    }
  }

  const score = session.live?.score ?? session.score
  if (phase === 'finished') return { phase, score, clock: 'Full time' }
  if (phase === 'live') return { phase, score, clock: session.live?.clock }
  return { phase }
}

/** When a finished game's result counts as "landed", for delay and spoiler gating. */
export const finalLandedAt = (session: Session) => endMs(session)


/** The scripted plays so far and the game second the fan is at, for the live stats. */
export function scriptedPlays(session: Session, viewMs: number): { plays: Play[]; g: number } | undefined {
  const plays = scriptOf(session)
  if (!plays) return undefined
  const g = Math.min(GAME_S, ANCHOR_G + (viewMs - NOW_MS) / 1000)
  return { plays: plays.filter((p) => p.g <= g), g }
}
