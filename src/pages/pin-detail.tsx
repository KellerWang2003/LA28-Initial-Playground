import type { ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { ChevronLeft, Clock, MapPin, Navigation, Star, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PinShape, PinStatusChip, PinStatusText } from '@/components/pin-art'
import { useCollected } from '@/lib/collected'
import { cn } from '@/lib/utils'
import { activityAt, flag, pinById, pinKindLabel, placeById, reviewsFor, type Review } from '@/data/la28'

// Pin detail: the pin's visual, the place, how to capture it, reviews,
// then Navigate / I'm here. "I'm here" opens the capture screen.
export default function PinDetailPage() {
  const { pinId = '' } = useParams()
  const navigate = useNavigate()
  const collected = useCollected()
  const pin = pinById(pinId)

  if (!pin) return <Navigate to="/explore" replace />

  const place = placeById(pin.place)
  const activity = activityAt(place.id)
  const reviews = reviewsFor(place.id)
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  const done = collected.includes(pin.id)
  const locked = pin.status === 'locked'
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`

  return (
    <div className="flex h-dvh flex-col bg-background">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
        {/* Hero: the pin itself */}
        <div className="relative flex flex-col items-center bg-muted px-6 pt-[calc(env(safe-area-inset-top)+56px)] pb-8 text-center">
          <Button
            variant="outline"
            size="icon-lg"
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="absolute top-[calc(env(safe-area-inset-top)+12px)] left-4 rounded-full bg-background"
          >
            <ChevronLeft className="size-5" />
          </Button>
          <PinShape shape={pin.shape} status={pin.status} collected={done} className="size-36" />
          <h1 className="mt-5 font-heading text-2xl font-semibold">{pin.name}</h1>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            <PinStatusChip pin={pin} collected={done} verbose />
            <Badge variant="outline" className="bg-background">
              {pin.rarity}
            </Badge>
            <Badge variant="outline" className="bg-background">
              {pinKindLabel[pin.kind]}
            </Badge>
          </div>
        </div>

        <div className="space-y-7 px-4 pt-6">
          <Section title="About the place">
            <p className="font-medium">{place.name}</p>
            {place.about && <p className="mt-1 text-sm text-muted-foreground">{place.about}</p>}
            <ul className="mt-3 space-y-1.5 text-sm">
              <InfoRow icon={<MapPin />}>{place.hood}</InfoRow>
              {place.hours && <InfoRow icon={<Clock />}>{place.hours}</InfoRow>}
              {activity && (
                <InfoRow icon={<Users />}>
                  {activity.headingThere} fans heading there now · {activity.level}
                </InfoRow>
              )}
            </ul>
          </Section>

          <Section title="How to capture it">
            <ol className="space-y-3">
              <Step n={1} title={`Go to ${place.name}`}>
                You need to be at the spot, within about 100 m.
              </Step>
              <Step n={2} title={locked ? 'Wait for it to unlock' : pin.status === 'expiring' ? 'Get there before it ends' : 'Come any time it’s open'}>
                <span className="tabular-nums">
                  {pin.status === 'open' ? pin.label : <PinStatusText pin={pin} verbose />}
                </span>
              </Step>
              <Step n={3} title={'Tap “I’m here” and take a photo'}>
                Snap the landmark to stamp the pin into your Passport.
              </Step>
            </ol>
          </Section>

          <Section
            title="Reviews"
            aside={
              <span className="flex items-center gap-1 text-sm">
                <Star className="size-4 fill-current" />
                {average.toFixed(1)}
                <span className="text-muted-foreground">({reviews.length})</span>
              </span>
            }
          >
            <ul className="divide-y">
              {reviews.map((r) => (
                <ReviewRow key={`${r.name}-${r.when}`} review={r} />
              ))}
            </ul>
          </Section>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2 border-t px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <Button size="lg" variant="outline" nativeButton={false} render={<a href={directions} target="_blank" rel="noreferrer" />}>
          <Navigation data-icon="inline-start" />
          Navigate
        </Button>
        <Button size="lg" disabled={done || locked} onClick={() => navigate(`/explore/pins/${pin.id}/capture`)}>
          {done ? 'Collected' : locked ? <PinStatusText pin={pin} verbose /> : 'I’m here'}
        </Button>
      </div>
    </div>
  )
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-heading font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

function InfoRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0">
      {icon}
      <span>{children}</span>
    </li>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">{n}</span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{children}</p>
      </div>
    </li>
  )
}

function ReviewRow({ review }: { review: Review }) {
  return (
    <li className="py-3 first:pt-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">
          {flag(review.cc)} {review.name}
        </span>
        <span className="text-xs text-muted-foreground">{review.when}</span>
      </div>
      <div className="mt-0.5 flex" aria-label={`${review.rating} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={cn('size-3', i <= review.rating ? 'fill-current' : 'text-muted-foreground/40')} />
        ))}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{review.text}</p>
    </li>
  )
}
