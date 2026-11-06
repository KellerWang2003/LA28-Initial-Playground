import { useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { Check, ChevronLeft, DoorOpen, Plus, Sparkles, TramFront, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PinShape } from '@/components/pin-art'
import { flag, formatDate, formatTime, TODAY, eventAttendance, eventTypeLabel, placeById, sessionById } from '@/data/la28'
import { formatMinutes } from '@/data/map-layers'
import { localMinute, useClock } from '@/lib/clock'
import { useCollected } from '@/lib/collected'
import { joinEvent, leaveEvent, usePlans } from '@/lib/plans'
import { useTickets } from '@/lib/tickets'
import { cn } from '@/lib/utils'
import { addPinStop, buildDay, minutesOf, removePinStop, usePinStops, type Row, type Suggestion } from '@/features/day-plan/plan'

// Your day around a game ticket: what's planned, free time with things that
// fit it, when to leave, the game, and after. Opened after scanning a ticket.
export default function DayPlanPage() {
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()
  const now = useClock()
  const plans = usePlans()
  const stops = usePinStops()
  const collected = useCollected()
  const ticket = useTickets().find((t) => t.sessionId === sessionId)
  // The row that was just added, so it pops in
  const [added, setAdded] = useState<string | null>(null)
  const session = sessionById(sessionId)
  if (!session) return <Navigate to="/events" replace />

  const rows = buildDay(session, plans, stops, collected, now)
  const today = session.date === TODAY
  const nowMin = minutesOf(localMinute(now).slice(11))
  // The now line sits above the first stop that hasn't started, or at the end
  const firstAhead = rows.findIndex((r) => minutesOf(r.time) >= nowMin)
  const nowAt = !today ? -1 : firstAhead === -1 ? rows.length : firstAhead
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/events', { replace: true }))

  function add(s: Suggestion) {
    if (s.kind === 'event') {
      // A watch party needs a seat: pick one on its page
      if (s.event.watch) return navigate(`/events/${s.event.id}`)
      joinEvent(s.event.id)
      setAdded(s.event.id)
    } else {
      addPinStop({ date: session!.date, pin: s.pin.id, time: s.time })
      setAdded(s.pin.id)
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={goBack}>
          <ChevronLeft className="size-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="truncate font-heading text-lg leading-tight font-semibold">Your day</h1>
          <p className="truncate text-xs text-muted-foreground">
            {formatDate(session.date)} · built around {session.sport.toLowerCase()}
          </p>
        </div>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-[max(env(safe-area-inset-bottom),24px)]">
        <ol>
          {rows.map((row, i) => (
            <li key={row.key}>
              {i === nowAt && <NowLine time={localMinute(now).slice(11)} />}
              <TimelineRow row={row} pop={added !== null && row.key === added} last={i === rows.length - 1}>
                <RowBody
                  row={row}
                  seat={row.kind === 'doors' && ticket ? `Section ${ticket.seat.section}, row ${ticket.seat.row}, seat ${ticket.seat.seat}` : undefined}
                  onAdd={add}
                  onRemove={(key) => (row.kind === 'pin' ? removePinStop(session.date, key) : leaveEvent(key))}
                />
              </TimelineRow>
            </li>
          ))}
        </ol>
        {nowAt === rows.length && <NowLine time={localMinute(now).slice(11)} />}

        <div className="mt-2 flex items-start gap-3 rounded-2xl bg-card p-3 text-sm">
          <Users className="mt-0.5 size-4 shrink-0" />
          <p className="text-muted-foreground">
            Near the end of the game, we’ll ask if you want to keep going. Say yes and we’ll match you with a group heading somewhere nearby.
          </p>
        </div>
      </div>
    </div>
  )
}

// A time on the left, a dot on the rail, the stop on the right
function TimelineRow({ row, pop, last, children }: { row: Row; pop: boolean; last: boolean; children: ReactNode }) {
  const quiet = row.kind === 'gap'
  return (
    <div className={cn('grid grid-cols-[3.5rem_1rem_minmax(0,1fr)] gap-x-2', pop && 'animate-pin-pop')}>
      <span className={cn('pt-3 text-xs tabular-nums', quiet ? 'text-muted-foreground' : 'font-medium')}>{formatTime(row.time)}</span>
      <span className="relative flex justify-center">
        {!last && <span aria-hidden className={cn('absolute top-5 bottom-0 w-px', quiet ? 'border-l border-dashed border-muted-foreground/40' : 'bg-border')} />}
        <span
          aria-hidden
          className={cn(
            'relative mt-4 size-2.5 rounded-full',
            row.kind === 'game' ? 'bg-foreground ring-4 ring-foreground/15' : quiet ? 'border border-muted-foreground/60 bg-background' : 'bg-foreground/60',
          )}
        />
      </span>
      <div className="pb-3">{children}</div>
    </div>
  )
}

function NowLine({ time }: { time: string }) {
  return (
    <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-x-2 pb-2">
      <span className="text-xs font-semibold tabular-nums">{formatTime(time)}</span>
      <span className="flex items-center gap-1.5">
        <span className="rounded-full bg-foreground px-1.5 py-px text-[10px] font-semibold text-background">Now</span>
        <span className="h-px flex-1 bg-foreground" />
      </span>
    </div>
  )
}

function RowBody({ row, seat, onAdd, onRemove }: { row: Row; seat?: string; onAdd: (s: Suggestion) => void; onRemove: (key: string) => void }) {
  switch (row.kind) {
    case 'plan':
      return (
        <Stop
          eyebrow={row.tag}
          title={row.title}
          line={`${row.where} · until about ${formatTime(row.end)}`}
          to={row.to}
          action={row.tag === 'Going' && <RemoveButton onClick={() => onRemove(row.key)} />}
        />
      )
    case 'pin':
      return (
        <div className="flex items-center gap-3 rounded-2xl bg-card p-3">
          <PinShape shape={row.pin.shape} status={row.pin.status} className="size-10" />
          <Link to={`/explore/pins/${row.pin.id}`} className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Pin on the way</p>
            <p className="truncate text-sm font-medium">{row.pin.name.replace(/ Pin$/, '')}</p>
            <p className="truncate text-xs text-muted-foreground">{placeById(row.pin.place).name}</p>
          </Link>
          <RemoveButton onClick={() => onRemove(row.key)} />
        </div>
      )
    case 'gap':
      return <Gap row={row} onAdd={onAdd} />
    case 'leave':
      return (
        <p className="flex items-center gap-2 pt-2.5 text-sm">
          <TramFront className="size-4 shrink-0" />
          <span>
            <span className="font-medium">Leave by {formatTime(row.time)}</span>
            <span className="text-muted-foreground">
              {' '}
              · {formatMinutes(row.minutes)} by transit to {row.to}
            </span>
          </span>
        </p>
      )
    case 'doors':
      return (
        <p className="flex items-center gap-2 pt-2.5 text-sm">
          <DoorOpen className="size-4 shrink-0" />
          <span>
            <span className="font-medium">Doors open</span>
            {seat && <span className="text-muted-foreground"> · {seat}</span>}
          </span>
        </p>
      )
    case 'game':
      return (
        <Link to={`/sports/games/${row.session.id}`} className="block rounded-2xl border border-foreground bg-card p-3 active:bg-muted">
          <p className="text-xs text-muted-foreground">
            {row.session.sport} · your ticket
          </p>
          <p className="mt-0.5 font-heading leading-snug font-semibold">{row.session.title}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {placeById(row.session.venue).name} · until {formatTime(row.end)}
          </p>
        </Link>
      )
  }
}

function Stop({ eyebrow, title, line, to, action }: { eyebrow: string; title: string; line: string; to?: string; action?: ReactNode }) {
  const body = (
    <>
      <Badge variant={eyebrow === 'Hosting' ? 'default' : 'outline'}>{eyebrow}</Badge>
      <p className="mt-1 text-sm leading-snug font-medium">{title}</p>
      <p className="truncate text-xs text-muted-foreground">{line}</p>
    </>
  )
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-card p-3">
      {to ? (
        <Link to={to} className="min-w-0 flex-1">
          {body}
        </Link>
      ) : (
        <div className="min-w-0 flex-1">{body}</div>
      )}
      {action}
    </div>
  )
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon-xs" aria-label="Take it off the plan" onClick={onClick}>
      <X />
    </Button>
  )
}

