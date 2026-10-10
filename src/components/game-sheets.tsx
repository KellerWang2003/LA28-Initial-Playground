import { useEffect, type ReactNode } from 'react'
import { Check, MapPin, Tv, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShapeIcon } from '@/components/shape-art'
import { SCHEDULE, SPORT_SHAPE, formatDate, formatTime, placeById, type Session } from '@/data/la28'
import { ATTEND_MODES, gameFor, removeGame, setGame, useMyGames, type AttendMode } from '@/lib/my-games'
import { cn } from '@/lib/utils'

// Same dialog shell as the debug panel: dimmed backdrop, card pinned to the bottom
function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div
        role="dialog"
        aria-modal
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="no-scrollbar m-3 mb-[max(env(safe-area-inset-bottom),12px)] max-h-[calc(100dvh-24px)] w-full max-w-sm overflow-y-auto overscroll-contain rounded-3xl border bg-background p-4 shadow-xl"
      >
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-heading font-semibold">{title}</h2>
          <Button variant="ghost" size="icon-sm" aria-label="Close" className="ml-auto" onClick={onClose}>
            <X />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}

const modeIcon = { venue: MapPin, online: Tv } satisfies Record<AttendMode, unknown>

const sessionWhen = (session: Session) =>
  `${formatDate(session.date)} · ${formatTime(session.start)} · ${placeById(session.venue).name}`

// How will you take part? Also where you remove a game you added.
export function GameModeSheet({ session, onClose }: { session: Session; onClose: () => void }) {
  const current = gameFor(useMyGames(), session.id)

  return (
    <Sheet title={current ? 'Your game' : 'Add this game'} onClose={onClose}>
      <div className="rounded-2xl bg-muted/60 px-4 py-3">
        <p className="font-medium">{session.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {session.sport} · {sessionWhen(session)}
        </p>
      </div>

      <p className="mt-4 mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">How are you taking part?</p>
      <div className="space-y-2">
        {ATTEND_MODES.map((mode) => {
          const Icon = modeIcon[mode.id]
          const active = current?.mode === mode.id
          return (
            <button
              key={mode.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setGame(session.id, mode.id)
                onClose()
              }}
              className={cn('flex w-full items-start gap-3 rounded-2xl border p-3 text-left', active && 'border-foreground')}
            >
              <Icon className="mt-0.5 size-5 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{mode.label}</span>
                <span className="block text-sm text-muted-foreground">{mode.hint}</span>
              </span>
              {active && <Check className="mt-0.5 size-4 shrink-0" />}
            </button>
          )
        })}
      </div>

      {current && (
        <Button
          variant="ghost"
          className="mt-3 w-full text-muted-foreground"
          onClick={() => {
            removeGame(session.id)
            onClose()
          }}
        >
          Remove from my games
        </Button>
      )}
    </Sheet>
  )
}

// Everything still ahead (or live) that you have not added yet
export function AddGameSheet({ sport, onClose, onPick }: { sport?: string; onClose: () => void; onPick: (session: Session) => void }) {
  const mine = useMyGames()
  const options = SCHEDULE.filter((s) => s.status !== 'finished' && (!sport || s.sport === sport) && !gameFor(mine, s.id)).sort((a, b) =>
    `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`),
  )

  return (
    <Sheet title={sport ? `Add a ${sport} game` : 'Add a game'} onClose={onClose}>
      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">Every upcoming game is already on your list.</p>
      ) : (
        <ul className="-mx-1">
          {options.map((session) => {
            const shape = SPORT_SHAPE[session.sport]
            return (
              <li key={session.id}>
                <button
                  type="button"
                  onClick={() => onPick(session)}
                  className="flex w-full items-center gap-3 rounded-xl px-1 py-2.5 text-left hover:bg-muted"
                >
                  {shape && <ShapeIcon shape={shape} className="size-5 shrink-0" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{session.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {session.sport} · {session.status === 'live' ? 'Live now' : sessionWhen(session)}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Sheet>
  )
}
