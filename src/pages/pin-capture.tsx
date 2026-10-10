import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { Camera, Check, ChevronLeft, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PinShape } from '@/components/pin-art'
import { CustomPin, PlacePhoto } from '@/components/place-photo'
import { PinPhotos } from '@/components/pin-photos'
import { BatonOffer } from '@/components/baton-offer'
import { arriveAt } from '@/lib/location'
import { collectPin, SEED_COLLECTED, useCollected, useCustomIds } from '@/lib/collected'
import { addCapturePhoto, usePinPhotos } from '@/lib/pin-photos'
import { cn } from '@/lib/utils'
import { PINS, pinById, pinKindLabel, placeById, type Pin } from '@/data/la28'
import { CHALLENGES, PIN_VALUE } from '@/data/passport'
import { BONUS_REWARD, bonusesFor, inWindow, type Bonus } from '@/data/bonuses'
import { completeBonus, momentMark } from '@/lib/bonuses'
import { BonusList } from '@/components/bonus-list'
import { useClock, usePinLocked } from '@/lib/clock'

type Step = 'camera' | 'making' | 'choose' | 'celebrate' | 'photos' | 'bonus' | 'progress'

// Photo, then a pin made from it (or the location's own pin), then the
// celebration, a chance to add more photos from the visit, today's and this
// week's tasks, and last the bonuses at this pin (if any).
export default function PinCapturePage() {
  const { pinId = '' } = useParams()
  const navigate = useNavigate()
  const collected = useCollected()
  const customIds = useCustomIds()
  const pin = pinById(pinId)
  const [step, setStep] = useState<Step>('camera')
  const [custom, setCustom] = useState(false)
  // Right moment bonuses earned by collecting inside their window
  const [moments, setMoments] = useState<Bonus[]>([])
  const now = useClock()
  const locked = usePinLocked(pin ?? PINS[0])

  if (!pin) return <Navigate to="/explore" replace />

  const place = placeById(pin.place)
  const done = collected.includes(pin.id)
  const bonuses = bonusesFor(pin.id)

  if (locked) {
    return (
      <Screen onBack={() => navigate(-1)}>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <PinShape shape={pin.shape} status={pin.status} className="size-28" />
          <h1 className="mt-4 font-heading text-xl font-semibold">{pin.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">This pin isn’t open yet.</p>
        </div>
      </Screen>
    )
  }

  // Already collected before this visit: don't replay the celebration
  if (done && step === 'camera') {
    return (
      <Screen onBack={() => navigate(-1)}>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <PinArt pin={pin} custom={customIds.includes(pin.id)} className="size-32" />
          <h1 className="mt-4 font-heading text-xl font-semibold">{pin.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            In your Passport · +{PIN_VALUE[pin.rarity]} Torches
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="lg" variant="outline" className="flex-1" onClick={() => navigate('/explore', { replace: true })}>
            Back to map
          </Button>
          <Button size="lg" className="flex-1" onClick={() => navigate('/passport', { replace: true })}>
            Open Passport
          </Button>
        </div>
      </Screen>
    )
  }

  function keep(useCustom: boolean) {
    collectPin(pin!.id, useCustom)
    addCapturePhoto(pin!.id)
    // Collecting means you're standing there, which is what a baton here checks
    arriveAt(pin!.place)
    const inside = bonuses.filter((b) => b.kind === 'moment' && inWindow(b, now))
    inside.forEach((b) => completeBonus(b.id, momentMark(b, now)))
    setMoments(inside)
    setCustom(useCustom)
    setStep('celebrate')
  }

  return (
    <Screen onBack={step === 'celebrate' || step === 'photos' || step === 'bonus' || step === 'progress' ? undefined : () => (step === 'camera' ? navigate(-1) : setStep('camera'))}>
      {step === 'camera' && <CameraStep pin={pin} placeName={place.name} onCapture={() => setStep('making')} />}
      {step === 'making' && <MakingStep pin={pin} onDone={() => setStep('choose')} />}
      {step === 'choose' && <ChooseStep pin={pin} onKeep={() => keep(true)} onDefault={() => keep(false)} />}
      {step === 'celebrate' && (
        <CelebrateStep pin={pin} placeName={place.name} custom={custom} moments={moments} onContinue={() => setStep('photos')} />
      )}
      {/* A baton resting at this spot is offered once the pin is stamped */}
      {step === 'celebrate' && <BatonOffer place={pin.place} />}
      {step === 'photos' && <PhotosStep pin={pin} onContinue={() => setStep('progress')} />}
      {step === 'progress' && (
        <ProgressStep
          onMap={() => (bonuses.length ? setStep('bonus') : navigate('/explore', { replace: true }))}
          onPassport={() => navigate('/passport', { replace: true })}
        />
      )}
      {step === 'bonus' && <BonusStep bonuses={bonuses} onLater={() => navigate('/explore', { replace: true })} />}
    </Screen>
  )
}

function Screen({ onBack, children }: { onBack?: () => void; children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col bg-background px-4 pt-[env(safe-area-inset-top)] pb-[max(env(safe-area-inset-bottom),16px)]">
      <header className="flex h-14 shrink-0 items-center -mx-2">
        {onBack && (
          <Button variant="outline" size="icon-lg" className="rounded-full" aria-label="Back" onClick={onBack}>
            <ChevronLeft className="size-5" />
          </Button>
        )}
      </header>
      {children}
    </div>
  )
}

function PinArt({ pin, custom, className }: { pin: Pin; custom: boolean; className?: string }) {
  if (custom) return <CustomPin seed={pin.id} shape={pin.shape} className={className} />
  return <PinShape shape={pin.shape} status="open" className={cn('text-foreground', className)} />
}

function CameraStep({ pin, placeName, onCapture }: { pin: Pin; placeName: string; onCapture: () => void }) {
  return (
    <>
      <div className="text-center">
        <h1 className="font-heading text-xl font-semibold">{pin.name}</h1>
        <p className="text-sm text-muted-foreground">{placeName}</p>
      </div>
      <div className="relative mx-auto mt-4 min-h-0 w-full max-w-sm flex-1 overflow-hidden rounded-3xl border">
        <PlacePhoto seed={pin.id} shape={pin.shape} className="size-full" />
      </div>
      <div className="flex shrink-0 justify-center pt-4">
        <button
          type="button"
          aria-label="Capture"
          onClick={onCapture}
          className="flex size-18 items-center justify-center rounded-full border-4 bg-background shadow-md active:scale-95"
        >
          <Camera className="size-7" />
        </button>
      </div>
    </>
  )
}

function MakingStep({ pin, onDone }: { pin: Pin; onDone: () => void }) {
  const [pinched, setPinched] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setPinched(true))
    const timer = window.setTimeout(onDone, 1700)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [onDone])

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div
        className={cn(
          'overflow-hidden border-foreground transition-all duration-1000 ease-out',
          pinched ? 'size-44 rounded-[28%] border-4' : 'h-80 w-full max-w-sm rounded-3xl border',
        )}
      >
        <PlacePhoto seed={pin.id} shape={pin.shape} className="size-full" />
      </div>
      <p className="mt-6 font-heading text-lg font-semibold">Making your pin</p>
      <p className="mt-1 text-sm text-muted-foreground">From the photo you just took</p>
    </div>
  )
}

