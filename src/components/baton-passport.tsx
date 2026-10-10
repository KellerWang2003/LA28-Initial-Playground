import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Play, X } from 'lucide-react'
import { BatonArt } from '@/components/baton-art'
import { BatonStamp } from '@/components/baton-drop'
import { Button } from '@/components/ui/button'
import { countryLabel, useBatonLog, type LogEntry } from '@/lib/batons'
import { useProfile } from '@/lib/profile'
import { cn } from '@/lib/utils'
import { BATON_CONFIG, themeById } from '@/data/batons'
import { formatTime, placeById } from '@/data/la28'

const shortDate = (dayKey: string) =>
  new Date(`${dayKey}T12:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

// Passport > Batons: a stamp for every baton the fan carried to its next spot
export function PassportBatons() {
  const log = useBatonLog()
  const [params] = useSearchParams()
  const ref = useRef<HTMLElement>(null)
  const [open, setOpen] = useState<LogEntry | null>(null)
  const entries = [...log].sort((a, b) => b.at - a.at)

  // Arriving from a drop: bring the stamps into view
  const jump = params.get('section') === 'batons'
  useEffect(() => {
    if (jump) ref.current?.scrollIntoView({ block: 'start' })
  }, [jump])

  return (
    <section ref={ref} id="batons" className="scroll-mt-2">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-heading font-semibold">Batons</h2>
        <span className="text-sm text-muted-foreground tabular-nums">{entries.length} carried</span>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Batons turn up by chance at landmarks. Carry one to the next spot to earn its stamp.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {entries.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setOpen(e)}
              className="flex flex-col rounded-2xl border p-3 text-left transition-transform active:scale-[0.98]"
            >
              <BatonArt theme={e.theme} className="mx-auto size-16" />
              <span className="mt-1 truncate text-sm font-semibold">{themeById(e.theme).name}</span>
              <span className="text-[11px] text-muted-foreground">{shortDate(e.dayKey)}</span>
              <span className="mt-1 line-clamp-2 text-xs">
                {placeById(e.from).name} → {placeById(e.to).name}
              </span>
              {e.note && <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">“{e.note}”</span>}
            </button>
          ))}
        </div>
      )}
      {open && <EntrySheet entry={log.find((e) => e.id === open.id) ?? open} onClose={() => setOpen(null)} />}
    </section>
  )
}

function EntrySheet({ entry, onClose }: { entry: LogEntry; onClose: () => void }) {
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
          <p className={cn('mt-0.5 text-sm', !entry.note && 'text-muted-foreground')}>{entry.note ? `“${entry.note}”` : 'You left it without a note.'}</p>
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
