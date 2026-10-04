import { CalendarDays, Check, Clock, Lock, MapPin, Radio, Store, Tv, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pinCountdownTarget, type Pin, type PinStatus, type Shape } from '@/data/la28'
import { formatCountdown, useRemaining } from '@/lib/clock'
import { ShapeSticker } from '@/components/shape-art'
import type { ItemKind } from '@/data/map-layers'

type IconProps = { className?: string; strokeWidth?: number }

// Icon for non-pin map items (pins use PinShape)
export function KindIcon({ kind, ...props }: IconProps & { kind: ItemKind }) {
  switch (kind) {
    case 'event':
      return <CalendarDays {...props} />
    case 'game':
      return <Radio {...props} />
    case 'watch':
      return <Tv {...props} />
    case 'shop':
      return <Store {...props} />
    case 'person':
      return <User {...props} />
    case 'pin':
      return <MapPin {...props} />
  }
}

// Status shows on the pin's outline: gray = locked, green = open, orange = expiring soon
const statusColor: Record<PinStatus, string> = {
  locked: 'text-muted-foreground',
  open: 'text-emerald-600',
  expiring: 'text-amber-500',
}

// A collectible pin, die-cut in the shape of its subject (a sport, a landmark,
// a shop). The color shows the status. Size it with a square box.
export function PinShape({
  shape,
  status,
  collected,
  className,
}: {
  shape: Shape
  status: PinStatus
  collected?: boolean
  className?: string
}) {
  return (
    <span className={cn('relative inline-block shrink-0', collected ? 'text-foreground/50' : statusColor[status], className)}>
      <ShapeSticker shape={shape} className="relative block size-full" />
    </span>
  )
}

// Pin status as text: a ticking countdown for locked and expiring pins.
// `verbose` spells it out ("Unlocks in 19:42") instead of the map form ("19:42").
export function PinStatusText({ pin, verbose }: { pin: Pin; verbose?: boolean }) {
  const target = pinCountdownTarget(pin)
  if (!target) return <>{verbose ? pin.label : pin.short}</>
  return <Countdown pin={pin} target={target} verbose={verbose} />
}

function Countdown({ pin, target, verbose }: { pin: Pin; target: string; verbose?: boolean }) {
  const left = useRemaining(target)
  const time = formatCountdown(left)
  if (pin.status === 'locked') return <>{left === 0 ? 'Open now' : verbose ? `Unlocks in ${time}` : time}</>
  return <>{left === 0 ? 'Ended' : verbose ? `Ends in ${time}` : `${time} left`}</>
}

// Compact status label for the map, outlined in the status color
export function PinStatusChip({ pin, collected, verbose }: { pin: Pin; collected?: boolean; verbose?: boolean }) {
  const status = pin.status
  return (
    <span
      className={cn(
        'flex items-center gap-1 rounded-full border-2 border-current bg-background px-1.5 py-0.5 text-[11px] leading-none font-semibold whitespace-nowrap tabular-nums shadow',
        collected ? 'text-foreground/50' : statusColor[status],
      )}
    >
      {collected ? <Check className="size-3" /> : status === 'locked' ? <Lock className="size-3" /> : status === 'expiring' ? <Clock className="size-3" /> : null}
      <span className="text-foreground">{collected ? 'Collected' : <PinStatusText pin={pin} verbose={verbose} />}</span>
    </span>
  )
}
