import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChevronLeft, Settings } from 'lucide-react'
import { FanCode } from '@/components/fan-code'
import { ImagePlaceholder } from '@/components/image-placeholder'
import { MapView, type MapMarker } from '@/components/map-view'
import { PinShape } from '@/components/pin-art'
import { ShapeIcon } from '@/components/shape-art'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ME_ID, fanCode, personById } from '@/data/mock'
import {
  SCHEDULE,
  SPORT_SHAPE,
  flag,
  formatDate,
  formatTime,
  pinById,
  placeById,
  type Place,
} from '@/data/la28'
import type { LngLat } from '@/data/map-layers'
import { useCollected } from '@/lib/collected'
import { SEED_CONNECTIONS, useConnections } from '@/lib/connections'
import { useFollowedSports } from '@/lib/followed-sports'
import { countryName, useProfile } from '@/lib/profile'
import { useWallet } from '@/lib/wallet'

const GAMES_SHOWN = 4
const RECENT_PINS = 4

// Wide enough to read as a map of LA when only one place is marked
const LA_VIEW: LngLat[] = [
  [-118.68, 33.7],
  [-118.15, 34.2],
]

export default function ProfilePage() {
  const navigate = useNavigate()
  const profile = useProfile()
  const collected = useCollected()
  const connections = useConnections()
  const followed = useFollowedSports()
  const { balance } = useWallet()

  const places = exploredPlaces(collected)
  const added = connections.flatMap((id) => {
    if (SEED_CONNECTIONS.includes(id)) return []
    const person = personById(id)
    return person ? [person] : []
  })
  const games = SCHEDULE.filter((session) => session.status === 'upcoming' && followed.includes(session.sport))
    .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`))
    .slice(0, GAMES_SHOWN)
  const recent = [...collected]
    .reverse()
    .slice(0, RECENT_PINS)
    .flatMap((id) => {
      const pin = pinById(id)
      return pin ? [pin] : []
    })

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={() => navigate(-1)}>
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="font-heading text-lg font-semibold">Profile</h1>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="Settings"
          className="ml-auto"
          onClick={() => navigate('/profile/settings')}
        >
          <Settings className="size-5" />
        </Button>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 space-y-8 overflow-y-auto overscroll-contain px-4 pt-2 pb-[max(env(safe-area-inset-bottom),24px)]">
        <section className="flex items-start gap-4">
          <ImagePlaceholder className="size-20 shrink-0 rounded-2xl" />
          <div className="min-w-0 pt-0.5">
            <h2 className="font-heading text-xl font-semibold">{profile.name}</h2>
            <p className="mt-0.5 text-sm">
              {flag(profile.country)} {countryName(profile.country)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{profile.bio}</p>
          </div>
        </section>

        <section aria-label="Stats">
          <dl className="grid grid-cols-4 gap-2 rounded-2xl border px-2 py-3 text-center">
            <Stat value={collected.length} label="Pins" hint="Pins collected" />
            <Stat value={places.length} label="Places" hint="Places in LA explored" />
            <Stat value={balance} label="Torches" hint="Torches" />
            <Stat value={added.length} label="People" hint="People added" />
          </dl>
        </section>

        <section>
          <h2 className="font-heading font-semibold">Explored</h2>
          <div className="relative mt-3 h-[200px] overflow-hidden rounded-2xl border">
            <ExploredMap places={places} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{exploredCaption(places.length)}</p>
        </section>

        <MyCode />

        <section>
          <h2 className="font-heading font-semibold">Languages you speak</h2>
          {profile.spoken.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">None yet.</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {profile.spoken.map((language) => (
                <li key={language} className="rounded-full border px-3 py-1 text-sm">
                  {language}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-heading font-semibold">Games you are going to</h2>
          {games.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No upcoming games for the sports you follow.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {games.map((session) => {
                const shape = SPORT_SHAPE[session.sport]
                return (
                  <li key={session.id} className="rounded-2xl border px-4 py-3">
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      {shape && <ShapeIcon shape={shape} className="size-3.5 shrink-0" />}
                      {session.sport}
                      {' · '}
                      {formatDate(session.date)} · {formatTime(session.start)}
                    </p>
                    <p className="mt-0.5 font-medium">{session.title}</p>
                    <p className="text-sm text-muted-foreground">{placeById(session.venue).name}</p>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-heading font-semibold">People you have added</h2>
          {added.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No one added yet.</p>
          ) : (
            <ul className="no-scrollbar -mx-4 mt-3 flex gap-4 overflow-x-auto px-4">
              {added.map((person) => (
                <li key={person.id}>
                  <Link to={`/people/${person.id}`} className="flex w-16 flex-col items-center text-center">
                    <Avatar className="size-12">
                      <AvatarFallback>{person.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="mt-1 line-clamp-2 text-xs font-medium">
                      {person.flag} {person.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-heading font-semibold">Recent pins</h2>
          {recent.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No pins yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {recent.map((pin) => (
                <li key={pin.id}>
                  <Link to={`/explore/pins/${pin.id}`} className="flex items-center gap-3 rounded-2xl border px-3 py-2">
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-xl">
                      <ImagePlaceholder className="size-full rounded-none border-0" />
                      <span className="absolute inset-0 flex items-center justify-center">
                        <PinShape shape={pin.shape} status={pin.status} collected className="size-9" />
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{pin.name}</span>
                      <span className="block truncate text-sm text-muted-foreground">{placeById(pin.place).name}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function Stat({ value, label, hint }: { value: number; label: string; hint: string }) {
  return (
    <div className="flex flex-col">
      <dt className="order-2 text-[11px] leading-tight text-muted-foreground" title={hint}>
        {label}
      </dt>
      <dd className="order-1 font-heading text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

function ExploredMap({ places }: { places: Place[] }) {
  const markers: MapMarker[] = places.map((place) => ({
    id: place.id,
    coords: [place.lng, place.lat],
  }))

  return (
    <MapView
      markers={markers}
      renderMarker={(id) => <PlaceDot label={places.find((place) => place.id === id)?.name ?? 'Place'} />}
      initialBounds={LA_VIEW}
      initialPadding={{ top: 16, bottom: 16, left: 16, right: 16 }}
      interactive={false}
      revealed={places.map((place) => [place.lng, place.lat])}
    />
  )
}

function PlaceDot({ label }: { label: string }) {
  return <span role="img" aria-label={label} className="block size-3 rounded-full border-2 border-white bg-foreground shadow" />
}

function MyCode() {
  const [open, setOpen] = useState(false)
  const code = fanCode(ME_ID)

  return (
    <section>
      <h2 className="font-heading font-semibold">My code</h2>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="mt-3 flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left"
      >
        <FanCode value={code} className="size-14 shrink-0 rounded-lg" />
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{open ? 'Hide code' : 'Show your code'}</span>
          <span className="block font-mono text-xs text-muted-foreground">{code}</span>
        </span>
      </button>
      {open && (
        <div className="mt-3 flex justify-center rounded-3xl border bg-white p-3">
          <FanCode value={code} className="w-56 rounded-2xl" />
        </div>
      )}
    </section>
  )
}

function exploredPlaces(collected: string[]) {
  const seen = new Set<string>()
  const places: Place[] = []
  for (const id of collected) {
    const pin = pinById(id)
    if (!pin || seen.has(pin.place)) continue
    seen.add(pin.place)
    places.push(placeById(pin.place))
  }
  return places
}

function exploredCaption(count: number) {
  if (count === 0) return 'No parts of LA explored yet.'
  if (count === 1) return '1 part of LA explored.'
  return `${count} parts of LA explored.`
}
