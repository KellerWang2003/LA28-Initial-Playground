import { ShapeIcon } from '@/components/shape-art'
import { cn } from '@/lib/utils'
import { themeById } from '@/data/batons'
import type { Shape } from '@/data/la28'

// Batons read as a different kind of object from pins: an upright, tilted
// capsule in solid black with the theme inside, where pins are flat die-cut
// stickers. Black and white until the visual design lands.

// Big artwork for the card, the drop moment and Passport
export function BatonArt({ theme, className }: { theme: string; className?: string }) {
  const t = themeById(theme)
  return (
    <span aria-hidden className={cn('relative flex aspect-square items-center justify-center', className)}>
      <BatonBody shape={t.shape} className="h-[88%] w-[34%]" />
    </span>
  )
}

// The capsule itself; size it with className (height about 2.5x width)
export function BatonBody({ shape, className }: { shape: Shape; className?: string }) {
  return (
    <span
      className={cn(
        'relative flex -rotate-[24deg] items-center justify-center overflow-hidden rounded-full bg-foreground text-background shadow-lg ring-2 ring-background',
        className,
      )}
    >
      {/* Grip bands near each end */}
      <span className="absolute inset-x-0 top-[16%] h-[5%] bg-background/30" />
      <span className="absolute inset-x-0 bottom-[16%] h-[5%] bg-background/30" />
      <ShapeIcon shape={shape} className="h-auto w-[62%]" strokeWidth={2.25} />
    </span>
  )
}

// Small glyph for banners and notifications
export function BatonGlyph({ theme, className }: { theme?: string; className?: string }) {
  return (
    <span aria-hidden className={cn('flex size-10 shrink-0 items-center justify-center rounded-full bg-muted', className)}>
      <BatonBody shape={theme ? themeById(theme).shape : 'star'} className="h-7 w-3" />
    </span>
  )
}

// On the Explore map: only resting batons get one
export function BatonMarker({ theme, selected }: { theme: string; selected: boolean }) {
  const t = themeById(theme)
  return (
    <div className="relative flex cursor-pointer flex-col items-center">
      <div data-marker-body className={cn('relative flex h-14 w-10 items-center justify-center transition-transform', selected && 'scale-125')}>
        <span className="absolute size-12 animate-baton-pulse rounded-full border-2 border-foreground" />
        <BatonBody shape={t.shape} className="h-12 w-5" />
      </div>
      <span
        data-marker-label
        className="absolute top-full mt-0.5 w-max max-w-28 text-center text-[11px] leading-tight font-bold [text-shadow:0_0_3px_var(--background),0_0_3px_var(--background),0_0_3px_var(--background)]"
      >
        {t.name}
      </span>
    </div>
  )
}

// While carrying: the spots where the baton can be dropped
export function DropSpotMarker({ here, label }: { here: boolean; label: string }) {
  return (
    <div className="relative flex cursor-pointer flex-col items-center">
      <span
        data-marker-body
        className={cn(
          'flex items-center justify-center rounded-full border-2 border-foreground',
          here ? 'size-9 bg-foreground' : 'size-6 border-dashed bg-background/80',
        )}
      >
        <span className={cn('rounded-full', here ? 'size-2.5 bg-background' : 'size-1.5 bg-foreground')} />
      </span>
      {here && (
        <span
          data-marker-label
          className="absolute top-full mt-1 w-max max-w-28 text-center text-[11px] leading-tight font-bold [text-shadow:0_0_3px_var(--background),0_0_3px_var(--background),0_0_3px_var(--background)]"
        >
          Drop here · {label}
        </span>
      )}
    </div>
  )
}
