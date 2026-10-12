import { CROWD_COUNTRIES, LANGUAGES, crowdCountry, type CrowdCountry } from '../crowd'
import { MIN_GROUP, languagesOfCountry } from '../room/model'
import { seedShares, seedUnit } from '../seed'
import type { Round } from '../types'
import { metaOf } from './round-meta'

// Mock crowd for the reveals. Everything is derived from the fixture countries and seedShares, so a
// reveal always shows the same numbers. The fan's own answer shifts them by one.


export type Dist = { total: number; counts: Record<string, number> }

export const sizeOf = (c: CrowdCountry) => c.venue + c.online

/** How many fans of a country answered this round (about half to 85%) */
export const participants = (roundId: string, c: CrowdCountry) =>
  Math.round(sizeOf(c) * (0.5 + 0.35 * seedUnit(`${roundId}:in:${c.code}`)))

export const shareOf = (dist: Dist, id: string) => (dist.total ? (dist.counts[id] ?? 0) / dist.total : 0)

export function topId(dist: Dist) {
  return Object.keys(dist.counts).reduce((best, id) => (dist.counts[id] > dist.counts[best] ? id : best))
}

function addMine(dist: Dist, mine?: string): Dist {
  if (!mine || !(mine in dist.counts)) return dist
  return { total: dist.total + 1, counts: { ...dist.counts, [mine]: dist.counts[mine] + 1 } }
}

// ---- Choice rounds (this-or-that, pick-one, predict) ----

const optionIds = (round: Round) => (round.options ?? []).map((o) => o.id)

/** One country's split, with the fan's pick added when they are from there */
export function countryChoice(round: Round, c: CrowdCountry, mine?: string, myCountry?: string): Dist {
  const ids = optionIds(round)
  const n = participants(round.id, c)
  const shares = seedShares(round.id, ids, c.code)
  const counts = Object.fromEntries(ids.map((id) => [id, shares[id] * n]))
  const dist: Dist = { total: n, counts }
  return c.code === myCountry ? addMine(dist, mine) : dist
}

/** The whole room: every country's split added up */
export function choiceDist(round: Round, mine?: string): Dist {
  const ids = optionIds(round)
  const counts = Object.fromEntries(ids.map((id) => [id, 0]))
  let total = 0
  for (const c of CROWD_COUNTRIES) {
    const part = countryChoice(round, c)
    total += part.total
    for (const id of ids) counts[id] += part.counts[id]
  }
  return addMine({ total, counts }, mine)
}

/** The room's favourite without the fan's own vote, so matching it is not self-fulfilling */
export const roomFavourite = (round: Round) => topId(choiceDist(round))

/** Country whose split is closest to 50/50 for a two-option round (groups below MIN_GROUP skipped) */
export function mostDivided(round: Round) {
  const [a] = optionIds(round)
  let best: { country: CrowdCountry; share: number } | undefined
  for (const c of CROWD_COUNTRIES) {
    const dist = countryChoice(round, c)
    if (dist.total < MIN_GROUP) continue
    const share = shareOf(dist, a)
    if (!best || Math.abs(share - 0.5) < Math.abs(best.share - 0.5)) best = { country: c, share }
  }
  return best
}

// ---- Where are you from ----

const SOFI = { lat: 33.95, lng: -118.34 }

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

// The same share of every country answers, so the shares match the recap's "Who was here"
const ORIGIN_ANSWER_RATE = 0.62

export function originDist(mine?: string): Dist {
  const counts = Object.fromEntries(CROWD_COUNTRIES.map((c) => [c.code, Math.round(sizeOf(c) * ORIGIN_ANSWER_RATE)]))
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  return addMine({ total, counts }, mine)
}

/** The country whose fans are farthest from the stadium, to the nearest 100 km (country centroid) */
export function farthestFan(dist: Dist) {
  let best: { country: CrowdCountry; km: number } | undefined
  for (const c of CROWD_COUNTRIES) {
    if ((dist.counts[c.code] ?? 0) <= 0) continue
    const km = distanceKm(SOFI, c)
    if (!best || km > best.km) best = { country: c, km }
  }
  return best && { country: best.country, km: Math.round(best.km / 100) * 100 }
}

// ---- Hello ----

// Languages per country come from the room model (room/model.ts), so both agree.

