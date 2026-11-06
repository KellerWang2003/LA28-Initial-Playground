import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChevronLeft, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useClock } from '@/lib/clock'
import { useFanLocation } from '@/lib/location'
import {
  ArrivalRow,
  GroupCamera,
  Icebreakers,
  KeepInTouch,
  NightOutStamp,
  SignalCard,
  WalkMap,
} from '@/features/hangout/screens'
import { arrivesAt, arrive, distanceLeft, headOver, takeGroupPhoto, useHangout, usePlan, walkThere } from '@/features/hangout/state'

// A group photo needs you and at least this many others
const MIN_IN_PHOTO = 2

// After the vote: walk over with your group, sit down, take one photo together, keep in touch.
export default function HangoutPage() {
  const navigate = useNavigate()
  const plan = usePlan()
  const hangout = useHangout()
  const now = useClock()
  const me = useFanLocation()
  const [camera, setCamera] = useState(false)

  // Landing here once the plan is set starts the walk (a debug jump may have started it already)
  const ready = !!plan
  useEffect(() => {
    if (ready) headOver()
  }, [ready])

  const back = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/events/keep-going', { replace: true }))

  if (!plan) {
    return (
      <Frame title="Night out" onBack={back}>
        <div className="rounded-2xl bg-card p-4">
          <p className="font-medium">No plan yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Once your group picks a place after the game, you’ll head over from here.</p>
          <Button className="mt-3" variant="outline" nativeButton={false} render={<Link to="/events/keep-going" />}>
            After the game
          </Button>
        </div>
      </Frame>
    )
  }

  const { group, spot } = plan
  // Opening the page sets you off
  const stage = hangout.stage === 'off' ? 'walking' : hangout.stage
  const since = hangout.since ?? now
  const { meters, here } = distanceLeft(spot, me)
  const there = group.members.filter((m) => now >= arrivesAt(group, m, since))

  if (stage === 'walking') {
    return (
      <Frame
        title={`Head to ${spot.name}`}
        onBack={back}
        footer={
          <>
            <Button size="lg" className="w-full" disabled={!here} onClick={arrive}>
              {here ? 'I’m here' : `${meters.toLocaleString()} m to go`}
            </Button>
            {!here && (
              <Button size="lg" variant="ghost" className="w-full" onClick={() => walkThere(spot)}>
                <Navigation data-icon="inline-start" />
                Walk there (prototype)
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-3 pt-1">
          <p className="text-sm text-muted-foreground">
            {group.title} · {group.members.length + 1} going · {spot.walk} from SoFi
          </p>
          <WalkMap group={group} spot={spot} since={since} />
          <ArrivalRow group={group} since={since} />
          <SignalCard />
        </div>
      </Frame>
    )
  }

  if (stage === 'table') {
    return (
      <Frame
        title={spot.name}
        onBack={back}
        footer={
          <Button size="lg" className="w-full" disabled={there.length < MIN_IN_PHOTO} onClick={() => setCamera(true)}>
            {there.length < MIN_IN_PHOTO ? 'Waiting for the group to arrive' : 'Take the group photo'}
          </Button>
        }
      >
        <div className="space-y-6 pt-1">
          <div>
            <p className="text-xs text-muted-foreground">You made it · {group.title}</p>
            <h2 className="mt-1 font-heading text-2xl font-semibold">
              {there.length === group.members.length ? 'Everyone’s here' : `${there.length + 1} of ${group.members.length + 1} here`}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">One photo together adds the Night Out pin to everyone’s Passport.</p>
          </div>
          <ArrivalRow group={group} since={since} />
          <Icebreakers members={there.length ? there : group.members} />
        </div>
        {camera && (
          <GroupCamera
            members={there}
            onClose={() => setCamera(false)}
            onShoot={() => {
              setCamera(false)
              takeGroupPhoto(there.map((m) => m.id))
            }}
          />
        )}
      </Frame>
    )
  }

  const inPhoto = group.members.filter((m) => hangout.inPhoto.includes(m.id))
  return (
    <Frame
      title="Night out"
      onBack={back}
      footer={
        <Button size="lg" className="w-full" onClick={() => navigate('/events')}>
          Done
        </Button>
      }
    >
      <div className="space-y-6 pt-1">
        <NightOutStamp group={group} spot={spot} inPhoto={hangout.inPhoto} />
        <KeepInTouch group={group} people={inPhoto.length ? inPhoto : group.members} />
      </div>
    </Frame>
  )
}

function Frame({ title, onBack, footer, children }: { title: string; onBack: () => void; footer?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={onBack}>
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="truncate font-heading text-lg font-semibold">{title}</h1>
      </header>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
      {footer && <footer className="shrink-0 space-y-2 border-t px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">{footer}</footer>}
    </div>
  )
}
