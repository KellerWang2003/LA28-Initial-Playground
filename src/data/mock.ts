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
  // The session in la28.ts this line is about
  session?: string
}

export const athletes: Athlete[] = [
  { id: 'hale', name: 'Noah Hale', code: 'USA', flag: '🇺🇸', sport: 'Swimming', session: 's_swim_0720', line: "In the men's 200m freestyle final, next in tonight's session at SoFi Stadium." },
  { id: 'byrne', name: 'Isla Byrne', code: 'AUS', flag: '🇦🇺', sport: 'Swimming', session: 's_swim_0720', line: "Won the women's 100m backstroke final earlier in the SoFi finals session." },
  { id: 'park', name: 'Liam Park', code: 'KOR', flag: '🇰🇷', sport: 'Swimming', session: 's_swim_0720', line: "In lane 6 for the men's 200m freestyle final tonight at SoFi Stadium." },
  { id: 'sato', name: 'Haruto Sato', code: 'JPN', flag: '🇯🇵', sport: 'Gymnastics', session: 's_gym_0720', line: "Leading the men's all-around final at Crypto.com Arena, rotation 4 of 6." },
  { id: 'kipkoech', name: 'Jonah Kipkoech', code: 'KEN', flag: '🇰🇪', sport: 'Athletics', session: 's_athl_0720', line: "Racing the men's 10,000m final at the LA Memorial Coliseum at 8:00 PM." },
  { id: 'campbell', name: 'Andre Campbell', code: 'JAM', flag: '🇯🇲', sport: 'Athletics', session: 's_athl_0720', line: "Running in the men's 100m heats tonight at the Coliseum." },
  { id: 'moreau', name: 'Alex Moreau', code: 'AUS', flag: '🇦🇺', sport: 'Basketball', session: 's_bball_0720', line: 'On the floor for Australia against Serbia at Intuit Dome, second quarter.' },
  { id: 'okafor', name: 'Ada Okafor', code: 'NGR', flag: '🇳🇬', sport: 'Basketball', session: 's_bball_0723', line: "Leads Nigeria into the women's quarterfinal against Spain on July 23." },
  { id: 'ferreira', name: 'Lucas Ferreira', code: 'BRA', flag: '🇧🇷', sport: 'Football', session: 's_fb_m_0720', line: "Starts for Brazil against Morocco at the Rose Bowl at 8:30 PM." },
  { id: 'mori', name: 'Kenji Mori', code: 'JPN', flag: '🇯🇵', sport: 'Football', session: 's_fb_0722', line: "Captains Japan against Brazil in the men's semifinal on July 22." },
  { id: 'souza', name: 'Ana Souza', code: 'BRA', flag: '🇧🇷', sport: 'Beach volleyball', session: 's_bvb_am', line: "Won this morning's women's pool play match against the USA, 2–1." },
]

// ---- People ----

export type Person = { id: string; name: string; flag: string; pins: number; places: number; bio: string; batons: number; games: number }

export const people: Person[] = [
  { id: 'mei', name: 'Mei', flag: '🇨🇳', pins: 42, places: 19, bio: 'Chasing every Legendary pin before the closing ceremony.', batons: 4, games: 6 },
  { id: 'tomas', name: 'Tomás', flag: '🇨🇴', pins: 38, places: 22, bio: 'Hosting watch parties at Sol Tacos all week.', batons: 3, games: 4 },
  { id: 'priya', name: 'Priya', flag: '🇬🇧', pins: 35, places: 14, bio: 'Here for athletics. Will carry any baton.', batons: 5, games: 5 },
  { id: 'jonas', name: 'Jonas', flag: '🇩🇪', pins: 29, places: 17, bio: 'Cycling between venues, one pin at a time.', batons: 2, games: 3 },
  { id: 'aiko', name: 'Aiko', flag: '🇯🇵', pins: 26, places: 11, bio: 'Pin swapper. Bring your doubles.', batons: 1, games: 4 },
  { id: 'danny', name: 'Danny', flag: '🇺🇸', pins: 21, places: 8, bio: 'Local. Ask me where to get coffee.', batons: 2, games: 2 },
]

// Fans you can meet by scanning. They stay off your people list until you add them.
export const meetable: Person[] = [
  { id: 'lina', name: 'Lina', flag: '🇲🇽', pins: 18, places: 7, bio: 'First Games! Football and beach volleyball.', batons: 1, games: 3 },
  { id: 'omar', name: 'Omar', flag: '🇲🇦', pins: 15, places: 9, bio: 'Following Morocco through the knockout rounds.', batons: 0, games: 2 },
  { id: 'noor', name: 'Noor', flag: '🇳🇱', pins: 12, places: 5, bio: 'Swimming fan, sunrise runner.', batons: 2, games: 1 },
  // Met through an after-game group. They stay off your list until you add them.
  { id: 'julia', name: 'Julia', flag: '🇫🇷', pins: 14, places: 6, bio: 'Collecting the shop pins in every neighborhood.', batons: 1, games: 2 },
  { id: 'hana', name: 'Hana', flag: '🇯🇵', pins: 9, places: 4, bio: 'Here with my family for gymnastics.', batons: 0, games: 1 },
  { id: 'sam', name: 'Sam', flag: '🇦🇺', pins: 11, places: 3, bio: 'Surf in the morning, games at night.', batons: 1, games: 2 },
  { id: 'rosa', name: 'Rosa', flag: '🇲🇽', pins: 8, places: 5, bio: 'Taking photos of every venue.', batons: 0, games: 1 },
  { id: 'leo', name: 'Leo', flag: '🇩🇪', pins: 7, places: 4, bio: 'Just landed. Show me around!', batons: 0, games: 0 },
]

// ---- Achievements ----

export type AchievementId = 'first-pin' | 'ten-pins' | 'twenty-five-pins' | 'explorer' | 'wanderer' | 'baton' | 'relay' | 'game-day' | 'superfan'

export const ACHIEVEMENTS: { id: AchievementId; title: string; detail: string }[] = [
  { id: 'first-pin', title: 'First pin', detail: 'Collected a pin' },
  { id: 'ten-pins', title: 'Collector', detail: '10 pins' },
  { id: 'twenty-five-pins', title: 'Pin hunter', detail: '25 pins' },
  { id: 'explorer', title: 'Explorer', detail: '5 places in LA' },
  { id: 'wanderer', title: 'Wanderer', detail: '15 places in LA' },
  { id: 'baton', title: 'Baton carrier', detail: 'Carried a baton' },
  { id: 'relay', title: 'Relay runner', detail: 'Carried 3 batons' },
  { id: 'game-day', title: 'Game day', detail: 'Went to a game' },
  { id: 'superfan', title: 'Superfan', detail: 'Went to 4 games' },
]

// What a fan has earned, from their numbers, in catalog order
export function achievementsOf(p: Person) {
  const earned: Record<AchievementId, boolean> = {
    'first-pin': p.pins >= 1,
    'ten-pins': p.pins >= 10,
    'twenty-five-pins': p.pins >= 25,
    explorer: p.places >= 5,
    wanderer: p.places >= 15,
    baton: p.batons >= 1,
    relay: p.batons >= 3,
    'game-day': p.games >= 1,
    superfan: p.games >= 4,
  }
  return ACHIEVEMENTS.filter((a) => earned[a.id])
}

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
