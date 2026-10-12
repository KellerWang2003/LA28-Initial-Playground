import type { Session } from '@/data/la28'
import { seedUnit } from '../seed'
import { GAME_S, gameClock, QUARTER_S, scriptedPlays, type Play } from './game-state'
import type { Leader, PlayRow, StatRow } from './stats-ui'

// Box score for the scripted basketball game, built from the same plays as the score so the
// numbers always add up. Who scored each basket, and the misses, rebounds and assists around
// them, are seeded mock values. Names are fictional.

const ROSTERS: Record<string, string[]> = {
  SRB: ['Marko Petrović', 'Stefan Ilić', 'Luka Đorđević', 'Nemanja Kovač', 'Vuk Savić'],
  AUS: ['Alex Moreau', 'Josh Kerr', 'Mitch Daly', 'Sam Whitlock', 'Tyson Reid'],
}
// Share of the team's work each starter does
const WEIGHTS = [0.3, 0.25, 0.2, 0.15, 0.1]

const rosterOf = (code: string) => ROSTERS[code] ?? WEIGHTS.map((_, i) => `${code} player ${i + 1}`)

function pick(key: string) {
  const u = seedUnit(key)
  let acc = 0
  for (let i = 0; i < WEIGHTS.length; i++) {
    acc += WEIGHTS[i]
    if (u < acc) return i
  }
  return WEIGHTS.length - 1
}

// Split a team total among the five, seeded per stat
function spread(total: number, key: string) {
  const out = WEIGHTS.map(() => 0)
  for (let i = 0; i < total; i++) out[pick(`${key}:${i}`)] += 1
  return out
}

const shotName = (p: Play) => (p.pts === 3 ? '3-pointer' : p.pts === 1 ? 'free throw' : 'jump shot')

export type BoxScore = {
  g: number
  quarter: number
  line: [number[], number[]]
  stats: StatRow[]
  leaders: { label: string; a: Leader; b: Leader }[]
  plays: PlayRow[]
}

export function boxScoreAt(session: Session, viewMs: number): BoxScore | undefined {
  const script = scriptedPlays(session, viewMs)
  const teams = session.teams
  if (!script || !teams) return undefined
  const { plays, g } = script
  const quarter = Math.min(4, Math.floor(g / QUARTER_S) + 1)
  const elapsed = Math.max(0, g) / GAME_S

  // Points by quarter, running score, biggest lead
  const line: [number[], number[]] = [Array(quarter).fill(0), Array(quarter).fill(0)]
  const running: [number, number] = [0, 0]
  const maxLead = [0, 0]
  const points = [WEIGHTS.map(() => 0), WEIGHTS.map(() => 0)]
  const scoredBy = plays.map((p, i) => pick(`bb:who:${p.team}:${i}`))
  plays.forEach((p, i) => {
    const q = Math.min(3, Math.floor(p.g / QUARTER_S))
    line[p.team][q] += p.pts
    running[p.team] += p.pts
    maxLead[p.team] = Math.max(maxLead[p.team], running[p.team] - running[1 - p.team])
    points[p.team][scoredBy[i]] += p.pts
  })

  const side = (t: 0 | 1) => {
    const mine = plays.filter((p) => p.team === t)
    const threes = mine.filter((p) => p.pts === 3).length
    const twos = mine.filter((p) => p.pts === 2).length
    const fts = mine.filter((p) => p.pts === 1).length
    const fgm = twos + threes
    const fga = Math.max(fgm, Math.round(fgm / (0.42 + 0.1 * seedUnit(`bb:fg:${t}`))))
    const tpa = Math.max(threes, Math.round(threes / (0.3 + 0.12 * seedUnit(`bb:3p:${t}`))))
    const misses = fga - fgm
    return { fgm, fga, threes, tpa, fts, misses, ast: Math.round(fgm * (0.5 + 0.2 * seedUnit(`bb:ast:${t}`))), to: Math.round(elapsed * (10 + 6 * seedUnit(`bb:to:${t}`))) }
  }
  const s = [side(0), side(1)]
  const reb = [0, 1].map((t) => Math.round(s[1 - t].misses * 0.68 + s[t].misses * 0.27))
  const pct = (m: number, a: number) => (a ? Math.round((m / a) * 100) : 0)

  const stats: StatRow[] = [
    { label: 'Field goals', a: pct(s[0].fgm, s[0].fga), b: pct(s[1].fgm, s[1].fga), format: (n) => `${n}%`, sub: [`${s[0].fgm}/${s[0].fga}`, `${s[1].fgm}/${s[1].fga}`] },
    { label: '3-pointers', a: pct(s[0].threes, s[0].tpa), b: pct(s[1].threes, s[1].tpa), format: (n) => `${n}%`, sub: [`${s[0].threes}/${s[0].tpa}`, `${s[1].threes}/${s[1].tpa}`] },
    { label: 'Rebounds', a: reb[0], b: reb[1] },
    { label: 'Assists', a: s[0].ast, b: s[1].ast },
    { label: 'Turnovers', a: s[0].to, b: s[1].to, lowerIsBetter: true },
    { label: 'Biggest lead', a: maxLead[0], b: maxLead[1] },
  ]

  const leaderOf = (t: 0 | 1, values: number[]): Leader => {
    const i = values.indexOf(Math.max(...values))
    return { name: rosterOf(teams[t])[i], value: values[i] }
  }
  const rebs = [0, 1].map((t) => spread(reb[t], `bb:reb:${t}`))
  const asts = [0, 1].map((t) => spread(s[t].ast, `bb:ast-by:${t}`))
  const leaders = [
    { label: 'Points', a: leaderOf(0, points[0]), b: leaderOf(1, points[1]) },
    { label: 'Rebounds', a: leaderOf(0, rebs[0]), b: leaderOf(1, rebs[1]) },
    { label: 'Assists', a: leaderOf(0, asts[0]), b: leaderOf(1, asts[1]) },
  ]

  // Latest first, with the score after each
  const after: [number, number] = [0, 0]
  const rows = plays.map((p, i) => {
    after[p.team] += p.pts
    return {
      id: String(i),
      clock: gameClock(p.g),
      code: teams[p.team],
      text: `${rosterOf(teams[p.team])[scoredBy[i]]} ${shotName(p)}`,
      score: `${after[0]}–${after[1]}`,
    }
  })

  return { g, quarter, line, stats, leaders, plays: rows.slice(-4).reverse() }
}
