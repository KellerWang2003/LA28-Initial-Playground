// LA28 Fan Passport — mock data for map layers
// Games run July 14–30, 2028. "Today" in the mock is Thu, July 20, 2028.
// Coordinates are approximate real lat/lng. Shops and people are fictional.
// Everything is static: statuses and labels are written for NOW and never recomputed.

export const NOW = '2028-07-20T19:20'
export const TODAY = NOW.slice(0, 10)

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type PlaceType = 'attraction' | 'venue' | 'shop' | 'public'

export type Place = {
  id: string
  name: string
  type: PlaceType
  hood: string
  lat: number
  lng: number
  hours?: string
  pins?: string[]
  // Venues
  sport?: string
  // Shops
  owner?: string
  perk?: string
  hostsGatherings?: boolean
  capacity?: number
}

export type EventType = 'game' | 'official' | 'sponsored' | 'fan'

export type GameEvent = {
  id: string
  type: EventType
  title: string
  place: string
  date: string
  time: string
  why: string
  session?: string
  sport?: string
  countries?: string[]
  fansOnApp?: number
  going?: number
  // [taken, capacity]
  spots?: [number, number]
  live?: boolean
  pin?: string | null
  handshakePin?: boolean
  sponsor?: string
  host?: { name: string; cc: string }
  task?: string
}

export type SessionStatus = 'finished' | 'live' | 'upcoming'

export type Session = {
  id: string
  sport: string
  title: string
  venue: string
  date: string
  start: string
  end: string
  status: SessionStatus
  medal?: boolean
  teams?: string[]
  score?: [number, number]
  fansOnApp?: number
  pin?: string
  handshakePin?: boolean
  results?: { match: string; score: string; winner: string }[]
  live?: {
    progress?: string
    standings?: [string, number][]
    score?: [number, number]
    clock?: string
    match?: string
    sets?: [number, number][]
  }
  next?: string
  events?: string[]
  races?: { time: string; title: string; status: 'finished' | 'next' | 'upcoming'; podium?: string[]; lanes?: string[] }[]
}

export type WatchSpot = { place: string; session: string; screens: number; official?: boolean; crowdCountries: string[]; note?: string }

export type Activity = { place: string; headingThere: number; topCountries: string[]; level: 'quiet' | 'busy' | 'packed' }

export type Drop = { id: string; place: string; rarity: Rarity; opens: string; closes: string; need: number | 'surprise'; note?: string }

export type CrewMember = { name: string; cc: string; near: string | null; updated: string | null; sharing: boolean }

// Every marker and pin is die-cut in the shape of its subject (see shape-art.tsx)
export type Shape =
  // Sports
  | 'running' | 'swimming' | 'basketball' | 'football' | 'gymnastics' | 'volleyball'
  // Places
  | 'telescope' | 'ferris-wheel' | 'palm' | 'train' | 'market' | 'landmark' | 'music' | 'guitar' | 'shell' | 'sunset' | 'trees' | 'boat'
  // Shops
  | 'coffee' | 'taco' | 'book' | 'vinyl' | 'grill' | 'drum'
  // Activities
  | 'party' | 'concert' | 'dumplings' | 'swap' | 'languages' | 'sketch' | 'tv'

export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary'
export type PinKind = 'place' | 'shop' | 'venue' | 'drop' | 'half'
// locked: not collectable yet; open: collectable; expiring: open, closing soon
export type PinStatus = 'locked' | 'open' | 'expiring'

export type Pin = {
  id: string
  name: string
  place: string
  kind: PinKind
  shape: Shape
  rarity: Rarity
  status: PinStatus
  // Full label for cards, short one for the map when zoomed in
  label: string
  short: string
  // Venue pins only show while their session is live
  onMap: boolean
}

