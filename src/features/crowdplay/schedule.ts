import type { Round } from '@/features/game-room/types'

// CrowdPlay: the quick rounds everyone in a game plays at the same moment, Kahoot style.
// A round is a few questions on a fixed schedule: a short intro, then each question is open for a
// few seconds, then its result shows to everyone, then the next question. All times come from the
// shared app clock, so the debug panel can jump to any moment.
//
// A question is a `Round` from game-room/types (kind, title, options...), so the answer store, the
// recap and the fan's country (from the map question `r_origin`) keep working as they did.
// Extra facts (right answer, emoji) live in game-room/game/round-meta.ts.

export const INTRO_S = 5
export const ANSWER_S = 10
export const RESULT_S = 6
// The round summary stays up this long before the wait for the next round
export const DONE_S = 45

type QuestionDef = Omit<Round, 'opensAt' | 'seconds'> & { seconds?: number }

type SetDef = { id: string; title: string; emoji: string; startsAt: string; questions: QuestionDef[] }

const SETS: Record<string, SetDef[]> = {
  s_swim_0720: [
    {
      id: 'warmup',
      title: 'Warm-up',
      emoji: '🏊',
      startsAt: '2028-07-20T18:32:00',
      questions: [
        {
          id: 'r_learn',
          kind: 'pick-one',
          title: 'Where did you learn to swim?',
          prompt: 'Everyone has a first pool, lake or beach.',
          options: [
            { id: 'pool', label: 'A pool', emoji: '🏊' },
            { id: 'ocean', label: 'The ocean', emoji: '🌊' },
            { id: 'lake', label: 'A lake', emoji: '🏞️' },
            { id: 'never', label: 'Never learned', emoji: '🤷' },
          ],
        },
        {
          id: 'r_snack',
          kind: 'pick-one',
          title: 'What are you eating or drinking right now?',
          prompt: 'Tap what is closest to your hand.',
          options: [
            { id: 'water', label: 'Water', emoji: '💧' },
            { id: 'coffee', label: 'Coffee or tea', emoji: '☕' },
            { id: 'popcorn', label: 'Popcorn', emoji: '🍿' },
            { id: 'nothing', label: 'Nothing yet', emoji: '🙃' },
          ],
        },
        {
          id: 'r_stroke',
          kind: 'pick-one',
          title: 'Which stroke are you?',
          prompt: 'If you jumped in right now, which one is yours?',
          options: [
            { id: 'free', label: 'Freestyle', emoji: '🏊' },
            { id: 'fly', label: 'Butterfly', emoji: '🦋' },
            { id: 'back', label: 'Backstroke', emoji: '🙃' },
            { id: 'breast', label: 'Breaststroke', emoji: '🐸' },
          ],
        },
      ],
    },
    {
      id: 'whos-here',
      title: 'Who’s here',
      emoji: '🌍',
      startsAt: '2028-07-20T19:21:00',
      questions: [
        { id: 'r_origin', kind: 'pin-map', title: 'Where are you from?', prompt: 'Tap your country on the map.', seconds: 20 },
        {
          id: 'r_thisorthat',
          kind: 'this-or-that',
          title: 'Tea or coffee?',
          prompt: 'One tap. No wrong answers.',
          options: [
            { id: 'tea', label: 'Tea', emoji: '🍵' },
            { id: 'coffee', label: 'Coffee', emoji: '☕' },
          ],
        },
        {
          id: 'r_clock',
          kind: 'pick-one',
          title: 'What time is it for you?',
          prompt: 'Wherever you are right now.',
          options: [
            { id: 'morning', label: 'Morning', emoji: '🌅' },
            { id: 'afternoon', label: 'Afternoon', emoji: '☀️' },
            { id: 'evening', label: 'Evening', emoji: '🌆' },
            { id: 'night', label: 'Middle of the night', emoji: '🌙' },
          ],
        },
      ],
    },
    {
      id: 'before-final',
      title: 'Before the final',
      emoji: '🥇',
      startsAt: '2028-07-20T19:25:00',
      questions: [
        {
          id: 'r_predict_200',
          kind: 'predict',
          title: "Who wins the men's 200m free final?",
          prompt: 'The race starts at 7:28 PM.',
          relatesToGame: true,
          seconds: 15,
          options: [
            { id: 'GBR', label: 'Great Britain', emoji: '🇬🇧' },
            { id: 'USA', label: 'United States', emoji: '🇺🇸' },
            { id: 'AUS', label: 'Australia', emoji: '🇦🇺' },
            { id: 'CHN', label: 'China', emoji: '🇨🇳' },
          ],
        },
        {
          id: 'r_lengths',
          kind: 'pick-one',
          title: 'How many lengths of the pool is a 200m race?',
          prompt: 'The pool at SoFi is 50 meters long.',
          relatesToGame: true,
          options: [
            { id: '2', label: '2 lengths' },
            { id: '4', label: '4 lengths' },
            { id: '8', label: '8 lengths' },
            { id: '200', label: '200 lengths' },
          ],
        },
        {
          id: 'r_fastest',
          kind: 'pick-one',
          title: 'Which stroke is the fastest?',
          prompt: 'Over the same distance.',
          options: [
            { id: 'free', label: 'Freestyle', emoji: '🏊' },
            { id: 'fly', label: 'Butterfly', emoji: '🦋' },
            { id: 'back', label: 'Backstroke', emoji: '🙃' },
            { id: 'breast', label: 'Breaststroke', emoji: '🐸' },
          ],
        },
      ],
    },
    {
      id: 'crowd-guess',
      title: 'Crowd guess',
      emoji: '🔢',
      startsAt: '2028-07-20T19:40:00',
      questions: [
        {
          id: 'r_guess',
          kind: 'pick-one',
          title: 'How many countries are in this crowd?',
          prompt: 'Take a guess.',
          options: [
            { id: 'u10', label: 'Under 10' },
            { id: '10-20', label: '10 to 20' },
            { id: '20-30', label: '20 to 30' },
            { id: '30+', label: 'More than 30' },
          ],
        },
        {
          id: 'r_seat',
          kind: 'pick-one',
          title: 'Where are you watching from?',
          prompt: 'Be honest.',
          options: [
            { id: 'stands', label: 'In the stands', emoji: '🏟️' },
            { id: 'couch', label: 'On the couch', emoji: '🛋️' },
            { id: 'bar', label: 'At a bar', emoji: '🍻' },
            { id: 'phone', label: 'On my phone, on the go', emoji: '📱' },
          ],
        },
        {
          id: 'r_relay',
          kind: 'predict',
          title: "Who wins the women's 4x200m relay?",
          prompt: 'The relay starts at 8:20 PM.',
          relatesToGame: true,
          options: [
            { id: 'AUS', label: 'Australia', emoji: '🇦🇺' },
            { id: 'USA', label: 'United States', emoji: '🇺🇸' },
            { id: 'CHN', label: 'China', emoji: '🇨🇳' },
            { id: 'GBR', label: 'Great Britain', emoji: '🇬🇧' },
          ],
        },
      ],
    },
  ],
}

