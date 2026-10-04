// Mock data not covered by the LA28 dataset (la28.ts): medals, people, chats.
// All made up.

// ---- Sports ----

export type SportMedals = { sport: string; gold: number; silver: number; bronze: number }

export type CountryMedals = {
  code: string
  flag: string
  name: string
  gold: number
  silver: number
  bronze: number
  // Medals by sport, for the expanded row
  bySport: SportMedals[]
}

const m = (sport: string, gold: number, silver: number, bronze: number): SportMedals => ({ sport, gold, silver, bronze })

// Day 7 of LA28. Italy and South Korea are tied on purpose to show shared ranks.
export const medalTable: CountryMedals[] = [
  { code: 'USA', flag: '🇺🇸', name: 'United States', gold: 18, silver: 14, bronze: 12, bySport: [m('Swimming', 9, 6, 4), m('Athletics', 4, 3, 3), m('Gymnastics', 2, 2, 1), m('Basketball', 0, 0, 0), m('Other', 3, 3, 4)] },
  { code: 'CHN', flag: '🇨🇳', name: 'China', gold: 16, silver: 11, bronze: 9, bySport: [m('Diving', 6, 2, 1), m('Table tennis', 4, 2, 0), m('Gymnastics', 2, 3, 2), m('Swimming', 2, 2, 3), m('Other', 2, 2, 3)] },
  { code: 'JPN', flag: '🇯🇵', name: 'Japan', gold: 9, silver: 7, bronze: 10, bySport: [m('Judo', 4, 2, 3), m('Gymnastics', 3, 1, 2), m('Wrestling', 1, 2, 2), m('Other', 1, 2, 3)] },
  { code: 'GBR', flag: '🇬🇧', name: 'Great Britain', gold: 8, silver: 9, bronze: 6, bySport: [m('Rowing', 3, 2, 1), m('Cycling', 3, 3, 2), m('Swimming', 1, 2, 2), m('Other', 1, 2, 1)] },
  { code: 'AUS', flag: '🇦🇺', name: 'Australia', gold: 7, silver: 5, bronze: 8, bySport: [m('Swimming', 5, 3, 4), m('Cycling', 1, 1, 2), m('Other', 1, 1, 2)] },
  { code: 'FRA', flag: '🇫🇷', name: 'France', gold: 6, silver: 8, bronze: 7, bySport: [m('Judo', 2, 3, 2), m('Fencing', 2, 2, 1), m('Swimming', 1, 1, 2), m('Other', 1, 2, 2)] },
  { code: 'ITA', flag: '🇮🇹', name: 'Italy', gold: 5, silver: 4, bronze: 6, bySport: [m('Fencing', 2, 1, 2), m('Cycling', 1, 2, 1), m('Other', 2, 1, 3)] },
  { code: 'KOR', flag: '🇰🇷', name: 'South Korea', gold: 5, silver: 4, bronze: 6, bySport: [m('Archery', 3, 1, 1), m('Fencing', 1, 1, 2), m('Other', 1, 2, 3)] },
  { code: 'NED', flag: '🇳🇱', name: 'Netherlands', gold: 5, silver: 3, bronze: 4, bySport: [m('Cycling', 3, 1, 1), m('Rowing', 1, 1, 2), m('Other', 1, 1, 1)] },
  { code: 'GER', flag: '🇩🇪', name: 'Germany', gold: 4, silver: 6, bronze: 7, bySport: [m('Canoe', 2, 2, 1), m('Equestrian', 1, 2, 2), m('Other', 1, 2, 4)] },
  { code: 'CAN', flag: '🇨🇦', name: 'Canada', gold: 3, silver: 5, bronze: 6, bySport: [m('Swimming', 2, 2, 3), m('Athletics', 1, 1, 1), m('Other', 0, 2, 2)] },
  { code: 'BRA', flag: '🇧🇷', name: 'Brazil', gold: 3, silver: 3, bronze: 5, bySport: [m('Beach volleyball', 1, 1, 0), m('Skateboarding', 1, 1, 2), m('Other', 1, 1, 3)] },
  { code: 'KEN', flag: '🇰🇪', name: 'Kenya', gold: 3, silver: 1, bronze: 1, bySport: [m('Athletics', 3, 1, 1)] },
  { code: 'JAM', flag: '🇯🇲', name: 'Jamaica', gold: 2, silver: 3, bronze: 1, bySport: [m('Athletics', 2, 3, 1)] },
  { code: 'NZL', flag: '🇳🇿', name: 'New Zealand', gold: 2, silver: 2, bronze: 2, bySport: [m('Rowing', 1, 1, 0), m('Sailing', 1, 0, 1), m('Other', 0, 1, 1)] },
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
