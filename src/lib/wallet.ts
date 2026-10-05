import { useSyncExternalStore } from 'react'
import { SEED_COLLECTED, useCollected } from '@/lib/collected'
import { CHALLENGES, PIN_VALUE, STARTING_TORCHES, STORE_ITEMS, challengeDone } from '@/data/passport'
import { pinById } from '@/data/la28'

// In-memory wallet: redeemed store items. Resets on reload.
// Challenge rewards are derived from progress, so finishing one pays it once.
type State = { redeemed: string[] }

let state: State = { redeemed: [] }
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function update(next: State) {
  state = next
  listeners.forEach((l) => l())
}

export function redeemItem(id: string) {
  if (!state.redeemed.includes(id)) update({ ...state, redeemed: [...state.redeemed, id] })
}

// Balance = starting Torches + pins collected + challenges completed since − items redeemed.
// Seed challenges flagged claimed are skipped; those Torches are already in STARTING_TORCHES.
export function useWallet() {
  const collected = useCollected()
  const { redeemed } = useSyncExternalStore(subscribe, () => state)
  const fromPins = collected.reduce((sum, id) => sum + PIN_VALUE[pinById(id)?.rarity ?? 'Common'], 0)
  const fromChallenges = CHALLENGES.filter((c) => !c.claimed && challengeDone(c, collected, SEED_COLLECTED) >= c.goal).reduce(
    (sum, c) => sum + c.reward,
    0,
  )
  const spent = STORE_ITEMS.filter((i) => redeemed.includes(i.id)).reduce((sum, i) => sum + i.price, 0)
  return { balance: STARTING_TORCHES + fromPins + fromChallenges - spent, redeemed }
}