// ─────────────────────────────────────────────
// 1. PLACES — every tappable spot on the map
// ─────────────────────────────────────────────
export const PLACES: Place[] = [
  { id: 'griffith', name: 'Griffith Observatory', type: 'attraction', hood: 'Los Feliz', lat: 34.1184, lng: -118.3004, hours: '12–10 PM', pins: ['p_griffith'] },
  { id: 'smpier', name: 'Santa Monica Pier', type: 'attraction', hood: 'Santa Monica', lat: 34.0083, lng: -118.4988, hours: 'All day', pins: ['p_pier', 'p_pier_half'] },
  { id: 'venice', name: 'Venice Boardwalk', type: 'attraction', hood: 'Venice', lat: 33.985, lng: -118.4729, hours: 'All day', pins: ['p_venice_half'] },
  { id: 'union', name: 'Union Station', type: 'attraction', hood: 'Downtown', lat: 34.0562, lng: -118.2365, hours: 'All day', pins: ['p_union'] },
  { id: 'gcm', name: 'Grand Central Market', type: 'attraction', hood: 'Downtown', lat: 34.0508, lng: -118.2489, hours: '8 AM–10 PM', pins: [] },
  { id: 'jvp', name: 'Japanese Village Plaza', type: 'attraction', hood: 'Little Tokyo', lat: 34.0493, lng: -118.24, hours: '10 AM–9 PM', pins: ['p_ltokyo'] },
  { id: 'leimert', name: 'Leimert Park Plaza', type: 'attraction', hood: 'Leimert Park', lat: 34.0083, lng: -118.3318, hours: 'All day', pins: ['p_leimert'] },
  { id: 'mariachi', name: 'Mariachi Plaza', type: 'attraction', hood: 'Boyle Heights', lat: 34.0472, lng: -118.2194, hours: 'All day', pins: [] },
  { id: 'hermosa', name: 'Hermosa Beach Pier', type: 'attraction', hood: 'Hermosa Beach', lat: 33.8616, lng: -118.4013, hours: 'All day', pins: ['p_hermosa_drop'] },

  // Venues — no permanent pins. A venue pin only exists while a session is running there (see SCHEDULE)
  { id: 'coliseum', name: 'LA Memorial Coliseum', type: 'venue', hood: 'Exposition Park', lat: 34.0141, lng: -118.2879, sport: 'Athletics' },
  { id: 'sofi', name: 'SoFi Stadium', type: 'venue', hood: 'Inglewood', lat: 33.9535, lng: -118.3392, sport: 'Swimming' },
  { id: 'rosebowl', name: 'Rose Bowl', type: 'venue', hood: 'Pasadena', lat: 34.1613, lng: -118.1676, sport: 'Football' },
  { id: 'intuit', name: 'Intuit Dome', type: 'venue', hood: 'Inglewood', lat: 33.9445, lng: -118.3434, sport: 'Basketball' },
  { id: 'cryptoarena', name: 'Crypto.com Arena', type: 'venue', hood: 'Downtown', lat: 34.043, lng: -118.2673, sport: 'Gymnastics' },
  { id: 'alamitos', name: 'Alamitos Beach', type: 'venue', hood: 'Long Beach', lat: 33.765, lng: -118.177, sport: 'Beach volleyball' },

  // Opted-in local shops (fictional)
  { id: 'lantern', name: 'Lantern Café', type: 'shop', hood: 'San Gabriel', lat: 34.0966, lng: -118.1065, owner: 'Danny', perk: '10% off for pairs', hostsGatherings: true, capacity: 12, pins: ['p_lantern'] },
  { id: 'sol', name: 'Sol Tacos', type: 'shop', hood: 'Boyle Heights', lat: 34.046, lng: -118.218, owner: 'Rosa', perk: 'Free agua fresca', hostsGatherings: true, capacity: 16, pins: ['p_sol'] },
  { id: 'papercrane', name: 'Paper Crane Books', type: 'shop', hood: 'Little Tokyo', lat: 34.0498, lng: -118.2412, owner: 'Ken', perk: 'Free postcard', hostsGatherings: true, capacity: 8, pins: ['p_papercrane'] },
  { id: 'echo', name: 'Echo Records', type: 'shop', hood: 'Echo Park', lat: 34.0779, lng: -118.2606, owner: 'Jess', perk: '15% off vinyl', hostsGatherings: false, pins: ['p_echo'] },
  { id: 'seoulbbq', name: 'Seoul Corner BBQ', type: 'shop', hood: 'Koreatown', lat: 34.0618, lng: -118.3009, owner: 'Min', perk: 'Free side for groups of 4+', hostsGatherings: true, capacity: 20, pins: ['p_seoul'] },
  { id: 'leimertdrum', name: 'Leimert Drum & Coffee', type: 'shop', hood: 'Leimert Park', lat: 34.009, lng: -118.331, owner: 'Andre', perk: 'Free drip coffee', hostsGatherings: true, capacity: 15, pins: [] },

  // Public spots fans can host at
  { id: 'almansor', name: 'Almansor Park', type: 'public', hood: 'Alhambra', lat: 34.0897, lng: -118.118 },
  { id: 'echolake', name: 'Echo Park Lake', type: 'public', hood: 'Echo Park', lat: 34.0729, lng: -118.2606 },
  { id: 'grandpark', name: 'Grand Park', type: 'public', hood: 'Downtown', lat: 34.0555, lng: -118.2443 },
]

