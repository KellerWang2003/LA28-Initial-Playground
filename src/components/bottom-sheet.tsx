import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from 'react'
import { cn } from '@/lib/utils'

export type Snap = 'min' | 'half' | 'full'

const SNAPS: Snap[] = ['min', 'half', 'full']
// Visible height when minimized: handle, search and filters, plus room for the floating tab bar
const MIN_HEIGHT = 216
// Gap left above the sheet when fully expanded
const TOP_GAP = 72

type Props = {
  snap: Snap
  onSnapChange: (snap: Snap) => void
  hidden?: boolean
  header: ReactNode
  children: ReactNode
  // Floats just above the sheet's top edge; children are spread left to right
  accessory?: ReactNode
}

// Draggable sheet that fills its positioned parent. Drag the header to resize.
export function BottomSheet({ snap, onSnapChange, hidden, header, children, accessory }: Props) {
  const boundsRef = useRef<HTMLDivElement>(null)
  const [parentHeight, setParentHeight] = useState(0)
  const [dragHeight, setDragHeight] = useState<number | null>(null)
  const drag = useRef<{ startY: number; startH: number; lastY: number; lastT: number; v: number } | null>(null)

  useEffect(() => {
    const el = boundsRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setParentHeight(el.clientHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const heights: Record<Snap, number> = {
    min: MIN_HEIGHT,
    half: Math.max(MIN_HEIGHT, Math.round(parentHeight * 0.5)),
    full: Math.max(MIN_HEIGHT, parentHeight - TOP_GAP),
  }
  const height = dragHeight ?? heights[snap]

  function onPointerDown(e: PointerEvent) {
    if ((e.target as HTMLElement).closest('input, button, a')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { startY: e.clientY, startH: height, lastY: e.clientY, lastT: e.timeStamp, v: 0 }
  }

  function onPointerMove(e: PointerEvent) {
    const d = drag.current
    if (!d) return
    const dt = e.timeStamp - d.lastT
    if (dt > 0) d.v = (e.clientY - d.lastY) / dt
    d.lastY = e.clientY
    d.lastT = e.timeStamp
    const next = d.startH - (e.clientY - d.startY)
    setDragHeight(Math.min(heights.full, Math.max(MIN_HEIGHT * 0.8, next)))
  }

  function onPointerUp() {
    const d = drag.current
    drag.current = null
    if (!d || dragHeight === null) return setDragHeight(null)

    let target: Snap
    if (Math.abs(d.v) > 0.5) {
      // Flick: move one snap in the flick direction (negative v = upward)
      const step = d.v < 0 ? 1 : -1
      target = SNAPS[Math.min(SNAPS.length - 1, Math.max(0, SNAPS.indexOf(snap) + step))]
    } else {
      target = nearest(dragHeight)
    }
    setDragHeight(null)
    onSnapChange(target)
  }

  function nearest(h: number): Snap {
    return SNAPS.reduce((best, s) => (Math.abs(heights[s] - h) < Math.abs(heights[best] - h) ? s : best))
  }

  return (
    <div ref={boundsRef} className="pointer-events-none absolute inset-0 z-10">
      <div
        className={cn(
          'pointer-events-auto absolute inset-x-0 bottom-0 flex flex-col rounded-t-3xl border-t bg-background shadow-[0_-4px_24px_rgba(0,0,0,0.08)]',
          dragHeight === null && 'transition-[height,translate] duration-300 ease-out',
          hidden && 'translate-y-full',
        )}
        style={{ height }}
      >
        {accessory && snap !== 'full' && !hidden && (
          <div className="pointer-events-none absolute inset-x-4 bottom-full mb-3 flex items-end justify-between *:pointer-events-auto">
            {accessory}
          </div>
        )}
        <div
          className="shrink-0 cursor-grab touch-none select-none active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="mx-auto mt-2 mb-3 h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          {header}
        </div>
        {/* Bottom padding keeps content clear of the floating tab bar */}
        <div className="min-h-0 flex-1 overflow-y-auto pb-28">{children}</div>
      </div>
    </div>
  )
}
