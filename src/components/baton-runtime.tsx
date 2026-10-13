import { useEffect } from 'react'
import { BatonCard } from '@/components/baton-card'
import { CarrySheet } from '@/components/carry-sheet'
import { DropMoment, DropSheet } from '@/components/baton-drop'
import { Toasts } from '@/components/toasts'
import { useClock } from '@/lib/clock'
import { tickBatons } from '@/lib/batons'
import { tickKeepGoing } from '@/features/activity/keep-going-state'

// Mounted once at the app root, so batons keep working on every screen: the
// carry timer, reminders, nearby alerts and the end of the day, plus the
// baton screens that can open over anything. The after-game hangout ticks here too.
export function BatonRuntime() {
  const now = useClock()

  useEffect(() => {
    tickBatons(now)
    tickKeepGoing(now)
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
