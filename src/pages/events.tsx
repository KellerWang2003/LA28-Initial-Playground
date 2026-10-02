import { useState, type UIEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Plus, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { ImagePlaceholder } from '@/components/image-placeholder'
import { Placeholder } from '@/components/placeholder'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { EVENTS, eventAttendance, eventTypeLabel, flag, formatDate, formatTime, placeById, type GameEvent } from '@/data/la28'

// Today's events first, then the rest by date
const events = [...EVENTS].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
const featured = events.slice(0, 3)

const when = (e: GameEvent) => `${formatDate(e.date)} · ${formatTime(e.time)}`

export default function EventsPage() {
  const navigate = useNavigate()

  return (
    <div className="pb-28">
      <PageHeader
        title="Events"
        action={
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="New"
              className={cn(buttonVariants({ variant: 'outline', size: 'icon-lg' }), 'rounded-full')}
            >
              <Plus className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate('/events/host')}>Host a gathering</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/events/create')}>Create an event</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/events/invite')}>Invite people</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <Tabs defaultValue="recommended" className="px-4">
        <TabsList className="w-full">
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="mine">My events</TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="pt-2">
          <FeaturedCarousel />

          <h2 className="mt-6 mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">For you</h2>
          <ul className="-mx-4">
            {events.map((e) => (
              <li key={e.id}>
                <Link to={`/events/${e.id}`} className="flex gap-3 px-4 py-3 hover:bg-muted">
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
        </TabsContent>

        <TabsContent value="mine" className="h-[60dvh]">
          <Placeholder label="My events" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function FeaturedCarousel() {
  const [index, setIndex] = useState(0)

  function onScroll(e: UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    setIndex(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <div>
      <div onScroll={onScroll} className="no-scrollbar -mx-4 flex snap-x snap-mandatory overflow-x-auto">
        {featured.map((e) => (
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
        {featured.map((e, i) => (
          <span key={e.id} className={cn('size-1.5 rounded-full bg-muted-foreground/30', i === index && 'bg-foreground')} />
        ))}
      </div>
    </div>
  )
}
