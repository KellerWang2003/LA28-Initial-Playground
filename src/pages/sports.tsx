import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PageHeader } from '@/components/page-header'
import { cn } from '@/lib/utils'
import { LiveTimer } from '@/components/live-timer'
import { MedalTable } from '@/components/medal-table'
import { GoingButton } from '@/components/my-games'
import { ShapeIcon } from '@/components/shape-art'
import { TabActions } from '@/components/tab-actions'
import { buttonVariants } from '@/components/ui/button'
import { athletes, medalTable, type Athlete, type CountryMedals } from '@/data/mock'
import { followedNames, useFollowedSports } from '@/lib/followed-sports'
import { gameFor, useMyGames } from '@/lib/my-games'
import {
  SCHEDULE,
  SPORTS,
  SPORT_SHAPE,
  TODAY,
  formatDate,
  formatTime,
  placeById,
  sessionLine,
  type Session,
} from '@/data/la28'

// The filter at the top: every sport, or one
const ALL = 'all'

const byTime = (a: Session, b: Session) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)

const medalSum = (c: { gold: number; silver: number; bronze: number }) => c.gold + c.silver + c.bronze

function sportMedals(sport: string) {
  return medalTable
    .flatMap((country) => {
      const row = country.bySport.find((s) => s.sport === sport)
      if (!row || medalSum(row) === 0) return []
      return [{ code: country.code, flag: country.flag, name: country.name, ...row }]
    })
    .sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze || a.code.localeCompare(b.code))
}

export default function SportsPage() {
  // A sport opened from search arrives as ?sport=
  const [params] = useSearchParams()
  const [filter, setFilter] = useState(() => params.get('sport') ?? ALL)
  const followed = followedNames(useFollowedSports())

  // A sport opened from search stays in the row even if you do not follow it
  const chips = filter !== ALL && !followed.includes(filter) ? SPORTS.filter((s) => s === filter || followed.includes(s)) : followed
  const sport = filter === ALL ? undefined : filter

  return (
    <div className="pb-28">
      <PageHeader
        title="Sports"
        action={<TabActions search ticketSport={sport} />}
        below={<SportFilter chips={chips} value={filter} onChange={setFilter} />}
      />

      <div className="space-y-6 px-4">
        <Medals sport={sport} />
        <Upcoming sport={sport} />
        {sport && <Athletes sport={sport} />}
        {sport && <Results sport={sport} />}
      </div>
    </div>
  )
}

