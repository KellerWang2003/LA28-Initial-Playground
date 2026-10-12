import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Play, Tv, Volume2, VolumeX, X } from 'lucide-react'
import { formatTime, type Session } from '@/data/la28'
import { cn } from '@/lib/utils'
import { useRoomStage } from './round-phase'

// The live video floats over the room instead of taking a slot in the page:
// - floating: a small player docked to the left or right edge; drag it anywhere, it snaps to the nearer side
// - tucked: pushed off an edge (drag it past the edge, or the header button), leaving a tab to pull it back
// - expanded: fills the screen
export type VideoState = 'off' | 'floating' | 'tucked' | 'expanded'

// Floating size (16:9) and the gap it keeps from the screen edges
const W = 192
const H = 108
const MARGIN = 12
// Room left at the bottom for the CrowdPlay button and the home indicator
const BOTTOM = 92
// Movement before a press counts as a drag
const DRAG_SLOP = 6
// Pushed this far past an edge on release, it tucks away
const TUCK_PAST = W * 0.35
// A sideways flick faster than this (px/ms) throws it to that side, or off it
const FLICK = 0.6

type Side = 'left' | 'right'

// What the fake scoreboard says, from whatever the session has
function scoreboardText(session: Session) {
  const { live, teams, score, races } = session
  const pair = live?.score ?? score
  if (teams && pair) return `${teams[0]} ${pair[0]} - ${pair[1]} ${teams[1]}${live?.clock ? ` · ${live.clock}` : ''}`
  const next = races?.find((r) => r.status === 'next')
  if (next) return `Up next · ${formatTime(next.time)} · ${next.title}`
  if (live?.progress) return live.progress
  return session.title
}

// Header button: starts the video, then shows or tucks it away
export function WatchButton({ state, onChange }: { state: VideoState; onChange: (next: VideoState) => void }) {
  if (state === 'off') {
    return (
      <button
        type="button"
        onClick={() => onChange('floating')}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-xs font-medium text-background"
      >
        <Play className="size-3.5 fill-current" />
        Watch
      </button>
    )
  }
  const tucked = state === 'tucked'
  return (
    <button
      type="button"
      onClick={() => onChange(tucked ? 'floating' : 'tucked')}
      aria-pressed={!tucked}
      aria-label={tucked ? 'Show the live video' : 'Hide the live video'}
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-full',
        tucked ? 'bg-muted' : 'bg-foreground text-background',
      )}
    >
      <Tv className="size-4" />
    </button>
  )
}

function ControlButton({ label, onClick, children, big }: { label: string; onClick: () => void; children: React.ReactNode; big?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn('inline-flex items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm', big ? 'size-11' : 'size-7')}
    >
      {children}
    </button>
  )
}

