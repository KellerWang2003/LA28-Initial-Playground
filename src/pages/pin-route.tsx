import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router'
import { pinById } from '@/data/la28'
import { RouteScreen } from '@/features/on-my-way/screens'
import { startTrip } from '@/features/on-my-way/state'
import { useArrivals } from '@/features/on-my-way/use-arrivals'

// Directions to a pin: your route, fans on their way there too, and matchmaking
export default function PinRoutePage() {
  const { pinId = '' } = useParams()
  const pin = pinById(pinId)
  useArrivals(pinId)
  // Opened straight from a link: you're on your way now
  useEffect(() => {
    if (pin) startTrip(pin.id)
  }, [pin])

  if (!pin) return <Navigate to="/explore" replace />
  return <RouteScreen pin={pin} />
}