// Free time, said plainly, with things that fit it
function Gap({ row, onAdd }: { row: Extract<Row, { kind: 'gap' }>; onAdd: (s: Suggestion) => void }) {
  const free = minutesOf(row.end) - minutesOf(row.time)
  return (
    <div className="pt-2.5">
      <p className="text-sm text-muted-foreground">{formatMinutes(free)} free</p>
      {row.suggestions.length > 0 && (
        <ul className="mt-2 space-y-2">
          {row.suggestions.map((s) => (
            <li key={s.kind === 'event' ? s.event.id : s.pin.id}>
              <SuggestionCard s={s} onAdd={() => onAdd(s)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SuggestionCard({ s, onAdd }: { s: Suggestion; onAdd: () => void }) {
  const [tapped, setTapped] = useState(false)
  const body =
    s.kind === 'event' ? (
      <Link to={`/events/${s.event.id}`} className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">
          {s.event.watch ? 'Watch party' : eventTypeLabel[s.event.type]} · {formatTime(s.event.time)}
        </p>
        <p className="text-sm leading-snug font-medium">{s.event.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {placeById(s.event.place).name}
          {s.event.host && ` · ${flag(s.event.host.cc)} ${s.event.host.name}`} · {eventAttendance(s.event)}
        </p>
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
          <Sparkles className="size-3 shrink-0" />
          {s.event.why}
        </p>
      </Link>
    ) : (
      <Link to={`/explore/pins/${s.pin.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <PinShape shape={s.pin.shape} status={s.pin.status} className="size-10" />
        <span className="min-w-0">
          <span className="block text-xs text-muted-foreground">Pin you don’t have · {formatTime(s.time)}</span>
          <span className="block truncate text-sm font-medium">{s.pin.name.replace(/ Pin$/, '')}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {s.fromVenue ? `${formatMinutes(s.fromVenue)} from the venue` : placeById(s.pin.place).hood}
          </span>
        </span>
      </Link>
    )
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-dashed p-3">
      {body}
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Add to my day"
        onClick={() => {
          setTapped(true)
          onAdd()
        }}
      >
        {tapped ? <Check /> : <Plus />}
      </Button>
    </div>
  )
}
