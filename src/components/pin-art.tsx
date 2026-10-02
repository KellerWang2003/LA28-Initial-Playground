import { CalendarDays, Check, Clock, Lock, MapPin, Radio, Store, Tv, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PinStatus, Shape } from '@/data/la28'
import { ShapeSticker } from '@/components/shape-art'
import type { ItemKind } from '@/data/map-layers'

type IconProps = { className?: string; strokeWidth?: number }

// Icon for non-pin map items (pins use PinShape)
export function KindIcon({ kind, ...props }: IconProps & { kind: ItemKind }) {
  switch (kind) {
    case 'event':
      return <CalendarDays {...props} />
    case 'live':
      return <Radio {...props} />
    case 'watch':
      return <Tv {...props} />
    case 'shop':
      return <Store {...props} />
    case 'crew':
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

// Compact status label for the map, outlined in the status color
export function PinStatusChip({ status, label, collected }: { status: PinStatus; label: string; collected?: boolean }) {
  return (
    <span
      className={cn(
        'flex items-center gap-1 rounded-full border-2 border-current bg-background px-1.5 py-0.5 text-[11px] leading-none font-semibold whitespace-nowrap shadow',
        collected ? 'text-foreground/50' : statusColor[status],
      )}
    >
      {collected ? <Check className="size-3" /> : status === 'locked' ? <Lock className="size-3" /> : status === 'expiring' ? <Clock className="size-3" /> : null}
      <span className="text-foreground">{collected ? 'Collected' : label}</span>
    </span>
  )
}
