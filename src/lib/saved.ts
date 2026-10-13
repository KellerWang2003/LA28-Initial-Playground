import { useSyncExternalStore } from 'react'
import { eventById, formatDate, formatTime, placeById, sessionById, type GameEvent, type Session } from '@/data/la28'

// Saved lists, like wishlists: games and events a fan is interested in but not
// necessarily going to. The Watch list is built in: what's on it shows in My activities
// while it's on, and its result once it's over. Going lives in `my-games` and `plans`.

export type SavedRef = { kind: 'game' | 'event'; id: string }

export type SavedList = {
  id: string
  name: string
  items: SavedRef[]
}

export const WATCH_LIST = 'watch'

const game = (id: string): SavedRef => ({ kind: 'game', id })
const event = (id: string): SavedRef => ({ kind: 'event', id })

// Seeded so the Watch list has a live game, a result and games later on
const SEED: SavedList[] = [
  { id: WATCH_LIST, name: 'Watch list', items: [game('s_bball_0720'), game('s_bvb_am'), game('s_fb_m_0720'), game('s_bball_0723')] },
  { id: 'beach', name: 'Beach days', items: [event('e_sunrise'), event('e_boardwalk3x3'), game('s_bvb_0724')] },
  { id: 'brazil', name: 'Following Brazil', items: [game('s_fb_0722'), event('e_watch_fb')] },
]

let lists: SavedList[] = SEED
let nextList = 1
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit() {
  listeners.forEach((l) => l())
}

export function useSaved() {
  return useSyncExternalStore(subscribe, () => lists)
}

const same = (a: SavedRef, b: SavedRef) => a.kind === b.kind && a.id === b.id

export const inList = (list: SavedList, ref: SavedRef) => list.items.some((i) => same(i, ref))

export const isSaved = (all: SavedList[], ref: SavedRef) => all.some((l) => inList(l, ref))

export const listById = (all: SavedList[], id: string) => all.find((l) => l.id === id)

export const savedCount = (list: SavedList) =>
  list.items.length === 0 ? 'Nothing saved yet' : `${list.items.length} saved`

// Add to the list, or take it off if it's already there
export function toggleSaved(listId: string, ref: SavedRef) {
  lists = lists.map((l) =>
    l.id !== listId ? l : { ...l, items: inList(l, ref) ? l.items.filter((i) => !same(i, ref)) : [ref, ...l.items] },
  )
  emit()
}

// A new list, optionally starting with the item being saved. Returns its id.
export function createList(name: string, first?: SavedRef) {
  const id = `list-${nextList++}`
  lists = [...lists, { id, name, items: first ? [first] : [] }]
  emit()
  return id
}

// The Watch list can't be deleted
export function deleteList(id: string) {
  if (id === WATCH_LIST) return
  lists = lists.filter((l) => l.id !== id)
  emit()
}

export function resetSaved() {
  lists = SEED
  emit()
}

// ---- What a saved item looks like in a list ----

export type SavedItem =
  | { ref: SavedRef; kind: 'game'; session: Session; title: string; eyebrow: string; where: string; when: string; sortKey: string; to: string }
  | { ref: SavedRef; kind: 'event'; event: GameEvent; title: string; eyebrow: string; where: string; when: string; sortKey: string; to: string }

export function savedItem(ref: SavedRef): SavedItem | null {
  if (ref.kind === 'game') {
    const s = sessionById(ref.id)
    if (!s) return null
    return {
      ref,
      kind: 'game',
      session: s,
      title: s.title,
      eyebrow: s.sport,
      where: placeById(s.venue).name,
      when: `${formatDate(s.date)} · ${formatTime(s.start)}`,
      sortKey: `${s.date}${s.start}`,
      to: s.status === 'finished' ? `/sports/games/${s.id}/recap` : `/sports/games/${s.id}`,
    }
  }
  const e = eventById(ref.id)
  if (!e) return null
  return {
    ref,
    kind: 'event',
    event: e,
    title: e.title,
    eyebrow: 'Event',
    where: placeById(e.place).name,
    when: `${formatDate(e.date)} · ${formatTime(e.time)}`,
    sortKey: `${e.date}${e.time}`,
    to: `/events/${e.id}`,
  }
}

// Events have no end time in the mock; treat them as on for this long
const EVENT_LENGTH_MS = 2 * 60 * 60 * 1000

export function eventIsOn(e: GameEvent, now: number) {
  const start = Date.parse(`${e.date}T${e.time}`)
  return now >= start && now < start + EVENT_LENGTH_MS
}
