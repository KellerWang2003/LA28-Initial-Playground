import type { ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Eye, MapPin, Sparkles, Tv } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { ImagePlaceholder } from '@/components/image-placeholder'
import { LiveTimer } from '@/components/live-timer'
import { ShapeIcon } from '@/components/shape-art'
import { TabActions } from '@/components/tab-actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  EVENTS,
  SPORT_SHAPE,
  eventAttendance,
  eventById,
  eventTypeLabel,
  flag,
  formatDate,
  formatTime,
  TODAY,
  placeById,
  sessionLine,
  type GameEvent,
  type Session,
} from '@/data/la28'
import { groupById, SWIM_SESSION, tally } from '@/features/activity/keep-going'
import { joinIn, pass, reopen, useKeepGoing } from '@/features/activity/keep-going-state'
import { useClock } from '@/lib/clock'
import { usePlans } from '@/lib/plans'
import { WATCH_LIST, eventIsOn, listById, savedItem, useSaved, type SavedItem } from '@/lib/saved'
import { gameFor, isRoomOpen, planned, useMyGames, type AttendMode } from '@/lib/my-games'
import { cn } from '@/lib/utils'

// Gatherings you join with other people. Games and official listings stay on Explore and Sports.
// The swimming after-hangout lives in Right now.
const recommendations = EVENTS.filter(
  (e) => (e.type === 'fan' || e.type === 'sponsored') && e.id !== 'e_afterparty',
).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))

const when = (e: GameEvent) => `${formatDate(e.date)} · ${formatTime(e.time)}`

const modeIcon = { venue: MapPin, online: Tv } satisfies Record<AttendMode, unknown>

const TABS = ['for-you', 'mine'] as const
type TabId = (typeof TABS)[number]

const isTab = (value: string | null): value is TabId => TABS.some((t) => t === value)

