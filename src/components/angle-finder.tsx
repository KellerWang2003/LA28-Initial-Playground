import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Camera, Lock, Move } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { photoSrc } from '@/components/place-photo'
import { cn } from '@/lib/utils'
import type { Bonus } from '@/data/bonuses'

export type AnglePhase = 'hint' | 'camera' | 'matched'

// The live view is this much bigger than the frame, so there's room to move it
const OVERSCAN = 1.5
// How far the view can be off, as a share of the frame
const MAX_OFF = (OVERSCAN - 1) / 2
// Match score that counts as lined up; letting go above it snaps the view into place
const LOCK_AT = 0.85
// Where the view starts: off to the side and low, so the ghost reads clearly
const START = { x: -0.17, y: 0.12 }

// Unique angle: a blurred hint of the target framing, then the camera with
// that framing as a ghost. Line the view up with the ghost and the shutter
// unlocks. Moving the phone is simulated by dragging the view.
export function AngleFinder({ bonus, start = 'hint', onCapture }: { bonus: Bonus; start?: AnglePhase; onCapture: () => void }) {
  const [phase, setPhase] = useState<'hint' | 'camera'>(start === 'hint' ? 'hint' : 'camera')
  return phase === 'hint' ? (
    <Hint bonus={bonus} onOpen={() => setPhase('camera')} />
  ) : (
    <Viewfinder bonus={bonus} matched={start === 'matched'} onCapture={onCapture} />
  )
}

function Hint({ bonus, onOpen }: { bonus: Bonus; onOpen: () => void }) {
  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
        <div className="relative aspect-[3/4] w-full max-w-[16rem] overflow-hidden rounded-3xl border bg-muted">
          <img src={photoSrc(bonus.pin)} alt="" className="absolute inset-0 size-full scale-[1.35] object-cover blur-[3px] grayscale" />
          <span className="absolute top-3 left-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow-sm">Hint</span>
        </div>
        <h1 className="mt-6 font-heading text-2xl font-semibold">Find this view</h1>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">{bonus.detail}</p>
      </div>
      <Button size="lg" className="w-full shrink-0" onClick={onOpen}>
        <Camera data-icon="inline-start" />
        Open camera
      </Button>
    </>
  )
}

function Viewfinder({ bonus, matched, onCapture }: { bonus: Bonus; matched: boolean; onCapture: () => void }) {
  const frameRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; from: { x: number; y: number } } | null>(null)
  const [off, setOff] = useState(matched ? { x: 0, y: 0 } : START)
  const [dragging, setDragging] = useState(false)
  const [flash, setFlash] = useState(false)

  const score = Math.max(0, 1 - Math.hypot(off.x, off.y) / MAX_OFF)
  const locked = score >= LOCK_AT && !dragging && off.x === 0 && off.y === 0
  const close = score >= LOCK_AT

  // A small buzz when it locks in, where the phone supports it
  useEffect(() => {
    if (locked) navigator.vibrate?.(15)
  }, [locked])

  function onDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, from: off }
    setDragging(true)
  }

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current
    const frame = frameRef.current
    if (!d || !frame) return
    const clamp = (v: number) => Math.max(-MAX_OFF, Math.min(MAX_OFF, v))
    setOff({
      x: clamp(d.from.x + (e.clientX - d.x) / frame.clientWidth),
      y: clamp(d.from.y + (e.clientY - d.y) / frame.clientHeight),
    })
  }

  function onUp() {
    drag.current = null
    setDragging(false)
    // Close enough: settle exactly onto the ghost
    if (close) setOff({ x: 0, y: 0 })
  }

  function capture() {
    setFlash(true)
    window.setTimeout(onCapture, 220)
  }

  const src = photoSrc(bonus.pin)
  // The overscanned view, shifted by `o` (share of the frame)
  const layer = (o: { x: number; y: number }) => ({
    width: `${OVERSCAN * 100}%`,
    height: `${OVERSCAN * 100}%`,
    left: `${-MAX_OFF * 100}%`,
    top: `${-MAX_OFF * 100}%`,
    transform: `translate(${(o.x / OVERSCAN) * 100}%, ${(o.y / OVERSCAN) * 100}%)`,
  })

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <div
          ref={frameRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className={cn(
            'relative aspect-[3/4] max-h-full w-full max-w-sm cursor-grab touch-none overflow-hidden rounded-3xl bg-black select-none active:cursor-grabbing',
            locked ? 'ring-4 ring-foreground ring-offset-2 ring-offset-background' : 'ring-1 ring-border',
          )}
        >
          {/* Live view */}
          <img
            src={src}
            alt=""
            draggable={false}
            className={cn('absolute max-w-none object-cover', !dragging && 'transition-transform duration-300 ease-out')}
            style={layer(off)}
          />
          {/* Ghost of the target framing: fades once lined up */}
          <img
            src={src}
            alt=""
            draggable={false}
            className={cn(
              'pointer-events-none absolute max-w-none object-cover mix-blend-screen grayscale transition-opacity duration-300',
              locked ? 'opacity-0' : 'opacity-45',
            )}
            style={layer({ x: 0, y: 0 })}
          />
          {/* Frame corners of the target */}
          <Corners on={locked} />
          <span className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow-sm">
            {locked ? 'Lined up' : close ? 'Almost' : 'Ghost'}
          </span>
          {!locked && !dragging && score < 0.5 && (
            <span className="pointer-events-none absolute inset-x-0 bottom-4 mx-auto flex w-fit items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium shadow-sm">
              <Move className="size-3.5" />
              Move until it lines up
            </span>
          )}
          <div className={cn('pointer-events-none absolute inset-0 bg-white transition-opacity duration-200', flash ? 'opacity-90' : 'opacity-0')} />
        </div>
        <Meter score={score} locked={locked} />
      </div>
      <div className="flex shrink-0 justify-center pt-3">
        <button
          type="button"
          disabled={!locked || flash}
          aria-label={locked ? 'Capture' : 'Capture locked until it lines up'}
          onClick={capture}
          className="flex size-18 items-center justify-center rounded-full border-4 bg-background shadow-md transition-opacity active:scale-95 disabled:opacity-40"
        >
          {locked ? <Camera className="size-7" /> : <Lock className="size-6" />}
        </button>
      </div>
    </>
  )
}

function Meter({ score, locked }: { score: number; locked: boolean }) {
  const pct = locked ? 100 : Math.round(score * 100)
  return (
    <div className="mt-3 w-full max-w-sm">
      <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>{locked ? 'Matched. Take the photo.' : 'Line up the view with the ghost'}</span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-foreground transition-[width] duration-150" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Corners({ on }: { on: boolean }) {
  const base = cn('pointer-events-none absolute size-7 border-white transition-all duration-300', on ? 'opacity-100' : 'opacity-70')
  const inset = on ? '10px' : '16px'
  return (
    <>
      <span className={cn(base, 'border-t-[3px] border-l-[3px] rounded-tl-lg')} style={{ top: inset, left: inset }} />
      <span className={cn(base, 'border-t-[3px] border-r-[3px] rounded-tr-lg')} style={{ top: inset, right: inset }} />
      <span className={cn(base, 'border-b-[3px] border-l-[3px] rounded-bl-lg')} style={{ bottom: inset, left: inset }} />
      <span className={cn(base, 'border-b-[3px] border-r-[3px] rounded-br-lg')} style={{ bottom: inset, right: inset }} />
    </>
  )
}
