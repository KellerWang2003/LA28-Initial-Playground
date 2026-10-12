import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChevronLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { flag } from '@/data/la28'
import { addConnection, useConnections } from '@/lib/connections'
import { notify } from '@/lib/toasts'
import { useProfile } from '@/lib/profile'
import {
  countryFlags,
  groupById,
  GROUPS,
  memberById,
  tally,
  type Group,
  type TallySpot,
} from '@/features/activity/keep-going'
import { castVote, joinIn, pass, pickGroup, useKeepGoing } from '@/features/activity/keep-going-state'

type Step = 'ask' | 'groups' | 'vote' | 'plan'

function resume(answer: 'in' | 'out' | null, groupId: string | null, voteId: string | null): Step {
  if (voteId) return 'plan'
  if (groupId) return 'vote'
  if (answer === 'in') return 'groups'
  return 'ask'
}

const PHASES = [
  { id: 'groups', label: 'Group' },
  { id: 'vote', label: 'Place' },
  { id: 'plan', label: 'Go' },
] as const

export default function KeepGoingPage() {
  const navigate = useNavigate()
  const keep = useKeepGoing()
  const [step, setStep] = useState<Step>(() => resume(keep.answer, keep.groupId, keep.voteId))
  const [pendingGroup, setPendingGroup] = useState<string | null>(keep.groupId)

  const group = keep.groupId ? groupById(keep.groupId) : undefined
  const result = group ? tally(group, keep.voteId) : null

  function back() {
    if (step === 'vote') setStep('groups')
    else if (step === 'plan' || step === 'groups') navigate('/events')
    else navigate('/events')
  }

  const title =
    step === 'ask' ? 'After the final' : step === 'groups' ? 'Pick a group' : step === 'vote' ? 'Pick a place' : 'Tonight’s plan'

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={back}>
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="truncate font-heading text-lg font-semibold">{title}</h1>
      </header>

      {step !== 'ask' && (
        <div className="flex gap-4 px-4 pb-2 text-xs font-medium text-muted-foreground">
          {PHASES.map((phase) => (
            <span key={phase.id} className={cn(phase.id === step && 'text-foreground')}>
              {phase.label}
            </span>
          ))}
        </div>
      )}

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        {step === 'ask' && <Ask />}
        {step === 'groups' && <GroupList selected={pendingGroup} onSelect={setPendingGroup} />}
        {step === 'vote' && group && result && (
          <Vote group={group} spots={result.spots} voteId={keep.voteId} total={result.total} winner={result.winner} />
        )}
        {step === 'plan' && group && result?.winner && <Plan group={group} winner={result.winner} total={result.total} />}
      </div>

      {step === 'ask' && (
        <footer className="shrink-0 space-y-2 border-t px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              joinIn()
              setStep('groups')
            }}
          >
            See the groups
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => {
              pass()
              navigate('/events')
            }}
          >
            Not tonight
          </Button>
        </footer>
      )}

      {step === 'groups' && (
        <footer className="shrink-0 space-y-2 border-t px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
          <Button
            size="lg"
            className="w-full"
            disabled={!pendingGroup}
            onClick={() => {
              if (!pendingGroup) return
              pickGroup(pendingGroup)
              setStep('vote')
            }}
          >
            Join this group
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
        </footer>
      )}

      {step === 'vote' && (
        <footer className="shrink-0 border-t px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
          <Button size="lg" className="w-full" disabled={!keep.voteId} onClick={() => setStep('plan')}>
            See the plan
          </Button>
        </footer>
      )}

      {step === 'plan' && (
        <footer className="shrink-0 border-t px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
          <Button size="lg" className="w-full" onClick={() => navigate('/events')}>
            Done
          </Button>
        </footer>
      )}
    </div>
  )
}

function Ask() {
  return (
    <div className="pt-2">
      <p className="text-xs text-muted-foreground">SoFi Stadium · Swimming</p>
      <h2 className="mt-2 font-heading text-2xl font-semibold">The 200m freestyle just finished</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Australia took gold. The swimmer people here were watching finished off the podium, so the groups forming now are
        for company after the loss.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Pick a group, then everyone votes on a public spot within a short walk of the stadium.
      </p>
    </div>
  )
}

