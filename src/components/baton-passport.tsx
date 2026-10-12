import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Play, X } from 'lucide-react'
import { BatonArt } from '@/components/baton-art'
import { NoteBody } from '@/components/baton-note'
import { hasNote } from '@/lib/batons'
import { BatonStamp } from '@/components/baton-drop'
import { Button } from '@/components/ui/button'
import { countryLabel, type LogEntry } from '@/lib/batons'
import { useProfile } from '@/lib/profile'
import { cn } from '@/lib/utils'
import { BATON_CONFIG, themeById } from '@/data/batons'
import { formatTime, placeById } from '@/data/la28'

const shortDate = (dayKey: string) =>
  new Date(`${dayKey}T12:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

// Passport > Batons: a stamp for every baton the fan carried to its next spot
export function BatonTile({ entry, onOpen }: { entry: LogEntry; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="flex flex-col rounded-2xl border p-3 text-left transition-transform active:scale-[0.98]">
      <BatonArt theme={entry.theme} className="mx-auto size-12" />
      <span className="mt-1 truncate text-sm font-semibold">{themeById(entry.theme).name}</span>
      <span className="text-[11px] text-muted-foreground">{shortDate(entry.dayKey)}</span>
      <span className="mt-1 line-clamp-1 text-xs">
        {placeById(entry.from).name} → {placeById(entry.to).name}
      </span>
      {entry.note && <span className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">“{entry.note}”</span>}
    </button>
  )
}

export function BatonEntrySheet({ entry, onClose }: { entry: LogEntry; onClose: () => void }) {
  const navigate = useNavigate()
  const profile = useProfile()
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true))
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div role="dialog" aria-modal aria-label={themeById(entry.theme).name} className="fixed inset-0 z-40">
      <div aria-hidden onClick={onClose} className={cn('absolute inset-0 bg-black/30 transition-opacity duration-300', shown ? 'opacity-100' : 'opacity-0')} />
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 rounded-t-3xl border-t bg-background px-4 pt-4 pb-[max(env(safe-area-inset-bottom),16px)] shadow-xl transition-transform duration-300 ease-out',
          shown ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="flex justify-end">
          <Button variant="ghost" size="icon-lg" aria-label="Close" className="-mt-1 -mr-2" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>
        <BatonStamp entry={entry} className="mx-auto -mt-6 w-60" />
        <div className="mt-6 rounded-2xl bg-muted px-3.5 py-3">
          <p className="text-xs font-semibold text-muted-foreground">
            Your note · {entry.anonymous ? `signed as Fan from ${countryLabel(profile.country)}` : `signed as ${profile.name.split(' ')[0]}`}
          </p>
          {hasNote(entry) ? (
            <NoteBody note={entry.note} photo={entry.photo} className="mt-1.5" />
          ) : (
            <p className="mt-0.5 text-sm text-muted-foreground">You left it without a note.</p>
          )}
        </div>
        {entry.recap ? (
          <Button size="lg" className="mt-4 w-full" onClick={() => navigate(`/batons/recap?entry=${entry.id}`)}>
            <Play data-icon="inline-start" />
            Replay its day
          </Button>
        ) : (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            See where it went next in tonight’s recap at {formatTime(BATON_CONFIG.recapTime)}.
          </p>
        )}
      </div>
    </div>
  )
}
