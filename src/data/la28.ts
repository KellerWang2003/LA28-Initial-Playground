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
  // One-line description for the pin detail page
  about?: string
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
  | 'star' | 'mountain' | 'art' | 'streetlight' | 'bone' | 'rocket' | 'fish' | 'ship' | 'church' | 'bell' | 'flower'
  | 'anchor' | 'waves' | 'brush' | 'funicular' | 'amphora' | 'spires' | 'bridge' | 'building'
  // Shops
  | 'coffee' | 'taco' | 'book' | 'vinyl' | 'grill' | 'drum'
  // Activities
  | 'party' | 'concert' | 'dumplings' | 'swap' | 'languages' | 'sketch' | 'tv'

export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary'
export type PinKind = 'place' | 'shop' | 'venue' | 'event' | 'half'
// locked: not collectable yet; open: collectable; expiring: open, closing soon
export type PinStatus = 'locked' | 'open' | 'expiring'

// What you do on the spot to collect a pin. Still being explored: tasks are
// data so different mixes can be tried per pin without touching the UI.
export type CollectTaskKind = 'visit' | 'photo' | 'find' | 'scan' | 'ticket' | 'stay'
// detail overrides the default how-to line for that kind
export type CollectTask = { kind: CollectTaskKind; detail?: string }

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
  // Countdown targets: when a locked pin opens, when an expiring one ends
  opensAt?: string
  closesAt?: string
  // Defaults by kind when missing (see collectTasks)
  tasks?: CollectTask[]
  // Only tourist-attraction pins show on the map. Event, venue and shop pins are
  // earned there, but the map shows the event or shop itself.
  onMap: boolean
}

