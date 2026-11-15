import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router'
import { pinById } from '@/data/la28'
import { useClock } from '@/lib/clock'
import { SquadPage } from '@/features/on-my-way/screens'
import { MEMBERS, MY_ETA, arrive, minutesLeft, useOnMyWay } from '@/features/on-my-way/state'

// The squad you joined for a pin: everyone's route and ETA, challenges together, the chat.
// Only reachable once you've joined one from the pin page.
export default function SquadRoute() {
  const { pinId = '' } = useParams()
  const pin = pinById(pinId)
  const trip = useOnMyWay()
  const now = useClock()
  const joined = trip.step === 'squad' && trip.pinId === pinId

  // Whoever's ETA runs out has arrived, and says so in the chat
  useEffect(() => {
    if (!joined) return
    MEMBERS.forEach((m) => minutesLeft(now, m.eta) === 0 && arrive(m.id))
    if (minutesLeft(now, MY_ETA) === 0) arrive('me')
  }, [now, joined])

  if (!pin) return <Navigate to="/explore" replace />
  if (!joined) return <Navigate to={`/explore/pins/${pinId}`} replace />
  return <SquadPage pin={pin} />
}
