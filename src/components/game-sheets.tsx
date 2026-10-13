import { useEffect, type ReactNode } from 'react'
import { Bookmark, Check, ChevronRight, MapPin, Tv, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime, placeById, type Session } from '@/data/la28'
import { ATTEND_MODES, gameFor, removeGame, setGame, useMyGames, type AttendMode } from '@/lib/my-games'
import { useSaved } from '@/lib/saved'
import { cn } from '@/lib/utils'

// Same dialog shell as the debug panel: dimmed backdrop, card pinned to the bottom
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
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
// With `onSave`, a last option for fans who are only interested: save it to a list.
export function GameModeSheet({ session, onClose, onSave }: { session: Session; onClose: () => void; onSave?: () => void }) {
  const current = gameFor(useMyGames(), session.id)
  const savedIn = useSaved().filter((l) => l.items.some((i) => i.kind === 'game' && i.id === session.id))

  return (
    <Sheet title={current ? 'Your game' : 'Add this game'} onClose={onClose}>
      <div className="rounded-2xl bg-muted/60 px-4 py-3">
        <p className="font-medium">{session.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {session.sport} · {sessionWhen(session)}
        </p>
      </div>

      <p className="mt-4 mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {onSave ? 'How are you following it?' : 'How are you taking part?'}
      </p>
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
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            className={cn('flex w-full items-start gap-3 rounded-2xl border p-3 text-left', savedIn.length > 0 && 'border-foreground')}
          >
            <Bookmark className={cn('mt-0.5 size-5 shrink-0', savedIn.length > 0 && 'fill-current')} />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">Just interested</span>
              <span className="block text-sm text-muted-foreground">
                {savedIn.length > 0
                  ? `Saved to ${savedIn.map((l) => l.name).join(', ')}`
                  : 'Save it to a list. On your Watch list, it shows in My activities while it’s on.'}
              </span>
            </span>
            <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          </button>
        )}
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
