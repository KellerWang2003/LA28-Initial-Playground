import { useEffect, useRef, useState, type ReactNode, type MouseEvent, type PointerEvent } from 'react'
import { cn } from '@/lib/utils'

export type Snap = 'min' | 'half' | 'full'

const SNAPS: Snap[] = ['min', 'half', 'full']
// Visible height when minimized: handle, search and filters, plus room for the floating tab bar
const MIN_HEIGHT = 232
// Gap left above the sheet when fully expanded
const TOP_GAP = 8
// Movement before a press counts as a drag (and no longer as a tap)
const DRAG_SLOP = 6

type Props = {
  snap: Snap
  onSnapChange: (snap: Snap) => void
  hidden?: boolean
  header: ReactNode
  children: ReactNode
  // Floats just above the sheet's top edge; children are spread left to right
  accessory?: ReactNode
  // Taller when the header carries the pin row, so that row clears the tab bar
  minHeight?: number
}

// What a gesture is doing, decided on its first move:
// sheet: resizing the sheet; scroll: native list scroll; none: horizontal (chips, cards)
type Gesture = {
  startX: number
  startY: number
  startH: number
  lastY: number
  lastT: number
  v: number
  h: number | null
  inContent: boolean
  mode: 'pending' | 'sheet' | 'scroll' | 'none'
  dragged: boolean
}