// ─────────────────────────────────────────────
// 2. EVENTS — games, official, sponsored, fan-hosted
// ─────────────────────────────────────────────
export const EVENTS: GameEvent[] = [
  // Games
  { id: 'e_swim200', type: 'game', session: 's_swim_0720', title: "Swimming, men's 200m freestyle final", place: 'sofi', date: '2028-07-20', time: '19:00', sport: 'Swimming', countries: ['USA', 'AUS', 'GBR', 'CHN'], fansOnApp: 2300, live: true, pin: 'p_sofi', why: 'You follow swimming' },
  { id: 'e_athl', type: 'game', session: 's_athl_0721', title: 'Athletics evening session', place: 'coliseum', date: '2028-07-21', time: '18:30', sport: 'Athletics', fansOnApp: 4100, pin: 'p_coliseum', why: 'Near you' },
  { id: 'e_fb_semi', type: 'game', session: 's_fb_0722', title: "Football, men's semifinal: Brazil vs Japan", place: 'rosebowl', date: '2028-07-22', time: '14:00', sport: 'Football', countries: ['BRA', 'JPN'], fansOnApp: 6200, pin: 'p_rosebowl', handshakePin: true, why: 'Fans from both countries are on the app' },
  { id: 'e_bball', type: 'game', session: 's_bball_0723', title: "Basketball, women's quarterfinal: Nigeria vs Spain", place: 'intuit', date: '2028-07-23', time: '20:00', sport: 'Basketball', countries: ['NGR', 'ESP'], fansOnApp: 1800, pin: 'p_intuit', handshakePin: true, why: '2 people you met follow Nigeria' },
  { id: 'e_bvb', type: 'game', session: 's_bvb_0724', title: 'Beach volleyball, round of 16', place: 'alamitos', date: '2028-07-24', time: '16:00', sport: 'Beach volleyball', fansOnApp: 950, pin: 'p_beachvb', why: 'Popular with solo travelers' },

  // Official LA28
  { id: 'e_fanzone', type: 'official', title: 'LA28 Fan Zone night', place: 'coliseum', date: '2028-07-20', time: '20:00', going: 5800, pin: null, why: 'Popular with fans near you' },
  { id: 'e_medalnight', type: 'official', title: 'Medal celebration concert', place: 'grandpark', date: '2028-07-25', time: '19:30', going: 9100, why: 'Free, near your hotel' },

  // Sponsored
  { id: 'e_sunrise', type: 'sponsored', title: 'Sunrise run on the Strand', place: 'smpier', date: '2028-07-22', time: '06:30', going: 380, sponsor: 'Presented by a sponsor', pin: 'p_pier', why: 'Next to a pin you collected' },
  { id: 'e_boardwalk3x3', type: 'sponsored', title: '3x3 pickup tournament', place: 'venice', date: '2028-07-23', time: '10:00', going: 240, sponsor: 'Presented by a sponsor', why: 'You follow basketball' },

  // Fan-hosted
  { id: 'e_watch_fb', type: 'fan', title: 'Brazil vs Japan watch party', place: 'sol', date: '2028-07-22', time: '13:30', host: { name: 'Tomás', cc: 'CO' }, spots: [9, 16], task: 'Group pose', pin: 'p_sol', why: 'Tomás from your crew is hosting' },
  { id: 'e_dumplings', type: 'fan', title: 'Badminton and dumplings', place: 'almansor', date: '2028-07-23', time: '12:00', host: { name: 'Mei', cc: 'CN' }, spots: [6, 10], task: 'Synced twist', pin: null, why: 'You are hosting' },
  { id: 'e_pinswap', type: 'fan', title: 'Pin swap afternoon', place: 'lantern', date: '2028-07-23', time: '15:00', host: { name: 'Aiko', cc: 'JP' }, spots: [6, 10], task: 'Pass the beat', pin: 'p_lantern', why: '2 people you met are going' },
  { id: 'e_kbbq', type: 'fan', title: 'Pre-game dinner before Nigeria vs Spain', place: 'seoulbbq', date: '2028-07-23', time: '17:00', host: { name: 'Amara', cc: 'NG' }, spots: [11, 20], task: 'Build a shape', pin: 'p_seoul', why: 'Before a game you saved' },
  { id: 'e_langpicnic', type: 'fan', title: 'Language swap picnic', place: 'echolake', date: '2028-07-24', time: '11:00', host: { name: 'Lucía', cc: 'MX' }, spots: [7, 12], task: 'Pass the beat', pin: null, why: 'You speak 2 of the languages listed' },
  { id: 'e_drum', type: 'fan', title: 'Drum circle and coffee', place: 'leimertdrum', date: '2028-07-24', time: '18:00', host: { name: 'Kwame', cc: 'GH' }, spots: [9, 15], task: 'Synced twist', pin: 'p_leimert', why: "Near a pin you haven't collected" },
  { id: 'e_sketch', type: 'fan', title: 'Sketch Little Tokyo together', place: 'papercrane', date: '2028-07-25', time: '10:00', host: { name: 'Sven', cc: 'SE' }, spots: [3, 8], task: 'Group pose', pin: 'p_papercrane', why: 'Small group, good for solo travelers' },
  { id: 'e_afterparty', type: 'fan', title: 'Swimming final after-hangout', place: 'sofi', date: '2028-07-20', time: '21:30', host: { name: 'Priya', cc: 'GB' }, spots: [14, 20], task: 'Group pose', pin: null, why: "Right after the game you're at" },
]

