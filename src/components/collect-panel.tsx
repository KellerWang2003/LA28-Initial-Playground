import { useEffect, useState } from 'react'
import { Camera, Check, ChevronUp, Flame, Lock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PinStatusText } from '@/components/pin-art'
import { BonusList } from '@/components/bonus-list'
import { useBonusMarks } from '@/lib/bonuses'
import { usePinLocked } from '@/lib/clock'
import { useDebug } from '@/lib/debug'
import { cn } from '@/lib/utils'
import { COLLECT_RADIUS_M, type Pin } from '@/data/la28'
import { bonusesFor } from '@/data/bonuses'
import { PIN_VALUE } from '@/data/passport'

// Floating collect panel on the pin page, like a mini music player. Collapsed,
// it shows the photo to take, how many bonuses there are and "I'm here".
// Expanded, it splits into Collect (required) and Bonus (optional).
// Position the parent relatively; the panel and its scrim are absolute.
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
  const locked = usePinLocked(pin)
  const { inRadius } = useDebug()
  const marks = useBonusMarks()
  const bonuses = bonusesFor(pin.id)
  const doneCount = bonuses.filter((b) => marks[b.id]).length

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Collected with bonuses left: the button opens them instead
  const bonusAction = collected && bonuses.length > 0
  const action = (className?: string) =>
    bonusAction ? (
      <Button size="lg" onClick={() => setOpen(true)} className={cn('shrink-0', className)}>
        <Sparkles data-icon="inline-start" />
        Bonus
      </Button>
    ) : (
      <Button size="lg" disabled={collected || locked || !inRadius} onClick={onCollect} className={cn('shrink-0 tabular-nums', className)}>
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
        ) : !inRadius ? (
          'Not here yet'
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
        {/* Summary: the photo, the bonuses, status and reward. Doubles as the header when expanded. */}
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
                <li className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-medium">
                  {collected ? <Check className="size-3.5" /> : <Camera className="size-3.5" />}
                  Photo
                </li>
                {bonuses.length > 0 && (
                  <li className="flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium tabular-nums">
                    <Sparkles className="size-3.5" />
                    {collected ? `${doneCount}/${bonuses.length} bonus` : `+${bonuses.length} bonus`}
                  </li>
                )}
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

        {/* Details: Collect, then Bonus, then the action full width */}
        <div
          id="collect-steps"
          inert={!open}
          className={cn('grid transition-[grid-template-rows] duration-300 ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="no-scrollbar max-h-[65dvh] overflow-y-auto border-t px-4 pt-4 pb-3">
              <h2 className="font-heading font-semibold">Collect</h2>
              <div className="mt-2 flex items-start gap-3 rounded-2xl border p-3">
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full',
                    collected ? 'bg-foreground text-background' : 'border',
                  )}
                >
                  {collected ? <Check className="size-4" /> : <Camera className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Take any photo here</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {collected
                      ? 'Collected. It’s in your Passport.'
                      : `Be within about ${COLLECT_RADIUS_M} m of ${placeName}, then snap anything. That collects the pin.`}
                  </p>
                </div>
                <p className={cn('flex shrink-0 items-center gap-0.5 text-sm font-semibold tabular-nums', collected && 'text-muted-foreground')}>
                  <Flame className="size-3.5 fill-current" />+{PIN_VALUE[pin.rarity]}
                </p>
              </div>

              {bonuses.length > 0 && (
                <>
                  <div className="mt-5 flex items-center gap-1.5">
                    <h2 className="font-heading font-semibold">Bonus</h2>
                    <Badge variant="outline">Optional</Badge>
                    {collected && (
                      <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                        {doneCount} of {bonuses.length} done
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 mb-2 text-sm text-muted-foreground">Extra Torches and a mark on your stamp.</p>
                  <BonusList bonuses={bonuses} />
                </>
              )}

              {!collected && action('mt-4 w-full')}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
