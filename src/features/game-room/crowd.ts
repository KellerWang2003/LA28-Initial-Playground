import { useSyncExternalStore } from 'react'

// Shared by CrowdPlay (writes answers) and the recap (reads them).
// Everything is mock and in-memory: a reload restores the defaults.

// ---- The fixture crowd for the hero session (s_swim_0720) ----

export type CrowdCountry = {
  code: string
  name: string
  flag: string
  // Country centroid, for the heatmap. Never anything finer: locations stay country-level.
  lat: number
  lng: number
  // UTC offset in hours, for "what time is it where you are"
  tz: number
  venue: number
  online: number
}

// Venue + online adds up to SWIM_CROWD_TOTAL
export const CROWD_COUNTRIES: CrowdCountry[] = [
  { code: 'USA', name: 'United States', flag: '🇺🇸', lat: 37.1, lng: -95.7, tz: -7, venue: 520, online: 226 },
  { code: 'AUS', name: 'Australia', flag: '🇦🇺', lat: -25.3, lng: 133.8, tz: 10, venue: 70, online: 150 },
  { code: 'GBR', name: 'United Kingdom', flag: '🇬🇧', lat: 54.0, lng: -2.0, tz: 1, venue: 40, online: 130 },
  { code: 'CHN', name: 'China', flag: '🇨🇳', lat: 35.9, lng: 104.2, tz: 8, venue: 20, online: 120 },
  { code: 'JPN', name: 'Japan', flag: '🇯🇵', lat: 36.2, lng: 138.3, tz: 9, venue: 25, online: 95 },
  { code: 'KOR', name: 'South Korea', flag: '🇰🇷', lat: 36.5, lng: 127.9, tz: 9, venue: 15, online: 60 },
  { code: 'CAN', name: 'Canada', flag: '🇨🇦', lat: 56.1, lng: -106.3, tz: -7, venue: 35, online: 45 },
  { code: 'BRA', name: 'Brazil', flag: '🇧🇷', lat: -14.2, lng: -51.9, tz: -3, venue: 10, online: 80 },
  { code: 'MEX', name: 'Mexico', flag: '🇲🇽', lat: 23.6, lng: -102.6, tz: -6, venue: 30, online: 40 },
  { code: 'FRA', name: 'France', flag: '🇫🇷', lat: 46.2, lng: 2.2, tz: 2, venue: 10, online: 50 },
  { code: 'GER', name: 'Germany', flag: '🇩🇪', lat: 51.2, lng: 10.5, tz: 2, venue: 10, online: 45 },
  { code: 'ITA', name: 'Italy', flag: '🇮🇹', lat: 41.9, lng: 12.6, tz: 2, venue: 8, online: 40 },
  { code: 'ESP', name: 'Spain', flag: '🇪🇸', lat: 40.5, lng: -3.7, tz: 2, venue: 8, online: 35 },
  { code: 'NED', name: 'Netherlands', flag: '🇳🇱', lat: 52.1, lng: 5.3, tz: 2, venue: 6, online: 30 },
  { code: 'SWE', name: 'Sweden', flag: '🇸🇪', lat: 60.1, lng: 18.6, tz: 2, venue: 4, online: 20 },
  { code: 'NGR', name: 'Nigeria', flag: '🇳🇬', lat: 9.1, lng: 8.7, tz: 1, venue: 5, online: 30 },
  { code: 'KEN', name: 'Kenya', flag: '🇰🇪', lat: -0.0, lng: 37.9, tz: 3, venue: 3, online: 22 },
  { code: 'RSA', name: 'South Africa', flag: '🇿🇦', lat: -30.6, lng: 22.9, tz: 2, venue: 3, online: 25 },
  { code: 'IND', name: 'India', flag: '🇮🇳', lat: 20.6, lng: 79.0, tz: 5.5, venue: 5, online: 55 },
  { code: 'ARG', name: 'Argentina', flag: '🇦🇷', lat: -38.4, lng: -63.6, tz: -3, venue: 3, online: 22 },
  { code: 'COL', name: 'Colombia', flag: '🇨🇴', lat: 4.6, lng: -74.3, tz: -5, venue: 4, online: 20 },
  { code: 'JAM', name: 'Jamaica', flag: '🇯🇲', lat: 18.1, lng: -77.3, tz: -5, venue: 3, online: 12 },
  { code: 'NZL', name: 'New Zealand', flag: '🇳🇿', lat: -40.9, lng: 174.9, tz: 12, venue: 4, online: 16 },
  { code: 'SGP', name: 'Singapore', flag: '🇸🇬', lat: 1.35, lng: 103.8, tz: 8, venue: 2, online: 14 },
  { code: 'TUR', name: 'Turkey', flag: '🇹🇷', lat: 38.9, lng: 35.2, tz: 3, venue: 2, online: 18 },
  { code: 'EGY', name: 'Egypt', flag: '🇪🇬', lat: 26.8, lng: 30.8, tz: 3, venue: 2, online: 14 },
  { code: 'MAR', name: 'Morocco', flag: '🇲🇦', lat: 31.8, lng: -7.1, tz: 1, venue: 2, online: 15 },
  { code: 'PHI', name: 'Philippines', flag: '🇵🇭', lat: 12.9, lng: 121.8, tz: 8, venue: 4, online: 18 },
]

export const SWIM_CROWD_TOTAL = CROWD_COUNTRIES.reduce((sum, c) => sum + c.venue + c.online, 0)

export const crowdCountry = (code: string) => CROWD_COUNTRIES.find((c) => c.code === code)

