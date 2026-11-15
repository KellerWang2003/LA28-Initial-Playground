import { formatCountdown } from '@/lib/clock'
import { GAME } from './parties'

// Tonight's match as the demo clock runs: the score, and CrowdPlay at halftime

const DAY = '2028-07-20'
const KICKOFF = Date.parse(`${DAY}T${GAME.kickoff}`)
// Halftime, when the host runs CrowdPlay on the big screen
export const HALFTIME = KICKOFF + 45 * 60_000
const HALFTIME_END = HALFTIME + 15 * 60_000

// The match as of now: a minute and a score, made up for the demo
export function matchAt(now: number) {
  const min = Math.floor((now - KICKOFF) / 60_000)
  if (min < 0) return null
  const played = now >= HALFTIME_END ? min - 15 : Math.min(min, 45)
  const home = played >= 23 ? 1 : 0
  const away = played >= 61 ? 1 : 0
  const label = now >= HALFTIME && now < HALFTIME_END ? 'HT' : `${Math.min(played, 90)}′`
  return { home, away, label }
}

// Where CrowdPlay is: counting down to halftime, live, or over
export function crowdPlayAt(now: number) {
  if (now >= HALFTIME_END) return { label: 'Done', live: false, done: true }
  if (now >= HALFTIME) return { label: 'Live', live: true, done: false }
  return { label: formatCountdown(Math.ceil((HALFTIME - now) / 1000)), live: false, done: false }
}
