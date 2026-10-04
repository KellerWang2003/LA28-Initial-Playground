import { useSyncExternalStore } from 'react'
import { useCollected } from '@/lib/collected'
import { CHALLENGES, PIN_VALUE, STARTING_TORCHES, STORE_ITEMS } from '@/data/passport'
import { pinById } from '@/data/la28'

// In-memory wallet: claimed challenges and redeemed store items. Resets on reload.
type State = { claimed: string[]; redeemed: string[] }

let state: State = { claimed: CHALLENGES.filter((c) => c.claimed).map((c) => c.id), redeemed: [] }
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function update(next: State) {
  state = next
  listeners.forEach((l) => l())
}

export function claimChallenge(id: string) {
  if (!state.claimed.includes(id)) update({ ...state, claimed: [...state.claimed, id] })
}

export function redeemItem(id: string) {
  if (!state.redeemed.includes(id)) update({ ...state, redeemed: [...state.redeemed, id] })
}

// Balance = starting Torches + pins collected + challenges claimed since − items redeemed
export function useWallet() {
  const collected = useCollected()
  const { claimed, redeemed } = useSyncExternalStore(subscribe, () => state)
  const fromPins = collected.reduce((sum, id) => sum + PIN_VALUE[pinById(id)?.rarity ?? 'Common'], 0)
  const fromChallenges = CHALLENGES.filter((c) => claimed.includes(c.id) && !c.claimed).reduce((sum, c) => sum + c.reward, 0)
  const spent = STORE_ITEMS.filter((i) => redeemed.includes(i.id)).reduce((sum, i) => sum + i.price, 0)
  return { balance: STARTING_TORCHES + fromPins + fromChallenges - spent, claimed, redeemed }
}