// The user is a fan in the venue or at home; their country is chosen in the "where are you from" round.
// Until they answer, the mock treats them as from the United States.
export const DEFAULT_MY_COUNTRY = 'USA'

export type Language = { id: string; name: string; hello: string }

export const LANGUAGES: Language[] = [
  { id: 'en', name: 'English', hello: 'Hello' },
  { id: 'es', name: 'Spanish', hello: 'Hola' },
  { id: 'fr', name: 'French', hello: 'Bonjour' },
  { id: 'de', name: 'German', hello: 'Hallo' },
  { id: 'pt', name: 'Portuguese', hello: 'Olá' },
  { id: 'it', name: 'Italian', hello: 'Ciao' },
  { id: 'ja', name: 'Japanese', hello: 'こんにちは' },
  { id: 'ko', name: 'Korean', hello: '안녕하세요' },
  { id: 'zh', name: 'Chinese', hello: '你好' },
  { id: 'ar', name: 'Arabic', hello: 'مرحبا' },
  { id: 'hi', name: 'Hindi', hello: 'नमस्ते' },
  { id: 'sw', name: 'Swahili', hello: 'Jambo' },
  { id: 'yo', name: 'Yoruba', hello: 'Báwo ni' },
  { id: 'tr', name: 'Turkish', hello: 'Merhaba' },
  { id: 'nl', name: 'Dutch', hello: 'Hoi' },
  { id: 'sv', name: 'Swedish', hello: 'Hej' },
  { id: 'tl', name: 'Filipino', hello: 'Kumusta' },
  { id: 'ru', name: 'Russian', hello: 'Привет' },
  { id: 'he', name: 'Hebrew', hello: 'שלום' },
  { id: 'haw', name: 'Hawaiian', hello: 'Aloha' },
]

export const languageById = (id: string) => LANGUAGES.find((l) => l.id === id)

// ---- The fan's own answers and score ----
//
// An answer is a string. Its format depends on the round kind:
//   predict, this-or-that, pick-one, poll: the chosen option id
//   pin-map:     a CrowdCountry code, e.g. 'JPN' (stored under `r_origin` like any other round)
//   hello:       a Language id, e.g. 'ja'
//   guess-crowd: a whole number as text, e.g. '34'
//   goal:        'in' once the fan has joined the room goal
// A skipped round has no entry.

type Room = {
  answers: Record<string, string>
  // Score per round, written once when the round reveals
  scores: Record<string, { points: number; correct: boolean }>
  consented: boolean
}

const EMPTY: Room = { answers: {}, scores: {}, consented: false }
let rooms: Record<string, Room> = {}
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const roomOf = (sessionId: string) => rooms[sessionId] ?? EMPTY

function update(sessionId: string, patch: (room: Room) => Room) {
  rooms = { ...rooms, [sessionId]: patch(roomOf(sessionId)) }
  emit()
}

export function useMyAnswers(sessionId: string) {
  return useSyncExternalStore(subscribe, () => roomOf(sessionId).answers)
}

/** Every session's answers, for rewards that count across games */
export function useAllAnswers(): Record<string, { answers: Record<string, string> }> {
  return useSyncExternalStore(subscribe, () => rooms)
}

export function setMyAnswer(sessionId: string, roundId: string, value: string) {
  update(sessionId, (room) => ({ ...room, answers: { ...room.answers, [roundId]: value } }))
}

export function recordScore(sessionId: string, roundId: string, score: { points: number; correct: boolean }) {
  update(sessionId, (room) => ({ ...room, scores: { ...room.scores, [roundId]: score } }))
}

export type MyScore = { points: number; correct: number; answered: number; streak: number; bestStreak: number }

// Rounds are scored in the order they were recorded
export function scoreSummary(scores: Room['scores'], answers: Room['answers']): MyScore {
  let points = 0
  let correct = 0
  let streak = 0
  let bestStreak = 0
  for (const [roundId, s] of Object.entries(scores)) {
    points += s.points
    if (s.correct) {
      correct += 1
      streak += 1
      bestStreak = Math.max(bestStreak, streak)
    } else if (roundId in answers) {
      streak = 0
    }
  }
  return { points, correct, answered: Object.keys(answers).length, streak, bestStreak }
}

const summaries = new WeakMap<Room, MyScore>()

export function useMyScore(sessionId: string): MyScore {
  return useSyncExternalStore(subscribe, () => {
    const room = roomOf(sessionId)
    let summary = summaries.get(room)
    if (!summary) {
      summary = scoreSummary(room.scores, room.answers)
      summaries.set(room, summary)
    }
    return summary
  })
}

// The "where are you from" round is fixed as `r_origin` for every scripted room
export const ORIGIN_ROUND_ID = 'r_origin'

// The country the fan said they are from, or the default. Where you are from does not change between
// games, so an answer given in one room also counts in the others.
function countryOf(sessionId: string) {
  const answer = roomOf(sessionId).answers[ORIGIN_ROUND_ID] ?? Object.values(rooms).find((r) => r.answers[ORIGIN_ROUND_ID])?.answers[ORIGIN_ROUND_ID]
  return answer && crowdCountry(answer) ? answer : DEFAULT_MY_COUNTRY
}

export function useMyCountry(sessionId: string) {
  return useSyncExternalStore(subscribe, () => countryOf(sessionId))
}

export function useConsent(sessionId: string) {
  return useSyncExternalStore(subscribe, () => roomOf(sessionId).consented)
}

export function giveConsent(sessionId: string) {
  update(sessionId, (room) => ({ ...room, consented: true }))
}

export function resetRoomState() {
  rooms = {}
  emit()
}