export default function EventsPage() {
  const now = useClock()
  const games = planned(useMyGames())
  // Games whose room is open go up top; the rest are on your list
  const openRooms = games.filter((g) => isRoomOpen(g.sessionData, now))
  const laterGames = games.filter((g) => !isRoomOpen(g.sessionData, now))

  // The tab lives in the URL so Back and "Create" land on the right one
  const [params, setParams] = useSearchParams()
  const tabParam = params.get('tab')
  const tab: TabId = isTab(tabParam) ? tabParam : 'for-you'
  const setTab = (next: TabId) =>
    setParams(
      (prev) => {
        const copy = new URLSearchParams(prev)
        copy.set('tab', next)
        return copy
      },
      { replace: true },
    )

  return (
    <div className="pb-28">
      <PageHeader title="Activities" action={<TabActions search />} />

      <div className="pt-2">
        <RightNow rooms={openRooms} />

        <Tabs value={tab} onValueChange={(value) => isTab(value) && setTab(value)} className="mt-6 gap-0">
          {/* Sticks just under the page header */}
          <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-10 bg-background/95 px-4 pt-1 pb-3 backdrop-blur">
            <TabsList className="w-full">
              <TabsTrigger value="for-you">For you</TabsTrigger>
              <TabsTrigger value="mine">My activities</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="for-you">
            <ForYou />
          </TabsContent>
          <TabsContent value="mine">
            <MyActivities games={laterGames} />
          </TabsContent>
        </Tabs>
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
// Right now: a carousel of what's happening. Games you're going to first,
// then your Watch list: on now, or today's results.
// ─────────────────────────────────────────────

type Planned = ReturnType<typeof planned>[number]

function RightNow({ rooms }: { rooms: Planned[] }) {
  const now = useClock()
  const games = useMyGames()
  const keep = useKeepGoing()
  const atVenue = gameFor(games, SWIM_SESSION)?.mode === 'venue'
  const showHangout = atVenue || keep.answer !== null

  // A game you're going to already has its room card
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
    ...rooms.map((g) => <RoomCard key={g.session} session={g.sessionData} mode={g.mode} />),
    ...(showHangout ? [<HangoutCard key="hangout" />] : []),
    ...[...onNow, ...results].map((item) => <WatchCard key={`${item.kind}:${item.ref.id}`} item={item} />),
  ]
  if (cards.length === 0) return null

  const many = cards.length > 1
  return (
    <section>
      <SectionTitle
        title="Right now"
        action={many && <span className="text-xs text-muted-foreground tabular-nums">{cards.length} happening</span>}
      />
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
    </section>
  )
}

// Entrance to a game's live room
function RoomCard({ session, mode }: { session: Session; mode: AttendMode }) {
  const shape = SPORT_SHAPE[session.sport]
  const Icon = modeIcon[mode]
  const live = session.status === 'live'
  const next = session.races?.find((r) => r.status === 'next')

  return (
    <Card
      live={live}
      footer={
        <Link to={`/sports/games/${session.id}`} className={cn(buttonVariants(), 'w-full')}>
          Join the room
        </Link>
      }
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          {shape && <ShapeIcon shape={shape} className="size-3.5 shrink-0" />}
          <span className="truncate">
            {session.sport} · {placeById(session.venue).name}
          </span>
        </p>
        {live ? (
          <LiveTimer since={`${session.date}T${session.start}`} className="shrink-0 shadow-none" />
        ) : (
          <span className="shrink-0 text-xs text-muted-foreground">Starts {formatTime(session.start)}</span>
        )}
      </div>
      <p className="mt-1 font-heading text-lg font-semibold">{session.title}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Icon className="size-3.5 shrink-0" />
        {mode === 'venue' ? 'You’re at the venue' : 'You’re watching online'}
        {session.fansOnApp ? ` · ${session.fansOnApp.toLocaleString()} fans in the room` : ''}
      </p>
      {next && (
        <p className="mt-3 rounded-xl bg-background px-3 py-2 text-sm">
          <span className="text-muted-foreground">Up next {formatTime(next.time)} · </span>
          {next.title}
        </p>
      )}
    </Card>
  )
}

// On the Watch list: not going, just following along or after the result
function WatchCard({ item }: { item: SavedItem }) {
  const eyebrow = (
    <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
      <Eye className="size-3.5 shrink-0" />
      <span className="truncate">Watch list · {item.eyebrow}</span>
    </span>
  )

  if (item.kind === 'event') {
    return (
      <Card footer={<FooterLink to={item.to}>See the event</FooterLink>}>
        <div className="flex items-center justify-between gap-2">
          {eyebrow}
          <span className="shrink-0 text-xs text-muted-foreground">Happening now</span>
        </div>
        <p className="mt-1 font-heading text-lg font-semibold">{item.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{item.where}</p>
      </Card>
    )
  }

  const { session } = item
  const live = session.status === 'live'
  const finished = session.status === 'finished'
  return (
    <Card footer={<FooterLink to={item.to}>{finished ? 'See the recap' : live ? 'Follow live' : 'Open the room'}</FooterLink>}>
      <div className="flex items-center justify-between gap-2">
        {eyebrow}
        {live ? (
          <LiveTimer since={`${session.date}T${session.start}`} className="shrink-0 shadow-none" />
        ) : (
          <span className="shrink-0 text-xs text-muted-foreground">
            {finished ? 'Result' : `Starts ${formatTime(session.start)}`}
          </span>
        )}
      </div>
      <p className="mt-1 font-heading text-lg font-semibold">{session.title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{item.where}</p>
      {(live || finished) && (
        <p className="mt-3 rounded-xl bg-background px-3 py-2 text-sm font-medium tabular-nums">{sessionLine(session)}</p>
      )}
    </Card>
  )
}

function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
      {children}
    </Link>
  )
}

// The swimming "keep going" moment, in whichever step the fan is at
function HangoutCard() {
  const navigate = useNavigate()
  const keep = useKeepGoing()
  const group = keep.groupId ? groupById(keep.groupId) : undefined
  const decision = group && keep.voteId ? tally(group, keep.voteId).winner : null

  if (keep.answer === 'out') {
    return (
      <Card
        footer={
          <Button type="button" variant="outline" className="w-full" onClick={reopen}>
            Changed your mind
          </Button>
        }
      >
        <p className="text-xs text-muted-foreground">Tonight · after swimming at SoFi</p>
        <p className="mt-1 text-sm">You passed on tonight’s hangout.</p>
      </Card>
    )
  }

  if (decision && group) {
    return (
      <Card
        footer={
          <Button type="button" className="w-full" onClick={() => navigate('/events/keep-going')}>
            Open the plan
          </Button>
        }
      >
        <p className="text-xs text-muted-foreground">Tonight · after swimming at SoFi</p>
        <p className="mt-1 font-heading text-lg font-semibold">{decision.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {decision.walk} · {group.members.length + 1} people · {group.title}
        </p>
      </Card>
    )
  }

  if (keep.answer === 'in') {
    return (
      <Card
        footer={
          <Button type="button" className="w-full" onClick={() => navigate('/events/keep-going')}>
            Continue
          </Button>
        }
      >
        <p className="text-xs text-muted-foreground">Tonight · after swimming at SoFi</p>
        <p className="mt-1 font-heading text-lg font-semibold">
          {group ? `You’re with ${group.title}` : 'Pick a group after swimming'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {group ? 'The group is still voting on a place nearby.' : 'A few groups from SoFi want to keep going.'}
        </p>
      </Card>
    )
  }

  return (
    <Card
      footer={
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={pass}>
            Not tonight
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={() => {
              joinIn()
              navigate('/events/keep-going')
            }}
          >
            See the groups
          </Button>
        </div>
      }
    >
      <p className="text-xs text-muted-foreground">Tonight · after swimming at SoFi</p>
      <p className="mt-1 font-heading text-lg font-semibold">The 200m freestyle just finished</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Australia took gold, and the swimmer people here were watching finished off the podium. Fans at the venue want to
        stay out together.
      </p>
    </Card>
  )
}

// The footer sits on the bottom edge so buttons line up across the carousel
function Card({ children, footer, live }: { children: ReactNode; footer: ReactNode; live?: boolean }) {
  return (
    <div className={cn('flex h-full flex-col rounded-2xl border border-transparent bg-card p-4', live && 'border-foreground')}>
      <div>{children}</div>
      <div className="mt-auto pt-4">{footer}</div>
    </div>
  )
}

// ─────────────────────────────────────────────
// For you: gatherings picked for this fan
// ─────────────────────────────────────────────

function ForYou() {
  const plans = usePlans()
  const hosting = new Set(plans.filter((p) => p.role === 'hosting').map((p) => p.id))

  return (
    <section aria-label="For you">
      <ul className="space-y-2 px-4">
        {recommendations
          .filter((e) => !hosting.has(e.id))
          .map((e) => (
            <li key={e.id} className="overflow-hidden rounded-2xl bg-card">
              <EventRow e={e} />
            </li>
          ))}
      </ul>
    </section>
  )
}

// ─────────────────────────────────────────────
// My activities: everything you're going to or hosting, by day
// ─────────────────────────────────────────────

type LogItem = {
  key: string
  date: string
  time: string
  eyebrow: string
  title: string
  where: string
  tag: string
  to?: string
  // Past games, listed under Earlier with their recap
  done?: boolean
}

function MyActivities({ games }: { games: Planned[] }) {
  const plans = usePlans()

  const items: LogItem[] = [
    ...games.map(({ sessionData: s, mode }) => ({
      key: s.id,
      date: s.date,
      time: s.start,
      eyebrow: s.sport,
      title: s.title,
      where: placeById(s.venue).name,
      tag: mode === 'venue' ? 'At the venue' : 'Online',
      to: s.status === 'finished' ? `/sports/games/${s.id}/recap` : `/sports/games/${s.id}`,
      done: s.status === 'finished',
    })),
    ...plans.map((p) => {
      const e = eventById(p.id)
      return {
        key: p.id,
        date: p.date,
        time: p.time,
        eyebrow: e ? eventTypeLabel[e.type] : p.visibility === 'public' ? 'Public plan' : 'Private plan',
        title: p.title,
        where: p.where,
        tag: p.role === 'hosting' ? 'Hosting' : 'Going',
        to: e ? `/events/${p.id}` : undefined,
      }
    }),
  ]

  const upcoming = items.filter((i) => !i.done).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  const earlier = items.filter((i) => i.done).sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
  const days = [...new Set(upcoming.map((i) => i.date))].map((date) => ({
    label: formatDate(date),
    items: upcoming.filter((i) => i.date === date),
  }))
  if (earlier.length) days.push({ label: 'Earlier', items: earlier })

  return (
    <section aria-label="My activities">
      {days.length === 0 ? (
        <div className="mx-4 rounded-2xl bg-card p-4">
          <p className="font-medium">Nothing planned yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Save something from For you, add a game from Sports, or create your own event with the + button.
          </p>
        </div>
      ) : (
        <div className="space-y-4 px-4">
          {days.map((day) => (
            <div key={day.label}>
              <h3 className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">{day.label}</h3>
              <ul className="divide-y divide-background overflow-hidden rounded-2xl bg-card">
                {day.items.map((item) => (
                  <li key={item.key}>
                    <LogRow item={item} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function LogRow({ item }: { item: LogItem }) {
  const body = (
    <>
      <span className="w-16 shrink-0 pt-0.5 text-xs text-muted-foreground tabular-nums">
        {item.done ? formatDate(item.date) : formatTime(item.time)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs text-muted-foreground">{item.eyebrow}</span>
        <span className="block text-sm leading-snug font-medium">{item.title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {item.done ? 'See the recap' : item.where}
        </span>
      </span>
      <Badge variant={item.tag === 'Hosting' ? 'default' : 'outline'} className="shrink-0">
        {item.tag}
      </Badge>
    </>
  )
  const row = 'flex items-start gap-3 px-4 py-3'
  return item.to ? (
    <Link to={item.to} className={cn(row, 'active:bg-muted')}>
      {body}
    </Link>
  ) : (
    <div className={row}>{body}</div>
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
