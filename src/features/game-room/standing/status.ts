import type { Session } from '@/data/la28'
import { NOW } from '@/data/la28'

/** 'YYYY-MM-DD' + 'HH:mm' to ms, in the same local time the mock clock uses */
export const atMs = (date: string, time: string) => Date.parse(`${date}T${time}`)

export const startMs = (s: Session) => atMs(s.date, s.start)
export const endMs = (s: Session) => atMs(s.date, s.end)
export const NOW_MS = Date.parse(NOW)

export type Phase = 'upcoming' | 'live' | 'finished'

/** Where the session is as of `viewMs` (the fan's own moment, see useViewClock). Finished stays finished. */
export function phaseAt(s: Session, viewMs: number): Phase {
  if (s.status === 'finished') return 'finished'
  if (viewMs < startMs(s)) return 'upcoming'
  return viewMs >= endMs(s) ? 'finished' : 'live'
}

export const secondsUntil = (targetMs: number, viewMs: number) => Math.max(0, Math.ceil((targetMs - viewMs) / 1000))

// 'Group A: …' / "Men's group A: Serbia vs Australia" -> true when the title says it is a group game
export const isGroupGame = (s: Session) => /group/i.test(s.title)