// Native-style sheet that fills its positioned parent. Drag anywhere on it:
// - not fully open: dragging moves the sheet (the list doesn't scroll yet)
// - fully open: the list scrolls; once it's at the top, dragging down moves the sheet
export function BottomSheet({ snap, onSnapChange, hidden, header, children, accessory, minHeight = MIN_HEIGHT }: Props) {
  const boundsRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [parentHeight, setParentHeight] = useState(0)
  const [dragHeight, setDragHeight] = useState<number | null>(null)
  const gesture = useRef<Gesture | null>(null)
  const suppressClick = useRef(false)
  const mouseHandlers = useRef<{ down: (e: PointerEvent) => void } | null>(null)

  useEffect(() => {
    const el = boundsRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setParentHeight(el.clientHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const heights: Record<Snap, number> = {
    min: minHeight,
    half: Math.max(minHeight, Math.round(parentHeight * 0.5)),
    full: Math.max(minHeight, parentHeight - TOP_GAP),
  }
  const height = dragHeight ?? heights[snap]

  // Latest values for the native listeners, which are attached once
  const latest = useRef({ heights, snap, height, onSnapChange })
  useEffect(() => {
    latest.current = { heights, snap, height, onSnapChange }
  })

  // Collapsing puts the list back at the top
  useEffect(() => {
    if (snap !== 'full' && scrollRef.current) scrollRef.current.scrollTop = 0
  }, [snap])

  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return

    function begin(x: number, y: number, t: number, target: EventTarget | null) {
      suppressClick.current = false
      gesture.current = {
        startX: x,
        startY: y,
        startH: latest.current.height,
        lastY: y,
        lastT: t,
        v: 0,
        h: null,
        inContent: !!scrollRef.current?.contains(target as Node),
        mode: 'pending',
        dragged: false,
      }
    }

    function move(x: number, y: number, t: number, prevent: () => void, cancelable: boolean) {
      const g = gesture.current
      if (!g) return
      const { heights, snap } = latest.current
      const scrollTop = scrollRef.current?.scrollTop ?? 0
      const dx = x - g.startX
      const dy = y - g.startY

      if (g.mode === 'pending') {
        // Below full, the list must not start a native scroll while we decide
        if (g.inContent && snap !== 'full' && cancelable) prevent()
        if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return
        if (Math.abs(dx) > Math.abs(dy)) g.mode = 'none'
        else if (!g.inContent || snap !== 'full') g.mode = 'sheet'
        else if (scrollTop <= 0 && dy > 0) g.mode = 'sheet'
        else g.mode = 'scroll'
      }

      // Scrolled back to the top and still pulling down: hand off to the sheet
      if (g.mode === 'scroll') {
        if (scrollTop <= 0 && y > g.lastY && cancelable) {
          g.mode = 'sheet'
          g.startY = y
          g.startH = heights.full
        } else {
          g.lastY = y
          g.lastT = t
          return
        }
      }

      if (g.mode !== 'sheet') return
      if (cancelable) prevent()
      const dt = t - g.lastT
      if (dt > 0) g.v = (y - g.lastY) / dt
      g.lastY = y
      g.lastT = t
      if (Math.abs(y - g.startY) > DRAG_SLOP) g.dragged = true
      g.h = Math.min(heights.full, Math.max(heights.min * 0.8, g.startH - (y - g.startY)))
      setDragHeight(g.h)
    }

    function end() {
      const g = gesture.current
      gesture.current = null
      if (!g) return
      if (g.dragged) suppressClick.current = true
      if (g.mode !== 'sheet' || g.h === null) return setDragHeight(null)

      const { heights, snap, onSnapChange } = latest.current
      let target: Snap
      if (Math.abs(g.v) > 0.5) {
        // Flick: one snap in the flick direction (negative v = upward)
        const step = g.v < 0 ? 1 : -1
        target = SNAPS[Math.min(SNAPS.length - 1, Math.max(0, SNAPS.indexOf(snap) + step))]
      } else {
        const h = g.h
        target = SNAPS.reduce((best, s) => (Math.abs(heights[s] - h) < Math.abs(heights[best] - h) ? s : best))
      }
      setDragHeight(null)
      onSnapChange(target)
    }

    // Touch: native listeners so touchmove can cancel the list's own scroll
    const onTouchStart = (e: TouchEvent) => {
      const p = e.touches[0]
      begin(p.clientX, p.clientY, e.timeStamp, e.target)
    }
    const onTouchMove = (e: TouchEvent) => {
      const p = e.touches[0]
      move(p.clientX, p.clientY, e.timeStamp, () => e.preventDefault(), e.cancelable)
    }
    sheet.addEventListener('touchstart', onTouchStart, { passive: true })
    sheet.addEventListener('touchmove', onTouchMove, { passive: false })
    sheet.addEventListener('touchend', end)
    sheet.addEventListener('touchcancel', end)

    // Mouse (desktop testing): same logic via window listeners
    mouseHandlers.current = {
      down: (e) => {
        begin(e.clientX, e.clientY, e.timeStamp, e.target)
        const onMove = (ev: globalThis.PointerEvent) => move(ev.clientX, ev.clientY, ev.timeStamp, () => ev.preventDefault(), true)
        const onUp = () => {
          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerup', onUp)
          end()
        }
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
      },
    }

    return () => {
      sheet.removeEventListener('touchstart', onTouchStart)
      sheet.removeEventListener('touchmove', onTouchMove)
      sheet.removeEventListener('touchend', end)
      sheet.removeEventListener('touchcancel', end)
    }
  }, [])

  function onPointerDown(e: PointerEvent) {
    if (e.pointerType === 'mouse' && e.button === 0) mouseHandlers.current?.down(e)
  }

  // A drag shouldn't also tap whatever row it started on
  function onClickCapture(e: MouseEvent) {
    if (!suppressClick.current) return
    suppressClick.current = false
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div ref={boundsRef} className="pointer-events-none absolute inset-0 z-10">
      <div
        ref={sheetRef}
        onPointerDown={onPointerDown}
        onClickCapture={onClickCapture}
        className={cn(
          // Bottom padding matches the floating tab bar (h-16) plus its inset (same 1rem as the bar's px-4),
          // so the list ends on the sheet background instead of sliding out under the bar.
          'pointer-events-auto absolute inset-x-0 bottom-0 flex flex-col rounded-t-3xl border-t bg-background pb-[calc(4rem+max(env(safe-area-inset-bottom),1rem))] shadow-[0_-4px_24px_rgba(0,0,0,0.08)]',
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
        <div className="shrink-0 cursor-grab select-none active:cursor-grabbing">
          <div className="mx-auto mt-2 mb-3 h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          {header}
        </div>
        {/* Scrolls only when fully open. A little air so the last card isn't flush with the tab bar. */}
        <div
          ref={scrollRef}
          className={cn('min-h-0 flex-1 overscroll-contain pb-4', snap === 'full' && dragHeight === null ? 'overflow-y-auto' : 'overflow-hidden')}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