// ─────────────────────────────────────────────
// 3. SCHEDULE — every session, with live state. Feeds Sports + live badges on venue markers
// `pin` = the venue pin. It appears on the map only from `start` to `end`, and only for fans at the venue.
// ─────────────────────────────────────────────
export const SCHEDULE: Session[] = [
  // Today, Thu July 20
  { id: 's_bvb_am', sport: 'Beach volleyball', title: "Women's pool play", venue: 'alamitos', date: '2028-07-20', start: '09:00', end: '13:00', status: 'finished',
    results: [{ match: 'BRA vs USA', score: '2–1', winner: 'BRA' }, { match: 'AUS vs CAN', score: '2–0', winner: 'AUS' }] },

  { id: 's_fb_w_0720', sport: 'Football', title: "Women's group B: Japan vs Canada", venue: 'rosebowl', date: '2028-07-20', start: '13:00', end: '15:00', status: 'finished',
    teams: ['JPN', 'CAN'], score: [2, 1], fansOnApp: 3100 },

  { id: 's_gym_0720', sport: 'Gymnastics', title: "Men's all-around final", venue: 'cryptoarena', date: '2028-07-20', start: '18:00', end: '20:30', status: 'live', medal: true,
    live: { progress: 'Rotation 4 of 6', standings: [['JPN', 57.433], ['CHN', 57.1], ['GBR', 56.866]] }, fansOnApp: 1400, pin: 'p_arena' },

  { id: 's_swim_0720', sport: 'Swimming', title: 'Finals session', venue: 'sofi', date: '2028-07-20', start: '18:30', end: '20:45', status: 'live', medal: true, fansOnApp: 2300, pin: 'p_sofi',
    races: [
      { time: '18:35', title: "Women's 100m backstroke final", status: 'finished', podium: ['AUS', 'USA', 'CAN'] },
      { time: '18:58', title: "Men's 100m breaststroke semifinals", status: 'finished' },
      { time: '19:28', title: "Men's 200m freestyle final", status: 'next', lanes: ['GBR', 'USA', 'AUS', 'CHN', 'ROU', 'KOR', 'JPN', 'GER'] },
      { time: '20:20', title: "Women's 4x200m freestyle relay final", status: 'upcoming' },
    ] },

  { id: 's_bball_0720', sport: 'Basketball', title: "Men's group A: Serbia vs Australia", venue: 'intuit', date: '2028-07-20', start: '19:00', end: '21:00', status: 'live',
    teams: ['SRB', 'AUS'], live: { score: [38, 35], clock: 'Q2 4:12' }, fansOnApp: 1650, pin: 'p_intuit', handshakePin: true },

  { id: 's_bvb_pm', sport: 'Beach volleyball', title: "Men's pool play, evening", venue: 'alamitos', date: '2028-07-20', start: '18:00', end: '22:00', status: 'live',
    live: { match: 'NOR vs QAT', sets: [[21, 18], [14, 12]], clock: 'Set 2' }, next: 'ITA vs USA, 20:00', fansOnApp: 620, pin: 'p_beachvb' },

  { id: 's_athl_0720', sport: 'Athletics', title: 'Evening session', venue: 'coliseum', date: '2028-07-20', start: '20:00', end: '22:30', status: 'upcoming', medal: true,
    events: ["Men's 100m heats", "Women's shot put final", "Men's 10,000m final"], fansOnApp: 4400, pin: 'p_coliseum' },

  { id: 's_fb_m_0720', sport: 'Football', title: "Men's group C: Brazil vs Morocco", venue: 'rosebowl', date: '2028-07-20', start: '20:30', end: '22:30', status: 'upcoming',
    teams: ['BRA', 'MAR'], fansOnApp: 5200, pin: 'p_rosebowl', handshakePin: true },

  // Coming up
  { id: 's_athl_0721', sport: 'Athletics', title: 'Evening session', venue: 'coliseum', date: '2028-07-21', start: '18:30', end: '21:30', status: 'upcoming', medal: true,
    events: ["Men's 100m semifinals and final", "Women's long jump final"], fansOnApp: 4100, pin: 'p_coliseum' },
  { id: 's_swim_0721', sport: 'Swimming', title: 'Finals session', venue: 'sofi', date: '2028-07-21', start: '18:30', end: '20:45', status: 'upcoming', medal: true, fansOnApp: 1900, pin: 'p_sofi' },
  { id: 's_fb_0722', sport: 'Football', title: "Men's semifinal: Brazil vs Japan", venue: 'rosebowl', date: '2028-07-22', start: '14:00', end: '16:00', status: 'upcoming',
    teams: ['BRA', 'JPN'], fansOnApp: 6200, pin: 'p_rosebowl', handshakePin: true },
  { id: 's_bball_0723', sport: 'Basketball', title: "Women's quarterfinal: Nigeria vs Spain", venue: 'intuit', date: '2028-07-23', start: '20:00', end: '22:00', status: 'upcoming',
    teams: ['NGR', 'ESP'], fansOnApp: 1800, pin: 'p_intuit', handshakePin: true },
  { id: 's_bvb_0724', sport: 'Beach volleyball', title: 'Round of 16', venue: 'alamitos', date: '2028-07-24', start: '16:00', end: '22:00', status: 'upcoming', fansOnApp: 950, pin: 'p_beachvb' },
]

