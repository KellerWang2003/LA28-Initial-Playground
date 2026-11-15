import { useSyncExternalStore } from 'react'
import { pinById } from '@/data/la28'
import { bonusesFor, type Bonus } from '@/data/bonuses'
import { nowMs } from '@/lib/clock'
import { moveFan } from '@/lib/location'

// Heading to a pin, and finding a squad on the way. Directions on the pin's page starts the
// trip: the page shows your route. Matchmake is a small pill: it searches while you keep
// browsing, then says it found a squad. The squad opens full screen, and once you join it
// gets a chat with everyone's live location, until you're all there. In-memory only.

export type Step = 'idle' | 'onTheWay' | 'matching' | 'offer' | 'squad'

export type Member = {
  id: string
  name: string
  cc: string
  city: string
  // Minutes away when the squad forms
  eta: number
  // Where their route starts on the trip map, 0–100 in both directions
  from: [number, number]
}

// Two fans heading to the same pin, simulated
export const MEMBERS: Member[] = [
  { id: 'lina', name: 'Lina', cc: 'MX', city: 'Mexico City', eta: 8, from: [16, 30] },
  { id: 'hana', name: 'Hana', cc: 'JP', city: 'Osaka', eta: 15, from: [86, 70] },
  { id: 'theo', name: 'Théo', cc: 'FR', city: 'Lyon', eta: 10, from: [90, 12] },
]
export const memberById = (id: string) => MEMBERS.find((m) => m.id === id)

// Your trip, in minutes, and how long a minute lasts in the demo
export const MY_ETA = 12
export const DEMO_MINUTE_MS = 2500
// Your route starts here on the trip map; the pin is at PIN_AT
export const ME_FROM: [number, number] = [30, 88]
export const PIN_AT: [number, number] = [62, 22]

export type Message = {
  id: number
  from: 'me' | 'system' | string
  text?: string
  // A challenge someone put to the group
  challenge?: string
  at: number
}

type State = {
  pinId: string
  step: Step
  // When the trip started (ms of the app clock); null until Directions
  startedAt: number | null
  messages: Message[]
  // Challenge id -> who's in ('me' or a member id)
  inFor: Record<string, string[]>
  // Arrived and told the chat
  arrived: string[]
}

export const DEMO_PIN = 'p_griffith'

const initial = (pinId = DEMO_PIN): State => ({
  pinId,
  step: 'idle',
  startedAt: null,
  messages: [],
  inFor: {},
  arrived: [],
})

let state = initial()
const listeners = new Set<() => void>()
let timers: number[] = []
let messageId = 0

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function update(next: Partial<State>) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}

export const useOnMyWay = () => useSyncExternalStore(subscribe, () => state)
export const getOnMyWay = () => state

function later(ms: number, fn: () => void) {
  timers.push(window.setTimeout(fn, ms))
}

function clearTimers() {
  timers.forEach((t) => window.clearTimeout(t))
  timers = []
}

// ---- Challenges ----

// The pin's solo challenges, plus group ones. Most pins have no bonuses in the mock data
// yet, so they get stand-ins. Group: a photo together here, and one that works anywhere.
export function challengesFor(pinId: string): { solo: Bonus[]; group: Bonus[] } {
  const own = bonusesFor(pinId)
  const solo: Bonus[] = own.filter((b) => b.kind !== 'together')
  const group: Bonus[] = [
    own.find((b) => b.kind === 'together') ?? { id: `${pinId}_together`, pin: pinId, kind: 'together', detail: '', mark: 'Together' },
    { id: `${pinId}_flags`, pin: pinId, kind: 'together', title: 'Flags in frame', detail: '', mark: 'Flags' },
  ]
  return {
    solo: solo.length
      ? solo
      : [
          { id: `${pinId}_angle`, pin: pinId, kind: 'angle', detail: '', mark: 'Unique angle' },
          { id: `${pinId}_selfie`, pin: pinId, kind: 'selfie', detail: '', mark: 'Selfie' },
        ],
    group,
  }
}

const firstGroup = () => challengesFor(state.pinId).group[0].id

// ---- Trip ----

