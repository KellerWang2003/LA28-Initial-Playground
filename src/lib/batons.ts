import { useSyncExternalStore } from 'react'
import { NOW, flag, placeById } from '@/data/la28'
import { formatKm } from '@/data/map-layers'
import {
  BATON_CONFIG,
  BATON_SPOTS,
  BATON_THEMES,
  DAY_THEMES,
  MOCK_CARRIERS,
  MOCK_NOTES,
  themeById,
  type Carrier,
} from '@/data/batons'
import { nowMs } from '@/lib/clock'
import { fanCoords, getFanAt, metersBetween, placeCoords, type FanAt } from '@/lib/location'
import { getProfile } from '@/lib/profile'
import { notify } from '@/lib/toasts'

// Live baton state. A baton is only ever resting at a spot or carried by the
// fan; drop, timeout and the daily reset move it between the two. A carried
// baton has no position anywhere in here, so nothing can show where a carrier is.
// In-memory like the rest of the demo: a reload resets it.

export type Leg = {
  spot: string
  // null: placed there at the start of the day. `me` marks the fan's own leg;
  // `anonymous` carriers chose to show as "Fan from [country]" instead of their name.
  carrier: (Carrier & { me?: boolean; anonymous?: boolean }) | null
  note: string | null
  // When it was dropped (or placed) there, in app ms
  at: number
}

export type Baton = {
  id: string
  theme: string
  state: 'resting' | 'carried'
  // Where it rests. While carried: the spot it was picked up from, where it returns on timeout.
  spot: string
  pickedUpAt: number | null
  expiresAt: number | null
  dayKey: string
  history: Leg[]
}

export type Recap = { id: string; batonId: string; theme: string; dayKey: string; legs: Leg[] }

// One baton the fan carried and dropped, for Passport > Batons
export type LogEntry = {
  id: string
  batonId: string
  theme: string
  dayKey: string
  from: string
  to: string
  note: string | null
  // Signed as "Fan from [country]" rather than their name
  anonymous: boolean
  at: number
  // Saved once the end-of-day recap is closed
  recap: Recap | null
}

type State = {
  day: { key: string; generation: number; ended: boolean }
  batons: Baton[]
  carrying: string | null
  // Passed today: no more nearby alerts for these
  passed: string[]
  // Dropped by the fan today: once you pass a baton on, it's someone else's to carry
  droppedToday: string[]
  notified: string[]
  // Carry reminders already sent for the current carry, in minutes left
  reminded: number[]
  log: LogEntry[]
  // End-of-day recaps waiting to be watched
  pendingRecaps: Recap[]
  // Screens driven from anywhere in the app
  card: string | null
  dropping: boolean
  // The carried baton's sheet, with the note it came with (opens on Accept)
  carrySheet: boolean
  // Just dropped: the drop moment shows this entry
  dropped: string | null
}

export type BatonEvent =
  | 'accepted'
  | 'passed'
  | 'cardClosed'
  | 'dropped'
  | 'dropFinished'
  | 'timedOut'
  | 'dayEnded'
  | 'dayReset'
  | 'recapClosed'

const MIN = 60_000

// ---- Dates ----

export function localDate(ms: number) {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function nextDate(key: string) {
  return localDate(Date.parse(`${key}T12:00`) + 24 * 60 * MIN)
}

// ---- Seeding a day ----

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7)