// ─────────────────────────────────────────────
// 1. PLACES — every tappable spot on the map
// ─────────────────────────────────────────────
export const PLACES: Place[] = [
  { id: 'griffith', name: 'Griffith Observatory', type: 'attraction', hood: 'Los Feliz', lat: 34.1184, lng: -118.3004, hours: '12–10 PM', pins: ['p_griffith'], about: 'Art Deco observatory on Mount Hollywood with free telescopes and one of the best views of the Hollywood Sign.' },
  { id: 'smpier', name: 'Santa Monica Pier', type: 'attraction', hood: 'Santa Monica', lat: 34.0083, lng: -118.4988, hours: 'All day', pins: ['p_pier', 'p_pier_half'], about: 'Century-old pier with a seaside amusement park, a Ferris wheel over the water and the end of Route 66.' },
  { id: 'venice', name: 'Venice Boardwalk', type: 'attraction', hood: 'Venice', lat: 33.985, lng: -118.4729, hours: 'All day', pins: ['p_venice_half'], about: 'A stretch of street performers, skaters, Muscle Beach and murals right by the sand.' },
  { id: 'union', name: 'Union Station', type: 'attraction', hood: 'Downtown', lat: 34.0562, lng: -118.2365, hours: 'All day', pins: ['p_union'], about: 'LA\'s 1939 train station, a mix of Mission Revival and Art Deco with grand old waiting rooms.' },
  { id: 'gcm', name: 'Grand Central Market', type: 'attraction', hood: 'Downtown', lat: 34.0508, lng: -118.2489, hours: '8 AM–10 PM', pins: [] },
  { id: 'jvp', name: 'Japanese Village Plaza', type: 'attraction', hood: 'Little Tokyo', lat: 34.0493, lng: -118.24, hours: '10 AM–9 PM', pins: ['p_ltokyo'], about: 'The heart of Little Tokyo: shops, sweets and the fire watchtower at the plaza\'s entrance.' },
  { id: 'leimert', name: 'Leimert Park Plaza', type: 'attraction', hood: 'Leimert Park', lat: 34.0083, lng: -118.3318, hours: 'All day', pins: ['p_leimert'], about: 'The center of Black arts and culture in LA, with drum circles and jazz on weekends.' },
  { id: 'mariachi', name: 'Mariachi Plaza', type: 'attraction', hood: 'Boyle Heights', lat: 34.0472, lng: -118.2194, hours: 'All day', pins: ['p_mariachi'], about: 'Boyle Heights plaza where mariachi musicians have gathered to be hired for decades.' },
  { id: 'hermosa', name: 'Hermosa Beach Pier', type: 'attraction', hood: 'Hermosa Beach', lat: 33.8616, lng: -118.4013, hours: 'All day', pins: ['p_hermosa_drop'], about: 'A walkable pier in a classic South Bay beach town known for volleyball and sunsets.' },

  // More attractions to hunt pins at, spread across LA
  { id: 'hwof', name: 'Hollywood Walk of Fame', type: 'attraction', hood: 'Hollywood', lat: 34.1017, lng: -118.3403, hours: 'All day', pins: ['p_hwof'], about: 'More than 2,700 stars along Hollywood Boulevard, by the famous handprints at the TCL Chinese Theatre.' },
  { id: 'hbowl', name: 'Hollywood Bowl', type: 'attraction', hood: 'Hollywood Hills', lat: 34.1122, lng: -118.3391, hours: 'Shows nightly', pins: ['p_hbowl'], about: 'The amphitheater with the arched shell, hosting summer concerts under the stars since the 1920s.' },
  { id: 'lakehollywood', name: 'Hollywood Sign Lookout', type: 'attraction', hood: 'Hollywood Hills', lat: 34.1263, lng: -118.3304, hours: 'Sunrise–sunset', pins: ['p_lakehollywood'], about: 'A grassy park right under the Hollywood Sign, one of the closest legal views of it.' },
  { id: 'runyon', name: 'Runyon Canyon', type: 'attraction', hood: 'Hollywood Hills', lat: 34.1104, lng: -118.3504, hours: 'Sunrise–sunset', pins: ['p_runyon'], about: 'Popular hiking canyon above Hollywood with city views and plenty of dogs.' },
  { id: 'getty', name: 'The Getty Center', type: 'attraction', hood: 'Brentwood', lat: 34.078, lng: -118.4741, hours: '10 AM–5:30 PM', pins: ['p_getty'], about: 'Hilltop art museum with white travertine buildings, gardens and free admission.' },
  { id: 'gettyvilla', name: 'Getty Villa', type: 'attraction', hood: 'Pacific Palisades', lat: 34.0459, lng: -118.5648, hours: '10 AM–5 PM', pins: ['p_gettyvilla'], about: 'A recreated Roman country house filled with Greek, Roman and Etruscan antiquities.' },
  { id: 'lacma', name: 'Urban Light at LACMA', type: 'attraction', hood: 'Miracle Mile', lat: 34.0631, lng: -118.3591, hours: 'All day', pins: ['p_lacma'], about: 'Urban Light: 202 restored vintage streetlamps outside LACMA, lit every night.' },
  { id: 'tarpits', name: 'La Brea Tar Pits', type: 'attraction', hood: 'Miracle Mile', lat: 34.0638, lng: -118.3554, hours: '9:30 AM–5 PM', pins: ['p_tarpits'], about: 'An active Ice Age fossil site where scientists still dig up mammoths and saber-toothed cats.' },
  { id: 'farmersmarket', name: 'Original Farmers Market', type: 'attraction', hood: 'Fairfax', lat: 34.0719, lng: -118.3606, hours: '9 AM–9 PM', pins: ['p_farmersmarket'], about: 'Open-air market at Third and Fairfax, serving food stalls since 1934.' },
  { id: 'beverly', name: 'Beverly Hills Sign', type: 'attraction', hood: 'Beverly Hills', lat: 34.0732, lng: -118.3997, hours: 'All day', pins: ['p_beverly'], about: 'The Beverly Hills sign and lily pond in Beverly Gardens Park, steps from Rodeo Drive.' },
  { id: 'concerthall', name: 'Walt Disney Concert Hall', type: 'attraction', hood: 'Downtown', lat: 34.0553, lng: -118.2498, hours: '10 AM–8 PM', pins: ['p_concerthall'], about: 'Frank Gehry\'s stainless steel concert hall, home of the LA Phil, with a hidden rooftop garden.' },
  { id: 'angelsflight', name: 'Angels Flight', type: 'attraction', hood: 'Downtown', lat: 34.0514, lng: -118.2502, hours: '6:45 AM–10 PM', pins: ['p_angelsflight'], about: 'A tiny funicular railway climbing Bunker Hill, first opened in 1901.' },
  { id: 'chinatown', name: 'Chinatown Central Plaza', type: 'attraction', hood: 'Chinatown', lat: 34.064, lng: -118.2385, hours: 'All day', pins: ['p_chinatown'], about: 'Central Plaza with its gates, lanterns and the Bruce Lee statue.' },
  { id: 'artsdistrict', name: 'Arts District Murals', type: 'attraction', hood: 'Arts District', lat: 34.04, lng: -118.233, hours: 'All day', pins: ['p_artsdistrict'], about: 'A warehouse district covered in murals, with galleries, breweries and coffee.' },
  { id: 'watts', name: 'Watts Towers', type: 'attraction', hood: 'Watts', lat: 33.9387, lng: -118.2413, hours: '10:30 AM–3 PM', pins: ['p_watts'], about: 'Simon Rodia\'s 17 towers of steel, mortar and mosaic, built by hand over 33 years.' },
  { id: 'endeavour', name: 'Space Shuttle Endeavour', type: 'attraction', hood: 'Exposition Park', lat: 34.0158, lng: -118.2862, hours: '10 AM–5 PM', pins: ['p_endeavour'], about: 'The real Space Shuttle Endeavour, on display at the California Science Center.' },
  { id: 'baldwin', name: 'Baldwin Hills Scenic Overlook', type: 'attraction', hood: 'Culver City', lat: 34.0177, lng: -118.3836, hours: '8 AM–sunset', pins: ['p_baldwin'], about: 'Climb 282 steps for a 360° view from downtown to the ocean.' },
  { id: 'marina', name: 'Marina del Rey Harbor', type: 'attraction', hood: 'Marina del Rey', lat: 33.979, lng: -118.451, hours: 'All day', pins: ['p_marina'], about: 'A big small-boat harbor with sailboats, paddleboards and waterfront paths.' },
  { id: 'venicecanals', name: 'Venice Canals', type: 'attraction', hood: 'Venice', lat: 33.984, lng: -118.466, hours: 'All day', pins: ['p_venicecanals'], about: 'Quiet canals with arched footbridges and colorful homes, a few blocks from the boardwalk.' },
  { id: 'malibu', name: 'Malibu Pier', type: 'attraction', hood: 'Malibu', lat: 34.0379, lng: -118.6773, hours: '6 AM–sunset', pins: ['p_malibu'], about: 'Historic wooden pier with surfers at Surfrider Beach right beside it.' },
  { id: 'manhattan', name: 'Manhattan Beach Pier', type: 'attraction', hood: 'Manhattan Beach', lat: 33.8843, lng: -118.4119, hours: 'All day', pins: ['p_manhattan'], about: 'A pier with a small aquarium at the end and volleyball nets along the sand.' },
  { id: 'koreanbell', name: 'Korean Bell of Friendship', type: 'attraction', hood: 'San Pedro', lat: 33.7092, lng: -118.293, hours: '10 AM–6 PM', pins: ['p_koreanbell'], about: 'A huge bronze bell gifted by South Korea in 1976, overlooking the ocean in San Pedro.' },
  { id: 'queenmary', name: 'The Queen Mary', type: 'attraction', hood: 'Long Beach', lat: 33.7529, lng: -118.1902, hours: '10 AM–9 PM', pins: ['p_queenmary'], about: 'A retired 1936 ocean liner, now a hotel and museum in Long Beach Harbor.' },
  { id: 'aquarium', name: 'Aquarium of the Pacific', type: 'attraction', hood: 'Long Beach', lat: 33.762, lng: -118.1967, hours: '9 AM–6 PM', pins: ['p_aquarium'], about: 'Sea lions, sharks and a lorikeet aviary on the Long Beach waterfront.' },
  { id: 'huntington', name: 'Huntington Gardens', type: 'attraction', hood: 'San Marino', lat: 34.1292, lng: -118.1146, hours: '10 AM–5 PM', pins: ['p_huntington'], about: 'A library, art collections and acres of themed gardens, including Chinese and Japanese gardens.' },
  { id: 'oldpasadena', name: 'Old Pasadena', type: 'attraction', hood: 'Pasadena', lat: 34.1459, lng: -118.1503, hours: 'All day', pins: ['p_oldpasadena'], about: 'Historic downtown Pasadena with restored brick buildings, shops and alleys.' },
  { id: 'mission', name: 'Mission San Gabriel', type: 'attraction', hood: 'San Gabriel', lat: 34.0975, lng: -118.107, hours: '9 AM–4:30 PM', pins: ['p_mission'], about: 'Founded in 1771, the fourth of California\'s 21 Spanish missions.' },
  { id: 'angelspoint', name: 'Angels Point', type: 'attraction', hood: 'Elysian Park', lat: 34.0806, lng: -118.2433, hours: 'Sunrise–10 PM', pins: ['p_angelspoint'], about: 'A hilltop in Elysian Park with views over downtown.' },
  { id: 'silverlake', name: 'Silver Lake Reservoir', type: 'attraction', hood: 'Silver Lake', lat: 34.088, lng: -118.267, hours: 'All day', pins: ['p_silverlake'], about: 'A loop walk around the reservoir with a meadow and views of the hills.' },

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
  { id: 'echolake', name: 'Echo Park Lake', type: 'public', hood: 'Echo Park', lat: 34.0729, lng: -118.2606, pins: ['p_echolake'], about: 'A lake with swan pedal boats, lotus beds and a view of the downtown skyline.' },
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
  { id: 'e_fanzone', type: 'official', title: 'LA28 Fan Zone night', place: 'coliseum', date: '2028-07-20', time: '20:00', going: 5800, pin: 'p_fanzone', why: 'Popular with fans near you' },
  { id: 'e_medalnight', type: 'official', title: 'Medal celebration concert', place: 'grandpark', date: '2028-07-25', time: '19:30', going: 9100, pin: 'p_medalnight', why: 'Free, near your hotel' },

  // Sponsored
  { id: 'e_sunrise', type: 'sponsored', title: 'Sunrise run on the Strand', place: 'smpier', date: '2028-07-22', time: '06:30', going: 380, sponsor: 'Presented by a sponsor', pin: 'p_pier', why: 'Next to a pin you collected' },
  { id: 'e_boardwalk3x3', type: 'sponsored', title: '3x3 pickup tournament', place: 'venice', date: '2028-07-23', time: '10:00', going: 240, sponsor: 'Presented by a sponsor', why: 'You follow basketball' },

  // Fan-hosted
  { id: 'e_watch_fb', type: 'fan', title: 'Brazil vs Japan watch party', place: 'sol', date: '2028-07-22', time: '13:30', host: { name: 'Tomás', cc: 'CO' }, spots: [9, 16], task: 'Group pose', pin: 'p_sol', why: 'Tomás from your crew is hosting' },
  { id: 'e_dumplings', type: 'fan', title: 'Badminton and dumplings', place: 'almansor', date: '2028-07-23', time: '12:00', host: { name: 'Mei', cc: 'CN' }, spots: [6, 10], task: 'Synced twist', pin: null, why: 'You are hosting' },
  { id: 'e_pinswap', type: 'fan', title: 'Pin swap afternoon', place: 'lantern', date: '2028-07-23', time: '15:00', host: { name: 'Aiko', cc: 'JP' }, spots: [6, 10], task: 'Pass the beat', pin: 'p_lantern', why: '2 people you met are going' },
  { id: 'e_kbbq', type: 'fan', title: 'Pre-game dinner before Nigeria vs Spain', place: 'seoulbbq', date: '2028-07-23', time: '17:00', host: { name: 'Amara', cc: 'NG' }, spots: [11, 20], task: 'Build a shape', pin: 'p_seoul', why: 'Before a game you saved' },
  { id: 'e_langpicnic', type: 'fan', title: 'Language swap picnic', place: 'echolake', date: '2028-07-24', time: '11:00', host: { name: 'Lucía', cc: 'MX' }, spots: [7, 12], task: 'Pass the beat', pin: 'p_langpicnic', why: 'You speak 2 of the languages listed' },
  { id: 'e_drum', type: 'fan', title: 'Drum circle and coffee', place: 'leimertdrum', date: '2028-07-24', time: '18:00', host: { name: 'Kwame', cc: 'GH' }, spots: [9, 15], task: 'Synced twist', pin: 'p_leimert', why: "Near a pin you haven't collected" },
  { id: 'e_sketch', type: 'fan', title: 'Sketch Little Tokyo together', place: 'papercrane', date: '2028-07-25', time: '10:00', host: { name: 'Sven', cc: 'SE' }, spots: [3, 8], task: 'Group pose', pin: 'p_papercrane', why: 'Small group, good for solo travelers' },
  { id: 'e_afterparty', type: 'fan', title: 'Swimming final after-hangout', place: 'sofi', date: '2028-07-20', time: '21:30', host: { name: 'Priya', cc: 'GB' }, spots: [14, 20], task: 'Group pose', pin: 'p_afterparty', why: "Right after the game you're at" },
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
// 6. RARE DROPS — temporary pins with alerts. Not used for now: their places
// have regular attraction pins instead (see PINS).
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
  // Tourist attractions: the only pins on the map
  { id: 'p_griffith', name: 'Griffith Observatory Pin', place: 'griffith', kind: 'place', shape: 'telescope', rarity: 'Legendary', status: 'locked', label: 'Unlocks at 7:40 PM', short: '20 min', opensAt: '2028-07-20T19:40', onMap: true,
    tasks: [{ kind: 'visit' }, { kind: 'photo', detail: 'Snap the city lights from the west terrace after it unlocks.' }] },
  { id: 'p_hermosa_drop', name: 'Hermosa Beach Pier Pin', place: 'hermosa', kind: 'place', shape: 'shell', rarity: 'Rare', status: 'open', label: 'Open all day', short: 'Open', onMap: true },
  { id: 'p_union', name: 'Union Station Pin', place: 'union', kind: 'place', shape: 'train', rarity: 'Rare', status: 'open', label: 'Open all day', short: 'Open', onMap: true },
  { id: 'p_pier', name: 'Santa Monica Pier Pin', place: 'smpier', kind: 'place', shape: 'ferris-wheel', rarity: 'Common', status: 'open', label: 'Open all day', short: 'Open', onMap: true },
  { id: 'p_pier_half', name: 'Pier Half Pin', place: 'smpier', kind: 'half', shape: 'ferris-wheel', rarity: 'Rare', status: 'expiring', label: 'Ends in 15 min', short: '15 min left', closesAt: '2028-07-20T19:35', onMap: true,
    tasks: [{ kind: 'visit' }, { kind: 'find', detail: 'Hint: look up at the Ferris wheel from the end of the pier.' }, { kind: 'photo' }] },
  { id: 'p_venice_half', name: 'Venice Half Pin', place: 'venice', kind: 'half', shape: 'palm', rarity: 'Rare', status: 'open', label: 'Open all day', short: 'Open', onMap: true },
  { id: 'p_ltokyo', name: 'Little Tokyo Pin', place: 'jvp', kind: 'place', shape: 'landmark', rarity: 'Common', status: 'open', label: 'Open until 9:00 PM', short: 'Open', onMap: true },
  { id: 'p_leimert', name: 'Leimert Park Pin', place: 'leimert', kind: 'place', shape: 'music', rarity: 'Common', status: 'open', label: 'Open all day', short: 'Open', onMap: true },

  // More attractions across LA
  { id: 'p_hwof', name: 'Walk of Fame Pin', place: 'hwof', kind: 'place', shape: 'star', rarity: 'Common', status: 'open', label: 'Open all day', short: 'Open', onMap: true },
  { id: 'p_hbowl', name: 'Hollywood Bowl Pin', place: 'hbowl', kind: 'place', shape: 'music', rarity: 'Epic', status: 'locked', label: 'Unlocks when the show starts at 8:00 PM', short: '8:00 PM', opensAt: '2028-07-20T20:00', onMap: true },
  { id: 'p_lakehollywood', name: 'Hollywood Sign Pin', place: 'lakehollywood', kind: 'place', shape: 'mountain', rarity: 'Rare', status: 'expiring', label: 'Ends at sunset, 8:05 PM', short: 'Sunset', closesAt: '2028-07-20T20:05', onMap: true },
  { id: 'p_runyon', name: 'Runyon Canyon Pin', place: 'runyon', kind: 'place', shape: 'running', rarity: 'Common', status: 'expiring', label: 'Ends at sunset, 8:05 PM', short: 'Sunset', closesAt: '2028-07-20T20:05', onMap: true },
  { id: 'p_getty', name: 'Getty Center Pin', place: 'getty', kind: 'place', shape: 'art', rarity: 'Epic', status: 'locked', label: 'Unlocks tomorrow at 10:00 AM', short: 'Tomorrow', opensAt: '2028-07-21T10:00', onMap: true },
  { id: 'p_gettyvilla', name: 'Getty Villa Pin', place: 'gettyvilla', kind: 'place', shape: 'amphora', rarity: 'Rare', status: 'locked', label: 'Unlocks tomorrow at 10:00 AM', short: 'Tomorrow', opensAt: '2028-07-21T10:00', onMap: true },
  { id: 'p_lacma', name: 'Urban Light Pin', place: 'lacma', kind: 'place', shape: 'streetlight', rarity: 'Common', status: 'open', label: 'Open all night', short: 'Open', onMap: true },
  { id: 'p_tarpits', name: 'Tar Pits Pin', place: 'tarpits', kind: 'place', shape: 'bone', rarity: 'Common', status: 'locked', label: 'Unlocks tomorrow at 9:30 AM', short: 'Tomorrow', opensAt: '2028-07-21T09:30', onMap: true },
  { id: 'p_farmersmarket', name: 'Farmers Market Pin', place: 'farmersmarket', kind: 'place', shape: 'market', rarity: 'Common', status: 'open', label: 'Open until 9:00 PM', short: 'Open', onMap: true },
  { id: 'p_beverly', name: 'Beverly Hills Pin', place: 'beverly', kind: 'place', shape: 'palm', rarity: 'Common', status: 'open', label: 'Open all day', short: 'Open', onMap: true },
  { id: 'p_concerthall', name: 'Concert Hall Pin', place: 'concerthall', kind: 'place', shape: 'music', rarity: 'Rare', status: 'expiring', label: 'Ends at 8:00 PM', short: 'Until 8:00', closesAt: '2028-07-20T20:00', onMap: true },
  { id: 'p_angelsflight', name: 'Angels Flight Pin', place: 'angelsflight', kind: 'place', shape: 'funicular', rarity: 'Common', status: 'open', label: 'Open until 10:00 PM', short: 'Open', onMap: true },
  { id: 'p_chinatown', name: 'Chinatown Pin', place: 'chinatown', kind: 'place', shape: 'landmark', rarity: 'Common', status: 'open', label: 'Open all day', short: 'Open', onMap: true },
  { id: 'p_artsdistrict', name: 'Arts District Pin', place: 'artsdistrict', kind: 'place', shape: 'brush', rarity: 'Common', status: 'open', label: 'Open all day', short: 'Open', onMap: true },
  { id: 'p_watts', name: 'Watts Towers Pin', place: 'watts', kind: 'place', shape: 'spires', rarity: 'Rare', status: 'locked', label: 'Unlocks tomorrow at 10:30 AM', short: 'Tomorrow', opensAt: '2028-07-21T10:30', onMap: true },
  { id: 'p_endeavour', name: 'Endeavour Pin', place: 'endeavour', kind: 'place', shape: 'rocket', rarity: 'Rare', status: 'locked', label: 'Unlocks tomorrow at 10:00 AM', short: 'Tomorrow', opensAt: '2028-07-21T10:00', onMap: true },
  { id: 'p_baldwin', name: 'Baldwin Hills Pin', place: 'baldwin', kind: 'place', shape: 'mountain', rarity: 'Common', status: 'expiring', label: 'Ends at sunset, 8:05 PM', short: 'Sunset', closesAt: '2028-07-20T20:05', onMap: true },
  { id: 'p_marina', name: 'Marina del Rey Pin', place: 'marina', kind: 'place', shape: 'anchor', rarity: 'Common', status: 'open', label: 'Open all day', short: 'Open', onMap: true },
  { id: 'p_venicecanals', name: 'Venice Canals Pin', place: 'venicecanals', kind: 'place', shape: 'bridge', rarity: 'Common', status: 'open', label: 'Open all day', short: 'Open', onMap: true },
  { id: 'p_malibu', name: 'Malibu Pier Pin', place: 'malibu', kind: 'place', shape: 'waves', rarity: 'Rare', status: 'expiring', label: 'Ends at sunset, 8:05 PM', short: 'Sunset', closesAt: '2028-07-20T20:05', onMap: true },
  { id: 'p_manhattan', name: 'Manhattan Beach Pin', place: 'manhattan', kind: 'place', shape: 'sunset', rarity: 'Common', status: 'open', label: 'Open all day', short: 'Open', onMap: true },
  { id: 'p_koreanbell', name: 'Korean Bell Pin', place: 'koreanbell', kind: 'place', shape: 'bell', rarity: 'Rare', status: 'locked', label: 'Unlocks tomorrow at 10:00 AM', short: 'Tomorrow', opensAt: '2028-07-21T10:00', onMap: true },
  { id: 'p_queenmary', name: 'Queen Mary Pin', place: 'queenmary', kind: 'place', shape: 'ship', rarity: 'Rare', status: 'open', label: 'Open until 9:00 PM', short: 'Open', onMap: true },
  { id: 'p_aquarium', name: 'Aquarium Pin', place: 'aquarium', kind: 'place', shape: 'fish', rarity: 'Common', status: 'locked', label: 'Unlocks tomorrow at 9:00 AM', short: 'Tomorrow', opensAt: '2028-07-21T09:00', onMap: true },
  { id: 'p_huntington', name: 'Huntington Gardens Pin', place: 'huntington', kind: 'place', shape: 'flower', rarity: 'Rare', status: 'locked', label: 'Unlocks tomorrow at 10:00 AM', short: 'Tomorrow', opensAt: '2028-07-21T10:00', onMap: true },
  { id: 'p_oldpasadena', name: 'Old Pasadena Pin', place: 'oldpasadena', kind: 'place', shape: 'building', rarity: 'Common', status: 'open', label: 'Open all day', short: 'Open', onMap: true },
  { id: 'p_mission', name: 'Mission San Gabriel Pin', place: 'mission', kind: 'place', shape: 'church', rarity: 'Common', status: 'locked', label: 'Unlocks tomorrow at 9:00 AM', short: 'Tomorrow', opensAt: '2028-07-21T09:00', onMap: true },
  { id: 'p_angelspoint', name: 'Angels Point Pin', place: 'angelspoint', kind: 'place', shape: 'trees', rarity: 'Common', status: 'open', label: 'Open until 10:00 PM', short: 'Open', onMap: true },
  { id: 'p_silverlake', name: 'Silver Lake Pin', place: 'silverlake', kind: 'place', shape: 'waves', rarity: 'Common', status: 'open', label: 'Open all day', short: 'Open', onMap: true },
  { id: 'p_mariachi', name: 'Mariachi Plaza Pin', place: 'mariachi', kind: 'place', shape: 'guitar', rarity: 'Common', status: 'locked', label: 'Unlocks when the mariachis gather at 8:00 PM', short: '8:00 PM', opensAt: '2028-07-20T20:00', onMap: true },
  { id: 'p_echolake', name: 'Echo Park Lake Pin', place: 'echolake', kind: 'place', shape: 'boat', rarity: 'Common', status: 'open', label: 'Open all day', short: 'Open', onMap: true },

  // Shops: earned at the shop, not shown on the map
  { id: 'p_lantern', name: 'Lantern Café Pin', place: 'lantern', kind: 'shop', shape: 'coffee', rarity: 'Common', status: 'open', label: 'Open now', short: 'Open', onMap: false },
  { id: 'p_sol', name: 'Sol Tacos Pin', place: 'sol', kind: 'shop', shape: 'taco', rarity: 'Common', status: 'open', label: 'Open now', short: 'Open', onMap: false },
  { id: 'p_papercrane', name: 'Paper Crane Books Pin', place: 'papercrane', kind: 'shop', shape: 'book', rarity: 'Common', status: 'open', label: 'Open now', short: 'Open', onMap: false },
  { id: 'p_echo', name: 'Echo Records Pin', place: 'echo', kind: 'shop', shape: 'vinyl', rarity: 'Common', status: 'open', label: 'Open now', short: 'Open', onMap: false },
  { id: 'p_seoul', name: 'Seoul Corner BBQ Pin', place: 'seoulbbq', kind: 'shop', shape: 'grill', rarity: 'Common', status: 'open', label: 'Open now', short: 'Open', onMap: false },

  // Events: earned by going, not shown on the map
  { id: 'p_fanzone', name: 'Fan Zone Night Pin', place: 'coliseum', kind: 'event', shape: 'party', rarity: 'Rare', status: 'locked', label: 'Unlocks when it starts at 8:00 PM', short: '8:00 PM', opensAt: '2028-07-20T20:00', onMap: false },
  { id: 'p_medalnight', name: 'Medal Concert Pin', place: 'grandpark', kind: 'event', shape: 'concert', rarity: 'Epic', status: 'locked', label: 'Unlocks Tue at 7:30 PM', short: 'Tue', opensAt: '2028-07-25T19:30', onMap: false },
  { id: 'p_langpicnic', name: 'Language Swap Pin', place: 'echolake', kind: 'event', shape: 'languages', rarity: 'Common', status: 'locked', label: 'Unlocks Mon at 11:00 AM', short: 'Mon', opensAt: '2028-07-24T11:00', onMap: false },
  { id: 'p_afterparty', name: 'Swim Final After-Hangout Pin', place: 'sofi', kind: 'event', shape: 'party', rarity: 'Common', status: 'locked', label: 'Unlocks at 9:30 PM', short: '9:30 PM', opensAt: '2028-07-20T21:30', onMap: false },

  // Venues: earned at the game, not shown on the map
  { id: 'p_arena', name: 'Gymnastics Final Pin', place: 'cryptoarena', kind: 'venue', shape: 'gymnastics', rarity: 'Epic', status: 'open', label: 'At the venue until 8:30 PM', short: 'Until 8:30', onMap: false },
  { id: 'p_sofi', name: 'Swimming Finals Pin', place: 'sofi', kind: 'venue', shape: 'swimming', rarity: 'Epic', status: 'open', label: 'At the venue until 8:45 PM', short: 'Until 8:45', onMap: false },
  { id: 'p_intuit', name: 'Basketball Pin', place: 'intuit', kind: 'venue', shape: 'basketball', rarity: 'Rare', status: 'open', label: 'At the venue until 9:00 PM', short: 'Until 9:00', onMap: false },
  { id: 'p_beachvb', name: 'Beach Volleyball Pin', place: 'alamitos', kind: 'venue', shape: 'volleyball', rarity: 'Rare', status: 'open', label: 'At the venue until 10:00 PM', short: 'Until 10:00', onMap: false },
  { id: 'p_coliseum', name: 'Athletics Pin', place: 'coliseum', kind: 'venue', shape: 'running', rarity: 'Epic', status: 'locked', label: 'Unlocks when the session starts at 8:00 PM', short: '8:00 PM', opensAt: '2028-07-20T20:00', onMap: false },
  { id: 'p_rosebowl', name: 'Football Pin', place: 'rosebowl', kind: 'venue', shape: 'football', rarity: 'Rare', status: 'locked', label: 'Unlocks when the session starts at 8:30 PM', short: '8:30 PM', opensAt: '2028-07-20T20:30', onMap: false },
]