function ChooseStep({ pin, onKeep, onDefault }: { pin: Pin; onKeep: () => void; onDefault: () => void }) {
  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <CustomPin seed={pin.id} shape={pin.shape} className="size-44 animate-pin-pop" />
        <h1 className="mt-6 font-heading text-xl font-semibold">Your pin</h1>
        <p className="mt-1 text-sm text-muted-foreground">Made from your photo of {pin.name.replace(/ Pin$/, '')}</p>
        <div className="mt-3 flex gap-1.5">
          <Badge variant="secondary">{pin.rarity}</Badge>
          <Badge variant="outline">{pinKindLabel[pin.kind]}</Badge>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2">
        <Button size="lg" className="w-full" onClick={onKeep}>
          Keep this pin
        </Button>
        <Button size="lg" variant="outline" className="w-full" onClick={onDefault}>
          <PinShape shape={pin.shape} status={pin.status} className="size-5" />
          Use the location pin
        </Button>
      </div>
    </>
  )
}

function CelebrateStep({
  pin,
  placeName,
  custom,
  moments,
  onContinue,
}: {
  pin: Pin
  placeName: string
  custom: boolean
  moments: Bonus[]
  onContinue: () => void
}) {
  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative">
          <PinArt pin={pin} custom={custom} className="size-40 animate-pin-pop" />
          <span className="absolute -right-1 bottom-1 flex size-10 items-center justify-center rounded-full border-4 border-background bg-foreground text-background">
            <Check className="size-5" />
          </span>
        </div>
        <h1 className="mt-6 font-heading text-2xl font-semibold">Pin collected</h1>
        <p className="mt-1 text-sm text-muted-foreground">{placeName}</p>
        <p className="mt-4 flex items-center gap-1 font-heading text-xl font-semibold tabular-nums">
          <Flame className="size-5 fill-current" />+<CountUp to={PIN_VALUE[pin.rarity]} />
        </p>
        <p className="text-sm text-muted-foreground">Torches</p>
        {/* Collected inside a Right moment window: that bonus comes with it */}
        {moments.map((b) => (
          <p key={b.id} className="mt-4 flex items-center gap-2 rounded-full border py-1.5 pr-3 pl-1.5 text-sm font-medium tabular-nums">
            <span className="flex size-6 items-center justify-center rounded-full bg-foreground text-background">
              <Check className="size-3.5" />
            </span>
            {b.mark} bonus
            <span className="flex items-center gap-0.5 text-muted-foreground">
              <Flame className="size-3.5 fill-current" />+{BONUS_REWARD.solo}
            </span>
          </p>
        ))}
      </div>
      <Button size="lg" className="w-full shrink-0" onClick={onContinue}>
        Continue
      </Button>
    </>
  )
}