function shuffle<T>(items: readonly T[], rand: () => number) {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// Earlier legs today, ending at `restSpot`: placed in the morning, then up to
// `maxLegs` fans carried it, each a little later, all before `until`.
function seedHistory(restSpot: string, key: string, until: number, rand: () => number, maxLegs = 3): Leg[] {
  const placedAt = Date.parse(`${key}T08:00`)
  const room = until - 5 * MIN - placedAt
  const count = room > 30 * MIN ? Math.floor(rand() * (maxLegs + 1)) : 0
  const times = Array.from({ length: count }, () => placedAt + 20 * MIN + rand() * (room - 20 * MIN)).sort((a, b) => a - b)
  const carriers = shuffle(MOCK_CARRIERS, rand)
  // Spots before the rest spot, never the same twice in a row
  const path: string[] = []
  for (let i = 0; i < count; i++) {
    const options = BATON_SPOTS.filter((s) => s !== restSpot && s !== path[path.length - 1])
    path.push(options[Math.floor(rand() * options.length)])
  }
  path.push(restSpot)
  return path.map((spot, i) => ({
    spot,
    carrier: i === 0 ? null : { ...carriers[i - 1], anonymous: rand() < 0.3 },
    note: i === 0 ? null : MOCK_NOTES[Math.floor(rand() * MOCK_NOTES.length)],
    at: i === 0 ? placedAt : times[i - 1],
  }))
}

// The day's batons, each resting at a different random spot
function seedDay(key: string, generation: number, now: number): Baton[] {
  const rand = mulberry32(hash(`${key}#${generation}`))
  const themes = DAY_THEMES[key] ?? BATON_THEMES.map((t) => t.id)
  const count = BATON_CONFIG.batonsPerDay[key] ?? BATON_CONFIG.batonsPerDay.default
  const spots = shuffle(BATON_SPOTS, rand)
  return Array.from({ length: count }, (_, i) => ({
    id: `b-${key}-${generation}-${i}`,
    theme: themes[i % themes.length],
    state: 'resting' as const,
    spot: spots[i],
    pickedUpAt: null,
    expiresAt: null,
    dayKey: key,
    history: seedHistory(spots[i], key, now, rand),
  }))
}

// Carried before today, so Passport > Batons has one stamp to replay
const PAST_LEGS: Leg[] = [
  { spot: 'endeavour', carrier: null, note: null, at: Date.parse('2028-07-18T08:00') },
  { spot: 'coliseum', carrier: { name: 'Kwame', cc: 'GH', anonymous: true }, note: 'Back where the 84 torch was lit 🔥', at: Date.parse('2028-07-18T11:12') },
  { spot: 'smpier', carrier: { name: 'Priya', cc: 'GB' }, note: 'Took two buses. Worth it.', at: Date.parse('2028-07-18T14:40') },
  { spot: 'venice', carrier: { name: 'Alex', cc: 'US', me: true }, note: 'Walked it down the boardwalk at golden hour', at: Date.parse('2028-07-18T17:05') },
  { spot: 'marina', carrier: { name: 'Aiko', cc: 'JP' }, note: null, at: Date.parse('2028-07-18T18:31') },
  { spot: 'manhattan', carrier: { name: 'Tomás', cc: 'CO' }, note: 'Sunset delivery 🌅', at: Date.parse('2028-07-18T20:02') },
]

const SEED_LOG: LogEntry[] = [
  {
    id: 'log-past-la84',
    batonId: 'b-2028-07-18-past',
    theme: 'la84',
    dayKey: '2028-07-18',
    from: 'smpier',
    to: 'venice',
    note: 'Walked it down the boardwalk at golden hour',
    anonymous: false,
    at: Date.parse('2028-07-18T17:05'),
    recap: { id: 'recap-past-la84', batonId: 'b-2028-07-18-past', theme: 'la84', dayKey: '2028-07-18', legs: PAST_LEGS },
  },
]

function initial(): State {
  const now = Date.parse(NOW)
  const key = localDate(now)
  return {
    day: { key, generation: 0, ended: false },
    batons: seedDay(key, 0, now),
    carrying: null,
    passed: [],
    droppedToday: [],
    notified: [],
    reminded: [],
    log: [...SEED_LOG],
    pendingRecaps: [],
    card: null,
    dropping: false,
    carrySheet: false,
    dropped: null,
  }
}

// ---- Store ----

let state = initial()
const listeners = new Set<() => void>()
const eventListeners = new Set<(e: BatonEvent) => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function set(patch: Partial<State>, event?: BatonEvent) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
  if (event) eventListeners.forEach((l) => l(event))
}

// The flow gallery listens for these to know when a flow has ended
export function onBatonEvent(listener: (e: BatonEvent) => void) {
  eventListeners.add(listener)
  return () => {
    eventListeners.delete(listener)
  }
}

export const useBatons = () => useSyncExternalStore(subscribe, () => state.batons)
export const useCarryingId = () => useSyncExternalStore(subscribe, () => state.carrying)
export const usePassed = () => useSyncExternalStore(subscribe, () => state.passed)
export const useBatonLog = () => useSyncExternalStore(subscribe, () => state.log)
export const usePendingRecaps = () => useSyncExternalStore(subscribe, () => state.pendingRecaps)
export const useOpenCard = () => useSyncExternalStore(subscribe, () => state.card)
export const useDropping = () => useSyncExternalStore(subscribe, () => state.dropping)
export const useDropped = () => useSyncExternalStore(subscribe, () => state.dropped)

