import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router'
import { pinById } from '@/data/la28'
import { useClock } from '@/lib/clock'
import { ChatStep, FoundStep, MatchingStep, PinStep } from '@/features/on-my-way/screens'
import { MEMBERS, MY_ETA, arrive, minutesLeft, openOnMyWay, useOnMyWay } from '@/features/on-my-way/state'

// On my way: a pin's sheet with its challenges and one big button. Tapping it starts
// matchmaking on the way there, then the squad, then the team chat until everyone's here.
export default function OnMyWayPage() {
  const { pinId = '' } = useParams()
  const pin = pinById(pinId)
  const trip = useOnMyWay()
  const now = useClock()

  useEffect(() => {
    if (pin) openOnMyWay(pin.id)
  }, [pin])

  // Whoever's ETA runs out has arrived, and says so in the chat
  const squad = trip.step === 'found' || trip.step === 'chat'
  useEffect(() => {
    if (!squad) return
    MEMBERS.forEach((m) => minutesLeft(now, m.eta) === 0 && arrive(m.id))
    if (minutesLeft(now, MY_ETA) === 0) arrive('me')
  }, [now, squad])

  if (!pin) return <Navigate to="/explore" replace />
  if (trip.pinId !== pin.id) return null

  if (trip.step === 'matching') return <MatchingStep pin={pin} />
  if (trip.step === 'found') return <FoundStep pin={pin} />
  if (trip.step === 'chat') return <ChatStep pin={pin} />
  return <PinStep pin={pin} />
}
