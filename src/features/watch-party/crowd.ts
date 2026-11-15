// Who's going to a watch party, and how the bubbles lay out for each way of grouping
// them. Strangers are never shown by face or name: a bubble is a flag, and tapping one
// only says where they're from, their age range, who they cheer for and what they speak.

export type Person = {
  id: string
  cc: string
  age: Age
  team: Team
  langs: string[]
  host?: boolean
  you?: boolean
}

export type Age = '18–24' | '25–34' | '35–44' | '45+'
export type Team = 'BRA' | 'MAR' | 'none'
export type Grouping = 'everyone' | 'country' | 'age' | 'team' | 'language'

export const GROUPINGS: { id: Grouping; label: string }[] = [
  { id: 'everyone', label: 'All' },
  { id: 'country', label: 'Country' },
  { id: 'language', label: 'Language' },
  { id: 'age', label: 'Age' },
]

export const COUNTRY_NAME: Record<string, string> = {
  BR: 'Brazil', MA: 'Morocco', MX: 'Mexico', US: 'USA', FR: 'France', JP: 'Japan', ES: 'Spain', DZ: 'Algeria', PT: 'Portugal',
  GB: 'UK', KR: 'Korea', AR: 'Argentina', CO: 'Colombia', CN: 'China', DE: 'Germany', CA: 'Canada', AU: 'Australia', IN: 'India', NZ: 'New Zealand',
}

export const TEAM_LABEL: Record<Team, string> = { BRA: 'Brazil', MAR: 'Morocco', none: 'Just here for it' }
export const TEAM_CC: Record<Team, string> = { BRA: 'BR', MAR: 'MA', none: '' }

// What each country mostly speaks, and who they mostly cheer for
const LANGS: Record<string, string[]> = {
  BR: ['Portuguese'], MA: ['Arabic', 'French'], MX: ['Spanish'], US: ['English'], FR: ['French'], JP: ['Japanese'], ES: ['Spanish'],
  DZ: ['Arabic', 'French'], PT: ['Portuguese'], GB: ['English'], KR: ['Korean'], AR: ['Spanish'], CO: ['Spanish'], CN: ['Chinese'],
  DE: ['German'], CA: ['English', 'French'], AU: ['English'], IN: ['Hindi', 'English'],
}
const CHEERS: Record<string, Team> = { BR: 'BRA', PT: 'BRA', AR: 'BRA', CO: 'BRA', MA: 'MAR', DZ: 'MAR', FR: 'MAR', ES: 'MAR' }
const AGES: Age[] = ['25–34', '18–24', '25–34', '35–44', '45+', '25–34', '18–24']

// A crowd from [country, how many] pairs. Deterministic, so a party always looks the same.
export function makeCrowd(prefix: string, mix: [string, number][]): Person[] {
  const people: Person[] = []
  let i = 0
  for (const [cc, n] of mix) {
    for (let k = 0; k < n; k++, i++) {
      const langs = LANGS[cc] ?? ['English']
      people.push({
        id: `${prefix}${i}`,
        cc,
        age: AGES[(i * 3 + k) % AGES.length],
        team: CHEERS[cc] ?? (i % 3 === 0 ? 'BRA' : 'none'),
        langs: i % 4 === 1 && !langs.includes('English') ? [...langs, 'English'] : langs,
      })
    }
  }
  return people
}

export function you(cc: string, langs: string[]): Person {
  // The profile lists languages by their own name; the crowd uses English names
  const english: Record<string, string> = { Español: 'Spanish', Français: 'French', Deutsch: 'German', Português: 'Portuguese', '日本語': 'Japanese', '中文': 'Chinese', '한국어': 'Korean' }
  return { id: 'you', cc, age: '25–34', team: 'BRA', langs: langs.map((l) => english[l] ?? l), you: true }
}

// Which group a person falls in. Language puts them under the first one they speak.
export function groupOf(p: Person, by: Grouping): string {
  if (by === 'country') return p.cc
  if (by === 'age') return p.age
  if (by === 'team') return p.team
  if (by === 'language') return p.langs[0]
  return 'all'
}

const AGE_ORDER: Age[] = ['18–24', '25–34', '35–44', '45+']

// ---- Layout ----

