import { useEffect } from 'react'
import { useClock } from '@/lib/clock'
import { MEMBERS, MY_ETA, arrive, minutesLeft, useOnMyWay } from './state'

// Whoever's ETA runs out has arrived. Runs on the pin page and the squad's pages.
export function useArrivals(pinId: string) {
  const trip = useOnMyWay()
  const now = useClock()
  const on = trip.pinId === pinId && trip.step !== 'idle'
  const squad = trip.step === 'squad'
  useEffect(() => {
    if (!on) return
    if (squad) MEMBERS.forEach((m) => minutesLeft(now, m.eta) === 0 && arrive(m.id))
    if (minutesLeft(now, MY_ETA) === 0) arrive('me')
  }, [now, on, squad])
}