// Venue pins on the map right now: one per live session
export const activeVenuePins = (schedule = SCHEDULE) =>
  schedule
    .filter((x) => x.status === 'live' && x.pin)
    .map((x) => ({ pin: x.pin!, place: x.venue, session: x.id, sport: x.sport, closes: `${x.date}T${x.end}` }))

// ─────────────────────────────────────────────
// 4. WATCH SPOTS — places showing a session right now (Sports ↔ Explore link)
// ─────────────────────────────────────────────
export const WATCH_SPOTS: WatchSpot[] = [
  { place: 'grandpark', session: 's_swim_0720', screens: 1, official: true, crowdCountries: ['USA', 'AUS', 'GBR'] },
  { place: 'seoulbbq', session: 's_bball_0720', screens: 3, crowdCountries: ['AUS', 'KOR', 'SRB'] },
  { place: 'sol', session: 's_fb_m_0720', screens: 2, crowdCountries: ['BRA', 'MAR', 'MX'], note: 'Pre-game from 19:30' },
  { place: 'jvp', session: 's_gym_0720', screens: 1, crowdCountries: ['JPN', 'CHN'] },
]

// ─────────────────────────────────────────────
// 5. LIVE ACTIVITY — aggregated, never individual strangers
// ─────────────────────────────────────────────
export const LIVE_ACTIVITY: Activity[] = [
  { place: 'griffith', headingThere: 23, topCountries: ['JP', 'BR', 'DE'], level: 'busy' },
  { place: 'smpier', headingThere: 41, topCountries: ['GB', 'AU', 'US'], level: 'packed' },
  { place: 'lantern', headingThere: 4, topCountries: ['JP', 'KR'], level: 'quiet' },
  { place: 'coliseum', headingThere: 312, topCountries: ['US', 'JM', 'KE'], level: 'packed' },
  { place: 'jvp', headingThere: 12, topCountries: ['FR', 'IT'], level: 'busy' },
]

