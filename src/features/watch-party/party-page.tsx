import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Camera, Car, Check, ChevronLeft, DoorOpen, Footprints, Gamepad2, MapPin, Navigation, Share, Toilet, TramFront, Tv, Users, UtensilsCrossed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImagePlaceholder } from '@/components/image-placeholder'
import { MapView, UserDot } from '@/components/map-view'
import { PinShape } from '@/components/pin-art'
import { flag, formatTime, placeById } from '@/data/la28'
import { formatKm, formatMinutes, travelFromYou, type LngLat } from '@/data/map-layers'
import { useClock } from '@/lib/clock'
import { useAtPlace, useFanLocation } from '@/lib/location'
import { useProfile } from '@/lib/profile'
import { cn } from '@/lib/utils'
import { GROUPINGS, you, type Grouping } from './crowd'
import { CrowdStage, type Picked } from './crowd-stage'
import { GAME, goTo, useGoingTo, type Party } from './parties'
import { crowdPlayAt, matchAt } from './match'

// A watch party's event page, built like the pin page: photos, the party, then sections, with
// the actions in a floating panel. Once you're there the same page greets you, like a store
// app when you walk in: the top turns into "Welcome to …" with the live score and CrowdPlay,
// and the rest of the page stays.

const MAP_PADDING = { top: 40, bottom: 40, left: 40, right: 40 }

