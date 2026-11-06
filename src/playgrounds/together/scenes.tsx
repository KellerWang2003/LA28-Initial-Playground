import { useEffect, useState, type CSSProperties } from 'react'
import { ChevronLeft, Globe, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShapeSticker } from '@/components/shape-art'
import { SEED_COLLECTED } from '@/lib/collected'
import { cn } from '@/lib/utils'
import { placeById, type Pin } from '@/data/la28'
import { CATEGORIES, pinsIn } from '@/data/passport'
import { CoStampMemory } from './co-stamp-replay'
import { PASSPORT_TARGET } from './pin-flight'
import { buzz, seenFresh, useCoStamps, useFresh, useLanded, type CoStamp } from './state'

// ---- The map: a wireframe stand-in with the Passport button the pin flies into ----

export function MapScene({ onBack, onPassport }: { onBack: () => void; onPassport: () => void }) {
  const fresh = useFresh()
  const landed = useLanded()
  const attractions = pinsIn(CATEGORIES[0].kinds).slice(0, 9)
  return (
    <div className="relative h-dvh overflow-hidden bg-muted">
      {/* Streets */}
      <div aria-hidden className="absolute inset-0 [background-image:linear-gradient(var(--color-background)_2px,transparent_2px),linear-gradient(90deg,var(--color-background)_2px,transparent_2px)] [background-size:72px_72px] opacity-80" />
      {attractions.map((p, i) => (
        // Scattered, the same way every time
        <span key={p.id} className="absolute" style={{ left: `${12 + ((i * 37) % 74)}%`, top: `${14 + ((i * 53) % 62)}%` }}>
          <ShapeSticker shape={p.shape} className="size-9 text-muted-foreground" />
        </span>
      ))}
      <Button variant="outline" size="icon-lg" aria-label="Back" onClick={onBack} className="absolute top-[calc(env(safe-area-inset-top)+12px)] left-4 rounded-full bg-background">
        <ChevronLeft className="size-5" />
      </Button>
      <div className="absolute right-4 bottom-[max(env(safe-area-inset-bottom),24px)]">
        <PassportButton landed={landed} count={fresh.length} onClick={onPassport} />
      </div>
    </div>
  )
}

// The app's closed-booklet Passport button, copied here so the app's own stays untouched.
// It catches the pin with a bounce and keeps a count until the new stamp is seen.
function PassportButton({ landed, count, onClick }: { landed: number; count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={count ? `Passport, ${count} new` : 'Passport'}
      {...{ [PASSPORT_TARGET]: '' }}
      onClick={onClick}
      className="relative block h-24 w-[68px] transition-transform active:scale-95"
    >
      <span key={landed} className={cn('absolute inset-0', landed > 0 && 'animate-passport-catch')}>
        <span className="absolute inset-0 translate-x-[3px] translate-y-[3px] rounded-r-lg rounded-l-sm border bg-muted shadow-lg" />
        <span className="absolute inset-0 overflow-hidden rounded-r-lg rounded-l-sm border bg-background shadow-md">
          <span className="absolute inset-y-0 left-0 w-1.5 border-r bg-muted" />
          <span className="absolute inset-y-1.5 right-1.5 left-3 rounded-[3px] border border-foreground/25" />
          <span className="absolute inset-y-0 right-0 left-1.5 flex flex-col items-center justify-between py-3.5 text-foreground">
            <span className="text-[8px] leading-none font-bold tracking-[0.18em]">LA28</span>
            <Globe className="size-6" strokeWidth={1.25} />
            <span className="text-[7px] leading-none font-bold tracking-[0.16em]">PASSPORT</span>
          </span>
        </span>
      </span>
      {count > 0 && landed > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex size-6 animate-pin-pop items-center justify-center rounded-full border-2 border-background bg-foreground text-[11px] font-semibold text-background tabular-nums">
          {count}
        </span>
      )}
    </button>
  )
}

// ---- The Passport: one page of pins, where the new stamp inks in ----