// ─────────────────────────────────────────────
// 6. RARE DROPS — temporary pins with alerts
// ─────────────────────────────────────────────
export const DROPS: Drop[] = [
  { id: 'p_griffith', place: 'griffith', rarity: 'Legendary', opens: '2028-07-20T19:40', closes: '2028-07-20T20:10', need: 4, note: 'Sunset drop, far from any venue' },
  { id: 'p_hermosa_drop', place: 'hermosa', rarity: 'Rare', opens: '2028-07-21T19:50', closes: '2028-07-21T20:20', need: 'surprise' },
  { id: 'p_union', place: 'union', rarity: 'Rare', opens: '2028-07-22T08:00', closes: '2028-07-22T09:00', need: 3, note: 'Morning commute drop' },
]

// ─────────────────────────────────────────────
// 7. CREW — people you know, mutual opt-in location only
// ─────────────────────────────────────────────
export const CREW: CrewMember[] = [
  { name: 'Tomás', cc: 'CO', near: 'sol', updated: '5m ago', sharing: true },
  { name: 'Priya', cc: 'GB', near: 'sofi', updated: '12m ago', sharing: true },
  { name: 'Jonas', cc: 'DE', near: null, updated: null, sharing: false },
]

// ─────────────────────────────────────────────
// 8. PINS — every pin referenced above, with its state at NOW (static)
// ─────────────────────────────────────────────
export const PINS: Pin[] = [
  // Drops
  { id: 'p_griffith', name: 'Griffith Sunset Drop', place: 'griffith', kind: 'drop', shape: 'sunset', rarity: 'Legendary', status: 'locked', label: 'Drops at 7:40 PM', short: '20 min', onMap: true },
  { id: 'p_hermosa_drop', name: 'Hermosa Beach Drop', place: 'hermosa', kind: 'drop', shape: 'shell', rarity: 'Rare', status: 'locked', label: 'Drops tomorrow at 7:50 PM', short: 'Tomorrow', onMap: true },
  { id: 'p_union', name: 'Union Station Commute Drop', place: 'union', kind: 'drop', shape: 'train', rarity: 'Rare', status: 'locked', label: 'Drops Sat at 8:00 AM', short: 'Sat 8 AM', onMap: true },

  // Places
  { id: 'p_pier', name: 'Santa Monica Pier Pin', place: 'smpier', kind: 'place', shape: 'ferris-wheel', rarity: 'Common', status: 'open', label: 'Open all day', short: 'Open', onMap: true },
  { id: 'p_pier_half', name: 'Pier Half Pin', place: 'smpier', kind: 'half', shape: 'ferris-wheel', rarity: 'Rare', status: 'expiring', label: 'Ends in 15 min', short: '15 min left', onMap: true },
  { id: 'p_venice_half', name: 'Venice Half Pin', place: 'venice', kind: 'half', shape: 'palm', rarity: 'Rare', status: 'open', label: 'Open all day', short: 'Open', onMap: true },
  { id: 'p_ltokyo', name: 'Little Tokyo Pin', place: 'jvp', kind: 'place', shape: 'landmark', rarity: 'Common', status: 'open', label: 'Open until 9:00 PM', short: 'Open', onMap: true },
  { id: 'p_leimert', name: 'Leimert Park Pin', place: 'leimert', kind: 'place', shape: 'music', rarity: 'Common', status: 'open', label: 'Open all day', short: 'Open', onMap: true },

  // Shops
  { id: 'p_lantern', name: 'Lantern Café Pin', place: 'lantern', kind: 'shop', shape: 'coffee', rarity: 'Common', status: 'open', label: 'Open now', short: 'Open', onMap: true },
  { id: 'p_sol', name: 'Sol Tacos Pin', place: 'sol', kind: 'shop', shape: 'taco', rarity: 'Common', status: 'open', label: 'Open now', short: 'Open', onMap: true },
  { id: 'p_papercrane', name: 'Paper Crane Books Pin', place: 'papercrane', kind: 'shop', shape: 'book', rarity: 'Common', status: 'open', label: 'Open now', short: 'Open', onMap: true },
  { id: 'p_echo', name: 'Echo Records Pin', place: 'echo', kind: 'shop', shape: 'vinyl', rarity: 'Common', status: 'open', label: 'Open now', short: 'Open', onMap: true },
  { id: 'p_seoul', name: 'Seoul Corner BBQ Pin', place: 'seoulbbq', kind: 'shop', shape: 'grill', rarity: 'Common', status: 'open', label: 'Open now', short: 'Open', onMap: true },

  // Venues: live sessions show on the map, upcoming ones don't yet
  { id: 'p_arena', name: 'Gymnastics Final Pin', place: 'cryptoarena', kind: 'venue', shape: 'gymnastics', rarity: 'Epic', status: 'open', label: 'At the venue until 8:30 PM', short: 'Until 8:30', onMap: true },
  { id: 'p_sofi', name: 'Swimming Finals Pin', place: 'sofi', kind: 'venue', shape: 'swimming', rarity: 'Epic', status: 'open', label: 'At the venue until 8:45 PM', short: 'Until 8:45', onMap: true },
  { id: 'p_intuit', name: 'Basketball Pin', place: 'intuit', kind: 'venue', shape: 'basketball', rarity: 'Rare', status: 'open', label: 'At the venue until 9:00 PM', short: 'Until 9:00', onMap: true },
  { id: 'p_beachvb', name: 'Beach Volleyball Pin', place: 'alamitos', kind: 'venue', shape: 'volleyball', rarity: 'Rare', status: 'open', label: 'At the venue until 10:00 PM', short: 'Until 10:00', onMap: true },
  { id: 'p_coliseum', name: 'Athletics Pin', place: 'coliseum', kind: 'venue', shape: 'running', rarity: 'Epic', status: 'locked', label: 'Unlocks when the session starts at 8:00 PM', short: '8:00 PM', onMap: false },
  { id: 'p_rosebowl', name: 'Football Pin', place: 'rosebowl', kind: 'venue', shape: 'football', rarity: 'Rare', status: 'locked', label: 'Unlocks when the session starts at 8:30 PM', short: '8:30 PM', onMap: false },
]

