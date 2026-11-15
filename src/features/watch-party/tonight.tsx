import { useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChevronRight, MapPin, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { COLLECT_RADIUS_M, flag, formatTime, placeById } from '@/data/la28'
import { formatMinutes, travelFromYou } from '@/data/map-layers'
import { metersBetween, placeCoords, useFanLocation } from '@/lib/location'
import { useProfile } from '@/lib/profile'
import { cn } from '@/lib/utils'
import { you } from './crowd'
import { GAME, PARTIES, goTo, useGoingTo, type Party } from './parties'
import { CrowdPin } from './crowd-pin'
import { WhoSheet } from './who-sheet'

// Tonight's watch parties: a card on Activities with the crowds heading to each party, and
// a stack of party cards you swipe through, each with who's going and Sign up.

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

// ---- The swipe stack ----

export function PartyStack() {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [dx, setDx] = useState<number | null>(null)
  const [start, setStart] = useState(0)
  const [joining, setJoining] = useState<string | null>(null)

  function down(e: PointerEvent) {
    if (joining) return
    setStart(e.clientX)
    setDx(0)
  }
  function move(e: PointerEvent) {
    if (dx === null) return
    setDx(e.clientX - start)
  }
  function up() {
    if (dx === null) return
    if (dx < -70 && index < PARTIES.length - 1) setIndex(index + 1)
    if (dx > 70 && index > 0) setIndex(index - 1)
    setDx(null)
  }

  function signUp(p: Party) {
    setJoining(p.id)
    goTo(p.id)
    window.setTimeout(() => navigate(`/events/tonight/${p.id}`), 1600)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1 touch-pan-y" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {PARTIES.map((p, i) => {
          const offset = i - index
          if (offset < -1 || offset > 2) return null
          const drag = i === index && dx !== null ? dx : 0
          return (
            <div
              key={p.id}
              className={cn('absolute inset-x-4 top-0 bottom-2', dx === null && 'transition-transform duration-300 ease-out')}
              style={{
                zIndex: 10 - Math.abs(offset),
                transform:
                  offset < 0
                    ? 'translateX(-110%) rotate(-6deg)'
                    : `translateX(${drag + offset * 14}px) translateY(${offset * 10}px) scale(${1 - offset * 0.04}) rotate(${drag / 30}deg)`,
              }}
            >
              <PartyCard party={p} active={i === index} joining={joining === p.id} onSignUp={() => signUp(p)} />
            </div>
          )
        })}
      </div>
      <div className="flex shrink-0 justify-center gap-1.5 py-3" aria-hidden>
        {PARTIES.map((p, i) => (
          <span key={p.id} className={cn('h-2 rounded-full transition-all', i === index ? 'w-6 bg-foreground' : 'w-2 bg-muted-foreground/30')} />
        ))}
      </div>
    </div>
  )
}

export function PartyCard({ party, active, joining, onSignUp }: { party: Party; active: boolean; joining?: boolean; onSignUp?: () => void }) {
  const profile = useProfile()
  const [who, setWho] = useState(false)
  const here = useFanLocation()
  const place = placeById(party.place)
  const trip = travelFromYou([place.lng, place.lat], here)
  const people = joining ? [...party.crowd, you(profile.country, profile.spoken)] : party.crowd

  return (
    <article className={cn('flex h-full flex-col overflow-hidden rounded-3xl border-2 bg-background shadow-xl', active ? 'border-foreground' : 'border-border')}>
      <div className="flex shrink-0 flex-col items-center px-4 pt-4 text-center">
        <span className="rounded-full bg-card px-3 py-1 text-sm font-semibold">{party.kind}</span>
        <h2 className="mt-2 font-heading text-2xl leading-tight font-semibold">{party.title}</h2>
      </div>

      {/* Who's going: the party's pin in the crowd's colors. Tap for the details. */}
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <button
          type="button"
          aria-label="Who’s going"
          onClick={() => setWho(true)}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn('transition-transform active:scale-95', joining && 'animate-pop')}
        >
          <CrowdPin key={people.length} shape="tv" people={people} className="size-56" />
        </button>
      </div>

      <div className="m-2 mt-0 shrink-0 rounded-[1.25rem] bg-card p-3">
        <div className="flex items-center gap-2 px-1 text-sm font-semibold">
          <MapPin className="size-4 shrink-0" />
          <span className="truncate">{place.name}</span>
          <span className="ml-auto flex shrink-0 items-center gap-1 tabular-nums">
            <Users className="size-4" />
            {party.going.toLocaleString()}
          </span>
          <span className="shrink-0 rounded-full bg-background px-2 py-0.5 tabular-nums">{formatMinutes(trip.walk)}</span>
        </div>
        <Button size="lg" className="mt-3 h-14 w-full rounded-full text-lg" disabled={joining} onClick={onSignUp} onPointerDown={(e) => e.stopPropagation()}>
          {joining ? 'Going' : 'Sign up'}
        </Button>
      </div>
      {who && <WhoSheet people={people} onClose={() => setWho(false)} />}
    </article>
  )
}
