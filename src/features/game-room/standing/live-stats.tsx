import type { ReactNode } from 'react'
import { formatTime, type Session } from '@/data/la28'
import { formatCountdown } from '@/lib/clock'
import { cn } from '@/lib/utils'
import { useMyCountry } from '../crowd'
import { seedUnit } from '../seed'
import { boxScoreAt } from './basketball'
import { raceTimes, SWIM_FIXTURES } from './data'
import { useStreamDelay, useViewClock } from './delay'
import { countryName, flagOf } from './flags'
import { gameStateAt } from './game-state'
import { ResultGate } from './parts'
import { phaseAt, secondsUntil, startMs, type Phase } from './status'
import { LineScore, Leaderboard, Leaders, Plays, Scoreboard, StatBars, StatBlock, type StatRow } from './stats-ui'
import { raceBoard, RECORDS, swimTime } from './swim-stats'

// Live stats for the session, in the spirit of Apple Sports: a scoreboard with the clock, then
// the numbers that tell you how the game is going. One layout per kind of session.

export function LiveStats({ session }: { session: Session }) {
  const view = useViewClock()
  const phase = phaseAt(session, view)
  const body = session.races?.length ? (
    <SwimStats session={session} />
  ) : session.teams?.length === 2 ? (
    <TeamStats session={session} phase={phase} />
  ) : session.live?.sets ? (
    <SetsStats session={session} phase={phase} />
  ) : session.live?.standings ? (
    <GymStats session={session} phase={phase} />
  ) : (
    <ProgramStats session={session} phase={phase} />
  )
  if (phase === 'upcoming') return body
  // With "Hide scores" on, the whole view waits behind one tap
  return (
    <ResultGate id={`stats:${session.id}`} eventMs={0} label="Scores hidden. Tap to show live stats" className="w-full justify-center">
      {body}
    </ResultGate>
  )
}

// Black header for sessions without two sides
function EventHeader({ kicker, title, status, live, note }: { kicker: string; title: string; status?: string; live?: boolean; note?: ReactNode }) {
  return (
    <section aria-label="Scoreboard" className="rounded-3xl bg-foreground p-5 text-background">
      <p className="flex items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          {live && <span className="size-1.5 animate-pulse rounded-full bg-red-500" />}
          {kicker}
        </span>
      </p>
      <h2 className="mt-1 font-heading text-xl leading-tight font-semibold">{title}</h2>
      {status && <p className="mt-3 font-heading text-5xl leading-none font-bold tabular-nums">{status}</p>}
      {note && <p className="mt-3 text-sm opacity-70">{note}</p>}
    </section>
  )
}

// ---- Swimming ----

type Race = NonNullable<Session['races']>[number]

const MEDALS = ['🥇', '🥈', '🥉']
const RESULT_STAYS_MS = 10 * 60 * 1000
const NEXT_TAKES_OVER_MS = 5 * 60 * 1000

function SwimStats({ session }: { session: Session }) {
  const view = useViewClock()
  const mine = useMyCountry(session.id)
  const races = (session.races ?? []).map((race) => ({ race, ...raceTimes(session, race) }))

  // The race on the board: in the water, then one that just finished, then the next one
  const inWater = races.find((r) => view >= r.start && view < r.resultAt)
  const next = races.find((r) => view < r.start)
  const recent = races.findLast((r) => view >= r.resultAt && view - r.resultAt < RESULT_STAYS_MS)
  const shown = inWater ?? (recent && !(next && next.start - view < NEXT_TAKES_OVER_MS) ? recent : next) ?? races[races.length - 1]
  const state = view < shown.start ? 'upcoming' : view < shown.resultAt ? 'swimming' : 'finished'
  const board = raceBoard(session, shown.race, view, mine)
  const record = RECORDS[shown.race.time]

  return (
    <>
      <EventHeader
        kicker={`Race ${races.indexOf(shown) + 1} of ${races.length} · ${formatTime(shown.race.time)}`}
        title={shown.race.title}
        live={state === 'swimming'}
        status={
          state === 'upcoming'
            ? formatCountdown(secondsUntil(shown.start, view))
            : state === 'swimming'
              ? formatCountdown(Math.floor((view - shown.start) / 1000))
              : 'Final'
        }
        note={board?.pace ?? (state === 'upcoming' ? 'Until the start' : undefined)}
      />

      {board ? (
        <StatBlock title={board.label} aside={record && `WR ${swimTime(record.world)} · OR ${swimTime(record.olympic)}`}>
          <Leaderboard rows={board.rows} valueLabel={board.valueLabel} />
        </StatBlock>
      ) : (
        state !== 'finished' && <p className="rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground">The start list is posted shortly before the race.</p>
      )}

      <StatBlock title="Tonight" aside={`${races.filter((r) => view >= r.resultAt).length} of ${races.length} done`}>
        <ul className="divide-y divide-background">
          {races.map(({ race, start, resultAt }) => (
            <TonightRow key={race.time} race={race} state={view < start ? 'upcoming' : view < resultAt ? 'swimming' : 'finished'} current={race === shown.race} />
          ))}
        </ul>
      </StatBlock>

      <MedalsTonight races={races.filter((r) => view >= r.resultAt).map((r) => r.race)} mine={mine} />
    </>
  )
}