// ─────────────────────────────────────────────
// 9. REVIEWS — what fans on the app say about a place (mock)
// ─────────────────────────────────────────────
export type Review = { name: string; cc: string; rating: number; when: string; text: string }

export const REVIEWS: Record<string, Review[]> = {
  griffith: [
    { name: 'Aiko', cc: 'JP', rating: 5, when: '2d ago', text: 'Go right before sunset. The pin unlocked while the city lights came on. Unreal.' },
    { name: 'Jonas', cc: 'DE', rating: 4, when: '4d ago', text: 'Parking is tough, take the DASH bus up from Vermont.' },
    { name: 'Lucía', cc: 'MX', rating: 5, when: '1w ago', text: 'Free telescopes at night! Great place to meet other collectors.' },
  ],
  smpier: [
    { name: 'Priya', cc: 'GB', rating: 4, when: '1d ago', text: 'Busy but fun. The half pin is near the Ferris wheel.' },
    { name: 'Tomás', cc: 'CO', rating: 5, when: '3d ago', text: 'Walked here from Venice along the bike path, about 40 minutes.' },
  ],
  hwof: [
    { name: 'Sven', cc: 'SE', rating: 3, when: '2d ago', text: 'Crowded and touristy, but you have to do it once.' },
    { name: 'Mei', cc: 'CN', rating: 4, when: '5d ago', text: 'Found stars of three actors I love. Early morning is calmer.' },
  ],
  getty: [
    { name: 'Kwame', cc: 'GH', rating: 5, when: '3d ago', text: 'Free entry, amazing gardens and the tram ride up is part of the fun.' },
    { name: 'Amara', cc: 'NG', rating: 5, when: '1w ago', text: 'Best view of LA on a clear day. Bring a hat.' },
  ],
  angelsflight: [
    { name: 'Danny', cc: 'US', rating: 4, when: '1d ago', text: 'One minute ride, but so charming. Grand Central Market is right at the bottom.' },
  ],
  venicecanals: [
    { name: 'Lucía', cc: 'MX', rating: 5, when: '2d ago', text: 'So peaceful compared to the boardwalk. Look for the ducks.' },
    { name: 'Jonas', cc: 'DE', rating: 4, when: '6d ago', text: 'Easy pin, the bridges make great photos.' },
  ],
  watts: [
    { name: 'Kwame', cc: 'GH', rating: 5, when: '4d ago', text: 'Take the tour if you can. Hard to believe one person built this.' },
  ],
  malibu: [
    { name: 'Priya', cc: 'GB', rating: 5, when: '2d ago', text: 'Watched surfers while waiting for sunset. Worth the drive.' },
  ],
}

