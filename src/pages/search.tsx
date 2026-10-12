import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Clock, Search, TrendingUp, X } from 'lucide-react'
import { ShapeIcon } from '@/components/shape-art'
import { Button } from '@/components/ui/button'
import { addRecentSearch, clearRecentSearches, removeRecentSearch, useRecentSearches } from '@/lib/search-history'
import { cn } from '@/lib/utils'
import { athletes, type Athlete } from '@/data/mock'
import { EVENTS, SCHEDULE, SPORTS, SPORT_SHAPE, eventTypeLabel, placeById, type GameEvent, type Session } from '@/data/la28'
import { AthleteCard, SessionRow } from '@/pages/sports'
import { EventRow } from '@/pages/events'

type Filter = 'all' | 'sports' | 'games' | 'athletes' | 'plans'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'sports', label: 'Sports' },
  { id: 'games', label: 'Games' },
  { id: 'athletes', label: 'Athletes' },
  { id: 'plans', label: 'Plans' },
]

// What people are searching for right now (mock)
const TRENDING = ['Swimming finals', 'Brazil', 'Watch party', 'Athletics', 'Pin swap']

// How many of each kind "All" shows before "See all"
const PREVIEW = 3

const PLANS = EVENTS.filter((e) => e.type === 'fan' || e.type === 'sponsored').sort((a, b) =>
  `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
)
const UPCOMING_GAMES = SCHEDULE.filter((s) => s.status !== 'finished').sort((a, b) =>
  a.status === b.status ? `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`) : a.status === 'live' ? -1 : 1,
)

const has = (q: string, ...parts: (string | undefined)[]) => parts.filter(Boolean).join(' ').toLowerCase().includes(q)
const gameMatches = (s: Session, q: string) => has(q, s.sport, s.title, placeById(s.venue).name, s.teams?.join(' '), s.events?.join(' '))
const athleteMatches = (a: Athlete, q: string) => has(q, a.name, a.code, a.sport, a.line)
const planMatches = (e: GameEvent, q: string) => has(q, e.title, e.why, e.sport, eventTypeLabel[e.type], placeById(e.place).name, e.host?.name, e.sponsor)

// One search for Activity and Sports: the box on top, filters under it. Before you type it
// suggests (recent searches, trending, or things to browse for the chosen filter); as you
// type it lists matches, grouped under "All".
export default function SearchPage() {
  const navigate = useNavigate()
  const recent = useRecentSearches()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const q = query.trim().toLowerCase()

  // Opening something counts the search as done
  const remember = () => addRecentSearch(query)

  function openSport(name: string) {
    remember()
    navigate(`/sports?sport=${encodeURIComponent(name)}`)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    remember()
    ;(document.activeElement as HTMLElement | null)?.blur()
  }

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="shrink-0">
        <form onSubmit={submit} className="flex h-14 items-center gap-2 px-4">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              type="search"
              enterKeyHint="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search"
              className="h-11 w-full rounded-full bg-muted pr-10 pl-10 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery('')}
                className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <Button type="button" variant="ghost" className="shrink-0 px-2 text-base" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </form>

        <div role="group" aria-label="Filter results" className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
          {FILTERS.map((f) => (
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
      </header>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-[max(env(safe-area-inset-bottom),24px)]">
        {q ? (
          <Results q={q} query={query.trim()} filter={filter} onFilter={setFilter} onOpenSport={openSport} onOpen={remember} />
        ) : (
          <Suggestions filter={filter} recent={recent} onPick={setQuery} onOpenSport={openSport} />
        )}
      </div>
    </div>
  )
}

// ---- Before typing ----

function Suggestions({
  filter,
  recent,
  onPick,
  onOpenSport,
}: {
  filter: Filter
  recent: string[]
  onPick: (term: string) => void
  onOpenSport: (name: string) => void
}) {
  if (filter === 'sports') {
    return (
      <Group title="Browse sports">
        <SportChips sports={SPORTS} onOpen={onOpenSport} />
      </Group>
    )
  }
  if (filter === 'games') {
    return (
      <Group title="Live and coming up">
        <GameList sessions={UPCOMING_GAMES.slice(0, 6)} />
      </Group>
    )
  }
  if (filter === 'athletes') {
    return (
      <Group title="Athletes to watch">
        <AthleteList athletes={athletes} />
      </Group>
    )
  }
  if (filter === 'plans') {
    return (
      <Group title="Coming up">
        <PlanList plans={PLANS.slice(0, 6)} />
      </Group>
    )
  }

  return (
    <div className="space-y-6">
      {recent.length > 0 && (
        <Group title="Recent" action={<TextButton onClick={clearRecentSearches}>Clear</TextButton>}>
          <ul className="-mx-4">
            {recent.map((term) => (
              <li key={term} className="flex items-center">
                <button type="button" onClick={() => onPick(term)} className="flex min-h-12 min-w-0 flex-1 items-center gap-3 pl-4 text-left">
                  <Clock className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{term}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${term}`}
                  onClick={() => removeRecentSearch(term)}
                  className="flex size-12 shrink-0 items-center justify-center text-muted-foreground"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </Group>
      )}
      <Group title="Trending">
        <ul className="-mx-4">
          {TRENDING.map((term) => (
            <li key={term}>
              <button type="button" onClick={() => onPick(term)} className="flex min-h-12 w-full items-center gap-3 px-4 text-left">
                <TrendingUp className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{term}</span>
              </button>
            </li>
          ))}
        </ul>
      </Group>
    </div>
  )
}

