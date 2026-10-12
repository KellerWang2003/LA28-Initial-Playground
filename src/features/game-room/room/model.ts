import type { Session } from '@/data/la28'
import { CROWD_COUNTRIES, LANGUAGES, SWIM_CROWD_TOTAL, type CrowdCountry } from '../crowd'
import { seedUnit } from '../seed'

// The room's crowd, as aggregates only. Nothing here describes an individual fan.

/** Groups smaller than this are never shown (the app's "aggregated, never individual strangers" rule) */
export const MIN_GROUP = 10

export const HERO_SESSION = 's_swim_0720'

export type CrowdBucket = CrowdCountry & { count: number; venueCount: number; onlineCount: number }

export type Crowd = {
  total: number
  venue: number
  online: number
  /** All countries with at least one fan */
  buckets: CrowdBucket[]
  /** Countries big enough to show (>= MIN_GROUP), biggest first */
  visible: CrowdBucket[]
}

export const EMPTY_CROWD: Crowd = { total: 0, venue: 0, online: 0, buckets: [], visible: [] }

// The fixture crowd belongs to the hero swim session. Other sessions reuse the same countries with their own
// mix: seeded variety per country, a boost for the countries playing, scaled to the session's fan count.
export function crowdFor(session: Session): Crowd {
  const target = session.fansOnApp ?? 0
  if (target <= 0) return EMPTY_CROWD

  const raw = CROWD_COUNTRIES.map((c) => {
    const factor = session.id === HERO_SESSION ? 1 : 0.5 + seedUnit(`${session.id}:crowd:${c.code}`) * 1.0
    const boost = session.teams?.includes(c.code) ? 3 : 1
    return { c, weight: (c.venue + c.online) * factor * boost }
  })
  const weightSum = raw.reduce((sum, r) => sum + r.weight, 0)
  const scale = target / (session.id === HERO_SESSION ? SWIM_CROWD_TOTAL : weightSum)

  const buckets = raw
    .map(({ c, weight }) => {
      const count = Math.round(weight * scale)
      const venueShare = c.venue / (c.venue + c.online)
      const venueCount = Math.round(count * venueShare)
      return { ...c, count, venueCount, onlineCount: count - venueCount }
    })
    .filter((b) => b.count > 0)

  // Rounding drift lands on the biggest country so the total matches the header
  const biggest = buckets.reduce((best, b) => (b.count > best.count ? b : best), buckets[0])
  const drift = target - buckets.reduce((sum, b) => sum + b.count, 0)
  if (biggest && drift !== 0) {
    biggest.count += drift
    biggest.onlineCount += drift
  }

  const venue = buckets.reduce((sum, b) => sum + b.venueCount, 0)
  const total = buckets.reduce((sum, b) => sum + b.count, 0)
  const visible = buckets.filter((b) => b.count >= MIN_GROUP).sort((a, b) => b.count - a.count)
  return { total, venue, online: total - venue, buckets, visible }
}

// ---- Languages ----

// Share of each country's fans by first language
const COUNTRY_LANGUAGES: Record<string, [string, number][]> = {
  USA: [['en', 0.77], ['es', 0.13], ['zh', 0.04], ['haw', 0.02], ['he', 0.02], ['ru', 0.02]],
  AUS: [['en', 0.93], ['zh', 0.07]],
  GBR: [['en', 0.95], ['hi', 0.05]],
  CHN: [['zh', 1]],
  JPN: [['ja', 1]],
  KOR: [['ko', 1]],
  CAN: [['en', 0.72], ['fr', 0.23], ['zh', 0.05]],
  BRA: [['pt', 1]],
  MEX: [['es', 1]],
  FRA: [['fr', 0.95], ['ar', 0.05]],
  GER: [['de', 0.92], ['tr', 0.08]],
  ITA: [['it', 1]],
  ESP: [['es', 1]],
  NED: [['nl', 0.9], ['en', 0.1]],
  SWE: [['sv', 0.9], ['en', 0.1]],
  NGR: [['en', 0.62], ['yo', 0.38]],
  KEN: [['sw', 0.6], ['en', 0.4]],
  RSA: [['en', 1]],
  IND: [['hi', 0.55], ['en', 0.45]],
  ARG: [['es', 1]],
  COL: [['es', 1]],
  JAM: [['en', 1]],
  NZL: [['en', 1]],
  SGP: [['en', 0.55], ['zh', 0.45]],
  TUR: [['tr', 1]],
  EGY: [['ar', 1]],
  MAR: [['ar', 0.75], ['fr', 0.25]],
  PHI: [['tl', 0.6], ['en', 0.4]],
}

export const languagesOfCountry = (code: string) => COUNTRY_LANGUAGES[code] ?? [['en', 1]]

export type LanguageShare = { id: string; name: string; hello: string; count: number; share: number }

export function languageMix(session: Session, crowd: Crowd): LanguageShare[] {
  const counts = new Map<string, number>()
  for (const b of crowd.buckets) {
    for (const [lang, share] of languagesOfCountry(b.code)) counts.set(lang, (counts.get(lang) ?? 0) + b.count * share)
  }
  const rows = LANGUAGES.flatMap((l) => {
    // A little seeded jitter so rooms do not look copy-pasted
    const count = Math.round((counts.get(l.id) ?? 0) * (0.9 + seedUnit(`${session.id}:lang:${l.id}`) * 0.2))
    return count >= MIN_GROUP ? [{ id: l.id, name: l.name, hello: l.hello, count, share: 0 }] : []
  })
  const sum = rows.reduce((s, r) => s + r.count, 0) || 1
  return rows.map((r) => ({ ...r, share: r.count / sum })).sort((a, b) => b.count - a.count)
}

export const formatCount = (n: number) => (n < MIN_GROUP ? `Fewer than ${MIN_GROUP}` : n.toLocaleString())