function resultsOf(race: Race) {
  const fixture = SWIM_FIXTURES[race.time]?.results
  return fixture?.length ? fixture : (race.podium ?? []).map((code) => ({ code, name: countryName(code), time: '' }))
}

function TonightRow({ race, state, current }: { race: Race; state: 'upcoming' | 'swimming' | 'finished'; current: boolean }) {
  const winner = resultsOf(race)[0]
  const qualifying = !!SWIM_FIXTURES[race.time]?.label
  return (
    <li className={cn('flex items-center gap-3 px-4 py-3', current && 'bg-background')}>
      <span className="w-14 shrink-0 text-xs font-semibold tabular-nums">{formatTime(race.time)}</span>
      <span className={cn('min-w-0 flex-1 text-sm', state === 'finished' && 'text-muted-foreground')}>{race.title}</span>
      <span className="shrink-0 text-right text-xs tabular-nums">
        {state === 'swimming' ? (
          <span className="inline-flex items-center gap-1 font-semibold text-red-600">
            <span className="size-1.5 animate-pulse rounded-full bg-current" />
            Live
          </span>
        ) : state === 'finished' && winner ? (
          <>
            <span className="block font-semibold">
              {qualifying ? '1st' : '🥇'} {flagOf(winner.code)} {winner.code}
            </span>
            {winner.time && <span className="block text-muted-foreground">{winner.time}</span>}
          </>
        ) : (
          <span className={cn(current ? 'font-semibold' : 'text-muted-foreground')}>{state === 'finished' ? 'Done' : current ? 'Up next' : 'Later'}</span>
        )}
      </span>
    </li>
  )
}

