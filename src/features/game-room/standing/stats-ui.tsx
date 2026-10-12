import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { countryName, flagOf } from './flags'
import { SectionTitle } from './parts'

// The pieces of the live stats view, in the spirit of Apple Sports: a big scoreboard, then plain
// blocks of numbers that read at a glance. Black and white; the side that is ahead is bold.

export function StatBlock({ title, aside, children, className }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-label={title}>
      <SectionTitle aside={aside && <span className="text-xs text-muted-foreground">{aside}</span>}>{title}</SectionTitle>
      <div className={cn('rounded-2xl bg-card', className)}>{children}</div>
    </section>
  )
}

// ---- Scoreboard ----

function Side({ code, score, ahead, behind }: { code: string; score?: number; ahead?: boolean; behind?: boolean }) {
  return (
    <div className={cn('flex min-w-0 flex-col items-center', behind && 'opacity-50')}>
      <span className="text-4xl leading-none" aria-hidden>
        {flagOf(code)}
      </span>
      <span className="mt-1.5 font-heading font-semibold">{code}</span>
      <span className="max-w-full truncate text-[11px] opacity-60">{countryName(code)}</span>
      {score !== undefined && (
        <span className={cn('mt-2 font-heading text-5xl leading-none tabular-nums', ahead ? 'font-bold' : 'font-semibold')}>{score}</span>
      )}
    </div>
  )
}

/** Two sides, their scores and the game status in the middle (e.g. "Q2 4:12"). */
export function Scoreboard({
  a,
  b,
  score,
  status,
  live,
  note,
}: {
  a: string
  b: string
  score?: [number, number]
  status: string
  live?: boolean
  note?: ReactNode
}) {
  const [x, y] = score ?? []
  const decided = score && x !== y
  return (
    <section aria-label="Scoreboard" className="rounded-3xl bg-foreground px-4 py-5 text-background">
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <Side code={a} score={x} ahead={decided && x! > y!} behind={decided && x! < y!} />
        <div className="flex flex-col items-center pb-2 text-center">
          <span className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums">
            {live && <span className="size-1.5 animate-pulse rounded-full bg-red-500" />}
            {status}
          </span>
        </div>
        <Side code={b} score={y} ahead={decided && y! > x!} behind={decided && y! < x!} />
      </div>
      {note && <div className="mt-4 border-t border-background/15 pt-3 text-center text-sm opacity-80">{note}</div>}
    </section>
  )
}

// ---- Score by period ----

