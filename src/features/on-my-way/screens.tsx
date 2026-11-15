import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Camera, Check, ChevronLeft, Flame, SendHorizontal, User, Users, Vibrate, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PinShape } from '@/components/pin-art'
import { flag, type Pin } from '@/data/la28'
import { BONUS_REWARD, bonusTitle, bonusType, type Bonus } from '@/data/bonuses'
import { bonusIcon } from '@/lib/bonuses'
import { useClock } from '@/lib/clock'
import { cn } from '@/lib/utils'
import {
  ME_FROM,
  MEMBERS,
  MY_ETA,
  PIN_AT,
  cancelMatching,
  challengesFor,
  joinSquad,
  memberById,
  minutesLeft,
  progressOf,
  send,
  shakeToMatch,
  toggleIn,
  useOnMyWay,
  type Message,
} from './state'
import { TripMap, type Route } from './trip-map'

// Find a squad: the challenges row on the pin page, the matchmaking overlay, and the
// squad's own page once you join. Black and white shadcn, big buttons, squircle faces,
// no subtext: chips and layout carry the meaning.

// ---- Shared bits ----

function Face({ cc, me, className }: { cc?: string; me?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-2xl text-xl leading-none ring-2 ring-background',
        me ? 'bg-foreground text-[11px] font-bold text-background' : 'bg-card',
        className,
      )}
    >
      {me ? 'You' : cc && flag(cc)}
    </span>
  )
}

function Torches({ n, className }: { n: number; className?: string }) {
  return (
    <span className={cn('flex items-center gap-0.5 text-sm font-semibold tabular-nums', className)}>
      <Flame className="size-3.5 fill-current" />+{n}
    </span>
  )
}

function PinMark({ pin, className }: { pin: Pin; className?: string }) {
  return <PinShape shape={pin.shape} status={pin.status} className={cn('size-12 drop-shadow-md', className)} />
}

// ---- Challenges on the pin page ----

export function ChallengeRow({ pinId }: { pinId: string }) {
  const { solo, group } = challengesFor(pinId)
  return (
    <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
      {[...solo, ...group].map((b) => (
        <ChallengeTile key={b.id} bonus={b} />
      ))}
    </ul>
  )
}

function ChallengeTile({ bonus }: { bonus: Bonus }) {
  const Icon = bonusIcon[bonus.kind]
  const type = bonusType(bonus)
  return (
    <li className="flex h-40 w-36 shrink-0 snap-start flex-col rounded-3xl bg-card p-3">
      <span className="flex w-fit items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs font-semibold">
        {type === 'together' ? <Users className="size-3.5" /> : <User className="size-3.5" />}
        {type === 'together' ? 'Group' : 'Solo'}
      </span>
      <Icon className="mt-auto size-7" strokeWidth={1.5} />
      <p className="mt-2 leading-tight font-semibold">{bonusTitle(bonus)}</p>
      <Torches n={BONUS_REWARD[type]} className="mt-1 text-muted-foreground" />
    </li>
  )
}

// ---- Matchmaking: an overlay on the pin page ----

