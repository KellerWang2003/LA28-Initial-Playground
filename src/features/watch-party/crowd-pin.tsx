import { useId } from 'react'
import { ShapeIcon } from '@/components/shape-art'
import type { Shape } from '@/data/la28'
import { cn } from '@/lib/utils'
import type { Person } from './crowd'

// Who's going, as the party's round icon (like a project icon): a circle washed in the crowd's
// colors, blurred and grainy like a print, with the party's icon in the middle. The three
// biggest groups set the colors, so it reads as a mix, not a count. Tap it for the details.

// Each country's colors, as hues from its flag (softened below)
const HUES: Record<string, number[]> = {
  BR: [140, 50],
  MA: [355, 145],
  US: [218, 355],
  MX: [160, 350],
  FR: [225, 355],
  JP: [350],
  KR: [215, 355],
  GB: [225, 355],
  AR: [200, 48],
  DZ: [145, 355],
  ES: [40, 355],
  CO: [50, 225],
  PT: [145, 355],
}

const gap = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b))

// The three biggest groups' hues, kept far enough apart that they don't muddy each other
function crowdHues(people: Person[]): number[] {
  const counts = new Map<string, number>()
  people.forEach((p) => counts.set(p.cc, (counts.get(p.cc) ?? 0) + 1))
  const picked: number[] = []
  for (const [cc] of [...counts].sort((a, b) => b[1] - a[1])) {
    const h = (HUES[cc] ?? []).find((c) => picked.every((p) => gap(p, c) >= 45))
    if (h !== undefined) picked.push(h)
    if (picked.length === 3) break
  }
  for (const fallback of [220, 350, 45]) if (picked.length < 3 && picked.every((p) => gap(p, fallback) >= 45)) picked.push(fallback)
  // The two closest hues sit next to each other (they blend cleanly); the third gets its own corner
  const [a, b, c] = picked
  const orders = [[a, b, c], [b, a, c], [c, a, b]]
  return orders.sort((p, q) => gap(p[1], p[2]) - gap(q[1], q[2]))[0]
}

// Where each color sits across the circle's 24-unit box. The middle and one corner fade to
// light, like a blurred print, so the icon stays clear.
const WASHES = [
  { x: 1, y: 21, r: 9, c: 0 },
  { x: 22, y: 4, r: 9, c: 1 },
  { x: 21, y: 20, r: 7, c: 2 },
]

const ink = (h: number) => `hsl(${h} 78% 62%)`

export function CrowdPin({ shape, people, className }: { shape: Shape; people: Person[]; className?: string }) {
  const id = useId().replace(/:/g, '')
  const hues = crowdHues(people)
  return (
    <span className={cn('relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full', className)} aria-hidden>
      <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        <defs>
          {/* Blur the colors into each other, then add grain on top */}
          <filter id={`f${id}`} x="-6" y="-6" width="36" height="36" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="soft" />
            <feTurbulence type="fractalNoise" baseFrequency="7" numOctaves="2" seed="7" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer result="grain">
              <feFuncR type="linear" slope="2" intercept="-0.5" />
              <feFuncG type="linear" slope="2" intercept="-0.5" />
              <feFuncB type="linear" slope="2" intercept="-0.5" />
              <feFuncA type="linear" slope="0" intercept="1" />
            </feComponentTransfer>
            <feBlend in="grain" in2="soft" mode="soft-light" result="grainy" />
            <feComposite in="grainy" in2="soft" operator="in" />
          </filter>
        </defs>
        <g filter={`url(#f${id})`}>
          <rect x="-6" y="-6" width="36" height="36" fill="#f6f3f1" />
          {WASHES.map((w, i) => (
            <circle key={i} cx={w.x} cy={w.y} r={w.r} fill={ink(hues[w.c])} />
          ))}
        </g>
      </svg>
      {/* The party's icon, simple, in the middle */}
      <ShapeIcon shape={shape} strokeWidth={1.75} className="relative size-[42%] text-foreground" />
    </span>
  )
}
