import { createElement, type ComponentType } from 'react'
import {
  Amphora,
  Anchor,
  Bell,
  Bone,
  BookOpen,
  Bridge,
  Brush,
  Building2,
  CableCar,
  Castle,
  Church,
  Fish,
  Flower2,
  Lamp,
  Mountain,
  Palette,
  Rocket,
  Ship,
  Star,
  Waves,
  Coffee,
  Disc3,
  Drum,
  FerrisWheel,
  Flame,
  Footprints,
  Goal,
  Guitar,
  Landmark,
  Languages,
  MicVocal,
  Music2,
  PartyPopper,
  Pencil,
  PersonStanding,
  Repeat,
  Sailboat,
  Shell,
  Soup,
  Store,
  Sunset,
  Telescope,
  TrainFront,
  TreePalm,
  Trees,
  Tv,
  Volleyball,
  WavesLadder,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Shape } from '@/data/la28'

type IconProps = { className?: string; strokeWidth?: number }

// Lucide has no basketball or taco; these follow its 24px stroke style
function Basketball({ className, strokeWidth = 2 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v20M2 12h20" />
      <path d="M5 5c2.5 2 3.5 4.5 3.5 7S7.5 17 5 19M19 5c-2.5 2-3.5 4.5-3.5 7s1 5 3.5 7" />
    </svg>
  )
}

function Taco({ className, strokeWidth = 2 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 18a10 10 0 0 1 20 0Z" />
      <path d="M5 13.5c1-1.2 2-.2 3-1.2s2 0 3-1 2 0 3-1 2 0 3 1 1.5.5 2 1.4" />
    </svg>
  )
}

// Placeholder silhouettes until the real pin and marker art is designed
const shapes: Record<Shape, ComponentType<IconProps>> = {
  running: Footprints,
  swimming: WavesLadder,
  basketball: Basketball,
  football: Goal,
  gymnastics: PersonStanding,
  volleyball: Volleyball,
  telescope: Telescope,
  'ferris-wheel': FerrisWheel,
  palm: TreePalm,
  train: TrainFront,
  market: Store,
  landmark: Landmark,
  music: Music2,
  guitar: Guitar,
  shell: Shell,
  sunset: Sunset,
  trees: Trees,
  boat: Sailboat,
  star: Star,
  mountain: Mountain,
  art: Palette,
  streetlight: Lamp,
  bone: Bone,
  rocket: Rocket,
  fish: Fish,
  ship: Ship,
  church: Church,
  bell: Bell,
  flower: Flower2,
  anchor: Anchor,
  waves: Waves,
  brush: Brush,
  funicular: CableCar,
  amphora: Amphora,
  spires: Castle,
  bridge: Bridge,
  building: Building2,
  coffee: Coffee,
  taco: Taco,
  book: BookOpen,
  vinyl: Disc3,
  grill: Flame,
  drum: Drum,
  party: PartyPopper,
  concert: MicVocal,
  dumplings: Soup,
  swap: Repeat,
  languages: Languages,
  sketch: Pencil,
  tv: Tv,
}

// A die-cut sticker in the shape of `shape`: a thick background-colored edge
// with the outline on top. Set the outline color with `className` (text-*).
export function ShapeSticker({ shape, className }: { shape: Shape; className?: string }) {
  return (
    <span className={cn('relative inline-block shrink-0 drop-shadow-md', className)} aria-hidden>
      {createElement(shapes[shape], { className: 'absolute inset-0 size-full text-background', strokeWidth: 7 })}
      {createElement(shapes[shape], { className: 'relative block size-full', strokeWidth: 2.25 })}
    </span>
  )
}

// The plain shape, for flat markers and thumbnails
export function ShapeIcon({ shape, className, strokeWidth = 2 }: { shape: Shape; className?: string; strokeWidth?: number }) {
  return createElement(shapes[shape], { className, strokeWidth })
}
