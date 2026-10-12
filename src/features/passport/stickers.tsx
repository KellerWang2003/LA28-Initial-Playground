import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { RotateCw, X } from 'lucide-react'
import { ShapeSticker } from '@/components/shape-art'
import { cn } from '@/lib/utils'
import {
  MAX_STICKER,
  MIN_STICKER,
  PAGE_H,
  PAGE_W,
  moveSticker,
  raiseSticker,
  removeSticker,
  stickerById,
  useLook,
  type Placed,
  type StickerArt,
} from './look'

// The art for one sticker, filling its box's width
export function StickerArtView({ art, className }: { art: StickerArt; className?: string }) {
  if (art.type === 'shape') return <ShapeSticker shape={art.shape} className={cn('aspect-square w-full text-foreground', className)} />
  return (
    <span
      className={cn(
        'flex w-full items-center justify-center rounded-full border-2 border-foreground bg-background px-[0.6em] py-[0.25em] text-center font-heading leading-none font-black whitespace-nowrap uppercase shadow-md',
        className,
      )}
      // Text scales with the sticker
      style={{ fontSize: 'calc(var(--sticker-w) / 6)' }}
    >
      {art.text}
    </span>
  )
}

type Drag =
  | { mode: 'move'; id: string; dx: number; dy: number }
  // Resize and rotate from the corner handle: compared with where the handle started
  | { mode: 'turn'; id: string; size: number; rotate: number; dist: number; angle: number }

// Stickers on the ID page. Inert while reading; in Customize, drag to move, the corner to
// resize and turn, the × to peel one off.
export function StickerLayer({ editing, selected, onSelect }: { editing: boolean; selected: string | null; onSelect: (id: string | null) => void }) {
  const { stickers } = useLook()
  const layer = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)

  // Pointer position in page units (the book may be scaled)
  function toPage(e: ReactPointerEvent) {
    const r = layer.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * PAGE_W, y: ((e.clientY - r.top) / r.height) * PAGE_H }
  }

  function startMove(e: ReactPointerEvent, s: Placed) {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = toPage(e)
    drag.current = { mode: 'move', id: s.id, dx: s.x - p.x, dy: s.y - p.y }
    raiseSticker(s.id)
    onSelect(s.id)
  }

  function startTurn(e: ReactPointerEvent, s: Placed) {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = toPage(e)
    drag.current = { mode: 'turn', id: s.id, size: s.size, rotate: s.rotate, dist: Math.hypot(p.x - s.x, p.y - s.y), angle: Math.atan2(p.y - s.y, p.x - s.x) }
  }

  function onMove(e: ReactPointerEvent) {
    const d = drag.current
    if (!d) return
    const p = toPage(e)
    if (d.mode === 'move') {
      moveSticker(d.id, { x: clamp(p.x + d.dx, 0, PAGE_W), y: clamp(p.y + d.dy, 0, PAGE_H) })
    } else {
      const s = stickers.find((x) => x.id === d.id)
      if (!s) return
      const dist = Math.hypot(p.x - s.x, p.y - s.y)
      const angle = Math.atan2(p.y - s.y, p.x - s.x)
      moveSticker(d.id, {
        size: clamp((d.size * dist) / Math.max(d.dist, 1), MIN_STICKER, MAX_STICKER),
        rotate: Math.round(d.rotate + ((angle - d.angle) * 180) / Math.PI),
      })
    }
  }

  const end = () => (drag.current = null)

  return (
    <div
      ref={layer}
      className={cn('absolute inset-0 z-10', !editing && 'pointer-events-none')}
      // Tapping bare paper puts the selected sticker down
      onPointerDown={() => editing && onSelect(null)}
    >
      {stickers.map((s) => {
        const on = editing && s.id === selected
        return (
          <div
            key={s.id}
            className={cn('absolute touch-none', editing && 'cursor-grab active:cursor-grabbing')}
            style={{
              left: s.x,
              top: s.y,
              width: s.size,
              transform: `translate(-50%, -50%) rotate(${s.rotate}deg)`,
              ['--sticker-w' as string]: `${s.size}px`,
            }}
            onPointerDown={editing ? (e) => startMove(e, s) : undefined}
            onPointerMove={onMove}
            onPointerUp={end}
            onPointerCancel={end}
          >
            <StickerArtView art={stickerById(s.sticker).art} />
            {on && (
              <>
                <span aria-hidden className="pointer-events-none absolute -inset-2 rounded-lg border-2 border-dashed border-foreground/60" />
                <button
                  type="button"
                  aria-label="Remove sticker"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    removeSticker(s.id)
                    onSelect(null)
                  }}
                  className="absolute -top-5 -left-5 flex size-7 items-center justify-center rounded-full bg-foreground text-background shadow"
                >
                  <X className="size-4" />
                </button>
                {/* Its moves bubble up to the sticker's own handlers */}
                <span
                  aria-label="Resize and turn"
                  className="absolute -right-5 -bottom-5 flex size-7 touch-none items-center justify-center rounded-full border-2 border-foreground bg-background shadow"
                  onPointerDown={(e) => startTurn(e, s)}
                >
                  <RotateCw className="size-3.5" />
                </span>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
