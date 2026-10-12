import { placeById, type Session } from '@/data/la28'
import { medalTable } from '@/data/mock'
import { CROWD_COUNTRIES, languageById, type CrowdCountry } from '../crowd'
import {
  GUESS_TRUTH,
  choiceDist,
  countriesSpeaking,
  farthestFan,
  goalCountries,
  guessStats,
  helloDist,
  languagesInRoom,
  mostDivided,
  nightOwl,
  originDist,
  roomFavourite,
  shareOf,
  topId,
} from '../game/crowd-model'
import { metaOf } from '../game/round-meta'
import { MIN_GROUP, crowdFor, languageMix } from '../room/model'
import { seedUnit, seedWinner } from '../seed'
import type { Round } from '../types'

// Turns a session, the fan's answers and the mock crowd into recap awards and personal stats.
// Pure: same inputs, same recap. Everything is country-level and aggregated.

export { MIN_GROUP }

export type Tint = 'amber' | 'sky' | 'emerald' | 'rose' | 'violet'

export type Award = {
  id: string
  emoji: string
  title: string
  /** The big number or phrase */
  big: string
  /** One-line fun fact */
  line: string
  tint: Tint
  /** How the fan compares, when they played the round */
  you?: { text: string; match: boolean }
}

export type RoomCountry = CrowdCountry & { fans: number; venueFans: number; onlineFans: number }

export type Room = { fans: number; venueFans: number; onlineFans: number; countries: RoomCountry[] }

export type Personal = {
  points: number
  rank: number
  of: number
  topPercent: number
  accuracy: { right: number; of: number } | null
  bestStreak: number
  country: RoomCountry | undefined
  medalRank: number | null
  roomRank: number
  met: RoomCountry[]
}

export type RecapInput = {
  session: Session
  rounds: Round[]
  answers: Record<string, string>
  score: { points: number; correct: number; answered: number; bestStreak: number }
  myCountry: string
  /** Mock clock in ms, rounded to the minute */
  nowMs: number
}

export type Recap = {
  room: Room
  awards: Award[]
  personal: Personal | null
  /** Plain-words examples of what the aggregated data tells LA28 */
  learns: string[]
}

// ---- Geography and time ----

const EARTH_KM = 6371

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLng = (lng2 - lng1) * rad
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_KM * Math.asin(Math.sqrt(a))
}

const LA_TZ = -7

// 14:20 -> minutes since midnight in the app's own (Los Angeles) time
const appMinutes = (ms: number) => {
  const d = new Date(ms)
  return d.getHours() * 60 + d.getMinutes()
}

// Minutes since midnight in a country, from the app's clock
const localMinutes = (ms: number, tz: number) => (((appMinutes(ms) + Math.round((tz - LA_TZ) * 60)) % 1440) + 1440) % 1440

export function formatClock(minutes: number) {
  const h = Math.floor(minutes / 60) % 24
  const m = String(minutes % 60).padStart(2, '0')
  return `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`
}

const pct = (share: number) => Math.round(share * 100)
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const km = (n: number) => `${(Math.round(n / 10) * 10).toLocaleString('en-US')} km`
const optionIds = (round: Round) => round.options?.map((o) => o.id) ?? []
const optionOf = (round: Round, id: string) => round.options?.find((o) => o.id === id)
const optionText = (round: Round, id: string) => {
  const o = optionOf(round, id)
  return o ? `${o.emoji ? `${o.emoji} ` : ''}${o.label}` : id
}

// ---- The room ----

// The same crowd model as the rest of the room (room/model.ts), so fans, venue/online and countries always agree.
// Countries under MIN_GROUP stay hidden, but their fans still count in the totals.
export function roomFor(session: Session): Room {
  const crowd = crowdFor(session)
  return {
    fans: crowd.total,
    venueFans: crowd.venue,
    onlineFans: crowd.online,
    countries: crowd.visible.map(({ count, venueCount, onlineCount, ...c }) => ({
      ...c,
      fans: count,
      venueFans: venueCount,
      onlineFans: onlineCount,
    })),
  }
}

// ---- Awards ----
//
// Scripted rounds (the hero session) read the same mock crowd model as CrowdPlay's results, so the
// recap always agrees with what the fan saw. Sessions without rounds use the scaled room instead.

type Ctx = RecapInput & { room: Room; at: number }

