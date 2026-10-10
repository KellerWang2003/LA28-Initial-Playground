// Batons: rare themed objects that rest at significant spots around LA. A fan
// who finds one carries it, within the hour, to another spot for the next fan.
// Its own feature, separate from pins. All mock and static; the live state
// (where each baton is, who carries it) is in lib/batons.ts.
import type { Shape } from '@/data/la28'

// ---- Config (placeholders until the open questions are decided) ----

export const BATON_CONFIG = {
  // Batons placed each day, by date; `default` for any other day
  batonsPerDay: { default: 5 } as Record<string, number>,
  carryMinutes: 60,
  // A resting baton this close sends a nearby alert (once a day per baton).
  // Wider than the claim radius, so the alert comes before you can take it.
  notifyRadiusM: 3000,
  // Close enough to accept a baton
  claimRadiusM: 2000,
  // Close enough to a spot to drop one there
  atSpotRadiusM: 50,
  // End of the day: recap, then batons reset for tomorrow (local time)
  recapTime: '22:00',
  // Carry reminders, in minutes left
  reminderMinutes: [15, 5],
}

// ---- Themes ----

export type BatonTheme = {
  id: string
  // 'Swimming baton'
  name: string
  // Short line for the card
  about: string
  shape: Shape
}

export const BATON_THEMES: BatonTheme[] = [
  { id: 'swimming', name: 'Swimming baton', about: 'For the swimmers racing at SoFi this week.', shape: 'swimming' },
  { id: 'athletics', name: 'Track baton', about: 'For the relay teams at the Coliseum.', shape: 'running' },
  { id: 'basketball', name: 'Basketball baton', about: 'For the hoops at Intuit Dome.', shape: 'basketball' },
  { id: 'gymnastics', name: 'Gymnastics baton', about: 'For the gymnasts at Crypto.com Arena.', shape: 'gymnastics' },
  { id: 'la84', name: 'LA 1984 baton', about: 'For the last Summer Games in Los Angeles, 44 years ago.', shape: 'landmark' },
  { id: 'volleyball', name: 'Beach volleyball baton', about: 'For the sand courts at Alamitos Beach.', shape: 'volleyball' },
]

export const themeById = (id: string) => BATON_THEMES.find((t) => t.id === id)!

// Themes in play each day, e.g. the sports with sessions that day. Any other day uses all of them.
export const DAY_THEMES: Record<string, string[]> = {
  '2028-07-20': ['swimming', 'athletics', 'basketball', 'gymnastics', 'la84'],
}

// ---- Significant spots ----

// The only places a baton rests or can be dropped: landmarks, venues and
// public squares (place ids from la28.ts). No shops.
export const BATON_SPOTS: string[] = [
  // Downtown
  'union', 'gcm', 'jvp', 'concerthall', 'angelsflight', 'chinatown', 'artsdistrict', 'grandpark', 'mariachi', 'cryptoarena',
  // Hollywood and around
  'griffith', 'hwof', 'hbowl', 'lakehollywood', 'echolake', 'silverlake', 'angelspoint',
  // Mid-City and west
  'lacma', 'tarpits', 'farmersmarket', 'getty', 'baldwin', 'leimert',
  // South
  'coliseum', 'endeavour', 'watts', 'sofi', 'intuit',
  // The coast
  'smpier', 'venice', 'marina', 'manhattan', 'hermosa',
  // Long Beach and Pasadena
  'queenmary', 'alamitos', 'rosebowl', 'oldpasadena',
]

// ---- Mock carriers and notes, so a baton has a history before you find it ----

export type Carrier = { name: string; cc: string }

export const MOCK_CARRIERS: Carrier[] = [
  { name: 'Mei', cc: 'CN' },
  { name: 'Tomás', cc: 'CO' },
  { name: 'Priya', cc: 'GB' },
  { name: 'Jonas', cc: 'DE' },
  { name: 'Aiko', cc: 'JP' },
  { name: 'Lina', cc: 'MX' },
  { name: 'Omar', cc: 'MA' },
  { name: 'Noor', cc: 'NL' },
  { name: 'Kwame', cc: 'GH' },
  { name: 'Sofia', cc: 'BR' },
  { name: 'Liam', cc: 'AU' },
  { name: 'Chloé', cc: 'FR' },
]

export const MOCK_NOTES: (string | null)[] = [
  'Ran the last block for the relay team 🏃',
  'Carried it past the taco trucks. Guard it with your life.',
  'First time in LA. This thing made my day.',
  'Go fast, the hour goes quicker than you think!',
  'From one stranger to the next 🤝',
  null,
  'Took the long way so it could see the sunset.',
  'My kids insisted it ride on their shoulders.',
  'Left it where my grandfather watched the 84 Games.',
  null,
  'Hope it makes it to the beach by tonight 🌊',
  'Pass it on. Someone needs this today.',
]
