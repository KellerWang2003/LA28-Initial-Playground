import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Shape } from '@/data/la28'
import { SplitPin } from './co-stamp-art'
import { buzz } from './state'

// How long a full hold takes, and how fast a side drains once its person lets go
const FILL_MS = 1800
const DRAIN_MS = 900
// The other person (simulated) grabs on this long after you do, and on the first try
// slips once partway, so both "they let go" and "you let go" can be felt
const PARTNER_LAG_MS = 450
const SLIP_AT = 0.55
const SLIP_MS = 900

// Ring geometry, in the SVG's units
const R = 92
const HALF = Math.PI * R

export type Partner = { name: string; flag: string }

// The handshake: both people press and hold the pin at the same time. Your half of the ring
// fills up the left side, theirs up the right, and they meet at the top. Let go and your side
// drains. When both are full the two halves of the pin slide home and click.
export function HoldHandshake({ shape, partner, onJoined }: { shape: Shape; partner: Partner; onJoined: () => void }) {
  const [mine, setMine] = useState(0)
  const [theirs, setTheirs] = useState(0)
  const [down, setDown] = useState(false)
  const [partnerDown, setPartnerDown] = useState(false)
  const [slipped, setSlipped] = useState(false)
  const [snapped, setSnapped] = useState(false)
  const [started, setStarted] = useState(false)

  // The loop reads live values from here, so it doesn't restart every frame
  const live = useRef({ mine: 0, theirs: 0, down: false, partnerDown: false, slipUsed: false, snapped: false })

  // Fill and drain both sides every frame
  useEffect(() => {
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = now - last
      last = now
      const l = live.current
      if (!l.snapped) {
        const before = l.mine
        l.mine = Math.max(0, Math.min(1, l.mine + (l.down ? dt / FILL_MS : -dt / DRAIN_MS)))
        l.theirs = Math.max(0, Math.min(1, l.theirs + (l.partnerDown ? dt / FILL_MS : -dt / DRAIN_MS)))
        // A tick on each quarter of your side
        if (Math.floor(l.mine * 4) > Math.floor(before * 4) && l.mine < 1) buzz(8)
        // Their first try slips partway
        if (!l.slipUsed && l.partnerDown && l.theirs >= SLIP_AT) {
          l.slipUsed = true
          l.partnerDown = false
          setPartnerDown(false)
          setSlipped(true)
          window.setTimeout(() => {
            live.current.partnerDown = true
            setPartnerDown(true)
            setSlipped(false)
          }, SLIP_MS)
        }
        if (l.mine >= 1 && l.theirs >= 1 && l.down && l.partnerDown) {
          l.snapped = true
          setSnapped(true)
          buzz([20, 60, 40])
        }
        setMine(l.mine)
        setTheirs(l.theirs)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  // Once the halves click, give the moment a beat before moving on
  const joined = useRef(onJoined)
  useEffect(() => {
    joined.current = onJoined
  })
  useEffect(() => {
    if (!snapped) return
    const t = window.setTimeout(() => joined.current(), 1100)
    return () => window.clearTimeout(t)
  }, [snapped])

  // They grab on a moment after you first do, then stay on even if you let go
  useEffect(() => {
    if (!started) return
    const t = window.setTimeout(() => {
      live.current.partnerDown = true
      setPartnerDown(true)
    }, PARTNER_LAG_MS)
    return () => window.clearTimeout(t)
  }, [started])

  function press(on: boolean) {
    if (live.current.snapped) return
    live.current.down = on
    setDown(on)
    if (on) {
      buzz(12)
      setStarted(true)
    }
  }

  const status = snapped
    ? 'Clicked. You’re in this together.'
    : !started
      ? `Press and hold the pin. ${partner.name} holds it on the other phone.`
      : slipped
        ? `${partner.name} let go. Keep holding, their side is coming back.`
        : !down && mine > 0
          ? 'You let go. Your side is draining.'
          : !partnerDown
            ? `Waiting for ${partner.name} to hold…`
            : mine >= 1 && theirs < 1
              ? `Your half is in. Waiting on ${partner.name}’s.`
              : theirs >= 1 && mine < 1
                ? `${partner.name}’s half is in. Keep going.`
                : down
                  ? 'Keep holding'
                  : `${partner.name} is holding. Press the pin.`

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div
        role="button"
        tabIndex={0}
        aria-label={`Hold together with ${partner.name}`}
        aria-pressed={down}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          press(true)
        }}
        onPointerUp={() => press(false)}
        onPointerCancel={() => press(false)}
        onLostPointerCapture={() => press(false)}
        onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && !e.repeat && press(true)}
        onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && press(false)}
        onContextMenu={(e) => e.preventDefault()}
        className="relative size-72 touch-none select-none [-webkit-touch-callout:none]"
      >
        {/* Breathing halo while nobody has started */}
        {!started && <span aria-hidden className="absolute inset-6 animate-breathe rounded-full bg-foreground" />}
        {/* Both holding: one pulse, in step */}
        {down && partnerDown && !snapped && <span aria-hidden className="absolute inset-4 animate-ping rounded-full border-2 border-foreground/30 [animation-duration:1.2s]" />}
        {snapped && <span aria-hidden className="absolute inset-4 animate-ripple rounded-full border-4 border-foreground" />}

        <svg viewBox="0 0 200 200" className="absolute inset-0 size-full" aria-hidden>
          <circle cx="100" cy="100" r={R} fill="none" stroke="var(--color-muted)" strokeWidth="10" />
          {/* You: up the left side from the bottom */}
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke="var(--color-foreground)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${mine * HALF} ${2 * HALF}`}
            transform="rotate(90 100 100)"
            className={cn(!down && mine > 0 && !snapped && 'opacity-50')}
          />
          {/* Them: up the right side, mirrored */}
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke="var(--color-foreground)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${theirs * HALF} ${2 * HALF}`}
            transform="translate(200 0) scale(-1 1) rotate(90 100 100)"
            className={cn(!partnerDown && theirs > 0 && !snapped && 'opacity-50')}
          />
        </svg>

        <span className={cn('absolute inset-10 flex items-center justify-center rounded-full bg-card transition-transform duration-150', down && !snapped && 'scale-95')}>
          <SplitPin shape={shape} left={snapped ? 1 : mine} right={snapped ? 1 : theirs} snap={snapped} className="size-36" />
        </span>
      </div>

      <div className="mt-6 flex w-72 items-start justify-between">
        <Holder label="You" glyph="You" small on={down} done={mine >= 1} />
        <Holder label={partner.name} glyph={partner.flag} on={partnerDown} done={theirs >= 1} right />
      </div>

      <p aria-live="polite" className="mt-5 min-h-10 max-w-72 text-center text-sm text-muted-foreground">
        {status}
      </p>
    </div>
  )
}

// One side's person: a dot that lights while they're holding
function Holder({ label, glyph, small, on, done, right }: { label: string; glyph: string; small?: boolean; on: boolean; done: boolean; right?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2', right && 'flex-row-reverse')}>
      <span
        className={cn(
          'relative flex size-10 items-center justify-center rounded-full text-sm font-semibold transition-colors',
          on ? 'bg-foreground text-background' : 'bg-muted text-foreground',
          small ? 'text-[11px]' : 'text-lg',
        )}
      >
        {glyph}
        {on && !done && <span aria-hidden className="absolute inset-0 animate-ping rounded-full border-2 border-foreground [animation-duration:1.2s]" />}
      </span>
      <span className={cn('text-xs', right && 'text-right')}>
        <span className="block font-medium">{label}</span>
        <span className="block text-muted-foreground">{done ? 'Half in' : on ? 'Holding' : 'Not holding'}</span>
      </span>
    </span>
  )
}
