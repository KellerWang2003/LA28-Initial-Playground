import { useEffect, useLayoutEffect, useRef, useState, type AnimationEvent, type CSSProperties, type ReactNode } from 'react'
import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SECTIONS, bookmarkOf, type BookPage, type Bookmark } from './book-pages'
import { PAGE_H, PAGE_W, patternCss, styleById, useLook, type StyleId } from './look'

// A page lifting (or laying back down): `leaf` turns over `under`, its lift going from `from`
// to `to` (0 flat, 1 edge-on), and when it's done the book rests on `then`
type Motion = { leaf: number; under: number; from: number; to: number; timing: string; then: number }

// A horizontal drag longer than this turns the page
const SWIPE_PX = 40
// Room under the page for the bookmarks, in page units
const TAB_H = 44
// Never scaled up, so text stays its normal size; it only shrinks on narrow screens
const MAX_SCALE = 1
// Speed and easing for a page turn, settling after the scrubber, and the cover opening
const TIMING = {
  turn: '0.55s cubic-bezier(0.45, 0.05, 0.35, 1)',
  settle: '0.25s cubic-bezier(0.2, 0.7, 0.3, 1)',
  cover: '0.9s cubic-bezier(0.5, 0, 0.25, 1) 0.45s',
}

// The Passport as a booklet: one page at a time, hinged on the left spine.
// Swipe the page to turn it, tap a bookmark to jump to a section, or slide along the
// scrubber underneath to riffle through, the page following your finger.
// Pages are a fixed size, scaled to fit the space, so stickers stay where they were put.
export function PassportBook({
  pages,
  startAt,
  closed,
  locked = false,
  renderPage,
  renderOverlay,
  onPage,
}: {
  pages: BookPage[]
  startAt: number
  // Start shut, then swing the cover open on its own
  closed: boolean
  // Customizing: stay on this page
  locked?: boolean
  renderPage: (page: BookPage, jump: (to: Bookmark) => void) => ReactNode
  // Drawn over the whole sheet, not scrolled with it (stickers)
  renderOverlay?: (page: BookPage) => ReactNode
  onPage?: (index: number) => void
}) {
  const [page, setPage] = useState(startAt)
  const [motion, setMotion] = useState<Motion | null>(null)
  // Where a finger on the scrubber has the book, in pages (fractional), while it's down
  const [scrub, setScrub] = useState<number | null>(null)
  // The cover: out of the way, lying shut on the pages, or swinging between (0 shut, 1 open)
  const [cover, setCover] = useState<'open' | 'closed' | Exclude<Lift, number>>(closed ? { from: 0, to: 1, timing: TIMING.cover } : 'open')
  const { stage, scale } = useFitScale(PAGE_W, PAGE_H + TAB_H)
  const swipe = useRef<{ x: number; y: number } | null>(null)
  // A swipe that ends on a tile shouldn't also open it
  const swiped = useRef(false)

  const last = pages.length - 1
  const current = Math.min(page, last)
  const shown = scrub !== null ? Math.max(0, Math.round(scrub)) : current
  // Where the scrubber sits at rest: the cover's tick when shut
  const rest = cover === 'closed' ? -1 : current

  function goTo(target: number) {
    if (cover !== 'open' || locked || motion || scrub !== null || target === current || target < 0 || target > last) return
    // Forward lifts this page off the next; back lays the earlier page down over this one
    const forward = target > current
    setMotion({
      leaf: forward ? current : target,
      under: forward ? target : current,
      from: forward ? 0 : 1,
      to: forward ? 1 : 0,
      timing: TIMING.turn,
      then: target,
    })
    setPage(target)
  }

  // Back past the first page: the cover swings shut over it
  function closeBook() {
    if (cover !== 'open' || locked || motion || scrub !== null || current !== 0) return
    setCover({ from: 1, to: 0, timing: TIMING.turn })
  }

  // Open a shut book, onto the page it was left on (or `at`)
  function openBook(at = current) {
    if (cover !== 'closed') return
    setPage(Math.min(Math.max(at, 0), last))
    setCover({ from: 0, to: 1, timing: TIMING.turn })
  }

  // Anywhere in the book, from any state: -1 is the cover
  function go(target: number) {
    if (target < 0) closeBook()
    else if (cover === 'closed') openBook(target)
    else goTo(target)
  }

  // Finger lifted off the scrubber: finish turning to the nearest page (or open or shut the cover)
  function settle(at: number) {
    setScrub(null)
    if (at < 0) {
      // Between the cover and the first page
      const lift = 1 + at
      setPage(0)
      setCover({ from: lift, to: lift >= 0.5 ? 1 : 0, timing: TIMING.settle })
      return
    }
    setCover('open')
    const i = Math.min(Math.floor(at), last)
    const lift = at - i
    const to = lift >= 0.5 ? 1 : 0
    const target = Math.min(i + to, last)
    setPage(target)
    if (lift > 0) setMotion({ leaf: i, under: i + 1, from: lift, to, timing: TIMING.settle, then: target })
  }

  useEffect(() => {
    onPage?.(current)
  }, [current, onPage])

  const jump = (to: Bookmark) => go(pages.findIndex((p) => p.kind === to))

  // What's on screen: a page resting, a page turning on its own, or one following the scrubber,
  // and the cover if it's anywhere but out of the way
  let under = current
  let leaf: { index: number; lift: Lift } | null = null
  let coverLift: Lift | null = cover === 'open' ? null : cover === 'closed' ? 0 : cover
  if (scrub !== null && scrub < 0) {
    under = 0
    coverLift = 1 + scrub
  } else if (scrub !== null) {
    coverLift = null
    const i = Math.min(Math.floor(scrub), last)
    const lift = scrub - i
    if (lift > 0) {
      under = i + 1
      leaf = { index: i, lift }
    } else under = i
  } else if (motion) {
    under = motion.under
    leaf = { index: motion.leaf, lift: { from: motion.from, to: motion.to, timing: motion.timing } }
  }

  const sheet = (i: number) => (
    <Paper number={i + 1} label={label(pages[i])} overlay={renderOverlay?.(pages[i])}>
      {renderPage(pages[i], jump)}
    </Paper>
  )
  const back = <span className="absolute inset-0 rounded-l-2xl rounded-r-md border bg-muted" />

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={stage} className="flex min-h-0 flex-1 items-center justify-center px-3 py-3">
        {/* Takes the scaled size in the layout; the booklet inside is drawn at page size and scaled */}
        <div
          className="relative shrink-0 transition-[width,height] duration-300"
          style={{ width: PAGE_W * scale, height: (PAGE_H + TAB_H) * scale }}
        >
          <div
            className="absolute top-0 left-0 origin-top-left touch-pan-y transition-transform duration-300 select-none"
            style={{ width: PAGE_W, height: PAGE_H + TAB_H, transform: `scale(${scale})` }}
            onPointerDown={(e) => {
              swipe.current = locked ? null : { x: e.clientX, y: e.clientY }
              swiped.current = false
            }}
            onPointerUp={(e) => {
              const start = swipe.current
              swipe.current = null
              if (!start) return
              const dx = e.clientX - start.x
              const dy = e.clientY - start.y
              if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy)) return
              swiped.current = true
              if (dx < 0) go(cover === 'closed' ? current : current + 1)
              else go(cover === 'closed' ? -1 : current - 1)
            }}
            onPointerCancel={() => (swipe.current = null)}
            onClickCapture={(e) => {
              if (!swiped.current) return
              swiped.current = false
              e.stopPropagation()
              e.preventDefault()
            }}
          >
            {/* Behind the page, so the page's edge covers where they're tucked in */}
            <Bookmarks active={bookmarkOf(pages[shown])} disabled={locked} onPick={jump} />

            <div className="absolute inset-x-0 top-0 perspective-[1800px]" style={{ height: PAGE_H }}>
              {/* Page edges: the rest of the booklet under this page */}
              <span aria-hidden className="absolute inset-0 translate-x-1 translate-y-1 rounded-r-2xl rounded-l-md border bg-muted" />
              <div className="absolute inset-0">
                {sheet(under)}
                {/* The turning page's (or cover's) shadow: lifts off as it's revealed, falls as it's covered */}
                {(leaf ?? coverLift !== null) && (
                  <span
                    key={leaf ? (motion ? `${motion.leaf}-${motion.from}-${motion.to}` : 'scrub') : `cover-${JSON.stringify(coverLift)}`}
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-20 rounded-r-2xl rounded-l-md bg-linear-to-r from-black/25 via-black/10 to-transparent"
                    style={liftStyle(leaf ? leaf.lift : coverLift!, 'under-shade')}
                  />
                )}
              </div>
              {leaf && (
                <Leaf
                  key={motion ? `${motion.leaf}-${motion.from}-${motion.to}` : 'scrub'}
                  lift={leaf.lift}
                  onDone={() => {
                    setPage(motion!.then)
                    setMotion(null)
                  }}
                  back={back}
                >
                  {sheet(leaf.index)}
                </Leaf>
              )}
              {coverLift !== null && (
                <Leaf
                  key={typeof coverLift === 'number' ? 'cover' : `cover-${coverLift.from}-${coverLift.to}`}
                  lift={coverLift}
                  onDone={() => setCover(typeof coverLift !== 'number' && coverLift.to === 0 ? 'closed' : 'open')}
                  back={back}
                >
                  {/* Shut: tap to open */}
                  <button type="button" aria-label="Open passport" disabled={cover !== 'closed'} onClick={() => openBook()} className="absolute inset-0">
                    <Cover />
                  </button>
                </Leaf>
              )}
            </div>
          </div>
        </div>
      </div>

      {!locked && (
        <Scrubber
          pages={pages}
          at={rest}
          // Not while the cover is mid-swing on its own
          ready={cover === 'open' || cover === 'closed'}
          onStart={() => setMotion(null)}
          onMove={setScrub}
          onEnd={settle}
          onTap={go}
        />
      )}
    </div>
  )
}