// Generic reviews for places without their own yet
const FALLBACK_REVIEWS: Review[] = [
  { name: 'Mei', cc: 'CN', rating: 5, when: '3d ago', text: 'Easy to find and a great photo spot.' },
  { name: 'Tomás', cc: 'CO', rating: 4, when: '5d ago', text: 'Went with my crew, we got the pin in a few minutes.' },
  { name: 'Aiko', cc: 'JP', rating: 4, when: '1w ago', text: 'Nice stop between games. Quieter in the morning.' },
]

export const reviewsFor = (placeId: string) => REVIEWS[placeId] ?? FALLBACK_REVIEWS

// ─────────────────────────────────────────────
// 10. SHAPES — what each thing on the map is shaped like (static)
// ─────────────────────────────────────────────
export const SPORT_SHAPE: Record<string, Shape> = {
  Athletics: 'running',
  Swimming: 'swimming',
  Basketball: 'basketball',
  Football: 'football',
  Gymnastics: 'gymnastics',
  'Beach volleyball': 'volleyball',
}

export const SPORTS = Object.keys(SPORT_SHAPE)

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

// When a pin's countdown ends: opening for locked pins, closing for expiring ones
export const pinCountdownTarget = (pin: Pin) =>
  pin.status === 'locked' ? pin.opensAt : pin.status === 'expiring' ? pin.closesAt : undefined

