import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { Check, ChevronLeft, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { flag } from '@/data/la28'
import { formatCountdown, useClock } from '@/lib/clock'
import { addConnection, useConnections } from '@/lib/connections'
import { notify } from '@/lib/toasts'
import { useProfile } from '@/lib/profile'
import {
  countryFlags,
  countryName,
  groupById,
  HOST_VIBES,
  memberById,
  tally,
  type Group,
  type Member,
  type TallySpot,
} from '@/features/activity/keep-going'
import {
  castVote,
  hostGathering,
  joinIn,
  joinOffer,
  keepStep,
  leaveGroup,
  myGroup,
  nextOffer,
  pass,
  passOffer,
  reopen,
  useKeepGoing,
  voteClosed,
} from '@/features/activity/keep-going-state'

// After swimming: say yes, get matched with a group (join or pass), or host one while you wait.
// Joining opens the group, where everyone votes on a place before the vote closes.
export default function KeepGoingPage() {
  const navigate = useNavigate()
  const keep = useKeepGoing()
  const now = useClock()
  const step = keepStep(keep)
  const group = myGroup(keep, now)
  const offer = keep.offerId ? groupById(keep.offerId) : undefined

  const title =
    step === 'matching'
      ? 'Finding your group'
      : step === 'offer'
        ? 'Your match'
        : step === 'group'
          ? keep.host
            ? 'Your gathering'
            : 'Your group'
          : 'After swimming'

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={() => navigate('/events')}>
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="truncate font-heading text-lg font-semibold">{title}</h1>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        {step === 'ask' && <Ask />}
        {step === 'out' && <Out />}
        {step === 'matching' && <Matching />}
        {step === 'offer' && offer && <Offer group={offer} />}
        {step === 'group' && group && <GroupPage group={group} />}
      </div>

      {step === 'ask' && (
        <Footer>
          <Button size="lg" className="w-full" onClick={joinIn}>
            I’m in
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="w-full"
            onClick={() => {
              pass()
              navigate('/events')
            }}
          >
            Not tonight
          </Button>
        </Footer>
      )}

      {step === 'out' && (
        <Footer>
          <Button size="lg" className="w-full" onClick={reopen}>
            Changed my mind
          </Button>
        </Footer>
      )}

      {step === 'matching' && (
        <Footer>
          <Button
            size="lg"
            variant="ghost"
            className="w-full"
            onClick={() => {
              pass()
              navigate('/events')
            }}
          >
            Stop looking
          </Button>
        </Footer>
      )}

      {step === 'offer' && (
        <Footer row>
          <Button size="lg" variant="outline" className="flex-1" onClick={passOffer}>
            Pass
          </Button>
          <Button size="lg" className="flex-1" onClick={joinOffer}>
            Join
          </Button>
        </Footer>
      )}

      {step === 'group' && (
        <Footer>
          <Button size="lg" className="w-full" onClick={() => navigate('/events')}>
            Done
          </Button>
        </Footer>
      )}
    </div>
  )
}

function Footer({ children, row }: { children: ReactNode; row?: boolean }) {
  return (
    <footer
      className={cn(
        'shrink-0 border-t px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]',
        row ? 'flex gap-2' : 'space-y-2',
      )}
    >
      {children}
    </footer>
  )
}

function Ask() {
  return (
    <div className="pt-6">
      <p className="text-xs text-muted-foreground">SoFi Stadium · Swimming</p>
      <h2 className="mt-2 font-heading text-2xl font-semibold">Keep going after the game?</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        We’ll match you with fans from tonight who want to stay out. You see who’s in before you join, and the group
        votes on a place nearby.
      </p>
    </div>
  )
}

function Out() {
  return (
    <div className="pt-6">
      <h2 className="font-heading text-2xl font-semibold">Not tonight</h2>
      <p className="mt-3 text-sm text-muted-foreground">You won’t be matched with a group after swimming.</p>
    </div>
  )
}

