import { useSyncExternalStore } from 'react'
import { COLLECT_RADIUS_M, placeById } from '@/data/la28'
import { FAKE_USER_LOCATION, distance, type LngLat } from '@/data/map-layers'

// Where the fan is. Location is simulated, and it's the one position everything
// reads: pins (in collect range?), batons (alerts, claim, drop) and distances.
// null: the downtown hotel they start at. `place` is set when they were put at a
// known place (collecting its pin, the debug list); `near` stands them a little
// way off it: close enough to get a baton's nearby alert, too far to claim it.
// A debug map tap puts them at any point, with no place. In-memory: a reload resets it.
export type FanAt = { coords: LngLat; place: string | null; near: boolean } | null

// How far `near` is from the place, in meters (north of it): just outside the
// 2 km where a baton shows up, so nothing there is visible yet
export const NEAR_M = 2500
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

function set(next: FanAt) {
  const same = next?.coords.join() === at?.coords.join() && next?.place === at?.place && next?.near === at?.near
  if (same) return
  at = next
  emit()
}

// Stand at a known place, or a little way off it. null: back at the hotel.
export function moveFan(next: { place: string; near?: boolean } | null) {
  if (!next) return set(null)
  const [lng, lat] = placeCoords(next.place)
  const near = next.near ?? false
  set({ coords: [lng, lat + (near ? NEAR_M / M_PER_DEG : 0)], place: next.place, near })
}

// Stand at any point on the map
export function teleportFan(coords: LngLat) {
  set({ coords, place: null, near: false })
}

// Standing at a place, e.g. after collecting its pin
export function arriveAt(place: string) {
  moveFan({ place })
}

export function resetLocation() {
  set(null)
}

export function fanCoords(fan: FanAt): LngLat {
  return fan?.coords ?? FAKE_USER_LOCATION
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

// Within collect range of a place (a pin's place)
export function useAtPlace(place: string) {
  return metersBetween(useFanLocation(), placeCoords(place)) <= COLLECT_RADIUS_M
}
