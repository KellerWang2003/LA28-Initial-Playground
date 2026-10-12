// The Passport as a booklet: an ID page, challenges, then pins, batons and ticket stubs,
// each split into fixed-size pages so a page never scrolls.
import { CATEGORIES, pinsIn } from '@/data/passport'
import type { Pin } from '@/data/la28'
import type { LogEntry } from '@/lib/batons'
import type { Ticket } from '@/lib/tickets'

export type Section = 'pins' | 'batons' | 'tickets'
// Where a bookmark can sit: a section, or one of the single pages up front
export type Bookmark = 'id' | 'challenges' | Section

// The bookmarks, left to right. The ID page is the front of the book, so it has none.
export const SECTIONS: { id: Bookmark; label: string }[] = [
  { id: 'challenges', label: 'Challenges' },
  { id: 'pins', label: 'Pins' },
  { id: 'batons', label: 'Batons' },
  { id: 'tickets', label: 'Tickets' },
]

const PER_PAGE: Record<Section, number> = { pins: 12, batons: 4, tickets: 1 }

// Which page of its run this is, e.g. attractions 2 of 3
type Part = { part: number; parts: number }

export type BookPage =
  | { kind: 'id' }
  | { kind: 'challenges' }
  | ({ kind: 'pins'; category: (typeof CATEGORIES)[number]; pins: Pin[] } & Part)
  | ({ kind: 'batons'; entries: LogEntry[] } & Part)
  | ({ kind: 'tickets'; tickets: Ticket[] } & Part)

// An empty list still gets one page, for its empty state
function chunk<T>(items: T[], size: number): T[][] {
  if (!items.length) return [[]]
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size))
}

const split = <T,>(items: T[], size: number) => {
  const pages = chunk(items, size)
  return pages.map((page, i) => ({ items: page, part: i + 1, parts: pages.length }))
}

export function buildPages(collected: readonly string[], log: readonly LogEntry[], tickets: readonly Ticket[]): BookPage[] {
  const pins = CATEGORIES.flatMap((category) => {
    const all = pinsIn(category.kinds)
    // Collected first, then the rest
    const ordered = [...all.filter((p) => collected.includes(p.id)), ...all.filter((p) => !collected.includes(p.id))]
    return split(ordered, PER_PAGE.pins).map(({ items, part, parts }) => ({ kind: 'pins' as const, category, pins: items, part, parts }))
  })
  const batons = split([...log].sort((a, b) => b.at - a.at), PER_PAGE.batons).map(({ items, part, parts }) => ({
    kind: 'batons' as const,
    entries: items,
    part,
    parts,
  }))
  const stubs = split([...tickets], PER_PAGE.tickets).map(({ items, part, parts }) => ({ kind: 'tickets' as const, tickets: items, part, parts }))
  return [{ kind: 'id' }, { kind: 'challenges' }, ...pins, ...batons, ...stubs]
}

export const bookmarkOf = (page: BookPage): Bookmark => page.kind

// Decorative machine-readable lines, like the bottom of a real passport's ID page
export function passportLines(name: string, country: string) {
  const [first = '', ...rest] = name.toUpperCase().split(' ')
  const surname = rest.join('<') || first
  return [`P<${country}${surname}<<${first}`, `LA280420<0${country}2807145`].map((l) => l.padEnd(30, '<').slice(0, 30))
}