// Matchmaking, then the squad on offer. A card over the bottom of the pin page, so the
// page stays readable behind it.
export function MatchOverlay() {
  const navigate = useNavigate()
  const trip = useOnMyWay()
  const now = useClock()
  const [shaking, setShaking] = useState(false)
  const offer = trip.step === 'offer'

  function shake() {
    setShaking(true)
    window.setTimeout(shakeToMatch, 600)
  }
  useShake(shake, !offer)

  return (
    <div className="absolute inset-x-3 bottom-[max(env(safe-area-inset-bottom),12px)] z-30 animate-rise rounded-3xl border bg-background p-4 shadow-2xl">
      <div className="flex items-center gap-2">
        <h2 className="font-heading text-xl font-semibold">{offer ? 'Squad found' : 'Finding a squad'}</h2>
        <Button variant="ghost" size="icon" aria-label={offer ? 'Pass' : 'Stop'} onClick={cancelMatching} className="ml-auto -mr-1">
          <X className="size-5" />
        </Button>
      </div>

      {offer ? (
        <>
          <ul className="mt-3 space-y-2">
            {MEMBERS.map((m) => (
              <li key={m.id} className="flex animate-pop items-center gap-3 rounded-2xl bg-card p-2 pr-3">
                <Face cc={m.cc} className="size-11 text-2xl ring-card" />
                <span className="font-semibold">{m.name}</span>
                <span className="ml-auto rounded-full bg-background px-2.5 py-0.5 text-sm font-semibold tabular-nums">{minutesLeft(now, m.eta)} min</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button size="lg" variant="outline" className="h-14 rounded-full text-base" onClick={cancelMatching}>
              Pass
            </Button>
            <Button
              size="lg"
              className="h-14 rounded-full text-base"
              onClick={() => {
                joinSquad()
                navigate(`/explore/pins/${trip.pinId}/squad`)
              }}
            >
              Join
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-2" aria-hidden>
            <span className="relative">
              <span className="absolute inset-0 animate-radar rounded-2xl border-2 border-foreground" />
              <Face me />
            </span>
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-10 animate-pulse rounded-2xl border-2 border-dashed border-muted-foreground/40" style={{ animationDelay: `${i * 200}ms` }} />
            ))}
          </div>
          <Button size="lg" variant="outline" className="mt-4 h-14 w-full rounded-full text-base" onClick={shake}>
            <Vibrate data-icon="inline-start" className={cn('size-5', shaking && 'animate-shake')} />
            Shake
          </Button>
        </>
      )}
    </div>
  )
}

// Shake the phone to match now. iOS asks for motion access, which needs a tap first.
function useShake(onShake: () => void, on: boolean) {
  const fired = useRef(false)
  useEffect(() => {
    if (!on) return
    function onMotion(e: DeviceMotionEvent) {
      const a = e.accelerationIncludingGravity
      if (!a || fired.current) return
      if (Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0) > 24) {
        fired.current = true
        onShake()
      }
    }
    window.addEventListener('devicemotion', onMotion)
    return () => window.removeEventListener('devicemotion', onMotion)
  })
  useEffect(() => {
    const ask = (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission
    if (!ask) return
    const onTap = () => {
      ask().catch(() => {})
      window.removeEventListener('pointerdown', onTap)
    }
    window.addEventListener('pointerdown', onTap)
    return () => window.removeEventListener('pointerdown', onTap)
  }, [])
}

// ---- The squad's page ----