const CLOCK_ROUND = /clock|time of day|what time/i
const isClockRound = (r: Round) => r.kind === 'pick-one' && CLOCK_ROUND.test(`${r.id} ${r.title}`)

const bigCountries = (room: Room) => room.countries.filter((c) => c.fans >= MIN_GROUP)
const fansLabel = (n: number) => n.toLocaleString('en-US')

// The room's countries by fans, as a "top countries" award. `counts` can come from a round or the room.
function topCountriesAward(counts: { c: CrowdCountry; n: number }[]): Award | null {
  const total = counts.reduce((s, x) => s + x.n, 0)
  const top = [...counts].sort((a, b) => b.n - a.n).slice(0, 3)
  if (!total || top.length === 0) return null
  const share = top.reduce((s, x) => s + x.n, 0) / total
  return {
    id: 'top-countries',
    emoji: '🌍',
    title: 'Top countries',
    big: top.map((x) => x.c.flag).join(' '),
    line: `${top.map((x) => x.c.name).join(', ')} made up ${pct(share)}% of the room.`,
    tint: 'sky',
  }
}

const farthestAward = (country: CrowdCountry, km_: number, fans: number, venue: string): Award => ({
  id: 'farthest',
  emoji: '✈️',
  title: 'Farthest fan',
  big: km(km_),
  line: `${country.flag} ${fansLabel(fans)} fans in ${country.name} were that far from the ${venue}.`,
  tint: 'amber',
})

// Where the fans are from: from the "where are you from" round, or from the room itself
function originAwards(ctx: Ctx, round?: Round): (Award | null | undefined)[] {
  const venue = placeById(ctx.session.venue)
  if (round) {
    const dist = originDist(ctx.answers[round.id])
    const far = farthestFan(dist)
    // Shares and head counts come from the room itself, so they match CrowdPlay
    const fansIn = (code: string) => ctx.room.countries.find((c) => c.code === code)?.fans ?? dist.counts[code] ?? 0
    return [
      topCountriesAward(ctx.room.countries.map((c) => ({ c, n: c.fans }))),
      far && farthestAward(far.country, far.km, fansIn(far.country.code), venue?.name ?? 'the venue'),
    ]
  }
  const far = venue
    ? bigCountries(ctx.room)
        .map((c) => ({ c, d: haversineKm(venue.lat, venue.lng, c.lat, c.lng) }))
        .sort((a, b) => b.d - a.d)[0]
    : undefined
  return [topCountriesAward(ctx.room.countries.map((c) => ({ c, n: c.fans }))), far && farthestAward(far.c, far.d, far.c.fans, venue!.name)]
}

// The country with the deepest night (or earliest morning) among fans watching from home
function nightOwlAward(ctx: Ctx, clockRound?: Round): Award | null {
  const owl = clockRound
    ? nightOwl(ctx.at)
    : bigCountries(ctx.room)
        .filter((c) => c.onlineFans >= MIN_GROUP)
        .map((c) => ({ c, away: Math.abs(((localMinutes(ctx.at, c.tz) - 210 + 720 + 1440) % 1440) - 720) }))
        .filter((x) => x.away <= 150)
        .sort((a, b) => a.away - b.away || b.c.onlineFans - a.c.onlineFans)[0]?.c
  if (!owl) return null
  const minutes = localMinutes(ctx.at, owl.tz)
  const early = minutes >= 300 && minutes < 480
  return {
    id: 'night-owl',
    emoji: early ? '🌅' : '🦉',
    title: early ? 'Early bird' : 'Night owl',
    big: formatClock(minutes),
    line: `${owl.flag} ${fansLabel(ctx.room.countries.find((c) => c.code === owl.code)?.onlineFans ?? owl.online)} fans in ${owl.name} were watching at this hour.`,
    tint: 'violet',
  }
}

// How many fans each of the two teams has in the room
function teamFansAward(ctx: Ctx): Award | null {
  const [a, b] = (ctx.session.teams ?? []).map((code) => ctx.room.countries.find((c) => c.code === code))
  if (!a || !b) return null
  return {
    id: 'team-fans',
    emoji: '🆚',
    title: 'Team fans',
    big: `${a.flag} ${fansLabel(a.fans)} · ${fansLabel(b.fans)} ${b.flag}`,
    line: `${a.name} fans ${a.fans >= b.fans ? 'outnumbered' : 'were outnumbered by'} ${b.name} fans in the room.`,
    tint: 'rose',
  }
}