export const batonById = (id: string) => state.batons.find((b) => b.id === id)
export const getBatons = () => state.batons
export const getCarrying = () => (state.carrying ? batonById(state.carrying) ?? null : null)

export function useCarried() {
  const batons = useBatons()
  const id = useCarryingId()
  return id ? batons.find((b) => b.id === id) ?? null : null
}

// ---- Names ----

const regions = new Intl.DisplayNames(['en'], { type: 'region' })

export const countryLabel = (cc: string) => regions.of(cc) ?? cc

// How a carrier shows to others: their name, or "Fan from Germany" if they stayed anonymous
export function carrierName(carrier: NonNullable<Leg['carrier']>) {
  return carrier.anonymous ? `Fan from ${countryLabel(carrier.cc)}` : carrier.name
}

// With their flag, and "You" for the fan's own legs
export function carrierLabel(carrier: NonNullable<Leg['carrier']>) {
  return `${flag(carrier.cc)} ${carrier.me ? 'You' : carrierName(carrier)}`
}

// ---- Rules ----

// The significant spot the fan is standing at, if any
export function spotAt(fan: FanAt) {
  const here = fanCoords(fan)
  return BATON_SPOTS.find((s) => metersBetween(here, placeCoords(s)) <= BATON_CONFIG.atSpotRadiusM) ?? null
}

export function metersTo(spot: string, fan: FanAt) {
  return metersBetween(fanCoords(fan), placeCoords(spot))
}

export type AcceptBlock =
  | { reason: 'carrying' }
  | { reason: 'droppedToday' }
  | { reason: 'away'; meters: number }
  | { reason: 'gone' }
  | null

export const useDroppedToday = () => useSyncExternalStore(subscribe, () => state.droppedToday)

// Why the fan can't take this baton right now (null: they can). A baton you
// dropped today stays off limits; any other baton is fair game right away.
export function acceptBlock(baton: Baton, carrying: string | null, fan: FanAt, droppedToday = state.droppedToday): AcceptBlock {
  if (baton.state !== 'resting') return { reason: 'gone' }
  if (droppedToday.includes(baton.id)) return { reason: 'droppedToday' }
  if (carrying) return { reason: 'carrying' }
  const meters = metersTo(baton.spot, fan)
  if (meters > BATON_CONFIG.claimRadiusM) return { reason: 'away', meters }
  return null
}

// Where the carried baton can be dropped from here: a significant spot that isn't where it was picked up
export function dropSpotFor(baton: Baton | null, fan: FanAt) {
  if (!baton || baton.state !== 'carried') return null
  const spot = spotAt(fan)
  return spot && spot !== baton.spot ? spot : null
}

// ---- Actions ----

export function openBatonCard(id: string) {
  if (state.card !== id) set({ card: id })
}

export function closeBatonCard() {
  if (state.card) set({ card: null }, 'cardClosed')
}

export function acceptBaton(id: string) {
  const baton = batonById(id)
  if (!baton || acceptBlock(baton, state.carrying, getFanAt())) return
  const now = nowMs()
  set(
    {
      batons: state.batons.map((b) =>
        b.id === id ? { ...b, state: 'carried', pickedUpAt: now, expiresAt: now + BATON_CONFIG.carryMinutes * MIN } : b,
      ),
      carrying: id,
      reminded: [],
      card: null,
      // The note it came with is only readable once it's yours
      carrySheet: true,
    },
    'accepted',
  )
}

// The baton stays where it is for someone else
export function passBaton(id: string) {
  set({ passed: state.passed.includes(id) ? state.passed : [...state.passed, id], card: null }, 'passed')
}

export const useCarrySheet = () => useSyncExternalStore(subscribe, () => state.carrySheet)

export function openCarrySheet() {
  if (state.carrying && !state.carrySheet) set({ carrySheet: true })
}

export function closeCarrySheet() {
  if (state.carrySheet) set({ carrySheet: false })
}

