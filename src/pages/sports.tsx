import { useState } from 'react'
import { Link } from 'react-router'
import { Search, X } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { cn } from '@/lib/utils'
import { LiveTimer } from '@/components/live-timer'
import { MedalTable } from '@/components/medal-table'
import { GoingButton, MyGames } from '@/components/my-games'
import { ShapeIcon } from '@/components/shape-art'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  type SessionStatus,
} from '@/data/la28'

// The filter at the top: every sport, or one
const ALL = 'all'

const statusOrder: Record<SessionStatus, number> = { live: 0, upcoming: 1, finished: 2 }

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

const sessionText = (session: Session) =>
  [session.sport, session.title, placeById(session.venue).name, session.teams?.join(' '), session.events?.join(' ')]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

const athleteText = (athlete: Athlete) =>
  [athlete.name, athlete.code, athlete.sport, athlete.line].join(' ').toLowerCase()

export default function SportsPage() {
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState(ALL)
  const followed = followedNames(useFollowedSports())

  function closeSearch() {
    setQuery('')
    setSearching(false)
  }

  function openSport(name: string) {
    setFilter(name)
    closeSearch()
  }

  const q = query.trim()
  // A sport opened from search stays in the row even if you do not follow it
  const chips = filter !== ALL && !followed.includes(filter) ? SPORTS.filter((s) => s === filter || followed.includes(s)) : followed
  const sport = filter === ALL ? undefined : filter

  return (
    <div className="pb-28">
      <PageHeader
        title="Sports"
        action={
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            aria-label={searching ? 'Close search' : 'Search sports, games, and athletes'}
            aria-expanded={searching}
            className="rounded-full"
            onClick={() => (searching ? closeSearch() : setSearching(true))}
          >
            {searching ? <X className="size-5" /> : <Search className="size-5" />}
          </Button>
        }
        below={
          <>
            {searching && (
              <div className="px-4 pb-3">
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search sports, games, athletes"
                  aria-label="Search sports, games, and athletes"
                  className="h-12 rounded-full px-4 text-base"
                />
              </div>
            )}
            {!q && <SportFilter chips={chips} value={filter} onChange={setFilter} />}
          </>
        }
      />

      <div className="px-4">
        {q ? (
          <SearchResults query={q} onOpenSport={openSport} />
        ) : (
          <div className="space-y-6">
            <Medals sport={sport} />
            <MyGames sport={sport} />
            <Upcoming sport={sport} />
            {sport && <Athletes sport={sport} />}
            {sport && <Results sport={sport} />}
          </div>
        )}
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
      <section className="rounded-2xl border p-4">
        <h2 className="font-heading font-semibold">{sport} medals</h2>
        <p className="mt-1 text-sm text-muted-foreground">No medals awarded in {sport} yet.</p>
      </section>
    )
  }
  return <MedalTable rows={rows} title={`${sport} medals`} subtitle="Day 7 · Thu, July 20" drilldown={false} />
}

function SearchResults({ query, onOpenSport }: { query: string; onOpenSport: (sport: string) => void }) {
  const q = query.toLowerCase()
  const sports = SPORTS.filter((name) => name.toLowerCase().includes(q))
  const sessions = SCHEDULE.filter((session) => sessionText(session).includes(q)).sort(
    (a, b) => statusOrder[a.status] - statusOrder[b.status] || byTime(a, b),
  )
  const people = athletes.filter((athlete) => athleteText(athlete).includes(q))

  if (sports.length + sessions.length + people.length === 0) {
    return <p className="pt-2 text-sm text-muted-foreground">Nothing matches “{query}”.</p>
  }

  return (
    <div className="space-y-6 pt-1">
      {sports.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Sports</h2>
          <ul className="flex flex-wrap gap-2">
            {sports.map((name) => {
              const shape = SPORT_SHAPE[name]
              return (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => onOpenSport(name)}
                    className="inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium"
                  >
                    {shape && <ShapeIcon shape={shape} className="size-4 shrink-0" />}
                    {name}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {sessions.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Games</h2>
          <ul className="rounded-2xl border px-4">
            {sessions.map((session) => (
              <SessionRow key={session.id} session={session} showSport />
            ))}
          </ul>
        </section>
      )}

      {people.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Athletes</h2>
          <ul className="space-y-2">
            {people.map((athlete) => (
              <li key={athlete.id}>
                <AthleteCard athlete={athlete} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
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
      <section className="rounded-2xl border p-4">
        <h2 className="font-heading font-semibold">No sports selected</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the sports you care about, and the timeline will show only those.
        </p>
        <Link to="/profile/settings#sports" className="mt-3 inline-block text-sm font-medium underline">
          Choose sports
        </Link>
      </section>
    )
  }

  return (
    <section>
      <h2 className="mb-2 font-heading font-semibold">Upcoming</h2>
      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {sport ? `Nothing live or coming up in ${sport}.` : 'Nothing live or coming up for the sports you follow.'}
        </p>
      ) : (
        <ol className="relative rounded-2xl border px-4 py-4">
          {sessions.length > 1 && (
            <span aria-hidden className="absolute top-6 bottom-6 left-[21px] w-px bg-foreground/20" />
          )}
          {sessions.map((session, index) => (
            <TimelineItem key={session.id} session={session} last={index === sessions.length - 1} />
          ))}
        </ol>
      )}
    </section>
  )
}

function TimelineItem({ session, last }: { session: Session; last: boolean }) {
  const live = session.status === 'live'
  const detail =
    live
      ? sessionLine(session)
      : session.teams
        ? session.teams.join(' vs ')
        : session.events?.join(' · ')

  return (
    <li className="flex gap-3">
      <div className="relative z-10 flex w-3 shrink-0 justify-center">
        <span
          className={cn(
            'mt-1.5 size-3 shrink-0 rounded-full',
            live ? 'bg-red-500 ring-2 ring-background' : 'border-2 border-muted-foreground/50 bg-background',
          )}
        />
      </div>
      <div className={cn('min-w-0 flex-1', !last && 'pb-5')}>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-muted-foreground">
            {live ? 'Live' : `${formatDate(session.date)} · ${formatTime(session.start)}`}
            {' · '}
            {session.sport}
            {session.medal && ' · Medal event'}
          </p>
          {live && <LiveTimer since={`${session.date}T${session.start}`} className="shrink-0 shadow-none" />}
        </div>
        <p className="mt-0.5 font-medium">{session.title}</p>
        {detail && <p className="mt-0.5 text-sm text-muted-foreground">{detail}</p>}
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-xs text-muted-foreground">
            {placeById(session.venue).name}
            {!live && ` · ${formatTime(session.start)}–${formatTime(session.end)}`}
          </p>
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
      <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4">
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
      <ul className="rounded-2xl border px-4">
        {finished.map((session) => (
          <SessionRow key={session.id} session={session} />
        ))}
      </ul>
    </section>
  )
}

function SessionRow({ session, showSport }: { session: Session; showSport?: boolean }) {
  const live = session.status === 'live'
  const extra =
    live || session.status === 'finished'
      ? sessionLine(session)
      : session.teams
        ? session.teams.join(' vs ')
        : session.events?.join(' · ')

  return (
    <li className="border-b py-3 last:border-b-0">
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

function AthleteCard({ athlete, className }: { athlete: Athlete; className?: string }) {
  const shape = SPORT_SHAPE[athlete.sport]
  return (
    <div className={cn('rounded-2xl border p-4', className)}>
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
