import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { Camera, ChevronLeft, Flame, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShapeSticker } from '@/components/shape-art'
import { PlacePhoto } from '@/components/place-photo'
import { collectPin, useCollected } from '@/lib/collected'
import { addCapturePhoto } from '@/lib/pin-photos'
import { arriveAt } from '@/lib/location'
import { nowMs, usePinLocked } from '@/lib/clock'
import { completeBonus, momentMark } from '@/lib/bonuses'
import { useProfile } from '@/lib/profile'
import { cn } from '@/lib/utils'
import { flag, PINS, pinById, placeById, type Pin } from '@/data/la28'
import { meetable } from '@/data/mock'
import { BONUS_REWARD, bonusesFor, inWindow } from '@/data/bonuses'
import { PIN_VALUE } from '@/data/passport'
import { HoldHandshake, type Partner } from '@/features/together/hold-handshake'
import { CoStampArt } from '@/features/together/co-stamp-art'
import { addCoStamp, buzz, markFresh, randomTilt, reactCoStamp, stampDate, startFlight, useCoStamps } from '@/features/together/state'

type Step = 'find' | 'hold' | 'photo' | 'stamp'
const STEPS: Step[] = ['find', 'hold', 'photo']

// The fan at the pin who says yes. Simulated: in the real app, anyone collecting here now.
const STRANGER = meetable[0]

