import { useEffect, useRef, useState } from 'react'
import { flag } from '@/data/la28'
import { cn } from '@/lib/utils'
import { COUNTRY_NAME, DOT, TEAM_CC, blobLabel, groupOf, layout, type Grouping, type Person, type Team } from './crowd'

// Everyone going, as bubbles. Grouping pulls them into blobs that grow with how
// many are in them; switching grouping sends every bubble flying to its new blob.
// Tap a blob or a bubble to hear a little about it.

export type Picked = { kind: 'blob'; key: string } | { kind: 'person'; id: string } | null

export function CrowdStage({
  people,
  by,
  picked,
  onPick,
  arriving,
}: {
  people: Person[]
  by: Grouping
  picked: Picked
  onPick: (p: Picked) => void
  // Your bubble drops in from above, as if you just joined
  arriving: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 360, h: 320 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const { bubbles, blobs } = layout(people, by, size.w, size.h)
  // A tapped blob lifts its own bubbles and fades the rest
  const dimmed = (p: Person) => picked?.kind === 'blob' && groupOf(p, by) !== picked.key
  const card = picked?.kind === 'person' ? people.find((p) => p.id === picked.id) : undefined

  return (
    <div ref={ref} className="relative h-full w-full" onClick={() => onPick(null)}>
      {blobs.map((b) => {
        const on = picked?.kind === 'blob' && picked.key === b.key
        return (
          <button
            key={`${by}:${b.key}`}
            type="button"
            aria-label={`${blobLabel(b.key, by)}, ${b.count}`}
            onClick={(e) => {
              e.stopPropagation()
              onPick(on ? null : { kind: 'blob', key: b.key })
            }}
            className={cn(
              'absolute animate-blob-in rounded-full border-2 bg-card transition-[border-color,opacity] duration-200',
              on ? 'border-foreground' : 'border-transparent',
              picked?.kind === 'blob' && !on && 'opacity-30',
            )}
            style={{ left: b.x - b.r, top: b.y - b.r, width: b.r * 2, height: b.r * 2 }}
          >
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-background px-2 py-0.5 text-[11px] leading-none font-semibold whitespace-nowrap shadow-sm tabular-nums">
              {blobBadge(b.key, by)} {b.count}
            </span>
          </button>
        )
      })}

      {people.map((p, i) => {
        const at = bubbles[p.id]
        if (!at) return null
        const on = picked?.kind === 'person' && picked.id === p.id
        return (
          <button
            key={p.id}
            type="button"
            aria-label={p.you ? 'You' : `A fan from ${COUNTRY_NAME[p.cc] ?? p.cc}`}
            onClick={(e) => {
              e.stopPropagation()
              onPick(on ? null : { kind: 'person', id: p.id })
            }}
            className={cn('absolute top-0 left-0 transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.34,1.3,0.5,1)]', dimmed(p) && 'opacity-25')}
            style={{ transform: `translate(${at.x - DOT / 2}px, ${at.y - DOT / 2}px)`, transitionDelay: `${(i % 9) * 18}ms`, width: DOT, height: DOT }}
          >
            <span
              className={cn(
                'flex size-full items-center justify-center rounded-full text-base leading-none shadow-sm transition-transform duration-200 active:scale-90',
                p.you ? 'bg-foreground text-[10px] font-bold text-background' : 'bg-background',
                on && 'scale-125 ring-2 ring-foreground',
                p.you && arriving && 'animate-you-drop',
              )}
            >
              {p.you ? 'You' : flag(p.cc)}
            </span>
            {p.host && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-1 text-[8px] leading-3 font-semibold text-background">Host</span>}
          </button>
        )
      })}
      {card && bubbles[card.id] && <PersonCard person={card} x={bubbles[card.id].x} y={bubbles[card.id].y} width={size.w} />}
    </div>
  )
}

// A tapped bubble: where they're from, age, team and languages, no words around them
function PersonCard({ person, x, y, width }: { person: Person; x: number; y: number; width: number }) {
  const w = 184
  const left = Math.min(width - w - 8, Math.max(8, x - w / 2))
  const above = y > 90
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute z-10 flex animate-in items-center gap-2 rounded-2xl bg-foreground px-3 py-2 text-background shadow-lg duration-200 fade-in zoom-in-95"
      style={{ left, width: w, top: above ? y - DOT / 2 - 52 : y + DOT / 2 + 8 }}
    >
      <span className="text-2xl leading-none">{flag(person.cc)}</span>
      <span className="text-sm font-semibold whitespace-nowrap tabular-nums">{person.age}</span>
      <span className="ml-auto flex items-center gap-1.5">
        <span className="text-lg leading-none">{person.team === 'none' ? '⚽' : flag(TEAM_CC[person.team])}</span>
        <span className="flex gap-0.5">
          {person.langs.slice(0, 2).map((l) => (
            <span key={l} className="rounded bg-background/15 px-1 text-[10px] font-semibold uppercase">
              {LANG_CODE[l] ?? l.slice(0, 2)}
            </span>
          ))}
        </span>
      </span>
    </div>
  )
}

const LANG_CODE: Record<string, string> = { Portuguese: 'PT', Arabic: 'AR', French: 'FR', English: 'EN', Spanish: 'ES', Japanese: 'JA', Korean: 'KO', Chinese: 'ZH', German: 'DE' }

function blobBadge(key: string, by: Grouping) {
  if (by === 'country') return flag(key)
  if (by === 'team') return key === 'none' ? '⚽' : flag(TEAM_CC[key as Team])
  return key
}