// How far a page is lifted: a fixed amount (following a finger), or animating from one to another
type Lift = number | { from: number; to: number; timing: string }

// The turn and its shading: set straight from a finger's lift, or animated with keyframes
// driven by --lift-from / --lift-to (index.css)
function liftStyle(lift: Lift, keyframes: 'leaf-turn' | 'leaf-shade' | 'under-shade'): CSSProperties {
  if (typeof lift === 'number') {
    if (keyframes === 'leaf-turn') return { transform: `rotateY(${lift * -95}deg)` }
    return { opacity: keyframes === 'leaf-shade' ? lift : 1 - lift }
  }
  const vars = { '--lift-from': lift.from, '--lift-to': lift.to } as CSSProperties
  return { ...vars, animation: `${keyframes} ${lift.timing} both` }
}

// Finger travel per page on the scrubber, in px. Ticks sit this far apart and move with the finger.
const TICK = 40

// A strip of page edges along the bottom of the screen, like the side of a closed booklet. Slide a finger
// left to riffle forward (right to go back, and on past the first page to shut the cover): the page
// follows it, and settles on the nearest page when you let go. Tap a tick to go there.
function Scrubber({
  pages,
  at: current,
  ready,
  onStart,
  onMove,
  onEnd,
  onTap,
}: {
  pages: BookPage[]
  // Resting position: a page, or -1 for the cover
  at: number
  ready: boolean
  onStart: () => void
  onMove: (at: number) => void
  onEnd: (at: number) => void
  onTap: (index: number) => void
}) {
  // Where the strip sits while a finger is on it, in pages (fractional)
  const [drag, setDrag] = useState<{ x: number; from: number; at: number; moved: boolean } | null>(null)
  const pos = drag ? drag.at : current
  const last = pages.length - 1

  return (
    <div
      role="slider"
      aria-label="Flip through pages"
      aria-valuemin={1}
      aria-valuemax={pages.length}
      aria-valuenow={current + 1}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') onTap(current + 1)
        if (e.key === 'ArrowLeft') onTap(current - 1)
      }}
      className="relative h-11 w-full shrink-0 cursor-grab touch-none overflow-hidden select-none active:cursor-grabbing"
      // Ticks fade out toward the edges
      style={{ maskImage: 'linear-gradient(to right, transparent, black 25%, black 75%, transparent)' }}
      onPointerDown={(e) => {
        if (!ready) return
        e.currentTarget.setPointerCapture(e.pointerId)
        setDrag({ x: e.clientX, from: current, at: current, moved: false })
        onStart()
      }}
      onPointerMove={(e) => {
        if (!drag) return
        const dx = e.clientX - drag.x
        const moved = drag.moved || Math.abs(dx) > 4
        const at = Math.min(last, Math.max(-1, drag.from - dx / TICK))
        setDrag({ ...drag, at, moved })
        if (moved) onMove(at)
      }}
      onPointerUp={(e) => {
        if (drag?.moved) onEnd(drag.at)
        else if (drag) {
          // A tap: go to the tick under the finger
          const r = e.currentTarget.getBoundingClientRect()
          onTap(Math.min(last, Math.max(-1, Math.round(current + (e.clientX - (r.left + r.width / 2)) / TICK))))
        }
        setDrag(null)
      }}
      onPointerCancel={() => {
        if (drag?.moved) onEnd(drag.at)
        setDrag(null)
      }}
    >
      {/* The marker: the page you're on */}
      <span aria-hidden className="absolute top-1.5 left-1/2 z-10 h-7 w-1 -translate-x-1/2 rounded-full bg-foreground" />
      <div
        aria-hidden
        className={cn('absolute top-0 left-1/2', !drag && 'transition-transform duration-300 ease-out')}
        style={{ transform: `translateX(${-pos * TICK}px)` }}
      >
        {/* The cover, before the first page */}
        <span className="absolute top-2.5 h-5 w-1.5 -translate-x-1/2 rounded-sm bg-foreground" style={{ left: -TICK }} />
        {pages.map((p, i) => {
          // Taller tick where a section starts
          const starts = i === 0 || pages[i - 1].kind !== p.kind
          return (
            <span
              key={i}
              className={cn('absolute top-2.5 w-0.5 -translate-x-1/2 rounded-full', starts ? 'h-5 bg-foreground/60' : 'h-3 translate-y-1 bg-foreground/25')}
              style={{ left: i * TICK }}
            />
          )
        })}
      </div>
    </div>
  )
}

