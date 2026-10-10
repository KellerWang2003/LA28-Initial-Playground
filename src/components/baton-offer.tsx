import { useEffect, useState } from 'react'
import { BatonArt } from '@/components/baton-art'
import { openBatonCard, useBatons, useDroppedToday, usePassed } from '@/lib/batons'
import { cn } from '@/lib/utils'
import { themeById } from '@/data/batons'

// After a pin is stamped at a spot where a baton rests: a slide-up offer that
// opens the baton card. "Not now" leaves the pin flow as it was.
export function BatonOffer({ place }: { place: string }) {
  const batons = useBatons()
  const passed = usePassed()
  const droppedToday = useDroppedToday()
  const [shown, setShown] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const baton = batons.find((b) => b.state === 'resting' && b.spot === place && !passed.includes(b.id) && !droppedToday.includes(b.id))

  // Let the stamp land first
  useEffect(() => {
    const timer = window.setTimeout(() => setShown(true), 900)
    return () => window.clearTimeout(timer)
  }, [])

  if (!baton || dismissed) return null
  const theme = themeById(baton.theme)

  return (
    <div
      role="dialog"
      aria-label={`${theme.name} here`}
      className={cn(
        'fixed inset-x-3 bottom-[max(env(safe-area-inset-bottom),12px)] z-40 mx-auto max-w-sm rounded-3xl bg-foreground p-4 text-background shadow-2xl transition-transform duration-500 ease-out',
        shown ? 'translate-y-0' : 'translate-y-[calc(100%+2rem)]',
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-background">
          <BatonArt theme={baton.theme} className="size-16" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-wide text-background/70 uppercase">Rare find</p>
          <p className="font-heading leading-tight font-semibold">A {theme.name.toLowerCase()} is resting here</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="h-11 flex-1 rounded-full border border-background/30 text-sm font-semibold active:bg-background/10"
        >
          Not now
        </button>
        <button
          type="button"
          onClick={() => {
            setDismissed(true)
            openBatonCard(baton.id)
          }}
          className="h-11 flex-1 rounded-full bg-background text-sm font-semibold text-foreground active:scale-[0.98]"
        >
          See baton
        </button>
      </div>
    </div>
  )
}
