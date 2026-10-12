import { useSyncExternalStore, type CSSProperties } from 'react'
import type { Shape } from '@/data/la28'

// How the fan has made their Passport their own: photo, cover style and stickers on the ID page.
// In memory like the rest of the demo, so a reload resets it.

// ---- Size of one page, in page units. Sticker positions are stored in these. ----

// Drawn at about a phone's width, so text shows at its normal size
export const PAGE_W = 350
// A real passport page is 88 × 125 mm
export const PAGE_H = 497

// ---- Styles: the cover, and a faint pattern on every page ----

type Pattern = 'none' | 'stripes' | 'dots' | 'grid' | 'rings'

export type StyleId = 'classic' | 'track' | 'confetti' | 'waves' | 'blueprint' | 'paper'

export const STYLES: { id: StyleId; name: string; pattern: Pattern; light?: boolean }[] = [
  { id: 'classic', name: 'Classic', pattern: 'none' },
  { id: 'track', name: 'Track', pattern: 'stripes' },
  { id: 'confetti', name: 'Confetti', pattern: 'dots' },
  { id: 'waves', name: 'Waves', pattern: 'rings' },
  { id: 'blueprint', name: 'Blueprint', pattern: 'grid', light: true },
  { id: 'paper', name: 'Paper', pattern: 'none', light: true },
]

export const styleById = (id: StyleId) => STYLES.find((s) => s.id === id)!

// A pattern drawn in `color` (a theme token), for a layer whose opacity sets its strength
export function patternCss(pattern: Pattern, color: string): CSSProperties {
  switch (pattern) {
    case 'stripes':
      return { backgroundImage: `repeating-linear-gradient(135deg, ${color} 0 1.5px, transparent 1.5px 9px)` }
    case 'dots':
      return { backgroundImage: `radial-gradient(${color} 1.3px, transparent 1.7px)`, backgroundSize: '11px 11px' }
    case 'grid':
      return {
        backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
        backgroundSize: '16px 16px',
      }
    case 'rings':
      return { backgroundImage: `repeating-radial-gradient(circle at 50% 115%, transparent 0 7px, ${color} 7px 8px)` }
    default:
      return {}
  }
}

// ---- Stickers ----

export type StickerArt = { type: 'shape'; shape: Shape } | { type: 'text'; text: string }

export const STICKERS: { id: string; art: StickerArt }[] = [
  ...(['star', 'palm', 'sunset', 'waves', 'ferris-wheel', 'swimming', 'running', 'basketball', 'music', 'party', 'rocket', 'flower', 'taco', 'coffee'] as Shape[]).map(
    (shape) => ({ id: shape, art: { type: 'shape' as const, shape } }),
  ),
  ...['LA28', 'I was here', 'Go team!', 'Summer ’28'].map((text) => ({ id: `t:${text}`, art: { type: 'text' as const, text } })),
]

export const stickerById = (id: string) => STICKERS.find((s) => s.id === id)!

// One sticker on the page: center and width in page units, rotation in degrees
export type Placed = { id: string; sticker: string; x: number; y: number; size: number; rotate: number }

export const MIN_STICKER = 28
export const MAX_STICKER = 160

// ---- Store ----

type Look = { photo: string | null; style: StyleId; stickers: Placed[] }

// A couple already on, so the ID page doesn't look bare
const SEED: Look = {
  photo: null,
  style: 'classic',
  stickers: [
    { id: 'seed-star', sticker: 'star', x: 296, y: 438, size: 40, rotate: 12 },
    { id: 'seed-la28', sticker: 't:LA28', x: 84, y: 186, size: 60, rotate: -8 },
  ],
}

let look: Look = SEED
let nextId = 0
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function update(next: Look) {
  look = next
  listeners.forEach((l) => l())
}

export function useLook() {
  return useSyncExternalStore(subscribe, () => look)
}

export function setPhoto(photo: string | null) {
  update({ ...look, photo })
}

export function setStyle(style: StyleId) {
  update({ ...look, style })
}

// Lands near the middle of the page, a little crooked, on top of the rest
export function addSticker(sticker: string): string {
  const id = `s${nextId++}`
  const text = stickerById(sticker).art.type === 'text'
  const placed: Placed = {
    id,
    sticker,
    x: PAGE_W / 2 + (Math.random() - 0.5) * 60,
    y: PAGE_H * 0.45 + (Math.random() - 0.5) * 60,
    size: text ? 84 : 56,
    rotate: Math.round((Math.random() - 0.5) * 24),
  }
  update({ ...look, stickers: [...look.stickers, placed] })
  return id
}

export function moveSticker(id: string, patch: Partial<Omit<Placed, 'id' | 'sticker'>>) {
  update({ ...look, stickers: look.stickers.map((s) => (s.id === id ? { ...s, ...patch } : s)) })
}

// Picking one up puts it on top
export function raiseSticker(id: string) {
  const s = look.stickers.find((x) => x.id === id)
  if (!s || look.stickers.at(-1)?.id === id) return
  update({ ...look, stickers: [...look.stickers.filter((x) => x.id !== id), s] })
}

export function removeSticker(id: string) {
  update({ ...look, stickers: look.stickers.filter((s) => s.id !== id) })
}
