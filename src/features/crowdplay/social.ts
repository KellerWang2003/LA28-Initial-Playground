import { useSyncExternalStore } from 'react'
import { sessionById } from '@/data/la28'
import { crowdCountry } from '@/features/game-room/crowd'
import { choiceDist, shareOf } from '@/features/game-room/game/crowd-model'
import { seedUnit } from '@/features/game-room/seed'
import { FREE200_RACE, raceTimes, SWIM_FIXTURES } from '@/features/game-room/standing/data'
import { notify } from '@/lib/toasts'
import { playersIn } from './play'
import { questionsFor, type PlaySet, type Question } from './schedule'

// The social layer on top of CrowdPlay: strangers in the same crowd finding each other.
// - Crowd twin: after a round, the fan near you who answered most like you. "Find each other"
//   puts the same big shape on both phones, so you hold them up and spot each other.
// - Your side: a prediction puts you on a side with everyone who picked the same. The side
//   cheers together during the race and gets a "you called it" moment when it ends.
// In-memory, like the rest of the demo.

// ---- Crowd twins ----

export type Twin = {
  id: string
  name: string
  // Two-letter code, like keep-going members (Julia is the same person in her group)
  cc: string
  // Three-letter crowd code, for the map question
  crowd: string
  // Where they sit at the venue
  seat: string
  // How far away when you start looking, in meters
  startM: number
  // How often they answer like you (0 to 1)
  agree: number
  // The after-game group they end up in
  groupId: string
}

// The same people as in the after-game groups, so a twin you find can turn up in your group
export const TWINS: Twin[] = [
  { id: 'julia', name: 'Julia', cc: 'FR', crowd: 'FRA', seat: 'Section 212, row F', startM: 45, agree: 0.92, groupId: 'sorrows' },
  { id: 'hana', name: 'Hana', cc: 'JP', crowd: 'JPN', seat: 'Section 208, row C', startM: 70, agree: 0.78, groupId: 'quiet' },
  { id: 'rosa', name: 'Rosa', cc: 'MX', crowd: 'MEX', seat: 'Section 215, row K', startM: 60, agree: 0.66, groupId: 'bite' },
]

export const twinById = (id: string) => TWINS.find((t) => t.id === id)

// The shape each twin's phone shows when you look for each other, with a number so two pairs
// with the same shape don't mix up
export const SIGNALS: Record<string, { shape: string; number: number }> = {
  julia: { shape: '◆', number: 27 },
  hana: { shape: '▲', number: 14 },
  rosa: { shape: '●', number: 39 },
}

/** What a twin answered. They follow you most of the time; otherwise a seeded other option. */
export function twinAnswer(twin: { id: string; agree: number; crowd?: string }, question: Question, mine?: string) {
  if (question.kind === 'pin-map') return twin.crowd
  const options = question.options ?? []
  if (!options.length) return undefined
  if (mine !== undefined && seedUnit(`twin:${twin.id}:${question.id}`) < twin.agree) return mine
  const others = options.filter((o) => o.id !== mine)
  return others[Math.floor(seedUnit(`twin:${twin.id}:${question.id}:other`) * others.length)]?.id
}

export type TwinMatch = {
  twin: Twin
  same: Question[]
  // One question you split on: a ready-made thing to talk about
  split?: { question: Question; theirs: string }
  total: number
}

const labelOf = (question: Question, id?: string) =>
  question.kind === 'pin-map' ? (id ? (crowdCountry(id)?.name ?? id) : '') : (question.options?.find((o) => o.id === id)?.label ?? '')

export const answerLabel = labelOf

/** The fan in the crowd who answered most like you in this round. Needs two answers to go on. */
export function twinFor(set: PlaySet, answers: Record<string, string>): TwinMatch | undefined {
  // The map question isn't a match: everyone is from somewhere
  const answered = set.questions.filter((q) => q.id in answers && q.kind !== 'pin-map')
  if (answered.length < 2) return undefined
  const matches = TWINS.map((twin) => {
    const same: Question[] = []
    let split: TwinMatch['split']
    for (const q of answered) {
      const theirs = twinAnswer(twin, q, answers[q.id])
      if (theirs === answers[q.id]) same.push(q)
      else if (!split && theirs) split = { question: q, theirs: labelOf(q, theirs) }
    }
    return { twin, same, split, total: answered.length }
  })
  return matches.sort((a, b) => b.same.length - a.same.length)[0]
}