export function helloDist(round: Round, mine?: string): Dist {
  const counts = Object.fromEntries(LANGUAGES.map((l) => [l.id, 0]))
  for (const c of CROWD_COUNTRIES) {
    const n = participants(round.id, c)
    for (const [id, share] of languagesOfCountry(c.code)) counts[id] += n * share
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  return addMine({ total, counts }, mine)
}

export const languagesInRoom = (dist: Dist) => Object.values(dist.counts).filter((n) => n >= 1).length

/** Countries that speak a language, biggest first */
export const countriesSpeaking = (languageId: string) =>
  CROWD_COUNTRIES.filter((c) => languagesOfCountry(c.code).some(([id]) => id === languageId)).sort((a, b) => sizeOf(b) - sizeOf(a))

// ---- What time is it for you ----

// The app clock is Los Angeles time (UTC-7 in July)
const LA_TZ = -7

export function localTime(now: number, tz: number) {
  const d = new Date(now)
  const minutes = (((d.getHours() * 60 + d.getMinutes() + (tz - LA_TZ) * 60) % 1440) + 1440) % 1440
  return { h: Math.floor(minutes / 60), m: minutes % 60, minutes }
}

export function formatLocal(now: number, tz: number) {
  const { h, m } = localTime(now, tz)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

export const isDaytime = (now: number, tz: number) => {
  const { h } = localTime(now, tz)
  return h >= 6 && h < 20
}

export function dayPart(now: number, tz: number) {
  const { h } = localTime(now, tz)
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 22) return 'evening'
  return 'night'
}

/** What the room really answers: each country's actual time of day */
export function clockDist(round: Round, now: number, mine?: string): Dist {
  const counts: Record<string, number> = Object.fromEntries(optionIds(round).map((id) => [id, 0]))
  let total = 0
  for (const c of CROWD_COUNTRIES) {
    const n = participants(round.id, c)
    counts[dayPart(now, c.tz)] += n
    total += n
  }
  return addMine({ total, counts }, mine)
}

/** A country where it is the deepest part of the night right now (closest to 3:30 AM) */
export function nightOwl(now: number) {
  let best: { country: CrowdCountry; distance: number } | undefined
  for (const c of CROWD_COUNTRIES) {
    const { minutes } = localTime(now, c.tz)
    if (minutes >= 5 * 60 && minutes < 22 * 60) continue
    const distance = Math.abs(((minutes - 210 + 720 + 1440) % 1440) - 720)
    if (!best || distance < best.distance) best = { country: c, distance }
  }
  return best?.country
}

// ---- Guess the crowd ----

export const GUESS_TRUTH = CROWD_COUNTRIES.length

export const GUESS_BUCKETS = [
  { id: 'lt15', label: 'Under 15', test: (n: number) => n < 15 },
  { id: '15-24', label: '15 to 24', test: (n: number) => n >= 15 && n < 25 },
  { id: '25-31', label: '25 to 31', test: (n: number) => n >= 25 && n < 32 },
  { id: '32-45', label: '32 to 45', test: (n: number) => n >= 32 && n < 46 },
  { id: '46+', label: '46 or more', test: (n: number) => n >= 46 },
]

export function guessStats(round: Round, mine?: number) {
  const ids = GUESS_BUCKETS.map((b) => b.id)
  const shares = seedShares(round.id, ids)
  const n = participants(round.id, CROWD_COUNTRIES[0]) + 400
  const counts = Object.fromEntries(ids.map((id) => [id, shares[id] * n]))
  const dist = addMine({ total: n, counts }, mine === undefined ? undefined : GUESS_BUCKETS.find((b) => b.test(mine))?.id)
  const average = Math.round(GUESS_TRUTH + (seedUnit(`${round.id}:avg`) - 0.35) * 16)
  // The best guess from the rest of the room is never more than 1 off
  const bestOther = GUESS_TRUTH + (seedUnit(`${round.id}:best`) < 0.5 ? 0 : 1)
  return { dist, average, bestOther }
}

// ---- Room goal ----

/** Countries that have said hello so far, not counting the fan's own */
export function goalCountries(round: Round, now: number, myCountry: string) {
  const target = metaOf(round).goalTarget ?? CROWD_COUNTRIES.length
  const opens = Date.parse(round.opensAt)
  const progress = Math.min(1, Math.max(0, (now - opens) / (round.seconds * 1000)))
  const others = CROWD_COUNTRIES.filter((c) => c.code !== myCountry).sort(
    (a, b) => seedUnit(`goal:${a.code}`) - seedUnit(`goal:${b.code}`),
  )
  // Starts at about 60% and always ends one short, so the fan's own country finishes it
  const count = Math.min(target - 1, Math.floor((target - 1) * (0.6 + 0.4 * progress)))
  return others.slice(0, count)
}

export const countryName = (code: string) => crowdCountry(code)?.name ?? code