// Tasks for a pin: its own, or the default mix for its kind
const defaultTasks: Record<PinKind, CollectTask[]> = {
  place: [{ kind: 'visit' }, { kind: 'photo' }],
  half: [{ kind: 'visit' }, { kind: 'find' }, { kind: 'photo' }],
  shop: [{ kind: 'visit' }, { kind: 'scan' }],
  venue: [{ kind: 'visit' }, { kind: 'ticket' }],
  event: [{ kind: 'visit' }, { kind: 'stay' }],
}
export const collectTasks = (pin: Pin) => pin.tasks ?? defaultTasks[pin.kind]

// Short label for chips, title for the step list
export const collectTaskLabel: Record<CollectTaskKind, { short: string; title: string }> = {
  visit: { short: 'Visit', title: 'Visit' },
  photo: { short: 'Photo', title: 'Take a photo' },
  find: { short: 'Find', title: 'Find the spot' },
  scan: { short: 'Scan', title: 'Scan a code' },
  ticket: { short: 'Ticket', title: 'Scan your ticket' },
  stay: { short: 'Stay', title: 'Stay a while' },
}

// Default how-to line per task kind; {place} is replaced with the place name
export const collectTaskDetail: Record<CollectTaskKind, string> = {
  visit: 'Go to {place}. You need to be within about 100 m.',
  photo: 'Snap the spot to stamp the pin into your Passport.',
  find: 'The pin is hidden at one exact spot. Follow the hint to find it.',
  scan: 'Ask at the counter for the pin code and scan it.',
  ticket: 'Scan your ticket at the gate for this session.',
  stay: 'Stay for 15 minutes once it starts.',
}

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
  event: 'Event',
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
