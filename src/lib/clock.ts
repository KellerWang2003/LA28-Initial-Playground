import { useSyncExternalStore } from 'react'
import { NOW, type Pin } from '@/data/la28'
import { getDebug, setDebug, useDebug, type DebugState } from '@/lib/debug'

// The mock is frozen at NOW. Timers start from NOW and then run with real
// time since the page loaded, so "live" things feel live. The debug panel can
// jump the clock to another time, which then runs on the same way.
const loadedAt = Date.now()
let now = loadedAt
const listeners = new Set<() => void>()
let interval: number | undefined

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    interval = window.setInterval(() => {
      now = Date.now()
      listeners.forEach((l) => l())
    }, 1000)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.clearInterval(interval)
  }
}

// Ticks once a second
function useNow() {
  return useSyncExternalStore(subscribe, () => now)
}

function clockMs(current: number, debug: DebugState) {
  const anchor = debug.warp ?? { real: debug.time ? debug.jumpedAt : loadedAt, app: Date.parse(debug.time ?? NOW) }
  return anchor.app + Math.max(0, current - anchor.real) * debug.speed
}

// The app's current time in ms, ticking once a second
export function useClock() {
  return clockMs(useNow(), useDebug())
}

// The app's current time right now, for event handlers outside render
export function nowMs() {
  return clockMs(Date.now(), getDebug())
}

// Debug: run the clock faster from here on, without jumping
export function setClockSpeed(speed: number) {
  const real = Date.now()
  setDebug({ speed, warp: { real, app: clockMs(real, getDebug()) } })
}

// Seconds since `since` ('2028-07-20T18:30'), as of NOW plus time on the page
export function useElapsed(since: string) {
  return Math.max(0, Math.floor((useClock() - Date.parse(since)) / 1000))
}

// 3012 -> '50:12', 4805 -> '1:20:05'
export function formatElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = String(seconds % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

// Seconds left until `target`, as of NOW plus time on the page (never negative)
export function useRemaining(target: string) {
  return Math.max(0, Math.ceil((Date.parse(target) - useClock()) / 1000))
}

// Countdown text: seconds only in the last hour, days past one day.
// 1185 -> '19:45', 49200 -> '13h 40m', 276000 -> '3d 4h'
export function formatCountdown(seconds: number) {
  if (seconds < 3600) return formatElapsed(seconds)
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`
}

// A locked pin opens once its countdown runs out, so a jumped debug clock unlocks it too
export function usePinLocked(pin: Pin) {
  const left = useRemaining(pin.opensAt ?? NOW)
  return pin.status === 'locked' && left > 0
}