// ─────────────────────────────────────────────
// 9. SHAPES — what each thing on the map is shaped like (static)
// ─────────────────────────────────────────────
export const SPORT_SHAPE: Record<string, Shape> = {
  Athletics: 'running',
  Swimming: 'swimming',
  Basketball: 'basketball',
  Football: 'football',
  Gymnastics: 'gymnastics',
  'Beach volleyball': 'volleyball',
}

export const PLACE_SHAPE: Record<string, Shape> = {
  griffith: 'telescope',
  smpier: 'ferris-wheel',
  venice: 'palm',
  union: 'train',
  gcm: 'market',
  jvp: 'landmark',
  leimert: 'music',
  mariachi: 'guitar',
  hermosa: 'shell',
  lantern: 'coffee',
  sol: 'taco',
  papercrane: 'book',
  echo: 'vinyl',
  seoulbbq: 'grill',
  leimertdrum: 'drum',
  almansor: 'trees',
  echolake: 'boat',
  grandpark: 'trees',
}

// Non-game events, by what happens there
export const EVENT_SHAPE: Record<string, Shape> = {
  e_fanzone: 'party',
  e_medalnight: 'concert',
  e_sunrise: 'running',
  e_boardwalk3x3: 'basketball',
  e_watch_fb: 'tv',
  e_dumplings: 'dumplings',
  e_pinswap: 'swap',
  e_kbbq: 'grill',
  e_langpicnic: 'languages',
  e_drum: 'drum',
  e_sketch: 'sketch',
  e_afterparty: 'party',
}

