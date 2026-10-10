import { useSyncExternalStore } from 'react'
import { photoSrc } from '@/components/place-photo'
import { SEED_COLLECTED } from '@/lib/collected'

export type PinPhoto = { id: string; src: string; when: string }

const pool = ['/camera/sunset.jpg', '/camera/beach.jpg', '/camera/pier.jpg', '/camera/downtown.jpg', '/camera/stadium.jpg', '/camera/lamps.jpg']

// Pins collected before today come with the photo that collected them, plus a
// couple more from the visit, so the Passport has something to show.
function seed(): Record<string, PinPhoto[]> {
  const out: Record<string, PinPhoto[]> = {}
  SEED_COLLECTED.forEach((pinId, i) => {
    const extra = i % 3
    out[pinId] = [
      { id: `${pinId}-0`, src: photoSrc(pinId), when: 'Collected' },
      ...Array.from({ length: extra }, (_, j) => ({ id: `${pinId}-${j + 1}`, src: pool[(i + j + 1) % pool.length], when: 'Added later' })),
    ]
  })
  return out
}

// In-memory only, like the collected pins: a reload resets the demo.
let photos: Record<string, PinPhoto[]> = seed()
const EMPTY: PinPhoto[] = []
const listeners = new Set<() => void>()
let nextId = 0

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit() {
  listeners.forEach((l) => l())
}

export function usePinPhotos(pinId: string) {
  return useSyncExternalStore(subscribe, () => photos[pinId] ?? EMPTY)
}

// The photo taken to collect the pin goes first
export function addCapturePhoto(pinId: string) {
  if (photos[pinId]?.length) return
  photos = { ...photos, [pinId]: [{ id: `${pinId}-capture`, src: photoSrc(pinId), when: 'Collected' }] }
  emit()
}

// Photos picked from the camera roll. They live as object URLs for the session.
export function addPinPhotos(pinId: string, files: FileList | File[]) {
  const added = [...files]
    .filter((f) => f.type.startsWith('image/'))
    .map((f) => ({ id: `${pinId}-u${nextId++}`, src: URL.createObjectURL(f), when: 'Just now' }))
  if (!added.length) return
  photos = { ...photos, [pinId]: [...(photos[pinId] ?? []), ...added] }
  emit()
}

export function removePinPhoto(pinId: string, photoId: string) {
  const photo = photos[pinId]?.find((p) => p.id === photoId)
  if (!photo) return
  if (photo.src.startsWith('blob:')) URL.revokeObjectURL(photo.src)
  photos = { ...photos, [pinId]: photos[pinId].filter((p) => p.id !== photoId) }
  emit()
}
