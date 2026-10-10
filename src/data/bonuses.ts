// Bonus challenges: optional extras on top of collecting a pin. Each one adds
// Torches and a mark on the pin's stamp. A small set for testing every kind once.
import { SCHEDULE, TODAY, type Pin } from '@/data/la28'

export type BonusKind = 'angle' | 'moment' | 'selfie' | 'game' | 'together'
// Solo is just you; Together is you and anyone else, 2 or more people
export type BonusType = 'solo' | 'together'
export type GameKind = 'start-gun' | 'balance' | 'stroke'

export type Bonus = {
  id: string
  pin: string
  kind: BonusKind
  // Defaults to the kind's title
  title?: string
  // One line: what to do here
  detail: string
  // Saved on the stamp when done. Games and Together fill in the score or the people.
  mark: string
  // Right moment: a photo inside this window earns it, including the one that collects the pin
  window?: { opens: string; closes: string; label: string }
  game?: GameKind
  // A real-world extra on top of the Torches
  perk?: string
}

export const BONUS_REWARD: Record<BonusType, number> = { solo: 10, together: 20 }

export const bonusType = (b: Bonus): BonusType => (b.kind === 'together' ? 'together' : 'solo')

export const bonusKindTitle: Record<BonusKind, string> = {
  angle: 'Unique angle',
  moment: 'Right moment',
  selfie: 'Selfie with the view',
  game: 'Mini game',
  together: 'Photo together',
}

export const bonusTitle = (b: Bonus) => b.title ?? bonusKindTitle[b.kind]

const together = (pin: string, detail = 'One photo with everyone in it. Take turns behind the phone.', perk?: string): Bonus => ({
  id: `${pin}_together`,
  pin,
  kind: 'together',
  detail,
  mark: 'Together',
  perk,
})

export const BONUSES: Bonus[] = [
  // Griffith Observatory: all three kinds on one pin
  { id: 'p_griffith_angle', pin: 'p_griffith', kind: 'angle', detail: 'Find the Hollywood Sign framed between the two domes.', mark: 'Unique angle' },
  { id: 'p_griffith_lights', pin: 'p_griffith', kind: 'moment', detail: 'Capture the city once the lights come on.', mark: 'City lights',
    window: { opens: '2028-07-20T19:40', closes: '2028-07-20T23:00', label: 'City lights' } },
  together('p_griffith'),

  // Hollywood Sign Lookout
  { id: 'p_lakehollywood_selfie', pin: 'p_lakehollywood', kind: 'selfie', detail: 'Get the Hollywood Sign in the frame behind you.', mark: 'Selfie' },
  { id: 'p_lakehollywood_sunset', pin: 'p_lakehollywood', kind: 'moment', detail: 'Capture the sign in the last light.', mark: 'Sunset',
    window: { opens: '2028-07-20T19:45', closes: '2028-07-20T20:05', label: 'Sunset' } },

  // Urban Light
  { id: 'p_lacma_angle', pin: 'p_lacma', kind: 'angle', detail: 'Find the spot where the rows of lamps line up.', mark: 'Unique angle' },
  { id: 'p_lacma_selfie', pin: 'p_lacma', kind: 'selfie', detail: 'Get the lamps in the frame behind you.', mark: 'Selfie' },
  together('p_lacma'),

  // Manhattan Beach
  { id: 'p_manhattan_sunset', pin: 'p_manhattan', kind: 'moment', detail: 'Capture the pier as the sun goes down.', mark: 'Sunset',
    window: { opens: '2028-07-20T19:45', closes: '2028-07-20T20:15', label: 'Sunset' } },
  { id: 'p_manhattan_balance', pin: 'p_manhattan', kind: 'game', game: 'balance', title: 'Balance', detail: 'Hold the phone level while the ball drifts.', mark: 'Balance' },

  // Santa Monica Pier
  { id: 'p_pier_angle', pin: 'p_pier', kind: 'angle', detail: 'Find the Ferris wheel from the end of the pier.', mark: 'Unique angle' },
  { id: 'p_pier_selfie', pin: 'p_pier', kind: 'selfie', detail: 'Get the Ferris wheel in the frame behind you.', mark: 'Selfie' },
  together('p_pier'),

  // More Right moments where the time is the point
  { id: 'p_runyon_sunset', pin: 'p_runyon', kind: 'moment', detail: 'Capture the city from the trail in the last light.', mark: 'Sunset',
    window: { opens: '2028-07-20T19:45', closes: '2028-07-20T20:05', label: 'Sunset' } },
  { id: 'p_baldwin_sunset', pin: 'p_baldwin', kind: 'moment', detail: 'Capture the view from the top as the sun sets.', mark: 'Sunset',
    window: { opens: '2028-07-20T19:45', closes: '2028-07-20T20:05', label: 'Sunset' } },
  { id: 'p_malibu_sunset', pin: 'p_malibu', kind: 'moment', detail: 'Capture the surfers as the sun goes down.', mark: 'Sunset',
    window: { opens: '2028-07-20T19:45', closes: '2028-07-20T20:05', label: 'Sunset' } },
  { id: 'p_hbowl_show', pin: 'p_hbowl', kind: 'moment', detail: 'Capture the shell once the show starts.', mark: 'Show time',
    window: { opens: '2028-07-20T20:00', closes: '2028-07-20T22:30', label: 'Show time' } },
  { id: 'p_mariachi_music', pin: 'p_mariachi', kind: 'moment', detail: 'Capture the plaza once the mariachis gather.', mark: 'Mariachis',
    window: { opens: '2028-07-20T20:00', closes: '2028-07-20T23:00', label: 'Mariachis' } },

  // Venues: only while the game is on
  { id: 'p_sofi_stroke', pin: 'p_sofi', kind: 'game', game: 'stroke', title: 'Stroke rhythm', detail: 'Tap left and right in time with the stroke.', mark: 'Stroke' },
  together('p_sofi', 'One photo with everyone in it, the pool behind you.'),
  { id: 'p_coliseum_gun', pin: 'p_coliseum', kind: 'game', game: 'start-gun', title: 'Start gun', detail: 'Tap the moment the lights flash.', mark: 'Start gun' },

  // Events
  together('p_fanzone', 'One photo with everyone in it, the stage behind you.'),
  { id: 'p_sunrise_moment', pin: 'p_sunrise', kind: 'moment', detail: 'Capture the Strand as the sun comes up.', mark: 'Sunrise',
    window: { opens: '2028-07-22T05:55', closes: '2028-07-22T06:45', label: 'Sunrise' } },
  together('p_sunrise'),

  // Shop
  together('p_lantern', 'One photo with everyone in it, at the counter.', '10% off for pairs'),
]

// Is `now` (ms) inside the bonus's time window?
export const inWindow = (b: Bonus, now: number) =>
  !!b.window && now >= Date.parse(b.window.opens) && now <= Date.parse(b.window.closes)

export const bonusById = (id: string) => BONUSES.find((b) => b.id === id)
export const bonusesFor = (pinId: string) => BONUSES.filter((b) => b.pin === pinId)

// Done before today, so the Passport shows marks in the demo. Their Torches are in STARTING_TORCHES.
export const SEED_BONUSES: Record<string, string> = {
  p_lacma_selfie: 'Selfie',
  p_pier_together: 'With Kenji 🇯🇵',
}

// Venue bonuses only run while the game is on. That day's session at the venue decides it.
export type GameState = 'before' | 'live' | 'ended' | 'none'

export function venueSession(pin: Pin, date = TODAY) {
  return SCHEDULE.find((s) => s.pin === pin.id && s.date === date)
}
