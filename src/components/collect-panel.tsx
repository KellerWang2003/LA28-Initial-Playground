import { useEffect, useState } from 'react'
import { Camera, Check, ChevronUp, Flame, Lock, MapPin, QrCode, Search, Ticket, Timer, Users, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PinStatusText } from '@/components/pin-art'
import { cn } from '@/lib/utils'
import { collectTaskDetail, collectTaskLabel, collectTasks, type CollectTaskKind, type Pin } from '@/data/la28'
import { GROUP_BONUS, GROUP_SIZE, PIN_VALUE } from '@/data/passport'

const taskIcon: Record<CollectTaskKind, LucideIcon> = {
  visit: MapPin,
  photo: Camera,
  find: Search,
  scan: QrCode,
  ticket: Ticket,
  stay: Timer,
}

// Floating collect panel on the pin page, like a mini music player. Collapsed,
// it shows what collecting takes and "I'm here"; tapping it expands the steps
// and the optional group bonus. Keeps the action on its own layer above the
// place info. Position the parent relatively; the panel and its scrim are absolute.
export function CollectPanel({
  pin,
  placeName,
  collected,
  onCollect,
}: {
  pin: Pin
  placeName: string
  collected: boolean
  onCollect: () => void
}) {
  const [open, setOpen] = useState(false)
  const tasks = collectTasks(pin)
  const locked = pin.status === 'locked'

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const action = (className?: string) => (
    <Button size="lg" disabled={collected || locked} onClick={onCollect} className={cn('shrink-0 tabular-nums', className)}>
      {collected ? (
        <>
          <Check data-icon="inline-start" />
          Collected
        </>
      ) : locked ? (
        <>
          <Lock data-icon="inline-start" />
          <PinStatusText pin={pin} />
        </>
      ) : (
        'I’m here'
      )}
    </Button>
  )

  return (
    <>
      {/* Dims the place info while expanded; tap to collapse */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={cn('absolute inset-0 z-20 bg-black/30 transition-opacity duration-300', open ? 'opacity-100' : 'pointer-events-none opacity-0')}
      />

      <div className="absolute inset-x-3 bottom-[max(env(safe-area-inset-bottom),12px)] z-30 overflow-hidden rounded-3xl border bg-background shadow-xl">
        {/* Summary: the tasks, status and reward. Doubles as the header when expanded. */}
        <div className="flex items-center gap-2 p-3">
          <button
            type="button"
            aria-expanded={open}
            aria-controls="collect-steps"
            aria-label={open ? 'Hide how to collect' : 'Show how to collect'}
            onClick={() => setOpen((o) => !o)}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl text-left"
          >
            <div className="min-w-0 flex-1 pl-1">
              <ul className="flex items-center gap-1 overflow-hidden">
                {tasks.map((t) => {
                  const Icon = taskIcon[t.kind]
                  return (
                    <li key={t.kind} className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-medium">
                      <Icon className="size-3.5" />
                      {collectTaskLabel[t.kind].short}
                    </li>
                  )
                })}
              </ul>
              <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                {collected ? 'In your Passport' : <PinStatusText pin={pin} verbose />}
                <span aria-hidden>·</span>
                <Flame className="size-3 fill-current" />+{PIN_VALUE[pin.rarity]}
              </p>
            </div>
            <ChevronUp className={cn('size-5 shrink-0 text-muted-foreground transition-transform duration-300', open && 'rotate-180')} />
          </button>
          {!open && action()}
        </div>

        {/* Details: steps, the group extra, then the action full width */}
        <div
          id="collect-steps"
          inert={!open}
          className={cn('grid transition-[grid-template-rows] duration-300 ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="no-scrollbar max-h-[60dvh] overflow-y-auto border-t px-4 pt-4 pb-3">
              <h2 className="font-heading font-semibold">How to collect it</h2>
              <ol className="mt-3 space-y-3">
                {tasks.map((t, i) => {
                  const Icon = taskIcon[t.kind]
                  return (
                    <li key={t.kind} className="flex gap-3">
                      <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full border">
                        <Icon className="size-4" />
                        <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                          {i + 1}
                        </span>
                      </span>
                      <div>
                        <p className="text-sm font-medium">{collectTaskLabel[t.kind].title}</p>
                        <p className="text-sm text-muted-foreground">
                          {(t.detail ?? collectTaskDetail[t.kind]).replace('{place}', placeName)}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>

              <div className="mt-4 flex gap-3 rounded-2xl bg-muted p-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background">
                  <Users className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium">Collect with others</p>
                    <Badge variant="outline" className="bg-background">
                      Optional
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Capture within the same minute as {GROUP_SIZE - 1} or more people here, friends or other fans. No chatting
                    or profiles: you only see how many joined.
                  </p>
                </div>
                <p className="flex shrink-0 items-start gap-0.5 text-sm font-semibold tabular-nums">
                  <Flame className="mt-0.5 size-3.5 fill-current" />+{GROUP_BONUS}
                </p>
              </div>

              {action('mt-4 w-full')}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
