import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ImagePlus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addPinPhotos, removePinPhoto, usePinPhotos, type PinPhoto } from '@/lib/pin-photos'
import { cn } from '@/lib/utils'

// Photos from your visit to a pin, AllTrails style: an add tile, then a grid.
// Tapping a photo opens it full screen. Used on the pin page, in the Passport,
// and right after collecting.
export function PinPhotos({ pinId, className }: { pinId: string; className?: string }) {
  const photos = usePinPhotos(pinId)
  const [open, setOpen] = useState<number | null>(null)

  return (
    <>
      <div className={cn('grid grid-cols-3 gap-1.5', className)}>
        <AddPhotosTile pinId={pinId} />
        {photos.map((p, i) => (
          <button
            key={p.id}
            type="button"
            aria-label={`Photo ${i + 1} of ${photos.length}`}
            onClick={() => setOpen(i)}
            className="aspect-square overflow-hidden rounded-xl bg-muted active:opacity-80"
          >
            <img src={p.src} alt="" className="size-full object-cover" />
          </button>
        ))}
      </div>
      {/* On the body, so a sliding sheet's transform can't shrink it */}
      {open !== null &&
        photos.length > 0 &&
        createPortal(
          <PhotoViewer
            photos={photos}
            start={Math.min(open, photos.length - 1)}
            onRemove={(id) => removePinPhoto(pinId, id)}
            onClose={() => setOpen(null)}
          />,
          document.body,
        )}
    </>
  )
}

function AddPhotosTile({ pinId }: { pinId: string }) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-muted-foreground active:bg-muted"
      >
        <ImagePlus className="size-6" />
        <span className="text-xs font-medium">Add photos</span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) addPinPhotos(pinId, e.target.files)
          e.target.value = ''
        }}
      />
    </>
  )
}

function PhotoViewer({
  photos,
  start,
  onRemove,
  onClose,
}: {
  photos: PinPhoto[]
  start: number
  onRemove: (id: string) => void
  onClose: () => void
}) {
  const strip = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(start)
  const current = photos[Math.min(index, photos.length - 1)]

  useEffect(() => {
    const el = strip.current
    if (el) el.scrollLeft = start * el.clientWidth
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // Only on open: later scrolls are the person's
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div role="dialog" aria-modal aria-label="Your photos" className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <header className="flex h-14 shrink-0 items-center justify-between px-2 pt-[env(safe-area-inset-top)]">
        <Button variant="ghost" size="icon-lg" aria-label="Close" onClick={onClose} className="text-white hover:bg-white/10 hover:text-white">
          <X className="size-5" />
        </Button>
        <span className="text-sm tabular-nums">
          {Math.min(index, photos.length - 1) + 1} / {photos.length}
        </span>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="Remove photo"
          onClick={() => {
            if (photos.length === 1) onClose()
            onRemove(current.id)
          }}
          className="text-white hover:bg-white/10 hover:text-white"
        >
          <Trash2 className="size-5" />
        </Button>
      </header>
      <div
        ref={strip}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="no-scrollbar flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
      >
        {photos.map((p) => (
          <div key={p.id} className="flex size-full shrink-0 snap-center items-center justify-center">
            <img src={p.src} alt="" className="max-h-full max-w-full object-contain" />
          </div>
        ))}
      </div>
      <p className="shrink-0 py-4 pb-[max(env(safe-area-inset-bottom),16px)] text-center text-xs text-white/60">{current.when}</p>
    </div>
  )
}
