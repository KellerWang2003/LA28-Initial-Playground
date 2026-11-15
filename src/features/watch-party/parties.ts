import { useSyncExternalStore } from 'react'
import { makeCrowd, type Person } from './crowd'

// Tonight's watch parties for Brazil vs Morocco (8:30 PM): a free screening in a park, a
// picnic by a lake, and a taco shop. Each shows generally who's going. In-memory only.

export const GAME = { session: 's_fb_m_0720', home: 'BR', away: 'MA', kickoff: '20:30', sport: 'Football' }

export type Party = {
  id: string
  title: string
  place: string
  kind: 'Free screening' | 'Picnic' | 'Shop'
  host?: { name: string; cc: string }
  doors: string
  // On the Tonight map, 0–100 in both directions
  at: [number, number]
  crowd: Person[]
  // People shown as bubbles are a sample; this is everyone going
  going: number
  // Mini-games on the big screen, at halftime
  crowdPlay: boolean
}

export const PARTIES: Party[] = [
  {
    id: 'grandpark',
    title: 'Grand Park screening',
    place: 'grandpark',
    kind: 'Free screening',
    doors: '20:00',
    at: [62, 46],
    going: 1240,
    crowdPlay: true,
    crowd: makeCrowd('g', [['BR', 9], ['MA', 8], ['US', 6], ['MX', 4], ['FR', 2], ['JP', 2], ['KR', 1], ['GB', 1], ['AR', 2]]),
  },
  {
    id: 'echolake',
    title: 'Lakeside picnic',
    place: 'echolake',
    kind: 'Picnic',
    host: { name: 'Yasmine', cc: 'MA' },
    doors: '19:45',
    at: [36, 22],
    going: 46,
    crowdPlay: true,
    crowd: makeCrowd('e', [['MA', 9], ['FR', 3], ['DZ', 2], ['US', 4], ['BR', 3], ['ES', 1]]),
  },
  {
    id: 'sol',
    title: 'Tacos and the match',
    place: 'sol',
    kind: 'Shop',
    host: { name: 'Rosa', cc: 'MX' },
    doors: '20:00',
    at: [82, 60],
    going: 14,
    crowdPlay: false,
    crowd: makeCrowd('s', [['MX', 5], ['BR', 4], ['CO', 2], ['US', 3]]),
  },
]

export const partyById = (id: string) => PARTIES.find((p) => p.id === id)

// ---- Going ----

let going: string | null = null
const listeners = new Set<() => void>()

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useGoingTo = () => useSyncExternalStore(subscribe, () => going)

export function goTo(id: string | null) {
  going = id
  listeners.forEach((l) => l())
}

// ---- How the crowd pin's border is painted (exploring two looks) ----

export type PinLook = 'sweep' | 'splash'
let look: PinLook = 'sweep'

export const useCrowdPinLook = () => useSyncExternalStore(subscribe, () => look)

export function setCrowdPinLook(next: PinLook) {
  look = next
  listeners.forEach((l) => l())
}
