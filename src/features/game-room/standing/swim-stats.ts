import type { Session } from '@/data/la28'
import { seedUnit } from '../seed'
import { FREE200_SEMIS, raceTimes, SWIM_FIXTURES } from './data'
import { countryName } from './flags'
import type { BoardRow } from './stats-ui'

// Live timing for a swimming race, like the board at the pool: the start list before, reaction
// times off the blocks, then the order and gaps at each wall, then the final times.
// Splits are seeded around a typical 200m pace so the order can change during the race.

type Race = NonNullable<Session['races']>[number]

// Share of the final time at each 50m wall of a 200m race
const PACE = [0.236, 0.488, 0.743, 1]
const POOL_M = 50
// Fictional records for the event
export const RECORDS: Record<string, { world: number; olympic: number }> = {
  '19:28': { world: 102.0, olympic: 102.96 },
}

// 105.79 -> '1:45.79', 50.8 -> '50.80'
export function swimTime(s: number) {
  const m = Math.floor(s / 60)
  const rest = (s - m * 60).toFixed(2).padStart(5, '0')
  return m ? `${m}:${rest}` : rest
}
const toSeconds = (time: string) => time.split(':').reduce((sum, part) => sum * 60 + Number(part), 0)
const signed = (s: number) => `${s >= 0 ? '+' : '−'}${Math.abs(s).toFixed(2)}`

type Swimmer = { code: string; name: string; lane: number; seed?: string; final: number; splits: number[]; reaction: number }

function field(race: Race): Swimmer[] {
  const results = SWIM_FIXTURES[race.time]?.results ?? []
  return (race.lanes ?? []).map((code, i) => {
    const semi = FREE200_SEMIS.find((s) => s.code === code)
    const placed = results.find((r) => r.code === code)
    const final = placed?.time ? toSeconds(placed.time) : semi ? toSeconds(semi.time) - 0.9 : 110
    // Each swimmer goes out a little faster or slower than the typical pace
    const splits = PACE.map((share, w) => (w === PACE.length - 1 ? final : final * (share + (seedUnit(`swim:${race.time}:${code}:${w}`) - 0.5) * 0.008)))
    return { code, name: placed?.name ?? semi?.name ?? countryName(code), lane: i + 1, seed: semi?.time, final, splits, reaction: 0.58 + seedUnit(`swim:react:${code}`) * 0.12 }
  })
}

export type RaceBoard = {
  /** What the board is showing, e.g. "Start list", "At 100m", "Final" */
  label: string
  valueLabel: string
  rows: BoardRow[]
  /** Leader's pace against the world record, at the latest wall */
  pace?: string
}

export function raceBoard(session: Session, race: Race, viewMs: number, mine: string): RaceBoard | undefined {
  if (!race.lanes) return undefined
  const swimmers = field(race)
  const { start, resultAt } = raceTimes(session, race)
  const e = (viewMs - start) / 1000
  const record = RECORDS[race.time]

  if (e < 0) {
    return {
      label: 'Start list',
      valueLabel: 'Lane · semifinal time',
      rows: swimmers.map((s) => ({ id: s.code, rank: String(s.lane), code: s.code, name: s.name, value: s.seed, highlight: s.code === mine })),
    }
  }

  const leaderAt = (w: number) => Math.min(...swimmers.map((s) => s.splits[w]))
  const wall = PACE.findLastIndex((_, w) => leaderAt(w) <= e)

  if (wall < 0) {
    const byReaction = [...swimmers].sort((x, y) => x.reaction - y.reaction)
    return {
      label: 'Off the blocks',
      valueLabel: 'Reaction',
      rows: byReaction.map((s, i) => ({ id: s.code, rank: String(i + 1), code: s.code, name: s.name, value: s.reaction.toFixed(2), highlight: s.code === mine, aside: `Lane ${s.lane}` })),
    }
  }

  const finished = viewMs >= resultAt
  const sorted = [...swimmers].sort((x, y) => x.splits[wall] - y.splits[wall])
  const lead = sorted[0].splits[wall]
  const medals = ['🥇', '🥈', '🥉']
  const rows: BoardRow[] = sorted.map((s, i) => {
    const there = s.splits[wall] <= e
    return {
      id: s.code,
      rank: finished && i < 3 ? medals[i] : String(i + 1),
      code: s.code,
      name: s.name,
      value: there ? swimTime(s.splits[wall]) : '–',
      gap: there && i > 0 ? signed(s.splits[wall] - lead) : undefined,
      highlight: s.code === mine,
      aside: `Lane ${s.lane}`,
    }
  })
  const distance = (wall + 1) * POOL_M
  const vsRecord = record && lead - record.world * PACE[wall]
  return {
    label: finished ? 'Final result' : wall === PACE.length - 1 ? 'Finish' : `At ${distance}m`,
    valueLabel: finished || wall === PACE.length - 1 ? 'Time' : 'Split',
    rows,
    pace:
      vsRecord === undefined
        ? undefined
        : finished
          ? lead < record.world
            ? 'New world record'
            : lead < record.olympic
              ? 'New Olympic record'
              : `${signed(vsRecord)}s off the world record`
          : `Leader ${signed(vsRecord)}s ${vsRecord < 0 ? 'under' : 'over'} world record pace at ${distance}m`,
  }
}