export function LineScore({ a, b, periods, rows, current }: { a: string; b: string; periods: string[]; rows: [number[], number[]]; current?: number }) {
  const total = (r: number[]) => r.reduce((sum, n) => sum + n, 0)
  return (
    <table className="w-full text-sm tabular-nums">
      <thead>
        <tr className="text-xs text-muted-foreground">
          <th className="py-2.5 pl-4 text-left font-normal">
            <span className="sr-only">Team</span>
          </th>
          {periods.map((p, i) => (
            <th key={p} className={cn('w-10 py-2.5 text-center font-normal', i === current && 'font-semibold text-foreground')}>
              {p}
            </th>
          ))}
          <th className="w-12 py-2.5 pr-4 text-right font-semibold text-foreground">T</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-background">
        {[a, b].map((code, side) => {
          const row = rows[side]
          const mine = total(row)
          const theirs = total(rows[1 - side])
          return (
            <tr key={code}>
              <td className="py-2.5 pl-4">
                <span className="mr-1.5" aria-hidden>
                  {flagOf(code)}
                </span>
                <span className="font-semibold">{code}</span>
              </td>
              {periods.map((p, i) => (
                <td key={p} className={cn('text-center', i < row.length ? '' : 'text-muted-foreground/50')}>
                  {i < row.length ? row[i] : '–'}
                </td>
              ))}
              <td className={cn('pr-4 text-right', mine > theirs ? 'font-bold' : 'font-semibold text-muted-foreground')}>{mine}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// ---- Team stats, side by side ----

export type StatRow = { label: string; a: number; b: number; format?: (n: number) => string; sub?: [string, string]; lowerIsBetter?: boolean }

export function StatBars({ rows }: { rows: StatRow[] }) {
  return (
    <ul className="divide-y divide-background">
      {rows.map((r) => {
        const fmt = r.format ?? String
        const sum = r.a + r.b || 1
        const aBetter = r.lowerIsBetter ? r.a < r.b : r.a > r.b
        const bBetter = r.lowerIsBetter ? r.b < r.a : r.b > r.a
        return (
          <li key={r.label} className="px-4 py-3">
            <div className="flex items-baseline justify-between gap-2 text-sm tabular-nums">
              <span className={cn(aBetter ? 'font-bold' : 'text-muted-foreground')}>
                {fmt(r.a)}
                {r.sub && <span className="ml-1 text-xs font-normal text-muted-foreground">{r.sub[0]}</span>}
              </span>
              <span className="text-xs text-muted-foreground">{r.label}</span>
              <span className={cn(bBetter ? 'font-bold' : 'text-muted-foreground')}>
                {r.sub && <span className="mr-1 text-xs font-normal text-muted-foreground">{r.sub[1]}</span>}
                {fmt(r.b)}
              </span>
            </div>
            <div className="mt-1.5 flex gap-1" aria-hidden>
              <span className="flex h-1.5 flex-1 justify-end overflow-hidden rounded-full bg-background">
                <span className={cn('h-full rounded-full', aBetter ? 'bg-foreground' : 'bg-foreground/25')} style={{ width: `${(r.a / sum) * 100}%` }} />
              </span>
              <span className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-background">
                <span className={cn('h-full rounded-full', bBetter ? 'bg-foreground' : 'bg-foreground/25')} style={{ width: `${(r.b / sum) * 100}%` }} />
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// ---- Top players per team ----

export type Leader = { name: string; value: number; line?: string }

export function Leaders({ a, b, rows }: { a: string; b: string; rows: { label: string; a: Leader; b: Leader }[] }) {
  return (
    <ul className="divide-y divide-background">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3">
          <LeaderCell code={a} leader={r.a} better={r.a.value > r.b.value} />
          <span className="w-12 text-center text-xs text-muted-foreground">{r.label}</span>
          <LeaderCell code={b} leader={r.b} better={r.b.value > r.a.value} right />
        </li>
      ))}
    </ul>
  )
}

function LeaderCell({ code, leader, better, right }: { code: string; leader: Leader; better: boolean; right?: boolean }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2', right && 'flex-row-reverse text-right')}>
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-background text-lg leading-none" aria-hidden>
        {flagOf(code)}
      </span>
      <span className="min-w-0">
        <span className={cn('block font-heading text-2xl leading-none tabular-nums', better ? 'font-bold' : 'font-semibold text-muted-foreground')}>
          {leader.value}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{leader.name}</span>
      </span>
    </div>
  )
}

// ---- Recent plays ----

export type PlayRow = { id: string; clock: string; code: string; text: string; score?: string }

export function Plays({ rows }: { rows: PlayRow[] }) {
  return (
    <ol className="divide-y divide-background">
      {rows.map((p) => (
        <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
          <span className="w-14 shrink-0 text-xs text-muted-foreground tabular-nums">{p.clock}</span>
          <span aria-hidden>{flagOf(p.code)}</span>
          <span className="min-w-0 flex-1 truncate text-sm">{p.text}</span>
          {p.score && <span className="shrink-0 text-sm font-semibold tabular-nums">{p.score}</span>}
        </li>
      ))}
    </ol>
  )
}

// ---- Ranked list (swimming, gymnastics) ----

export type BoardRow = { id: string; rank?: string; code: string; name: string; value?: string; gap?: string; highlight?: boolean; dim?: boolean; aside?: string }

export function Leaderboard({ rows, valueLabel }: { rows: BoardRow[]; valueLabel?: string }) {
  return (
    <ol className="divide-y divide-background">
      {valueLabel && (
        <li className="flex justify-end px-4 pt-2.5 pb-1 text-[11px] text-muted-foreground" aria-hidden>
          {valueLabel}
        </li>
      )}
      {rows.map((r) => (
        <li key={r.id} className={cn('flex min-h-12 items-center gap-3 px-4 py-2', r.highlight && 'bg-background', r.dim && 'text-muted-foreground')}>
          <span className="w-5 shrink-0 text-center text-sm font-semibold tabular-nums">{r.rank}</span>
          <span className="text-xl leading-none" aria-hidden>
            {flagOf(r.code)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{r.name}</span>
            <span className="block text-xs text-muted-foreground">
              {r.code}
              {r.aside && ` · ${r.aside}`}
            </span>
          </span>
          <span className="shrink-0 text-right tabular-nums">
            {r.value && <span className="block text-sm font-semibold">{r.value}</span>}
            {r.gap && <span className="block text-xs text-muted-foreground">{r.gap}</span>}
          </span>
        </li>
      ))}
    </ol>
  )
}