export type Bubble = { id: string; x: number; y: number }
export type Blob = { key: string; x: number; y: number; r: number; count: number }
export type Layout = { bubbles: Record<string, Bubble>; blobs: Blob[] }

// Bubble size and the gap between bubbles in a blob, in px
export const DOT = 30
const GAP = 4
const BLOB_PAD = 10

// Sunflower spiral: packs n dots in a circle, the first one in the middle
function sunflower(n: number) {
  const step = (DOT + GAP) * 0.55
  const golden = Math.PI * (3 - Math.sqrt(5))
  return Array.from({ length: n }, (_, i) => {
    const r = step * Math.sqrt(i + 0.5) * 1.05
    return { x: Math.cos(i * golden) * r, y: Math.sin(i * golden) * r }
  })
}

const radiusFor = (n: number) => {
  const pts = sunflower(n)
  return Math.max(...pts.map((p) => Math.hypot(p.x, p.y))) + DOT / 2 + BLOB_PAD
}

// Groups as circles sized by how many are in them, nudged apart until none overlap
// and pulled toward the middle, then scaled to fit the stage. Deterministic, so the
// same grouping always lands the same way.
export function layout(people: Person[], by: Grouping, width: number, height: number): Layout {
  const groups = new Map<string, Person[]>()
  for (const p of people) {
    const k = groupOf(p, by)
    groups.set(k, [...(groups.get(k) ?? []), p])
  }
  const keys = [...groups.keys()].sort((a, b) =>
    by === 'age' ? AGE_ORDER.indexOf(a as Age) - AGE_ORDER.indexOf(b as Age) : groups.get(b)!.length - groups.get(a)!.length || a.localeCompare(b),
  )

  // Start each blob on a spiral, biggest in the middle
  const blobs: Blob[] = keys.map((key, i) => {
    const a = i * 2.4
    const d = i === 0 ? 0 : 40 + i * 14
    return { key, x: Math.cos(a) * d, y: Math.sin(a) * d * 0.8, r: radiusFor(groups.get(key)!.length), count: groups.get(key)!.length }
  })

  const spacing = by === 'everyone' ? 0 : 14
  for (let step = 0; step < 400; step++) {
    for (let i = 0; i < blobs.length; i++) {
      for (let j = i + 1; j < blobs.length; j++) {
        const a = blobs[i]
        const b = blobs[j]
        const dx = b.x - a.x || 0.01
        const dy = b.y - a.y || 0.01
        const d = Math.hypot(dx, dy)
        const min = a.r + b.r + spacing
        if (d < min) {
          const push = (min - d) / 2
          a.x -= (dx / d) * push
          a.y -= (dy / d) * push
          b.x += (dx / d) * push
          b.y += (dy / d) * push
        }
      }
    }
    // A gentle pull to the middle keeps the cluster tight; wider than tall to suit a phone
    for (const b of blobs) {
      b.x *= 0.985
      b.y *= 0.97
    }
  }

  // Fit inside the stage
  const minX = Math.min(...blobs.map((b) => b.x - b.r))
  const maxX = Math.max(...blobs.map((b) => b.x + b.r))
  const minY = Math.min(...blobs.map((b) => b.y - b.r))
  const maxY = Math.max(...blobs.map((b) => b.y + b.r))
  const scale = Math.min(1, (width - 16) / (maxX - minX), (height - 32) / (maxY - minY))
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2

  const bubbles: Record<string, Bubble> = {}
  for (const blob of blobs) {
    blob.x = width / 2 + (blob.x - cx) * scale
    blob.y = height / 2 + (blob.y - cy) * scale + 8
    blob.r *= scale
    // You sit in the middle of your group; the host next to the middle of theirs
    const members = [...groups.get(blob.key)!].sort((a, b) => Number(!!b.you) - Number(!!a.you) || Number(!!b.host) - Number(!!a.host))
    sunflower(members.length).forEach((pt, i) => {
      bubbles[members[i].id] = { id: members[i].id, x: blob.x + pt.x * scale, y: blob.y + pt.y * scale }
    })
  }
  return { bubbles, blobs: by === 'everyone' ? [] : blobs }
}

// ---- Words ----

export function blobLabel(key: string, by: Grouping) {
  if (by === 'country') return COUNTRY_NAME[key] ?? key
  if (by === 'team') return TEAM_LABEL[key as Team]
  return key
}
