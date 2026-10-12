import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Eye, Flame, Lock, MapPin, Tv } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { modeLabel, type AttendMode } from '@/lib/my-games'
import { cn } from '@/lib/utils'
import { MIN_GROUP, type Personal, type Room } from './data'

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <h2 className="font-heading font-semibold">{children}</h2>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  )
}

export function PreviewBanner() {
  return (
    <p className="flex items-start gap-2 rounded-2xl border border-dashed px-3 py-2.5 text-sm">
      <Eye className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        <span className="font-medium">Preview.</span>{' '}
        <span className="text-muted-foreground">The final recap lands when the game ends. This is the room so far.</span>
      </span>
    </p>
  )
}

export function RoomStats({ room }: { room: Room }) {
  const stats = [
    { label: 'Fans', value: room.fans.toLocaleString('en-US') },
    { label: 'Countries', value: String(room.countries.length) },
    { label: 'At the venue', value: `${Math.round((room.venueFans / room.fans) * 100)}%` },
  ]
  return (
    <dl className="grid grid-cols-3 gap-2">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl bg-muted/60 px-3 py-2.5">
          <dd className="font-heading text-xl font-semibold tabular-nums">{s.value}</dd>
          <dt className="text-xs text-muted-foreground">{s.label}</dt>
        </div>
      ))}
    </dl>
  )
}

function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-heading text-xl leading-tight font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export function PersonalSection({
  personal,
  mode,
  live,
  answered,
  torches,
}: {
  personal: Personal
  mode: AttendMode | undefined
  live: boolean
  /** CrowdPlay questions answered, of all the game's questions */
  answered: { n: number; of: number }
  torches: number
}) {
  const { country } = personal
  const ModeIcon = mode === 'venue' ? MapPin : Tv
  return (
    <section>
      <SectionTitle hint={live ? 'So far' : undefined}>Your game</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="CrowdPlay" value={`${answered.n} of ${answered.of}`} sub="questions answered" />
        <Stat
          label="Torches earned"
          value={
            <span className="inline-flex items-center gap-1">
              <Flame className="size-5 fill-current" aria-hidden />
              {torches}
            </span>
          }
          sub="for taking part"
        />
        {country && (
          <Stat
            label="Your country"
            value={
              <span>
                <span aria-hidden>{country.flag}</span> {personal.medalRank ? `#${personal.medalRank}` : `#${personal.roomRank}`}
              </span>
            }
            sub={personal.medalRank ? `${country.name} in the medal table` : `${country.name} by fans in the room`}
          />
        )}
        {mode && (
          <Stat
            label="You took part"
            value={
              <span className="flex items-center gap-1.5 text-base">
                <ModeIcon className="size-4" aria-hidden />
                {modeLabel(mode)}
              </span>
            }
          />
        )}
      </div>

      <div className="mt-2 rounded-2xl border p-3">
        <p className="text-xs text-muted-foreground">Countries you met</p>
        {personal.met.length > 0 ? (
          <>
            <p className="mt-1 text-sm">
              <span className="font-medium">{personal.met.length} {personal.met.length === 1 ? 'country' : 'countries'}</span>{' '}
              answered a lot like you.
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Countries that answered like you">
              {personal.met.slice(0, 12).map((c) => (
                <li key={c.code} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs" title={c.name}>
                  <span aria-hidden>{c.flag}</span>
                  {c.code}
                </li>
              ))}
              {personal.met.length > 12 && (
                <li className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">+{personal.met.length - 12}</li>
              )}
            </ul>
          </>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Answer a few more CrowdPlay questions to meet fans who think like you.</p>
        )}
      </div>
    </section>
  )
}

export function SatOutSection({ hasRounds, live, sessionId }: { hasRounds: boolean; live: boolean; sessionId: string }) {
  return (
    <section className="rounded-2xl border p-4">
      <p className="font-heading font-semibold">{hasRounds ? 'You sat this one out' : 'No CrowdPlay in this game'}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasRounds
          ? live
            ? 'Play a CrowdPlay round before the game ends to earn Torches and meet fans who answer like you. Here is the crowd so far.'
            : 'Here is the crowd’s recap. Next game, play CrowdPlay to earn Torches and meet fans who answer like you.'
          : 'This game had no CrowdPlay, so here is who was here.'}
      </p>
      {hasRounds && live && (
        <Link to={`/sports/games/${sessionId}/play`} className={cn(buttonVariants({ size: 'sm' }), 'mt-3 rounded-full')}>
          Open CrowdPlay
        </Link>
      )}
    </section>
  )
}

export function LearnCard({ learns }: { learns: string[] }) {
  return (
    <section className="rounded-2xl border p-4">
      <h2 className="flex items-center gap-2 font-heading font-semibold">
        <Lock className="size-4" aria-hidden />
        What LA28 learns from this
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        LA28 only gets anonymous totals, at country level, from groups of {MIN_GROUP} or more. Never your name or where you are. For example:
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm marker:text-muted-foreground">
        {learns.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  )
}
