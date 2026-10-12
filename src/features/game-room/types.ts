// Shared types for the game room (the in-game activity space for one session)

export type RoundKind = 'predict' | 'pin-map' | 'hello' | 'this-or-that' | 'guess-crowd' | 'pick-one' | 'poll' | 'goal'

// One timed activity the whole room plays at once
export type Round = {
  id: string
  kind: RoundKind
  title: string
  prompt: string
  /** 'YYYY-MM-DDTHH:mm' in app time, like the mock data */
  opensAt: string
  /** Length of the answer window, in seconds */
  seconds: number
  options?: { id: string; label: string; emoji?: string }[]
  /** Tied to what is happening in the game (not a general fan activity) */
  relatesToGame?: boolean
}

export type RoomStage = 'lobby' | 'live' | 'break' | 'ended'