export function PartyPage({ party }: { party: Party }) {
  const navigate = useNavigate()
  const here = useAtPlace(party.place)
  const going = useGoingTo() === party.id
  const now = useClock()
  const fan = useFanLocation()
  const profile = useProfile()
  const place = placeById(party.place)
  const coords: LngLat = [place.lng, place.lat]
  const trip = travelFromYou(coords, fan)
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`
  const people = going ? [...party.crowd, you(profile.country, profile.spoken)] : party.crowd

  return (
    <div className="relative flex h-dvh flex-col bg-background">
      <div className={cn('no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain', here ? 'pb-8' : 'pb-32')}>
        {here ? <Welcome party={party} now={now} /> : <Hero party={party} going={going} />}

        <div className="space-y-8 px-4 pt-6">
          {here && party.crowdPlay && <CrowdPlayCard now={now} onJoin={() => navigate(`/events/tonight/${party.id}/play`)} />}

          {!here && <Match />}

          <Section title="What you can do">
            <ul className="grid grid-cols-2 gap-3">
              {party.crowdPlay && !here && <Tile icon={<Gamepad2 />} label="CrowdPlay" value="Halftime" dark />}
              <Tile
                icon={<PinShape shape="tv" status={here ? 'open' : 'locked'} className="size-8" />}
                label="Party pin"
                action={
                  here && (
                    <Button size="lg" variant="outline" className="h-12 w-full rounded-full bg-background" onClick={() => navigate('/explore')}>
                      <Camera data-icon="inline-start" />
                      Photo
                    </Button>
                  )
                }
              />
              <Tile icon={<Tv />} label="Big screen" />
              <Tile icon={<UtensilsCrossed />} label="Food trucks" />
              {here && <Tile icon={<Toilet />} label="Restrooms" />}
            </ul>
          </Section>

          <Section title={here ? 'Who’s here' : 'Who’s going'} aside={<Count n={party.going + (going ? 1 : 0)} />}>
            <WhoIsGoing people={people} arriving={false} />
          </Section>

          {!here && (
            <Section title="Getting there" aside={<span className="text-sm font-medium tabular-nums">{formatKm(trip.km)}</span>}>
              <div className="h-44 overflow-hidden rounded-2xl bg-card">
                <MapView
                  interactive={false}
                  markers={[
                    { id: 'me', coords: fan },
                    { id: 'place', coords },
                  ]}
                  renderMarker={(id) => (id === 'me' ? <UserDot /> : <PinShape shape="tv" status="locked" className="size-9 drop-shadow" />)}
                  initialBounds={[fan, coords]}
                  initialPadding={MAP_PADDING}
                />
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-base font-medium">
                <MapPin className="size-5 shrink-0" />
                {place.name}
              </p>
              <ul className="mt-3 grid grid-cols-3 gap-2">
                <TravelTime icon={<Footprints />} minutes={trip.walk} />
                <TravelTime icon={<TramFront />} minutes={trip.transit} />
                <TravelTime icon={<Car />} minutes={trip.drive} />
              </ul>
            </Section>
          )}
        </div>
      </div>

      {/* Before you get there: two equal actions, like the pin page's panel */}
      {!here && (
        <div className="absolute inset-x-3 bottom-[max(env(safe-area-inset-bottom),12px)] z-30 grid grid-cols-2 gap-2 rounded-[1.75rem] border bg-background p-2 shadow-xl">
          <Button
            size="lg"
            variant={going ? 'outline' : 'default'}
            aria-pressed={going}
            className="h-14 rounded-full text-base"
            onClick={() => goTo(going ? null : party.id)}
          >
            {going && <Check data-icon="inline-start" className="size-5" />}
            {going ? 'Going' : 'Sign up'}
          </Button>
          <Button
            size="lg"
            variant={going ? 'default' : 'outline'}
            className="h-14 rounded-full text-base"
            nativeButton={false}
            render={<a href={directions} target="_blank" rel="noreferrer" />}
          >
            <Navigation data-icon="inline-start" className="size-5" />
            Directions
          </Button>
        </div>
      )}
    </div>
  )
}

// ---- Top of the page ----

function RoundButton({ label, onClick, children }: { label: string; onClick?: () => void; children: ReactNode }) {
  return (
    <Button variant="outline" size="icon-lg" aria-label={label} onClick={onClick} className="rounded-full bg-background text-foreground">
      {children}
    </Button>
  )
}

function TopButtons() {
  const navigate = useNavigate()
  return (
    <div className="absolute inset-x-4 top-[calc(env(safe-area-inset-top)+12px)] flex justify-between">
      <RoundButton label="Back" onClick={() => navigate(-1)}>
        <ChevronLeft className="size-5" />
      </RoundButton>
      <RoundButton label="Share">
        <Share className="size-5" />
      </RoundButton>
    </div>
  )
}

// Before you arrive: photos of the place, the party pin, the title
function Hero({ party, going }: { party: Party; going: boolean }) {
  return (
    <>
      <div className="relative">
        <ImagePlaceholder className="h-[calc(env(safe-area-inset-top)+15rem)] w-full rounded-none border-0" />
        <TopButtons />
      </div>
      <div className="flex flex-col items-center px-6 text-center">
        <div className="-mt-12 rounded-full border bg-background p-3 shadow-sm">
          <PinShape shape="tv" status="locked" className="size-20" />
        </div>
        <h1 className="mt-3 font-heading text-3xl leading-tight font-semibold">{party.title}</h1>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Chip>{party.kind}</Chip>
          {going && (
            <Chip dark>
              <Check className="size-4" />
              Going
            </Chip>
          )}
        </div>
      </div>
    </>
  )
}

// Once you're there: the page turns into the place you just walked into
function Welcome({ party, now }: { party: Party; now: number }) {
  const place = placeById(party.place)
  const match = matchAt(now)
  return (
    <div className="relative rounded-b-[2.25rem] bg-foreground px-5 pt-[calc(env(safe-area-inset-top)+76px)] pb-6 text-background">
      <TopButtons />
      <p className="text-5xl leading-none" aria-hidden>
        👋
      </p>
      <h1 className="mt-3 font-heading text-[2rem] leading-tight font-semibold">
        Welcome to
        <br />
        {place.name}
      </h1>
      <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center rounded-3xl bg-background/10 px-4 py-4">
        <span className="text-center text-5xl leading-none">{flag(GAME.home)}</span>
        <span className="flex flex-col items-center">
          <span className="font-heading text-4xl font-bold tabular-nums">{match ? `${match.home} – ${match.away}` : formatTime(GAME.kickoff)}</span>
          {match && <span className="mt-1 rounded-full bg-background px-2.5 py-0.5 text-sm font-semibold text-foreground tabular-nums">{match.label}</span>}
        </span>
        <span className="text-center text-5xl leading-none">{flag(GAME.away)}</span>
      </div>
    </div>
  )
}

// The game it shows, doors and the walk, before you go
function Match() {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Fact icon={<span className="text-2xl leading-none">{flag(GAME.home)}{flag(GAME.away)}</span>} value={formatTime(GAME.kickoff)} />
      <Fact icon={<DoorOpen />} value={formatTime('20:00')} />
      <Fact icon={<Gamepad2 />} value={formatTime('21:15')} />
    </div>
  )
}

export function CrowdPlayCard({ now, onJoin, className }: { now: number; onJoin: () => void; className?: string }) {
  const state = crowdPlayAt(now)
  return (
    <div className={cn('rounded-3xl border-2 border-foreground p-4', className)}>
      <div className="flex items-center gap-3">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background">
          <Gamepad2 className="size-8" />
        </span>
        <p className="min-w-0 flex-1 font-heading text-2xl font-semibold">CrowdPlay</p>
        <span className={cn('rounded-full px-3 py-1 text-base font-semibold tabular-nums', state.live ? 'bg-foreground text-background' : 'bg-card')}>{state.label}</span>
      </div>
      <Button size="lg" disabled={state.done} className="mt-4 h-16 w-full rounded-full text-lg" onClick={onJoin}>
        Join
      </Button>
    </div>
  )
}

// ---- Pieces ----

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

function Chip({ dark, children }: { dark?: boolean; children: ReactNode }) {
  return (
    <span className={cn('flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold', dark ? 'bg-foreground text-background' : 'bg-card')}>
      {children}
    </span>
  )
}

function Count({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-1.5 text-base font-semibold tabular-nums">
      <Users className="size-5" />
      {n.toLocaleString()}
    </span>
  )
}

function Fact({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-card py-3.5 [&_svg]:size-6">
      {icon}
      <span className="text-base font-semibold tabular-nums">{value}</span>
    </div>
  )
}

function Tile({ icon, label, value, action, dark }: { icon: ReactNode; label: string; value?: string; action?: ReactNode; dark?: boolean }) {
  return (
    <li className={cn('flex min-h-36 flex-col gap-2 rounded-3xl p-4 [&>svg]:size-7', dark ? 'bg-foreground text-background' : 'bg-card')}>
      {icon}
      <span className="mt-auto font-heading text-lg leading-tight font-semibold">{label}</span>
      {value && <span className="text-base font-semibold">{value}</span>}
      {action}
    </li>
  )
}

function TravelTime({ icon, minutes }: { icon: ReactNode; minutes: number }) {
  return (
    <li className="flex flex-col items-center gap-1.5 rounded-2xl bg-card py-3 [&_svg]:size-6">
      {icon}
      <span className="text-base font-semibold tabular-nums">{formatMinutes(minutes)}</span>
    </li>
  )
}

// The crowd as bubbles, regrouped by country, language or age
function WhoIsGoing({ people, arriving }: { people: ReturnType<typeof you>[]; arriving: boolean }) {
  const [by, setBy] = useState<Grouping>('country')
  const [picked, setPicked] = useState<Picked>(null)
  return (
    <div className="overflow-hidden rounded-3xl bg-card">
      <div className="relative h-72">
        <CrowdStage people={people} by={by} picked={picked} onPick={setPicked} arriving={arriving} />
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-3">
        {GROUPINGS.map((g) => (
          <button
            key={g.id}
            type="button"
            aria-pressed={by === g.id}
            onClick={() => {
              setBy(g.id)
              setPicked(null)
            }}
            className={cn(
              'h-11 shrink-0 rounded-full px-4 text-base font-semibold active:scale-95',
              by === g.id ? 'bg-foreground text-background' : 'bg-background',
            )}
          >
            {g.label}
          </button>
        ))}
      </div>
    </div>
  )
}
