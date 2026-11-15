import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Camera, Check, ChevronLeft, Flame, Footprints, MessageCircle, SendHorizontal, User, Users, Vibrate, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PinShape } from '@/components/pin-art'
import { flag, placeById, type Pin } from '@/data/la28'
import { BONUS_REWARD, bonusTitle, bonusType, type Bonus } from '@/data/bonuses'
import { bonusIcon } from '@/lib/bonuses'
import { useClock } from '@/lib/clock'
import { cn } from '@/lib/utils'
import {
  ME_FROM,
  MEMBERS,
  MY_ETA,
  PIN_AT,
  cancelTrip,
  challengesFor,
  memberById,
  minutesLeft,
  openChat,
  progressOf,
  send,
  shakeToMatch,
  startTrip,
  toggleIn,
  backTo,
  useOnMyWay,
  type Message,
} from './state'
import { TripMap, type Route } from './trip-map'

// The four steps of On my way, each full screen. Black and white shadcn, big buttons,
// squircle faces, no subtext: chips and layout carry the meaning.

// ---- Shared bits ----

function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('relative flex h-dvh flex-col overflow-hidden bg-background pt-[env(safe-area-inset-top)]', className)}>{children}</div>
}

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

// ---- 1. The pin ----

export function PinStep({ pin }: { pin: Pin }) {
  const navigate = useNavigate()
  const place = placeById(pin.place)
  const { solo, group } = challengesFor(pin.id)

  return (
    <Screen>
      <header className="flex h-14 shrink-0 items-center px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={() => navigate(-1)}>
          <ChevronLeft className="size-5" />
        </Button>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-32">
        <div className="mx-4 flex aspect-[4/3] max-h-72 w-[calc(100%-2rem)] items-center justify-center rounded-3xl bg-card">
          <PinShape shape={pin.shape} status={pin.status} className="size-36 animate-bob drop-shadow-lg" />
        </div>
        <h1 className="mt-5 px-5 font-heading text-2xl leading-tight font-semibold">{place.name}</h1>

        <h2 className="mt-6 mb-2 px-5 font-heading text-lg font-semibold">Challenges</h2>
        <ul className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-4 pb-1">
          {[...group, ...solo].map((b) => (
            <ChallengeTile key={b.id} bonus={b} />
          ))}
        </ul>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background to-transparent px-4 pt-8 pb-[max(env(safe-area-inset-bottom),16px)]">
        <Button size="lg" className="h-16 w-full rounded-full text-lg" onClick={startTrip}>
          <Footprints data-icon="inline-start" className="size-6" />
          On my way
        </Button>
      </div>
    </Screen>
  )
}

function ChallengeTile({ bonus }: { bonus: Bonus }) {
  const Icon = bonusIcon[bonus.kind]
  const type = bonusType(bonus)
  return (
    <li className="flex h-44 w-40 shrink-0 snap-start flex-col rounded-3xl bg-card p-3">
      <span className="flex w-fit items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs font-semibold">
        {type === 'together' ? <Users className="size-3.5" /> : <User className="size-3.5" />}
        {type === 'together' ? 'Group' : 'Solo'}
      </span>
      <Icon className="mt-auto size-8" strokeWidth={1.5} />
      <p className="mt-2 leading-tight font-semibold">{bonusTitle(bonus)}</p>
      <Torches n={BONUS_REWARD[type]} className="mt-1 text-muted-foreground" />
    </li>
  )
}

// ---- 2. Matchmaking ----

export function MatchingStep({ pin }: { pin: Pin }) {
  const now = useClock()
  const [shaking, setShaking] = useState(false)

  function shake() {
    setShaking(true)
    window.setTimeout(shakeToMatch, 600)
  }
  useShake(shake)

  return (
    <Screen>
      <TripMap
        className="min-h-0 flex-1"
        pin={<PinMark pin={pin} />}
        pinAt={PIN_AT}
        searching
        routes={[{ id: 'me', me: true, face: 'You', from: ME_FROM, progress: progressOf(now, MY_ETA), tag: `${minutesLeft(now, MY_ETA)} min` }]}
      />
      <Button variant="secondary" size="icon-lg" aria-label="Stop" onClick={cancelTrip} className="absolute top-[max(env(safe-area-inset-top),12px)] left-3 shadow-md">
        <X className="size-5" />
      </Button>

      <div className="shrink-0 rounded-t-3xl bg-background px-4 pt-5 pb-[max(env(safe-area-inset-bottom),16px)] shadow-[0_-6px_28px_rgba(0,0,0,0.10)]">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-2xl font-semibold">
            Matchmaking<Dots />
          </h2>
        </div>
        <div className="mt-4 flex items-center gap-2" aria-hidden>
          <Face me />
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-10 animate-pulse rounded-2xl border-2 border-dashed border-muted-foreground/40" style={{ animationDelay: `${i * 200}ms` }} />
          ))}
        </div>
        <Button size="lg" variant="outline" className="mt-5 h-16 w-full rounded-full text-lg" onClick={shake}>
          <Vibrate data-icon="inline-start" className={cn('size-6', shaking && 'animate-shake')} />
          Shake
        </Button>
      </div>
    </Screen>
  )
}

