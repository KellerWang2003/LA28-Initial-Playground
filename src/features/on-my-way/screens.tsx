import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import { Check, ChevronLeft, ChevronRight, Flame, Navigation, SendHorizontal, User, Users, X } from 'lucide-react'
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
  cancelMatching,
  challengesFor,
  joinSquad,
  memberById,
  minutesLeft,
  progressOf,
  send,
  startMatching,
  toggleIn,
  useOnMyWay,
  type Message,
} from './state'
import { TripMap, type Route } from './trip-map'

// Heading to a pin with a squad, in black and white shadcn: the challenges row and your
// route on the pin's page, the small Matchmake pill, the squad found (full screen), the
// squad chat with live location, and everyone together at the end. Big buttons, squircle
// faces, no subtext: layout carries the meaning.

// ---- Shared bits ----

function Face({ cc, me, className, style }: { cc?: string; me?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <span
      style={style}
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

// ---- On the pin page ----

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

// Not there yet: a small Matchmake pill over one wide button. The pill searches while you
// keep browsing the page, then turns into the squad it found.
export function AwayBar({ pin, directions }: { pin: Pin; directions: string }) {
  const navigate = useNavigate()
  const trip = useOnMyWay()
  const step = trip.pinId === pin.id ? trip.step : 'idle'

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-3 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pt-10 pb-[max(env(safe-area-inset-bottom),16px)]">
      {step === 'offer' ? (
        <button
          type="button"
          onClick={() => navigate(`/explore/pins/${pin.id}/squad`)}
          className="flex h-14 animate-pop items-center gap-3 rounded-full bg-foreground pr-3 pl-5 text-background shadow-xl active:scale-95"
        >
          <span className="font-heading text-lg font-semibold">Squad found</span>
          <span className="flex -space-x-2">
            {MEMBERS.map((m) => (
              <Face key={m.id} cc={m.cc} className="size-9 rounded-xl text-lg ring-foreground" />
            ))}
          </span>
          <ChevronRight className="size-5" />
        </button>
      ) : step === 'matching' ? (
        <span className="flex h-12 items-center gap-2 rounded-full border bg-background pr-1.5 pl-5 shadow-lg">
          <span className="font-semibold">Matchmaking</span>
          <span className="flex gap-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-1.5 animate-pulse rounded-full bg-foreground" style={{ animationDelay: `${i * 200}ms` }} />
            ))}
          </span>
          <Button variant="ghost" size="icon" aria-label="Stop" onClick={cancelMatching} className="ml-1 rounded-full">
            <X className="size-4" />
          </Button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => startMatching(pin.id)}
          className="flex h-12 items-center gap-2 rounded-full border bg-background pr-2 pl-5 shadow-lg active:scale-95"
        >
          <span className="font-semibold">Matchmake</span>
          <span className="flex -space-x-1.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-7 rounded-xl border-2 border-dashed border-muted-foreground/50 bg-background" />
            ))}
          </span>
        </button>
      )}

      {/* Directions hand off to the fan's maps app; the app doesn't route */}
      <Button size="lg" className="h-16 w-full rounded-full text-lg" nativeButton={false} render={<a href={directions} target="_blank" rel="noreferrer" />}>
        <Navigation data-icon="inline-start" className="size-6" />
        Directions
      </Button>
    </div>
  )
}

// ---- Squad found: full screen ----