// ---- While typing ----

function Results({
  q,
  query,
  filter,
  onFilter,
  onOpenSport,
  onOpen,
}: {
  q: string
  query: string
  filter: Filter
  onFilter: (f: Filter) => void
  onOpenSport: (name: string) => void
  onOpen: () => void
}) {
  const sports = SPORTS.filter((name) => name.toLowerCase().includes(q))
  const games = UPCOMING_GAMES.filter((s) => gameMatches(s, q))
  const people = athletes.filter((a) => athleteMatches(a, q))
  const plans = PLANS.filter((e) => planMatches(e, q))
  const counts: Record<Exclude<Filter, 'all'>, number> = { sports: sports.length, games: games.length, athletes: people.length, plans: plans.length }
  const total = filter === 'all' ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[filter]

  if (total === 0) {
    return (
      <div className="py-10 text-center">
        <p className="font-medium">No results for “{query}”</p>
        <p className="mt-1 text-sm text-muted-foreground">Check the spelling or try another word.</p>
      </div>
    )
  }

  const show = (f: Exclude<Filter, 'all'>) => (filter === 'all' || filter === f) && counts[f] > 0
  const cap = <T,>(items: T[]) => (filter === 'all' ? items.slice(0, PREVIEW) : items)
  const seeAll = (f: Exclude<Filter, 'all'>) =>
    filter === 'all' && counts[f] > PREVIEW ? <TextButton onClick={() => onFilter(f)}>See all {counts[f]}</TextButton> : null

  // Opening a result (a link) records the search; sports record it in onOpenSport
  return (
    <div className="space-y-6" onClickCapture={(e) => (e.target as HTMLElement).closest('a') && onOpen()}>
      {show('sports') && (
        <Group title="Sports" action={seeAll('sports')}>
          <SportChips sports={cap(sports)} onOpen={onOpenSport} />
        </Group>
      )}
      {show('games') && (
        <Group title="Games" action={seeAll('games')}>
          <GameList sessions={cap(games)} />
        </Group>
      )}
      {show('athletes') && (
        <Group title="Athletes" action={seeAll('athletes')}>
          <AthleteList athletes={cap(people)} />
        </Group>
      )}
      {show('plans') && (
        <Group title="Plans" action={seeAll('plans')}>
          <PlanList plans={cap(plans)} />
        </Group>
      )}
    </div>
  )
}

// ---- Pieces ----

function Group({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function TextButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="-my-2 py-2 text-sm font-medium">
      {children}
    </button>
  )
}

function SportChips({ sports, onOpen }: { sports: string[]; onOpen: (name: string) => void }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {sports.map((name) => {
        const shape = SPORT_SHAPE[name]
        return (
          <li key={name}>
            <button type="button" onClick={() => onOpen(name)} className="inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium">
              {shape && <ShapeIcon shape={shape} className="size-4 shrink-0" />}
              {name}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function GameList({ sessions }: { sessions: Session[] }) {
  return (
    <ul className="rounded-2xl bg-card px-4">
      {sessions.map((s) => (
        <SessionRow key={s.id} session={s} showSport />
      ))}
    </ul>
  )
}

function AthleteList({ athletes }: { athletes: Athlete[] }) {
  return (
    <ul className="space-y-2">
      {athletes.map((a) => (
        <li key={a.id}>
          <AthleteCard athlete={a} />
        </li>
      ))}
    </ul>
  )
}

function PlanList({ plans }: { plans: GameEvent[] }) {
  return (
    <ul className="-mx-4">
      {plans.map((e) => (
        <li key={e.id}>
          <EventRow e={e} />
        </li>
      ))}
    </ul>
  )
}