// "All" plus the sports you follow. Everything on the page follows it.
function SportFilter({ chips, value, onChange }: { chips: string[]; value: string; onChange: (value: string) => void }) {
  const options = [{ id: ALL, label: 'All' }, ...chips.map((name) => ({ id: name, label: name }))]
  return (
    <div className="flex items-center gap-2 px-4 pb-3">
      <div role="group" aria-label="Filter by sport" className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={option.id === value}
            onClick={() => onChange(option.id)}
            className={cn(
              'h-9 shrink-0 rounded-full border px-3 text-sm font-medium',
              option.id === value ? 'border-foreground bg-foreground text-background' : 'text-foreground',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <Link to="/profile/settings#sports" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}>
        Edit
      </Link>
    </div>
  )
}

// The full table, or only the medals won in one sport
function Medals({ sport }: { sport?: string }) {
  if (!sport) return <MedalTable rows={medalTable} subtitle="Day 7 · Thu, July 20" />

  const rows: CountryMedals[] = sportMedals(sport).map((row) => ({ ...row, bySport: [] }))
  if (rows.length === 0) {
    return (
      <section className="rounded-2xl bg-card p-4">
        <h2 className="font-heading font-semibold">{sport} medals</h2>
        <p className="mt-1 text-sm text-muted-foreground">No medals awarded in {sport} yet.</p>
      </section>
    )
  }
  return <MedalTable rows={rows} title={`${sport} medals`} subtitle="Day 7 · Thu, July 20" drilldown={false} />
}

function formatDayHeading(date: string) {
  const formatted = formatDate(date)
  const full = new Date(`${date}T12:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  if (formatted === 'Today') return `Today · ${full}`
  if (formatted === 'Tomorrow') return `Tomorrow · ${full}`
  return full
}

function Upcoming({ sport }: { sport?: string }) {
  const followed = followedNames(useFollowedSports())
  const mine = useMyGames()
  // All: the sports you follow, plus any single game you added from another sport.
  // One sport: everything still ahead in it.
  const sessions = SCHEDULE.filter(
    (session) =>
      session.status !== 'finished' &&
      (sport ? session.sport === sport : followed.includes(session.sport) || gameFor(mine, session.id)),
  ).sort(byTime)

  if (!sport && followed.length === 0 && sessions.length === 0) {
    return (
      <section className="rounded-2xl bg-card p-4">
        <h2 className="font-heading font-semibold">No sports selected</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the sports you care about, and the schedule will show only those.
        </p>
        <Link to="/profile/settings#sports" className="mt-3 inline-block text-sm font-medium underline">
          Choose sports
        </Link>
      </section>
    )
  }

  // Group upcoming sessions by date
  const days = Array.from(new Set(sessions.map((s) => s.date))).sort()

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading font-semibold">Upcoming</h2>
        {sessions.length > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {sessions.length} {sessions.length === 1 ? 'game' : 'games'}
          </span>
        )}
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {sport ? `Nothing live or coming up in ${sport}.` : 'Nothing live or coming up for the sports you follow.'}
        </p>
      ) : (
        <div className="space-y-4">
          {days.map((day) => {
            const daySessions = sessions.filter((s) => s.date === day)
            return (
              <div key={day} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {formatDayHeading(day)}
                  </h3>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {daySessions.length} {daySessions.length === 1 ? 'session' : 'sessions'}
                  </span>
                </div>
                <ul className="divide-y divide-background overflow-hidden rounded-2xl bg-card">
                  {daySessions.map((session) => (
                    <UpcomingGameRow key={session.id} session={session} showSport={!sport} />
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function UpcomingGameRow({ session, showSport }: { session: Session; showSport?: boolean }) {
  const live = session.status === 'live'
  const shape = SPORT_SHAPE[session.sport]
  const venue = placeById(session.venue)
  const detail =
    live
      ? sessionLine(session)
      : session.teams
        ? session.teams.join(' vs ')
        : session.events?.join(' · ')

  return (
    <li className="p-3.5 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {live ? (
              <LiveTimer since={`${session.date}T${session.start}`} className="shrink-0 shadow-none" />
            ) : (
              <span className="inline-flex items-center rounded-md bg-background px-2 py-0.5 text-xs font-semibold tabular-nums text-foreground">
                {formatTime(session.start)}
              </span>
            )}
            {showSport && (
              <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                {shape && <ShapeIcon shape={shape} className="size-3 shrink-0" />}
                {session.sport}
              </span>
            )}
            {session.medal && (
              <span className="rounded-md border border-foreground/30 px-1.5 py-0.5 text-[10px] font-semibold text-foreground uppercase tracking-wide">
                Medal
              </span>
            )}
          </div>

          <p className="mt-1 font-heading text-sm font-semibold text-foreground line-clamp-1">
            {session.title}
          </p>

          {detail && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
              {detail}
            </p>
          )}

          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {venue.name} · {venue.hood}
            {!live && ` · ${formatTime(session.start)}–${formatTime(session.end)}`}
          </p>
        </div>

        {/* Going (venue or online) or just interested (saved), from one sheet */}
        <div className="shrink-0 pt-0.5">
          <GoingButton session={session} />
        </div>
      </div>
    </li>
  )
}

// Inline on a sport, not a tab of its own
function Athletes({ sport }: { sport: string }) {
  const sportAthletes = athletes.filter((athlete) => athlete.sport === sport)
  if (sportAthletes.length === 0) return null

  return (
    <section>
      <h2 className="mb-2 font-heading font-semibold">Athletes</h2>
      <ul className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4">
        {sportAthletes.map((athlete) => (
          <li key={athlete.id} className="w-64 shrink-0 snap-start">
            <AthleteCard athlete={athlete} className="h-full" />
          </li>
        ))}
      </ul>
    </section>
  )
}

function Results({ sport }: { sport: string }) {
  const finished = SCHEDULE.filter((session) => session.sport === sport && session.status === 'finished').sort(byTime)
  if (finished.length === 0) return null

  return (
    <section>
      <h2 className="mb-2 font-heading font-semibold">Results</h2>
      <ul className="rounded-2xl bg-card px-4">
        {finished.map((session) => (
          <SessionRow key={session.id} session={session} />
        ))}
      </ul>
    </section>
  )
}

export function SessionRow({ session, showSport }: { session: Session; showSport?: boolean }) {
  const live = session.status === 'live'
  const extra =
    live || session.status === 'finished'
      ? sessionLine(session)
      : session.teams
        ? session.teams.join(' vs ')
        : session.events?.join(' · ')

  return (
    <li className="border-b border-background py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 font-medium">{session.title}</p>
        {live && <LiveTimer since={`${session.date}T${session.start}`} className="shrink-0 shadow-none" />}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {showSport && `${session.sport} · `}
        {placeById(session.venue).name}
        {' · '}
        {session.date === TODAY ? 'Today' : formatDate(session.date)} {formatTime(session.start)}–{formatTime(session.end)}
        {session.medal && ' · Medal event'}
      </p>
      {extra && <p className="mt-1 text-sm text-muted-foreground">{extra}</p>}
      {session.status !== 'finished' && (
        <div className="mt-2">
          <GoingButton session={session} />
        </div>
      )}
    </li>
  )
}

export function AthleteCard({ athlete, className }: { athlete: Athlete; className?: string }) {
  const shape = SPORT_SHAPE[athlete.sport]
  return (
    <div className={cn('rounded-2xl bg-card p-4', className)}>
      <div className="flex items-center gap-3">
        <span className="text-2xl leading-none">{athlete.flag}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{athlete.name}</p>
          <p className="text-xs text-muted-foreground">
            {athlete.code} · {athlete.sport}
          </p>
        </div>
        {shape && <ShapeIcon shape={shape} className="size-5 shrink-0 text-muted-foreground" />}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{athlete.line}</p>
    </div>
  )
}
