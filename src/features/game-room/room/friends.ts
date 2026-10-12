import { personById, type Person } from '@/data/mock'
import { useConnections } from '@/lib/connections'
import type { AttendMode } from '@/lib/my-games'
import { seedUnit } from '../seed'

export type Here = { person: Person; mode: AttendMode }

// Friends you already know. Which ones are "here" is a stable seeded pick per session.
export function useFriendsHere(sessionId: string): Here[] {
  const ids = useConnections()
  return ids.flatMap((id) => {
    const person = personById(id)
    if (!person || seedUnit(`${sessionId}:here:${id}`) >= 0.55) return []
    const mode: AttendMode = seedUnit(`${sessionId}:mode:${id}`) < 0.4 ? 'venue' : 'online'
    return [{ person, mode }]
  })
}
