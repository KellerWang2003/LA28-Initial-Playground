import { useEffect, useState } from 'react'
import { debugMoments } from '@/features/crowdplay/schedule'
import { useNavigate } from 'react-router'
import { Bug, LayoutList, Palette, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BatonDebugControls } from '@/components/baton-debug'
import { WhereControls, selectClass } from '@/components/debug-where'
import { localMinute, setClockSpeed, shiftClock, useClock } from '@/lib/clock'
import { resetDemo } from '@/lib/bonuses'
import { CLOCK_STOPS, setDebug, useDebug, type VenueGame } from '@/lib/debug'
import { cn } from '@/lib/utils'
import { NOW } from '@/data/la28'

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
            <DebugSection title="Room">
              <RoomPreviews onGo={() => setOpen(false)} />
            </DebugSection>
            <DebugSection title="Baton">
              <BatonDebugControls />
            </DebugSection>
            <div className="mt-5 grid grid-cols-2 gap-2">
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
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  navigate('/dev/design')
                }}
              >
                <Palette data-icon="inline-start" />
                Design system
              </Button>
              <Button variant="outline" className="col-span-2" onClick={resetDemo}>
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

// Jump the clock to a moment of the swim final's room and open the matching screen.
// CrowdPlay moments come from its schedule (features/crowdplay/schedule.ts). Times are on demo day.
const SWIM_ROOM = '/sports/games/s_swim_0720'
const ROOM_PREVIEWS: { label: string; time?: string; to: string }[] = [
  ...debugMoments('s_swim_0720').map((m) => ({ label: `CrowdPlay: ${m.label}`, time: m.time, to: `${SWIM_ROOM}/play` })),
  { label: 'Race in the water', time: '2028-07-20T19:28:20', to: SWIM_ROOM },
  { label: 'Race result', time: '2028-07-20T19:31', to: SWIM_ROOM },
  { label: 'Recap preview', time: '2028-07-20T19:50', to: `${SWIM_ROOM}/recap` },
  { label: 'Finished game', to: '/sports/games/s_fb_w_0720' },
]

function RoomPreviews({ onGo }: { onGo: () => void }) {
  const navigate = useNavigate()
  return (
    <div>
      <div className="grid grid-cols-2 gap-1.5">
        {ROOM_PREVIEWS.map((p) => (
          <Button
            key={p.label}
            size="sm"
            variant="outline"
            className="px-1"
            onClick={() => {
              if (p.time) setDebug({ time: p.time })
              navigate(p.to)
              onGo()
            }}
          >
            {p.label}
          </Button>
        ))}
      </div>
      <p className="mt-1.5 px-0.5 text-[11px] text-muted-foreground">
        Answers reset with Reset demo.
      </p>
    </div>
  )
}

const venueOptions: { value: VenueGame; label: string }[] = [
  { value: 'schedule', label: 'Schedule' },
  { value: 'before', label: 'Before' },
  { value: 'live', label: 'Live' },
  { value: 'ended', label: 'Ended' },
]

const MIN = 60_000
const nudges = [
  { label: '−1 h', ms: -60 * MIN },
  { label: '+15 min', ms: 15 * MIN },
  { label: '+1 h', ms: 60 * MIN },
  { label: '+1 day', ms: 24 * 60 * MIN },
]

// The universal switches (where, when) and the pin ones; shared by the panel and the flow gallery
export function DebugControls() {
  const debug = useDebug()

  return (
    <div>
      <DebugSection title="Where">
        <WhereControls />
      </DebugSection>
      <DebugSection title="When">
        <WhenControls />
      </DebugSection>
      <DebugSection title="Pins">
        <div className="space-y-3">
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
      </DebugSection>
    </div>
  )
}

// When it is: any date and time, a list of moments worth testing, nudges and speed
function WhenControls() {
  const { speed } = useDebug()
  const now = useClock()
  const label = new Date(now).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', second: '2-digit' })

  return (
    <div className="space-y-3">
      <Control label="Clock" aside={label}>
        <div className="flex gap-1.5">
          <input
            type="datetime-local"
            aria-label="Date and time"
            className={cn(selectClass, 'tabular-nums')}
            value={localMinute(now)}
            onChange={(e) => e.target.value && setDebug({ time: e.target.value })}
          />
          <select
            aria-label="Jump to a moment"
            className={cn(selectClass, 'w-28 shrink-0')}
            value=""
            onChange={(e) => e.target.value && setDebug({ time: e.target.value === NOW ? null : e.target.value })}
          >
            <option value="" disabled>
              Jump to…
            </option>
            {CLOCK_STOPS.map((s) => (
              <option key={s.label} value={s.time ?? NOW}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </Control>
      <div className="grid grid-cols-4 gap-1.5">
        {nudges.map((n) => (
          <Button key={n.label} size="sm" variant="outline" className="px-1 tabular-nums" onClick={() => shiftClock(n.ms)}>
            {n.label}
          </Button>
        ))}
      </div>
      <Control label="Clock speed">
        <Segmented value={speed} options={[1, 10, 60].map((n) => ({ value: n, label: `${n}×` }))} onChange={setClockSpeed} />
      </Control>
    </div>
  )
}

function DebugSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h3 className="mb-2 font-heading text-sm font-semibold">{title}</h3>
      {children}
    </section>
  )
}

export function Control({ label, aside, children }: { label: string; aside?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 px-0.5">
        <p className="shrink-0 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        {aside && <p className="truncate text-[11px] text-muted-foreground tabular-nums">{aside}</p>}
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