function MedalsTonight({ races, mine }: { races: Race[]; mine: string }) {
  const counts = new Map<string, [number, number, number]>()
  for (const race of races) {
    if (SWIM_FIXTURES[race.time]?.label) continue
    resultsOf(race)
      .slice(0, 3)
      .forEach((r, i) => {
        const row = counts.get(r.code) ?? [0, 0, 0]
        row[i] += 1
        counts.set(r.code, row)
      })
  }
  const rows = [...counts].sort(([, x], [, y]) => y[0] - x[0] || y[1] - x[1] || y[2] - x[2])
  if (rows.length === 0) return null
  return (
    <StatBlock title="Medals tonight">
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th className="py-2.5 pl-4 text-left font-normal">Country</th>
            {MEDALS.map((m) => (
              <th key={m} className="w-10 py-2.5 text-center font-normal">
                {m}
              </th>
            ))}
            <th className="w-12 py-2.5 pr-4 text-right font-semibold text-foreground">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-background">
          {rows.map(([code, m]) => (
            <tr key={code} className={cn(code === mine && 'bg-background')}>
              <td className="py-2.5 pl-4">
                <span className="mr-1.5" aria-hidden>
                  {flagOf(code)}
                </span>
                <span className="font-medium">{countryName(code)}</span>
              </td>
              {m.map((n, i) => (
                <td key={i} className={cn('text-center', !n && 'text-muted-foreground/50')}>
                  {n}
                </td>
              ))}
              <td className="pr-4 text-right font-semibold">{m[0] + m[1] + m[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </StatBlock>
  )
}

// ---- Two sides: basketball (full box score) and football ----

const FOOTBALL_SCORERS: Record<string, string[]> = {
  JPN: ['Hina Sato', 'Yui Takeda', 'Mana Ono'],
  CAN: ['Jordyn Beck', 'Sophie Lavoie', 'Maya Grant'],
}

function TeamStats({ session, phase }: { session: Session; phase: Phase }) {
  const view = useViewClock()
  const [a, b] = session.teams!
  const state = gameStateAt(session, view)
  const football = session.sport === 'Football'
  const box = boxScoreAt(session, view)

  if (phase === 'upcoming' || !state.score) {
    return (
      <Scoreboard
        a={a}
        b={b}
        status={phase === 'upcoming' ? `${football ? 'Kickoff' : 'Tip-off'} ${formatTime(session.start)}` : 'Live'}
        live={phase === 'live'}
        note={phase === 'upcoming' ? `Starts in ${formatCountdown(secondsUntil(startMs(session), view))}. Live stats show here from the start.` : 'Live stats show here as soon as they come in.'}
      />
    )
  }

  const status = phase === 'finished' ? 'Final' : (state.clock ?? 'Live')

  if (box) {
    return (
      <>
        <Scoreboard a={a} b={b} score={state.score} status={status} live={phase === 'live'} />
        <StatBlock title="Score by quarter">
          <LineScore a={a} b={b} periods={['Q1', 'Q2', 'Q3', 'Q4']} rows={box.line} current={phase === 'live' ? box.quarter - 1 : undefined} />
        </StatBlock>
        <StatBlock title="Top players">
          <Leaders a={a} b={b} rows={box.leaders} />
        </StatBlock>
        <StatBlock title="Team stats">
          <StatBars rows={box.stats} />
        </StatBlock>
        {box.plays.length > 0 && (
          <StatBlock title="Latest plays">
            <Plays rows={box.plays} />
          </StatBlock>
        )}
      </>
    )
  }

  // Football (fixed data): goals are seeded around the final score
  const [x, y] = state.score
  const goals = [
    ...Array.from({ length: x }, (_, i) => ({ side: 0 as const, i })),
    ...Array.from({ length: y }, (_, i) => ({ side: 1 as const, i })),
  ]
    .map((goal) => {
      const code = goal.side ? b : a
      const names = FOOTBALL_SCORERS[code] ?? [`${countryName(code)} forward`]
      return { ...goal, code, minute: 4 + Math.floor(seedUnit(`fb:${session.id}:${code}:${goal.i}`) * 86), who: names[Math.floor(seedUnit(`fb:who:${session.id}:${code}:${goal.i}`) * names.length)] }
    })
    .sort((g1, g2) => g1.minute - g2.minute)
  const half = (side: 0 | 1, h: 0 | 1) => goals.filter((g) => g.side === side && (h ? g.minute > 45 : g.minute <= 45)).length
  const seeded = (key: string, lo: number, hi: number) => Math.round(lo + seedUnit(`fb:${session.id}:${key}`) * (hi - lo))
  const possession = seeded('poss', 40, 60)
  const stats: StatRow[] = [
    { label: 'Possession', a: possession, b: 100 - possession, format: (n) => `${n}%` },
    { label: 'Shots', a: x * 3 + seeded('shots:a', 4, 9), b: y * 3 + seeded('shots:b', 4, 9) },
    { label: 'On target', a: x + seeded('ot:a', 1, 4), b: y + seeded('ot:b', 1, 4) },
    { label: 'Corners', a: seeded('cor:a', 2, 8), b: seeded('cor:b', 2, 8) },
    { label: 'Fouls', a: seeded('foul:a', 7, 15), b: seeded('foul:b', 7, 15), lowerIsBetter: true },
  ]

  return (
    <>
      <Scoreboard
        a={a}
        b={b}
        score={state.score}
        status={status}
        live={phase === 'live'}
        note={
          goals.length > 0 && (
            <span className="flex flex-col gap-0.5 text-xs">
              {goals.map((g) => (
                <span key={`${g.code}${g.i}`}>
                  ⚽ {g.who} {g.minute}′ <span aria-hidden>{flagOf(g.code)}</span>
                </span>
              ))}
            </span>
          )
        }
      />
      <StatBlock title="Score by half">
        <LineScore a={a} b={b} periods={['1st', '2nd']} rows={[[half(0, 0), half(0, 1)], [half(1, 0), half(1, 1)]]} />
      </StatBlock>
      <StatBlock title="Team stats">
        <StatBars rows={stats} />
      </StatBlock>
    </>
  )
}

// ---- Beach volleyball: sets ----

function SetsStats({ session, phase }: { session: Session; phase: Phase }) {
  const live = session.live!
  const [a, b] = (live.match ?? '').split(' vs ')
  const sets = live.sets ?? []
  const current = phase === 'live' ? sets.length - 1 : -1
  const won = (side: 0 | 1) => sets.filter((s, i) => i !== current && s[side] > s[1 - side]).length
  const points = [0, 1].map((side) => sets.reduce((sum, s) => sum + s[side], 0))
  const share = (side: number, key: string, lo: number, hi: number) => Math.round(points[side] * (lo + seedUnit(`bvb:${session.id}:${key}:${side}`) * (hi - lo)))
  const stats: StatRow[] = [
    { label: 'Attack points', a: share(0, 'att', 0.55, 0.65), b: share(1, 'att', 0.55, 0.65) },
    { label: 'Blocks', a: share(0, 'blk', 0.06, 0.12), b: share(1, 'blk', 0.06, 0.12) },
    { label: 'Aces', a: share(0, 'ace', 0.04, 0.09), b: share(1, 'ace', 0.04, 0.09) },
    { label: 'Errors', a: share(1, 'err', 0.15, 0.22), b: share(0, 'err', 0.15, 0.22), lowerIsBetter: true },
  ]

  return (
    <>
      <Scoreboard a={a} b={b} score={[won(0), won(1)]} status={phase === 'live' ? (live.clock ?? 'Live') : 'Final'} live={phase === 'live'} note="Sets won" />
      <StatBlock title="Score by set">
        <LineScore a={a} b={b} periods={['S1', 'S2', 'S3']} rows={[sets.map((s) => s[0]), sets.map((s) => s[1])]} current={current >= 0 ? current : undefined} />
      </StatBlock>
      <StatBlock title="Match stats">
        <StatBars rows={stats} />
      </StatBlock>
      {(session.results?.length || session.next) && (
        <StatBlock title="Tonight on court">
          <ul className="divide-y divide-background">
            {session.results?.map((r) => (
              <li key={r.match} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="min-w-0 flex-1">
                  {r.match
                    .split(' vs ')
                    .map((code) => `${flagOf(code)} ${code}`)
                    .join('  vs  ')}
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{r.score}</span>
              </li>
            ))}
            {session.next && (
              <li className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground">
                <span className="min-w-0 flex-1">{session.next.split(', ')[0]}</span>
                <span className="shrink-0 tabular-nums">{session.next.split(', ')[1] ? formatTime(session.next.split(', ')[1]) : 'Next'}</span>
              </li>
            )}
          </ul>
        </StatBlock>
      )}
    </>
  )
}

// ---- Gymnastics: leaderboard ----

function GymStats({ session, phase }: { session: Session; phase: Phase }) {
  const mine = useMyCountry(session.id)
  const live = session.live!
  const standings = live.standings ?? []
  const [, done, total] = /(\d+) of (\d+)/.exec(live.progress ?? '') ?? []
  const lead = standings[0]?.[1] ?? 0
  return (
    <>
      <EventHeader
        kicker={phase === 'live' ? 'Live' : 'Final'}
        title={session.title}
        live={phase === 'live'}
        status={done && total ? `${done}/${total}` : undefined}
        note={done && total ? 'Rotations done' : undefined}
      />
      <StatBlock title="Leaderboard" className="overflow-hidden">
        <Leaderboard
          valueLabel="Total"
          rows={standings.map(([code, score], i) => ({
            id: code,
            rank: String(i + 1),
            code,
            name: countryName(code),
            value: score.toFixed(3),
            gap: i ? `−${(lead - score).toFixed(3)}` : undefined,
            highlight: code === mine,
          }))}
        />
      </StatBlock>
    </>
  )
}

// ---- Anything else: the program ----

function ProgramStats({ session, phase }: { session: Session; phase: Phase }) {
  const view = useViewClock()
  const { offsetS } = useStreamDelay()
  return (
    <>
      <EventHeader
        kicker={phase === 'upcoming' ? `Starts ${formatTime(session.start)}` : phase === 'live' ? 'Live' : 'Final'}
        title={session.title}
        live={phase === 'live'}
        status={phase === 'upcoming' ? formatCountdown(secondsUntil(startMs(session), view)) : undefined}
        note={phase === 'live' ? `Live results show here as each event finishes${offsetS ? ', matched to your stream' : ''}.` : undefined}
      />
      {session.events?.length ? (
        <StatBlock title="On the program">
          <ol className="divide-y divide-background">
            {session.events.map((event, i) => (
              <li key={event} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-background text-xs font-semibold tabular-nums">{i + 1}</span>
                {event}
              </li>
            ))}
          </ol>
        </StatBlock>
      ) : null}
    </>
  )
}
