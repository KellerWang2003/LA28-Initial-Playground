import { useState } from 'react'
import { Link } from 'react-router'
import { Check, MapPin, Plus, Tv } from 'lucide-react'
import { AddGameSheet, GameModeSheet } from '@/components/game-sheets'
import { LiveTimer } from '@/components/live-timer'
import { ShapeIcon } from '@/components/shape-art'
import { buttonVariants } from '@/components/ui/button'
import { SPORT_SHAPE, formatDate, formatTime, placeById, type Session } from '@/data/la28'
import { formatCountdown, useRemaining } from '@/lib/clock'
import { gameFor, modeLabel, planned, useMyGames, type AttendMode } from '@/lib/my-games'
import { cn } from '@/lib/utils'

// The activity room opens this long before the start
const ROOM_OPENS_BEFORE_S = 30 * 60

const modeIcon = { venue: MapPin, online: Tv } satisfies Record<AttendMode, unknown>

type Item = ReturnType<typeof planned>[number]

// `sport` narrows the list to one sport; without it, every game you added shows
export function MyGames({ sport }: { sport?: string }) {
  const mine = useMyGames()
  const items = planned(mine).filter((item) => !sport || item.sessionData.sport === sport)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Session | null>(null)

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="font-heading font-semibold">Your games</h2>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-medium"
        >
          <Plus className="size-3.5" />
          Add
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border p-4">
          <p className="font-medium">{sport ? `No ${sport} games yet` : 'No games yet'}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add the games you are going to. When one starts, you can join its room and play along with every other fan.
          </p>
        </div>
      ) : (
        <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4">
          {items.map((item) => (
            <li key={item.session} className="w-64 shrink-0 snap-start">
              <GameCard item={item} onEdit={() => setEditing(item.sessionData)} />
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <AddGameSheet
          sport={sport}
          onClose={() => setAdding(false)}
          onPick={(session) => {
            setAdding(false)
            setEditing(session)
          }}
        />
      )}
      {editing && <GameModeSheet session={editing} onClose={() => setEditing(null)} />}
    </section>
  )
}

function GameCard({ item, onEdit }: { item: Item; onEdit: () => void }) {
  const { sessionData: session, mode } = item
  const shape = SPORT_SHAPE[session.sport]
  const Icon = modeIcon[mode]
  const untilStart = useRemaining(`${session.date}T${session.start}`)
  const untilRoom = untilStart - ROOM_OPENS_BEFORE_S
  const live = session.status === 'live'
  const finished = session.status === 'finished'
  const roomOpen = live || (!finished && untilRoom <= 0)

  return (
    <div className={cn('flex h-full flex-col rounded-2xl border p-4', live && 'border-foreground')}>
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          {shape && <ShapeIcon shape={shape} className="size-3.5 shrink-0" />}
          <span className="truncate">{session.sport}</span>
        </p>
        {live ? (
          <LiveTimer since={`${session.date}T${session.start}`} className="shrink-0 shadow-none" />
        ) : (
          <span className="shrink-0 text-xs text-muted-foreground">
            {finished ? 'Finished' : roomOpen ? 'Starting soon' : formatDate(session.date)}
          </span>
        )}
      </div>

      <p className="mt-2 line-clamp-2 min-h-10 font-medium">{session.title}</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">
        {placeById(session.venue).name}
        {!live && !finished && ` · ${formatTime(session.start)}`}
      </p>

      <button
        type="button"
        onClick={onEdit}
        aria-label={`Change how you attend: ${modeLabel(mode)}`}
        className="mt-3 inline-flex h-7 w-fit items-center gap-1 rounded-full bg-muted px-2.5 text-xs font-medium"
      >
        <Icon className="size-3.5" />
        {modeLabel(mode)}
      </button>

      <div className="mt-auto pt-3">
        {finished ? (
          <Link
            to={`/sports/games/${session.id}/recap`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full rounded-full')}
          >
            See the recap
          </Link>
        ) : roomOpen ? (
          <Link
            to={`/sports/games/${session.id}`}
            className={cn(buttonVariants({ size: 'sm' }), 'w-full rounded-full')}
          >
            Join the room
            {session.fansOnApp ? ` · ${session.fansOnApp.toLocaleString()} fans` : ''}
          </Link>
        ) : (
          <p className="flex h-9 items-center justify-center rounded-full bg-muted/60 px-3 text-xs text-muted-foreground tabular-nums">
            Room opens in {formatCountdown(untilRoom)}
          </p>
        )}
      </div>
    </div>
  )
}

// "I'm going" on a session row: add it, or change how you attend
export function GoingButton({ session }: { session: Session }) {
  const current = gameFor(useMyGames(), session.id)
  const [open, setOpen] = useState(false)
  if (session.status === 'finished') return null

  return (
    <>
      <button
        type="button"
        aria-pressed={!!current}
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 text-xs font-medium',
          current ? 'border-foreground bg-foreground text-background' : 'text-foreground',
        )}
      >
        {current ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
        {current ? `Going · ${current.mode === 'venue' ? 'Venue' : 'Online'}` : "I'm going"}
      </button>
      {open && <GameModeSheet session={session} onClose={() => setOpen(false)} />}
    </>
  )
}
