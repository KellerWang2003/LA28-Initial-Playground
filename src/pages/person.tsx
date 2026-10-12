import { Link, useNavigate, useParams } from 'react-router'
import { Check, ChevronLeft, Footprints, MapPinned, MessageCircle, Stamp, Ticket, Trophy, UserPlus, type LucideIcon } from 'lucide-react'
import { EmptyScreen } from '@/components/empty-screen'
import { ImagePlaceholder } from '@/components/image-placeholder'
import { Button, buttonVariants } from '@/components/ui/button'
import { addConnection, useConnections } from '@/lib/connections'
import { cn } from '@/lib/utils'
import { achievementsOf, chats, personById, ACHIEVEMENTS, type AchievementId } from '@/data/mock'

const ICON: Record<AchievementId, LucideIcon> = {
  'first-pin': Stamp,
  'ten-pins': Stamp,
  'twenty-five-pins': Stamp,
  explorer: MapPinned,
  wanderer: MapPinned,
  baton: Footprints,
  relay: Footprints,
  'game-day': Ticket,
  superfan: Trophy,
}

// Another fan's profile: who they are, their numbers and what they've earned.
// Opened from your people, or straight from scanning their code, where you can add them.
export default function PersonPage() {
  const navigate = useNavigate()
  const { personId = '' } = useParams()
  const connections = useConnections()
  const person = personById(personId)
  if (!person) return <EmptyScreen title="Profile" />

  const added = connections.includes(person.id)
  const chat = chats.find((c) => c.personId === person.id)
  const earned = achievementsOf(person)

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={() => navigate(-1)}>
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="font-heading text-lg font-semibold">Profile</h1>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 space-y-8 overflow-y-auto overscroll-contain px-4 pt-2 pb-[max(env(safe-area-inset-bottom),24px)]">
        <section>
          <div className="flex items-start gap-4">
            <ImagePlaceholder className="size-20 shrink-0 rounded-2xl" />
            <div className="min-w-0 pt-0.5">
              <h2 className="font-heading text-xl font-semibold">
                {person.flag} {person.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{person.bio}</p>
            </div>
          </div>

          {added ? (
            <div className="mt-4 flex gap-2">
              <span className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border text-sm font-medium text-muted-foreground">
                <Check className="size-4" />
                In your people
              </span>
              {chat && (
                <Link to={`/people/chat/${chat.id}`} className={cn(buttonVariants({ size: 'lg' }), 'flex-1')}>
                  <MessageCircle />
                  Message
                </Link>
              )}
            </div>
          ) : (
            <Button type="button" size="lg" className="mt-4 w-full" onClick={() => addConnection(person.id)}>
              <UserPlus />
              Add {person.name}
            </Button>
          )}
        </section>

        <section aria-label="Stats">
          <dl className="grid grid-cols-4 gap-2 rounded-2xl border px-2 py-3 text-center">
            <Stat value={person.pins} label="Pins" />
            <Stat value={person.places} label="Places" />
            <Stat value={person.batons} label="Batons" />
            <Stat value={person.games} label="Games" />
          </dl>
        </section>

        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-heading font-semibold">Achievements</h2>
            <span className="text-sm text-muted-foreground tabular-nums">
              {earned.length}/{ACHIEVEMENTS.length}
            </span>
          </div>
          {earned.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Nothing earned yet.</p>
          ) : (
            <ul className="mt-3 grid grid-cols-3 gap-x-2 gap-y-4">
              {earned.map((a) => {
                const Icon = ICON[a.id]
                return (
                  <li key={a.id} className="flex flex-col items-center text-center">
                    <span className="flex size-14 items-center justify-center rounded-full border-2 border-foreground">
                      <Icon className="size-6" />
                    </span>
                    <span className="mt-1.5 text-xs font-semibold">{a.title}</span>
                    <span className="text-[11px] text-muted-foreground">{a.detail}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col">
      <dt className="order-2 text-[11px] leading-tight text-muted-foreground">{label}</dt>
      <dd className="order-1 font-heading text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