export function YourSquad({ pin }: { pin: Pin }) {
  const navigate = useNavigate()
  const now = useClock()
  const place = placeById(pin.place)

  return (
    <div className="flex h-dvh flex-col bg-background px-5 pt-[calc(env(safe-area-inset-top)+3rem)] pb-[max(env(safe-area-inset-bottom),16px)]">
      <h1 className="font-heading text-3xl leading-tight font-semibold">We found you a squad for your {place.name} trip!</h1>

      <ul className="mt-8 space-y-3">
        {MEMBERS.map((m, i) => (
          <li key={m.id} className="flex animate-rise items-center gap-4 rounded-3xl bg-card p-3 pr-4" style={{ animationDelay: `${i * 120}ms` }}>
            <Face cc={m.cc} className="size-14 rounded-[1.1rem] text-3xl ring-card" />
            <span className="font-heading text-xl font-semibold">{m.name}</span>
            <span className="ml-auto rounded-full bg-background px-3 py-1 font-semibold tabular-nums">{minutesLeft(now, m.eta)} min</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col items-center gap-1">
        <Button
          size="lg"
          className="h-16 w-full rounded-full text-lg"
          onClick={() => {
            joinSquad()
            navigate(`/explore/pins/${pin.id}/squad`, { replace: true })
          }}
        >
          Join squad
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="h-12 rounded-full px-6 text-base"
          onClick={() => {
            cancelMatching()
            navigate(`/explore/pins/${pin.id}`, { replace: true })
          }}
        >
          Not now
        </Button>
      </div>
    </div>
  )
}

// ---- Squad chat ----

// Live location: where everyone is now, the pin in the middle
const LIVE_PIN: [number, number] = [50, 50]

function liveRoutes(now: number, arrived: string[]): Route[] {
  const tag = (eta: number, who: string) => (arrived.includes(who) ? 'Here' : `${minutesLeft(now, eta)} min`)
  return [
    ...MEMBERS.map((m) => ({ id: m.id, face: flag(m.cc), from: m.from, progress: progressOf(now, m.eta), tag: tag(m.eta, m.id) })),
    { id: 'me', me: true, face: 'You', from: ME_FROM, progress: progressOf(now, MY_ETA), tag: tag(MY_ETA, 'me') },
  ]
}

export function SquadChat({ pin }: { pin: Pin }) {
  const navigate = useNavigate()
  const now = useClock()
  const trip = useOnMyWay()
  const [draft, setDraft] = useState('')
  const [people, setPeople] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const everyone = trip.arrived.length === MEMBERS.length + 1

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [trip.messages.length])

  if (everyone) return <Together pin={pin} />

  return (
    <div className="relative flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-16 shrink-0 items-center gap-2 px-3">
        <Button variant="outline" size="icon-lg" aria-label="Back" className="rounded-full" onClick={() => navigate(`/explore/pins/${pin.id}`)}>
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="mx-auto flex h-11 min-w-0 items-center gap-2 rounded-full bg-card px-4 font-heading text-lg font-semibold">
          <PinShape shape={pin.shape} status={pin.status} className="size-6 shrink-0" />
          <span className="truncate">{placeById(pin.place).name.split(' ')[0]} squad</span>
        </h1>
        <Button variant="outline" size="icon-lg" aria-label="Squad" className="rounded-full" onClick={() => setPeople(true)}>
          <Users className="size-5" />
        </Button>
      </header>

      <div className="shrink-0 px-4 pb-2">
        <TripMap live className="h-48 rounded-3xl" pin={<PinMark pin={pin} className="size-10" />} pinAt={LIVE_PIN} routes={liveRoutes(now, trip.arrived)} />
      </div>

      <div className="no-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pt-2 pb-4">
        {trip.messages.map((m) => (
          <Bubble key={m.id} message={m} pinId={pin.id} inFor={m.challenge ? (trip.inFor[m.challenge] ?? []) : []} />
        ))}
        <div ref={endRef} />
      </div>

      <form
        className="flex shrink-0 items-center gap-2 px-4 pt-2 pb-[max(env(safe-area-inset-bottom),12px)]"
        onSubmit={(e) => {
          e.preventDefault()
          send(draft)
          setDraft('')
        }}
      >
        <input value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Message" className="h-14 min-w-0 flex-1 rounded-full bg-card px-5 text-base outline-none" />
        <Button type="submit" size="icon-lg" aria-label="Send" disabled={!draft.trim()} className="size-14 rounded-full">
          <SendHorizontal className="size-5" />
        </Button>
      </form>

      {people && <SquadSheet arrived={trip.arrived} onClose={() => setPeople(false)} />}
    </div>
  )
}

// Who's in the squad and how far away they are
function SquadSheet({ arrived, onClose }: { arrived: string[]; onClose: () => void }) {
  const now = useClock()
  const rows = [...MEMBERS.map((m) => ({ id: m.id, name: m.name, cc: m.cc, eta: m.eta, me: false })), { id: 'me', name: 'You', cc: '', eta: MY_ETA, me: true }]
  return (
    <>
      <div aria-hidden onClick={onClose} className="absolute inset-0 z-40 bg-black/30" />
      <div className="absolute inset-x-3 bottom-[max(env(safe-area-inset-bottom),12px)] z-50 animate-rise rounded-3xl bg-background p-4 shadow-2xl">
        <div className="flex items-center">
          <h2 className="font-heading text-xl font-semibold">Squad</h2>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose} className="ml-auto -mr-1">
            <X className="size-5" />
          </Button>
        </div>
        <ul className="mt-2 divide-y divide-background overflow-hidden rounded-2xl bg-card">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 p-3">
              <Face cc={r.cc} me={r.me} className="ring-card" />
              <span className="font-semibold">{r.name}</span>
              <span className="ml-auto rounded-full bg-background px-2.5 py-0.5 text-sm font-semibold tabular-nums">
                {arrived.includes(r.id) ? 'Here' : `${minutesLeft(now, r.eta)} min`}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

function Bubble({ message, pinId, inFor }: { message: Message; pinId: string; inFor: string[] }) {
  const me = message.from === 'me'
  const member = memberById(message.from)
  const { solo, group } = challengesFor(pinId)
  const challenge = message.challenge ? [...solo, ...group].find((b) => b.id === message.challenge) : undefined
  return (
    <div className={cn('flex animate-rise items-end gap-2', me && 'flex-row-reverse')}>
      {!me && <Face cc={member?.cc} className="size-9 rounded-xl text-lg" />}
      <div className={cn('flex max-w-[78%] flex-col gap-2', me && 'items-end')}>
        {message.text && <p className={cn('rounded-3xl px-4 py-2.5 text-base leading-snug', me ? 'bg-foreground text-background' : 'bg-card')}>{message.text}</p>}
        {challenge && <ChallengeCard bonus={challenge} inFor={inFor} />}
      </div>
    </div>
  )
}

// A challenge someone put to the squad: who's in, and your own I'm in
function ChallengeCard({ bonus, inFor }: { bonus: Bonus; inFor: string[] }) {
  const mine = inFor.includes('me')
  return (
    <div className="flex w-60 flex-col items-center rounded-3xl border-2 border-foreground p-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-card">
        <Users className="size-7" strokeWidth={1.75} />
      </span>
      <p className="mt-3 font-heading text-lg leading-tight font-semibold">{bonusTitle(bonus)}</p>
      <div className="mt-2 flex items-center gap-2">
        <Torches n={BONUS_REWARD.together} />
        <span className="flex -space-x-1.5">
          {inFor.map((who) =>
            who === 'me' ? <Face key={who} me className="size-7 rounded-lg text-[9px]" /> : <Face key={who} cc={memberById(who)?.cc} className="size-7 rounded-lg text-sm" />,
          )}
        </span>
      </div>
      <Button size="lg" variant={mine ? 'secondary' : 'default'} className="mt-3 h-12 w-full rounded-full text-base" onClick={() => toggleIn(bonus.id)}>
        {mine && <Check data-icon="inline-start" />}
        {mine ? 'In' : 'I’m in'}
      </Button>
    </div>
  )
}

// ---- Everyone's here: full screen ----

function Together({ pin }: { pin: Pin }) {
  const navigate = useNavigate()
  return (
    <div className="flex h-dvh flex-col items-center bg-background px-5 pt-[env(safe-area-inset-top)] pb-[max(env(safe-area-inset-bottom),16px)] text-center">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex -space-x-3">
          {MEMBERS.map((m, i) => (
            <Face key={m.id} cc={m.cc} className="size-20 animate-pop rounded-[1.6rem] text-4xl ring-4" style={{ animationDelay: `${i * 120}ms` }} />
          ))}
          <Face me className="size-20 animate-pop rounded-[1.6rem] text-lg ring-4" style={{ animationDelay: `${MEMBERS.length * 120}ms` }} />
        </div>
        <h1 className="mt-8 font-heading text-4xl leading-tight font-semibold">You are all here!</h1>
      </div>
      <Button size="lg" className="h-16 w-full rounded-full text-lg" onClick={() => navigate(`/explore/pins/${pin.id}/capture`)}>
        Start
      </Button>
    </div>
  )
}
