// Deterministic mock crowd answers. The same key always gives the same shares, so CrowdPlay's
// results and the recap all agree without sharing any other state.

function hash(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Small seeded generator (mulberry32)
function rng(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Shares of the crowd that picked each option, summing to 1.
 * `roundId` and `scope` ('all', or a country code like 'JPN') together pick the numbers, so each
 * country gets its own split for the same round.
 */
export function seedShares(roundId: string, optionIds: string[], scope = 'all'): Record<string, number> {
  const next = rng(hash(`${roundId}:${scope}`))
  const weights = optionIds.map(() => 0.4 + next())
  const total = weights.reduce((sum, w) => sum + w, 0)
  return Object.fromEntries(optionIds.map((id, i) => [id, weights[i] / total]))
}

/** The option the crowd picked most, for a round and scope. */
export function seedWinner(roundId: string, optionIds: string[], scope = 'all') {
  const shares = seedShares(roundId, optionIds, scope)
  return optionIds.reduce((best, id) => (shares[id] > shares[best] ? id : best), optionIds[0])
}

/** A repeatable number in [0, 1) for any key, for anything else that needs mock variety. */
export function seedUnit(key: string) {
  return rng(hash(key))()
}
