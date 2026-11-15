import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Camera, ChevronLeft, DoorOpen, Footprints, Gamepad2, Navigation, Share, Tv, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImagePlaceholder } from '@/components/image-placeholder'
import { PinShape } from '@/components/pin-art'
import { flag, formatTime, placeById } from '@/data/la28'
import { formatMinutes, travelFromYou } from '@/data/map-layers'
import { formatCountdown, useClock } from '@/lib/clock'
import { useAtPlace, useFanLocation } from '@/lib/location'
import { cn } from '@/lib/utils'
import { GAME, type Party } from './parties'

// A watch party's page. Before you get there: when, where, and what you can do there.
// Once you're there it turns into the party itself, like a store app greeting you when
// you walk in: welcome, the live score, CrowdPlay on the big screen, and the party's pin.

const DAY = '2028-07-20'
const KICKOFF = Date.parse(`${DAY}T${GAME.kickoff}`)
// Halftime, when the host runs CrowdPlay on the big screen
export const HALFTIME = KICKOFF + 45 * 60_000
const HALFTIME_END = HALFTIME + 15 * 60_000

// The match as of now: a minute and a score, made up for the demo
function matchAt(now: number) {
  const min = Math.floor((now - KICKOFF) / 60_000)
  if (min < 0) return null
  const played = now >= HALFTIME_END ? min - 15 : Math.min(min, 45)
  const home = played >= 23 ? 1 : 0
  const away = played >= 61 ? 1 : 0
  const label = now >= HALFTIME && now < HALFTIME_END ? 'HT' : `${Math.min(played, 90)}′`
  return { home, away, label }
}

export function PartyPage({ party }: { party: Party }) {
  const here = useAtPlace(party.place)
  return here ? <AtParty party={party} /> : <BeforeParty party={party} />
}

function Header({ dark }: { dark?: boolean }) {
  const navigate = useNavigate()
  return (
    <header className={cn('flex h-14 shrink-0 items-center justify-between px-2', dark && 'text-background')}>
      <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={() => navigate(-1)} className={cn(dark && 'hover:bg-background/10 hover:text-background')}>
        <ChevronLeft className="size-5" />
      </Button>
      <Button variant="ghost" size="icon-lg" aria-label="Share" className={cn(dark && 'hover:bg-background/10 hover:text-background')}>
        <Share className="size-5" />
      </Button>
    </header>
  )
}

function Tile({ icon, label, value, className }: { icon: ReactNode; label: string; value?: ReactNode; className?: string }) {
  return (
    <li className={cn('flex flex-col gap-2 rounded-3xl bg-card p-4 [&_svg]:size-7', className)}>
      {icon}
      <span className="mt-auto font-heading text-lg leading-tight font-semibold">{label}</span>
      {value && <span className="text-base font-semibold tabular-nums">{value}</span>}
    </li>
  )
}

// ---- Before you get there ----