function venueOnlineAward(room: Room): Award {
  return {
    id: 'venue-online',
    emoji: '🏟️',
    title: 'Venue vs. couch',
    big: `${pct(room.venueFans / room.fans)}% in the stands`,
    line: `${fansLabel(room.onlineFans)} fans joined from home and ${fansLabel(room.venueFans)} from the venue.`,
    tint: 'emerald',
  }
}

function helloAwards(ctx: Ctx, round: Round): Award[] {
  const dist = helloDist(round, ctx.answers[round.id])
  const spoken = languagesInRoom(dist)
  const named = Object.entries(dist.counts)
    .filter(([, n]) => n >= MIN_GROUP)
    .sort((a, b) => b[1] - a[1])
  const mine = ctx.answers[round.id]
  const myLang = mine ? languageById(mine) : undefined
  const common = languageById(named[0]?.[0] ?? 'en')
  const out: Award[] = [
    {
      id: `${round.id}-languages`,
      emoji: '👋',
      title: 'Hello, world',
      big: `${spoken} languages`,
      line: `The room said hello in ${spoken} languages, most often “${common?.hello}”.`,
      tint: 'rose',
      you: myLang ? { text: `You said “${myLang.hello}” (${myLang.name})`, match: myLang.id === common?.id } : undefined,
    },
  ]
  const rare = named[named.length - 1]
  const rareLang = rare && languageById(rare[0])
  if (rareLang && rare[0] !== named[0]?.[0]) {
    out.push({
      id: `${round.id}-rare`,
      emoji: '✨',
      title: 'Rarest hello',
      big: rareLang.hello,
      line: `${rareLang.name}, said by about ${fansLabel(Math.round(rare[1] / 5) * 5)} fans.`,
      tint: 'rose',
      you: myLang?.id === rareLang.id ? { text: 'That was you', match: true } : undefined,
    })
  }
  return out
}

function mostCommonAward(ctx: Ctx, round: Round): Award | null {
  const ids = optionIds(round)
  if (ids.length < 2) return null
  const dist = choiceDist(round, ctx.answers[round.id])
  const ranked = [...ids].sort((a, b) => dist.counts[b] - dist.counts[a])
  const mine = ctx.answers[round.id]
  return {
    id: `${round.id}-common`,
    emoji: optionOf(round, ranked[0])?.emoji ?? '📊',
    title: round.title,
    big: optionOf(round, ranked[0])?.label ?? ranked[0],
    line: `${pct(shareOf(dist, ranked[0]))}% of the room picked it, ahead of ${optionOf(round, ranked[1])?.label ?? ranked[1]}.`,
    tint: 'emerald',
    you: mine ? { text: `You: ${optionText(round, mine)}`, match: mine === ranked[0] } : undefined,
  }
}

function dividedAward(ctx: Ctx, round: Round): Award | null {
  const ids = optionIds(round)
  const best = ids.length === 2 ? mostDivided(round) : undefined
  if (!best) return null
  const [a, b] = ids
  const shareA = best.share
  const winner = roomFavourite(round)
  const mine = ctx.answers[round.id]
  return {
    id: `${round.id}-divided`,
    emoji: '⚖️',
    title: 'Most divided country',
    big: `${best.country.flag} ${best.country.name}`,
    line: `${optionOf(round, a)?.label} ${pct(shareA)}% vs. ${optionOf(round, b)?.label} ${pct(1 - shareA)}%. The room overall: ${optionOf(round, winner)?.label}.`,
    tint: 'amber',
    you: mine ? { text: `You: ${optionOf(round, mine)?.label ?? mine}`, match: mine === winner } : undefined,
  }
}

