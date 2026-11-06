import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { Check, X } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ImagePlaceholder } from '@/components/image-placeholder'
import { PinShape } from '@/components/pin-art'
import { flag } from '@/data/la28'
import { countryName, SWIM_SESSION, type Group, type Member, type Spot } from '@/features/activity/keep-going'
import { commonGround, commonLine, tableSplits } from '@/features/activity/common-ground'
import { useMyAnswers } from '@/features/game-room/crowd'
import { addConnection, useConnections } from '@/lib/connections'
import { useClock } from '@/lib/clock'
import { placeCoords, useFanLocation } from '@/lib/location'
import { useProfile } from '@/lib/profile'
import { notify } from '@/lib/toasts'
import { cn } from '@/lib/utils'
import { arrivesAt, GROUP_SIGNAL, spotCoords, walked } from './state'

// The screens of the hangout: the walk over, the table, and the stamp. Light, like the rest of
// the after-game flow (CrowdPlay is the only dark part of the night).

const initials = (name: string) => name.slice(0, 2).toUpperCase()

// ---- The walk over ----

/** A wireframe map from SoFi to the spot, with everyone's dot heading there */
export function WalkMap({ group, spot, since }: { group: Group; spot: Spot; since: number }) {
  const now = useClock()
  const me = useFanLocation()
  const from = placeCoords('sofi')
  const to = spotCoords(spot)
  // Fit SoFi and the spot, with room around them
  const pad = 0.0025
  const minX = Math.min(from[0], to[0]) - pad
  const maxX = Math.max(from[0], to[0]) + pad
  const minY = Math.min(from[1], to[1]) - pad
  const maxY = Math.max(from[1], to[1]) + pad
  const span = Math.max(maxX - minX, maxY - minY)
  const xy = ([lng, lat]: readonly number[]) => ({
    x: 8 + ((lng - minX) / span) * 84,
    y: 92 - ((lat - minY) / span) * 84,
  })
  const a = xy(from)
  const b = xy(to)
  const clamp = (n: number) => Math.min(96, Math.max(4, n))
  const mine = xy(me)

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card">
      <svg viewBox="0 0 100 100" className="block aspect-square w-full" aria-label={`Map from SoFi Stadium to ${spot.name}`}>
        {/* Street grid, as a wireframe */}
        {[18, 38, 58, 78].map((n) => (
          <g key={n} className="stroke-background" strokeWidth="2.2">
            <line x1={n} y1="0" x2={n} y2="100" />
            <line x1="0" y1={n} x2="100" y2={n} />
          </g>
        ))}
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="stroke-foreground/40" strokeWidth="1.2" strokeDasharray="2 2" />
        {/* SoFi */}
        <rect x={a.x - 7} y={a.y - 4} width="14" height="8" rx="2" className="fill-foreground/15" />
        <text x={a.x} y={a.y + 1.4} textAnchor="middle" className="fill-foreground text-[3.6px] font-semibold">
          SoFi
        </text>
        {/* Everyone else, walking */}
        {group.members.map((m, i) => {
          const t = walked(group, m, since, now)
          const off = ((i % 3) - 1) * 2.4 * (1 - t)
          const x = a.x + (b.x - a.x) * t + off
          const y = a.y + (b.y - a.y) * t - off
          const there = t >= 1
          return (
            <g key={m.id} className="transition-transform duration-1000" style={{ transform: `translate(${x}px, ${y}px)` }}>
              <circle r="3.2" className={there ? 'fill-foreground' : 'fill-background stroke-foreground'} strokeWidth="0.6" />
              <text y="1.2" textAnchor="middle" className={cn('text-[2.8px] font-bold', there ? 'fill-background' : 'fill-foreground')}>
                {m.name[0]}
              </text>
            </g>
          )
        })}
        {/* The spot */}
        <g style={{ transform: `translate(${b.x}px, ${b.y}px)` }}>
          <circle r="6" className="animate-baton-pulse fill-foreground/20" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
          <path d="M0 -9 C4 -9 5 -5.5 5 -4.5 C5 -1 0 3 0 3 C0 3 -5 -1 -5 -4.5 C-5 -5.5 -4 -9 0 -9 Z" className="fill-foreground" />
          <circle cy="-5" r="1.6" className="fill-background" />
        </g>
        {/* You */}
        <g style={{ transform: `translate(${clamp(mine.x)}px, ${clamp(mine.y)}px)` }}>
          <circle r="4.2" className="fill-background stroke-foreground" strokeWidth="1.4" />
          <text y="1.1" textAnchor="middle" className="fill-foreground text-[2.8px] font-bold">
            You
          </text>
        </g>
      </svg>
      <p className="absolute top-3 left-3 rounded-full bg-background px-2.5 py-1 text-xs font-medium">
        {spot.kind} · {spot.walk}
      </p>
    </div>
  )
}