function Dots() {
  return (
    <span aria-hidden className="inline-flex w-8">
      {[0, 1, 2].map((i) => (
        <span key={i} className="animate-pulse" style={{ animationDelay: `${i * 250}ms` }}>
          .
        </span>
      ))}
    </span>
  )
}

// Shake the phone to match now. iOS asks for motion access, which needs a tap first, so
// the Shake button asks; Android and others just listen.
function useShake(onShake: () => void) {
  const fired = useRef(false)
  useEffect(() => {
    let last = 0
    function onMotion(e: DeviceMotionEvent) {
      const a = e.accelerationIncludingGravity
      if (!a || fired.current) return
      const force = Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0)
      const t = e.timeStamp
      if (force > 24 && t - last > 200) {
        fired.current = true
        onShake()
      }
      last = t
    }
    window.addEventListener('devicemotion', onMotion)
    return () => window.removeEventListener('devicemotion', onMotion)
  })
  // Ask once on the first tap anywhere (iOS)
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

// ---- 3. Squad found ----

function squadRoutes(now: number, arrived: string[]): Route[] {
  const tag = (eta: number, who: string) => (arrived.includes(who) ? 'Here' : `${minutesLeft(now, eta)} min`)
  return [
    ...MEMBERS.map((m) => ({ id: m.id, face: flag(m.cc), from: m.from, progress: progressOf(now, m.eta), tag: tag(m.eta, m.id) })),
    { id: 'me', me: true, face: 'You', from: ME_FROM, progress: progressOf(now, MY_ETA), tag: tag(MY_ETA, 'me') },
  ]
}

export function FoundStep({ pin }: { pin: Pin }) {
  const now = useClock()
  const trip = useOnMyWay()
  const unread = trip.messages.filter((m) => m.from !== 'me' && m.from !== 'system').length

  return (
    <Screen>
      <TripMap className="min-h-0 flex-1" pin={<PinMark pin={pin} />} pinAt={PIN_AT} routes={squadRoutes(now, trip.arrived)} />
      <Button variant="secondary" size="icon-lg" aria-label="Back" onClick={() => backTo('pin')} className="absolute top-[max(env(safe-area-inset-top),12px)] left-3 shadow-md">
        <ChevronLeft className="size-5" />
      </Button>

      <div className="shrink-0 animate-rise rounded-t-3xl bg-background px-4 pt-5 pb-[max(env(safe-area-inset-bottom),16px)] shadow-[0_-6px_28px_rgba(0,0,0,0.10)]">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {MEMBERS.map((m) => (
              <Face key={m.id} cc={m.cc} className="size-14 animate-pop text-3xl" />
            ))}
            <Face me className="size-14 animate-pop" />
          </div>
          <h2 className="font-heading text-2xl font-semibold">Squad found</h2>
        </div>
        <ul className="mt-4 flex flex-wrap gap-2">
          {MEMBERS.map((m) => (
            <li key={m.id} className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm font-medium">
              <span className="text-base leading-none">{flag(m.cc)}</span>
              {m.name}
              <span className="text-muted-foreground">{m.city}</span>
            </li>
          ))}
        </ul>
        <Button size="lg" className="mt-5 h-16 w-full rounded-full text-lg" onClick={openChat}>
          <MessageCircle data-icon="inline-start" className="size-6" />
          Chat
          {unread > 0 && <span className="ml-1 rounded-full bg-background px-2 text-sm font-semibold text-foreground tabular-nums">{unread}</span>}
        </Button>
      </div>
    </Screen>
  )
}

// ---- 4. Team chat ----

