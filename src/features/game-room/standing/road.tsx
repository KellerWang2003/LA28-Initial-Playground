import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Session } from '@/data/la28'
import { cn } from '@/lib/utils'
import {
  BRACKETS,
  GROUPS,
  type Bracket,
  type Group,
  type Slot,
} from './data'
import { useViewClock } from './delay'
import { countryName, flagOf } from './flags'
import { gameStateAt } from './game-state'
import { Chip, SectionTitle } from './parts'

// Road to the final: who is through, who is out, and what the current result means.
// Sections stack (collapsible); tapping a team or swimmer shows a one-line "what this means".

const ord = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10] ?? 'th'}`


function Stage({
  title,
  summary,
  chip,
  defaultOpen,
  children,
}: {
  title: string
  summary: string
  chip?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="border-b border-background last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex min-h-14 w-full items-center gap-3 py-2 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{title}</span>
          <span className="block truncate text-xs text-muted-foreground">{summary}</span>
        </span>
        {chip}
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  )
}

// The tap-to-explain line under a stage
function Meaning({ children, hint = 'Tap a team for what it means.', className }: { children: ReactNode; hint?: string; className?: string }) {
  return (
    <p role="status" className={cn('mt-2 rounded-xl bg-background px-3 py-2 text-sm', className)}>
      {children || <span className="text-muted-foreground">{hint}</span>}
    </p>
  )
}

function Card({ children }: { children: ReactNode }) {
  return (
    <section aria-label="Road to the final">
      <SectionTitle>Road to the final</SectionTitle>
      <div className="rounded-2xl bg-card px-4 pt-1">{children}</div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Team sports: group table (live) and knockout bracket
// ---------------------------------------------------------------------------

type Row = { code: string; w: number; l: number; pd: number }

// The group as it stands if the score of today's game were final
function projectGroup(group: Group, score: [number, number] | undefined) {
  const rows: (Row & { base: number })[] = group.rows.map((r, i) => ({ code: r.code, w: r.w, l: r.l, pd: r.pf - r.pa, base: i }))
  if (group.today && score) {
    const [x, y] = group.today.teams
    const [sx, sy] = score
    for (const r of rows) {
      const mine = r.code === x ? sx : r.code === y ? sy : null
      if (mine === null) continue
      const theirs = r.code === x ? sy : sx
      r.pd += mine - theirs
      if (mine > theirs) r.w += 1
      else if (mine < theirs) r.l += 1
    }
  }
  return rows.sort((a, b) => b.w - a.w || b.pd - a.pd || a.base - b.base)
}

const signed = (n: number) => (n > 0 ? `+${n}` : String(n))

function GroupTable({ session, group, bracket }: { session: Session; group: Group; bracket?: Bracket }) {
  const view = useViewClock()
  const state = gameStateAt(session, view)
  const [selected, setSelected] = useState<string | null>(null)
  const rows = projectGroup(group, state.score)
  const played = !!state.score && state.phase !== 'upcoming'
  const leader = state.score && state.score[0] !== state.score[1] ? (state.score[0] > state.score[1] ? 0 : 1) : null

  function explain(code: string) {
    const i = rows.findIndex((r) => r.code === code)
    const through = i < group.advance
    const name = countryName(code)
    const today = group.today?.teams.includes(code) && played
    const move = rows[i].base - i
    const fate = through
      ? `That is a quarterfinal spot (top ${group.advance} advance).`
      : `That is outside the top ${group.advance}, so they would miss the quarterfinals.`
    const next = bracket?.rounds[0].ties.find((t) => t.a.place === i + 1 || t.b.place === i + 1)
    const opp = next && (next.a.place === i + 1 ? next.b : next.a)
    const draw = leader === null ? 'The game is level, so nothing changes yet.' : ''
    return [
      today ? `If the score holds, ${name} finish ${ord(i + 1)} in ${group.name}.` : `${name} sit ${ord(i + 1)} in ${group.name}.`,
      today && move !== 0 ? `That is ${move > 0 ? 'up' : 'down'} ${Math.abs(move)} from before tip-off.` : '',
      fate,
      through && opp ? `Then a quarterfinal against ${slotText(opp)}.` : '',
      today ? draw : 'They are not playing in this game.',
    ]
      .filter(Boolean)
      .join(' ')
  }

  return (
    <>
      <table className="w-full text-sm">
        <caption className="sr-only">{group.name} standings{played ? ' if the current score holds' : ''}</caption>
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th className="w-6 pb-1 text-left font-normal">#</th>
            <th className="pb-1 text-left font-normal">Team</th>
            <th className="w-12 pb-1 text-center font-normal">W–L</th>
            <th className="w-12 pb-1 text-center font-normal">+/−</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const moved = played && r.base !== i
            return (
              <tr key={r.code} className={cn('border-t border-background', i === group.advance && 'border-t-2 border-dashed border-foreground/30')}>
                <td className="py-0 text-xs font-semibold text-muted-foreground tabular-nums">{i + 1}</td>
                <td className="py-0">
                  <button
                    type="button"
                    aria-pressed={selected === r.code}
                    onClick={() => setSelected(selected === r.code ? null : r.code)}
                    className={cn('-ml-1 flex min-h-11 w-full items-center gap-2 rounded-lg px-1 text-left', selected === r.code && 'bg-background')}
                  >
                    <span className="text-xl leading-none" aria-hidden>
                      {flagOf(r.code)}
                    </span>
                    <span className={cn('font-semibold', i >= group.advance && 'text-muted-foreground')}>{r.code}</span>
                    {moved && (
                      <span className={cn('text-xs font-semibold', r.base > i ? 'text-emerald-600' : 'text-red-600')}>
                        <span aria-hidden>{r.base > i ? '▲' : '▼'}</span>
                        <span className="sr-only">{r.base > i ? 'moved up' : 'moved down'}</span>
                      </span>
                    )}
                  </button>
                </td>
                <td className="text-center tabular-nums">
                  {r.w}–{r.l}
                </td>
                <td className="text-center tabular-nums">{signed(r.pd)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-1.5 text-xs text-muted-foreground">
        Top {group.advance} reach the quarterfinals.{' '}
        {played ? 'Table includes the live score, so it moves as the game does.' : 'The result of this game will update the table.'}
      </p>
      <Meaning>{selected && explain(selected)}</Meaning>
    </>
  )
}

function slotText(slot: Slot) {
  return slot.code ? countryName(slot.code) : (slot.label?.replace(/^Winner /, 'the winner of ') ?? 'to be decided')
}

function TeamLine({
  slot,
  holder,
  score,
  won,
  out,
  selected,
  onSelect,
}: {
  slot: Slot
  /** Team currently holding a group place (a projected slot) */
  holder?: string
  score?: number
  won?: boolean
  out?: boolean
  selected: boolean
  onSelect: () => void
}) {
  const code = slot.code ?? holder
  const inner = (
    <>
      <span className="text-xl leading-none" aria-hidden>
        {code ? flagOf(code) : '·'}
      </span>
      <span className={cn('min-w-0 flex-1 truncate text-sm', won && 'font-bold', out && 'text-muted-foreground', !code && 'text-muted-foreground italic')}>
        {code ? (slot.code ? code : countryName(code)) : slot.label}
        {holder && slot.label && <span className="ml-1 text-xs font-normal text-muted-foreground">projected {slot.label.split(' ')[0]}</span>}
      </span>
      {score !== undefined && <span className={cn('text-sm tabular-nums', won ? 'font-bold' : 'text-muted-foreground')}>{score}</span>}
    </>
  )
  return code ? (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn('flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left', selected && 'bg-card')}
    >
      {inner}
    </button>
  ) : (
    <div className="flex min-h-11 items-center gap-2 px-2">{inner}</div>
  )
}

function BracketRounds({ session, bracket, group }: { session: Session; bracket: Bracket; group?: Group }) {
  const view = useViewClock()
  const state = gameStateAt(session, view)
  const [selected, setSelected] = useState<string | null>(null)
  // Group slots (1st/2nd of the open group) show whoever holds that place right now
  const standing = group ? projectGroup(group, state.score) : []
  const holder = (slot: Slot) => (slot.place ? standing[slot.place - 1]?.code : undefined)

  function explain(roundIdx: number, tieIdx: number, side: 'a' | 'b') {
    const round = bracket.rounds[roundIdx]
    const tie = round.ties[tieIdx]
    const slot = tie[side]
    const code = slot.code ?? holder(slot)
    if (!code) return `${slotText(slot)} is not decided yet.`
    const name = countryName(code)
    const other = tie[side === 'a' ? 'b' : 'a']
    if (tie.winner) {
      const won = tie.winner === side
      const [sa, sb] = tie.score ?? [0, 0]
      const mine = side === 'a' ? sa : sb
      const theirs = side === 'a' ? sb : sa
      const score = `${mine}–${theirs}${tie.note ? ` ${tie.note}` : ''}`
      const nextRound = bracket.rounds[roundIdx + 1]
      return won
        ? `${name} beat ${slotText(other)} ${score} and moved on${nextRound ? ` to the ${nextRound.name.toLowerCase()}` : ''}.`
        : `${name} lost ${score} to ${slotText(other)} and are out.`
    }
    const nextRound = bracket.rounds[roundIdx + 1]
    const feeder = nextRound?.ties[Math.floor(tieIdx / 2)]
    const against = feeder && feeder[tieIdx % 2 === 0 ? 'b' : 'a']
    const plays = `${name} play ${slotText(other)}${tie.when ? ` (${tie.when})` : ''}.`
    if (!nextRound) return `${plays} The winner takes the title.`
    return `${plays} A win sets up the ${nextRound.name.toLowerCase().replace(/s$/, '')}${against ? ` against ${slotText(against)}` : ''}; a loss ends their run.`
  }

  const key = (r: number, t: number, side: 'a' | 'b') => `${r}.${t}.${side}`
  const sel = selected?.split('.')
  return (
    <>
      {bracket.rounds.map((round, r) => {
        const decided = round.ties.every((t) => t.winner)
        const hasHere = round.ties.some((t) => t.here)
        return (
          <Stage
            key={round.name}
            title={round.name}
            summary={
              decided
                ? 'All decided'
                : hasHere
                  ? `${round.ties.length} ties · this game is one of them`
                  : `${round.ties.length} ${round.ties.length === 1 ? 'tie' : 'ties'}`
            }
            chip={decided ? <Chip tone="done">Done</Chip> : hasHere ? <Chip tone="next">This game</Chip> : undefined}
            defaultOpen={hasHere && !group}
          >
            <ul className="space-y-2">
              {round.ties.map((tie, t) => (
                <li key={t} className={cn('rounded-xl bg-background px-1 py-1', tie.here && 'ring-2 ring-foreground')}>
                  <TeamLine
                    slot={tie.a}
                    holder={holder(tie.a)}
                    score={tie.score?.[0]}
                    won={tie.winner === 'a'}
                    out={tie.winner === 'b'}
                    selected={selected === key(r, t, 'a')}
                    onSelect={() => setSelected(selected === key(r, t, 'a') ? null : key(r, t, 'a'))}
                  />
                  <TeamLine
                    slot={tie.b}
                    holder={holder(tie.b)}
                    score={tie.score?.[1]}
                    won={tie.winner === 'b'}
                    out={tie.winner === 'a'}
                    selected={selected === key(r, t, 'b')}
                    onSelect={() => setSelected(selected === key(r, t, 'b') ? null : key(r, t, 'b'))}
                  />
                  {(tie.when || tie.here) && (
                    <p className="px-2 pb-1.5 text-xs text-muted-foreground">
                      {tie.here && <span className="font-semibold text-foreground">This game · </span>}
                      {tie.when}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <Meaning>
              {sel && Number(sel[0]) === r && explain(r, Number(sel[1]), sel[2] as 'a' | 'b')}
            </Meaning>
          </Stage>
        )
      })}
    </>
  )
}

function TeamRoad({ session }: { session: Session }) {
  const group = GROUPS[session.id]
  const bracket = BRACKETS[session.id]
  if (!group && !bracket) return null
  return (
    <Card>
      {group && (
        <Stage title={group.name} summary={`Top ${group.advance} advance`} chip={session.status === 'live' ? <Chip tone="live" pulse>Live</Chip> : undefined} defaultOpen>
          <GroupTable session={session} group={group} bracket={bracket} />
        </Stage>
      )}
      {bracket && <BracketRounds session={session} bracket={bracket} group={group} />}
    </Card>
  )
}

// Team sports only; for swimming, who made the final is one of the Standing updates
export function RoadToFinal({ session }: { session: Session }) {
  return <TeamRoad session={session} />
}
