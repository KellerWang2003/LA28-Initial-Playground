import type { Round } from '../types'

// Optional extras for a round, kept out of types.ts so that file stays untouched.
export type RoundMeta = {
  /** Shown on the round card and in lists */
  emoji?: string
  /** Option id that is right (predict rounds) */
  correct?: string
  /** Seconds between the answer window closing and the reveal (default 3) */
  revealDelayS?: number
  /** Room goal: countries that must join */
  goalTarget?: number
  /** Result view that needs more than a split of the options */
  reveal?: 'clock'
  /** Short text shown while a round is locked and waiting for its reveal */
  lockedNote?: string
}

export const ROUND_META: Record<string, RoundMeta> = {
  r_origin: { emoji: '🌍' },
  r_clock: { emoji: '🕒', reveal: 'clock' },
  r_thisorthat: { emoji: '🍵' },
  r_snack: { emoji: '🍿' },
  r_learn: { emoji: '🏊' },
  r_stroke: { emoji: '🦋' },
  r_predict_200: { emoji: '🥇', correct: 'GBR' },
  r_lengths: { emoji: '📏', correct: '4' },
  r_fastest: { emoji: '⚡', correct: 'free' },
  r_guess: { emoji: '🔢', correct: '20-30' },
  r_seat: { emoji: '🛋️' },
  r_relay: { emoji: '🏅', correct: 'AUS' },
}

const NO_META: RoundMeta = {}

export const metaOf = (round: Round): RoundMeta => ROUND_META[round.id] ?? NO_META

export const KIND_LABEL: Record<Round['kind'], string> = {
  predict: 'Prediction',
  'pin-map': 'Map',
  hello: 'Hello',
  'this-or-that': 'This or that',
  'guess-crowd': 'Guess',
  'pick-one': 'Quick pick',
  poll: 'Poll',
  goal: 'Room goal',
}
