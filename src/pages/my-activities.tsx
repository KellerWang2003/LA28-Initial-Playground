import { Link, useNavigate, useSearchParams } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatTime } from '@/data/la28'
import { ACTIVITY_FILTERS, earlier, myActivities, upcoming, type Activity, type ActivityKind } from '@/features/activity/my-activities'
import { KeepGoingStrip } from '@/features/activity/keep-going-strip'
import { useKeepGoingOn } from '@/features/activity/keep-going-state'
import { useMyGames } from '@/lib/my-games'
import { usePlans } from '@/lib/plans'
import { cn } from '@/lib/utils'

type Filter = ActivityKind | 'all'

const isFilter = (value: string | null): value is Filter => ACTIVITY_FILTERS.some((f) => f.id === value)

// Every game, watch party and event you're going to or hosting, by day. Opened from "See all" on Activities.
export default function MyActivitiesPage() {
  const navigate = useNavigate()
  const all = myActivities(useMyGames(), usePlans())
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/events', { replace: true }))

  // The filter lives in the URL so coming back from an activity keeps it
  const [params, setParams] = useSearchParams()
  const typeParam = params.get('type')
  const filter: Filter = isFilter(typeParam) ? typeParam : 'all'
  const setFilter = (next: Filter) => setParams(next === 'all' ? {} : { type: next }, { replace: true })

  const shown = filter === 'all' ? all : all.filter((a) => a.kind === filter)
  const next = upcoming(shown)
  const days = [...new Set(next.map((a) => a.date))].map((date) => ({
    label: formatDate(date),
    items: next.filter((a) => a.date === date),
  }))
  const past = earlier(shown)
  if (past.length) days.push({ label: 'Earlier', items: past })

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={goBack}>
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="font-heading text-lg font-semibold">My activities</h1>
      </header>

      <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto px-4 pt-1 pb-3">
        {ACTIVITY_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={f.id === filter}
            onClick={() => setFilter(f.id)}
            className={cn(
              'h-9 shrink-0 rounded-full border px-4 text-sm font-medium',
              f.id === filter ? 'border-foreground bg-foreground text-background' : 'text-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-1 pb-[max(env(safe-area-inset-bottom),24px)]">
        {days.length === 0 ? (
          <div className="rounded-2xl bg-card p-4">
            <p className="font-medium">{filter === 'all' ? 'Nothing planned yet' : `No ${ACTIVITY_FILTERS.find((f) => f.id === filter)!.label.toLowerCase()} yet`}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Join something from For you, add a game from Sports, or create your own with the + button.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {days.map((day) => (
              <section key={day.label}>
                <h2 className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">{day.label}</h2>
                <ul className="divide-y divide-background overflow-hidden rounded-2xl bg-card">
                  {day.items.map((item) => (
                    <li key={item.key}>
                      <ActivityRow item={item} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ActivityRow({ item }: { item: Activity }) {
  const body = (
    <>
      <span className="w-16 shrink-0 pt-0.5 text-xs text-muted-foreground tabular-nums">
        {item.done ? formatDate(item.date) : formatTime(item.time)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs text-muted-foreground">{item.eyebrow}</span>
        <span className="block text-sm leading-snug font-medium">{item.title}</span>
        <span className="block truncate text-xs text-muted-foreground">{item.done ? 'See the recap' : item.where}</span>
      </span>
      <Badge variant={item.tag === 'Hosting' ? 'default' : 'outline'} className="shrink-0">
        {item.tag}
      </Badge>
    </>
  )
  const row = 'flex items-start gap-3 px-4 py-3'
  return (
    <>
      {item.to ? (
        <Link to={item.to} className={cn(row, 'active:bg-muted')}>
          {body}
        </Link>
      ) : (
        <div className={row}>{body}</div>
      )}
      {item.session && <KeepGoingTrail session={item.session} />}
    </>
  )
}

// The after-game question, tucked under its game's row and lined up with the title
function KeepGoingTrail({ session }: { session: string }) {
  if (!useKeepGoingOn(session)) return null
  return <KeepGoingStrip className="-mt-1 mr-4 mb-3 ml-[5.75rem] rounded-xl bg-background px-3 py-2" />
}
