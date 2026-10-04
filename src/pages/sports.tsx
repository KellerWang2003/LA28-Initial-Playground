import { PageHeader } from '@/components/page-header'
import { cn } from '@/lib/utils'
import { LiveTimer } from '@/components/live-timer'
import { MedalTable } from '@/components/medal-table'
import { medalTable } from '@/data/mock'
import { SCHEDULE, TODAY, formatDate, formatTime, placeById, sessionLine, type Session } from '@/data/la28'

const scheduleGroups: { title: string; sessions: Session[] }[] = [
  { title: 'Live now', sessions: SCHEDULE.filter((s) => s.status === 'live') },
  { title: 'Later today', sessions: SCHEDULE.filter((s) => s.status === 'upcoming' && s.date === TODAY) },
  { title: 'Coming up', sessions: SCHEDULE.filter((s) => s.status === 'upcoming' && s.date > TODAY) },
  { title: 'Earlier today', sessions: SCHEDULE.filter((s) => s.status === 'finished') },
]

export default function SportsPage() {
  return (
    <div className="pb-28">
      <PageHeader title="Sports" />

      <div className="space-y-6 px-4">
        <MedalTable rows={medalTable} subtitle="Day 7 · Thu, July 20" />

        {scheduleGroups.map((group) => (
          <section key={group.title}>
            <h2 className="mb-2 font-heading font-semibold">{group.title}</h2>
            <ul className="space-y-2">
              {group.sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
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
