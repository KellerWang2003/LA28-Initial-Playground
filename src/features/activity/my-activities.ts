import { eventById, eventTypeLabel, placeById } from '@/data/la28'
import type { MyPlan } from '@/lib/plans'
import { planned, type MyGame } from '@/lib/my-games'

// Everything the fan is going to or hosting: games from `my-games`, events and plans from `plans`.
// The Activities tab shows what's next as cards; "See all" lists every one by day.

export type ActivityKind = 'game' | 'watch-party' | 'event'

export const ACTIVITY_FILTERS: { id: ActivityKind | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'game', label: 'Games' },
  { id: 'watch-party', label: 'Watch parties' },
  { id: 'event', label: 'Events' },
]

export type Activity = {
  key: string
  kind: ActivityKind
  date: string
  time: string
  eyebrow: string
  title: string
  where: string
  tag: string
  to?: string
  // Past games, listed under Earlier with their recap
  done?: boolean
  // Games only, so the tab can tell which room is open
  session?: string
}

export function myActivities(games: MyGame[], plans: MyPlan[]): Activity[] {
  return [
    ...planned(games).map(({ sessionData: s, mode }): Activity => ({
      key: s.id,
      kind: 'game',
      date: s.date,
      time: s.start,
      eyebrow: s.sport,
      title: s.title,
      where: placeById(s.venue).name,
      tag: mode === 'venue' ? 'At the venue' : 'Online',
      to: s.status === 'finished' ? `/sports/games/${s.id}/recap` : `/sports/games/${s.id}`,
      done: s.status === 'finished',
      session: s.id,
    })),
    ...plans.map((p): Activity => {
      const e = eventById(p.id)
      return {
        key: p.id,
        kind: e?.watch ? 'watch-party' : 'event',
        date: p.date,
        time: p.time,
        eyebrow: e ? (e.watch ? 'Watch party' : eventTypeLabel[e.type]) : p.visibility === 'public' ? 'Public plan' : 'Private plan',
        title: p.title,
        where: p.where,
        tag: p.role === 'hosting' ? 'Hosting' : 'Going',
        to: e ? `/events/${p.id}` : undefined,
      }
    }),
  ]
}

const startKey = (a: Activity) => `${a.date}${a.time}`

// Soonest first
export const upcoming = (list: Activity[]) => list.filter((a) => !a.done).sort((a, b) => startKey(a).localeCompare(startKey(b)))

// Most recent first
export const earlier = (list: Activity[]) => list.filter((a) => a.done).sort((a, b) => startKey(b).localeCompare(startKey(a)))
