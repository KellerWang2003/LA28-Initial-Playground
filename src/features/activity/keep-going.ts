import { flag } from '@/data/la28'

// Scripted "keep going" moment for the swimming final at SoFi.
// The session is still live in the schedule; this story treats the 200m freestyle as just finished.
export const SWIM_SESSION = 's_swim_0720'

export type Member = {
  id: string
  name: string
  cc: string
  trait: string
  instagram?: string
}

export type Group = {
  id: string
  title: string
  blurb: string
  members: Member[]
  // Votes already cast, one per member, before you join
  votes: Record<string, number>
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

export const GROUPS: Group[] = [
  {
    id: 'quiet',
    title: 'Quiet debrief',
    blurb: 'A small group that wants to sit and replay the race.',
    metId: 'hana',
    votes: { cafe: 3, taco: 1 },
    members: [
      { id: 'hana', name: 'Hana', cc: 'JP', trait: 'Traveling solo', instagram: '@hana.travels' },
      { id: 'owen', name: 'Owen', cc: 'GB', trait: 'Keeps it low key' },
      { id: 'mei-lin', name: 'Mei Lin', cc: 'CN', trait: 'Here for swimming' },
      { id: 'paolo', name: 'Paolo', cc: 'IT', trait: 'First time in LA' },
    ],
  },
  {
    id: 'sorrows',
    title: 'Drown our sorrows',
    blurb: 'A mix of countries, and nobody arrived with a plan. They want somewhere to sit after the loss.',
    metId: 'julia',
    votes: { taco: 2, cafe: 1, bar: 4 },
    members: [
      { id: 'julia', name: 'Julia', cc: 'FR', trait: 'Talks to everyone', instagram: '@julia.morel' },
      { id: 'kenji', name: 'Kenji', cc: 'JP', trait: 'Stays late' },
      { id: 'amara', name: 'Amara', cc: 'NG', trait: 'Suggests the food' },
      { id: 'luca', name: 'Luca', cc: 'IT', trait: 'New in the city' },
      { id: 'mina', name: 'Mina', cc: 'KR', trait: 'Here with one friend' },
      { id: 'noah', name: 'Noah', cc: 'AU', trait: 'Lives in LA' },
      { id: 'ines', name: 'Inés', cc: 'ES', trait: 'Traveling solo' },
    ],
  },
  {
    id: 'celebrate',
    title: 'Celebrate anyway',
    blurb: 'Mostly Australia and US fans. They want a louder spot.',
    metId: 'sam',
    votes: { bar: 4, taco: 1 },
    members: [
      { id: 'sam', name: 'Sam', cc: 'AU', trait: 'Lives nearby', instagram: '@sam.k' },
      { id: 'jordan', name: 'Jordan', cc: 'US', trait: 'Came from the stands' },
      { id: 'chloe', name: 'Chloé', cc: 'FR', trait: 'Wants a screen' },
      { id: 'ben', name: 'Ben', cc: 'GB', trait: 'Up for anything' },
      { id: 'pri', name: 'Priya N.', cc: 'IN', trait: 'Traveling solo' },
    ],
  },
  {
    id: 'bite',
    title: 'One more bite',
    blurb: 'Food first. They’ll go wherever the group can sit down and eat.',
    metId: 'rosa',
    votes: { taco: 4, cafe: 1, bar: 1 },
    members: [
      { id: 'rosa', name: 'Rosa', cc: 'MX', trait: 'Knows a spot', instagram: '@rosa.eats' },
      { id: 'yuki', name: 'Yuki', cc: 'JP', trait: 'Hungry' },
      { id: 'andre', name: 'André', cc: 'BR', trait: 'Traveling solo' },
      { id: 'sara', name: 'Sara', cc: 'SE', trait: 'Here with a friend' },
      { id: 'omar-k', name: 'Omar K.', cc: 'MA', trait: 'New in the city' },
      { id: 'lin', name: 'Lin', cc: 'TW', trait: 'Wants to split plates' },
    ],
  },
  {
    id: 'walk',
    title: 'Walk it off',
    blurb: 'Three people, no reservation. A short loop near the stadium.',
    metId: 'leo',
    votes: { cafe: 2, taco: 1 },
    members: [
      { id: 'leo', name: 'Leo', cc: 'DE', trait: 'Rather walk', instagram: '@leo.weg' },
      { id: 'aya', name: 'Aya', cc: 'EG', trait: 'Traveling solo' },
      { id: 'nina', name: 'Nina', cc: 'NL', trait: 'Keeping it small' },
    ],
  },
]

export const groupById = (id: string) => GROUPS.find((g) => g.id === id)

export const memberById = (group: Group, id: string) => group.members.find((m) => m.id === id)

export function countryFlags(group: Group) {
  return group.members.map((m) => flag(m.cc)).join(' ')
}

export type TallySpot = Spot & { count: number }

// Counts include your vote once you’ve cast one. A tie goes to the spot you picked.
export function tally(group: Group, voteId: string | null) {
  const spots: TallySpot[] = SPOTS.map((s) => ({
    ...s,
    count: (group.votes[s.id] ?? 0) + (voteId === s.id ? 1 : 0),
  }))
  const total = group.members.length + (voteId ? 1 : 0)
  const winner = voteId
    ? spots.reduce((best, spot) => {
        if (spot.count > best.count) return spot
        if (spot.count === best.count && spot.id === voteId) return spot
        return best
      })
    : null
  return { spots, total, winner }
}
