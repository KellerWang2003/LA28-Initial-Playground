import { useId } from 'react'
import { ShapeIcon } from '@/components/shape-art'
import type { Shape } from '@/data/la28'
import { cn } from '@/lib/utils'
import type { Person } from './crowd'
import { useCrowdPinLook, type PinLook } from './parties'

// Who's going, as the party's pin: a thick border painted with the crowd's colors (the three
// biggest groups), with the inside left blank for the pin's own art. Two looks for now: one
// clean sweep, or splashes. It reads as a mix, not a count. Tap it to see the crowd in detail.

// One clean color per country, then a second to fall back on when the first is taken
const COLORS: Record<string, string[]> = {
  BR: ['#22c55e', '#facc15'],
  MA: ['#ef4444', '#16a34a'],
  US: ['#3b82f6', '#ef4444'],
  MX: ['#10b981', '#ef4444'],
  FR: ['#2563eb', '#ef4444'],
  JP: ['#f43f5e'],
  KR: ['#3b82f6', '#ef4444'],
  GB: ['#2563eb', '#ef4444'],
  AR: ['#38bdf8', '#facc15'],
  DZ: ['#16a34a', '#ef4444'],
  ES: ['#f59e0b', '#ef4444'],
  CO: ['#facc15', '#2563eb'],
  PT: ['#16a34a', '#ef4444'],
}

function hsl(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  const l = (max + min) / 2
  if (d === 0) return [0, 0, l * 100]
  const sat = d / (1 - Math.abs(2 * l - 1))
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [(h * 60 + 360) % 360, sat * 100, l * 100]
}
const hue = (hex: string) => hsl(hex)[0]

// Stops from one color to the next that travel around the color wheel instead of straight
// through it, so red to green passes orange and yellow, not brown
function sweepStops(three: string[]) {
  // The two farthest apart go at the ends, so each step is a short one
  const gap = (x: string, y: string) => {
    const d = Math.abs(hue(x) - hue(y))
    return Math.min(d, 360 - d)
  }
  const [x, y, z] = three
  const ends = [[x, z, y], [x, y, z], [y, x, z]].sort((p, q) => gap(q[0], q[2]) - gap(p[0], p[2]))[0]
  const colors = ends
  const stops: { offset: number; color: string }[] = []
  const STEPS = 6
  colors.slice(0, -1).forEach((from, i) => {
    const [h1, s1, l1] = hsl(from)
    const [h2, s2, l2] = hsl(colors[i + 1])
    const dh = ((h2 - h1 + 540) % 360) - 180
    for (let k = 0; k <= STEPS; k++) {
      if (i > 0 && k === 0) continue
      const t = k / STEPS
      stops.push({
        offset: (i + t) / (colors.length - 1),
        color: `hsl(${(h1 + dh * t + 360) % 360} ${s1 + (s2 - s1) * t}% ${l1 + (l2 - l1) * t}%)`,
      })
    }
  })
  return stops
}
const apart = (a: string, b: string) => {
  const d = Math.abs(hue(a) - hue(b))
  return Math.min(d, 360 - d) >= 45
}

// The three biggest groups' colors, kept far enough apart to stay clean
function crowdColors(people: Person[]): string[] {
  const counts = new Map<string, number>()
  people.forEach((p) => counts.set(p.cc, (counts.get(p.cc) ?? 0) + 1))
  const picked: string[] = []
  for (const [cc] of [...counts].sort((a, b) => b[1] - a[1])) {
    const color = (COLORS[cc] ?? []).find((c) => picked.every((p) => apart(p, c)))
    if (color) picked.push(color)
    if (picked.length === 3) break
  }
  for (const fallback of ['#3b82f6', '#ef4444', '#facc15']) if (picked.length < 3 && picked.every((p) => apart(p, fallback))) picked.push(fallback)
  return picked
}

// Where the splashes land, in the pin's 24-unit box
const SPOTS = [
  { x: 4, y: 20, r: 13 },
  { x: 21, y: 6, r: 12 },
  { x: 20, y: 22, r: 9 },
]

export function CrowdPin({ shape, people, look: forced, className }: { shape: Shape; people: Person[]; look?: PinLook; className?: string }) {
  const id = useId().replace(/:/g, '')
  const current = useCrowdPinLook()
  const look = forced ?? current
  const [a, b, c] = crowdColors(people)
  return (
    <span className={cn('relative inline-block shrink-0', className)} aria-hidden>
      {/* The die-cut white edge, like every pin */}
      <ShapeIcon shape={shape} strokeWidth={8} className="absolute inset-0 size-full overflow-visible text-background drop-shadow-md" />
      <svg viewBox="0 0 24 24" className="absolute inset-0 size-full overflow-visible">
        <defs>
          <mask id={`m${id}`} maskUnits="userSpaceOnUse" x="-6" y="-6" width="36" height="36">
            <ShapeIcon shape={shape} strokeWidth={4} className="overflow-visible text-white" />
          </mask>
          <linearGradient id={`l${id}`} gradientUnits="userSpaceOnUse" x1="4" y1="4" x2="20" y2="20">
            {sweepStops([a, b, c]).map((st) => (
              <stop key={st.offset} offset={st.offset} stopColor={st.color} />
            ))}
          </linearGradient>
          {SPOTS.map((s, i) => (
            <radialGradient key={i} id={`r${id}${i}`} gradientUnits="userSpaceOnUse" cx={s.x} cy={s.y} r={s.r}>
              <stop offset="0" stopColor={[a, b, c][i]} />
              <stop offset="0.82" stopColor={[a, b, c][i]} />
              <stop offset="1" stopColor={[a, b, c][i]} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>
        <g mask={`url(#m${id})`}>
          {look === 'sweep' ? (
            <rect x="-6" y="-6" width="36" height="36" fill={`url(#l${id})`} />
          ) : (
            <>
              <rect x="-6" y="-6" width="36" height="36" fill={b} />
              {SPOTS.map((s, i) => (
                <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={`url(#r${id}${i})`} />
              ))}
            </>
          )}
        </g>
      </svg>
    </span>
  )
}
