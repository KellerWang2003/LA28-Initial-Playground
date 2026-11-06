import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Camera, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShapeSticker } from '@/components/shape-art'
import { CustomPin } from '@/components/place-photo'
import { MarkRow } from '@/components/bonus-list'
import { PinPhotos } from '@/components/pin-photos'
import { useBonusMarks } from '@/lib/bonuses'
import { usePinPhotos } from '@/lib/pin-photos'
import { cn } from '@/lib/utils'
import { bonusesFor } from '@/data/bonuses'
import { placeById, type Pin } from '@/data/la28'

export function PinTile({
  pin,
  have,
  custom,
  highlight,
  onOpen,
}: {
  pin: Pin
  have: boolean
  custom?: boolean
  // Just collected: pop it so the fan spots it on the page
  highlight?: boolean
  onOpen: () => void
}) {
  const photos = usePinPhotos(pin.id)
  return (
    <button type="button" onClick={onOpen} className="relative flex flex-col items-center gap-1 text-center transition-transform active:scale-95">
      {have && photos.length > 0 && (
        <span
          aria-label={`${photos.length} photos`}
          className="absolute top-1 right-1 z-10 flex items-center gap-0.5 rounded-full bg-background px-1.5 py-px text-[10px] font-semibold tabular-nums shadow-sm"
        >
          <Camera className="size-2.5" />
          {photos.length}
        </span>
      )}
      <span
        className={cn(
          'flex aspect-square w-full items-center justify-center rounded-2xl',
          have ? 'bg-muted' : 'border border-dashed',
          highlight && 'animate-pin-pop ring-2 ring-foreground ring-offset-2 ring-offset-background',
        )}
      >
        {have && custom ? (
          <CustomPin seed={pin.id} shape={pin.shape} className="size-3/5 shadow-none" />
        ) : (
          <ShapeSticker shape={pin.shape} className={cn('size-3/5', have ? 'text-foreground' : 'text-muted-foreground/30 drop-shadow-none')} />
        )}
      </span>
      <span className={cn('line-clamp-2 text-[11px] leading-tight', have ? 'font-medium' : 'text-muted-foreground/60')}>
        {pin.name.replace(/ Pin$/, '')}
      </span>
    </button>
  )
}

// A collected pin from the Passport: the pin, then your photos from the visit
export function PinSheet({ pin, custom, onClose }: { pin: Pin; custom: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const photos = usePinPhotos(pin.id)
  const marks = useBonusMarks()
  const bonuses = bonusesFor(pin.id)
  const marked = bonuses.filter((b) => marks[b.id])
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true))
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div role="dialog" aria-modal aria-label={pin.name} className="fixed inset-0 z-40">
      <div aria-hidden onClick={onClose} className={cn('absolute inset-0 bg-black/30 transition-opacity duration-300', shown ? 'opacity-100' : 'opacity-0')} />
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-3xl border-t bg-background shadow-xl transition-transform duration-300 ease-out',
          shown ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <header className="flex shrink-0 items-center gap-3 px-4 pt-4 pb-3">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-muted">
            {custom ? (
              <CustomPin seed={pin.id} shape={pin.shape} className="size-10 shadow-none" />
            ) : (
              <ShapeSticker shape={pin.shape} className="size-9 text-foreground" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-heading font-semibold">{pin.name}</h2>
            <p className="truncate text-sm text-muted-foreground">{placeById(pin.place).name}</p>
          </div>
          <Button variant="ghost" size="icon-lg" aria-label="Close" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </header>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="text-sm font-semibold">Your photos and videos</h3>
            <span className="text-sm text-muted-foreground tabular-nums">{photos.length}</span>
          </div>
          <PinPhotos pinId={pin.id} />
          {/* Marks from bonus challenges done here */}
          {bonuses.length > 0 && (
            <>
              <div className="mt-5 mb-2 flex items-baseline justify-between">
                <h3 className="text-sm font-semibold">Bonus marks</h3>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {marked.length} of {bonuses.length}
                </span>
              </div>
              {marked.length ? (
                <MarkRow marks={marked.map((b) => marks[b.id])} className="justify-start" />
              ) : (
                <p className="text-sm text-muted-foreground">None yet. Bonuses are on the pin’s page.</p>
              )}
            </>
          )}
          <Button variant="outline" size="lg" className="mt-4 w-full" onClick={() => navigate(`/explore/pins/${pin.id}`)}>
            Pin details
            <ChevronRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  )
}
