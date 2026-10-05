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

// Fictional athletes for Day 7 (Thu, July 20, 2028). Lines match sessions in la28.ts.
export type Athlete = {
  id: string
  name: string
  code: string
  flag: string
  sport: string
  line: string
}

export const athletes: Athlete[] = [
  { id: 'hale', name: 'Noah Hale', code: 'USA', flag: '🇺🇸', sport: 'Swimming', line: "In the men's 200m freestyle final, next in tonight's session at SoFi Stadium." },
  { id: 'byrne', name: 'Isla Byrne', code: 'AUS', flag: '🇦🇺', sport: 'Swimming', line: "Won the women's 100m backstroke final earlier in the SoFi finals session." },
  { id: 'sato', name: 'Haruto Sato', code: 'JPN', flag: '🇯🇵', sport: 'Gymnastics', line: "Leading the men's all-around final at Crypto.com Arena, rotation 4 of 6." },
  { id: 'kipkoech', name: 'Jonah Kipkoech', code: 'KEN', flag: '🇰🇪', sport: 'Athletics', line: "Racing the men's 10,000m final at the LA Memorial Coliseum at 8:00 PM." },
  { id: 'campbell', name: 'Andre Campbell', code: 'JAM', flag: '🇯🇲', sport: 'Athletics', line: "Running in the men's 100m heats tonight at the Coliseum." },
  { id: 'moreau', name: 'Alex Moreau', code: 'AUS', flag: '🇦🇺', sport: 'Basketball', line: 'On the floor for Australia against Serbia at Intuit Dome, second quarter.' },
  { id: 'ferreira', name: 'Lucas Ferreira', code: 'BRA', flag: '🇧🇷', sport: 'Football', line: "Starts for Brazil against Morocco at the Rose Bowl at 8:30 PM." },
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

// Fans you can meet by scanning. They stay off your people list until you add them.
export const meetable: Person[] = [
  { id: 'lina', name: 'Lina', flag: '🇲🇽', pins: 18, places: 7 },
  { id: 'omar', name: 'Omar', flag: '🇲🇦', pins: 15, places: 9 },
  { id: 'noor', name: 'Noor', flag: '🇳🇱', pins: 12, places: 5 },
]

// Stable id encoded in this user's own code
export const ME_ID = 'me'

export const personById = (id: string) => people.find((p) => p.id === id) ?? meetable.find((p) => p.id === id)

export const fanCode = (id: string) => `la28:${id}`

// `la28:lina` or a bare id. Blank input returns null.
export function idFromFanCode(raw: string) {
  const text = raw.trim().toLowerCase()
  if (!text) return null
  const id = text.startsWith('la28:') ? text.slice(5) : text
  if (!/^[a-z0-9-]+$/.test(id)) return null
  return id
}

export type ChatPreview = { id: string; personId: string; last: string; time: string; unread: boolean }

export const chats: ChatPreview[] = [
  { id: 'c-tomas', personId: 'tomas', last: 'Saving you a seat at Sol Tacos for Saturday (translated)', time: '2m', unread: true },
  { id: 'c-priya', personId: 'priya', last: 'Meet by gate 4 after the final?', time: '15m', unread: false },
  { id: 'c-aiko', personId: 'aiko', last: 'Bring your doubles to the pin swap! (translated)', time: '3h', unread: false },
  { id: 'c-danny', personId: 'danny', last: 'Coffee is on me if you stop by Lantern', time: 'Yesterday', unread: false },
]
