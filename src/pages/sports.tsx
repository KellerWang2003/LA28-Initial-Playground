import { PageHeader } from '@/components/page-header'
import { cn } from '@/lib/utils'
import { medalTable } from '@/data/mock'
import { SCHEDULE, TODAY, formatDate, formatTime, placeById, sessionLine, type Session } from '@/data/la28'

const scheduleGroups: { title: string; sessions: Session[] }[] = [
  { title: 'Live now', sessions: SCHEDULE.filter((s) => s.status === 'live') },
  { title: 'Later today', sessions: SCHEDULE.filter((s) => s.status === 'upcoming' && s.date === TODAY) },
  { title: 'Coming up', sessions: SCHEDULE.filter((s) => s.status === 'upcoming' && s.date > TODAY) },
  { title: 'Earlier today', sessions: SCHEDULE.filter((s) => s.status === 'finished') },
]

// Podium order: 2nd, 1st, 3rd
const podium = [medalTable[1], medalTable[0], medalTable[2]]
const podiumRank = [2, 1, 3]
const podiumHeight = ['h-14', 'h-20', 'h-10']

export default function SportsPage() {
  return (
    <div className="pb-28">
      <PageHeader title="Sports" />

      <div className="space-y-6 px-4">
        <section className="rounded-2xl border p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-heading font-semibold">Medal standings</h2>
            <span className="text-xs text-muted-foreground">Day 9</span>
          </div>

          <div className="mt-4 grid grid-cols-3 items-end gap-2">
            {podium.map((c, i) => (
              <div key={c.code} className="flex flex-col items-center">
                <span className="text-3xl leading-none">{c.flag}</span>
                <span className="mt-1 text-xs font-medium">{c.code}</span>
                <span className="text-xs text-muted-foreground">{c.gold} gold</span>
                <div
                  className={cn(
                    'mt-2 flex w-full items-start justify-center rounded-t-lg bg-muted pt-1 text-sm font-semibold',
                    podiumHeight[i],
                  )}
                >
                  {podiumRank[i]}
                </div>
              </div>
            ))}
          </div>

          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="w-6 py-1 text-left font-normal">#</th>
                <th className="py-1 text-left font-normal">Country</th>
                <th className="w-8 py-1 text-right font-normal">G</th>
                <th className="w-8 py-1 text-right font-normal">S</th>
                <th className="w-8 py-1 text-right font-normal">B</th>
              </tr>
            </thead>
            <tbody>
              {medalTable.slice(3).map((c, i) => (
                <tr key={c.code} className="border-t">
                  <td className="py-2 text-muted-foreground">{i + 4}</td>
                  <td className="py-2">
                    {c.flag} {c.name}
                  </td>
                  <td className="py-2 text-right">{c.gold}</td>
                  <td className="py-2 text-right">{c.silver}</td>
                  <td className="py-2 text-right">{c.bronze}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

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
        {live && (
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold">
            <span className="size-2 animate-pulse rounded-full bg-red-500" />
            LIVE
          </span>
        )}
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
