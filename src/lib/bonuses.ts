import { useSyncExternalStore } from 'react'
import { Clock, Focus, Gamepad2, SwitchCamera, Users, type LucideIcon } from 'lucide-react'
import { useClock } from '@/lib/clock'
import { resetCollected, useCollected } from '@/lib/collected'
import { resetDebug, useDebug } from '@/lib/debug'
import { resetBatons } from '@/lib/batons'
import { exitFlowRun } from '@/lib/flow-run'
import { resetLocation } from '@/lib/location'
import { resetMyGames } from '@/lib/my-games'
import { clearToasts } from '@/lib/toasts'
import { formatTime, pinById, type Pin } from '@/data/la28'
import { SEED_BONUSES, venueSession, type Bonus, type BonusKind, type GameState } from '@/data/bonuses'

export const bonusIcon: Record<BonusKind, LucideIcon> = {
  angle: Focus,
  moment: Clock,
  selfie: SwitchCamera,
  game: Gamepad2,
  together: Users,
}

export const bonusPath = (b: Bonus) => `/explore/pins/${b.pin}/bonus/${b.id}`

// Done bonuses and the mark each left on its stamp. In-memory: a reload resets the demo.
let marks: Record<string, string> = { ...SEED_BONUSES }
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit() {
  listeners.forEach((l) => l())
}

export function useBonusMarks() {
  return useSyncExternalStore(subscribe, () => marks)
}

export function completeBonus(id: string, mark: string) {
  if (marks[id]) return
  marks = { ...marks, [id]: mark }
  emit()
}

// Debug: play a bonus again
export function resetBonus(id: string) {
  if (!(id in marks)) return
  marks = Object.fromEntries(Object.entries(marks).filter(([k]) => k !== id))
  emit()
}

export function resetBonuses() {
  marks = { ...SEED_BONUSES }
  emit()
}

// Debug: back to how the demo starts
export function resetDemo() {
  resetCollected()
  resetBonuses()
  resetDebug()
  resetBatons()
  resetLocation()
  resetMyGames()
  clearToasts()
  exitFlowRun()
}

// ---- Can it be played right now? ----

export type BonusState =
  | { status: 'done'; mark: string }
  | { status: 'opens'; at: string }
  | { status: 'closed' }
  | { status: 'game'; game: GameState }
  | { status: 'collect' }
  // Right moment while its window is open: collecting the pin now earns it too
  | { status: 'with-collect' }
  | { status: 'away' }
  | { status: 'ready' }

const localDate = (ms: number) => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// The game at a venue pin, from today's session times or the debug override
export function useVenueGame(pin: Pin): GameState | null {
  const now = useClock()
  const { venueGame } = useDebug()
  if (pin.kind !== 'venue') return null
  if (venueGame !== 'schedule') return venueGame
  const session = venueSession(pin, localDate(now))
  if (!session) return 'none'
  if (now < Date.parse(`${session.date}T${session.start}`)) return 'before'
  if (now > Date.parse(`${session.date}T${session.end}`)) return 'ended'
  return 'live'
}

// Done first, then what the bonus itself waits on (its window, the game),
// then what you need to do (collect the pin, be there).
export function useBonusState(bonus: Bonus): BonusState {
  const now = useClock()
  const collected = useCollected()
  const { inRadius } = useDebug()
  const all = useBonusMarks()
  const pin = pinById(bonus.pin)!
  const game = useVenueGame(pin)

  if (all[bonus.id]) return { status: 'done', mark: all[bonus.id] }
  if (bonus.window) {
    if (now < Date.parse(bonus.window.opens)) return { status: 'opens', at: bonus.window.opens }
    if (now > Date.parse(bonus.window.closes)) return { status: 'closed' }
  }
  if (game && game !== 'live') return { status: 'game', game }
  if (!collected.includes(pin.id)) return { status: bonus.window ? 'with-collect' : 'collect' }
  if (!inRadius) return { status: 'away' }
  return { status: 'ready' }
}

// Right moment marks carry the time of the photo: 'Sunset · 7:58 PM'
export function momentMark(b: Bonus, now: number) {
  const d = new Date(now)
  return `${b.mark} · ${formatTime(`${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`)}`
}

const gameLabel: Record<GameState, string> = {
  before: 'Opens when the game starts',
  live: 'Game on',
  ended: 'The game is over',
  none: 'Only during a game',
}

// '2028-07-20T19:40' -> '7:40 PM', or 'Sat 5:55 AM' on another day
function whenLabel(iso: string, now: number) {
  const time = formatTime(iso.slice(11, 16))
  if (iso.slice(0, 10) === localDate(now)) return time
  return `${new Date(`${iso.slice(0, 10)}T12:00`).toLocaleDateString('en-US', { weekday: 'short' })} ${time}`
}

export function useBonusStateLabel(state: BonusState) {
  const now = useClock()
  switch (state.status) {
    case 'done':
      return state.mark
    case 'opens':
      return `Opens ${whenLabel(state.at, now)}`
    case 'closed':
      return 'Closed for today'
    case 'game':
      return gameLabel[state.game]
    case 'collect':
      return 'Collect the pin first'
    case 'with-collect':
      return 'Open now · comes with your photo'
    case 'away':
      return 'Go there to play'
    case 'ready':
      return 'Ready'
  }
}
