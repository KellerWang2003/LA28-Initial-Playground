// Passport: collection categories, the Torches currency, challenges and the store.
// All mock and static; progress that depends on what you do is computed in the page.
import { PINS, type Pin, type PinKind, type Rarity } from '@/data/la28'

// ---- Torches (in-game currency) ----

// Torches earned per pin, by rarity
export const PIN_VALUE: Record<Rarity, number> = {
  Common: 10,
  Rare: 25,
  Epic: 50,
  Legendary: 100,
}

// Extra Torches for collecting a pin together with others at the spot.
// Group collection is optional, so the bonus stays small.
export const GROUP_BONUS = 10
// People capturing within the same minute, you included
export const GROUP_SIZE = 3

// Earned before today (earlier pins' bonuses, past challenges)
export const STARTING_TORCHES = 180

// ---- Collection ----

export const CATEGORIES: { id: string; title: string; kinds: PinKind[] }[] = [
  { id: 'attractions', title: 'Tourist attractions', kinds: ['place', 'half'] },
  { id: 'games', title: 'Games & venues', kinds: ['venue'] },
  { id: 'shops', title: 'Local shops', kinds: ['shop'] },
  { id: 'events', title: 'Events & gatherings', kinds: ['event'] },
]

export const pinsIn = (kinds: PinKind[]): Pin[] => PINS.filter((p) => kinds.includes(p.kind))

// ---- Challenges ----

// How a challenge's progress is measured. 'static' uses the fixed numbers;
// the others read your collection so capturing a pin can complete them.
export type ChallengeProgress =
  | { type: 'static'; done: number }
  | { type: 'pinsToday' }
  | { type: 'pinsTotal' }

export type Challenge = {
  id: string
  period: 'daily' | 'weekly'
  title: string
  detail: string
  goal: number
  reward: number
  progress: ChallengeProgress
  // Already paid out before today. Its reward is in STARTING_TORCHES, so completion does not add it again.
  claimed?: boolean
}

// Progress toward a challenge. Daily pin goals ignore pins collected before today.
export function challengeDone(challenge: Challenge, collected: readonly string[], seedCollected: readonly string[]) {
  if (challenge.progress.type === 'static') return challenge.progress.done
  if (challenge.progress.type === 'pinsToday') return collected.filter((id) => !seedCollected.includes(id)).length
  return collected.length
}

export const CHALLENGES: Challenge[] = [
  { id: 'd_pin', period: 'daily', title: 'Collect a pin today', detail: 'Any pin counts', goal: 1, reward: 20, progress: { type: 'pinsToday' } },
  { id: 'd_hello', period: 'daily', title: 'Say hi to a fan from another country', detail: 'Add someone you met', goal: 1, reward: 15, progress: { type: 'static', done: 1 } },
  { id: 'd_watch', period: 'daily', title: 'Visit a watch party', detail: 'Public or fan-hosted', goal: 1, reward: 25, progress: { type: 'static', done: 0 } },
  { id: 'w_ten', period: 'weekly', title: 'Collect 10 pins', detail: 'Across the whole map', goal: 10, reward: 100, progress: { type: 'pinsTotal' } },
  { id: 'w_areas', period: 'weekly', title: 'Collect pins in 3 parts of LA', detail: 'e.g. Hollywood, Downtown, the coast', goal: 3, reward: 75, progress: { type: 'static', done: 2 } },
  { id: 'w_host', period: 'weekly', title: 'Host or join a fan gathering', detail: 'From the Watch parties tab', goal: 1, reward: 150, progress: { type: 'static', done: 0 } },
  { id: 'w_game', period: 'weekly', title: 'Attend a game', detail: 'Check in at any venue', goal: 1, reward: 100, progress: { type: 'static', done: 1 }, claimed: true },
]

// When challenges reset, relative to the mock's NOW
export const DAILY_RESET = '2028-07-21T00:00'
export const WEEKLY_RESET = '2028-07-24T00:00'

// ---- Store ----

export type StoreItem = { id: string; name: string; detail: string; price: number }

// Merch, picked up with a QR code at an LA28 store or Fan Zone
export const STORE_ITEMS: StoreItem[] = [
  { id: 'tote', name: 'LA28 tote bag', detail: 'Canvas, one size', price: 250 },
  { id: 'pinset', name: 'Enamel pin set', detail: '4 pins from around LA', price: 300 },
  { id: 'bottle', name: 'Water bottle', detail: 'Insulated, 20 oz', price: 350 },
  { id: 'cap', name: 'LA28 cap', detail: 'Adjustable', price: 450 },
  { id: 'tee', name: 'LA28 T-shirt', detail: 'Pick your size at pickup', price: 600 },
  { id: 'legendary', name: 'Griffith Legendary pin', detail: 'Limited, numbered', price: 800 },
]
