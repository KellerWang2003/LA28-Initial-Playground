import { cn } from '@/lib/utils'
import type { Shape } from '@/data/la28'

// Real photographs stand in for the camera, so a viewfinder reads as a photo being taken.
const photos: Record<string, string> = {
  p_manhattan: 'sunset.jpg',
  p_hermosa_drop: 'sunset.jpg',
  p_malibu: 'sunset.jpg',
  p_marina: 'beach.jpg',
  p_venice_half: 'beach.jpg',
  p_venicecanals: 'beach.jpg',
  p_pier: 'pier.jpg',
  p_pier_half: 'pier.jpg',
  p_lacma: 'lamps.jpg',
  p_sofi: 'stadium.jpg',
  p_coliseum: 'stadium.jpg',
  p_intuit: 'stadium.jpg',
  p_arena: 'stadium.jpg',
  p_union: 'downtown.jpg',
  p_angelsflight: 'downtown.jpg',
  p_chinatown: 'downtown.jpg',
  p_hwof: 'downtown.jpg',
  p_griffith: 'downtown.jpg',
  p_lakehollywood: 'downtown.jpg',
  'pose-partner': 'person-a.jpg',
  'pose-you': 'person-b.jpg',
  'pose-pair': 'pair.jpg',
  'podium-gold': 'person-a.jpg',
  'podium-silver': 'person-b.jpg',
  'podium-bronze': 'person-c.jpg',
}

const pool = ['sunset.jpg', 'beach.jpg', 'pier.jpg', 'downtown.jpg', 'stadium.jpg', 'lamps.jpg']

function hash(seed: string) {
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

// Also used by the pin photo store, for the photo that collected a pin
// eslint-disable-next-line react-refresh/only-export-components
export function photoSrc(seed: string) {
  const file = seed.endsWith('-both') ? 'pair.jpg' : (photos[seed] ?? pool[hash(seed) % pool.length])
  return `/camera/${file}`
}

export function PlacePhoto({ seed, className }: { seed: string; shape: Shape; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden bg-muted', className)} aria-hidden>
      <img src={photoSrc(seed)} alt="" className="absolute inset-0 size-full object-cover" />
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