// Debug: leaving a flow closes whatever baton screen is open
export function closeBatonOverlays() {
  set({ card: null, dropping: false, carrySheet: false, dropped: null })
}

export function startDrop() {
  if (dropSpotFor(getCarrying(), getFanAt())) set({ dropping: true, carrySheet: false })
}

export function cancelDrop() {
  if (state.dropping) set({ dropping: false })
}

function me(anonymous = false): NonNullable<Leg['carrier']> {
  const { name, country } = getProfile()
  return { name: name.split(' ')[0], cc: country, me: true, anonymous }
}

export function dropBaton(note: string | null, anonymous: boolean) {
  const baton = getCarrying()
  const spot = dropSpotFor(baton, getFanAt())
  if (!baton || !spot) return
  const now = nowMs()
  const leg: Leg = { spot, carrier: me(anonymous), note, at: now }
  const entry: LogEntry = {
    id: `log-${baton.id}-${now}`,
    batonId: baton.id,
    theme: baton.theme,
    dayKey: state.day.key,
    from: baton.spot,
    to: spot,
    note,
    anonymous,
    at: now,
    recap: null,
  }
  set(
    {
      batons: state.batons.map((b) =>
        b.id === baton.id ? { ...b, state: 'resting', spot, pickedUpAt: null, expiresAt: null, history: [...b.history, leg] } : b,
      ),
      carrying: null,
      // Nearby alerts would only be noise for the baton you just left
      notified: [...state.notified, baton.id],
      droppedToday: [...state.droppedToday, baton.id],
      log: [...state.log, entry],
      dropping: false,
      carrySheet: false,
      dropped: entry.id,
    },
    'dropped',
  )
}

// After the drop moment
export function finishDrop() {
  if (state.dropped) set({ dropped: null }, 'dropFinished')
}

// Out of time: back to the spot it was picked up from, no stamp
function timeOut(baton: Baton) {
  set(
    {
      batons: state.batons.map((b) => (b.id === baton.id ? { ...b, state: 'resting', pickedUpAt: null, expiresAt: null } : b)),
      carrying: null,
      notified: [...state.notified, baton.id],
      dropping: false,
      carrySheet: false,
    },
    'timedOut',
  )
  notify({
    title: `The baton returned to ${placeById(baton.spot).name}`,
    body: 'The hour ran out. It’s resting there again for the next fan.',
    to: `/explore?baton=${baton.id}`,
  })
}

// Every baton the fan carried today, with what happened after they let it go
function buildRecaps(now: number): Recap[] {
  const today = state.log.filter((e) => e.dayKey === state.day.key)
  const ids = [...new Set(today.map((e) => e.batonId))]
  return ids.flatMap((id) => {
    const baton = batonById(id)
    if (!baton) return []
    const rand = mulberry32(hash(`${id}#after`))
    // A couple of other fans carried it on after you, so your leg sits mid-story.
    // Their legs run until recap time, even when the debug ends the day early.
    const until = Math.max(now, Date.parse(`${state.day.key}T${BATON_CONFIG.recapTime}`))
    const last = baton.history[baton.history.length - 1]
    const after: Leg[] = []
    if (baton.state === 'resting' && last.carrier?.me) {
      const carriers = shuffle(MOCK_CARRIERS, rand)
      const count = 1 + Math.floor(rand() * 2)
      let spot = last.spot
      let at = last.at
      for (let i = 0; i < count; i++) {
        const options = BATON_SPOTS.filter((s) => s !== spot)
        spot = options[Math.floor(rand() * options.length)]
        at = Math.min(until - (count - i) * 5 * MIN, at + (20 + rand() * 40) * MIN)
        after.push({ spot, carrier: { ...carriers[i], anonymous: rand() < 0.3 }, note: MOCK_NOTES[Math.floor(rand() * MOCK_NOTES.length)], at })
      }
    }
    return [{ id: `recap-${id}`, batonId: id, theme: baton.theme, dayKey: state.day.key, legs: [...baton.history, ...after] }]
  })
}

