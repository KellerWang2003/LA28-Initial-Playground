import { useSyncExternalStore } from 'react'
import { SCHEDULE, type Session } from '@/data/la28'

// How a fan joins a game's activity room. Watch parties would be a third mode here.
export type AttendMode = 'venue' | 'online'

export const ATTEND_MODES: { id: AttendMode; label: string; short: string; hint: string }[] = [
  { id: 'venue', label: 'At the venue', short: 'Venue', hint: 'You have a ticket. We check you are at the venue when the room opens.' },
  { id: 'online', label: 'Watching online', short: 'Online', hint: 'You watch from anywhere and join the same room.' },
]

export const modeLabel = (mode: AttendMode) => ATTEND_MODES.find((m) => m.id === mode)!.label

export type MyGame = { session: string; mode: AttendMode }

// In-memory, like the rest of the demo. Seeded so every card state shows:
// live, upcoming at the venue, upcoming online, and finished (recap ready).
const SEED: MyGame[] = [
  { session: 's_swim_0720', mode: 'venue' },
  { session: 's_athl_0721', mode: 'venue' },
  { session: 's_fb_0722', mode: 'online' },
  { session: 's_fb_w_0720', mode: 'online' },
]

let games: MyGame[] = [...SEED]
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useMyGames() {
  return useSyncExternalStore(subscribe, () => games)
}

export function getMyGames() {
  return games
}

// Add a game, or change how you attend one you already added
export function setGame(session: string, mode: AttendMode) {
  games = games.some((g) => g.session === session)
    ? games.map((g) => (g.session === session ? { ...g, mode } : g))
    : [...games, { session, mode }]
  emit()
}

export function removeGame(session: string) {
  games = games.filter((g) => g.session !== session)
  emit()
}

export function resetMyGames() {
  games = [...SEED]
  emit()
}

export const gameFor = (list: MyGame[], session: string) => list.find((g) => g.session === session)

// The activity room opens this long before the start
export const ROOM_OPENS_BEFORE_S = 30 * 60

// The room is open while the game is live, and from ROOM_OPENS_BEFORE_S before the start
export function isRoomOpen(session: Session, now: number) {
  if (session.status === 'finished') return false
  return session.status === 'live' || now >= Date.parse(`${session.date}T${session.start}`) - ROOM_OPENS_BEFORE_S * 1000
}

// Live first, then upcoming by time, then finished (newest first)
const statusRank = { live: 0, upcoming: 1, finished: 2 } as const
const startKey = (s: Session) => `${s.date}${s.start}`

export function planned(list: MyGame[]) {
  return list
    .flatMap((g) => {
      const session = SCHEDULE.find((s) => s.id === g.session)
      return session ? [{ ...g, sessionData: session }] : []
    })
    .sort((a, b) => {
      const sa = a.sessionData
      const sb = b.sessionData
      if (sa.status !== sb.status) return statusRank[sa.status] - statusRank[sb.status]
      return sa.status === 'finished' ? startKey(sb).localeCompare(startKey(sa)) : startKey(sa).localeCompare(startKey(sb))
    })
}
