import { Plus } from 'lucide-react'
import { flag } from '@/data/la28'
import { cn } from '@/lib/utils'
import { bringById, teamCc, teamName, type Side, type WatchParty } from '@/features/watch-party/crowd'
import type { SeatView } from '@/features/watch-party/state'

// The room, drawn as seats instead of "9/16 spots": two halves, one per team.
// A taken seat shows the fan's flag and what they're bringing. Black ring: they're
// here. Your seat is black. An empty seat is a dashed outline you can tap to sit there.

export function SideSplit({ party, sides }: { party: WatchParty; sides: [SeatView[], SeatView[]] }) {
  const count = (side: SeatView[]) => side.filter((s) => s.kind !== 'empty').length
  const [a, b] = [count(sides[0]), count(sides[1])]
  const joined = sides.flat().some((s) => s.kind === 'mine')
  const share = a + b ? (a / (a + b)) * 100 : 50
  return (
    <div>
      <div className="flex items-center justify-between text-sm font-medium tabular-nums">
        <span>
          {flag(teamCc(party.teams[0]))} {teamName(party.teams[0])} · {a}
        </span>
        <span>
          {b} · {teamName(party.teams[1])} {flag(teamCc(party.teams[1]))}
        </span>
      </div>
      {/* A tug of war: the bigger side pushes the line over */}
      <div className="relative mt-2 flex h-2 overflow-hidden rounded-full bg-background">
        <div className="h-full bg-foreground transition-[width] duration-500 ease-out" style={{ width: `${share}%` }} />
        <div className="absolute inset-y-0 w-0.5 bg-card" style={{ left: `calc(${share}% - 1px)` }} />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{splitLine(party, a, b, joined)}</p>
    </div>
  )
}

function splitLine(party: WatchParty, a: number, b: number, joined: boolean) {
  const [big, small] = a > b ? party.teams : [party.teams[1], party.teams[0]]
  if (joined) return a === b ? 'Dead even. Bring your voice.' : `${teamName(big)} fans have the bigger half.`
  if (a === b) return 'Dead even. Your seat tips it.'
  return `${teamName(small)} fans are outnumbered. Even it up?`
}

export function SeatGrid({
  party,
  sides,
  onPick,
  justTaken,
}: {
  party: WatchParty
  sides: [SeatView[], SeatView[]]
  // Tapping an empty seat on a side
  onPick?: (side: Side) => void
  // Seat numbers that just filled, to drop their flag in
  justTaken?: number[]
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {sides.map((seats, side) => (
        <div key={side} className="rounded-xl bg-background p-2.5">
          <p className="mb-2 truncate text-center text-xs font-medium text-muted-foreground">
            {flag(teamCc(party.teams[side]))} {teamName(party.teams[side])} side
          </p>
          <ul className="grid grid-cols-4 gap-1.5">
            {seats.map((seat) => (
              <li key={seat.number}>
                <SeatDot seat={seat} drop={justTaken?.includes(seat.number)} onPick={onPick && (() => onPick(side as Side))} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function SeatDot({ seat, drop, onPick }: { seat: SeatView; drop?: boolean; onPick?: () => void }) {
  const base = 'relative flex aspect-square w-full items-center justify-center rounded-full text-lg leading-none'
  if (seat.kind === 'empty') {
    return (
      <button
        type="button"
        aria-label={`Empty seat ${seat.number}`}
        disabled={!onPick}
        onClick={onPick}
        className={cn(base, 'border border-dashed border-muted-foreground/50 text-muted-foreground transition-transform active:scale-90 disabled:opacity-60')}
      >
        {onPick && <Plus className="size-3.5" />}
      </button>
    )
  }
  const bring = seat.kind !== 'friend' ? seat.bring : undefined
  const Icon = bring ? bringById(bring).icon : null
  return (
    <span
      aria-label={label(seat)}
      className={cn(
        base,
        seat.kind === 'mine' || seat.kind === 'friend' ? 'bg-foreground text-background' : 'bg-card',
        seat.here && seat.kind === 'taken' && 'ring-2 ring-foreground',
        seat.here && seat.kind !== 'taken' && 'ring-2 ring-foreground ring-offset-2 ring-offset-background',
        drop && 'animate-seat-drop',
      )}
    >
      {seat.kind === 'taken' ? flag(seat.cc) : seat.kind === 'mine' ? <span className="text-[10px] font-semibold">You</span> : <span className="text-[10px] font-semibold">+1</span>}
      {Icon && (
        <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full border bg-background text-foreground">
          <Icon className="size-2.5" />
        </span>
      )}
      {seat.kind === 'taken' && seat.host && (
        <span className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-1 text-[8px] leading-3 font-semibold text-background">Host</span>
      )}
    </span>
  )
}

function label(seat: SeatView) {
  if (seat.kind === 'mine') return `Your seat, ${seat.number}${seat.here ? ', checked in' : ''}`
  if (seat.kind === 'friend') return `Your friend, seat ${seat.number}`
  if (seat.kind === 'taken') return `Seat ${seat.number}: a fan ${seat.host ? 'hosting ' : ''}${seat.here ? 'who is here' : 'on the way'}`
  return `Seat ${seat.number}`
}

// What the room already has, counted from everyone's seat
export function BringingRow({ sides }: { sides: [SeatView[], SeatView[]] }) {
  const all = sides.flat()
  const counts = new Map<string, number>()
  for (const s of all) if ((s.kind === 'taken' || s.kind === 'mine') && s.bring) counts.set(s.bring, (counts.get(s.bring) ?? 0) + 1)
  if (!counts.size) return <p className="text-sm text-muted-foreground">Nobody has said yet.</p>
  return (
    <ul className="flex flex-wrap gap-1.5">
      {[...counts].map(([id, n]) => {
        const b = bringById(id as Parameters<typeof bringById>[0])
        return (
          <li key={id} className="flex h-8 items-center gap-1.5 rounded-full bg-background px-3 text-sm">
            <b.icon className="size-4" />
            {b.label}
            <span className="text-muted-foreground tabular-nums">×{n}</span>
          </li>
        )
      })}
    </ul>
  )
}
