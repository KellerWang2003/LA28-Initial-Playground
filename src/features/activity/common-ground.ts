import { questionsFor, type Question } from '@/features/crowdplay/schedule'
import { twinAnswer, twinById } from '@/features/crowdplay/social'
import { metaOf } from '@/features/game-room/game/round-meta'
import { SWIM_SESSION, type Group, type Member } from './keep-going'

// What an after-game group has in common, from the CrowdPlay rounds everyone played during the
// game. It's how a group of strangers gets its first things to talk about: on the offer ("4 of you
// learned to swim in the ocean") and at the table (how the table split on each question).

// How often a group member answers like you. Your crowd twins answer like you far more often.
const MEMBER_AGREE = 0.45

/** What a member answered. Mock and seeded, but leaning toward your own answer. */
export function memberAnswer(member: Member, question: Question, mine?: string) {
  const twin = twinById(member.id)
  return twinAnswer(twin ?? { id: member.id, agree: MEMBER_AGREE }, question, mine)
}

// Personal questions and predictions only: the map, the clock and trivia with a right answer
// don't make good small talk
const talkable = (q: Question) => q.kind !== 'pin-map' && q.id !== 'r_clock' && (q.kind === 'predict' || metaOf(q).correct === undefined)

const optionOf = (q: Question, id?: string) => q.options?.find((o) => o.id === id)

export type Common = { question: Question; label: string; emoji?: string; count: number; names: string[] }

/** Answers you share with the most people in the group, most shared first */
export function commonGround(group: Group, answers: Record<string, string>, limit = 3): Common[] {
  return questionsFor(SWIM_SESSION)
    .filter((q) => talkable(q) && q.id in answers)
    .map((q) => {
      const mine = answers[q.id]
      const same = group.members.filter((m) => memberAnswer(m, q, mine) === mine)
      const option = optionOf(q, mine)
      return { question: q, label: option?.label ?? mine, emoji: option?.emoji, count: same.length, names: same.map((m) => m.name) }
    })
    .filter((c) => c.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

/** How a sentence about a shared answer reads on the offer */
export function commonLine(c: Common) {
  const n = c.count + 1
  const id = c.question.id
  if (id === 'r_learn') return `${n} of you learned to swim in ${c.label === 'Never learned' ? 'no water at all' : c.label.toLowerCase()}`
  if (id === 'r_stroke') return `${n} of you are ${c.label.toLowerCase()} people`
  if (id === 'r_thisorthat') return `${n} of you picked ${c.label.toLowerCase()}`
  if (id === 'r_snack') return `${n} of you had ${c.label.toLowerCase()} in hand`
  if (c.question.kind === 'predict') return `${n} of you backed ${c.label}`
  return `${n} of you said ${c.label} to “${c.question.title}”`
}

export type Split = {
  question: Question
  // Each option someone at the table picked, with who picked it ("You" for the fan)
  options: { id: string; label: string; emoji?: string; names: string[] }[]
}

/** How the people at the table split on each question: a prompt to put in the middle */
export function tableSplits(members: Member[], answers: Record<string, string>): Split[] {
  return questionsFor(SWIM_SESSION)
    .filter(talkable)
    .map((q) => {
      const mine = answers[q.id]
      const picks = members.map((m) => ({ name: m.name, id: memberAnswer(m, q, mine) }))
      if (mine !== undefined) picks.unshift({ name: 'You', id: mine })
      const options = (q.options ?? [])
        .map((o) => ({ id: o.id, label: o.label, emoji: o.emoji, names: picks.filter((p) => p.id === o.id).map((p) => p.name) }))
        .filter((o) => o.names.length)
        .sort((a, b) => b.names.length - a.names.length)
      return { question: q, options }
    })
    // Ones you answered first, then the closer the split, the better the argument
    .filter((s) => s.options.length >= 2)
    .sort((a, b) => Number(b.question.id in answers) - Number(a.question.id in answers) || a.options[0].names.length - b.options[0].names.length)
    .slice(0, 5)
}
