import type { Session } from '@/data/la28'
import { useClock } from '@/lib/clock'
import type { RoomStage } from './types'

// The room opens this long before the start
export const ROOM_OPENS_BEFORE_S = 30 * 60

// Lobby: before the start (the room itself opens 30 min earlier, see ROOM_OPENS_BEFORE_S).
// 'break' is part of the type for scripted intermissions but is not derived yet.
export function useRoomStage(session: Session): RoomStage {
  const now = useClock()
  if (session.status === 'finished') return 'ended'
  if (now < Date.parse(`${session.date}T${session.start}`)) return 'lobby'
  if (now >= Date.parse(`${session.date}T${session.end}`)) return 'ended'
  return 'live'
}