// Placeholder frame: a dark panel with a fake scoreboard, no real video
function Frame({ session, big, controls }: { session: Session; big?: boolean; controls: React.ReactNode }) {
  return (
    <div
      role="group"
      aria-label="Live video"
      className={cn(
        'relative aspect-video w-full overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-700 text-white',
        big ? 'rounded-none' : 'rounded-xl',
      )}
    >
      {/* Faint lane lines so the frame reads as a video, not an empty box */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-20"
        style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent 0 ${big ? 22 : 12}px, rgba(255,255,255,.35) ${big ? 22 : 12}px ${big ? 23 : 13}px)` }}
      />
      <span
        className={cn(
          'absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-1 leading-none font-semibold',
          big ? 'text-[11px]' : 'text-[9px]',
        )}
      >
        <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
        LIVE
      </span>
      <div className="absolute top-1.5 right-1.5 flex items-center gap-1">{controls}</div>
      <div className={cn('absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent', big ? 'p-3 pt-8' : 'p-2 pt-5')}>
        <p className={cn('truncate font-semibold tabular-nums', big ? 'text-sm' : 'text-[10px]')}>{scoreboardText(session)}</p>
        {big && <p className="text-[11px] text-white/60">Prototype feed · no real video</p>}
      </div>
    </div>
  )
}

function useViewport() {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

type Gesture = { startX: number; startY: number; fromX: number; fromY: number; x: number; y: number; lastX: number; lastT: number; vx: number; moved: boolean }

// The live video, over everything in the room. Never autoplays: the header's Watch button starts it.
export function FloatingVideo({ session, state, onChange }: { session: Session; state: VideoState; onChange: (next: VideoState) => void }) {
  const vp = useViewport()
  // Nothing to watch before the start or after the end
  const canWatch = useRoomStage(session) === 'live'
  const [muted, setMuted] = useState(true)
  const [side, setSide] = useState<Side>('right')
  const [y, setY] = useState<number>()
  const [drag, setDrag] = useState<{ x: number; y: number }>()
  const gesture = useRef<Gesture>(null)

  // The game ended while watching
  useEffect(() => {
    if (!canWatch && state !== 'off') onChange('off')
  }, [canWatch, state, onChange])

  // Esc leaves the full-screen view
  useEffect(() => {
    if (state !== 'expanded') return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onChange('floating')
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state, onChange])

  if (state === 'off' || !canWatch) return null

  const maxY = vp.h - H - BOTTOM
  const clampY = (value: number) => Math.min(Math.max(value, MARGIN), maxY)
  const restY = clampY(y ?? maxY)
  const tucked = state === 'tucked'
  const restX = side === 'left' ? (tucked ? -W - MARGIN : MARGIN) : tucked ? vp.w + MARGIN : vp.w - W - MARGIN
  const pos = drag ?? { x: restX, y: restY }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    gesture.current = { startX: e.clientX, startY: e.clientY, fromX: pos.x, fromY: pos.y, x: pos.x, y: pos.y, lastX: e.clientX, lastT: e.timeStamp, vx: 0, moved: false }
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g) return
    const dx = e.clientX - g.startX
    const dy = e.clientY - g.startY
    if (!g.moved && Math.hypot(dx, dy) < DRAG_SLOP) return
    g.moved = true
    const dt = e.timeStamp - g.lastT
    if (dt > 0) g.vx = (e.clientX - g.lastX) / dt
    g.lastX = e.clientX
    g.lastT = e.timeStamp
    g.x = g.fromX + dx
    g.y = g.fromY + dy
    setDrag({ x: g.x, y: g.y })
  }

  const onPointerUp = () => {
    const g = gesture.current
    gesture.current = null
    if (!g?.moved) return
    const { x } = g
    const pastLeft = -x > TUCK_PAST || (g.vx < -FLICK && x < MARGIN)
    const pastRight = x + W - vp.w > TUCK_PAST || (g.vx > FLICK && x + W > vp.w - MARGIN)
    const nextSide: Side = pastLeft ? 'left' : pastRight ? 'right' : g.vx > FLICK ? 'right' : g.vx < -FLICK ? 'left' : x + W / 2 < vp.w / 2 ? 'left' : 'right'
    setSide(nextSide)
    setY(clampY(g.y))
    setDrag(undefined)
    onChange(pastLeft || pastRight ? 'tucked' : 'floating')
  }

  const mute = (
    <ControlButton label={muted ? 'Unmute' : 'Mute'} onClick={() => setMuted(!muted)} big={state === 'expanded'}>
      {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
    </ControlButton>
  )

  if (state === 'expanded') {
    return (
      <div
        role="dialog"
        aria-modal
        aria-label="Live video"
        className="animate-in fade-in fixed inset-0 z-50 flex flex-col bg-black pt-[env(safe-area-inset-top)] pb-[max(env(safe-area-inset-bottom),16px)] text-white"
      >
        <div className="flex h-14 shrink-0 items-center gap-2 px-3">
          <ControlButton label="Shrink the live video" onClick={() => onChange('floating')} big>
            <Minimize2 className="size-5" />
          </ControlButton>
          <p className="min-w-0 flex-1 truncate text-center text-sm font-medium">{session.title}</p>
          <ControlButton label="Close the live video" onClick={() => onChange('off')} big>
            <X className="size-5" />
          </ControlButton>
        </div>
        <div className="flex flex-1 items-center">
          <Frame session={session} big controls={mute} />
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-hidden={tucked}
        className={cn(
          'fixed top-0 left-0 z-40 touch-none rounded-xl shadow-xl ring-1 ring-black/10 select-none',
          drag ? 'cursor-grabbing' : 'cursor-grab transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)]',
        )}
        style={{ width: W, transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
      >
        <Frame
          session={session}
          controls={
            <>
              {mute}
              <ControlButton label="Expand the live video" onClick={() => onChange('expanded')}>
                <Maximize2 className="size-3.5" />
              </ControlButton>
              <ControlButton label="Close the live video" onClick={() => onChange('off')}>
                <X className="size-4" />
              </ControlButton>
            </>
          }
        />
      </div>

      {tucked && !drag && (
        <button
          type="button"
          onClick={() => onChange('floating')}
          aria-label="Show the live video"
          className={cn(
            'animate-in fade-in fixed z-40 flex h-16 w-7 items-center justify-center bg-foreground text-background shadow-lg',
            side === 'left' ? 'left-0 rounded-r-xl' : 'right-0 rounded-l-xl',
          )}
          style={{ top: restY + H / 2 - 32 }}
        >
          {side === 'left' ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      )}
    </>
  )
}