export function ChatStep({ pin }: { pin: Pin }) {
  const navigate = useNavigate()
  const now = useClock()
  const trip = useOnMyWay()
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const everyone = trip.arrived.length === MEMBERS.length + 1

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [trip.messages.length, everyone])

  function submit(text: string) {
    send(text)
    setDraft('')
  }

  return (
    <Screen>
      <header className="flex h-14 shrink-0 items-center gap-1 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={() => backTo('found')}>
          <ChevronLeft className="size-5" />
        </Button>
        <span className="flex items-center gap-2 rounded-full bg-card py-1 pr-4 pl-1">
          <span className="flex -space-x-1.5">
            {MEMBERS.map((m) => (
              <Face key={m.id} cc={m.cc} className="size-8 rounded-xl text-base ring-card" />
            ))}
          </span>
          <span className="font-heading font-semibold">Team</span>
        </span>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pt-2 pb-4">
        {/* Live location: everyone closing in on the pin */}
        <TripMap className="h-48 rounded-3xl" pin={<PinMark pin={pin} className="size-10" />} pinAt={PIN_AT} routes={squadRoutes(now, trip.arrived)} />

        {trip.messages.map((m) => (
          <Bubble key={m.id} message={m} inFor={m.challenge ? (trip.inFor[m.challenge] ?? []) : []} />
        ))}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 space-y-2 px-4 pt-1 pb-[max(env(safe-area-inset-bottom),12px)]">
        {everyone ? (
          <Button size="lg" className="h-16 w-full animate-rise rounded-full text-lg" onClick={() => navigate(`/explore/pins/${pin.id}/capture`)}>
            <Camera data-icon="inline-start" className="size-6" />
            Take the photo
          </Button>
        ) : (
          <>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {['Coming! 🏃', '👋', 'Almost there'].map((q) => (
                <button key={q} type="button" onClick={() => submit(q)} className="h-9 shrink-0 rounded-full border px-4 text-sm font-medium active:scale-95">
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
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                aria-label="Message"
                className="h-12 min-w-0 flex-1 rounded-full bg-card px-5 text-base outline-none"
              />
              <Button type="submit" size="icon-lg" aria-label="Send" disabled={!draft.trim()}>
                <SendHorizontal />
              </Button>
            </form>
          </>
        )}
      </div>
    </Screen>
  )
}

function Bubble({ message, inFor }: { message: Message; inFor: string[] }) {
  if (message.from === 'system') {
    return (
      <p className="mx-auto flex w-fit items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-medium">
        {MEMBERS.map((m) => flag(m.cc)).join(' ')} {message.text}
      </p>
    )
  }
  const me = message.from === 'me'
  const member = memberById(message.from)
  return (
    <div className={cn('flex animate-rise items-end gap-2', me && 'flex-row-reverse')}>
      {!me && <Face cc={member?.cc} className="size-8 rounded-xl text-base" />}
      <div className={cn('flex max-w-[78%] flex-col gap-1.5', me && 'items-end')}>
        {message.text && (
          <p className={cn('rounded-2xl px-3.5 py-2 text-[15px] leading-snug', me ? 'bg-foreground text-background' : 'bg-card')}>{message.text}</p>
        )}
        {message.challenge && <ChallengeCard id={message.challenge} inFor={inFor} />}
      </div>
    </div>
  )
}

// A challenge put to the group: who's in, and your own I'm in
function ChallengeCard({ id, inFor }: { id: string; inFor: string[] }) {
  const trip = useOnMyWay()
  const { solo, group } = challengesFor(trip.pinId)
  const bonus = [...group, ...solo].find((b) => b.id === id)
  if (!bonus) return null
  const Icon = bonusIcon[bonus.kind]
  const mine = inFor.includes('me')
  return (
    <div className="w-64 rounded-3xl border-2 border-foreground bg-background p-3">
      <div className="flex items-center gap-2">
        <span className="flex w-fit items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs font-semibold">
          <Users className="size-3.5" />
          Group
        </span>
        <Torches n={BONUS_REWARD.together} className="ml-auto" />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Icon className="size-8 shrink-0" strokeWidth={1.5} />
        <p className="font-heading text-lg leading-tight font-semibold">{bonusTitle(bonus)}</p>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="flex -space-x-1.5">
          {inFor.map((who) => (who === 'me' ? <Face key={who} me className="size-8 rounded-xl" /> : <Face key={who} cc={memberById(who)?.cc} className="size-8 rounded-xl text-base" />))}
        </span>
        <Button size="sm" variant={mine ? 'secondary' : 'default'} className="ml-auto rounded-full" onClick={() => toggleIn(id)}>
          {mine ? <Check data-icon="inline-start" /> : null}
          {mine ? 'In' : 'I’m in'}
        </Button>
      </div>
    </div>
  )
}
