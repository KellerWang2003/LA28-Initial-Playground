import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { BookOpen, Camera, Car, Check, ChevronLeft, Footprints, Hand, Lock, MapPin, Navigation, TramFront } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PinShape } from '@/components/pin-art'
import { SaveButton } from '@/components/save-sheet'
import { flag, formatDate, formatTime, pinById, placeById } from '@/data/la28'
import { formatKm, formatMinutes, travelFromYou, type LngLat } from '@/data/map-layers'
import { formatCountdown, localMinute, useClock } from '@/lib/clock'
import { useCollected } from '@/lib/collected'
import { metersBetween, useFanLocation } from '@/lib/location'
import { notify } from '@/lib/toasts'
import { cn } from '@/lib/utils'
import {
  CHECK_IN_BEFORE_MS,
  HERE_M,
  checkInOpen,
  doorsAt,
  fullTimeAt,
  kickoffAt,
  liveScore,
  teamCc,
  teamName,
  type Side,
  type WatchParty,
} from '@/features/watch-party/crowd'
import { BringingRow, SeatGrid, SideSplit } from '@/features/watch-party/seat-map'
import { JoinSheet } from '@/features/watch-party/join-sheet'
import { Beacon } from '@/features/watch-party/beacon'
import { CrowdStamp } from '@/features/watch-party/crowd-stamp'
import {
  checkIn,
  freeOnSide,
  giveUpSeat,
  mySeatNumber,
  seatsBySide,
  takeSeat,
  toggleStandby,
  useMySeat,
  useStandby,
} from '@/features/watch-party/state'

// One line from the host, shown under their name
const HOST_NOTES: Record<string, string> = {
  e_watch_bramar: 'I’ll hold the long table by the big screen. Wear your colors, both sides welcome.',
  e_watch_fb: 'Tacos on me for the first goal. Bring a flag if you have one.',
}
const HOSTED: Record<string, number> = { e_watch_bramar: 3, e_watch_fb: 5 }

