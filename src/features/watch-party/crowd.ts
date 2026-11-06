import { Drum, Flag, Megaphone, Popcorn, type LucideIcon } from 'lucide-react'
import { eventById, sessionById, type GameEvent, type Session } from '@/data/la28'

// Who's in a fan-hosted watch party, seat by seat. Strangers are never shown by
// face or name: a seat shows the fan's country flag, the side they cheer for and
// what they're bringing. Each side of the room has half the seats.

export type Side = 0 | 1

export type Bring = 'flag' | 'drum' | 'snacks' | 'noise'

export const BRINGS: { id: Bring; label: string; icon: LucideIcon }[] = [
  { id: 'flag', label: 'A flag', icon: Flag },
  { id: 'drum', label: 'A drum', icon: Drum },
  { id: 'snacks', label: 'Snacks', icon: Popcorn },
  { id: 'noise', label: 'Noise', icon: Megaphone },
]

export const bringById = (id: Bring) => BRINGS.find((b) => b.id === id)!

export type Seat = {
  cc: string
  side: Side
  bring?: Bring
  host?: boolean
  // When they check in ('HH:MM' on the party's day). Before then the seat is only reserved.
  arrives: string
  // A friend who came with someone: sits next to them
  plusOne?: boolean
}

// Team codes in the schedule are 3 letters; flags need 2
const TEAM_CC: Record<string, string> = {
  BRA: 'BR', JPN: 'JP', MAR: 'MA', CAN: 'CA', USA: 'US', AUS: 'AU', SRB: 'RS', NGR: 'NG', ESP: 'ES', GBR: 'GB', CHN: 'CN',
}
export const teamCc = (team: string) => TEAM_CC[team] ?? ''

const TEAM_NAME: Record<string, string> = {
  BRA: 'Brazil', JPN: 'Japan', MAR: 'Morocco', CAN: 'Canada', USA: 'USA', AUS: 'Australia', SRB: 'Serbia', NGR: 'Nigeria', ESP: 'Spain',
}
export const teamName = (team: string) => TEAM_NAME[team] ?? team

// Seats already taken, by side. Seat numbers are their place in the list (side 0 first).
const CROWDS: Record<string, Seat[]> = {
  e_watch_bramar: [
    { cc: 'BR', side: 0, bring: 'drum', arrives: '19:40' },
    { cc: 'BR', side: 0, arrives: '19:55' },
    { cc: 'MX', side: 0, bring: 'snacks', arrives: '20:05' },
    { cc: 'BR', side: 0, bring: 'flag', arrives: '20:10' },
    { cc: 'US', side: 0, arrives: '20:20' },
    { cc: 'MA', side: 1, host: true, bring: 'flag', arrives: '19:30' },
    { cc: 'MA', side: 1, bring: 'noise', arrives: '19:50' },
    { cc: 'FR', side: 1, arrives: '20:00' },
    { cc: 'MA', side: 1, bring: 'snacks', arrives: '20:15' },
    { cc: 'ES', side: 1, arrives: '20:25' },
    { cc: 'DZ', side: 1, bring: 'flag', arrives: '20:40' },
  ],
  e_watch_fb: [
    { cc: 'BR', side: 0, bring: 'drum', arrives: '13:20' },
    { cc: 'BR', side: 0, arrives: '13:30' },
    { cc: 'PT', side: 0, bring: 'flag', arrives: '13:35' },
    { cc: 'CO', side: 0, host: true, bring: 'snacks', arrives: '13:00' },
    { cc: 'MX', side: 0, arrives: '13:40' },
    { cc: 'JP', side: 1, bring: 'flag', arrives: '13:25' },
    { cc: 'JP', side: 1, arrives: '13:45' },
    { cc: 'KR', side: 1, bring: 'noise', arrives: '13:50' },
  ],
}

export type WatchParty = {
  event: GameEvent
  session: Session
  teams: [string, string]
  seatsPerSide: number
  crowd: Seat[]
}

// A fan-hosted event that shows a game, with its crowd
export function watchPartyById(id: string): WatchParty | null {
  const event = eventById(id)
  const session = event?.watch ? sessionById(event.watch) : undefined
  if (!event || !session?.teams || !event.spots) return null
  return {
    event,
    session,
    teams: [session.teams[0], session.teams[1]],
    seatsPerSide: Math.ceil(event.spots[1] / 2),
    crowd: CROWDS[id] ?? [],
  }
}

export const watchPartyForPin = (pinId: string) => {
  const event = Object.keys(CROWDS).map(eventById).find((e) => e?.pin === pinId)
  return event ? watchPartyById(event.id) : null
}

// ms of a 'HH:MM' on the party's day
export const atTime = (party: WatchParty, hhmm: string) => Date.parse(`${party.event.date}T${hhmm}`)

// The party opens its doors at its own time; the game is on from kickoff to the final whistle
export const doorsAt = (party: WatchParty) => atTime(party, party.event.time)
export const kickoffAt = (party: WatchParty) => atTime(party, party.session.start)
export const fullTimeAt = (party: WatchParty) => atTime(party, party.session.end)

// Check-in opens 30 minutes before the doors and closes at the final whistle
export const CHECK_IN_BEFORE_MS = 30 * 60_000
export const checkInOpen = (party: WatchParty, now: number) => now >= doorsAt(party) - CHECK_IN_BEFORE_MS && now <= fullTimeAt(party)

// How close counts as "here" for a watch party (a bar or a market is bigger than a pin spot)
export const HERE_M = 150

// Everyone who had checked in by the final whistle, by country, host first
export function crowdFlags(party: WatchParty) {
  const end = atTime(party, party.session.end)
  const here = party.crowd.filter((s) => atTime(party, s.arrives) <= end).sort((a, b) => Number(!!b.host) - Number(!!a.host))
  return here.map((s) => s.cc)
}

// A made-up score that moves with the shared clock, so a live party feels live
const GOALS: Record<string, [number, Side][]> = {
  s_fb_m_0720: [[23, 0], [51, 1], [78, 0]],
  s_fb_0722: [[34, 1], [62, 0]],
}

export function liveScore(party: WatchParty, now: number): { minute: number; score: [number, number] } | null {
  const minute = Math.floor((now - kickoffAt(party)) / 60_000)
  if (minute < 0) return null
  const goals = (GOALS[party.session.id] ?? []).filter(([m]) => m <= Math.min(minute, 95))
  return {
    minute: Math.min(minute, 90),
    score: [goals.filter(([, s]) => s === 0).length, goals.filter(([, s]) => s === 1).length],
  }
}
