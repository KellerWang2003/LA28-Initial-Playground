import { useSyncExternalStore } from 'react'
import { NOW } from '@/data/la28'

// The mock is frozen at NOW. Timers start from NOW and then run with real
// time since the page loaded, so "live" things feel live.
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

// Seconds since `since` ('2028-07-20T18:30'), as of NOW plus time on the page
export function useElapsed(since: string) {
  const current = useNow()
  return Math.max(0, Math.floor((Date.parse(NOW) - Date.parse(since) + current - loadedAt) / 1000))
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
  const current = useNow()
  return Math.max(0, Math.ceil((Date.parse(target) - Date.parse(NOW) - (current - loadedAt)) / 1000))
}

// Countdown text: seconds only in the last hour, days past one day.
// 1185 -> '19:45', 49200 -> '13h 40m', 276000 -> '3d 4h'
export function formatCountdown(seconds: number) {
  if (seconds < 3600) return formatElapsed(seconds)
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`
}
