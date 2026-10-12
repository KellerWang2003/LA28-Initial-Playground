import { MapPin, Tv } from 'lucide-react'
import type { AttendMode } from '@/lib/my-games'
import { formatCount, MIN_GROUP, type Crowd } from './model'
import { Section } from './section'

// Venue vs online, as totals only
export function VenueOnlineSplit({ crowd, mode, ended }: { crowd: Crowd; mode: AttendMode; ended: boolean }) {
  const venuePct = crowd.total > 0 ? Math.round((crowd.venue / crowd.total) * 100) : 0
  const onlinePct = 100 - venuePct
  const tooFew = crowd.venue < MIN_GROUP || crowd.online < MIN_GROUP

  return (
    <Section title="Venue and online" aside={ended ? 'Final' : 'Right now'}>
      <div
        className="flex h-3 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${venuePct} percent at the venue, ${onlinePct} percent online`}
      >
        <div className="h-full bg-foreground" style={{ width: `${venuePct}%` }} />
        <div className="h-full flex-1 bg-foreground/25" />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-foreground" aria-hidden />
            <MapPin className="size-3.5" aria-hidden />
            At the venue
          </dt>
          <dd className="mt-0.5 font-heading text-xl font-semibold tabular-nums">{formatCount(crowd.venue)}</dd>
          {!tooFew && <p className="text-xs text-muted-foreground tabular-nums">{venuePct}%</p>}
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-foreground/25" aria-hidden />
            <Tv className="size-3.5" aria-hidden />
            Online
          </dt>
          <dd className="mt-0.5 font-heading text-xl font-semibold tabular-nums">{formatCount(crowd.online)}</dd>
          {!tooFew && <p className="text-xs text-muted-foreground tabular-nums">{onlinePct}%</p>}
        </div>
      </dl>
      <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-sm">
        {mode === 'venue' ? (
          <>
            <MapPin className="size-4 shrink-0" aria-hidden />
            {ended ? 'You were in the building.' : "You're in the building."} Fans from {crowd.visible.length}{' '}
            {crowd.visible.length === 1 ? 'country' : 'countries'} {ended ? 'were' : 'are'} in here with you.
          </>
        ) : (
          <>
            <Tv className="size-4 shrink-0" aria-hidden />
            {ended ? 'You watched from home.' : "You're joining from home."}{' '}
            {crowd.venue >= MIN_GROUP ? `${crowd.venue.toLocaleString()} fans ${ended ? 'were' : 'are'} at the venue.` : ''}
          </>
        )}
      </p>
    </Section>
  )
}
