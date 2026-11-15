import { useId } from 'react'
import { ShapeIcon } from '@/components/shape-art'
import type { Shape } from '@/data/la28'
import { cn } from '@/lib/utils'
import type { Person } from './crowd'

// Who's going, as the party's pin: its silhouette filled with a soft gradient of the crowd's
// colors, each country's colors taking up as much of it as its share of the crowd. It reads
// as a mix, not a count. Tap it to see the crowd in detail.

// A country's colors, from its flag
const COLORS: Record<string, string[]> = {
  BR: ['#16a34a', '#facc15'],
  MA: ['#dc2626', '#0f7a3c'],
  US: ['#2563eb', '#ef4444'],
  MX: ['#059669', '#e11d48'],
  FR: ['#1d4ed8', '#f43f5e'],
  JP: ['#f43f5e'],
  KR: ['#3b82f6', '#ef4444'],
  GB: ['#1e3a8a', '#dc2626'],
  AR: ['#7dd3fc', '#fde047'],
  DZ: ['#16a34a'],
  ES: ['#f59e0b', '#dc2626'],
  CO: ['#facc15', '#1d4ed8'],
  PT: ['#15803d', '#dc2626'],
}
const OTHER = ['#a3a3a3']

type Blob = { x: number; y: number; r: number; color: string }

// Bigger groups get bigger, more central blobs; positions are fixed so a party always looks the same
function blobsFor(people: Person[]): Blob[] {
  const counts = new Map<string, number>()
  people.forEach((p) => counts.set(p.cc, (counts.get(p.cc) ?? 0) + 1))
  const ranked = [...counts].sort((a, b) => b[1] - a[1])
  const blobs: Blob[] = []
  ranked.forEach(([cc, n], i) => {
    const share = n / people.length
    const colors = COLORS[cc] ?? OTHER
    colors.forEach((color, k) => {
      const j = blobs.length
      const angle = j * 2.39996 + 0.6
      const dist = 2.5 + (i === 0 ? 0 : 3 + (j % 3) * 2.2)
      blobs.push({
        x: 12 + Math.cos(angle) * dist,
        y: 13 + Math.sin(angle) * dist,
        r: (3 + Math.sqrt(share) * 12) / (k === 0 ? 1 : 1.35),
        color,
      })
    })
  })
  return blobs
}

export function CrowdPin({ shape, people, className }: { shape: Shape; people: Person[]; className?: string }) {
  const id = useId().replace(/:/g, '')
  const blobs = blobsFor(people)
  return (
    <span className={cn('relative inline-block shrink-0', className)} aria-hidden>
      {/* The die-cut white edge, like every pin */}
      <ShapeIcon shape={shape} strokeWidth={7} className="absolute inset-0 size-full fill-background text-background drop-shadow-md" />
      <svg viewBox="0 0 24 24" className="absolute inset-0 size-full overflow-visible">
        <defs>
          <mask id={`m${id}`} maskUnits="userSpaceOnUse" x="-4" y="-4" width="32" height="32">
            <ShapeIcon shape={shape} strokeWidth={4.5} className="fill-white text-white" />
          </mask>
          <filter id={`f${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>
        <g mask={`url(#m${id})`}>
          <rect x="-4" y="-4" width="32" height="32" fill={blobs[0]?.color ?? OTHER[0]} />
          <g filter={`url(#f${id})`}>
            {blobs.map((b, i) => (
              <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={b.color} />
            ))}
          </g>
        </g>
      </svg>
      {/* The pin's own lines on top, so it still reads as its shape */}
      <ShapeIcon shape={shape} strokeWidth={1.25} className="absolute inset-0 size-full text-white/85" />
    </span>
  )
}