// Recap time: wrap up the day, then place tomorrow's batons
export function endDay() {
  if (state.day.ended) return
  const now = nowMs()
  const recaps = buildRecaps(now)
  const tomorrow = nextDate(state.day.key)
  set(
    {
      day: { ...state.day, ended: true },
      batons: seedDay(tomorrow, 0, now),
      carrying: null,
      passed: [],
      droppedToday: [],
      notified: [],
      reminded: [],
      pendingRecaps: recaps,
      card: null,
      dropping: false,
      carrySheet: false,
    },
    'dayEnded',
  )
  if (recaps.length) {
    const theme = recaps.length === 1 ? themeById(recaps[0].theme).name.toLowerCase() : null
    notify({
      title: theme ? `See where your ${theme} traveled today` : `See where your ${recaps.length} batons traveled today`,
      body: 'Every stop, every carrier, every note.',
      to: '/batons/recap',
    })
  }
}

// Clear all batons and place the day's set again at random spots
export function resetDay(key = state.day.key, generation = state.day.generation + 1) {
  set(
    {
      day: { key, generation, ended: false },
      batons: seedDay(key, generation, nowMs()),
      carrying: null,
      passed: [],
      droppedToday: [],
      notified: [],
      reminded: [],
      card: null,
      dropping: false,
      carrySheet: false,
      dropped: null,
    },
    'dayReset',
  )
}

// Closing the recap keeps it on the baton's Passport entry
export function saveRecaps() {
  if (!state.pendingRecaps.length) return
  const byBaton = new Map(state.pendingRecaps.map((r) => [`${r.batonId}@${r.dayKey}`, r]))
  set(
    {
      log: state.log.map((e) => {
        const recap = byBaton.get(`${e.batonId}@${e.dayKey}`)
        return recap ? { ...e, recap } : e
      }),
      pendingRecaps: [],
    },
    'recapClosed',
  )
}

export function alertNearby(baton: Baton) {
  if (!state.notified.includes(baton.id)) set({ notified: [...state.notified, baton.id] })
  const meters = metersTo(baton.spot, getFanAt())
  notify({
    title: `A ${themeById(baton.theme).name.toLowerCase()} is near you`,
    body: `Resting at ${placeById(baton.spot).name}${meters > BATON_CONFIG.atSpotRadiusM ? ` · ${formatKm(meters / 1000)} away` : ''}`,
    to: `/explore?baton=${baton.id}`,
  })
}

// A new day on the clock (or the debug clock jumped): start that day's batons.
// Returns false when it changed anything.
export function ensureDay(now: number) {
  const key = localDate(now)
  if (key === state.day.key) return true
  // Tomorrow's batons were placed at recap time; just start the day
  if (state.day.ended && key === nextDate(state.day.key)) set({ day: { key, generation: 0, ended: false } })
  else resetDay(key, 0)
  return false
}

// Runs once a second from the app root: day changes, the carry timer and nearby alerts
export function tickBatons(now: number) {
  if (!ensureDay(now)) return
  const key = state.day.key
  if (!state.day.ended && now >= Date.parse(`${key}T${BATON_CONFIG.recapTime}`)) {
    endDay()
    return
  }

  const carried = getCarrying()
  if (carried) {
    const left = carried.expiresAt! - now
    if (left <= 0) return timeOut(carried)
    const due = BATON_CONFIG.reminderMinutes.filter((m) => left <= m * MIN && !state.reminded.includes(m))
    if (due.length) {
      set({ reminded: [...state.reminded, ...due] })
      const mins = Math.ceil(left / MIN)
      notify({
        title: `${mins} minute${mins === 1 ? '' : 's'} left`,
        body: `Drop your ${themeById(carried.theme).name.toLowerCase()} at a landmark before it heads back.`,
        to: '/explore',
      })
    }
    return
  }

  // Not carrying: a resting baton close by sends one alert a day, unless passed
  const fan = getFanAt()
  const near = state.batons.find(
    (b) =>
      b.state === 'resting' &&
      !state.passed.includes(b.id) &&
      !state.notified.includes(b.id) &&
      metersTo(b.spot, fan) <= BATON_CONFIG.notifyRadiusM,
  )
  if (near) alertNearby(near)
}

// ---- Debug: set up a flow's starting state ----