// Largest scale at which a `width` × `height` box fits inside the stage's padding
function useFitScale(width: number, height: number) {
  const stage = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const el = stage.current!
    const fit = () => {
      const cs = getComputedStyle(el)
      const w = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      const h = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
      setScale(Math.max(0.3, Math.min(w / width, h / height, MAX_SCALE)))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [width, height])
  return { stage, scale }
}

// One passport page on its own, outside the book, scaled to fit the space it's given
export function ScaledPage({ children }: { children: ReactNode }) {
  const { stage, scale } = useFitScale(PAGE_W, PAGE_H)
  return (
    <div ref={stage} className="flex min-h-0 flex-1 items-center justify-center px-3 py-3">
      <div className="relative shrink-0" style={{ width: PAGE_W * scale, height: PAGE_H * scale }}>
        <div className="absolute top-0 left-0 origin-top-left" style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${scale})` }}>
          {/* Page edges, as if it were still in the booklet */}
          <span aria-hidden className="absolute inset-0 translate-x-1 translate-y-1 rounded-r-2xl rounded-l-md border bg-muted" />
          {children}
        </div>
      </div>
    </div>
  )
}

function label(page: BookPage) {
  if (page.kind === 'id') return 'Passport'
  if (page.kind === 'challenges') return 'Challenges'
  if (page.kind === 'pins') return page.category.title
  return page.kind === 'batons' ? 'Batons' : 'Ticket stubs'
}

// One sheet of paper in the fan's style: its faint pattern, the spine's shadow on the left, a running footer with the page number
export function Paper({ number, label, overlay, children }: { number?: number; label: string; overlay?: ReactNode; children: ReactNode }) {
  const { style } = useLook()
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden rounded-r-2xl rounded-l-md border bg-background shadow-md">
      <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07]" style={patternCss(styleById(style).pattern, 'var(--foreground)')} />
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-linear-to-r from-foreground/10 to-transparent" />
      <div className="no-scrollbar relative min-h-0 flex-1 overflow-y-auto pt-4 pr-4 pb-2 pl-6">{children}</div>
      <div className="relative flex shrink-0 items-baseline justify-between pr-4 pb-3 pl-6 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
        <span className="truncate">{label}</span>
        <span className="tabular-nums">{number}</span>
      </div>
      {overlay}
    </div>
  )
}

// A page (or the cover) on the spine, lifted by `lift`: 0 lies flat, 1 stands edge-on.
// It darkens as it tilts away from the light.
function Leaf({ lift, onDone, back, children }: { lift: Lift; onDone: () => void; back: ReactNode; children: ReactNode }) {
  const done = (e: AnimationEvent) => e.target === e.currentTarget && typeof lift !== 'number' && onDone()
  return (
    <div className="absolute inset-0 z-20 origin-left transform-3d" style={liftStyle(lift, 'leaf-turn')} onAnimationEnd={done}>
      <div className="absolute inset-0 backface-hidden">
        {children}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-30 rounded-r-2xl rounded-l-md bg-linear-to-l from-black/40 via-black/15 to-transparent"
          style={liftStyle(lift, 'leaf-shade')}
        />
      </div>
      <div className="absolute inset-0 rotate-y-180 backface-hidden">{back}</div>
    </div>
  )
}

function Cover() {
  const { style } = useLook()
  return <CoverArt styleId={style} />
}

// The closed booklet in a given style. `small` for the style picker.
export function CoverArt({ styleId, small }: { styleId: StyleId; small?: boolean }) {
  const s = styleById(styleId)
  return (
    <span
      className={cn(
        'absolute inset-0 block overflow-hidden rounded-r-2xl rounded-l-md shadow-xl',
        small && 'rounded-r-lg rounded-l-sm shadow-md',
        s.light ? 'border bg-background text-foreground' : 'bg-primary text-primary-foreground',
      )}
    >
      <span aria-hidden className="absolute inset-0 opacity-20" style={patternCss(s.pattern, 'currentColor')} />
      <span aria-hidden className={cn('absolute inset-y-0 left-0 bg-current/10', small ? 'w-1' : 'w-3')} />
      <span aria-hidden className={cn('absolute rounded-lg border border-current/30', small ? 'inset-y-1.5 right-1.5 left-2.5 rounded-[3px]' : 'inset-y-4 right-4 left-7')} />
      <span className={cn('absolute inset-y-0 right-0 flex flex-col items-center justify-between', small ? 'left-1 py-3' : 'left-3 py-16')}>
        <span className={cn('font-heading font-bold', small ? 'text-[8px] tracking-[0.18em]' : 'text-lg tracking-[0.3em]')}>LA28</span>
        <Globe className={small ? 'size-7' : 'size-24'} strokeWidth={small ? 1.25 : 0.75} />
        <span className={cn('font-bold', small ? 'text-[6px] tracking-[0.14em]' : 'text-sm tracking-[0.25em]')}>FAN PASSPORT</span>
      </span>
    </span>
  )
}

// Ribbon tabs hanging off the bottom edge. The open one hangs lower and dark.
function Bookmarks({ active, disabled, onPick }: { active: Bookmark; disabled: boolean; onPick: (to: Bookmark) => void }) {
  return (
    <nav aria-label="Sections" className="absolute inset-x-2 flex items-start gap-1" style={{ top: PAGE_H - 10 }}>
      {SECTIONS.map((s) => {
        const on = s.id === active
        return (
          <button
            key={s.id}
            type="button"
            aria-current={on || undefined}
            disabled={disabled}
            onClick={() => onPick(s.id)}
            className={cn(
              'flex flex-auto items-end justify-center rounded-b-xl border px-2 pb-2 text-[13px] font-semibold transition-all',
              on ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              disabled && 'opacity-50',
            )}
            // Tucked 10 units under the page; the open tab hangs the full depth
            style={{ height: on ? TAB_H + 10 : TAB_H }}
          >
            {s.label}
          </button>
        )
      })}
    </nav>
  )
}