function squadRoutes(now: number, arrived: string[]): Route[] {
  const tag = (eta: number, who: string) => (arrived.includes(who) ? 'Here' : `${minutesLeft(now, eta)} min`)
  return [
    ...MEMBERS.map((m) => ({ id: m.id, face: flag(m.cc), from: m.from, progress: progressOf(now, m.eta), tag: tag(m.eta, m.id) })),
    { id: 'me', me: true, face: 'You', from: ME_FROM, progress: progressOf(now, MY_ETA), tag: tag(MY_ETA, 'me') },
  ]
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-heading text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

// Everyone's route and ETA, the challenges to do together, and the chat
export function SquadPage({ pin }: { pin: Pin }) {
  const navigate = useNavigate()
  const now = useClock()
  const trip = useOnMyWay()
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const everyone = trip.arrived.length === MEMBERS.length + 1
  const { group } = challengesFor(pin.id)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [trip.messages.length, everyone])

  function submit(text: string) {
    send(text)
    setDraft('')
  }

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center gap-1 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={() => navigate(`/explore/pins/${pin.id}`)}>
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="font-heading text-xl font-semibold">Squad</h1>
        <span className="ml-auto flex -space-x-1.5 pr-2">
          {MEMBERS.map((m) => (
            <Face key={m.id} cc={m.cc} className="size-9 rounded-xl text-lg" />
          ))}
          <Face me className="size-9 rounded-xl" />
        </span>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 pt-1 pb-4">
        <TripMap className="h-56 rounded-3xl" pin={<PinMark pin={pin} className="size-11" />} pinAt={PIN_AT} routes={squadRoutes(now, trip.arrived)} />

        <Section title="Together">
          <div className="space-y-2">
            {group.map((b) => (
              <GroupChallenge key={b.id} bonus={b} inFor={trip.inFor[b.id] ?? []} />
            ))}
          </div>
        </Section>

        <Section title="Chat">
          <div className="space-y-3">
            {trip.messages.map((m) => (
              <Bubble key={m.id} message={m} pinId={pin.id} />
            ))}
          </div>
        </Section>
        <div ref={endRef} />
      </div>

      <div className="shrink-0 space-y-2 border-t px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        {everyone ? (
          <Button size="lg" className="h-16 w-full animate-rise rounded-full text-lg" onClick={() => navigate(`/explore/pins/${pin.id}/capture`)}>
            <Camera data-icon="inline-start" className="size-6" />
            Take the photo
          </Button>
        ) : (
          <>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {['Coming! 🏃', '👋', 'Almost there'].map((q) => (
                <button key={q} type="button" onClick={() => submit(q)} className="h-10 shrink-0 rounded-full border px-4 text-sm font-medium active:scale-95">
                  {q}
                </button>
              ))}
            </div>
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                submit(draft)
              }}
            >
              <input value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Message" className="h-12 min-w-0 flex-1 rounded-full bg-card px-5 text-base outline-none" />
              <Button type="submit" size="icon-lg" aria-label="Send" disabled={!draft.trim()}>
                <SendHorizontal />
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// A challenge to do together: who's in, and your own I'm in
function GroupChallenge({ bonus, inFor }: { bonus: Bonus; inFor: string[] }) {
  const Icon = bonusIcon[bonus.kind]
  const mine = inFor.includes('me')
  return (
    <div className={cn('flex items-center gap-3 rounded-3xl p-3', inFor.length ? 'border-2 border-foreground' : 'bg-card')}>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-card">
        <Icon className="size-6" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="leading-tight font-semibold">{bonusTitle(bonus)}</p>
        <span className="mt-1 flex items-center gap-2">
          <Torches n={BONUS_REWARD.together} />
          <span className="flex -space-x-1">
            {inFor.map((who) => (who === 'me' ? <Face key={who} me className="size-6 rounded-lg text-[8px]" /> : <Face key={who} cc={memberById(who)?.cc} className="size-6 rounded-lg text-xs" />))}
          </span>
        </span>
      </div>
      <Button size="lg" variant={mine ? 'secondary' : 'default'} className="h-11 rounded-full" onClick={() => toggleIn(bonus.id)}>
        {mine && <Check data-icon="inline-start" />}
        {mine ? 'In' : 'I’m in'}
      </Button>
    </div>
  )
}

function Bubble({ message, pinId }: { message: Message; pinId: string }) {
  if (message.from === 'system') {
    return (
      <p className="mx-auto flex w-fit items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-medium">
        {MEMBERS.map((m) => flag(m.cc)).join(' ')} {message.text}
      </p>
    )
  }
  const me = message.from === 'me'
  const member = memberById(message.from)
  const { solo, group } = challengesFor(pinId)
  const title = message.challenge ? [...solo, ...group].find((b) => b.id === message.challenge) : undefined
  return (
    <div className={cn('flex animate-rise items-end gap-2', me && 'flex-row-reverse')}>
      {!me && <Face cc={member?.cc} className="size-8 rounded-xl text-base" />}
      <div className={cn('flex max-w-[78%] flex-col gap-1', me && 'items-end')}>
        {message.text && <p className={cn('rounded-2xl px-3.5 py-2 text-[15px] leading-snug', me ? 'bg-foreground text-background' : 'bg-card')}>{message.text}</p>}
        {title && (
          <span className="flex w-fit items-center gap-1.5 rounded-full border-2 border-foreground px-3 py-1 text-sm font-semibold">
            <Users className="size-4" />
            {bonusTitle(title)}
          </span>
        )}
      </div>
    </div>
  )
}