export function PassportScene({ onBack }: { onBack: () => void }) {
  const stamps = useCoStamps()
  const fresh = useFresh()
  const [open, setOpen] = useState<Pin | null>(null)
  const category = CATEGORIES[0]
  const all = pinsIn(category.kinds)
  const have = (id: string) => SEED_COLLECTED.includes(id) || id in stamps
  // Collected first, like the app's book
  const ordered = [...all.filter((p) => have(p.id)), ...all.filter((p) => !have(p.id))].slice(0, 12)

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={onBack}>
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="font-heading text-lg font-semibold">Passport</h1>
      </header>
      <div className="px-4 pt-2">
        <div className="rounded-2xl border bg-background p-4 shadow-md">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-heading font-semibold">{category.title}</h2>
            <span className="text-sm text-muted-foreground tabular-nums">
              {all.filter((p) => have(p.id)).length}/{all.length}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-x-2 gap-y-3">
            {ordered.map((p) => (
              <PinTile
                key={p.id}
                pin={p}
                have={have(p.id)}
                coStamp={stamps[p.id]}
                fresh={fresh.includes(p.id)}
                onOpen={() => stamps[p.id] && setOpen(p)}
              />
            ))}
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">Tiles with a flag were collected together. Tap one.</p>
      </div>
      {open && stamps[open.id] && <CoStampSheet pin={open} stamp={stamps[open.id]} onClose={() => setOpen(null)} />}
    </div>
  )
}

function PinTile({ pin, have, coStamp, fresh, onOpen }: { pin: Pin; have: boolean; coStamp?: CoStamp; fresh: boolean; onOpen: () => void }) {
  // A little crooked, a different way each time
  const [tilt] = useState(() => Math.round((Math.random() * 2 - 1) * 7))
  const art = <ShapeSticker shape={pin.shape} className={cn('size-3/5', have ? 'text-foreground' : 'text-muted-foreground/30 drop-shadow-none')} />
  return (
    <button type="button" onClick={onOpen} className="flex flex-col items-center gap-1 text-center transition-transform active:scale-95">
      <span className={cn('relative flex aspect-square w-full items-center justify-center rounded-2xl', have && !fresh ? 'bg-muted' : 'border border-dashed')}>
        {fresh && have ? (
          <>
            {/* The empty ink outline, then the stamp inks in over it */}
            <ShapeSticker shape={pin.shape} className="absolute size-3/5 text-muted-foreground/30 drop-shadow-none" />
            <span
              style={{ '--tilt': `${tilt}deg` } as CSSProperties}
              onAnimationEnd={() => {
                buzz(20)
                seenFresh(pin.id)
              }}
              className="absolute inset-0 flex animate-ink-in items-center justify-center rounded-2xl bg-muted [animation-delay:0.6s]"
            >
              {art}
            </span>
          </>
        ) : (
          art
        )}
        {have && coStamp && (
          <span aria-label={`Collected with ${coStamp.name}`} className="absolute -bottom-1 -left-1 flex size-6 items-center justify-center rounded-full bg-background text-sm shadow-sm">
            {coStamp.flag}
          </span>
        )}
      </span>
      <span className={cn('line-clamp-2 text-[11px] leading-tight', have ? 'font-medium' : 'text-muted-foreground/60')}>{pin.name.replace(/ Pin$/, '')}</span>
    </button>
  )
}

function CoStampSheet({ pin, stamp, onClose }: { pin: Pin; stamp: CoStamp; onClose: () => void }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  return (
    <div role="dialog" aria-modal aria-label={pin.name} className="fixed inset-0 z-40">
      <div aria-hidden onClick={onClose} className={cn('absolute inset-0 bg-black/30 transition-opacity duration-300', shown ? 'opacity-100' : 'opacity-0')} />
      <div className={cn('absolute inset-x-0 bottom-0 rounded-t-3xl border-t bg-background px-4 pt-4 pb-[max(env(safe-area-inset-bottom),24px)] shadow-xl transition-transform duration-300 ease-out', shown ? 'translate-y-0' : 'translate-y-full')}>
        <header className="mb-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-heading font-semibold">{pin.name}</h2>
            <p className="truncate text-sm text-muted-foreground">{placeById(pin.place).name}</p>
          </div>
          <Button variant="ghost" size="icon-lg" aria-label="Close" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </header>
        <h3 className="mb-2 text-sm font-semibold">Collected together</h3>
        <CoStampMemory pin={pin} stamp={stamp} />
      </div>
    </div>
  )
}
