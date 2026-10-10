import { useSyncExternalStore } from 'react'
import { placeById } from '@/data/la28'
import { FAKE_USER_LOCATION, distance, type LngLat } from '@/data/map-layers'

// Where the fan is. Location is simulated: they start at the downtown hotel,
// and collecting a pin or the debug teleport moves them to a place.
// `near` stands them a little way off: close enough to get a baton's nearby
// alert, too far to claim it. In-memory: a reload resets it.
export type FanAt = { place: string; near: boolean } | null

// How far `near` is from the place, in meters (north of it): between the
// baton claim radius (2 km) and the alert radius (3 km)
const NEAR_M = 2500
const M_PER_DEG = 111_000

let at: FanAt = null
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit() {
  listeners.forEach((l) => l())
}

export function useFanAt() {
  return useSyncExternalStore(subscribe, () => at)
}

export function getFanAt() {
  return at
}

export function moveFan(next: FanAt) {
  if (next?.place === at?.place && next?.near === at?.near) return
  at = next
  emit()
}

// Standing at a place, e.g. after collecting its pin
export function arriveAt(place: string) {
  moveFan({ place, near: false })
}

export function resetLocation() {
  moveFan(null)
}

export function fanCoords(fan: FanAt): LngLat {
  if (!fan) return FAKE_USER_LOCATION
  const place = placeById(fan.place)
  return [place.lng, place.lat + (fan.near ? NEAR_M / M_PER_DEG : 0)]
}

export function useFanLocation(): LngLat {
  return fanCoords(useFanAt())
}

// Straight-line meters; fine at city scale
export function metersBetween(a: LngLat, b: LngLat) {
  return distance(a, b) * M_PER_DEG
}

export const placeCoords = (id: string): LngLat => {
  const place = placeById(id)
  return [place.lng, place.lat]
}
