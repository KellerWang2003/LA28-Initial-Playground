import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { X } from 'lucide-react'
import { BatonArt } from '@/components/baton-art'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useFanAt } from '@/lib/location'
import { useProfile } from '@/lib/profile'
import {
  cancelDrop,
  countryLabel,
  dropBaton,
  dropSpotFor,
  finishDrop,
  useBatonLog,
  useCarried,
  useDropped,
  useDropping,
  type LogEntry,
} from '@/lib/batons'
import { cn } from '@/lib/utils'
import { themeById } from '@/data/batons'
import { flag, placeById } from '@/data/la28'

const NOTE_MAX = 140

// Leaving the baton at a spot: an optional note for the next fan, then confirm
export function DropSheet() {
  const dropping = useDropping()
  const carried = useCarried()
  const fan = useFanAt()
  const spot = dropSpotFor(carried, fan)
  if (!dropping || !carried || !spot) return null
  return <Sheet theme={carried.theme} spot={spot} />
}

function Sheet({ theme, spot }: { theme: string; spot: string }) {
  const [note, setNote] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [shown, setShown] = useState(false)
  const profile = useProfile()
  const place = placeById(spot)
  // How the next carriers see you, in today's journey and on the note
  const signatures = [
    { anonymous: false, label: profile.name.split(' ')[0] },
    { anonymous: true, label: `Fan from ${countryLabel(profile.country)}` },
  ]

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div role="dialog" aria-modal aria-label="Drop the baton" className="fixed inset-0 z-50">
      <div aria-hidden onClick={cancelDrop} className={cn('absolute inset-0 bg-black/30 transition-opacity duration-300', shown ? 'opacity-100' : 'opacity-0')} />
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 rounded-t-3xl border-t bg-background px-4 pt-4 pb-[max(env(safe-area-inset-bottom),16px)] shadow-xl transition-transform duration-300 ease-out',
          shown ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <header className="flex items-start gap-3">
          <BatonArt theme={theme} className="-my-2 size-20 shrink-0" />
          <div className="min-w-0 flex-1 pt-1">
            <h2 className="font-heading text-lg leading-tight font-semibold">Leave it at {place.name}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">It rests here for the next fan, with your note.</p>
          </div>
          <Button variant="ghost" size="icon-lg" aria-label="Close" className="-mr-2" onClick={cancelDrop}>
            <X className="size-5" />
          </Button>
        </header>

        <label className="mt-4 block">
          <span className="mb-1.5 flex items-baseline justify-between text-sm font-semibold">
            Note for the next fan
            <span className="text-xs font-normal text-muted-foreground">Optional</span>
          </span>
          <Textarea
            value={note}
            maxLength={NOTE_MAX}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Where it’s been, a tip, a hello…"
            className="min-h-24"
          />
          <span className="mt-1 block text-right text-[11px] text-muted-foreground tabular-nums">
            {note.length}/{NOTE_MAX}
          </span>
        </label>

        <div className="mt-1">
          <p className="mb-1.5 text-sm font-semibold">Show me as</p>
          <div role="radiogroup" aria-label="Show me as" className="grid grid-cols-2 gap-2">
            {signatures.map((sig) => (
              <button
                key={String(sig.anonymous)}
                type="button"
                role="radio"
                aria-checked={anonymous === sig.anonymous}
                onClick={() => setAnonymous(sig.anonymous)}
                className={cn(
                  'flex min-w-0 flex-col rounded-2xl border px-3 py-2 text-left transition-colors',
                  anonymous === sig.anonymous ? 'border-foreground bg-foreground text-background' : 'text-foreground',
                )}
              >
                <span className="text-sm leading-tight font-semibold">
                  {flag(profile.country)} {sig.label}
                </span>
                <span className={cn('mt-0.5 text-[11px]', anonymous === sig.anonymous ? 'text-background/70' : 'text-muted-foreground')}>
                  {sig.anonymous ? 'Stay anonymous' : 'Your first name'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Button size="lg" className="mt-4 w-full" onClick={() => dropBaton(note.trim() || null, anonymous)}>
          Drop baton
        </Button>
      </div>
    </div>
  )
}

// Just dropped: the baton lands, then its stamp for Passport > Batons
export function DropMoment() {
  const id = useDropped()
  const log = useBatonLog()
  const entry = id ? log.find((e) => e.id === id) : undefined
  if (!entry) return null
  return <Moment key={entry.id} entry={entry} />
}

function Moment({ entry }: { entry: LogEntry }) {
  const navigate = useNavigate()
  const [stamped, setStamped] = useState(false)
  const theme = themeById(entry.theme)
  const to = placeById(entry.to)

  useEffect(() => {
    const timer = window.setTimeout(() => setStamped(true), 1300)
    return () => window.clearTimeout(timer)
  }, [])

  function go(path: string) {
    finishDrop()
    navigate(path)
  }

  return (
    <div role="dialog" aria-modal aria-label="Baton dropped" className="fixed inset-0 z-[60] flex flex-col bg-background px-6 pt-[max(env(safe-area-inset-top),24px)] pb-[max(env(safe-area-inset-bottom),20px)]">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        {!stamped ? (
          <>
            <div className="relative flex size-48 items-end justify-center">
              <span className="absolute bottom-2 h-6 w-40 rounded-[50%] border-2 border-dashed border-foreground" />
              <span className="relative mb-2 flex size-40 animate-baton-drop items-center justify-center">
                <BatonArt theme={entry.theme} className="h-40 w-40" />
              </span>
            </div>
            <p className="mt-6 font-heading text-xl font-semibold">{to.name}</p>
            <p className="text-sm text-muted-foreground">Baton dropped</p>
          </>
        ) : (
          <>
            <BatonStamp entry={entry} className="w-64 animate-stamp-in" />
            <h1 className="mt-8 font-heading text-2xl font-semibold">Baton stamp earned</h1>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Your {theme.name.toLowerCase()} is resting at {to.name}. The next fan will find your note there.
            </p>
          </>
        )}
      </div>
      <div className={cn('flex gap-2 transition-opacity duration-300', stamped ? 'opacity-100' : 'pointer-events-none opacity-0')}>
        <Button size="lg" variant="outline" className="flex-1" onClick={() => go(`/explore?baton=${entry.batonId}`)}>
          See it on the map
        </Button>
        <Button size="lg" className="flex-1" onClick={() => go('/passport?section=batons')}>
          Open Passport
        </Button>
      </div>
    </div>
  )
}

// The reward: a stamp with the baton, the leg you carried it and the day
export function BatonStamp({ entry, className }: { entry: LogEntry; className?: string }) {
  const theme = themeById(entry.theme)
  const date = new Date(`${entry.dayKey}T12:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return (
    <div className={cn('-rotate-[4deg] rounded-3xl border-[3px] border-double border-foreground p-4 text-center', className)}>
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase">LA28 · Baton</p>
      <BatonArt theme={entry.theme} className="mx-auto my-1 size-24" />
      <p className="font-heading font-semibold">{theme.name}</p>
      <p className="mt-0.5 text-xs">
        {placeById(entry.from).name} → {placeById(entry.to).name}
      </p>
      <p className="mt-1 text-[10px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">{date}</p>
    </div>
  )
}
