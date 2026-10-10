import { useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { Check, ChevronLeft, Flame, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PinShape } from '@/components/pin-art'
import { ShapeSticker } from '@/components/shape-art'
import { BonusTypeBadge, MarkRow } from '@/components/bonus-list'
import { AngleFinder, type AnglePhase } from '@/components/angle-finder'
import { MomentCamera } from '@/components/moment-camera'
import { formatCountdown, nowMs, useRemaining } from '@/lib/clock'
import { photoSrc } from '@/components/place-photo'
import { bonusIcon, completeBonus, momentMark, useBonusMarks, useBonusState, useBonusStateLabel } from '@/lib/bonuses'
import { useDebug } from '@/lib/debug'
import { formatTime, pinById, placeById, type Pin } from '@/data/la28'
import { BONUS_REWARD, bonusById, bonusTitle, bonusType, bonusesFor, type Bonus } from '@/data/bonuses'
import { meetable, type Person } from '@/data/mock'

type Step = 'intro' | 'play' | 'done'

// One bonus challenge at a pin: what it is, the challenge itself, then the mark it leaves.
// Back returns to wherever it was opened from (the pin, the capture flow, the flow gallery).
// `?at=` starts inside the challenge at one of its states (used by the flow gallery).
export default function BonusPage() {
  const { pinId = '', bonusId = '' } = useParams()
  const [params] = useSearchParams()
  const at = params.get('at') ?? undefined
  const navigate = useNavigate()
  const pin = pinById(pinId)
  const bonus = bonusById(bonusId)
  const [step, setStep] = useState<Step>(at ? 'play' : 'intro')

  if (!pin || !bonus || bonus.pin !== pin.id) return <Navigate to="/explore" replace />

  return (
    <div className="flex h-dvh flex-col bg-background px-4 pt-[env(safe-area-inset-top)] pb-[max(env(safe-area-inset-bottom),16px)]">
      <header className="-mx-2 flex h-14 shrink-0 items-center gap-2">
        {step !== 'done' && (
          <Button
            variant="outline"
            size="icon-lg"
            className="rounded-full"
            aria-label="Back"
            onClick={() => (step === 'play' ? setStep('intro') : navigate(-1))}
          >
            <ChevronLeft className="size-5" />
          </Button>
        )}
        <PinHeader pin={pin} />
      </header>

      {step === 'intro' && <Intro pin={pin} bonus={bonus} onStart={() => setStep('play')} />}
      {step === 'play' && <Play bonus={bonus} at={at} onDone={() => setStep('done')} />}
      {step === 'done' && <Done pin={pin} bonus={bonus} onContinue={() => navigate(-1)} />}
    </div>
  )
}

function PinHeader({ pin }: { pin: Pin }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <PinShape shape={pin.shape} status="open" className="size-8 text-foreground" />
      <div className="min-w-0">
        <p className="truncate text-sm leading-tight font-medium">{pin.name.replace(/ Pin$/, '')}</p>
        <p className="truncate text-xs text-muted-foreground">{placeById(pin.place).name}</p>
      </div>
    </div>
  )
}

function Intro({ pin, bonus, onStart }: { pin: Pin; bonus: Bonus; onStart: () => void }) {
  const state = useBonusState(bonus)
  const label = useBonusStateLabel(state)
  const Icon = bonusIcon[bonus.kind]
  const ready = state.status === 'ready'

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span className="flex size-24 items-center justify-center rounded-full border-2">
          <Icon className="size-10" strokeWidth={1.5} />
        </span>
        <div className="mt-5 flex items-center gap-1.5">
          <BonusTypeBadge bonus={bonus} />
          <Badge variant="outline" className="tabular-nums">
            <Flame className="fill-current" />+{BONUS_REWARD[bonusType(bonus)]}
          </Badge>
        </div>
        <h1 className="mt-3 font-heading text-2xl font-semibold">{bonusTitle(bonus)}</h1>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">{bonus.detail}</p>
        {bonus.window && (
          <p className="mt-3 text-sm font-medium tabular-nums">
            {bonus.window.label} · {formatTime(bonus.window.opens.slice(11))}–{formatTime(bonus.window.closes.slice(11))}
          </p>
        )}
        {state.status === 'opens' && <OpensIn at={state.at} />}
        {state.status === 'closed' && <p className="mt-4 text-sm text-muted-foreground">The window is over for today.</p>}
        {bonus.perk && <p className="mt-3 text-sm font-medium">Also unlocks: {bonus.perk}</p>}
        <p className="mt-6 text-xs text-muted-foreground">Optional. {pin.name.replace(/ Pin$/, '')} is yours either way.</p>
      </div>
      <Button size="lg" className="w-full shrink-0 tabular-nums" disabled={!ready} onClick={onStart}>
        {ready ? (
          'Start'
        ) : (
          <>
            {state.status === 'done' ? <Check data-icon="inline-start" /> : <Lock data-icon="inline-start" />}
            {label}
          </>
        )}
      </Button>
    </>
  )
}

