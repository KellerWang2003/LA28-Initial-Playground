import { flag, SCHEDULE } from '@/data/la28'

// Scripted "keep going" moment for the swimming final at SoFi.
// Fans at the venue get asked near the end of the session, get matched with a group,
// and the group votes on a public spot nearby.
export const SWIM_SESSION = 's_swim_0720'

export const SWIM = SCHEDULE.find((s) => s.id === SWIM_SESSION)!
export const SWIM_ENDS = Date.parse(`${SWIM.date}T${SWIM.end}`)

const MIN = 60_000
export const KEEP_TIMING = {
  // The prompt arrives this long before the session ends
  askBeforeMs: 20 * MIN,
  // …and the offer stays open this long after
  openAfterMs: 2 * 60 * MIN,
  // Matching: the first group shows up after this, and the next one after each pass
  firstMatchMs: 20_000,
  nextMatchMs: 12_000,
  // A hosted gathering picks up one person this often
  hostJoinMs: 15_000,
  // The place vote closes this long after you join or host
  voteMs: 10 * MIN,
}

export const askOpens = SWIM_ENDS - KEEP_TIMING.askBeforeMs
export const askCloses = SWIM_ENDS + KEEP_TIMING.openAfterMs
export const inAskWindow = (now: number) => now >= askOpens && now < askCloses
// The card in My activities asks from the start of the session; the alert waits for the window above
export const canAsk = (now: number) => now >= Date.parse(`${SWIM.date}T${SWIM.start}`) && now < askCloses

export type Member = {
  id: string
  name: string
  cc: string
  trait: string
  instagram?: string
  // The spot they voted for
  pick: string
}

export type Group = {
  id: string
  title: string
  blurb: string
  languages: string[]
  members: Member[]
  // Who you end up talking to
  metId: string
}

export type Spot = {
  id: string
  name: string
  kind: string
  walk: string
  note: string
}

export const SPOTS: Spot[] = [
  {
    id: 'taco',
    name: 'Taco truck on Prairie',
    kind: 'Taco truck',
    walk: '6 min walk',
    note: 'Open late, with a few tables on the sidewalk.',
  },
  {
    id: 'cafe',
    name: 'Late café on Century',
    kind: 'Café',
    walk: '8 min walk',
    note: 'Quiet enough to actually talk.',
  },
  {
    id: 'bar',
    name: 'The Market sports bar',
    kind: 'Sports bar',
    walk: '11 min walk',
    note: 'Screens still on. Public, and it fits a group this size.',
  },
]

// In the order matching offers them
export const GROUPS: Group[] = [
  {
    id: 'sorrows',
    title: 'Drown our sorrows',
    blurb: 'A mix of countries, and nobody came with a plan. Somewhere to sit after the loss.',
    languages: ['English', 'French', 'Spanish'],
    metId: 'julia',
    members: [
      { id: 'julia', name: 'Julia', cc: 'FR', trait: 'Talks to everyone', instagram: '@julia.morel', pick: 'bar' },
      { id: 'kenji', name: 'Kenji', cc: 'JP', trait: 'Stays late', pick: 'bar' },
      { id: 'amara', name: 'Amara', cc: 'NG', trait: 'Suggests the food', pick: 'taco' },
      { id: 'luca', name: 'Luca', cc: 'IT', trait: 'New in the city', pick: 'bar' },
      { id: 'mina', name: 'Mina', cc: 'KR', trait: 'Here with one friend', pick: 'cafe' },
      { id: 'noah', name: 'Noah', cc: 'AU', trait: 'Lives in LA', pick: 'bar' },
      { id: 'ines', name: 'Inés', cc: 'ES', trait: 'Traveling solo', pick: 'taco' },
    ],
  },
  {
    id: 'quiet',
    title: 'Quiet debrief',
    blurb: 'A small group that wants to sit down and replay the race.',
    languages: ['English', 'Japanese'],
    metId: 'hana',
    members: [
      { id: 'hana', name: 'Hana', cc: 'JP', trait: 'Traveling solo', instagram: '@hana.travels', pick: 'cafe' },
      { id: 'owen', name: 'Owen', cc: 'GB', trait: 'Keeps it low key', pick: 'cafe' },
      { id: 'mei-lin', name: 'Mei Lin', cc: 'CN', trait: 'Here for swimming', pick: 'cafe' },
      { id: 'paolo', name: 'Paolo', cc: 'IT', trait: 'First time in LA', pick: 'taco' },
    ],
  },
  {
    id: 'bite',
    title: 'One more bite',
    blurb: 'Food first. Wherever the group can sit down and eat.',
    languages: ['English', 'Spanish', 'Portuguese'],
    metId: 'rosa',
    members: [
      { id: 'rosa', name: 'Rosa', cc: 'MX', trait: 'Knows a spot', instagram: '@rosa.eats', pick: 'taco' },
      { id: 'yuki', name: 'Yuki', cc: 'JP', trait: 'Hungry', pick: 'taco' },
      { id: 'andre', name: 'André', cc: 'BR', trait: 'Traveling solo', pick: 'taco' },
      { id: 'sara', name: 'Sara', cc: 'SE', trait: 'Here with a friend', pick: 'cafe' },
      { id: 'omar-k', name: 'Omar K.', cc: 'MA', trait: 'New in the city', pick: 'taco' },
      { id: 'lin', name: 'Lin', cc: 'TW', trait: 'Wants to split plates', pick: 'bar' },
    ],
  },
]

