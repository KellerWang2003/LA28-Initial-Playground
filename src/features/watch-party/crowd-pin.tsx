import { useId } from 'react'
import { ShapeIcon } from '@/components/shape-art'
import type { Shape } from '@/data/la28'
import { cn } from '@/lib/utils'
import type { Person } from './crowd'

// Who's going, as the party's round icon (like a project icon): a circle washed in the crowd's
// colors, blurred and grainy like a print, with the party's icon in the middle. The three
// biggest groups set the colors and how much of the circle each takes, and every party gets its
// own composition, so it reads as a mix, not a count. Tap it for the details.

// Each country's color, taken from its flag but tuned into one warm print palette (yellow,
// orange, red, pink, periwinkle, indigo...) so any mix of them sits well together
const COLOR: Record<string, string> = {
  BR: '#FFBE2B',
  MA: '#D40029',
  US: '#AAB5F1',
  MX: '#FF5519',
  FR: '#3B4BA8',
  JP: '#E0336F',
  KR: '#6A4CF0',
  GB: '#3B4BA8',
  AR: '#7FC4F5',
  DZ: '#4FBF94',
  ES: '#FF8A3D',
  CO: '#FFE36E',
  PT: '#A81163',
}
const SPARE = ['#AAB5F1', '#FF8A3D', '#A81163']

// The three biggest groups, each with its color and its share of the crowd
function crowdMix(people: Person[]) {
  const counts = new Map<string, number>()
  people.forEach((p) => counts.set(p.cc, (counts.get(p.cc) ?? 0) + 1))
  const mix: { color: string; share: number }[] = []
  for (const [cc, n] of [...counts].sort((a, b) => b[1] - a[1])) {
    const color = COLOR[cc]
    if (color && !mix.some((m) => m.color === color)) mix.push({ color, share: n / people.length })
    if (mix.length === 3) break
  }
  for (const color of SPARE) if (mix.length < 3 && !mix.some((m) => m.color === color)) mix.push({ color, share: 0.05 })
  return mix
}

// A small seeded random, so each party always gets the same composition
function random(seed: string) {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

type Blob = { x: number; y: number; rx: number; ry: number; rotate: number; color: string; crisp?: boolean }

// Three ways to lay the colors out, so parties don't all look alike even when the same countries
// lead: a big orb pushed to one side (the rest fades to paper), a soft flow with one sharper
// shape on top, or loose diagonal bands
const LAYOUTS = ['orb', 'flow', 'bands'] as const

function blobsFor(seed: string, people: Person[]): Blob[] {
  const rand = random(seed)
  const mix = crowdMix(people)
  const [a, b, c] = mix
  const layout = LAYOUTS[Math.floor(random(`look:${seed}`)() * 3)]
  const turn = rand() * Math.PI * 2
  const at = (angle: number, dist: number) => ({ x: 12 + Math.cos(turn + angle) * dist, y: 12 + Math.sin(turn + angle) * dist })
  const deg = (turn * 180) / Math.PI

  if (layout === 'orb') {
    // The biggest group as one round orb leaning out of the circle, the next as a glow on its
    // edge, the third as a small spot across
    return [
      { ...at(Math.PI * 0.8, 7), rx: 8.5, ry: 6, rotate: deg + 90, color: b.color },
      { ...at(0, 3.5), rx: 8 + a.share * 4, ry: 8 + a.share * 4, rotate: 0, color: a.color },
      { ...at(2.3, 9), rx: 3 + c.share * 6, ry: 2.5, rotate: deg, color: c.color, crisp: true },
    ]
  }
  if (layout === 'flow') {
    // A wide soft wash of the second group, then the biggest group as one sharper shape over it
    return [
      { ...at(Math.PI / 2, 6), rx: 16, ry: 7, rotate: deg, color: b.color },
      { ...at(-1.2, 7), rx: 4 + c.share * 6, ry: 3.5, rotate: deg + 40, color: c.color },
      { ...at(-0.3, 1.5), rx: 6 + a.share * 4, ry: 4 + a.share * 3, rotate: deg + 25, color: a.color, crisp: true },
    ]
  }
  // Loose bands across the circle, each as wide as its group is big
  return [
    { ...at(Math.PI / 2, 6), rx: 18, ry: 3 + b.share * 8, rotate: deg, color: b.color },
    { ...at(-Math.PI / 2, 6.5), rx: 18, ry: 2 + c.share * 8, rotate: deg, color: c.color },
    { ...at(0, 0.5), rx: 18, ry: 2.5 + a.share * 6, rotate: deg, color: a.color, crisp: true },
  ]
}

export function CrowdPin({ seed, shape, people, className }: { seed: string; shape: Shape; people: Person[]; className?: string }) {
  const id = useId().replace(/:/g, '')
  const blobs = blobsFor(seed, people)
  const ellipse = (w: Blob, i: number) => <ellipse key={i} cx={w.x} cy={w.y} rx={w.rx} ry={w.ry} fill={w.color} transform={`rotate(${w.rotate} ${w.x} ${w.y})`} />
  return (
    <span className={cn('relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full', className)} aria-hidden>
      <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        <defs>
          <filter id={`s${id}`} x="-6" y="-6" width="36" height="36" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <filter id={`c${id}`} x="-6" y="-6" width="36" height="36" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="1.1" />
          </filter>
          {/* Coarse grain over everything, like a riso print */}
          <filter id={`g${id}`} x="0" y="0" width="24" height="24" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="6" numOctaves="1" seed="3" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer result="grain">
              <feFuncR type="linear" slope="3" intercept="-1" />
              <feFuncG type="linear" slope="3" intercept="-1" />
              <feFuncB type="linear" slope="3" intercept="-1" />
              <feFuncA type="linear" slope="0" intercept="1" />
            </feComponentTransfer>
            <feBlend in="grain" in2="SourceGraphic" mode="soft-light" />
          </filter>
        </defs>
        <g filter={`url(#g${id})`}>
          <rect width="24" height="24" fill="#F6F0EA" />
          <g filter={`url(#s${id})`}>{blobs.filter((w) => !w.crisp).map(ellipse)}</g>
          <g filter={`url(#c${id})`} opacity={0.92}>
            {blobs.filter((w) => w.crisp).map(ellipse)}
          </g>
        </g>
      </svg>
      {/* The party's icon, simple, in the middle */}
      <ShapeIcon shape={shape} strokeWidth={1.75} className="relative size-[42%] text-foreground" />
    </span>
  )
}
