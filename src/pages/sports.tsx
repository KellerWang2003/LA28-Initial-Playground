import { Link } from 'react-router'
import { PageHeader } from '@/components/page-header'
import { cn } from '@/lib/utils'
import { LiveTimer } from '@/components/live-timer'
import { MedalTable } from '@/components/medal-table'
import { ShapeIcon } from '@/components/shape-art'
import { medalTable } from '@/data/mock'
import { followedNames, useFollowedSports } from '@/lib/followed-sports'
import {
  SCHEDULE,
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

function sectionsFor(sports: string[]) {
  return sports
    .map((sport) => ({
      sport,
      sessions: SCHEDULE.filter((s) => s.sport === sport).sort(
        (a, b) => statusOrder[a.status] - statusOrder[b.status] || byTime(a, b),
      ),
    }))
    .sort((a, b) => {
      const next = (sessions: Session[]) => sessions.find((s) => s.status !== 'finished')
      const rank = (sessions: Session[]) => {
        const lead = next(sessions)
        return lead ? statusOrder[lead.status] * 1e15 + Date.parse(`${lead.date}T${lead.start}`) : Number.POSITIVE_INFINITY
      }
      return rank(a.sessions) - rank(b.sessions) || a.sport.localeCompare(b.sport)
    })
}

function followingLabel(names: string[]) {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`
}

export default function SportsPage() {
  const selected = useFollowedSports()
  const followed = followedNames(selected)
  const cares = (session: Session) => followed.includes(session.sport)
  const liveNow = SCHEDULE.filter((s) => s.status === 'live' && cares(s)).sort(byTime)
  const comingUp = SCHEDULE.filter((s) => s.status === 'upcoming' && cares(s)).sort(byTime)
  const sportSections = sectionsFor(followed)

  return (
    <div className="pb-28">
      <PageHeader title="Sports" />

      <div className="space-y-6 px-4">
        <MedalTable rows={medalTable} subtitle="Day 7 · Thu, July 20" />

        {followed.length === 0 ? (
          <section className="rounded-2xl border p-4">
            <h2 className="font-heading font-semibold">No sports selected</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose the sports you care about, and this page will show only those.</p>
            <Link to="/profile" className="mt-3 inline-block text-sm font-medium underline">
              Choose sports
            </Link>
          </section>
        ) : (
          <p className="text-sm text-muted-foreground">
            Following {followingLabel(followed)}.{' '}
            <Link to="/profile" className="font-medium text-foreground underline">
              Edit
            </Link>
          </p>
        )}

        {liveNow.length > 0 && (
          <section>
            <h2 className="mb-2 font-heading font-semibold">Happening now</h2>
            <ul className="space-y-2">
              {liveNow.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </ul>
          </section>
        )}

        {comingUp.length > 0 && (
          <section>
            <h2 className="mb-2 font-heading font-semibold">Coming up</h2>
            <ul className="space-y-2">
              {comingUp.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </ul>
          </section>
        )}

        {sportSections.length > 0 && (
          <section className="space-y-5">
            <h2 className="font-heading font-semibold">By sport</h2>
            {sportSections.map(({ sport, sessions }) => (
              <SportSection key={sport} sport={sport} sessions={sessions} />
            ))}
          </section>
        )}
      </div>
    </div>
  )
}

function SportSection({ sport, sessions }: { sport: string; sessions: Session[] }) {
  const shape = SPORT_SHAPE[sport]
  const live = sessions.filter((s) => s.status === 'live').length
  return (
    <section>
      <div className="mb-1 flex items-center gap-2">
        {shape && <ShapeIcon shape={shape} className="size-5 shrink-0" />}
        <h3 className="font-heading font-semibold">{sport}</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {live > 0 ? `${live} live` : `${sessions.length} sessions`}
        </span>
      </div>
      <ul className="rounded-2xl border px-4">
        {sessions.map((session) => (
          <SportSession key={session.id} session={session} />
        ))}
      </ul>
    </section>
  )
}

function SportSession({ session }: { session: Session }) {
  const live = session.status === 'live'
  return (
    <li className="flex items-start justify-between gap-3 border-b py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate font-medium">{session.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {placeById(session.venue).name}
          {session.medal && ' · Medal event'}
          {!live && session.status === 'finished' && ' · Final'}
        </p>
      </div>
      {live ? (
        <LiveTimer since={`${session.date}T${session.start}`} className="shrink-0 shadow-none" />
      ) : (
        <p className="shrink-0 text-right text-xs text-muted-foreground">
          {session.date === TODAY ? 'Today' : formatDate(session.date)}
          <br />
          {formatTime(session.start)}
        </p>
      )}
    </li>
  )
}

function SessionCard({ session }: { session: Session }) {
  const live = session.status === 'live'
  // Upcoming sessions show who's playing instead of repeating the time
  const line =
    session.status === 'upcoming'
      ? session.teams
        ? session.teams.join(' vs ')
        : session.events?.join(', ')
      : sessionLine(session)
  return (
    <li className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs text-muted-foreground">
          {session.sport}
          {session.medal && ' · Medal event'}
        </p>
        {live && <LiveTimer since={`${session.date}T${session.start}`} className="shrink-0 shadow-none" />}
      </div>
      <p className="mt-1 font-medium">{session.title}</p>
      {line && <p className={cn('mt-1 text-sm', !live && 'text-muted-foreground')}>{line}</p>}
      <p className="mt-1 text-xs text-muted-foreground">
        {placeById(session.venue).name} · {session.date !== TODAY && `${formatDate(session.date)}, `}
        {formatTime(session.start)}–{formatTime(session.end)}
        {session.fansOnApp && ` · ${session.fansOnApp.toLocaleString()} fans on the app`}
      </p>
    </li>
  )
}