function predictAward(ctx: Ctx, round: Round): Award | null {
  const ids = optionIds(round)
  if (ids.length < 2) return null
  const dist = choiceDist(round, ctx.answers[round.id])
  const meta = metaOf(round)
  const right = meta.correct
  const mine = ctx.answers[round.id]
  const top = topId(dist)
  // The answer is only known once the round has revealed (after the race)
  const revealed = ctx.at >= Date.parse(round.opensAt) + (round.seconds + (meta.revealDelayS ?? 3)) * 1000
  if (right && right in dist.counts && revealed) {
    return {
      id: `${round.id}-called`,
      emoji: '🎯',
      title: 'Called it',
      big: `${pct(shareOf(dist, right))}% got it right`,
      line: `${optionOf(round, right)?.label ?? right} won, and about ${fansLabel(Math.round(shareOf(dist, right) * ctx.room.fans))} fans saw it coming.`,
      tint: 'sky',
      you: mine ? { text: `You: ${optionOf(round, mine)?.label ?? mine}`, match: mine === right } : undefined,
    }
  }
  return {
    id: `${round.id}-called`,
    emoji: '🎯',
    title: 'Room pick',
    big: optionOf(round, top)?.label ?? top,
    line: `${pct(shareOf(dist, top))}% of the room backed it.${right ? ' The result comes after the race.' : ''}`,
    tint: 'sky',
    you: mine ? { text: `You: ${optionOf(round, mine)?.label ?? mine}`, match: mine === top } : undefined,
  }
}

function guessAward(ctx: Ctx, round: Round): Award {
  const { average } = guessStats(round)
  const mine = ctx.answers[round.id] ? Number(ctx.answers[round.id]) : NaN
  return {
    id: `${round.id}-guess`,
    emoji: '🧮',
    title: 'Wisdom of the room',
    big: `${average} vs. ${GUESS_TRUTH}`,
    line: `The room guessed ${average} countries on average. ${GUESS_TRUTH} showed up.`,
    tint: 'violet',
    you: Number.isFinite(mine) ? { text: `You guessed ${mine}`, match: Math.abs(mine - GUESS_TRUTH) <= Math.abs(average - GUESS_TRUTH) } : undefined,
  }
}

function goalAward(ctx: Ctx, round: Round): Award {
  const target = metaOf(round).goalTarget ?? CROWD_COUNTRIES.length
  const closes = Date.parse(round.opensAt) + round.seconds * 1000
  const joined = ctx.answers[round.id] === 'in'
  const count = Math.min(target, goalCountries(round, Math.min(ctx.at, closes), ctx.myCountry).length + (joined ? 1 : 0))
  const hit = count >= target
  const live = ctx.at < closes
  return {
    id: `${round.id}-goal`,
    emoji: hit ? '🎉' : '🤏',
    title: 'Room goal',
    big: `${count} of ${target} countries`,
    line: hit ? 'Every country said hello. The room hit its goal.' : live ? 'Still in progress. Every country has to say hello.' : 'Just short of every country saying hello.',
    tint: 'emerald',
    you: joined ? { text: 'You were in', match: true } : undefined,
  }
}

// The most surprising awards first, plain "most common pick" cards last
const HIGHLIGHT_ORDER: ((r: Round) => boolean)[] = [
  (r) => r.kind === 'pin-map',
  (r) => r.kind === 'hello',
  (r) => r.kind === 'this-or-that',
  isClockRound,
  (r) => r.kind === 'predict',
  (r) => r.kind === 'guess-crowd',
  (r) => r.kind === 'goal',
]

function awardsFor(ctx: Ctx): Award[] {
  const out: (Award | null | undefined | false)[] = []

  if (ctx.rounds.length === 0) {
    // No scripted rounds: only what the crowd data itself says
    out.push(teamFansAward(ctx), ...originAwards(ctx), nightOwlAward(ctx), venueOnlineAward(ctx.room))
  }

  // Rounds that have not opened yet (a live preview) have nothing to show. Where the fans are from and
  // what time it is for them come from the room itself, so those are always there.
  const opened = ctx.rounds.filter((r) => r.kind === 'pin-map' || isClockRound(r) || Date.parse(r.opensAt) <= ctx.at)
  const rank = (r: Round) => {
    const i = HIGHLIGHT_ORDER.findIndex((test) => test(r))
    return i < 0 ? HIGHLIGHT_ORDER.length : i
  }
  const rounds = [...opened].sort((a, b) => rank(a) - rank(b) || a.opensAt.localeCompare(b.opensAt))

  for (const round of rounds) {
    switch (round.kind) {
      case 'pin-map':
        out.push(...originAwards(ctx, round))
        break
      case 'hello':
        out.push(...helloAwards(ctx, round))
        break
      case 'pick-one':
        out.push(isClockRound(round) ? nightOwlAward(ctx, round) : mostCommonAward(ctx, round))
        break
      case 'poll':
        out.push(mostCommonAward(ctx, round))
        break
      case 'this-or-that':
        out.push(dividedAward(ctx, round))
        break
      case 'predict':
        out.push(predictAward(ctx, round))
        break
      case 'guess-crowd':
        out.push(guessAward(ctx, round))
        break
      case 'goal':
        out.push(goalAward(ctx, round))
        break
    }
  }
  return out.filter((a): a is Award => !!a)
}