// The capture photo is already on the pin. Add any others from the visit, or skip.
function PhotosStep({ pin, onContinue }: { pin: Pin; onContinue: () => void }) {
  const photos = usePinPhotos(pin.id)
  const added = photos.length > 1
  return (
    <>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pt-2">
        <h1 className="font-heading text-2xl font-semibold">Add photos from your visit</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          They stay with {pin.name.replace(/ Pin$/, '')} in your Passport. You can add more later.
        </p>
        <PinPhotos pinId={pin.id} className="mt-5" />
      </div>
      <Button size="lg" variant={added ? 'default' : 'outline'} className="mt-4 w-full shrink-0" onClick={onContinue}>
        {added ? 'Continue' : 'Skip for now'}
      </Button>
    </>
  )
}

// The optional challenges here. Opening one replaces the capture flow, so its
// Continue lands back on the pin.
function BonusStep({ bonuses, onLater }: { bonuses: Bonus[]; onLater: () => void }) {
  return (
    <>
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mt-auto pt-4">
          <h1 className="font-heading text-2xl font-semibold">Bonus here</h1>
          <p className="mt-1 text-sm text-muted-foreground">Optional. Each one adds Torches and a mark on your stamp.</p>
          <div className="mt-5">
            <BonusList bonuses={bonuses} replace />
          </div>
        </div>
      </div>
      <Button size="lg" variant="outline" className="mt-4 w-full shrink-0" onClick={onLater}>
        Later
      </Button>
    </>
  )
}

function ProgressStep({ onMap, onPassport }: { onMap: () => void; onPassport: () => void }) {
  const collected = useCollected()
  const todayAfter = collected.filter((id) => !SEED_COLLECTED.includes(id)).length
  const totalAfter = collected.length
  // This pin was just added, so the bar starts from the moment before it
  const todayBefore = todayAfter - 1
  const totalBefore = totalAfter - 1

  const daily = CHALLENGES.find((c) => c.id === 'd_pin')!
  const weekly = CHALLENGES.find((c) => c.id === 'w_ten')!

  return (
    <>
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="font-heading text-2xl font-semibold">Today and this week</h1>
        <div className="mt-6 space-y-3">
          <TaskMove title="Today" challenge={daily} before={todayBefore} after={todayAfter} />
          <TaskMove title="This week" challenge={weekly} before={totalBefore} after={totalAfter} />
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2">
        <Button size="lg" className="w-full" onClick={onMap}>
          Continue
        </Button>
        <Button size="lg" variant="ghost" className="w-full" onClick={onPassport}>
          See it in your Passport
        </Button>
      </div>
    </>
  )
}

function TaskMove({
  title,
  challenge,
  before,
  after,
}: {
  title: string
  challenge: (typeof CHALLENGES)[number]
  before: number
  after: number
}) {
  const goal = challenge.goal
  const justCompleted = before < goal && after >= goal
  return (
    <div className="rounded-2xl border p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</p>
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">{challenge.title}</p>
        <span className="text-xs text-muted-foreground tabular-nums">
          {Math.min(after, goal)}/{goal}
        </span>
      </div>
      <Fill from={Math.min(before, goal)} to={Math.min(after, goal)} max={goal} />
      {justCompleted && (
        <p className="mt-2 flex items-center gap-1 text-sm font-semibold tabular-nums">
          <Flame className="size-4 fill-current" />+{challenge.reward}
          <span className="font-normal text-muted-foreground">Torches added</span>
        </p>
      )}
    </div>
  )
}

function Fill({ from, to, max }: { from: number; to: number; max: number }) {
  const [value, setValue] = useState(from)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setValue(to))
    return () => cancelAnimationFrame(frame)
  }, [to])
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-foreground transition-[width] duration-700 ease-out"
        style={{ width: `${max === 0 ? 0 : Math.min(100, (value / max) * 100)}%` }}
      />
    </div>
  )
}

function CountUp({ from = 0, to }: { from?: number; to: number }) {
  const [n, setN] = useState(from)
  useEffect(() => {
    const start = performance.now()
    const duration = 700
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      setN(Math.round(from + (to - from) * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [from, to])
  return <>{n}</>
}
