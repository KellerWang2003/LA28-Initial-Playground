import { useState } from 'react'
import { Link } from 'react-router'
import { Search, X } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { cn } from '@/lib/utils'
import { LiveTimer } from '@/components/live-timer'
import { MedalTable, medalDot } from '@/components/medal-table'
import { ShapeIcon } from '@/components/shape-art'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { athletes, medalTable } from '@/data/mock'
import { followedNames, useFollowedSports } from '@/lib/followed-sports'
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

export default function SportsPage() {
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')

  function closeSearch() {
    setQuery('')
    setSearching(false)
  }

  return (
    <div className="pb-28">
      <PageHeader
        title="Sports"
        action={
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            aria-label={searching ? 'Close search' : 'Search sports'}
            aria-expanded={searching}
            className="rounded-full"
            onClick={() => (searching ? closeSearch() : setSearching(true))}
          >
            {searching ? <X className="size-5" /> : <Search className="size-5" />}
          </Button>
        }
        below={
          searching ? (
            <div className="px-4 pb-3">
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sports"
                aria-label="Search sports"
                className="h-12 rounded-full px-4 text-base"
              />
            </div>
          ) : null
        }
      />

      <Tabs defaultValue="overview" className="px-4">
        <TabsList className="w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sport">By sport</TabsTrigger>
          <TabsTrigger value="athletes">By athletes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-4">
          <MedalTable rows={medalTable} subtitle="Day 7 · Thu, July 20" />
          <Timeline query={query} />
        </TabsContent>

        <TabsContent value="sport" className="pt-4">
          <BySport query={query} />
        </TabsContent>

        <TabsContent value="athletes" className="pt-4">
          <ByAthletes query={query} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Timeline({ query }: { query: string }) {
  const followed = followedNames(useFollowedSports())
  const q = query.trim().toLowerCase()
  const sessions = SCHEDULE.filter((session) => {
    if (session.status === 'finished') return false
    if (q) return sessionText(session).includes(q)
    return followed.includes(session.sport)
  }).sort(byTime)

  if (!q && followed.length === 0) {
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
      <h2 className="mb-2 font-heading font-semibold">Timeline</h2>
      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {q ? `No sports match “${query.trim()}”.` : 'Nothing live or coming up for the sports you follow.'}
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
        <p className="mt-0.5 text-xs text-muted-foreground">
          {placeById(session.venue).name}
          {!live && ` · ${formatTime(session.start)}–${formatTime(session.end)}`}
        </p>
      </div>
    </li>
  )
}

function BySport({ query }: { query: string }) {
  const followed = followedNames(useFollowedSports())
  const q = query.trim().toLowerCase()
  const sports = q
    ? SPORTS.filter(
        (name) =>
          name.toLowerCase().includes(q) ||
          SCHEDULE.some((session) => session.sport === name && sessionText(session).includes(q)),
      )
    : followed
  const [picked, setPicked] = useState(sports[0] ?? '')
  const sport = sports.includes(picked) ? picked : (sports[0] ?? '')

  if (sports.length === 0) {
    return (
      <section className="rounded-2xl border p-4">
        <h2 className="font-heading font-semibold">{q ? 'No sports match' : 'No sports selected'}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {q ? `Nothing matches “${query.trim()}”.` : 'Choose which sports to show on this tab.'}
        </p>
        {!q && (
          <Link to="/profile/settings#sports" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-3 rounded-full')}>
            Edit
          </Link>
        )}
      </section>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto">
          {sports.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={name === sport}
              onClick={() => setPicked(name)}
              className={cn(
                'h-9 shrink-0 rounded-full border px-3 text-sm font-medium',
                name === sport ? 'border-foreground bg-foreground text-background' : 'text-foreground',
              )}
            >
              {name}
            </button>
          ))}
        </div>
        <Link to="/profile/settings#sports" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}>
          Edit
        </Link>
      </div>
      <SportDetail sport={sport} />
    </div>
  )
}

function SportDetail({ sport }: { sport: string }) {
  const shape = SPORT_SHAPE[sport]
  const standings = sportMedals(sport)
  const sessions = SCHEDULE.filter((session) => session.sport === sport).sort(
    (a, b) => statusOrder[a.status] - statusOrder[b.status] || byTime(a, b),
  )
  const groups = (
    [
      ['Live', 'live'],
      ['Upcoming', 'upcoming'],
      ['Finished', 'finished'],
    ] as const
  )
    .map(([label, status]) => ({ label, sessions: sessions.filter((session) => session.status === status) }))
    .filter((group) => group.sessions.length > 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {shape && <ShapeIcon shape={shape} className="size-5 shrink-0" />}
        <h2 className="font-heading font-semibold">{sport}</h2>
      </div>

      {standings.length > 0 ? (
        <section>
          <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Standings</h3>
          <div className="overflow-hidden rounded-2xl border">
            <div className="flex items-center gap-2 border-b px-4 py-2 text-xs text-muted-foreground">
              <span className="flex-1">Team</span>
              <span className="flex gap-3">
                {(['gold', 'silver', 'bronze'] as const).map((medal) => (
                  <span key={medal} className="flex w-5 justify-center" aria-label={medal}>
                    <span className={cn('size-2.5 rounded-full', medalDot[medal])} />
                  </span>
                ))}
                <span className="w-6 text-right">Tot</span>
              </span>
            </div>
            <ol>
              {standings.map((row, index) => (
                <li
                  key={row.code}
                  className="flex items-center gap-2 border-b px-4 py-2 text-sm tabular-nums last:border-b-0"
                >
                  <span className="w-5 text-muted-foreground">{index + 1}</span>
                  <span className="text-base leading-none">{row.flag}</span>
                  <span className="font-medium">{row.code}</span>
                  <span className="truncate text-xs text-muted-foreground">{row.name}</span>
                  <span className="ml-auto flex gap-3">
                    <span className="w-5 text-center">{row.gold}</span>
                    <span className="w-5 text-center">{row.silver}</span>
                    <span className="w-5 text-center">{row.bronze}</span>
                    <span className="w-6 text-right font-medium">{medalSum(row)}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">No medal standings for {sport} yet.</p>
      )}

      {groups.map((group) => (
        <section key={group.label}>
          <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">{group.label}</h3>
          <ul className="rounded-2xl border px-4">
            {group.sessions.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function SessionRow({ session }: { session: Session }) {
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
        {placeById(session.venue).name}
        {' · '}
        {session.date === TODAY ? 'Today' : formatDate(session.date)} {formatTime(session.start)}–{formatTime(session.end)}
        {session.medal && ' · Medal event'}
      </p>
      {extra && <p className="mt-1 text-sm text-muted-foreground">{extra}</p>}
    </li>
  )
}

function ByAthletes({ query }: { query: string }) {
  const q = query.trim().toLowerCase()
  const shown = athletes.filter((athlete) =>
    [athlete.name, athlete.code, athlete.sport, athlete.line].join(' ').toLowerCase().includes(q),
  )

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Fictional athletes for Day 7 · Thu, July 20.</p>
      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">No athletes match “{query.trim()}”.</p>
      ) : (
      <ul className="space-y-2">
        {shown.map((athlete) => {
          const shape = SPORT_SHAPE[athlete.sport]
          return (
            <li key={athlete.id} className="rounded-2xl border p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl leading-none">{athlete.flag}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{athlete.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {athlete.code} · {athlete.sport}
                  </p>
                </div>
                {shape && <ShapeIcon shape={shape} className="size-5 shrink-0 text-muted-foreground" />}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{athlete.line}</p>
            </li>
          )
        })}
      </ul>
      )}
    </div>
  )
}
