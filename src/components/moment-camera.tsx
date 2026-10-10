import { useState } from 'react'
import { Camera, Clock, Lock } from 'lucide-react'
import { photoSrc } from '@/components/place-photo'
import { formatCountdown, useRemaining } from '@/lib/clock'
import { cn } from '@/lib/utils'
import type { Bonus } from '@/data/bonuses'

// Right moment: the camera while the window is open, with the time left on
// screen. Any photo counts; it marks the stamp with the moment and the time.
// If the window closes first, the shutter locks.
export function MomentCamera({ bonus, onCapture }: { bonus: Bonus; onCapture: () => void }) {
  const window_ = bonus.window!
  const left = useRemaining(window_.closes)
  const early = useRemaining(window_.opens) > 0
  const [flash, setFlash] = useState(false)
  const open = left > 0 && !early

  function capture() {
    setFlash(true)
    setTimeout(onCapture, 220)
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <div className="relative aspect-[3/4] max-h-full w-full max-w-sm overflow-hidden rounded-3xl bg-black">
          <img src={photoSrc(bonus.pin)} alt="" className={cn('absolute inset-0 size-full object-cover', !open && 'opacity-40 grayscale')} />
          <span className="absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold whitespace-nowrap tabular-nums shadow-sm">
            <Clock className="size-3.5" />
            {open ? `${window_.label} · ${formatCountdown(left)} left` : early ? `${window_.label} hasn’t started` : `${window_.label} is over`}
          </span>
          <div className={cn('pointer-events-none absolute inset-0 bg-white transition-opacity duration-200', flash ? 'opacity-90' : 'opacity-0')} />
        </div>
        <p className="mt-3 max-w-xs text-center text-sm text-muted-foreground">
          {open
            ? `Any photo now marks your stamp with the ${window_.label.toLowerCase()}.`
            : early
              ? 'Come back when the window opens.'
              : 'The window closed before the photo. The pin is still yours.'}
        </p>
      </div>
      <div className="flex shrink-0 justify-center pt-3">
        <button
          type="button"
          disabled={!open || flash}
          aria-label={open ? 'Capture' : 'Capture locked, outside the window'}
          onClick={capture}
          className="flex size-18 items-center justify-center rounded-full border-4 bg-background shadow-md transition-opacity active:scale-95 disabled:opacity-40"
        >
          {open ? <Camera className="size-7" /> : <Lock className="size-6" />}
        </button>
      </div>
    </>
  )
}