function GroupList({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  return (
    <ul className="space-y-2 pt-2">
      {GROUPS.map((group) => {
        const on = selected === group.id
        return (
          <li key={group.id}>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => onSelect(group.id)}
              className={cn('w-full rounded-2xl border-2 p-4 text-left', on ? 'border-primary' : 'border-border')}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium">{group.title}</p>
                <p className="shrink-0 text-xs text-muted-foreground">{group.members.length} people</p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{countryFlags(group)}</p>
              <p className="mt-2 text-sm text-muted-foreground">{group.blurb}</p>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function Vote({
  group,
  spots,
  voteId,
  total,
  winner,
}: {
  group: Group
  spots: TallySpot[]
  voteId: string | null
  total: number
  winner: TallySpot | null
}) {
  return (
    <div className="pt-2">
      <p className="text-sm text-muted-foreground">
        {group.title}
        {' · '}
        {voteId ? `All ${total} votes are in.` : `${group.members.length} people have voted. You’re the last one.`}
      </p>
      <ul className="mt-4 space-y-2">
        {spots.map((spot) => {
          const on = voteId === spot.id
          const width = total ? Math.round((spot.count / total) * 100) : 0
          return (
            <li key={spot.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => castVote(spot.id)}
                className={cn('w-full rounded-2xl border-2 p-4 text-left', on ? 'border-primary' : 'border-border')}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium">{spot.name}</p>
                  <p className="shrink-0 text-sm tabular-nums">{spot.count}</p>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {spot.kind} · {spot.walk}
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-foreground" style={{ width: `${width}%` }} />
                </div>
              </button>
            </li>
          )
        })}
      </ul>
      {winner && (
        <p className="mt-4 text-sm text-muted-foreground">
          The group is heading to {winner.name}. {winner.note}
        </p>
      )}
    </div>
  )
}

function Plan({ group, winner, total }: { group: Group; winner: TallySpot; total: number }) {
  const profile = useProfile()
  const connections = useConnections()
  const met = memberById(group, group.metId)!
  const added = connections.includes(met.id)

  function share() {
    notify({ title: 'Sent to Priya', body: `${winner.name}, ${winner.walk} from SoFi. ${total} people going.` })
  }

  function openInstagram() {
    notify({
      title: 'Opens Instagram',
      body: met.instagram ? `This would open ${met.instagram}.` : `This would open a profile for ${met.name}.`,
    })
  }

  function openWhatsApp() {
    notify({ title: 'Opens WhatsApp', body: `This would open a chat with ${met.name}.` })
  }

  return (
    <div className="space-y-6 pt-2 pb-2">
      <div>
        <p className="text-xs text-muted-foreground">Decision made · {group.title}</p>
        <h2 className="mt-1 font-heading text-2xl font-semibold">{winner.name}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {winner.walk} from SoFi Stadium. {winner.note}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Public spot, {total} people. Share the plan with someone before you head over.
        </p>
        <Button type="button" variant="outline" className="mt-4" onClick={share}>
          Share with Priya
        </Button>
      </div>

      <section>
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Who’s going</h3>
        <ul className="mt-2">
          <li className="flex items-center gap-3 border-b py-2.5">
            <Avatar>
              <AvatarFallback>{profile.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              {flag(profile.country)} {profile.name}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">You</span>
          </li>
          {group.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 border-b py-2.5 last:border-b-0">
              <Avatar>
                <AvatarFallback>{m.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="min-w-0">
                <span className="block text-sm font-medium">
                  {flag(m.cc)} {m.name}
                </span>
                <span className="block text-xs text-muted-foreground">{m.trait}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border p-4">
        <p className="text-xs text-muted-foreground">You got talking</p>
        <p className="mt-1 font-heading text-lg font-semibold">
          {flag(met.cc)} {met.name}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{met.trait}. Swap a way to stay in touch before you split up.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={openInstagram}>
            Instagram
          </Button>
          <Button type="button" variant="outline" onClick={openWhatsApp}>
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
    </div>
  )
}
