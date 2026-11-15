import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// A drawn map for the trip, like the sketch: a light street grid, each person's route to
// the pin as a line with a bend, and their dot partway along it. Positions are 0–100 in
// both directions, so it fits any box. No map token needed.

export type Route = {
  id: string
  from: [number, number]
  // 0 at the start, 1 at the pin
  progress: number
  // The dot: a flag, or "You"
  face: ReactNode
  me?: boolean
  // A chip by the dot, e.g. "8 min"
  tag?: string
}

type Pt = [number, number]

// The bend: go along one axis first, then cut over, so routes look walked, not flown
function pathFor(from: Pt, to: Pt): Pt[] {
  const bend: Pt = [from[0], from[1] + (to[1] - from[1]) * 0.45]
  const turn: Pt = [from[0] + (to[0] - from[0]) * 0.55, bend[1]]
  return [from, bend, turn, to]
}

function pointAt(path: Pt[], t: number): Pt {
  const lengths = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]))
  let left = lengths.reduce((a, b) => a + b, 0) * Math.min(1, Math.max(0, t))
  for (let i = 0; i < lengths.length; i++) {
    if (left <= lengths[i] || i === lengths.length - 1) {
      const k = lengths[i] ? left / lengths[i] : 0
      return [path[i][0] + (path[i + 1][0] - path[i][0]) * k, path[i][1] + (path[i + 1][1] - path[i][1]) * k]
    }
    left -= lengths[i]
  }
  return path[path.length - 1]
}

const STREETS = [12, 27, 41, 56, 70, 85]

export function TripMap({
  pin,
  pinAt,
  routes,
  searching,
  className,
}: {
  pin: ReactNode
  pinAt: Pt
  routes: Route[]
  // Matchmaking: rings pulse out from your dot
  searching?: boolean
  className?: string
}) {
  return (
    <div className={cn('relative overflow-hidden bg-card', className)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
        {STREETS.map((s) => (
          <g key={s} className="stroke-background" strokeWidth={s % 2 ? 5 : 3} vectorEffect="non-scaling-stroke">
            <line x1={s} y1={0} x2={s + 6} y2={100} vectorEffect="non-scaling-stroke" />
            <line x1={0} y1={s} x2={100} y2={s - 4} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
        {routes.map((r) => {
          const path = pathFor(r.from, pinAt)
          const at = pointAt(path, r.progress)
          // Walked part dashed and faint, the rest solid
          const ahead = [at, ...path.filter((_, i) => i > 0 && segmentIndex(path, r.progress) < i)]
          return (
            <g key={r.id} fill="none" strokeLinecap="round" strokeLinejoin="round">
              <polyline
                points={path.map((p) => p.join(',')).join(' ')}
                className="stroke-muted-foreground/30"
                strokeWidth={3}
                strokeDasharray="2 6"
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                points={ahead.map((p) => p.join(',')).join(' ')}
                className={r.me ? 'stroke-foreground' : 'stroke-muted-foreground'}
                strokeWidth={r.me ? 4 : 3}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          )
        })}
      </svg>

      {/* The pin */}
      <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${pinAt[0]}%`, top: `${pinAt[1]}%` }}>
        {pin}
      </div>

      {routes.map((r) => {
        const at = pointAt(pathFor(r.from, pinAt), r.progress)
        return (
          <div
            key={r.id}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-1000 ease-linear"
            style={{ left: `${at[0]}%`, top: `${at[1]}%` }}
          >
            {searching && r.me && (
              <>
                <span className="absolute inset-0 animate-radar rounded-full border-2 border-foreground" />
                <span className="absolute inset-0 animate-radar rounded-full border-2 border-foreground [animation-delay:0.9s]" />
              </>
            )}
            <span
              className={cn(
                'relative flex size-10 animate-pop items-center justify-center rounded-2xl text-xl leading-none shadow-md',
                r.me ? 'bg-foreground text-[11px] font-bold text-background' : 'bg-background',
              )}
            >
              {r.face}
            </span>
            {r.tag && (
              <span className="absolute top-1/2 left-full ml-1.5 -translate-y-1/2 rounded-full bg-background px-2 py-0.5 text-xs font-semibold whitespace-nowrap shadow-sm tabular-nums">
                {r.tag}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Which segment of the path the dot is on
function segmentIndex(path: Pt[], t: number) {
  const lengths = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]))
  let left = lengths.reduce((a, b) => a + b, 0) * Math.min(1, Math.max(0, t))
  for (let i = 0; i < lengths.length; i++) {
    if (left <= lengths[i]) return i
    left -= lengths[i]
  }
  return lengths.length - 1
}
