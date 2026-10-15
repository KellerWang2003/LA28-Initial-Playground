import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { ImagePlaceholder } from '@/components/image-placeholder'
import { LiveTimer } from '@/components/live-timer'
import { TabActions } from '@/components/tab-actions'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  EVENTS,
  eventAttendance,
  eventTypeLabel,
  flag,
  formatDate,
  formatTime,
  TODAY,
  placeById,
  sessionById,
  sessionLine,
  type GameEvent,
  type Session,
} from '@/data/la28'
import { KeepGoingStrip } from '@/features/activity/keep-going-strip'
import { useKeepGoingOn } from '@/features/activity/keep-going-state'
import { myActivities, upcoming, type Activity } from '@/features/activity/my-activities'
import { useClock } from '@/lib/clock'
import { usePlans } from '@/lib/plans'
import { WATCH_LIST, eventIsOn, listById, savedItem, useSaved, type SavedItem } from '@/lib/saved'
import { gameFor, isRoomOpen, useMyGames } from '@/lib/my-games'
import { cn } from '@/lib/utils'

// Gatherings you join with other people. Games and official listings stay on Explore and Sports.
// The after-swimming question rides on the swimming card in My activities.
const recommendations = EVENTS.filter(
  (e) => (e.type === 'fan' || e.type === 'sponsored') && e.id !== 'e_afterparty',
).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))

const when = (e: GameEvent) => `${formatDate(e.date)} · ${formatTime(e.time)}`

// How many planned cards the carousel shows before "See all"
const PREVIEW = 5

export default function EventsPage() {
  return (
    <div className="pb-28">
      <PageHeader title="Activities" action={<TabActions search tab="activities" />} />

      <div className="space-y-6 pt-2">
        <MyActivities />
        <ForYou />
      </div>
    </div>
  )
}

function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2 px-4">
      <h2 className="font-heading font-semibold">{title}</h2>
      {action}
    </div>
  )
}

// ─────────────────────────────────────────────
// My activities: a carousel of what's happening now, then what's planned.
// Now: the after-swimming hangout, rooms that are open, and your Watch list (on now, or today's results).
// Planned: games, watch parties and events you're going to or hosting, soonest first.
// "See all" opens the full list.
// ─────────────────────────────────────────────

