import { useState, type UIEvent } from 'react'
import { Link } from 'react-router'
import { Plus, Search, Sparkles, X } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { ImagePlaceholder } from '@/components/image-placeholder'
import { Placeholder } from '@/components/placeholder'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { EVENTS, eventAttendance, eventTypeLabel, flag, formatDate, formatTime, placeById, type GameEvent } from '@/data/la28'

// Today's events first, then the rest by date
const events = [...EVENTS].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
const featured = events.slice(0, 3)

const when = (e: GameEvent) => `${formatDate(e.date)} · ${formatTime(e.time)}`

const eventText = (e: GameEvent) =>
  [e.title, e.why, e.sport, eventTypeLabel[e.type], placeById(e.place).name, e.host?.name, e.sponsor]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

export default function EventsPage() {
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const matches = q ? events.filter((e) => eventText(e).includes(q)) : events
  const featuredMatches = (q ? matches : featured).slice(0, 3)

  function closeSearch() {
    setQuery('')
    setSearching(false)
  }

  return (
    <div className="pb-28">
      <PageHeader
        title="Events"
        action={
          <>
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label={searching ? 'Close search' : 'Search events'}
              aria-expanded={searching}
              className="rounded-full"
              onClick={() => (searching ? closeSearch() : setSearching(true))}
            >
              {searching ? <X className="size-5" /> : <Search className="size-5" />}
            </Button>
            <Link
              to="/events/create"
              aria-label="New event"
              className={cn(buttonVariants({ variant: 'outline', size: 'icon-lg' }), 'rounded-full')}
            >
              <Plus className="size-5" />
            </Link>
          </>
        }
        below={
          searching ? (
            <div className="px-4 pb-3">
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events"
                aria-label="Search events"
                className="h-12 rounded-full px-4 text-base"
              />
            </div>
          ) : null
        }
      />

      <Tabs defaultValue="recommended" className="px-4">
        <TabsList className="w-full">
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="mine">My events</TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="pt-2">
          {featuredMatches.length > 0 && <FeaturedCarousel items={featuredMatches} />}

          <h2 className="mt-6 mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {q ? 'Results' : 'For you'}
          </h2>
          {matches.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">No events match “{query.trim()}”.</p>
          ) : (
          <ul className="-mx-4">
            {matches.map((e) => (
              <li key={e.id}>
                <Link to={`/events/${e.id}`} className="flex gap-3 px-4 py-3 hover:bg-muted active:bg-muted">
                  <ImagePlaceholder className="size-20 shrink-0" />
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
              </li>
            ))}
          </ul>
          )}
        </TabsContent>

        <TabsContent value="mine" className="h-[60dvh]">
          <Placeholder label="My events" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function FeaturedCarousel({ items }: { items: GameEvent[] }) {
  const [index, setIndex] = useState(0)

  function onScroll(e: UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    setIndex(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <div>
      <div onScroll={onScroll} className="no-scrollbar -mx-4 flex snap-x snap-mandatory overscroll-x-contain overflow-x-auto">
        {items.map((e) => (
          <Link key={e.id} to={`/events/${e.id}`} className="w-full shrink-0 snap-start px-4">
            <ImagePlaceholder className="aspect-[16/10] w-full rounded-2xl" />
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary">{eventTypeLabel[e.type]}</Badge>
              <span className="truncate text-xs text-muted-foreground">{when(e)}</span>
            </div>
            <p className="mt-1 truncate font-heading font-semibold">{e.title}</p>
          </Link>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
        {items.map((e, i) => (
          <span key={e.id} className={cn('size-1.5 rounded-full bg-muted-foreground/30', i === index && 'bg-foreground')} />
        ))}
      </div>
    </div>
  )
}
