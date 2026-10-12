import type { Session } from '@/data/la28'
import { athletes } from '@/data/mock'
import { atMs } from './status'

// Fictional fixtures for the Standing tab. Everything here is made up; only the session ids,
// race times and lane codes line up with src/data/la28.ts.

const nameOf = (id: string) => athletes.find((a) => a.id === id)?.name ?? id

// ---------------------------------------------------------------------------
// Swimming: s_swim_0720
// ---------------------------------------------------------------------------

export type SwimResult = { code: string; name: string; time: string }

export type SwimFixture = {
  /** From the start gun to official result, in seconds */
  durationS: number
  /** What the result list means, e.g. "Fastest qualifiers" (default: Result) */
  label?: string
  results: SwimResult[]
  /** Room picks: opens/closes at 'HH:mm' on the session day, over these country codes */
  picks?: { opensAt: string; closesAt: string; options: string[] }
}

// Keyed by the race time in SCHEDULE
export const SWIM_FIXTURES: Record<string, SwimFixture> = {
  '18:35': {
    durationS: 150,
    results: [
      { code: 'AUS', name: nameOf('byrne'), time: '57.62' },
      { code: 'USA', name: 'Grace Whitman', time: '57.91' },
      { code: 'CAN', name: 'Chloe Marchand', time: '58.20' },
    ],
    picks: { opensAt: '18:20', closesAt: '18:34', options: ['AUS', 'USA', 'CAN', 'GBR'] },
  },
  '18:58': {
    durationS: 600,
    label: 'Fastest qualifiers',
    results: [
      { code: 'NED', name: 'Pieter van Dam', time: '58.71' },
      { code: 'GBR', name: 'Sam Whitfield', time: '58.83' },
      { code: 'JPN', name: 'Kenta Mori', time: '58.95' },
    ],
  },
  '19:28': {
    durationS: 105,
    results: [
      { code: 'GBR', name: 'Callum Reid', time: '1:43.52' },
      { code: 'USA', name: nameOf('hale'), time: '1:43.77' },
      { code: 'KOR', name: nameOf('park'), time: '1:44.01' },
    ],
    picks: { opensAt: '19:21', closesAt: '19:27', options: ['GBR', 'USA', 'AUS', 'CHN'] },
  },
  '20:20': {
    durationS: 480,
    results: [
      { code: 'AUS', name: 'Australia', time: '7:38.41' },
      { code: 'USA', name: 'United States', time: '7:38.96' },
      { code: 'CHN', name: 'China', time: '7:39.60' },
    ],
    picks: { opensAt: '20:05', closesAt: '20:19', options: ['AUS', 'USA', 'CHN', 'GBR'] },
  },
}

/** Start gun and official result time of a race in the session. */
export function raceTimes(session: Session, race: NonNullable<Session['races']>[number]) {
  const start = atMs(session.date, race.time)
  return { start, resultAt: start + (SWIM_FIXTURES[race.time]?.durationS ?? 600) * 1000 }
}

// ---- Men's 200m freestyle: heats -> semifinals -> final ----

// The race in SCHEDULE these entries are for
export const FREE200_RACE = '19:28'

export type Semi = { code: string; name: string; time: string; semi: 1 | 2 }

// Sorted fastest first. The 8 fastest reach the final; lanes follow the usual order (fastest in lane 4).
export const FREE200_SEMIS: Semi[] = [
  { code: 'CHN', name: 'Wei Haoran', time: '1:45.02', semi: 1 },
  { code: 'ROU', name: 'Matei Popescu', time: '1:45.11', semi: 2 },
  { code: 'AUS', name: 'Mason Kerr', time: '1:45.20', semi: 1 },
  { code: 'KOR', name: nameOf('park'), time: '1:45.34', semi: 2 },
  { code: 'USA', name: nameOf('hale'), time: '1:45.41', semi: 1 },
  { code: 'JPN', name: 'Ren Tanabe', time: '1:45.57', semi: 2 },
  { code: 'GBR', name: 'Callum Reid', time: '1:45.66', semi: 1 },
  { code: 'GER', name: 'Jonas Brandt', time: '1:45.79', semi: 2 },
  { code: 'FRA', name: 'Hugo Lambert', time: '1:45.88', semi: 1 },
  { code: 'ITA', name: 'Marco Ferraro', time: '1:45.93', semi: 2 },
  { code: 'CAN', name: 'Owen Tait', time: '1:46.05', semi: 1 },
  { code: 'NED', name: 'Daan Visser', time: '1:46.19', semi: 2 },
  { code: 'BRA', name: 'Thiago Ramos', time: '1:46.30', semi: 1 },
  { code: 'HUN', name: 'Bence Kovacs', time: '1:46.44', semi: 2 },
  { code: 'SWE', name: 'Elias Lund', time: '1:46.61', semi: 1 },
  { code: 'NZL', name: 'Finn Harper', time: '1:46.82', semi: 2 },
]

export const FREE200_FINAL_SPOTS = 8

/** Final swimmer for a country code (names come from the semifinal fixture). */
export const free200Swimmer = (code: string) => FREE200_SEMIS.find((s) => s.code === code)

// ---------------------------------------------------------------------------
// Brackets and groups
// ---------------------------------------------------------------------------

// `place`: filled from the session's group table (1st, 2nd...) while the group is still open
export type Slot = { code?: string; label?: string; place?: number }

