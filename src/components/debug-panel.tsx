import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Bug, LayoutList, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BatonDebugControls } from '@/components/baton-debug'
import { useClock } from '@/lib/clock'
import { resetDemo } from '@/lib/bonuses'
import { CLOCK_STOPS, setDebug, useDebug, type VenueGame } from '@/lib/debug'
import { cn } from '@/lib/utils'

// Prototype only: a small floating button on every screen that opens the debug switches
export function DebugPanel() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        aria-label="Debug"
        onClick={() => setOpen(true)}
        className="fixed top-1/3 left-0 z-50 flex size-9 items-center justify-center rounded-r-full border border-l-0 bg-background/90 text-muted-foreground shadow-md backdrop-blur active:scale-95"
      >
        <Bug className="size-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-label="Debug"
            onClick={(e) => e.stopPropagation()}
            className="no-scrollbar m-3 mb-[max(env(safe-area-inset-bottom),12px)] max-h-[calc(100dvh-24px)] w-full max-w-sm overflow-y-auto overscroll-contain rounded-3xl border bg-background p-4 shadow-xl"
          >
            <div className="mb-3 flex items-center gap-2">
              <h2 className="font-heading font-semibold">Debug</h2>
              <span className="text-xs text-muted-foreground">Prototype only</span>
              <Button variant="ghost" size="icon-sm" aria-label="Close" className="ml-auto" onClick={() => setOpen(false)}>
                <X />
              </Button>
            </div>
            <DebugControls />
            <p className="mt-5 mb-2 font-heading text-sm font-semibold">Baton</p>
            <BatonDebugControls />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  navigate('/dev/flows')
                }}
              >
                <LayoutList data-icon="inline-start" />
                Flow gallery
              </Button>
              <Button variant="outline" onClick={resetDemo}>
                <RotateCcw data-icon="inline-start" />
                Reset demo
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const venueOptions: { value: VenueGame; label: string }[] = [
  { value: 'schedule', label: 'Schedule' },
  { value: 'before', label: 'Before' },
  { value: 'live', label: 'Live' },
  { value: 'ended', label: 'Ended' },
]

// The switches, shared by the panel and the flow gallery
export function DebugControls() {
  const debug = useDebug()
  const now = useClock()
  const clockLabel = new Date(now).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })

  return (
    <div className="space-y-3">
      <Control label="Location">
        <Segmented
          value={debug.inRadius}
          options={[
            { value: true, label: 'At the pin' },
            { value: false, label: 'Away' },
          ]}
          onChange={(inRadius) => setDebug({ inRadius })}
        />
      </Control>
      <Control label="Clock" aside={clockLabel}>
        <Segmented
          value={debug.time}
          options={CLOCK_STOPS.map((s) => ({ value: s.time, label: s.label }))}
          onChange={(time) => setDebug({ time })}
        />
      </Control>
      <Control label="Venue games">
        <Segmented value={debug.venueGame} options={venueOptions} onChange={(venueGame) => setDebug({ venueGame })} />
      </Control>
      <Control label="Others joining">
        <Segmented
          value={debug.others}
          options={[1, 2, 3].map((n) => ({ value: n, label: String(n) }))}
          onChange={(others) => setDebug({ others })}
        />
      </Control>
    </div>
  )
}

export function Control({ label, aside, children }: { label: string; aside?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between px-0.5">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        {aside && <p className="text-[11px] text-muted-foreground tabular-nums">{aside}</p>}
      </div>
      {children}
    </div>
  )
}

export function Segmented<T>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" className="flex gap-1 rounded-xl bg-muted p-1">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.label}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'min-w-0 flex-1 truncate rounded-lg px-1 py-1.5 text-xs font-medium',
              on ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