/** Who's there yet, as a row of faces with a tick */
export function ArrivalRow({ group, since }: { group: Group; since: number }) {
  const now = useClock()
  const there = group.members.filter((m) => now >= arrivesAt(group, m, since))
  return (
    <section className="rounded-2xl bg-card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-medium">
          {there.length} of {group.members.length} there
        </p>
        <p className="text-xs text-muted-foreground">{there.length === group.members.length ? 'Everyone made it' : 'On the way'}</p>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {group.members.map((m) => {
          const here = now >= arrivesAt(group, m, since)
          return (
            <li key={m.id} className="relative">
              <Avatar className={cn('transition-opacity', !here && 'opacity-40')}>
                <AvatarFallback>{initials(m.name)}</AvatarFallback>
              </Avatar>
              {here && (
                <span className="animate-pin-pop absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full bg-foreground text-background">
                  <Check className="size-2.5" />
                </span>
              )}
              <span className="sr-only">
                {m.name} {here ? 'is there' : 'is on the way'}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** At the door: everyone in the group shows the same shape */
export function SignalCard() {
  const [open, setOpen] = useState(false)
  return (
    <section className="flex items-center gap-4 rounded-2xl bg-card p-4">
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-background font-heading text-3xl">{GROUP_SIGNAL.shape}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">Look for {GROUP_SIGNAL.shape} {GROUP_SIGNAL.number}</span>
        <span className="block text-sm text-muted-foreground">Your group’s phones all show it. Hold yours up at the door.</span>
      </span>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Show
      </Button>
      {open && createPortal(<SignalScreen onClose={() => setOpen(false)} />, document.body)}
    </section>
  )
}

function SignalScreen({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close the signal"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-foreground text-background"
    >
      <span className="absolute top-[max(env(safe-area-inset-top),16px)] right-4 grid size-10 place-items-center rounded-full bg-background/15">
        <X className="size-5" />
      </span>
      <span className="relative grid size-72 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-background/10" style={{ animationDuration: '1.6s' }} />
        <span className="font-heading text-[12rem] leading-none">{GROUP_SIGNAL.shape}</span>
      </span>
      <span className="font-heading text-7xl font-bold tabular-nums">{GROUP_SIGNAL.number}</span>
      <span className="mt-6 text-sm opacity-70">Tap anywhere to close</span>
    </button>
  )
}

// ---- At the table ----

/** Tonight's CrowdPlay questions, with who at the table said what. Put the phone in the middle. */
export function Icebreakers({ members }: { members: Member[] }) {
  const answers = useMyAnswers(SWIM_SESSION)
  const splits = tableSplits(members, answers)
  if (!splits.length) return null
  return (
    <section>
      <h3 className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">From tonight’s CrowdPlay</h3>
      <p className="mb-3 text-sm text-muted-foreground">How the table answered. Put the phone in the middle and swipe.</p>
      <ol className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
        {splits.map((s, i) => (
          <li key={s.question.id} className="w-[82%] shrink-0 snap-center rounded-2xl bg-card p-4">
            <p className="text-xs text-muted-foreground tabular-nums">
              {i + 1} of {splits.length}
            </p>
            <p className="mt-1 font-heading text-lg leading-snug font-semibold">{s.question.title}</p>
            <ul className="mt-3 space-y-2">
              {s.options.map((o) => (
                <li key={o.id} className="rounded-xl bg-background px-3 py-2">
                  <div className="flex items-center gap-2">
                    {o.emoji && <span aria-hidden>{o.emoji}</span>}
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{o.label}</span>
                    <span className="text-sm font-semibold tabular-nums">{o.names.length}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{o.names.join(', ')}</p>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** On the group offer: what you all answered alike during the game */
export function CommonGround({ group }: { group: Group }) {
  const answers = useMyAnswers(SWIM_SESSION)
  const common = commonGround(group, answers)
  return (
    <section className="rounded-2xl bg-card p-4">
      <p className="font-medium">What you have in common</p>
      {common.length ? (
        <ul className="mt-3 space-y-2">
          {common.map((c) => (
            <li key={c.question.id} className="flex items-center gap-3 rounded-xl bg-background px-3 py-2.5">
              <span className="text-xl" aria-hidden>
                {c.emoji ?? '✨'}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{commonLine(c)}</span>
                <span className="block truncate text-xs text-muted-foreground">You, {c.names.join(', ')}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">Play CrowdPlay during the game and we’ll show what you answered alike.</p>
      )}
    </section>
  )
}

// ---- The group photo and the stamp ----

/** A wireframe camera: everyone who's there, one shutter */
export function GroupCamera({ members, onShoot, onClose }: { members: Member[]; onShoot: () => void; onClose: () => void }) {
  const [flash, setFlash] = useState(false)
  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-foreground pt-[max(env(safe-area-inset-top),12px)] pb-[max(env(safe-area-inset-bottom),16px)] text-background">
      <header className="flex items-center gap-2 px-3">
        <button type="button" onClick={onClose} aria-label="Close the camera" className="grid size-10 place-items-center rounded-full bg-background/15">
          <X className="size-5" />
        </button>
        <p className="flex-1 text-center text-sm font-semibold">Group photo</p>
        <span className="size-10" />
      </header>
      <div className="relative mx-4 mt-3 flex-1">
        <ImagePlaceholder className="absolute inset-0 rounded-3xl border-background/20 bg-background/10" />
        <p className="absolute inset-x-0 top-4 text-center text-sm font-medium">Everyone in?</p>
        <ul className="absolute inset-x-3 bottom-3 flex flex-wrap justify-center gap-1.5">
          <li className="rounded-full bg-background px-2.5 py-1 text-xs font-semibold text-foreground">You</li>
          {members.map((m) => (
            <li key={m.id} className="rounded-full bg-background px-2.5 py-1 text-xs font-semibold text-foreground">
              {flag(m.cc)} {m.name}
            </li>
          ))}
        </ul>
        {flash && <div className="animate-out fade-out absolute inset-0 rounded-3xl bg-background duration-500" />}
      </div>
      <div className="flex justify-center py-6">
        <button
          type="button"
          aria-label="Take the photo"
          onClick={() => {
            setFlash(true)
            setTimeout(onShoot, 450)
          }}
          className="grid size-20 place-items-center rounded-full border-4 border-background transition-transform active:scale-90"
        >
          <span className="size-15 rounded-full bg-background" />
        </button>
      </div>
    </div>,
    document.body,
  )
}

/** The Night Out stamp: the pin, the date, and a flag for everyone in the photo */
export function NightOutStamp({ group, spot, inPhoto }: { group: Group; spot: Spot; inPhoto: string[] }) {
  const profile = useProfile()
  const people = group.members.filter((m) => inPhoto.includes(m.id))
  const flags = [...new Set([profile.country, ...people.map((m) => m.cc)])].map(flag)
  return (
    <section className="flex flex-col items-center rounded-2xl bg-card px-4 py-6 text-center">
      <div className="animate-stamp-in relative grid size-48 place-items-center rounded-full border-4 border-dashed border-foreground/70 bg-background">
        <div className="flex flex-col items-center">
          <PinShape shape="party" status="open" collected className="size-16 text-foreground!" />
          <p className="mt-1 text-[11px] font-bold tracking-[0.2em] uppercase">Night out</p>
          <p className="text-[10px] tracking-wide text-muted-foreground uppercase">After swimming</p>
          <p className="text-[10px] tracking-wide text-muted-foreground uppercase tabular-nums">20 Jul 2028</p>
        </div>
      </div>
      <p className="mt-4 text-2xl leading-none tracking-tight">{flags.join(' ')}</p>
      <p className="mt-3 font-heading text-xl font-semibold">Added to your Passport</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {spot.name} with {people.length} fans from {flags.length - 1 || 1} {flags.length - 1 === 1 ? 'country' : 'countries'}
      </p>
      <Button className="mt-4" variant="outline" nativeButton={false} render={<Link to="/passport?pin=p_nightout" />}>
        Open the Passport
      </Button>
    </section>
  )
}

/** Before you split up: add the people you were with, in one pass */
export function KeepInTouch({ group, people }: { group: Group; people: Member[] }) {
  const connections = useConnections()
  const met = group.members.find((m) => m.id === group.metId)
  return (
    <section>
      <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Before you split up</h3>
      <div className="divide-y divide-background overflow-hidden rounded-2xl bg-card">
        {people.map((m) => {
          const added = connections.includes(m.id)
          return (
            <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
              <Avatar>
                <AvatarFallback>{initials(m.name)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">
                  {flag(m.cc)} {m.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {countryName(m.cc)} · {m.trait}
                </span>
              </span>
              <Button size="sm" variant={added ? 'secondary' : 'default'} disabled={added} onClick={() => addConnection(m.id)}>
                {added ? <Check data-icon="inline-start" /> : null}
                {added ? 'Added' : 'Add'}
              </Button>
            </div>
          )
        })}
      </div>
      {met?.instagram && (
        <Button
          variant="ghost"
          className="mt-2 w-full"
          onClick={() => notify({ title: 'Opens Instagram', body: `This would open ${met.instagram}.` })}
        >
          Follow {met.name} on Instagram
        </Button>
      )}
    </section>
  )
}