export type Tie = {
  a: Slot
  b: Slot
  /** Short date/time line, e.g. 'Jul 23 · 8:00 PM' */
  when?: string
  /** Final score if played; `winner` settles shootouts */
  score?: [number, number]
  winner?: 'a' | 'b'
  /** e.g. 'after penalties' */
  note?: string
  /** This is the game the room is about */
  here?: boolean
}

export type BracketRound = { name: string; ties: Tie[] }
export type Bracket = { title: string; rounds: BracketRound[] }

const TBD = (label: string): Slot => ({ label })
const GROUP_A = (place: number, label: string): Slot => ({ place, label })

export const BRACKETS: Record<string, Bracket> = {
  // Men's basketball knockout: the group A slots follow the live table
  s_bball_0720: {
    title: "Men's quarterfinals",
    rounds: [
      {
        name: 'Quarterfinals',
        ties: [
          { a: GROUP_A(1, '1st Group A'), b: TBD('2nd Group B'), when: 'Jul 25 · 12:00 PM' },
          { a: TBD('1st Group B'), b: GROUP_A(2, '2nd Group A'), when: 'Jul 25 · 3:00 PM' },
          { a: TBD('1st Group C'), b: TBD('2nd Group D'), when: 'Jul 25 · 5:30 PM' },
          { a: TBD('1st Group D'), b: TBD('2nd Group C'), when: 'Jul 25 · 8:00 PM' },
        ],
      },
      {
        name: 'Semifinals',
        ties: [
          { a: TBD('Winner QF 1'), b: TBD('Winner QF 2'), when: 'Jul 27' },
          { a: TBD('Winner QF 3'), b: TBD('Winner QF 4'), when: 'Jul 27' },
        ],
      },
      { name: 'Final', ties: [{ a: TBD('Winner SF 1'), b: TBD('Winner SF 2'), when: 'Jul 29' }] },
    ],
  },
  // Women's basketball knockout, this session is the Nigeria v Spain quarterfinal
  s_bball_0723: {
    title: "Women's knockout",
    rounds: [
      {
        name: 'Quarterfinals',
        ties: [
          { a: { code: 'NGR' }, b: { code: 'ESP' }, when: 'Jul 23 · 8:00 PM', here: true },
          { a: { code: 'USA' }, b: { code: 'FRA' }, when: 'Jul 23 · 5:30 PM' },
          { a: { code: 'AUS' }, b: { code: 'CAN' }, when: 'Jul 23 · 3:00 PM' },
          { a: { code: 'JPN' }, b: { code: 'SRB' }, when: 'Jul 23 · 12:30 PM' },
        ],
      },
      {
        name: 'Semifinals',
        ties: [
          { a: TBD('Winner NGR v ESP'), b: TBD('Winner USA v FRA'), when: 'Jul 25' },
          { a: TBD('Winner AUS v CAN'), b: TBD('Winner JPN v SRB'), when: 'Jul 25' },
        ],
      },
      { name: 'Final', ties: [{ a: TBD('Winner semifinal 1'), b: TBD('Winner semifinal 2'), when: 'Jul 27' }] },
    ],
  },
  // Men's football knockout, this session is the Brazil v Japan semifinal
  s_fb_0722: {
    title: "Men's knockout",
    rounds: [
      {
        name: 'Quarterfinals',
        ties: [
          { a: { code: 'BRA' }, b: { code: 'ARG' }, score: [2, 0], winner: 'a' },
          { a: { code: 'JPN' }, b: { code: 'KOR' }, score: [1, 1], winner: 'a', note: 'after penalties, 4–3' },
          { a: { code: 'ESP' }, b: { code: 'FRA' }, score: [2, 1], winner: 'a' },
          { a: { code: 'MAR' }, b: { code: 'MEX' }, score: [1, 0], winner: 'a' },
        ],
      },
      {
        name: 'Semifinals',
        ties: [
          { a: { code: 'BRA' }, b: { code: 'JPN' }, when: 'Jul 22 · 2:00 PM', here: true },
          { a: { code: 'ESP' }, b: { code: 'MAR' }, when: 'Jul 22 · 5:00 PM' },
        ],
      },
      { name: 'Final', ties: [{ a: TBD('Winner BRA v JPN'), b: TBD('Winner ESP v MAR'), when: 'Jul 25' }] },
    ],
  },
}

// ---- Basketball men's group A (before today's game) ----

export type GroupRow = { code: string; w: number; l: number; pf: number; pa: number }

export type Group = {
  name: string
  /** Top N reach the quarterfinals */
  advance: number
  rows: GroupRow[]
  /** The group game in this session: its live score is added on top of the rows */
  today?: { teams: [string, string] }
}

// Standings before the Serbia v Australia game. Two games played each; France v Canada is
// not counted here to keep the example small.
export const GROUPS: Record<string, Group> = {
  s_bball_0720: {
    name: 'Group A',
    advance: 2,
    today: { teams: ['SRB', 'AUS'] },
    rows: [
      { code: 'FRA', w: 2, l: 0, pf: 168, pa: 150 },
      { code: 'AUS', w: 1, l: 1, pf: 160, pa: 156 },
      { code: 'SRB', w: 1, l: 1, pf: 150, pa: 152 },
      { code: 'CAN', w: 0, l: 2, pf: 140, pa: 158 },
    ],
  },
}
