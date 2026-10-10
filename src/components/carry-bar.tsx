import { BatonBody } from '@/components/baton-art'
import { formatElapsed, useClock } from '@/lib/clock'
import { useFanAt } from '@/lib/location'
import { dropSpotFor, openCarrySheet, startDrop, useCarried } from '@/lib/batons'
import { cn } from '@/lib/utils'
import { themeById } from '@/data/batons'
import { placeById } from '@/data/la28'

// Height the bar takes above the tab bar, including its gap, for screens that
// lay things out against the tab bar (the Explore sheet and cards)
export const CARRY_BAR_SPACE = 64

// Carry mode: a black mini bar above the tab bar on every tab, with the time
// left; tapping it opens the baton and its note. At a spot where the baton
// can go, it adds "Drop baton here".
export function CarryBar() {
  const carried = useCarried()
  const fan = useFanAt()
  const now = useClock()
  if (!carried) return null

  const theme = themeById(carried.theme)
  const left = Math.max(0, Math.ceil((carried.expiresAt! - now) / 1000))
  const dropAt = dropSpotFor(carried, fan)
  const urgent = left <= 5 * 60

  return (
    <div className="pointer-events-auto flex h-14 w-full max-w-sm items-center gap-2 rounded-full bg-foreground p-1.5 pl-2 text-background shadow-lg">
      <button
        type="button"
        onClick={openCarrySheet}
        aria-label={`Carrying the ${theme.name}. Open it`}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background/15">
          <BatonBody shape={theme.shape} className="h-8 w-3.5 bg-background text-foreground ring-foreground" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm leading-tight font-semibold">{theme.name}</span>
          <span className="block truncate text-xs text-background/70">
            {dropAt ? `At ${placeById(dropAt).name}` : 'Carry it to another landmark'}
          </span>
        </span>
        <span className={cn('shrink-0 font-heading text-base font-semibold tabular-nums', urgent && 'animate-pulse')}>
          {formatElapsed(left)}
        </span>
      </button>
      {dropAt && (
        <button
          type="button"
          onClick={startDrop}
          className="h-full shrink-0 rounded-full bg-background px-4 text-sm font-semibold text-foreground transition-transform active:scale-95"
        >
          Drop baton here
        </button>
      )}
    </div>
  )
}