// A resting baton of this theme at `spot`, fresh for the fan (not passed or alerted)
export function stageBaton(theme: string, spot: string) {
  let baton = state.batons.find((b) => b.theme === theme)
  let batons = state.batons
  if (!baton) {
    const now = nowMs()
    baton = {
      id: `b-${state.day.key}-staged-${theme}`,
      theme,
      state: 'resting',
      spot,
      pickedUpAt: null,
      expiresAt: null,
      dayKey: state.day.key,
      history: seedHistory(spot, state.day.key, now, mulberry32(hash(theme))),
    }
    batons = [...batons, baton]
  }
  const id = baton.id
  const from = baton.spot
  batons = batons.map((b) => {
    if (b.id === id) {
      const history = b.history.map((leg, i) => (i === b.history.length - 1 ? { ...leg, spot } : leg))
      return { ...b, state: 'resting' as const, spot, pickedUpAt: null, expiresAt: null, history }
    }
    // Whatever rested there swaps places
    if (b.state === 'resting' && b.spot === spot) {
      const history = b.history.map((leg, i) => (i === b.history.length - 1 ? { ...leg, spot: from } : leg))
      return { ...b, spot: from, history }
    }
    return b
  })
  set({
    batons,
    carrying: state.carrying === id ? null : state.carrying,
    passed: state.passed.filter((p) => p !== id),
    droppedToday: state.droppedToday.filter((d) => d !== id),
    notified: state.notified.filter((n) => n !== id),
    card: null,
    dropping: false,
    carrySheet: false,
    dropped: null,
  })
  return id
}

// Debug: no nearby alerts for any baton (but `except`), so a flow only shows its own
export function quietAlerts(except?: string) {
  set({ notified: state.batons.map((b) => b.id).filter((id) => id !== except) })
}

// Debug: put no baton in the fan's hands
export function dropNothing() {
  const carried = getCarrying()
  if (!carried) return
  set({
    batons: state.batons.map((b) => (b.id === carried.id ? { ...b, state: 'resting', pickedUpAt: null, expiresAt: null } : b)),
    carrying: null,
    carrySheet: false,
  })
}

// Reminders already behind `secondsLeft` count as sent
const remindedBy = (secondsLeft: number) => BATON_CONFIG.reminderMinutes.filter((m) => m * 60 > secondsLeft)

// Debug: the fan is carrying this theme's baton, picked up at `from`
export function stageCarry(theme: string, from: string, secondsLeft: number) {
  dropNothing()
  const id = stageBaton(theme, from)
  const now = nowMs()
  const expiresAt = now + secondsLeft * 1000
  set({
    batons: state.batons.map((b) =>
      b.id === id ? { ...b, state: 'carried', pickedUpAt: expiresAt - BATON_CONFIG.carryMinutes * MIN, expiresAt } : b,
    ),
    carrying: id,
    reminded: remindedBy(secondsLeft),
  })
  return id
}

// Debug: move the carry timer
export function setTimeLeft(seconds: number) {
  const carried = getCarrying()
  if (!carried) return
  set({
    batons: state.batons.map((b) => (b.id === carried.id ? { ...b, expiresAt: nowMs() + seconds * 1000 } : b)),
    reminded: remindedBy(seconds),
  })
}

// Debug: earlier today the fan carried this theme's baton from `from` to `to`
export function stageCarriedEarlier(theme: string, from: string, to: string, note: string) {
  dropNothing()
  const id = stageBaton(theme, from)
  const now = nowMs()
  const baton = batonById(id)!
  const last = baton.history[baton.history.length - 1]
  const at = Math.min(now - 10 * MIN, Math.max(last.at + 15 * MIN, now - 90 * MIN))
  const leg: Leg = { spot: to, carrier: me(), note, at }
  const entry: LogEntry = { id: `log-${id}-${at}`, batonId: id, theme, dayKey: state.day.key, from, to, note, anonymous: false, at, recap: null }
  set({
    batons: state.batons.map((b) => (b.id === id ? { ...b, spot: to, history: [...b.history, leg] } : b)),
    log: [...state.log.filter((e) => !(e.batonId === id && e.dayKey === state.day.key)), entry],
    droppedToday: [...state.droppedToday.filter((d) => d !== id), id],
    day: { ...state.day, ended: false },
    pendingRecaps: [],
  })
  return id
}

export function resetBatons() {
  const key = localDate(nowMs())
  state = { ...initial(), day: { key, generation: 0, ended: false }, batons: seedDay(key, 0, nowMs()) }
  listeners.forEach((l) => l())
}

// 1730000000000 -> '5:05 PM'
export function timeOfDay(ms: number) {
  return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
