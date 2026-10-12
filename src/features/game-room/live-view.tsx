import type { Session } from '@/data/la28'
import type { AttendMode } from '@/lib/my-games'
import { AthletesInSession } from './standing/athletes'
import { CrowdVsReality } from './standing/crowd-vs-reality'
import { LiveStats } from './standing/live-stats'
import { RoadToFinal } from './standing/road'

// The game page body: live stats like Apple Sports (the scoreboard, how the game is going in
// numbers, who is through), then the crowd's picks and the athletes. CrowdPlay opens from the
// button at the bottom of the page.
// How far behind their own stream is lives in the room's settings (see room-settings.tsx).
export function LiveView({ session, mode }: { session: Session; mode: AttendMode }) {
  return (
    // 7rem at the bottom lets the last card scroll clear of the CrowdPlay button
    <div className="space-y-6 px-4 pt-1 pb-28" data-mode={mode} data-session={session.id}>
      <LiveStats session={session} />
      <RoadToFinal session={session} />
      <CrowdVsReality session={session} />
      <AthletesInSession session={session} />
    </div>
  )
}
