import { useEffect } from 'react'
import { BatonCard } from '@/components/baton-card'
import { CarrySheet } from '@/components/carry-sheet'
import { DropMoment, DropSheet } from '@/components/baton-drop'
import { Toasts } from '@/components/toasts'
import { useClock } from '@/lib/clock'
import { tickBatons } from '@/lib/batons'
import { tickKeepGoing } from '@/features/activity/keep-going-state'
import { SWIM_SESSION } from '@/features/activity/keep-going'
import { tickSocial } from '@/features/crowdplay/social'
import { getMyAnswers } from '@/features/game-room/crowd'

// Mounted once at the app root, so batons keep working on every screen: the
// carry timer, reminders, nearby alerts and the end of the day, plus the
// baton screens that can open over anything. The after-game hangout and CrowdPlay's
// race-result alert for your side tick here too.
export function BatonRuntime() {
  const now = useClock()

  useEffect(() => {
    tickBatons(now)
    tickKeepGoing(now)
    tickSocial(now, SWIM_SESSION, getMyAnswers(SWIM_SESSION))
  }, [now])

  return (
    <>
      <BatonCard />
      <CarrySheet />
      <DropSheet />
      <DropMoment />
      <Toasts />
    </>
  )
}