// While you wait, you can host instead. You pick the feel; the place is still voted on.
export type HostVibe = { id: string; title: string; blurb: string }

export const HOST_VIBES: HostVibe[] = [
  { id: 'talk', title: 'Talk through the race', blurb: 'Somewhere quiet to sit and replay it.' },
  { id: 'food', title: 'Grab food', blurb: 'Late food close to the stadium.' },
  { id: 'screens', title: 'Catch the next game', blurb: 'Screens on, a louder room.' },
]

// Fans who get matched to a gathering you host, in the order they join
const JOINERS: Member[] = [
  { id: 'sam', name: 'Sam', cc: 'AU', trait: 'Lives nearby', instagram: '@sam.k', pick: 'bar' },
  { id: 'leo', name: 'Leo', cc: 'DE', trait: 'Rather walk', pick: 'cafe' },
  { id: 'aya', name: 'Aya', cc: 'EG', trait: 'Traveling solo', pick: 'taco' },
  { id: 'chloe', name: 'Chloé', cc: 'FR', trait: 'Wants a screen', pick: 'bar' },
  { id: 'pri', name: 'Priya N.', cc: 'IN', trait: 'Traveling solo', pick: 'cafe' },
]

export const groupById = (id: string) => GROUPS.find((g) => g.id === id)

// Your own gathering: people join one at a time after you host
export function hostedGroup(vibe: HostVibe, since: number, now: number): Group {
  const joined = Math.min(JOINERS.length, Math.max(0, Math.floor((now - since) / KEEP_TIMING.hostJoinMs)))
  return {
    id: 'mine',
    title: vibe.title,
    blurb: vibe.blurb,
    languages: ['English'],
    members: JOINERS.slice(0, joined),
    metId: JOINERS[0].id,
  }
}

export const memberById = (group: Group, id: string) => group.members.find((m) => m.id === id)

export function countryFlags(group: Group) {
  return [...new Set(group.members.map((m) => flag(m.cc)))].join(' ')
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
export const countryName = (cc: string) => regionNames.of(cc) ?? cc

export type TallySpot = Spot & { count: number }

// Counts include your vote once you've cast one. The leader wins; a tie goes to your pick.
export function tally(group: Group, voteId: string | null) {
  const spots: TallySpot[] = SPOTS.map((s) => ({
    ...s,
    count: group.members.filter((m) => m.pick === s.id).length + (voteId === s.id ? 1 : 0),
  }))
  const total = group.members.length + (voteId ? 1 : 0)
  const leader = spots.reduce((best, spot) => {
    if (spot.count > best.count) return spot
    if (spot.count === best.count && spot.id === voteId) return spot
    return best
  })
  return { spots, total, leader }
}
