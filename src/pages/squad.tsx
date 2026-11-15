import { Navigate, useParams } from 'react-router'
import { pinById } from '@/data/la28'
import { SquadChat, YourSquad } from '@/features/on-my-way/screens'
import { useArrivals } from '@/features/on-my-way/use-arrivals'
import { useOnMyWay } from '@/features/on-my-way/state'

// The squad found for a pin: full screen to join or not, then the squad chat once you're in.
// Only reachable once matchmaking found one from the pin page.
export default function SquadRoute() {
  const { pinId = '' } = useParams()
  const pin = pinById(pinId)
  const trip = useOnMyWay()
  useArrivals(pinId)
  const mine = trip.pinId === pinId

  if (!pin) return <Navigate to="/explore" replace />
  if (mine && trip.step === 'offer') return <YourSquad pin={pin} />
  if (mine && trip.step === 'squad') return <SquadChat pin={pin} />
  return <Navigate to={`/explore/pins/${pinId}`} replace />
}
