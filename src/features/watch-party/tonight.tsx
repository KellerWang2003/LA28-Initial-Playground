import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router'
import { Check, ChevronRight, Footprints, MapPin, Users } from 'lucide-react'
import { ImagePlaceholder } from '@/components/image-placeholder'
import { COLLECT_RADIUS_M, flag, formatTime, placeById } from '@/data/la28'
import { formatMinutes, travelFromYou } from '@/data/map-layers'
import { metersBetween, placeCoords, useFanLocation } from '@/lib/location'
import { useProfile } from '@/lib/profile'
import { cn } from '@/lib/utils'
import { you } from './crowd'
import { GAME, PARTIES, useGoingTo, type Party } from './parties'
import { CrowdPin } from './crowd-pin'

// Tonight's watch parties: a card on Activities with the crowds heading to each party, and
// a simple list of party cards to scroll through.

export function Matchup({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2 font-heading font-semibold tabular-nums', className)}>
      <span className="text-[1.4em] leading-none">{flag(GAME.home)}</span>
      vs
      <span className="text-[1.4em] leading-none">{flag(GAME.away)}</span>
      <span className="ml-1 rounded-full bg-background px-2.5 py-0.5 text-sm">{formatTime(GAME.kickoff)}</span>
    </span>
  )
}

// Crowds heading to each party: a cluster that grows with how many are going, and a few
// dots drifting in
export function TonightMap({ className, onPick }: { className?: string; onPick?: (id: string) => void }) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-background', className)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
        {[18, 40, 63, 85].map((s) => (
          <g key={s} className="stroke-card" strokeWidth={4} vectorEffect="non-scaling-stroke">
            <line x1={s} y1={0} x2={s + 5} y2={100} vectorEffect="non-scaling-stroke" />
            <line x1={0} y1={s} x2={100} y2={s - 3} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
      </svg>
      {PARTIES.map((p) => {
        const size = 28 + Math.log10(p.going) * 22
        return (
          <button
            key={p.id}
            type="button"
            aria-label={p.title}
            onClick={() => onPick?.(p.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${p.at[0]}%`, top: `${p.at[1]}%`, width: size, height: size }}
          >
            <span className="absolute inset-0 animate-baton-pulse rounded-full bg-foreground/15" />
            <span className="absolute inset-[18%] rounded-full bg-foreground/20" />
            {Array.from({ length: Math.min(9, Math.round(Math.log2(p.going)) ) }, (_, i) => {
              const a = i * 2.4
              const r = (size / 2.8) * Math.sqrt((i + 1) / 9)
              return (
                <span
                  key={i}
                  className="absolute size-2 rounded-full bg-foreground"
                  style={{ left: size / 2 + Math.cos(a) * r - 4, top: size / 2 + Math.sin(a) * r - 4 }}
                />
              )
            })}
            {/* Fans on their way in */}
            {[0, 1, 2].map((i) => (
              <span
                key={`d${i}`}
                className="absolute size-1.5 animate-drift rounded-full bg-foreground/60"
                style={
                  {
                    left: size / 2 - 3,
                    top: size / 2 - 3,
                    '--dx': `${Math.cos(i * 2.1 + p.at[0]) * size * 1.4}px`,
                    '--dy': `${Math.sin(i * 2.1 + p.at[1]) * size * 1.4}px`,
                    animationDelay: `${i * 0.9}s`,
                  } as CSSProperties
                }
              />
            ))}
          </button>
        )
      })}
    </div>
  )
}

// The top of Activities: tonight's game and its watch parties
export function TonightSection({ title }: { title: (text: string) => ReactNode }) {
  return (
    <section>
      {title('Tonight')}
      <TonightCard />
    </section>
  )
}

// Tonight's game and its parties, with the one you're going to
export function TonightCard() {
  const goingTo = useGoingTo()
  const fan = useFanLocation()
  // Once you're at a party, the card welcomes you to it
  const at = PARTIES.find((p) => metersBetween(fan, placeCoords(p.place)) <= COLLECT_RADIUS_M)
  const going = at ?? PARTIES.find((p) => p.id === goingTo)
  return (
    <Link to={going ? `/events/tonight/${going.id}` : '/events/tonight'} className="mx-4 block rounded-3xl bg-card p-4 active:scale-[0.99]">
      <Matchup className="text-lg" />
      <TonightMap className="mt-3 h-36" />
      <div className="mt-3 flex items-center gap-2">
        {at ? (
          <>
            <span className="text-2xl leading-none" aria-hidden>
              👋
            </span>
            <span className="truncate font-heading text-lg font-semibold">Welcome to {placeById(at.place).name}</span>
          </>
        ) : going ? (
          <>
            <span className="flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-sm font-semibold text-background">Going</span>
            <span className="truncate font-heading text-lg font-semibold">{going.title}</span>
          </>
        ) : (
          <>
            <span className="font-heading text-lg font-semibold">Watch parties</span>
            <span className="rounded-full bg-foreground px-2.5 py-0.5 text-sm font-semibold text-background tabular-nums">{PARTIES.length}</span>
          </>
        )}
        <ChevronRight className="ml-auto size-5" />
      </div>
    </Link>
  )
}

// ---- Tonight's parties: a simple list of cards ----

export function PartyList() {
  return (
    <ul className="space-y-3 px-4 pb-[max(env(safe-area-inset-bottom),24px)]">
      {PARTIES.map((p) => (
        <li key={p.id}>
          <PartyCard party={p} />
        </li>
      ))}
    </ul>
  )
}

// One party: its crowd icon, the name, where and how far, how many are going
function PartyCard({ party }: { party: Party }) {
  const profile = useProfile()
  const goingTo = useGoingTo()
  const fan = useFanLocation()
  const place = placeById(party.place)
  const trip = travelFromYou([place.lng, place.lat], fan)
  const going = goingTo === party.id
  const people = going ? [...party.crowd, you(profile.country, profile.spoken)] : party.crowd

  return (
    <Link to={`/events/tonight/${party.id}`} className="block overflow-hidden rounded-3xl bg-card active:scale-[0.99]">
      <ImagePlaceholder className="h-36 w-full rounded-none border-0 bg-background/40" />
      <div className="flex items-center gap-3 p-4">
        <CrowdPin seed={party.id} shape={party.shape} people={people} className="-mt-12 size-16 shrink-0 ring-4 ring-card" />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-lg leading-tight font-semibold">{party.title}</p>
        </div>
        {going && (
          <span className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-foreground px-3 text-sm font-semibold text-background">
            <Check className="size-4" />
            Going
          </span>
        )}
      </div>
      <div className="flex items-center gap-4 px-4 pb-4 text-base font-medium tabular-nums">
        <span className="flex min-w-0 items-center gap-1.5">
          <MapPin className="size-5 shrink-0" />
          <span className="truncate">{place.name}</span>
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          <Footprints className="size-5" />
          {formatMinutes(trip.walk)}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <Users className="size-5" />
          {party.going.toLocaleString()}
        </span>
      </div>
    </Link>
  )
}
