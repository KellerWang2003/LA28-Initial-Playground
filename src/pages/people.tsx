import { useState } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/page-header'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { chats, people, personById, type Person } from '@/data/mock'

type Metric = 'pins' | 'places'

const initials = (p: Person) => p.name.slice(0, 2).toUpperCase()

export default function PeoplePage() {
  const [metric, setMetric] = useState<Metric>('pins')
  const ranked = [...people].sort((a, b) => b[metric] - a[metric])
  // Podium order: 2nd, 1st, 3rd
  const podium = [ranked[1], ranked[0], ranked[2]]
  const podiumRank = [2, 1, 3]
  const unit = metric === 'pins' ? 'pins' : 'places'

  return (
    <div className="pb-28">
      <PageHeader title="People" />

      <div className="space-y-6 px-4">
        <section className="rounded-2xl border p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading font-semibold">Leaderboard</h2>
            <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)}>
              <TabsList>
                <TabsTrigger value="pins">Pins</TabsTrigger>
                <TabsTrigger value="places">Places</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="mt-4 grid grid-cols-3 items-end gap-2">
            {podium.map((p, i) => (
              <Link key={p.id} to={`/people/${p.id}`} className={cn('flex flex-col items-center', i !== 1 && 'pb-3')}>
                <span className="mb-1 flex size-5 items-center justify-center rounded-full border text-[11px] font-semibold">
                  {podiumRank[i]}
                </span>
                <Avatar className={cn(i === 1 ? 'size-16' : 'size-12')}>
                  <AvatarFallback>{initials(p)}</AvatarFallback>
                </Avatar>
                <span className="mt-1 text-sm font-medium">
                  {p.flag} {p.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {p[metric]} {unit}
                </span>
              </Link>
            ))}
          </div>

          <ul className="mt-3">
            {ranked.slice(3).map((p, i) => (
              <li key={p.id} className="border-t">
                <Link to={`/people/${p.id}`} className="flex items-center gap-3 py-2 text-sm">
                  <span className="w-4 text-muted-foreground">{i + 4}</span>
                  <Avatar size="sm">
                    <AvatarFallback className="text-[10px]">{initials(p)}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1">
                    {p.flag} {p.name}
                  </span>
                  <span className="text-muted-foreground">{p[metric]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-1 font-heading font-semibold">Chat</h2>
          <ul className="-mx-4">
            {chats.map((c) => {
              const p = personById(c.personId)!
              return (
                <li key={c.id}>
                  <Link to={`/people/chat/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted active:bg-muted">
                    <Avatar size="lg">
                      <AvatarFallback>{initials(p)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-medium">
                          {p.flag} {p.name}
                        </p>
                        <span className="shrink-0 text-xs text-muted-foreground">{c.time}</span>
                      </div>
                      <p className={cn('truncate text-sm text-muted-foreground', c.unread && 'font-medium text-foreground')}>
                        {c.last}
                      </p>
                    </div>
                    {c.unread && <span className="size-2 shrink-0 rounded-full bg-foreground" aria-label="Unread" />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}
