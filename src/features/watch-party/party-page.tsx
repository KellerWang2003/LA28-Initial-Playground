import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ArrowUpRight, Car, Check, ChevronLeft, DoorOpen, Footprints, Gamepad2, MapPin, Navigation, Share, TramFront, Tv, Users, UtensilsCrossed } from 'lucide-react'
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
import { WhoPanel } from './who-panel'
import { GAME, goTo, useGoingTo, type Party } from './parties'
import { crowdPlayAt, matchAt } from './match'

// A watch party's event page. The header is like a project's: the crowd icon at the top center
// (its colors are who's going; tap for the details) with the name under it. Then photos,
// facts and sections, with the two actions floating at the bottom. Once you're there, only the
// header changes, like a store app greeting you when you walk in: "Welcome to …". The facts
// turn live and the actions become what you do there.

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
      <div className={cn('no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain', here ? 'pb-10' : 'pb-32')}>
        {/* Header, like a project's: the crowd icon at the top center (tap for who's going) and
            the name under it. Once you're there, the name turns into the welcome. */}
        <header className="sticky top-0 z-20 bg-background/95 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-4 backdrop-blur">
          <div className="grid grid-cols-[auto_1fr_auto] items-start">
            <Button variant="outline" size="icon-lg" aria-label="Back" onClick={() => navigate(-1)} className="size-12 rounded-full bg-background">
              <ChevronLeft className="size-5" />
            </Button>
            <div className="flex flex-col items-center">
              <button type="button" aria-label="Who’s going" onClick={() => setWho(true)} className="rounded-full transition-transform active:scale-95">
                <CrowdPin seed={party.id} shape={party.shape} people={people} className="size-20" />
              </button>
              <h1
                className={cn(
                  '-mt-3 flex h-11 max-w-full items-center gap-1.5 truncate rounded-full border px-4 font-heading text-base font-semibold',
                  here ? 'border-foreground bg-foreground text-background' : 'bg-background',
                )}
              >
                {here ? (
                  <>
                    <span aria-hidden>👋</span>
                    Welcome to {place.name}
                  </>
                ) : (
                  party.title
                )}
              </h1>
            </div>
            <Button variant="outline" size="icon-lg" aria-label="Share" className="size-12 rounded-full bg-background">
              <Share className="size-5" />
            </Button>
          </div>
        </header>

        {/* The photo shows where it is. Once you're there, you don't need it */}
        {!here && (
          <div className="px-4">
            <ImagePlaceholder className="h-48 w-full rounded-3xl border-0" />
          </div>
        )}

        <div className={cn('space-y-8 px-4', here ? 'pt-2' : 'pt-6')}>
          {/* The game, doors, and how many are going, in one slim row */}
          <div className="flex h-14 items-center justify-between rounded-2xl bg-card px-2 text-base font-semibold whitespace-nowrap tabular-nums">
            <span className={cn('flex h-10 items-center gap-1.5 rounded-full px-3', match && 'bg-foreground text-background')}>
              <span className="text-xl leading-none">
                {flag(GAME.home)}
                {flag(GAME.away)}
              </span>
              {match ? `${match.home}–${match.away} · ${match.label}` : formatTime(GAME.kickoff)}
            </span>
            <span className="flex items-center gap-1.5 px-2">
              <DoorOpen className="size-5" />
              {formatTime(party.doors)}
            </span>
            <button type="button" onClick={() => setWho(true)} className="flex h-10 items-center gap-1.5 rounded-full px-3 active:bg-background">
              <Users className="size-5" />
              {(people.length - party.crowd.length + party.going).toLocaleString()}
            </button>
          </div>

          {/* Before you get there it's a short list of what's on. Once you're there it opens
              up into the full board, and the tiles you can use open from it. */}
          <Section title="What you can do">
            {here ? (
              <ul className="grid grid-cols-2 gap-3">
                {party.crowdPlay && <Tile icon={<Gamepad2 />} label="CrowdPlay" value={play.label} dark onClick={!play.done ? () => navigate(`/events/tonight/${party.id}/play`) : undefined} />}
                <Tile icon={<PinShape shape={party.shape} status="open" className="size-8" />} label="Party pin" value="Open" onClick={() => navigate('/explore')} />
                <Tile icon={<Tv />} label="Big screen" />
                <Tile icon={<UtensilsCrossed />} label="Food trucks" />
              </ul>
            ) : (
              <ul className="divide-y-4 divide-background overflow-hidden rounded-2xl bg-card">
                {party.crowdPlay && <Row icon={<Gamepad2 />} label="CrowdPlay" value="Halftime" />}
                <Row icon={<PinShape shape={party.shape} status="locked" className="size-7" />} label="Party pin" />
                <Row icon={<Tv />} label="Big screen" />
                <Row icon={<UtensilsCrossed />} label="Food trucks" />
              </ul>
            )}
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
          )}
        </div>
      </div>

      {/* Before you get there: two actions floating over the page. Once you're there, the page
          itself is the board: its tiles open what you can do. */}
      {!here && (
        <div className="absolute inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-2 bg-gradient-to-t from-background via-background to-transparent px-4 pt-10 pb-[max(env(safe-area-inset-bottom),16px)]">
          <>
            <Button
              size="lg"
              variant={going ? 'outline' : 'default'}
              aria-pressed={going}
              className={cn('h-14 rounded-full text-base', going && 'bg-background')}
              onClick={() => goTo(going ? null : party.id)}
            >
              {going && <Check data-icon="inline-start" className="size-5" />}
              {going ? 'Going' : 'Sign up'}
            </Button>
            <Button
              size="lg"
              variant={going ? 'default' : 'outline'}
              className={cn('h-14 rounded-full text-base', !going && 'bg-background')}
              nativeButton={false}
              render={<a href={directions} target="_blank" rel="noreferrer" />}
            >
              <Navigation data-icon="inline-start" className="size-5" />
              Directions
            </Button>
          </>
        </div>
      )}

      {who && <WhoPanel seed={party.id} shape={party.shape} title={party.title} people={people} onClose={() => setWho(false)} />}
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

function Row({ icon, label, value }: { icon: ReactNode; label: string; value?: string }) {
  return (
    <li className="flex h-16 items-center gap-3 px-4 [&>svg]:size-6">
      {icon}
      <span className="font-heading text-lg font-semibold">{label}</span>
      {value && <span className="ml-auto text-base font-semibold tabular-nums">{value}</span>}
    </li>
  )
}

// Once you're there, the tiles you can act on open it (an arrow shows which)
function Tile({ icon, label, value, dark, onClick }: { icon: ReactNode; label: string; value?: string; dark?: boolean; onClick?: () => void }) {
  const body = (
    <>
      <span className="flex items-start justify-between [&>svg]:size-7">
        {icon}
        {onClick && (
          <span className={cn('flex size-9 items-center justify-center rounded-full', dark ? 'bg-background text-foreground' : 'bg-foreground text-background')}>
            <ArrowUpRight className="size-5" />
          </span>
        )}
      </span>
      <span className="mt-auto font-heading text-lg leading-tight font-semibold">{label}</span>
      {value && <span className="text-base font-semibold tabular-nums">{value}</span>}
    </>
  )
  const look = cn('flex min-h-44 w-full flex-col gap-2 rounded-3xl p-4 text-left', dark ? 'bg-foreground text-background' : 'bg-card')
  return (
    <li>
      {onClick ? (
        <button type="button" onClick={onClick} className={cn(look, 'transition-transform active:scale-[0.98]')}>
          {body}
        </button>
      ) : (
        <div className={look}>{body}</div>
      )}
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