// Collecting a pin with someone you meet there. Find a fan at the same pin, then both hold
// the pin until the two halves click together, take one photo of you both (that's the photo
// that collects it), and the stamp lands in both Passports at once. Last, the pin flies
// into your Passport on the map.
export default function PinTogetherPage() {
  const { pinId = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const collected = useCollected()
  const pin = pinById(pinId)
  const at = params.get('at') as Step | null
  const [step, setStep] = useState<Step>(at && STEPS.includes(at) ? at : 'find')
  // Already in the Passport when this opened: nothing to collect
  const [had] = useState(() => collected.includes(pinId))
  const locked = usePinLocked(pin ?? PINS[0])
  const partner: Partner = { name: STRANGER.name, flag: STRANGER.flag }

  if (!pin || had || locked) return <Navigate to={pin ? `/explore/pins/${pin.id}` : '/explore'} replace />
  const place = placeById(pin.place)

  // The photo together collects the pin for both of you, and earns the Together bonus here
  function collect(photo: boolean) {
    const p = pin!
    const now = nowMs()
    collectPin(p.id)
    addCapturePhoto(p.id)
    arriveAt(p.place)
    bonusesFor(p.id).forEach((b) => {
      if (b.kind === 'moment' && inWindow(b, now)) completeBonus(b.id, momentMark(b, now))
      if (b.kind === 'together' && photo) completeBonus(b.id, `With ${partner.name} ${partner.flag}`)
    })
    addCoStamp({ pinId: p.id, name: partner.name, flag: partner.flag, at: now, tilt: randomTilt(), photo })
    setStep('stamp')
  }

  return (
    <div className="flex h-dvh flex-col bg-background px-4 pt-[env(safe-area-inset-top)] pb-[max(env(safe-area-inset-bottom),16px)]">
      <header className="-mx-2 flex h-14 shrink-0 items-center gap-2">
        {step !== 'stamp' && (
          <Button variant="outline" size="icon-lg" className="rounded-full" aria-label="Back" onClick={() => navigate(-1)}>
            <ChevronLeft className="size-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate font-heading font-semibold">{pin.name}</p>
          <p className="truncate text-xs text-muted-foreground">Collecting together · {place.name}</p>
        </div>
        {step !== 'stamp' && <span className="size-10 shrink-0" />}
      </header>

      {step === 'find' && <FindStep pin={pin} partner={partner} onReady={() => setStep('hold')} />}
      {step === 'hold' && (
        <>
          <StepHead title="Hold it together" detail="Both press and hold. Your halves of the pin slide in from each side." />
          <HoldHandshake shape={pin.shape} partner={partner} onJoined={() => setStep('photo')} />
        </>
      )}
      {step === 'photo' && <PhotoStep pin={pin} partner={partner} onTaken={() => collect(true)} onSkip={() => collect(false)} />}
      {step === 'stamp' && (
        <StampStep
          pin={pin}
          partner={partner}
          onMap={() => {
            startFlight(pin.id)
            navigate('/explore', { replace: true })
          }}
          onPassport={() => {
            markFresh(pin.id)
            navigate(`/passport?pin=${pin.id}`, { replace: true })
          }}
        />
      )}
    </div>
  )
}

function StepHead({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="mt-2 text-center">
      <h1 className="font-heading text-2xl font-semibold">{title}</h1>
      <p className="mx-auto mt-1 max-w-72 text-sm text-muted-foreground">{detail}</p>
    </div>
  )
}

// ---- Find: someone else is collecting this pin right now ----

function FindStep({ pin, partner, onReady }: { pin: Pin; partner: Partner; onReady: () => void }) {
  const [phase, setPhase] = useState<'looking' | 'found' | 'asking' | 'yes'>('looking')

  useEffect(() => {
    const next = phase === 'looking' ? 'found' : phase === 'asking' ? 'yes' : null
    if (!next) return
    const t = window.setTimeout(() => {
      setPhase(next)
      buzz(next === 'yes' ? [15, 50, 15] : 10)
    }, phase === 'looking' ? 1800 : 1500)
    return () => window.clearTimeout(t)
  }, [phase])

  const ready = useRef(onReady)
  useEffect(() => {
    ready.current = onReady
  })
  useEffect(() => {
    if (phase !== 'yes') return
    const t = window.setTimeout(() => ready.current(), 900)
    return () => window.clearTimeout(t)
  }, [phase])

  const found = phase !== 'looking'
  return (
    <>
      <StepHead
        title={found ? `${partner.name} is here too` : 'Looking for fans here'}
        detail={found ? 'Collecting this pin right now. Ask to collect it together: you both get the stamp.' : 'Anyone collecting this pin within a few meters of you.'}
      />
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative flex size-64 items-center justify-center">
          {/* Breathing while it looks; once found, both dots pulse in step */}
          <span aria-hidden className="absolute inset-0 animate-breathe rounded-full bg-foreground" />
          <span className="relative flex size-36 items-center justify-center rounded-full bg-card">
            <ShapeSticker shape={pin.shape} className="size-20 text-foreground" />
          </span>
          {/* You, on the left */}
          <Dot className="top-1/2 left-0 -translate-y-1/2" glyph="You" small pulse={found} />
          {/* Them, arriving on the right */}
          <Dot
            className={cn('top-1/2 right-0 -translate-y-1/2 transition-all duration-500', found ? 'opacity-100' : 'translate-x-6 opacity-0')}
            glyph={partner.flag}
            pulse={found}
          />
        </div>
        <div className={cn('mt-6 w-full max-w-sm transition-all duration-500', found ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0')}>
          <div className="flex items-center gap-3 rounded-2xl bg-card p-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-background text-xl">{partner.flag}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {partner.name} {partner.flag}
              </p>
              <p className="text-xs text-muted-foreground">About 6 m away · {STRANGER.pins} pins</p>
            </div>
            <span className="rounded-full bg-background px-2 py-1 text-[11px] font-medium">Here now</span>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">You’ll only see each other’s first name and flag.</p>
        </div>
      </div>
      <Button size="lg" className="w-full shrink-0" disabled={phase !== 'found'} onClick={() => setPhase('asking')}>
        {phase === 'asking' ? (
          `Waiting for ${partner.name}…`
        ) : phase === 'yes' ? (
          `${partner.name} said yes`
        ) : (
          <>
            <Users data-icon="inline-start" />
            Collect together
          </>
        )}
      </Button>
    </>
  )
}

function Dot({ glyph, small, pulse, className }: { glyph: string; small?: boolean; pulse?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'absolute flex size-12 items-center justify-center rounded-full border-4 border-background bg-foreground font-semibold text-background',
        small ? 'text-xs' : 'text-xl',
        className,
      )}
    >
      {glyph}
      {pulse && <span aria-hidden className="absolute -inset-1 animate-ping rounded-full border-2 border-foreground [animation-duration:2.8s]" />}
    </span>
  )
}

// ---- Photo: one of you both, counted down on both phones. It collects the pin. ----

function PhotoStep({ pin, partner, onTaken, onSkip }: { pin: Pin; partner: Partner; onTaken: () => void; onSkip: () => void }) {
  const profile = useProfile()
  const [count, setCount] = useState<number | null>(null)
  // The shutter fires at zero
  const flash = count === 0
  const done = useRef(onTaken)
  useEffect(() => {
    done.current = onTaken
  })

  useEffect(() => {
    if (count === null) return
    if (count === 0) {
      buzz(30)
      const t = window.setTimeout(() => done.current(), 450)
      return () => window.clearTimeout(t)
    }
    buzz(10)
    const t = window.setTimeout(() => setCount(count - 1), 800)
    return () => window.clearTimeout(t)
  }, [count])

  return (
    <>
      <StepHead title="One photo, both of you" detail="It collects the pin for both of you. The countdown runs on both phones." />
      <div className="relative mx-auto mt-4 min-h-0 w-full max-w-sm flex-1 overflow-hidden rounded-3xl">
        <PlacePhoto seed={`${pin.id}-both`} shape={pin.shape} className="size-full" />
        <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-background/90 py-1 pr-2.5 pl-1.5 text-xs font-medium">
          <span className="text-base leading-none">{flag(profile.country)}</span>
          You
          <span className="text-muted-foreground">+</span>
          <span className="text-base leading-none">{partner.flag}</span>
          {partner.name}
        </span>
        {count !== null && count > 0 && (
          <span key={count} className="absolute inset-0 flex animate-pin-pop items-center justify-center font-heading text-8xl font-semibold text-background drop-shadow-lg tabular-nums">
            {count}
          </span>
        )}
        {flash && <span aria-hidden className="absolute inset-0 animate-flash bg-white" />}
      </div>
      <div className="flex shrink-0 items-center justify-center gap-6 pt-4">
        <span className="w-20" />
        <button
          type="button"
          aria-label="Start the countdown"
          disabled={count !== null}
          onClick={() => setCount(3)}
          className="flex size-18 items-center justify-center rounded-full border-4 bg-background shadow-md active:scale-95 disabled:opacity-50"
        >
          <Camera className="size-7" />
        </button>
        <button type="button" onClick={onSkip} disabled={count !== null} className="w-20 text-xs text-muted-foreground underline-offset-2 hover:underline">
          Each take our own
        </button>
      </div>
    </>
  )
}

// ---- Stamp: it lands in both Passports at once, then a moment for the two of you ----

const REACTIONS = ['👋', '🙌', '🔥', '🫶']

function StampStep({ pin, partner, onMap, onPassport }: { pin: Pin; partner: Partner; onMap: () => void; onPassport: () => void }) {
  const profile = useProfile()
  const stamp = useCoStamps()[pin.id]
  const [landed, setLanded] = useState(false)
  const together = bonusesFor(pin.id).find((b) => b.kind === 'together')
  const mine = flag(profile.country)

  // The thud, on both pages at once
  useEffect(() => {
    const t = window.setTimeout(() => {
      setLanded(true)
      buzz(45)
    }, 700)
    return () => window.clearTimeout(t)
  }, [])

  // They react back a moment after you do
  useEffect(() => {
    if (!stamp?.sent || stamp.got) return
    const t = window.setTimeout(() => {
      reactCoStamp(pin.id, { got: stamp.sent === '🫶' ? '🫶' : partner.flag })
      buzz(10)
    }, 1300)
    return () => window.clearTimeout(t)
  }, [stamp?.sent, stamp?.got, pin.id, partner.flag])

  if (!stamp) return null
  const date = stampDate(stamp.at)
  const time = new Date(stamp.at).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })

  return (
    <>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pt-2">
        {/* Both Passports, side by side: the same stamp hits both */}
        <div className={cn('grid grid-cols-2 gap-3', landed && 'animate-thud')}>
          <PassportPage owner="Your Passport">
            <CoStampArt shape={pin.shape} flags={[mine, partner.flag]} date={date} tilt={stamp.tilt} thud className={cn('size-32', !landed && 'invisible')} />
            {landed && <span aria-hidden className="absolute size-32 animate-ripple rounded-full border-2 border-foreground" />}
          </PassportPage>
          <PassportPage owner={`${partner.name}’s Passport`}>
            <CoStampArt shape={pin.shape} flags={[partner.flag, mine]} date={date} tilt={-stamp.tilt} thud className={cn('size-32', !landed && 'invisible')} />
            {landed && <span aria-hidden className="absolute size-32 animate-ripple rounded-full border-2 border-foreground" />}
          </PassportPage>
        </div>

        <div className={cn('transition-all duration-500', landed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0')}>
          <h1 className="mt-6 text-center font-heading text-2xl font-semibold">Collected together</h1>
          <p className="mt-1 flex items-center justify-center gap-3 text-sm tabular-nums">
            <span className="flex items-center gap-1 font-semibold">
              <Flame className="size-4 fill-current" />+{PIN_VALUE[pin.rarity] + (together && stamp.photo ? BONUS_REWARD.together : 0)}
            </span>
            {together && stamp.photo && <span className="rounded-full bg-card px-2 py-0.5 text-xs font-medium">Together bonus</span>}
          </p>

          {/* You two: who, where, and a one-tap hello */}
          <div className="relative mt-5 rounded-2xl bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="flex -space-x-2">
                <span className="flex size-10 items-center justify-center rounded-full border-2 border-card bg-background text-lg">{mine}</span>
                <span className="flex size-10 items-center justify-center rounded-full border-2 border-card bg-background text-lg">{partner.flag}</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">You and {partner.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {placeById(pin.place).name} · {time}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              {[...REACTIONS, mine].map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={!!stamp.sent}
                  onClick={() => {
                    reactCoStamp(pin.id, { sent: r })
                    buzz(10)
                  }}
                  className={cn(
                    'flex size-11 items-center justify-center rounded-full text-xl transition-transform active:scale-90',
                    stamp.sent === r ? 'bg-foreground' : 'bg-background',
                    stamp.sent && stamp.sent !== r && 'opacity-40',
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <p className="mt-2 min-h-5 text-xs text-muted-foreground">
              {stamp.got ? `${partner.name} sent ${stamp.got}` : stamp.sent ? `Sent. ${partner.name} sees it on the stamp.` : `Say thanks to ${partner.name}. It stays on the stamp.`}
            </p>
            {/* What you sent floats off; what they sent floats in */}
            {stamp.sent && <span key={`s${stamp.sent}`} aria-hidden className="pointer-events-none absolute bottom-14 left-6 animate-float-up text-3xl">{stamp.sent}</span>}
            {stamp.got && <span key={`g${stamp.got}`} aria-hidden className="pointer-events-none absolute right-6 bottom-14 animate-float-up text-3xl">{stamp.got}</span>}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2 pt-4">
        <Button size="lg" className="w-full" disabled={!landed} onClick={onMap}>
          Put it in my Passport
        </Button>
        <Button size="lg" variant="ghost" className="w-full" disabled={!landed} onClick={onPassport}>
          Open my Passport
        </Button>
      </div>
    </>
  )
}

function PassportPage({ owner, children }: { owner: string; children: ReactNode }) {
  return (
    <div>
      <div className="relative flex aspect-square items-center justify-center rounded-2xl bg-card">
        <span aria-hidden className="absolute inset-3 rounded-xl border border-dashed border-foreground/15" />
        {children}
      </div>
      <p className="mt-1.5 truncate text-center text-xs text-muted-foreground">{owner}</p>
    </div>
  )
}