// ---- Your side (predictions) ----

export const SIDE_QUESTION = 'r_predict_200'

export type Side = {
  question: Question
  pick: string
  label: string
  emoji?: string
  // Fans on your side, and their share of the crowd
  fans: number
  share: number
  raceStart: number
  resultAt: number
  winner: string
  winnerLabel: string
}

/** The side your prediction put you on, with the race it is waiting for */
export function sideOf(sessionId: string, answers: Record<string, string>): Side | undefined {
  const question = questionsFor(sessionId).find((q) => q.id === SIDE_QUESTION)
  const session = sessionById(sessionId)
  const pick = answers[SIDE_QUESTION]
  const race = session?.races?.find((r) => r.time === FREE200_RACE)
  if (!question || !session || !race || pick === undefined) return undefined
  const option = question.options?.find((o) => o.id === pick)
  const dist = choiceDist(question, pick)
  const share = shareOf(dist, pick)
  const { start, resultAt } = raceTimes(session, race)
  const winner = SWIM_FIXTURES[FREE200_RACE]?.results[0]?.code ?? 'GBR'
  return {
    question,
    pick,
    label: option?.label ?? pick,
    emoji: option?.emoji,
    fans: Math.round(playersIn(session) * share),
    share,
    raceStart: start,
    resultAt,
    winner,
    winnerLabel: question.options?.find((o) => o.id === winner)?.label ?? winner,
  }
}

/** How many on your side are holding the cheer button right now: a wave that swells during the race */
export function cheering(side: Side, now: number, holding: boolean) {
  const x = Math.min(1, Math.max(0, (now - side.raceStart) / (side.resultAt - side.raceStart)))
  const swell = 0.25 + 0.6 * x ** 1.6 + 0.08 * Math.sin(now / 700)
  return Math.round(side.fans * Math.min(0.95, swell)) + (holding ? 1 : 0)
}

// ---- Store ----

type SocialState = {
  // Twins you are looking for or found, by id
  finding: string | null
  found: string[]
  waved: string[]
  // The race result alert goes out once
  sideNotified: boolean
}

const EMPTY: SocialState = { finding: null, found: [], waved: [], sideNotified: false }

let state: SocialState = EMPTY
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function set(next: Partial<SocialState>) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}

export function useSocial() {
  return useSyncExternalStore(subscribe, () => state)
}

export const getSocial = () => state

export function startFinding(id: string) {
  set({ finding: id })
}

export function stopFinding() {
  set({ finding: null })
}

export function markFound(id: string) {
  set({ finding: null, found: state.found.includes(id) ? state.found : [...state.found, id] })
}

export function wave(id: string) {
  if (state.waved.includes(id)) return
  set({ waved: [...state.waved, id] })
  const twin = twinById(id)
  if (twin) setTimeout(() => notify({ title: `${twin.name} waved back 👋`, body: 'Same answers, same crowd.' }), 1800)
}

export function resetSocial() {
  state = EMPTY
  listeners.forEach((l) => l())
}

// Runs once a second from the app root: tell your side how the race went, wherever you are
export function tickSocial(now: number, sessionId: string, answers: Record<string, string>) {
  if (state.sideNotified) return
  const side = sideOf(sessionId, answers)
  if (!side || now < side.resultAt) return
  // Don't alert for a race that ended long ago (the debug clock jumped past it)
  if (now > side.resultAt + 10 * 60_000) return set({ sideNotified: true })
  set({ sideNotified: true })
  const called = side.pick === side.winner
  notify({
    title: called ? `You called it! ${side.winnerLabel} wins 🎉` : `${side.winnerLabel} wins`,
    body: called
      ? `You and ${side.fans.toLocaleString()} fans on your side picked it.`
      : `Your side picked ${side.label}. Better luck in the relay.`,
    to: `/sports/games/${sessionId}/play`,
  })
}
