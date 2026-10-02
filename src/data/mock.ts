// Mock data not covered by the LA28 dataset (la28.ts): medals, people, chats.
// All made up.

// ---- Sports ----

export type CountryMedals = { code: string; flag: string; name: string; gold: number; silver: number; bronze: number }

export const medalTable: CountryMedals[] = [
  { code: 'USA', flag: '🇺🇸', name: 'United States', gold: 18, silver: 14, bronze: 12 },
  { code: 'CHN', flag: '🇨🇳', name: 'China', gold: 16, silver: 11, bronze: 9 },
  { code: 'JPN', flag: '🇯🇵', name: 'Japan', gold: 9, silver: 7, bronze: 10 },
  { code: 'GBR', flag: '🇬🇧', name: 'Great Britain', gold: 8, silver: 9, bronze: 6 },
  { code: 'AUS', flag: '🇦🇺', name: 'Australia', gold: 7, silver: 5, bronze: 8 },
  { code: 'FRA', flag: '🇫🇷', name: 'France', gold: 6, silver: 8, bronze: 7 },
  { code: 'KOR', flag: '🇰🇷', name: 'South Korea', gold: 5, silver: 4, bronze: 6 },
]

// ---- People ----

export type Person = { id: string; name: string; flag: string; pins: number; places: number }

export const people: Person[] = [
  { id: 'mei', name: 'Mei', flag: '🇨🇳', pins: 42, places: 19 },
  { id: 'tomas', name: 'Tomás', flag: '🇨🇴', pins: 38, places: 22 },
  { id: 'priya', name: 'Priya', flag: '🇬🇧', pins: 35, places: 14 },
  { id: 'jonas', name: 'Jonas', flag: '🇩🇪', pins: 29, places: 17 },
  { id: 'aiko', name: 'Aiko', flag: '🇯🇵', pins: 26, places: 11 },
  { id: 'danny', name: 'Danny', flag: '🇺🇸', pins: 21, places: 8 },
]

export const personById = (id: string) => people.find((p) => p.id === id)

export type ChatPreview = { id: string; personId: string; last: string; time: string; unread: boolean }

export const chats: ChatPreview[] = [
  { id: 'c-tomas', personId: 'tomas', last: 'Saving you a seat at Sol Tacos for Saturday (translated)', time: '2m', unread: true },
  { id: 'c-priya', personId: 'priya', last: 'Meet by gate 4 after the final?', time: '15m', unread: false },
  { id: 'c-aiko', personId: 'aiko', last: 'Bring your doubles to the pin swap! (translated)', time: '3h', unread: false },
  { id: 'c-danny', personId: 'danny', last: 'Coffee is on me if you stop by Lantern', time: 'Yesterday', unread: false },
]
