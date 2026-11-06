import { useEffect, useRef } from 'react'
import { ShapeSticker } from '@/components/shape-art'
import { pinById } from '@/data/la28'
import { buzz, landFlight, useFlight } from './state'

// The Passport button on the map marks itself with this, so a pin knows where to fly
export const PASSPORT_TARGET = 'data-passport-target'

// A just-collected pin flying into the Passport: it rises from the middle of the map, arcs
// over and drops into the Passport button, which catches it. Mounted once, over everything.
export function PinFlight() {
  const flight = useFlight()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!flight || !el) return
    let frame = 0
    let anim: Animation | null = null
    let tries = 0
    // Wait for the map (and its Passport button) to be on screen
    const launch = () => {
      const target = document.querySelector(`[${PASSPORT_TARGET}]`)
      const box = target?.getBoundingClientRect()
      if (!box || box.width === 0) {
        if (tries++ < 120) frame = requestAnimationFrame(launch)
        else landFlight()
        return
      }
      const w = window.innerWidth
      const h = window.innerHeight
      const size = 112
      const start = { x: w / 2 - size / 2, y: h * 0.42 - size / 2 }
      const end = { x: box.left + box.width / 2 - size / 2, y: box.top + box.height / 2 - size / 2 }
      // Up and over, then down into the button
      const peak = { x: (start.x + end.x) / 2 - w * 0.08, y: Math.min(start.y, end.y) - h * 0.18 }
      anim = el.animate(
        [
          { transform: `translate(${start.x}px, ${start.y}px) scale(0.4) rotate(0deg)`, opacity: 0, offset: 0 },
          { transform: `translate(${start.x}px, ${start.y - 16}px) scale(1.15) rotate(-6deg)`, opacity: 1, offset: 0.22 },
          { transform: `translate(${peak.x}px, ${peak.y}px) scale(0.8) rotate(12deg)`, opacity: 1, offset: 0.62 },
          { transform: `translate(${end.x}px, ${end.y}px) scale(0.22) rotate(24deg)`, opacity: 0.9, offset: 1 },
        ],
        { duration: 1300, easing: 'cubic-bezier(0.45, 0, 0.25, 1)', fill: 'forwards', delay: 350 },
      )
      anim.onfinish = () => {
        buzz(15)
        landFlight()
      }
    }
    frame = requestAnimationFrame(launch)
    return () => {
      cancelAnimationFrame(frame)
      anim?.cancel()
    }
  }, [flight])

  const pin = flight && pinById(flight.pinId)
  if (!pin) return null
  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed top-0 left-0 z-[60] size-28 opacity-0">
      <span className="flex size-full items-center justify-center rounded-full bg-background shadow-xl">
        <ShapeSticker shape={pin.shape} className="size-3/5 text-foreground" />
      </span>
    </div>
  )
}
