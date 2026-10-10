import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { Car, ChevronLeft, Clock, Footprints, MapPin, Navigation, Star, TramFront, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CollectPanel } from '@/components/collect-panel'
import { ImagePlaceholder } from '@/components/image-placeholder'
import { MapView, UserDot } from '@/components/map-view'
import { PinPhotos } from '@/components/pin-photos'
import { PinShape, PinStatusChip } from '@/components/pin-art'
import { useCollected, useCustomIds } from '@/lib/collected'
import { usePinPhotos } from '@/lib/pin-photos'
import { CustomPin } from '@/components/place-photo'
import { MarkRow } from '@/components/bonus-list'
import { useBonusMarks } from '@/lib/bonuses'
import { bonusesFor } from '@/data/bonuses'
import { cn } from '@/lib/utils'
import { activityAt, flag, pinById, pinKindLabel, placeById, reviewsFor, type Review } from '@/data/la28'
import { FAKE_USER_LOCATION, formatKm, formatMinutes, travelFromYou, type LngLat } from '@/data/map-layers'

// Placeholder photos per place until real ones exist
const PHOTOS = 5
const MAP_PADDING = { top: 48, bottom: 48, left: 48, right: 48 }

// Pin detail: photos of the place, the pin, where it is and how long it takes
// to get there, then reviews. How to collect it and "I'm here" live in the
// floating CollectPanel, a separate layer from the place info.
export default function PinDetailPage() {
  const { pinId = '' } = useParams()
  const navigate = useNavigate()
  const collected = useCollected()
  const custom = useCustomIds().includes(pinId)
  const [photo, setPhoto] = useState(0)
  const yourPhotos = usePinPhotos(pinId)
  const marks = useBonusMarks()
  const pin = pinById(pinId)

  if (!pin) return <Navigate to="/explore" replace />

  const place = placeById(pin.place)
  const coords: LngLat = [place.lng, place.lat]
  const trip = travelFromYou(coords)
  const activity = activityAt(place.id)
  const reviews = reviewsFor(place.id)
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  const done = collected.includes(pin.id)
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`

  return (
    <div className="relative flex h-dvh flex-col bg-background">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-32">
        {/* Photos of the place, swipeable */}
        <div className="relative">
          <div
            aria-label={`Photos of ${place.name}`}
            onScroll={(e) => setPhoto(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
            className="no-scrollbar flex h-[calc(env(safe-area-inset-top)+16rem)] snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
          >
            {Array.from({ length: PHOTOS }, (_, i) => (
              <ImagePlaceholder key={i} className="h-full w-full shrink-0 snap-center rounded-none border-0" />
            ))}
          </div>
          <Button
            variant="outline"
            size="icon-lg"
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="absolute top-[calc(env(safe-area-inset-top)+12px)] left-4 rounded-full bg-background"
          >
            <ChevronLeft className="size-5" />
          </Button>
          <span className="absolute right-4 bottom-4 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium tabular-nums shadow-sm">
            {photo + 1} / {PHOTOS}
          </span>
        </div>

        {/* The pin itself, overlapping the photos */}
        <div className="flex flex-col items-center px-6 text-center">
          <div className="relative -mt-14 rounded-full border bg-background p-3 shadow-sm">
            {done && custom ? (
              <CustomPin seed={pin.id} shape={pin.shape} className="size-24" />
            ) : (
              <PinShape shape={pin.shape} status={pin.status} collected={done} className="size-24" />
            )}
          </div>
          <h1 className="mt-3 font-heading text-2xl font-semibold">{pin.name}</h1>
          <p className="text-sm text-muted-foreground">{place.name}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            <PinStatusChip pin={pin} collected={done} verbose />
            <Badge variant="outline">{pin.rarity}</Badge>
            <Badge variant="outline">{pinKindLabel[pin.kind]}</Badge>
          </div>
          {/* Marks from bonus challenges done here */}
          {done && <MarkRow marks={bonusesFor(pin.id).filter((b) => marks[b.id]).map((b) => marks[b.id])} className="mt-3" />}
        </div>

        <div className="space-y-7 px-4 pt-7">
          {/* Once it's yours: the photos from your visit, and room to add more */}
          {done && (
            <Section title="Your photos" aside={<span className="text-sm text-muted-foreground tabular-nums">{yourPhotos.length}</span>}>
              <PinPhotos pinId={pin.id} />
            </Section>
          )}

          <Section title="About the place">
            {place.about && <p className="text-sm text-muted-foreground">{place.about}</p>}
            <ul className="mt-3 space-y-1.5 text-sm">
              {place.hours && <InfoRow icon={<Clock />}>{place.hours}</InfoRow>}
              {activity && (
                <InfoRow icon={<Users />}>
                  {activity.headingThere} fans heading there now · {activity.level}
                </InfoRow>
              )}
            </ul>
          </Section>

          <Section title="Getting there" aside={<span className="text-sm text-muted-foreground">{formatKm(trip.km)} away</span>}>
            <div className="h-44 overflow-hidden rounded-xl border">
              <MapView
                interactive={false}
                markers={[
                  { id: 'me', coords: FAKE_USER_LOCATION },
                  { id: 'place', coords },
                ]}
                renderMarker={(id) =>
                  id === 'me' ? <UserDot /> : <PinShape shape={pin.shape} status={pin.status} collected={done} className="size-9 drop-shadow" />
                }
                initialBounds={[FAKE_USER_LOCATION, coords]}
                initialPadding={MAP_PADDING}
              />
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0" />
              {place.hood}
            </p>
            <ul className="mt-3 grid grid-cols-3 gap-2">
              <TravelTime icon={<Footprints />} label="Walk" minutes={trip.walk} />
              <TravelTime icon={<TramFront />} label="Transit" minutes={trip.transit} />
              <TravelTime icon={<Car />} label="Drive" minutes={trip.drive} />
            </ul>
            <Button
              variant="outline"
              className="mt-3 w-full"
              nativeButton={false}
              render={<a href={directions} target="_blank" rel="noreferrer" />}
            >
              <Navigation data-icon="inline-start" />
              Directions
            </Button>
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

      <CollectPanel
        pin={pin}
        placeName={place.name}
        collected={done}
        onCollect={() => navigate(`/explore/pins/${pin.id}/capture`)}
      />
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

function TravelTime({ icon, label, minutes }: { icon: ReactNode; label: string; minutes: number }) {
  return (
    <li className="flex flex-col items-center gap-1 rounded-xl border py-2.5 [&_svg]:size-5">
      {icon}
      <span className="text-sm font-medium tabular-nums">{formatMinutes(minutes)}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
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
