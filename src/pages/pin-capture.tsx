import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { Camera, Check, ChevronLeft, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PinShape } from '@/components/pin-art'
import { CustomPin, PlacePhoto } from '@/components/place-photo'
import { ShapeSticker } from '@/components/shape-art'
import { collectPin, SEED_COLLECTED, useCollected, useCustomIds } from '@/lib/collected'
import { cn } from '@/lib/utils'
import { pinById, pinKindLabel, placeById, type Pin } from '@/data/la28'
import { CATEGORIES, CHALLENGES, PIN_VALUE, pinsIn } from '@/data/passport'

type Step = 'camera' | 'making' | 'choose' | 'celebrate' | 'passport' | 'progress'

// Photo, then a pin made from it (or the location's own pin), then the
// celebration: it lands in the Passport and moves today's and this week's tasks.
export default function PinCapturePage() {
  const { pinId = '' } = useParams()
  const navigate = useNavigate()
  const collected = useCollected()
  const customIds = useCustomIds()
  const pin = pinById(pinId)
  const [step, setStep] = useState<Step>('camera')
  const [custom, setCustom] = useState(false)

  if (!pin) return <Navigate to="/explore" replace />

  const place = placeById(pin.place)
  const done = collected.includes(pin.id)

  if (pin.status === 'locked') {
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
    setCustom(useCustom)
    setStep('celebrate')
  }

  return (
    <Screen onBack={step === 'celebrate' || step === 'passport' || step === 'progress' ? undefined : () => (step === 'camera' ? navigate(-1) : setStep('camera'))}>
      {step === 'camera' && <CameraStep pin={pin} placeName={place.name} onCapture={() => setStep('making')} />}
      {step === 'making' && <MakingStep pin={pin} onDone={() => setStep('choose')} />}
      {step === 'choose' && <ChooseStep pin={pin} onKeep={() => keep(true)} onDefault={() => keep(false)} />}
      {step === 'celebrate' && (
        <CelebrateStep pin={pin} placeName={place.name} custom={custom} onContinue={() => setStep('passport')} />
      )}
      {step === 'passport' && <PassportStep pin={pin} custom={custom} onContinue={() => setStep('progress')} />}
      {step === 'progress' && (
        <ProgressStep
          onMap={() => navigate('/explore', { replace: true })}
          onPassport={() => navigate('/passport', { replace: true })}
        />
      )}
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
  onContinue,
}: {
  pin: Pin
  placeName: string
  custom: boolean
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
      </div>
      <Button size="lg" className="w-full shrink-0" onClick={onContinue}>
        Continue
      </Button>
    </>
  )
}

function PassportStep({ pin, custom, onContinue }: { pin: Pin; custom: boolean; onContinue: () => void }) {
  const collected = useCollected()
  const category = CATEGORIES.find((c) => c.kinds.includes(pin.kind))
  const mates = category ? pinsIn(category.kinds) : []
  const have = mates.filter((p) => collected.includes(p.id)).length
  const others = mates.filter((p) => collected.includes(p.id) && p.id !== pin.id).slice(0, 3)

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-sm font-medium text-muted-foreground">Added to your Passport</p>
        <h1 className="mt-1 font-heading text-2xl font-semibold">{category?.title ?? 'Collection'}</h1>
        <p className="mt-2 text-sm text-muted-foreground tabular-nums">
          <CountUp from={Math.max(0, have - 1)} to={have} /> of {mates.length}
        </p>
        <div className="mt-6 flex items-end justify-center gap-3">
          {others.map((p) => (
            <span key={p.id} className="flex size-16 items-center justify-center rounded-2xl bg-muted">
              <ShapeSticker shape={p.shape} className="size-9 text-foreground" />
            </span>
          ))}
          <span className="flex size-20 items-center justify-center rounded-2xl bg-muted ring-2 ring-foreground">
            {custom ? (
              <CustomPin seed={pin.id} shape={pin.shape} className="size-14" />
            ) : (
              <ShapeSticker shape={pin.shape} className="size-12 text-foreground" />
            )}
          </span>
        </div>
      </div>
      <Button size="lg" className="w-full shrink-0" onClick={onContinue}>
        Continue
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
          <span className="font-normal text-muted-foreground">Torches · claim in your Passport</span>
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