// ---- The fan ----

const SCORED_KINDS: Round['kind'][] = ['predict', 'guess-crowd']
const COMPARED_KINDS: Round['kind'][] = ['predict', 'pick-one', 'this-or-that', 'poll']

function personalFor(ctx: Ctx): Personal | null {
  const { room, rounds, answers, score, session } = ctx
  if (rounds.length === 0 || Object.keys(answers).length === 0) return null

  // A plausible rank: more points, better place, with a little deterministic spread
  const strength = score.points / (score.points + 250)
  const percentile = clamp(0.12 + strength * 0.84 + seedUnit(`${session.id}:rank`) * 0.04, 0, 0.995)
  const rank = Math.max(1, Math.round(room.fans * (1 - percentile)))

  const scoredAnswered = rounds.filter((r) => SCORED_KINDS.includes(r.kind) && answers[r.id]).length
  const own = room.countries.find((c) => c.code === ctx.myCountry)
  const medalSorted = [...medalTable].sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze)
  const medalIndex = medalSorted.findIndex((m) => m.code === ctx.myCountry)

  // Countries that most often picked what you picked
  const compared = rounds.filter((r) => COMPARED_KINDS.includes(r.kind) && answers[r.id] && r.options)
  const hello = rounds.find((r) => r.kind === 'hello' && answers[r.id])
  const total = compared.length + (hello ? 1 : 0)
  const matches = (c: RoomCountry) =>
    compared.filter((r) => seedWinner(r.id, optionIds(r), c.code) === answers[r.id]).length +
    (hello && countriesSpeaking(answers[hello.id]).some((s) => s.code === c.code) ? 1 : 0)
  const others = bigCountries(room)
    .filter((c) => c.code !== ctx.myCountry)
    .map((c) => ({ c, n: matches(c) }))
    .sort((a, b) => b.n - a.n || b.c.fans - a.c.fans)
  const need = Math.max(1, Math.ceil(total / 2))
  let met = others.filter((o) => o.n >= need)
  if (met.length === 0) met = others.filter((o) => o.n >= 1)

  return {
    points: score.points,
    rank,
    of: room.fans,
    topPercent: Math.max(1, Math.ceil((rank / room.fans) * 100)),
    accuracy: scoredAnswered > 0 ? { right: Math.min(score.correct, scoredAnswered), of: scoredAnswered } : null,
    bestStreak: score.bestStreak,
    country: own,
    medalRank: medalIndex >= 0 ? medalIndex + 1 : null,
    roomRank: own ? room.countries.findIndex((c) => c.code === own.code) + 1 : 0,
    met: met.map((o) => o.c),
  }
}

// ---- What LA28 learns: aggregated, anonymous examples ----

function learnsFor(ctx: Ctx): string[] {
  const { room } = ctx
  // Same language mix as everywhere else
  const english = languageMix(ctx.session, crowdFor(ctx.session)).find((l) => l.id === 'en')?.share ?? 0
  const nonEnglish = Math.round((1 - english) * 100)
  const venue = placeById(ctx.session.venue)
  const far = venue
    ? Math.round(
        (room.countries.filter((c) => haversineKm(venue.lat, venue.lng, c.lat, c.lng) > 5000).reduce((s, c) => s + c.fans, 0) / room.fans) * 100,
      )
    : 0
  return [
    `${nonEnglish}% of the room says hello in a language other than English.`,
    `${pct(room.onlineFans / room.fans)}% joined from home, so screens matter as much as seats.`,
    ...(far > 0 ? [`${far}% of fans were more than 5,000 km from the venue.`] : []),
  ]
}

export function buildRecap(input: RecapInput): Recap {
  const room = roomFor(input.session)
  // Live games use the mock clock; finished ones the end of the game
  const at = input.session.status === 'finished' ? Date.parse(`${input.session.date}T${input.session.end}`) : input.nowMs
  const ctx: Ctx = { ...input, room, at }
  return { room, awards: awardsFor(ctx), personal: personalFor(ctx), learns: learnsFor(ctx) }
}