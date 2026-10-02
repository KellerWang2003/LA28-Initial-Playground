import { Navigate, useNavigate, useParams } from 'react-router'
import { Camera, Check, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PinShape } from '@/components/pin-art'
import { collectPin, useCollected } from '@/lib/collected'
import { cn } from '@/lib/utils'
import { pinById, pinKindLabel, placeById } from '@/data/la28'

// Solo pin capture. Location is faked ("I'm here" always works) and there is
// no camera yet: the shutter button simulates the capture.
export default function PinCapturePage() {
  const { pinId = '' } = useParams()
  const navigate = useNavigate()
  const collected = useCollected()
  const pin = pinById(pinId)

  if (!pin) return <Navigate to="/explore" replace />

  const place = placeById(pin.place)
  const done = collected.includes(pin.id)

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)] pb-[max(env(safe-area-inset-bottom),16px)]">
      <header className="flex h-14 shrink-0 items-center px-2">
        <Button variant="outline" size="icon-lg" className="rounded-full" aria-label="Back" onClick={() => navigate(-1)}>
          <ChevronLeft className="size-5" />
        </Button>
      </header>

      <div className="flex shrink-0 flex-col items-center px-6 text-center">
        <div className="[perspective:600px]">
          <div className="relative">
            <PinShape shape={pin.shape} status={pin.status} collected={done} className={cn('size-32', !done && 'animate-coin-spin')} />
            {done && (
              <span className="absolute -right-1 bottom-0 flex size-10 items-center justify-center rounded-full border-4 border-background bg-foreground text-background">
                <Check className="size-5" />
              </span>
            )}
          </div>
        </div>
        <h1 className="mt-4 font-heading text-xl font-semibold">{pin.name}</h1>
        <p className="text-sm text-muted-foreground">{place.name}</p>
        <div className="mt-2 flex gap-1.5">
          <Badge variant="secondary">{pin.rarity}</Badge>
          <Badge variant="outline">{pinKindLabel[pin.kind]}</Badge>
        </div>
      </div>

      {/* Camera viewfinder goes here later */}
      <div className="mx-4 mt-5 flex min-h-0 flex-1 items-center justify-center rounded-3xl border-2 border-dashed text-sm text-muted-foreground">
        {done ? 'Stamped into your Passport' : 'Camera'}
      </div>

      <div className="flex shrink-0 justify-center gap-2 px-4 pt-4">
        {done ? (
          <>
            <Button size="lg" variant="outline" className="flex-1" onClick={() => navigate('/explore', { replace: true })}>
              Back to map
            </Button>
            <Button size="lg" className="flex-1" onClick={() => navigate('/passport')}>
              Open Passport
            </Button>
          </>
        ) : (
          <button
            type="button"
            aria-label="Capture"
            onClick={() => collectPin(pin.id)}
            className="flex size-18 items-center justify-center rounded-full border-4 bg-background shadow-md active:scale-95"
          >
            <Camera className="size-7" />
          </button>
        )}
      </div>
    </div>
  )
}