function BeforeParty({ party }: { party: Party }) {
  const place = placeById(party.place)
  const fan = useFanLocation()
  const trip = travelFromYou([place.lng, place.lat], fan)

  return (
    <div className="relative flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <Header />
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-32">
        <div className="relative">
          <ImagePlaceholder className="h-36 rounded-3xl border-0" />
          <span className="absolute top-3 left-3 rounded-full bg-foreground px-3 py-1 text-sm font-semibold text-background">Going</span>
        </div>
        <h1 className="mt-4 font-heading text-3xl leading-tight font-semibold">{party.title}</h1>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Fact icon={<DoorOpen />} value={formatTime(party.doors)} />
          <Fact icon={<span className="text-xl leading-none">{flag(GAME.home)}{flag(GAME.away)}</span>} value={formatTime(GAME.kickoff)} />
          <Fact icon={<Footprints />} value={formatMinutes(trip.walk)} />
        </div>

        <h2 className="mt-7 mb-3 font-heading text-xl font-semibold">What you can do</h2>
        <ul className="grid grid-cols-2 gap-3">
          {party.crowdPlay && <Tile icon={<Gamepad2 />} label="CrowdPlay" value="Halftime" className="h-36 bg-foreground text-background" />}
          <Tile icon={<Tv />} label="Big screen" className="h-36" />
          <Tile icon={<PinShape shape="tv" status="locked" className="size-9" />} label="Party pin" className="h-36" />
          <Tile
            icon={<Users />}
            label="Who’s going"
            value={<FlagRow party={party} />}
            className="h-36"
          />
        </ul>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background to-transparent px-4 pt-8 pb-[max(env(safe-area-inset-bottom),16px)]">
        <Button
          size="lg"
          className="h-16 w-full rounded-full text-lg"
          nativeButton={false}
          render={<a href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`} target="_blank" rel="noreferrer" />}
        >
          <Navigation data-icon="inline-start" className="size-6" />
          Directions
        </Button>
      </div>
    </div>
  )
}

function Fact({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-card py-3 [&_svg]:size-6">
      {icon}
      <span className="text-base font-semibold tabular-nums">{value}</span>
    </div>
  )
}

// The biggest countries in the crowd
function FlagRow({ party }: { party: Party }) {
  const counts = new Map<string, number>()
  party.crowd.forEach((p) => counts.set(p.cc, (counts.get(p.cc) ?? 0) + 1))
  const top = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 4)
  return <span className="text-xl leading-none tracking-wider">{top.map(([cc]) => flag(cc)).join('')}</span>
}

// ---- At the party ----

function AtParty({ party }: { party: Party }) {
  const navigate = useNavigate()
  const now = useClock()
  const place = placeById(party.place)
  const match = matchAt(now)
  const toPlay = Math.ceil((HALFTIME - now) / 1000)
  const live = now >= HALFTIME && now < HALFTIME_END

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Welcome: the page turns into the place you just walked into */}
      <div className="shrink-0 rounded-b-[2rem] bg-foreground pt-[env(safe-area-inset-top)] pb-6 text-background">
        <Header dark />
        <div className="px-5">
          <p className="text-5xl leading-none" aria-hidden>
            👋
          </p>
          <h1 className="mt-3 font-heading text-3xl leading-tight font-semibold">
            Welcome to
            <br />
            {place.name}
          </h1>
        </div>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pt-4 pb-[max(env(safe-area-inset-bottom),20px)]">
        {/* The match */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center rounded-3xl bg-card px-4 py-5">
          <span className="text-center text-5xl leading-none">{flag(GAME.home)}</span>
          <span className="flex flex-col items-center">
            <span className="font-heading text-4xl font-bold tabular-nums">{match ? `${match.home} – ${match.away}` : formatTime(GAME.kickoff)}</span>
            {match && <span className="mt-1 rounded-full bg-foreground px-2.5 py-0.5 text-sm font-semibold text-background tabular-nums">{match.label}</span>}
          </span>
          <span className="text-center text-5xl leading-none">{flag(GAME.away)}</span>
        </div>

        {/* CrowdPlay on the big screen */}
        {party.crowdPlay && (
          <div className="rounded-3xl border-2 border-foreground p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-foreground text-background">
                <Gamepad2 className="size-8" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-2xl font-semibold">CrowdPlay</p>
              </div>
              <span className="rounded-full bg-card px-3 py-1 text-base font-semibold tabular-nums">{live ? 'Live' : toPlay > 0 ? formatCountdown(toPlay) : 'Done'}</span>
            </div>
            <Button size="lg" className="mt-4 h-16 w-full rounded-full text-lg" onClick={() => navigate(`/events/tonight/${party.id}/play`)}>
              Join
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-3 rounded-3xl bg-card p-4">
            <PinShape shape="tv" status="open" className="size-12" />
            <span className="font-heading text-lg font-semibold">Party pin</span>
            <Button size="lg" variant="outline" className="mt-auto h-12 rounded-full bg-background" onClick={() => navigate('/explore')}>
              <Camera data-icon="inline-start" />
              Photo
            </Button>
          </div>
          <div className="flex flex-col gap-3 rounded-3xl bg-card p-4">
            <Users className="size-12" strokeWidth={1.5} />
            <span className="font-heading text-lg font-semibold tabular-nums">{party.going.toLocaleString()}</span>
            <span className="mt-auto">
              <FlagRow party={party} />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