function Matching() {
  const keep = useKeepGoing()
  const more = nextOffer(keep)

  return (
    <div className="pt-6">
      <div className="flex flex-col items-center py-8 text-center">
        <span className="relative flex size-20 items-center justify-center">
          {more && <span className="absolute inset-0 animate-ping rounded-full bg-muted" />}
          <span className="relative flex size-20 items-center justify-center rounded-full bg-card">
            <Users className="size-7" />
          </span>
        </span>
        <p className="mt-6 font-heading text-lg font-semibold">
          {more ? 'Matching you with fans from SoFi' : 'No more groups right now'}
        </p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          {more
            ? 'We’ll show you a group as soon as one fits. Join it or pass.'
            : 'Host your own and we’ll send fans who said yes your way.'}
        </p>
      </div>
      <HostPicker />
    </div>
  )
}

// While you wait: host a gathering yourself
function HostPicker() {
  const [vibe, setVibe] = useState<string | null>(null)
  return (
    <section className="rounded-2xl bg-card p-4">
      <p className="font-medium">Rather host?</p>
      <p className="mt-0.5 text-sm text-muted-foreground">Pick the feel. The group still votes on where.</p>
      <ul className="mt-3 space-y-2">
        {HOST_VIBES.map((v) => {
          const on = vibe === v.id
          return (
            <li key={v.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => setVibe(v.id)}
                className={cn(
                  'w-full rounded-xl border bg-background px-3 py-2.5 text-left',
                  on ? 'border-foreground' : 'border-transparent',
                )}
              >
                <span className="block text-sm font-medium">{v.title}</span>
                <span className="block text-xs text-muted-foreground">{v.blurb}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <Button className="mt-3 w-full" variant="outline" disabled={!vibe} onClick={() => vibe && hostGathering(vibe)}>
        Host this
      </Button>
    </section>
  )
}

function Offer({ group }: { group: Group }) {
  return (
    <div className="space-y-5 pt-2">
      <div>
        <p className="text-xs text-muted-foreground">Matched · {group.members.length} fans from SoFi</p>
        <h2 className="mt-1 font-heading text-2xl font-semibold">{group.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{group.blurb}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-card p-3">
          <p className="text-xs text-muted-foreground">From</p>
          <p className="mt-1 text-lg leading-snug">{countryFlags(group)}</p>
        </div>
        <div className="rounded-2xl bg-card p-3">
          <p className="text-xs text-muted-foreground">Speaks</p>
          <p className="mt-1 text-sm font-medium">{group.languages.join(', ')}</p>
        </div>
      </div>

      <section>
        <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Who’s going</h3>
        <MemberList members={group.members} />
      </section>
    </div>
  )
}

function GroupPage({ group }: { group: Group }) {
  const keep = useKeepGoing()
  const now = useClock()
  const profile = useProfile()
  const closed = voteClosed(keep, now)
  const { spots, total, leader } = tally(group, keep.voteId)
  const hosting = !!keep.host

  return (
    <div className="space-y-6 pt-2 pb-2">
      <div>
        <p className="text-xs text-muted-foreground">
          {hosting ? 'You’re hosting' : 'You joined'} · after swimming at SoFi
        </p>
        <h2 className="mt-1 font-heading text-2xl font-semibold">{group.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {group.members.length + 1} going · speaks {group.languages.join(', ')}
        </p>
      </div>

      {closed ? (
        <Decision group={group} spot={leader} total={total} />
      ) : (
        <Vote
          spots={spots}
          voteId={keep.voteId}
          total={total}
          members={group.members.length}
          left={Math.ceil((keep.votesClose! - now) / 1000)}
        />
      )}

      <section>
        <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Who’s going</h3>
        <div className="divide-y divide-background overflow-hidden rounded-2xl bg-card">
          <div className="flex items-center gap-3 px-4 py-2.5">
            <Avatar>
              <AvatarFallback>{profile.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              {flag(profile.country)} {profile.name}
            </span>
            <Badge variant={hosting ? 'default' : 'outline'} className="ml-auto">
              {hosting ? 'Host' : 'You'}
            </Badge>
          </div>
          {group.members.map((m) => (
            <MemberRow key={m.id} member={m} />
          ))}
        </div>
        {hosting && group.members.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">Sending fans who said yes your way…</p>
        )}
      </section>

      {!closed && (
        <Button type="button" variant="ghost" className="w-full" onClick={leaveGroup}>
          {hosting ? 'Stop hosting' : 'Leave this group'}
        </Button>
      )}
    </div>
  )
}

function Vote({
  spots,
  voteId,
  total,
  members,
  left,
}: {
  spots: TallySpot[]
  voteId: string | null
  total: number
  members: number
  left: number
}) {
  return (
    <section className="rounded-2xl bg-card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-medium">Where to?</p>
        <p className="shrink-0 text-xs text-muted-foreground tabular-nums">Closes in {formatCountdown(left)}</p>
      </div>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {voteId ? `${total} votes so far. You can change yours until it closes.` : `${members} voted. Add yours.`}
      </p>
      <ul className="mt-3 space-y-2">
        {spots.map((spot) => {
          const on = voteId === spot.id
          const width = total ? Math.round((spot.count / total) * 100) : 0
          return (
            <li key={spot.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => castVote(spot.id)}
                className={cn(
                  'w-full rounded-xl border bg-background p-3 text-left',
                  on ? 'border-foreground' : 'border-transparent',
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium">{spot.name}</p>
                  <p className="shrink-0 text-sm tabular-nums">{spot.count}</p>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {spot.kind} · {spot.walk}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-foreground" style={{ width: `${width}%` }} />
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Decision({ group, spot, total }: { group: Group; spot: TallySpot; total: number }) {
  const connections = useConnections()
  const met = memberById(group, group.metId)
  const added = met && connections.includes(met.id)

  return (
    <>
      <section className="rounded-2xl bg-card p-4">
        <p className="text-xs text-muted-foreground">The vote is in</p>
        <p className="mt-1 font-heading text-xl font-semibold">{spot.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {spot.walk} from SoFi. {spot.note}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 w-full"
          onClick={() =>
            notify({ title: 'Sent to Priya', body: `${spot.name}, ${spot.walk} from SoFi. ${total} people going.` })
          }
        >
          Share the plan with Priya
        </Button>
      </section>

      {met && (
        <section className="rounded-2xl bg-card p-4">
          <p className="text-xs text-muted-foreground">You got talking</p>
          <p className="mt-1 font-heading text-lg font-semibold">
            {flag(met.cc)} {met.name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{met.trait}. Swap a way to stay in touch before you split up.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                notify({
                  title: 'Opens Instagram',
                  body: met.instagram ? `This would open ${met.instagram}.` : `This would open a profile for ${met.name}.`,
                })
              }
            >
              Instagram
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => notify({ title: 'Opens WhatsApp', body: `This would open a chat with ${met.name}.` })}
            >
              WhatsApp
            </Button>
          </div>
          {added ? (
            <Button type="button" variant="secondary" className="mt-2 w-full" nativeButton={false} render={<Link to="/people" />}>
              <Check data-icon="inline-start" />
              {met.name} is in your people
            </Button>
          ) : (
            <Button type="button" className="mt-2 w-full" onClick={() => addConnection(met.id)}>
              Add {met.name} on Palms
            </Button>
          )}
        </section>
      )}
    </>
  )
}

function MemberList({ members }: { members: Member[] }) {
  return (
    <div className="divide-y divide-background overflow-hidden rounded-2xl bg-card">
      {members.map((m) => (
        <MemberRow key={m.id} member={m} />
      ))}
    </div>
  )
}

function MemberRow({ member: m }: { member: Member }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <Avatar>
        <AvatarFallback>{m.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <span className="block text-sm font-medium">
          {flag(m.cc)} {m.name}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {countryName(m.cc)} · {m.trait}
        </span>
      </span>
    </div>
  )
}