// A fan-hosted watch party: the game it shows, who's in the room (seats with
// flags, never faces), what people are bringing and the pin you earn there.
// You join by taking a seat on a side. Near the place it turns into Check in,
// then the hold-up card and the group pose that collects the pin.
export default function WatchPartyPage({ party }: { party: WatchParty }) {
  const navigate = useNavigate()
  const now = useClock()
  const here = useFanLocation()
  const mine = useMySeat(party.event.id)
  const standby = useStandby(party.event.id)
  const collected = useCollected()
  const [joining, setJoining] = useState<Side | null>(null)
  const [beacon, setBeacon] = useState(false)
  // Seats that just filled, so their flags drop in
  const [justTaken, setJustTaken] = useState<number[]>([])

  const { event, teams } = party
  const place = placeById(event.place)
  const coords: LngLat = [place.lng, place.lat]
  const trip = travelFromYou(coords, here)
  const near = metersBetween(here, coords) <= HERE_M
  const pin = event.pin ? pinById(event.pin) : undefined
  const pinDone = !!pin && collected.includes(pin.id)
  const sides = seatsBySide(party, mine, now)
  const full = freeOnSide(party, 0, mine) + freeOnSide(party, 1, mine) === 0
  const host = event.host!

  function take(seat: { side: Side; bring?: Parameters<typeof takeSeat>[1]['bring']; plus: number }) {
    takeSeat(event.id, seat)
    const first = mySeatNumber(party, { ...seat, checkedIn: false })
    setJustTaken(Array.from({ length: seat.plus + 1 }, (_, i) => first + i))
    setJoining(null)
    notify({ title: `Seat ${first} is yours`, body: `${event.title} · in My activities`, to: '/events/mine?type=watch-party' })
  }

  function onCheckIn() {
    checkIn(event.id)
    setBeacon(true)
  }

  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/events', { replace: true }))

  return (
    <div className="relative flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={goBack}>
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="min-w-0 flex-1 truncate font-heading text-lg font-semibold">Watch party</h1>
        <SaveButton item={{ kind: 'event', id: event.id }} header />
      </header>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-40">
        <GameHero party={party} now={now} />

        <div className="px-4 pt-4">
          <h2 className="font-heading text-2xl leading-tight font-semibold">{event.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(event.date)} · Doors {formatTime(event.time)} · {place.name}
          </p>
          <div className="mt-4 flex gap-3 rounded-2xl bg-card p-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-background text-2xl">{flag(host.cc)}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium">
                Hosted by {host.name} <span className="font-normal text-muted-foreground">· {HOSTED[event.id] ?? 1} watch parties hosted</span>
              </p>
              {HOST_NOTES[event.id] && <p className="mt-0.5 text-sm text-muted-foreground">“{HOST_NOTES[event.id]}”</p>}
            </div>
          </div>
        </div>

        <div className="space-y-7 px-4 pt-7">
          <Section title="Who’s in the room" aside={<Legend />}>
            <div className="space-y-4 rounded-2xl bg-card p-3">
              <SideSplit party={party} sides={sides} />
              <SeatGrid
                party={party}
                sides={sides}
                justTaken={justTaken}
                onPick={mine ? undefined : (side) => freeOnSide(party, side) > 0 && setJoining(side)}
              />
              {!mine && !full && <p className="text-center text-xs text-muted-foreground">Tap an empty seat on the side you’re cheering for</p>}
            </div>
          </Section>

          <Section title="What people are bringing">
            <div className="rounded-2xl bg-card p-3">
              <BringingRow sides={sides} />
            </div>
          </Section>

          {pin && (
            <Section title="The pin">
              <div className="rounded-2xl bg-card p-4">
                {pinDone ? (
                  <div className="flex flex-col items-center text-center">
                    <CrowdStamp party={party} animate />
                    <p className="mt-3 font-medium">In your Passport, with everyone who was here</p>
                    <Button variant="outline" className="mt-3" onClick={() => navigate(`/passport?pin=${pin.id}`)}>
                      <BookOpen data-icon="inline-start" />
                      See the stamp
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <PinShape shape={pin.shape} status={pin.status} className="size-16" />
                    <div className="min-w-0">
                      <p className="font-medium">{pin.name.replace(/ Pin$/, '')}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Check in, then take a {event.task?.toLowerCase() ?? 'photo'} with 2 or more people from the party. Its stamp keeps the flags of everyone who came.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          <Section title="Getting there" aside={<span className="text-sm text-muted-foreground">{formatKm(trip.km)} away</span>}>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0" />
              {place.name}, {place.hood}
            </p>
            <ul className="mt-3 grid grid-cols-3 gap-2">
              <TravelTime icon={<Footprints />} label="Walk" minutes={trip.walk} />
              <TravelTime icon={<TramFront />} label="Transit" minutes={trip.transit} />
              <TravelTime icon={<Car />} label="Drive" minutes={trip.drive} />
            </ul>
          </Section>

          {mine && !mine.checkedIn && (
            <button type="button" onClick={() => giveUpSeat(event.id)} className="w-full py-2 text-center text-sm text-muted-foreground">
              Give up my seat
            </button>
          )}
        </div>
      </div>

      <ActionPanel>
        {!mine ? (
          full ? (
            <>
              <PanelText title="Every seat is taken" line={standby ? 'You’ll get an alert if one opens' : 'Stand by and we’ll tell you if one opens'} />
              <Button size="lg" variant={standby ? 'outline' : 'default'} onClick={() => toggleStandby(event.id)}>
                {standby ? 'Standing by' : 'Stand by'}
              </Button>
            </>
          ) : (
            <>
              <PanelText
                title={`${freeOnSide(party, 0) + freeOnSide(party, 1)} seats left`}
                line={`${teamName(teams[0])} ${freeOnSide(party, 0)} · ${teamName(teams[1])} ${freeOnSide(party, 1)}`}
              />
              <Button size="lg" onClick={() => setJoining(freeOnSide(party, 0) >= freeOnSide(party, 1) ? 0 : 1)}>
                Pick a seat
              </Button>
            </>
          )
        ) : mine.checkedIn ? (
          <>
            <Button size="lg" variant="outline" aria-label="Hold up your card" onClick={() => setBeacon(true)}>
              <Hand data-icon="inline-start" />
              Find them
            </Button>
            <Button
              size="lg"
              className="flex-1 tabular-nums"
              disabled={!pin || pinDone || now < doorsAt(party)}
              onClick={() => pin && navigate(`/explore/pins/${pin.id}/capture`)}
            >
              {pinDone ? (
                <>
                  <Check data-icon="inline-start" />
                  Pin collected
                </>
              ) : now < doorsAt(party) ? (
                <>
                  <Lock data-icon="inline-start" />
                  {formatCountdown(Math.ceil((doorsAt(party) - now) / 1000))}
                </>
              ) : (
                <>
                  <Camera data-icon="inline-start" />
                  {event.task ?? 'Group photo'}
                </>
              )}
            </Button>
          </>
        ) : near && checkInOpen(party, now) ? (
          <>
            <PanelText title="You’re here" line={`Seat ${mySeatNumber(party, mine)} · ${teamName(teams[mine.side])} side`} />
            <Button size="lg" onClick={onCheckIn}>
              Check in
            </Button>
          </>
        ) : (
          <>
            <PanelText title={`You’re in · Seat ${mySeatNumber(party, mine)}`} line={arrivalLine(party, now, trip.walk, near)} />
            <Button size="lg" variant="outline" nativeButton={false} render={<a href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`} target="_blank" rel="noreferrer" />}>
              <Navigation data-icon="inline-start" />
              Go
            </Button>
          </>
        )}
      </ActionPanel>

      {joining !== null && <JoinSheet party={party} initialSide={joining} onTake={take} onClose={() => setJoining(null)} />}
      {beacon && mine && <Beacon party={party} seat={mine} number={mySeatNumber(party, mine)} onClose={() => setBeacon(false)} />}
    </div>
  )
}

function arrivalLine(party: WatchParty, now: number, walk: number, near: boolean) {
  if (now > fullTimeAt(party)) return 'The game is over'
  const toDoors = Math.ceil((doorsAt(party) - now) / 1000)
  if (near) return `Check-in opens at ${formatTime(localMinute(doorsAt(party) - CHECK_IN_BEFORE_MS).slice(11))}`
  return toDoors > 0 ? `${formatMinutes(walk)} walk · doors in ${formatCountdown(toDoors)}` : `${formatMinutes(walk)} walk · the party is on`
}

// The game the party is showing: flags, then the score while it's on
function GameHero({ party, now }: { party: WatchParty; now: number }) {
  const live = now >= kickoffAt(party) && now <= fullTimeAt(party)
  const over = now > fullTimeAt(party)
  const score = liveScore(party, now)
  const [a, b] = party.teams
  return (
    <div className={cn('mx-4 rounded-2xl border border-transparent bg-card p-4', live && 'border-foreground')}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {party.session.sport} · {party.session.title.split(':')[0]}
        </span>
        <span className="tabular-nums">
          {live ? (
            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
              <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
              {score?.minute}′
            </span>
          ) : over ? (
            'Full time'
          ) : (
            `Kickoff ${formatTime(party.session.start)}`
          )}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Team team={a} />
        <span className="font-heading text-3xl font-bold tabular-nums">{score ? `${score.score[0]}–${score.score[1]}` : 'vs'}</span>
        <Team team={b} />
      </div>
    </div>
  )
}

function Team({ team }: { team: string }) {
  return (
    <span className="flex flex-col items-center gap-1">
      <span className="text-4xl leading-none">{flag(teamCc(team))}</span>
      <span className="text-sm font-medium">{teamName(team)}</span>
    </span>
  )
}

function Legend() {
  return (
    <span className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <span className="size-2.5 rounded-full ring-2 ring-foreground" />
        Here
      </span>
      <span className="flex items-center gap-1">
        <span className="size-2.5 rounded-full bg-muted-foreground/30" />
        On the way
      </span>
    </span>
  )
}

function ActionPanel({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-x-3 bottom-[max(env(safe-area-inset-bottom),12px)] z-30 flex items-center gap-2 rounded-3xl border bg-background p-3 shadow-xl">
      {children}
    </div>
  )
}

function PanelText({ title, line }: { title: string; line: string }) {
  return (
    <div className="min-w-0 flex-1 pl-1">
      <p className="truncate text-sm font-semibold">{title}</p>
      <p className="truncate text-xs text-muted-foreground tabular-nums">{line}</p>
    </div>
  )
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="font-heading font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

function TravelTime({ icon, label, minutes }: { icon: ReactNode; label: string; minutes: number }) {
  return (
    <li className="flex flex-col items-center gap-1 rounded-xl bg-card py-2.5 [&_svg]:size-5">
      {icon}
      <span className="text-sm font-medium tabular-nums">{formatMinutes(minutes)}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </li>
  )
}
