import { useId, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { CROWD_COUNTRIES, crowdCountry } from './crowd'
import { LAND_MASK, MASK_COLS, MASK_LAT_BOTTOM, MASK_LAT_TOP, MASK_LNG_LEFT, MASK_ROWS } from './room/land-mask'

// Lightweight world map: dotted land, one marker per fixture country, optional heat.
// Stateless and tile-free. Used to display the room (heat) and to pick a country (onPick).

export type WorldMapPoint = { code: string; value: number }

type Props = {
  /** Heat per country code. Any positive scale: it is normalised to the largest value. */
  points?: WorldMapPoint[]
  /** Country code to highlight with a ring and a flag + name label */
  selected?: string
  /** Small text after the selected label, e.g. "You" */
  selectedTag?: string
  /** Makes the countries tappable (and keyboard focusable) */
  onPick?: (code: string) => void
  className?: string
}

// Heat colour: a single warm accent on an otherwise monochrome map
const HEAT = '#f97316'
// A tap picks the nearest country within this many px (Europe is crowded at 390px)
const PICK_RADIUS = 26

// Equirectangular, cropped to the mask's latitude band
function project(lat: number, lng: number) {
  const x = (((lng - MASK_LNG_LEFT) % 360) + 360) % 360 / 360
  const y = (MASK_LAT_TOP - lat) / (MASK_LAT_TOP - MASK_LAT_BOTTOM)
  return { x, y }
}

// One path of zero-length round-capped segments: thousands of dots, a single DOM node
const LAND_DOTS = (() => {
  const parts: string[] = []
  LAND_MASK.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) if (row[c] === '#') parts.push(`M${c + 0.5} ${r + 0.5}h0`)
  })
  return parts.join('')
})()

const MARKERS = CROWD_COUNTRIES.map((c) => ({ ...c, ...project(c.lat, c.lng) }))

export function WorldMap({ points, selected, selectedTag, onPick, className }: Props) {
  const gradientId = useId()
  const heat = useMemo(() => {
    const values = new Map<string, number>()
    for (const p of points ?? []) if (p.value > 0) values.set(p.code, (values.get(p.code) ?? 0) + p.value)
    const max = Math.max(0, ...values.values())
    return { values, max }
  }, [points])
  const norm = (code: string) => (heat.max > 0 ? (heat.values.get(code) ?? 0) / heat.max : 0)

  const pickAt = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onPick) return
    const rect = event.currentTarget.getBoundingClientRect()
    let best: { code: string; d: number } | undefined
    for (const m of MARKERS) {
      const d = Math.hypot(event.clientX - (rect.left + m.x * rect.width), event.clientY - (rect.top + m.y * rect.height))
      if (d <= PICK_RADIUS && (!best || d < best.d)) best = { code: m.code, d }
    }
    if (best) onPick(best.code)
  }

  const chosen = selected ? MARKERS.find((m) => m.code === selected) : undefined
  const chosenCountry = selected ? crowdCountry(selected) : undefined

  return (
    <div
      className={cn('relative w-full select-none', onPick && 'cursor-pointer', className)}
      style={{ aspectRatio: `${MASK_COLS} / ${MASK_ROWS}` }}
      onClick={pickAt}
      role={onPick ? 'group' : 'img'}
      aria-label={onPick ? 'Pick your country on the map' : 'World map of where the fans in the room are from'}
    >
      <svg viewBox={`0 0 ${MASK_COLS} ${MASK_ROWS}`} className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <radialGradient id={gradientId}>
            <stop offset="0" stopColor={HEAT} stopOpacity="0.9" />
            <stop offset="0.45" stopColor={HEAT} stopOpacity="0.4" />
            <stop offset="1" stopColor={HEAT} stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d={LAND_DOTS} stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" className="text-foreground/15" fill="none" />
        {MARKERS.map((m) => {
          const n = norm(m.code)
          if (n <= 0) return null
          const s = Math.sqrt(n)
          return <circle key={m.code} cx={m.x * MASK_COLS} cy={m.y * MASK_ROWS} r={3.6 + 8.4 * s} fill={`url(#${gradientId})`} opacity={0.5 + 0.5 * s} />
        })}
      </svg>

      {MARKERS.map((m) => {
        const n = norm(m.code)
        const hasHeat = n > 0
        const isSelected = m.code === selected
        const dot = hasHeat ? 4 + 4 * Math.sqrt(n) : 5
        const place = { left: `${m.x * 100}%`, top: `${m.y * 100}%` }
        const marker = (
          <span
            className={cn(
              'block rounded-full transition-colors',
              hasHeat ? 'bg-[#f97316] shadow-[0_0_0_1.5px_var(--background)]' : 'bg-foreground/55',
              isSelected && 'bg-foreground',
            )}
            style={{ width: dot, height: dot }}
          />
        )
        if (!onPick) {
          return (
            <span key={m.code} className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center" style={place}>
              {marker}
              {isSelected && <span className="absolute size-5 rounded-full border-2 border-foreground" />}
            </span>
          )
        }
        // Real buttons give keyboard and screen reader access; pointer taps go through the nearest-country
        // logic above, so the buttons themselves ignore the pointer.
        return (
          <button
            key={m.code}
            type="button"
            aria-label={m.name}
            aria-pressed={isSelected}
            onClick={(e) => {
              e.stopPropagation()
              onPick(m.code)
            }}
            className="pointer-events-none absolute flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={place}
          >
            {marker}
            {isSelected && <span className="absolute size-6 rounded-full border-2 border-foreground" />}
          </button>
        )
      })}

      {chosen && chosenCountry && (
        <span
          className={cn(
            'pointer-events-none absolute z-10 -translate-y-[calc(100%+14px)] whitespace-nowrap rounded-full bg-foreground px-2 py-0.5 text-xs font-medium text-background shadow-sm',
            chosen.x < 0.22 ? 'translate-x-[-12px]' : chosen.x > 0.78 ? '-translate-x-[calc(100%-12px)]' : '-translate-x-1/2',
          )}
          style={{ left: `${chosen.x * 100}%`, top: `${chosen.y * 100}%` }}
        >
          {chosenCountry.flag} {chosenCountry.name}
          {selectedTag ? ` · ${selectedTag}` : ''}
        </span>
      )}
    </div>
  )
}
