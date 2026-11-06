import { useId, type CSSProperties } from 'react'
import { ShapeIcon, ShapeSticker } from '@/components/shape-art'
import { cn } from '@/lib/utils'
import type { Shape } from '@/data/la28'

// The stamp two people get for collecting a pin together: one round ink stamp with the pin's
// shape, both flags, and the day. It lands a little crooked (`tilt`, in degrees).
// `thud` plays it slamming down. Size it with a square box.
export function CoStampArt({
  shape,
  flags,
  date,
  tilt = 0,
  thud,
  className,
}: {
  shape: Shape
  // Yours first, then theirs
  flags: [string, string]
  // Short, upper case reads best ("20 JUL 2028")
  date: string
  tilt?: number
  thud?: boolean
  className?: string
}) {
  const id = useId()
  return (
    <span
      style={{ '--tilt': `${tilt}deg`, rotate: thud ? undefined : `${tilt}deg` } as CSSProperties}
      className={cn('relative inline-block shrink-0 text-foreground [container-type:inline-size]', thud && 'animate-co-stamp', className)}
      aria-label={`Collected together ${flags.join(' ')}, ${date}`}
      role="img"
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full opacity-90" aria-hidden>
        <defs>
          <path id={`${id}-top`} d="M 18 50 A 32 32 0 0 1 82 50" />
          <path id={`${id}-bottom`} d="M 14 50 A 36 36 0 0 0 86 50" />
        </defs>
        <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
        <text fontSize="8.5" fontWeight="700" letterSpacing="1.6" fill="currentColor">
          <textPath href={`#${id}-top`} startOffset="50%" textAnchor="middle">
            TOGETHER
          </textPath>
        </text>
        <text fontSize="6.5" fontWeight="600" letterSpacing="1.2" fill="currentColor">
          <textPath href={`#${id}-bottom`} startOffset="50%" textAnchor="middle" dominantBaseline="hanging">
            {date}
          </textPath>
        </text>
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-[3%] pt-[2%]">
        <ShapeIcon shape={shape} className="size-[34%]" strokeWidth={2} />
        <span className="text-[12cqw] leading-none">
          {flags[0]}
          <span className="mx-[2cqw] align-middle text-[8cqw] font-bold">+</span>
          {flags[1]}
        </span>
      </span>
    </span>
  )
}

// A pin split down the middle, one half per person. Each half slides in from its side as
// that person's hold fills (0 apart, 1 home). `snap` plays the click when they meet.
// `smooth` eases between values instead of following them frame by frame.
export function SplitPin({
  shape,
  left,
  right,
  snap,
  smooth,
  className,
}: {
  shape: Shape
  left: number
  right: number
  snap?: boolean
  smooth?: boolean
  className?: string
}) {
  const SPREAD = 18
  return (
    <span className={cn('relative inline-block shrink-0 text-foreground', snap && 'animate-pin-snap', className)} aria-hidden>
      <span
        className={cn('absolute inset-0 [clip-path:inset(-10%_50%_-10%_-10%)]', smooth && 'transition-transform duration-700 ease-out')}
        style={{ transform: `translateX(${-(1 - left) * SPREAD}%) rotate(${-(1 - left) * 6}deg)` }}
      >
        <ShapeSticker shape={shape} className="size-full" />
      </span>
      <span
        className={cn('absolute inset-0 [clip-path:inset(-10%_-10%_-10%_50%)]', smooth && 'transition-transform duration-700 ease-out')}
        style={{ transform: `translateX(${(1 - right) * SPREAD}%) rotate(${(1 - right) * 6}deg)` }}
      >
        <ShapeSticker shape={shape} className="size-full" />
      </span>
    </span>
  )
}