export const eventShape = (e: GameEvent): Shape => (e.type === 'game' ? SPORT_SHAPE[e.sport!] : EVENT_SHAPE[e.id])

// ─────────────────────────────────────────────
// Lookups and display helpers
// ─────────────────────────────────────────────

export const placeById = (id: string) => PLACES.find((p) => p.id === id)!
export const pinById = (id: string) => PINS.find((p) => p.id === id)
export const eventById = (id: string) => EVENTS.find((e) => e.id === id)
export const sessionById = (id: string) => SCHEDULE.find((s) => s.id === id)
export const activityAt = (placeId: string) => LIVE_ACTIVITY.find((a) => a.place === placeId)
export const dropById = (id: string) => DROPS.find((d) => d.id === id)

export const eventTypeLabel: Record<EventType, string> = {
  game: 'Game',
  official: 'Official',
  sponsored: 'Sponsored',
  fan: 'Fan-hosted',
}

export const pinKindLabel: Record<PinKind, string> = {
  place: 'Place',
  shop: 'Local shop',
  venue: 'Venue',
  drop: 'Rare drop',
  half: 'Half pin',
}

// '19:30' -> '7:30 PM'
export function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

// '2028-07-21' -> 'Tomorrow', relative to the fixed TODAY
export function formatDate(date: string) {
  const days = Math.round((Date.parse(date) - Date.parse(TODAY)) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return new Date(`${date}T12:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// 2-letter country code -> flag emoji
export function flag(cc: string) {
  return cc.length === 2 ? String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : ''
}

// Attendance line for an event, whichever field it uses
export function eventAttendance(e: GameEvent) {
  if (e.spots) return `${e.spots[0]}/${e.spots[1]} spots`
  if (e.fansOnApp) return `${e.fansOnApp.toLocaleString()} fans on the app`
  if (e.going) return `${e.going.toLocaleString()} going`
  return ''
}

// One-line summary of a session: live score/progress, final result, or start time
export function sessionLine(s: Session) {
  if (s.status === 'live') {
    const live = s.live
    if (live?.score && s.teams) return `${s.teams[0]} ${live.score[0]}–${live.score[1]} ${s.teams[1]} · ${live.clock}`
    if (live?.match) return `${live.match} · ${live.clock} (${live.sets?.map((set) => set.join('–')).join(', ')})`
    if (live?.progress) return `${live.progress} · ${live.standings?.[0][0]} leads`
    const next = s.races?.find((r) => r.status === 'next')
    if (next) return `Next: ${next.title}, ${formatTime(next.time)}`
    return 'Live now'
  }
  if (s.status === 'finished') {
    if (s.teams && s.score) return `Final: ${s.teams[0]} ${s.score[0]}–${s.score[1]} ${s.teams[1]}`
    if (s.results) return s.results.map((r) => `${r.match} ${r.score}`).join(' · ')
    return 'Finished'
  }
  return `${formatDate(s.date)} · ${formatTime(s.start)}–${formatTime(s.end)}`
}