export type Question = Round & { set: string; index: number; opens: number; closes: number; resultEnds: number }

export type PlaySet = { id: string; title: string; emoji: string; start: number; questionsStart: number; end: number; questions: Question[] }

// 'YYYY-MM-DDTHH:mm:ss' in app time, like the rest of the mock data
const iso = (ms: number) => {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function build(def: SetDef): PlaySet {
  const start = Date.parse(def.startsAt)
  let t = start + INTRO_S * 1000
  const questions = def.questions.map((q, index) => {
    const seconds = q.seconds ?? ANSWER_S
    const opens = t
    const closes = opens + seconds * 1000
    const resultEnds = closes + RESULT_S * 1000
    t = resultEnds
    return { ...q, seconds, opensAt: iso(opens), set: def.id, index, opens, closes, resultEnds }
  })
  return { id: def.id, title: def.title, emoji: def.emoji, start, questionsStart: start + INTRO_S * 1000, end: t, questions }
}

const built = new Map<string, PlaySet[]>()

export function setsFor(sessionId: string): PlaySet[] {
  let sets = built.get(sessionId)
  if (!sets) {
    sets = (SETS[sessionId] ?? []).map(build).sort((a, b) => a.start - b.start)
    built.set(sessionId, sets)
  }
  return sets
}

/** Every question of the session, in order (the old "rounds" list) */
export const questionsFor = (sessionId: string): Question[] => setsFor(sessionId).flatMap((s) => s.questions)

export type Phase =
  | { kind: 'none' }
  | { kind: 'waiting'; next: PlaySet; last?: PlaySet; left: number }
  | { kind: 'intro'; set: PlaySet; left: number }
  | { kind: 'question'; set: PlaySet; question: Question; left: number }
  | { kind: 'result'; set: PlaySet; question: Question; left: number }
  | { kind: 'done'; set: PlaySet; next?: PlaySet }
  | { kind: 'over'; last: PlaySet }

const secs = (ms: number) => Math.max(0, Math.ceil(ms / 1000))

/** Where the crowd is at `now`: waiting, in a round (intro, a question, its result), or finished. */
export function phaseAt(sessionId: string, now: number): Phase {
  const sets = setsFor(sessionId)
  if (sets.length === 0) return { kind: 'none' }
  for (let i = 0; i < sets.length; i++) {
    const set = sets[i]
    const next = sets[i + 1]
    if (now < set.start) return { kind: 'waiting', next: set, last: sets[i - 1], left: secs(set.start - now) }
    if (now < set.questionsStart) return { kind: 'intro', set, left: secs(set.questionsStart - now) }
    const question = set.questions.find((q) => now < q.resultEnds)
    if (question) {
      return now < question.closes
        ? { kind: 'question', set, question, left: secs(question.closes - now) }
        : { kind: 'result', set, question, left: secs(question.resultEnds - now) }
    }
    if (now < set.end + DONE_S * 1000 && (!next || now < next.start)) return { kind: 'done', set, next }
  }
  return { kind: 'over', last: sets[sets.length - 1] }
}

/** Moments of the hero session's CrowdPlay, for the debug panel's shortcuts */
export function debugMoments(sessionId: string) {
  const set = setsFor(sessionId).find((s) => s.id === 'whos-here')
  if (!set) return []
  const [map, two] = set.questions
  return [
    { label: 'Waiting', time: iso(set.start - 40_000) },
    { label: 'Round intro', time: iso(set.start + 1000) },
    { label: 'Map question', time: iso(map.opens + 2000) },
    { label: 'Question', time: iso(two.opens + 1000) },
    { label: 'Result', time: iso(two.closes + 500) },
    { label: 'Round done', time: iso(set.end + 2000) },
  ]
}
