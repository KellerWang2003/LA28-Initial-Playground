import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Camera, Car, Check, ChevronLeft, DoorOpen, Footprints, Gamepad2, MapPin, Navigation, Share, TramFront, Tv, Users, UtensilsCrossed } from 'lucide-react'
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
import { you } from './crowd'
import { CrowdPin } from './crowd-pin'
import { WhoSheet } from './who-sheet'
import { GAME, goTo, useGoingTo, type Party } from './parties'
import { crowdPlayAt, matchAt } from './match'

// A watch party's event page, built like the pin page: photos, the crowd pin at the top center
// (its colors are who's going; tap for the details), the title, then sections, with the two
// actions floating at the bottom. Once you're there, only the header changes, like a store app
// greeting you when you walk in: "Welcome to …". The facts turn live and the actions become
// what you do there.

const MAP_PADDING = { top: 40, bottom: 40, left: 40, right: 40 }

export function PartyPage({ party }: { party: Party }) {
  const navigate = useNavigate()
  const here = useAtPlace(party.place)
  const going = useGoingTo() === party.id
  const now = useClock()
  const fan = useFanLocation()
  const profile = useProfile()
  const [who, setWho] = useState(false)
  const place = placeById(party.place)
  const coords: LngLat = [place.lng, place.lat]
  const trip = travelFromYou(coords, fan)
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`
  const people = going || here ? [...party.crowd, you(profile.country, profile.spoken)] : party.crowd
  const match = here ? matchAt(now) : null
  const play = crowdPlayAt(now)

  return (
    <div className="relative flex h-dvh flex-col bg-background">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-32">
        {/* Header: photos of the place, or once you're there, the welcome */}
        <div className="relative h-[calc(env(safe-area-inset-top)+15rem)]">
          <ImagePlaceholder className="size-full rounded-none border-0" />
          {here && (
            <div className="absolute inset-0 flex flex-col justify-end bg-foreground/90 px-6 pb-[4.75rem] text-background">
              <p className="text-4xl leading-none" aria-hidden>
                👋
              </p>
              <p className="mt-2 font-heading text-[1.75rem] leading-tight font-semibold">Welcome to {place.name}</p>
            </div>
          )}
          <TopButtons />
        </div>

        {/* The crowd pin, the title */}
        <div className="flex flex-col items-center px-6 text-center">
          <button
            type="button"
            aria-label="Who’s going"
            onClick={() => setWho(true)}
            className="relative -mt-16 rounded-full bg-background p-1.5 shadow-md transition-transform active:scale-95"
          >
            <CrowdPin shape={party.shape} people={people} className="size-28" />
          </button>
          <h1 className="mt-3 font-heading text-3xl leading-tight font-semibold">{party.title}</h1>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Chip>{party.kind}</Chip>
            {(going || here) && (
              <Chip dark>
                <Check className="size-4" />
                Going
              </Chip>
            )}
          </div>
        </div>

        <div className="space-y-8 px-4 pt-6">
          <div className="grid grid-cols-3 gap-2">
            <Fact
              icon={<span className="text-2xl leading-none">{flag(GAME.home)}{flag(GAME.away)}</span>}
              value={match ? `${match.home}–${match.away} · ${match.label}` : formatTime(GAME.kickoff)}
              live={!!match}
            />
            <Fact icon={<DoorOpen />} value={formatTime(party.doors)} />
            <Fact icon={<Users />} value={(people.length - party.crowd.length + party.going).toLocaleString()} onClick={() => setWho(true)} />
          </div>

          <Section title="What you can do">
            <ul className="grid grid-cols-2 gap-3">
              {party.crowdPlay && <Tile icon={<Gamepad2 />} label="CrowdPlay" value={here ? play.label : 'Halftime'} dark />}
              <Tile icon={<PinShape shape={party.shape} status={here ? 'open' : 'locked'} className="size-8" />} label="Party pin" />
              <Tile icon={<Tv />} label="Big screen" />
              <Tile icon={<UtensilsCrossed />} label="Food trucks" />
            </ul>
          </Section>

          <Section title="Getting there" aside={<span className="text-sm font-medium tabular-nums">{formatKm(trip.km)}</span>}>
            <div className="h-44 overflow-hidden rounded-2xl bg-card">
              <MapView
                interactive={false}
                markers={[
                  { id: 'me', coords: fan },
                  { id: 'place', coords },
                ]}
                renderMarker={(id) => (id === 'me' ? <UserDot /> : <PinShape shape={party.shape} status={here ? 'open' : 'locked'} className="size-9 drop-shadow" />)}
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
        </div>
      </div>

      {/* The two actions, floating over the page: getting there before, what to do once you're there */}
      <div className="absolute inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-2 bg-gradient-to-t from-background via-background to-transparent px-4 pt-10 pb-[max(env(safe-area-inset-bottom),16px)]">
        {here ? (
          <>
            <Button size="lg" variant="outline" className="h-14 rounded-full bg-background text-base" onClick={() => navigate('/explore')}>
              <Camera data-icon="inline-start" className="size-5" />
              Photo
            </Button>
            <Button size="lg" disabled={play.done || !party.crowdPlay} className="h-14 rounded-full text-base" onClick={() => navigate(`/events/tonight/${party.id}/play`)}>
              <Gamepad2 data-icon="inline-start" className="size-5" />
              {play.done ? 'Done' : 'Join'}
              {!play.done && !play.live && <span className="rounded-full bg-background/20 px-2 py-0.5 text-sm tabular-nums">{play.label}</span>}
            </Button>
          </>
        ) : (
          <>
            <Button size="lg" variant="outline" aria-pressed={going} className="h-14 rounded-full bg-background text-base" onClick={() => goTo(going ? null : party.id)}>
              {going && <Check data-icon="inline-start" className="size-5" />}
              {going ? 'Going' : 'Sign up'}
            </Button>
            <Button size="lg" className="h-14 rounded-full text-base" nativeButton={false} render={<a href={directions} target="_blank" rel="noreferrer" />}>
              <Navigation data-icon="inline-start" className="size-5" />
              Directions
            </Button>
          </>
        )}
      </div>

      {who && <WhoSheet people={people} onClose={() => setWho(false)} />}
    </div>
  )
}

// ---- Pieces ----

function TopButtons() {
  const navigate = useNavigate()
  return (
    <div className="absolute inset-x-4 top-[calc(env(safe-area-inset-top)+12px)] flex justify-between">
      <Button variant="outline" size="icon-lg" aria-label="Back" onClick={() => navigate(-1)} className="rounded-full bg-background text-foreground">
        <ChevronLeft className="size-5" />
      </Button>
      <Button variant="outline" size="icon-lg" aria-label="Share" className="rounded-full bg-background text-foreground">
        <Share className="size-5" />
      </Button>
    </div>
  )
}

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

function Fact({ icon, value, live, onClick }: { icon: ReactNode; value: string; live?: boolean; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={cn(
        'flex flex-col items-center gap-2 rounded-2xl py-3.5 [&_svg]:size-6',
        live ? 'bg-foreground text-background' : 'bg-card',
        onClick && 'active:scale-95',
      )}
    >
      {icon}
      <span className="text-base font-semibold whitespace-nowrap tabular-nums">{value}</span>
    </Tag>
  )
}

function Tile({ icon, label, value, dark }: { icon: ReactNode; label: string; value?: string; dark?: boolean }) {
  return (
    <li className={cn('flex min-h-36 flex-col gap-2 rounded-3xl p-4 [&>svg]:size-7', dark ? 'bg-foreground text-background' : 'bg-card')}>
      {icon}
      <span className="mt-auto font-heading text-lg leading-tight font-semibold">{label}</span>
      {value && <span className="text-base font-semibold tabular-nums">{value}</span>}
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