// Minutes left for you or a member, from the app clock
export function minutesLeft(now: number, eta: number) {
  if (state.startedAt === null) return eta
  const gone = (now - state.startedAt) / DEMO_MINUTE_MS
  return Math.max(0, Math.ceil(eta - gone))
}

// 0 → 1 along the route
export function progressOf(now: number, eta: number) {
  if (state.startedAt === null) return 0
  return Math.min(1, (now - state.startedAt) / DEMO_MINUTE_MS / eta)
}

// ---- Actions ----

// Directions: you're on your way, and the pin page shows your route
export function startTrip(pinId: string) {
  if (state.pinId === pinId && state.step !== 'idle') return
  clearTimers()
  update({ ...initial(pinId), step: 'onTheWay', startedAt: nowMs() })
}

// Matchmake: searches while you head there (starting the trip if you hadn't yet)
export function startMatching(pinId: string) {
  startTrip(pinId)
  clearTimers()
  update({ step: 'matching' })
  later(5200, matched)
}

// Stop matching, or not now on the squad found: you're still on your way
export function cancelMatching() {
  clearTimers()
  update({ step: 'onTheWay' })
}

// Join the squad offered: it gets its own page, and the chat starts
export function joinSquad() {
  update({ step: 'squad' })
  seedChat(true)
}

function matched() {
  update({ step: 'offer' })
}

function say(from: Message['from'], text?: string, challenge?: string) {
  update({ messages: [...state.messages, { id: ++messageId, from, text, challenge, at: nowMs() }] })
}

function join(challenge: string, who: string) {
  const list = state.inFor[challenge] ?? []
  if (list.includes(who)) return
  update({ inFor: { ...state.inFor, [challenge]: [...list, who] } })
}

export function toggleIn(challenge: string) {
  const list = state.inFor[challenge] ?? []
  update({ inFor: { ...state.inFor, [challenge]: list.includes('me') ? list.filter((w) => w !== 'me') : [...list, 'me'] } })
}

// The squad's first messages, arriving over a few seconds (or all at once for a jump)
function seedChat(live: boolean) {
  const at = (ms: number, fn: () => void) => (live ? later(ms, fn) : fn())
  const group = firstGroup()
  at(800, () => say('lina', 'Hola! 👋'))
  at(2400, () => say('hana', 'Let’s do this challenge!', group))
  at(3000, () => join(group, 'hana'))
  at(4200, () => join(group, 'lina'))
  at(5000, () => join(group, 'theo'))
  at(6000, () => say('theo', 'Coming! 🏃'))
}

// Someone gets there: says so in the chat, once
export function arrive(who: string) {
  if (state.arrived.includes(who)) return
  update({ arrived: [...state.arrived, who] })
  if (who === 'me') {
    moveFan({ place: pinById(state.pinId)!.place })
    say('me', 'I’m here!')
  } else say(who, 'I’m here!')
}

const REPLIES = [
  { from: 'hana', text: '👍' },
  { from: 'lina', text: 'See you there!' },
  { from: 'hana', text: 'Yellow hat 👒' },
]
let replyAt = 0

export function send(text: string) {
  const clean = text.trim()
  if (!clean) return
  say('me', clean)
  const reply = REPLIES[replyAt++ % REPLIES.length]
  later(1500, () => say(reply.from, reply.text))
}

// ---- Flow gallery jumps ----

export type SquadJump = 'idle' | 'onTheWay' | 'matching' | 'offer' | 'squad' | 'arrived'

export function stageSquad(jump: SquadJump) {
  clearTimers()
  replyAt = 0
  moveFan(null)
  update(initial(DEMO_PIN))
  if (jump === 'idle') return
  if (jump === 'matching') {
    startMatching(DEMO_PIN)
    update({ startedAt: nowMs() - 2 * DEMO_MINUTE_MS })
    return
  }
  // Start a few demo minutes in so routes have moved
  update({ step: jump === 'arrived' ? 'squad' : jump, startedAt: nowMs() - (jump === 'arrived' ? 16 : 2) * DEMO_MINUTE_MS })
  if (jump === 'onTheWay' || jump === 'offer') return
  seedChat(false)
  toggleIn(firstGroup())
}