function MyActivities() {
  const now = useClock()
  const games = useMyGames()
  const all = myActivities(games, usePlans())

  const next = upcoming(all)
  const roomOpen = (a: Activity) => !!a.session && isRoomOpen(sessionById(a.session)!, now)
  const rooms = next.filter(roomOpen)
  const later = next.filter((a) => !roomOpen(a))

  // A game you're going to already has its card
  const watched = (listById(useSaved(), WATCH_LIST)?.items ?? []).flatMap((ref) => {
    const item = savedItem(ref)
    return item && !(item.kind === 'game' && gameFor(games, item.session.id)) ? [item] : []
  })
  const onNow = watched.filter((item) =>
    item.kind === 'game' ? isRoomOpen(item.session, now) : eventIsOn(item.event, now),
  )
  const results = watched.filter(
    (item) => item.kind === 'game' && item.session.status === 'finished' && item.session.date === TODAY,
  )

  const cards = [
    ...rooms.map((a) => <RoomCard key={a.key} session={sessionById(a.session!)!} />),
    ...[...onNow, ...results].map((item) => <WatchCard key={`${item.kind}:${item.ref.id}`} item={item} />),
    ...later.slice(0, PREVIEW).map((a) => <PlannedCard key={a.key} item={a} />),
  ]

  const many = cards.length > 1
  return (
    <section>
      <SectionTitle
        title="My activities"
        action={
          all.length > 0 && (
            <Link to="/events/mine" className="-my-2 py-2 text-sm font-medium">
              See all
            </Link>
          )
        }
      />
      {cards.length === 0 ? (
        <div className="mx-4 rounded-2xl bg-card p-4">
          <p className="font-medium">Nothing planned yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Join something below, add a game from Sports, or create your own with the + button.
          </p>
        </div>
      ) : (
        <ul
          className={cn(
            'no-scrollbar flex gap-3 px-4',
            many && 'snap-x snap-mandatory scroll-px-4 overflow-x-auto',
          )}
        >
          {cards.map((card) => (
            <li key={card.key} className={cn('shrink-0 snap-start', many ? 'w-[85%]' : 'w-full')}>
              {card}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// Coming up: a game before its room opens, a watch party, or an event you're going to or hosting
function PlannedCard({ item }: { item: Activity }) {
  const label = item.kind === 'game' ? 'See the game' : item.kind === 'watch-party' ? 'See the watch party' : 'See the event'
  return (
    <Card
      eyebrow={item.eyebrow}
      status={`${formatDate(item.date)} · ${formatTime(item.time)}`}
      title={item.title}
      line={`${item.where} · ${item.tag}`}
      footer={item.to && <FooterLink to={item.to}>{label}</FooterLink>}
    />
  )
}
// Entrance to a game's live room
// The after-game question rides along at the bottom of its session's card.
function RoomCard({ session }: { session: Session }) {
  const live = session.status === 'live'
  const keepGoing = useKeepGoingOn(session.id)
  return (
    <Card
      trailing={keepGoing && <KeepGoingStrip />}
      live={live}
      eyebrow={`${session.sport} · ${placeById(session.venue).name}`}
      status={
        live ? (
          <LiveTimer since={`${session.date}T${session.start}`} className="shadow-none" />
        ) : (
          `Starts ${formatTime(session.start)}`
        )
      }
      title={session.title}
      footer={
        <Link to={`/sports/games/${session.id}`} className={cn(buttonVariants(), 'w-full')}>
          Join the room
        </Link>
      }
    />
  )
}

// On the Watch list: not going, just following along or after the result
function WatchCard({ item }: { item: SavedItem }) {
  if (item.kind === 'event') {
    return (
      <Card
        eyebrow={item.eyebrow}
        status="On now"
        title={item.title}
        line={item.where}
        footer={<FooterLink to={item.to}>See the event</FooterLink>}
      />
    )
  }

  const { session } = item
  const live = session.status === 'live'
  const finished = session.status === 'finished'
  return (
    <Card
      eyebrow={item.eyebrow}
      status={
        live ? (
          <LiveTimer since={`${session.date}T${session.start}`} className="shadow-none" />
        ) : finished ? (
          'Final'
        ) : (
          `Starts ${formatTime(session.start)}`
        )
      }
      title={session.title}
      line={live || finished ? sessionLine(session) : item.where}
      footer={<FooterLink to={item.to}>{finished ? 'See the recap' : 'Follow live'}</FooterLink>}
    />
  )
}

function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
      {children}
    </Link>
  )
}

// Every card reads the same: what it is and its state, a title, one line at most, one action.
// The footer sits on the bottom edge so buttons line up across the carousel.
// Only a plan you made yourself has no page to open, so no action.
function Card({
  eyebrow,
  status,
  title,
  line,
  footer,
  trailing,
  live,
}: {
  eyebrow: string
  status?: ReactNode
  title: string
  line?: string
  footer?: ReactNode
  // Something that belongs to this card, under its action, split off by a line
  trailing?: ReactNode
  live?: boolean
}) {
  return (
    <div className={cn('flex h-full min-h-56 flex-col rounded-2xl border border-transparent bg-card p-4', live && 'border-foreground')}>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate">{eyebrow}</span>
        {status && <span className="shrink-0 tabular-nums">{status}</span>}
      </div>
      <p className="mt-1 line-clamp-2 font-heading text-lg leading-snug font-semibold">{title}</p>
      {line && <p className="mt-0.5 truncate text-sm text-muted-foreground tabular-nums">{line}</p>}
      {footer && <div className="mt-auto pt-4">{footer}</div>}
      {trailing && <div className="-mx-4 -mb-4 mt-4 border-t-2 border-background px-4 py-3">{trailing}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────
// For you: gatherings picked for this fan
// ─────────────────────────────────────────────

function ForYou() {
  // Already going or hosting: it's in My activities above
  const mine = new Set(usePlans().map((p) => p.id))

  return (
    <section>
      <SectionTitle title="For you" />
      <ul className="space-y-2 px-4">
        {recommendations
          .filter((e) => !mine.has(e.id))
          .map((e) => (
            <li key={e.id} className="overflow-hidden rounded-2xl bg-card">
              <EventRow e={e} />
            </li>
          ))}
      </ul>
    </section>
  )
}

// A listed event. `action` sits at the end of the row, outside the link.
export function EventRow({ e, action }: { e: GameEvent; action?: ReactNode }) {
  return (
    <div className="flex items-center active:bg-muted">
      <Link to={`/events/${e.id}`} className={cn('flex min-w-0 flex-1 gap-3 py-3 pl-4', !action && 'pr-4')}>
        <ImagePlaceholder className="size-20 shrink-0 bg-background" />
        <div className="min-w-0 flex-1">
          <Badge variant="outline">{eventTypeLabel[e.type]}</Badge>
          <p className="mt-1 line-clamp-2 text-sm leading-snug font-medium">{e.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {when(e)} · {placeById(e.place).name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {e.host && `Hosted by ${flag(e.host.cc)} ${e.host.name} · `}
            {eventAttendance(e)}
          </p>
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Sparkles className="size-3 shrink-0" />
            {e.why}
          </p>
        </div>
      </Link>
      {action && <div className="shrink-0 pr-4 pl-2">{action}</div>}
    </div>
  )
}
