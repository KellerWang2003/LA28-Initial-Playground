import type { Session } from '@/data/la28'
import { ROOM_OPENS_BEFORE_S } from '../round-phase'
import { SWIM_FIXTURES, raceTimes } from './data'
import { countryName } from './flags'
import { gameStateAt } from './game-state'
import { atMs, endMs, startMs } from './status'

// What the room could pick in this session, and what really happened. The picks themselves are
// mock (see seedShares); only the real outcome comes from the session data.

export type Outcome = {
  /** The option that came out on top, so it can be compared with the room's favourite */
  winner?: string
  /** A sentence about what happened: "Australia won the women's 100m backstroke final." */
  text: string
  /** Still changing (a live game), so wording says "right now" */
  final: boolean
}

export type Contest = {
  id: string
  title: string
  /** Country codes (or 'draw') the room picks from */
  options: string[]
  opensAt: number
  closesAt: number
  /** When the real outcome reaches the fan's stream */
  landedAt: number
  /** Shared with the status card, so revealing one reveals the other */
  gateId: string
  outcome: (viewMs: number) => Outcome | undefined
}

const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1)

export function contestsFor(session: Session): Contest[] {
  const out: Contest[] = []

  // Swimming: one per race that has picks
  for (const race of session.races ?? []) {
    const fixture = SWIM_FIXTURES[race.time]
    const winner = fixture?.results[0]
    if (!fixture?.picks || !winner) continue
    const { resultAt } = raceTimes(session, race)
    out.push({
      id: `${session.id}:${race.time}`,
      title: race.title,
      options: fixture.picks.options,
      opensAt: atMs(session.date, fixture.picks.opensAt),
      closesAt: atMs(session.date, fixture.picks.closesAt),
      landedAt: resultAt,
      gateId: `race:${session.id}:${race.time}`,
      outcome: () => ({
        winner: winner.code,
        text: `${countryName(winner.code)} won the ${lower(race.title)}.`,
        final: true,
      }),
    })
  }

  // Two teams: who wins
  if (session.teams?.length === 2) {
    const [a, b] = session.teams
    const draw = session.sport === 'Football' && /group/i.test(session.title)
    out.push({
      id: session.id,
      title: session.title,
      options: draw ? [a, b, 'draw'] : [a, b],
      opensAt: startMs(session) - ROOM_OPENS_BEFORE_S * 1000,
      closesAt: startMs(session),
      landedAt: session.status === 'finished' ? endMs(session) : 0,
      gateId: `score:${session.id}`,
      outcome: (view) => {
        const state = gameStateAt(session, view)
        if (!state.score) return undefined
        const [x, y] = state.score
        const lead = x === y ? 'draw' : x > y ? a : b
        const final = state.phase === 'finished'
        const text =
          lead === 'draw'
            ? final
              ? `it ended ${x}–${y}.`
              : `it is level at ${x}–${y}.`
            : `${countryName(lead)} ${final ? 'won' : 'lead'} ${Math.max(x, y)}–${Math.min(x, y)}.`
        return { winner: lead, text, final }
      },
    })
  }

  // Gymnastics: who leads after the latest rotation
  if (session.live?.standings?.length) {
    const standings = session.live.standings
    out.push({
      id: session.id,
      title: session.title,
      options: standings.map(([code]) => code),
      opensAt: startMs(session) - ROOM_OPENS_BEFORE_S * 1000,
      closesAt: startMs(session),
      landedAt: 0,
      gateId: `gym:${session.id}`,
      outcome: () => ({
        winner: standings[0][0],
        text: `${countryName(standings[0][0])} lead after ${(session.live?.progress ?? 'the latest rotation').toLowerCase().replace(/^rotation (\d+) of \d+$/, 'rotation $1')}.`,
        final: false,
      }),
    })
  }

  // Beach volleyball pool play: one per finished match
  session.results?.forEach((r, i) => {
    const teams = r.match.split(' vs ')
    if (teams.length !== 2) return
    out.push({
      id: `${session.id}:${i}`,
      title: r.match,
      options: teams,
      opensAt: startMs(session) - ROOM_OPENS_BEFORE_S * 1000,
      closesAt: startMs(session),
      landedAt: endMs(session),
      gateId: `result:${session.id}:${i}`,
      outcome: () => ({ winner: r.winner, text: `${countryName(r.winner)} won ${r.score}.`, final: true }),
    })
  })

  return out
}