// Right moment before its window: a big countdown to when it opens
function OpensIn({ at }: { at: string }) {
  const left = useRemaining(at)
  return (
    <div className="mt-5">
      <p className="font-heading text-5xl font-semibold tracking-tight tabular-nums">{formatCountdown(left)}</p>
      <p className="mt-1 text-sm text-muted-foreground">until it opens</p>
    </div>
  )
}

// Who joined a Together challenge, from the debug panel's count
function useJoined(): Person[] {
  const { others } = useDebug()
  return meetable.slice(0, others)
}

function togetherMark(joined: Person[]) {
  const [first, ...rest] = joined
  return `With ${first.name} ${first.flag}${rest.length ? ` +${rest.length}` : ''}`
}

// The challenge itself. Kinds without their own flow yet get a stand-in that records the mark.
function Play({ bonus, at, onDone }: { bonus: Bonus; at?: string; onDone: () => void }) {
  const joined = useJoined()
  const Icon = bonusIcon[bonus.kind]

  function finish() {
    const mark = bonus.kind === 'together' ? togetherMark(joined) : bonus.kind === 'moment' ? momentMark(bonus, nowMs()) : bonus.mark
    completeBonus(bonus.id, mark)
    onDone()
  }

  if (bonus.kind === 'moment') return <MomentCamera bonus={bonus} onCapture={finish} />
  if (bonus.kind === 'angle') return <AngleFinder bonus={bonus} start={at as AnglePhase | undefined} onCapture={finish} />

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex aspect-[3/4] w-full max-w-sm flex-col items-center justify-center rounded-3xl border-2 border-dashed px-8 text-center">
          <Icon className="size-10 text-muted-foreground" strokeWidth={1.5} />
          <p className="mt-4 font-heading text-lg font-semibold">{bonusTitle(bonus)}</p>
          <p className="mt-1 text-sm text-muted-foreground">This challenge’s flow is built next. Finish it here to try the rest.</p>
          {bonus.kind === 'together' && (
            <p className="mt-4 text-sm font-medium">
              Joined: {joined.map((p) => `${p.name} ${p.flag}`).join(', ')}
            </p>
          )}
        </div>
      </div>
      <Button size="lg" className="w-full shrink-0" onClick={finish}>
        Finish (prototype)
      </Button>
    </>
  )
}

function Done({ pin, bonus, onContinue }: { pin: Pin; bonus: Bonus; onContinue: () => void }) {
  const marks = useBonusMarks()
  const all = bonusesFor(pin.id)
  const done = all.filter((b) => marks[b.id])

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span className="relative">
          {/* Photo challenges show the photo you took; the rest show the stamp */}
          {bonus.kind === 'angle' || bonus.kind === 'moment' ? (
            <img src={photoSrc(pin.id)} alt="" className="size-36 animate-pin-pop rounded-[2rem] object-cover" />
          ) : (
            <span className="flex size-36 items-center justify-center rounded-[2rem] bg-muted">
              <ShapeSticker shape={pin.shape} className="size-20 text-foreground" />
            </span>
          )}
          <span className="absolute -right-2 -bottom-2 flex size-11 animate-pin-pop items-center justify-center rounded-full border-4 border-background bg-foreground text-background">
            <Check className="size-5" />
          </span>
        </span>
        <h1 className="mt-6 font-heading text-2xl font-semibold">Mark added</h1>
        <p className="mt-1 text-sm text-muted-foreground">{marks[bonus.id]}</p>
        <p className="mt-4 flex items-center gap-1 font-heading text-xl font-semibold tabular-nums">
          <Flame className="size-5 fill-current" />+{BONUS_REWARD[bonusType(bonus)]}
        </p>
        <p className="text-sm text-muted-foreground">Torches</p>
        <MarkRow marks={done.map((b) => marks[b.id])} className="mt-6" />
        <p className="mt-2 text-xs text-muted-foreground tabular-nums">
          {done.length} of {all.length} bonuses at {pin.name.replace(/ Pin$/, '')}
        </p>
      </div>
      <Button size="lg" className="w-full shrink-0" onClick={onContinue}>
        Continue
      </Button>
    </>
  )
}
