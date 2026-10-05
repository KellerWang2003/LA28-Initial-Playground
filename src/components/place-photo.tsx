import { cn } from '@/lib/utils'
import { ShapeIcon } from '@/components/shape-art'
import type { Shape } from '@/data/la28'

// A stand-in photo, stable per pin, until a real camera exists.
const scenes = [
  { sky: 'linear-gradient(#8ec5ff, #f6d7a8)', ground: '#d7b48a', sun: '#fff6d8' },
  { sky: 'linear-gradient(#6d8fd6, #f0a57a)', ground: '#7d9a78', sun: '#ffe3b8' },
  { sky: 'linear-gradient(#b9dcff, #e7f3ff)', ground: '#8aadc4', sun: '#ffffff' },
  { sky: 'linear-gradient(#f2b27a, #6d86b8)', ground: '#3e4d5e', sun: '#ffd7a1' },
  { sky: 'linear-gradient(#7eb0e0, #f2c9a0 70%)', ground: '#c9845a', sun: '#fff1c9' },
]

function hash(seed: string) {
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

export function PlacePhoto({ seed, shape, className }: { seed: string; shape: Shape; className?: string }) {
  const scene = scenes[hash(seed) % scenes.length]
  return (
    <div className={cn('relative overflow-hidden', className)} aria-hidden>
      <div className="absolute inset-0" style={{ background: scene.sky }} />
      <div className="absolute top-[18%] right-[18%] size-[18%] rounded-full" style={{ background: scene.sun }} />
      <div className="absolute inset-x-0 bottom-0 h-[38%]" style={{ background: scene.ground }} />
      <ShapeIcon shape={shape} strokeWidth={1.5} className="absolute bottom-[22%] left-1/2 size-1/3 -translate-x-1/2 text-white/90" />
    </div>
  )
}

// The pin made from their photo: the picture, in a die-cut pin face.
export function CustomPin({ seed, shape, className }: { seed: string; shape: Shape; className?: string }) {
  return (
    <span className={cn('relative inline-block overflow-hidden rounded-[28%] border-4 border-foreground bg-background shadow-md', className)}>
      <PlacePhoto seed={seed} shape={shape} className="size-full" />
    </span>
  )
}
