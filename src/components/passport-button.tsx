import { Link } from 'react-router'
import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFresh, useLanded } from '@/features/together/state'
import { PASSPORT_TARGET } from '@/features/together/pin-flight'

// A closed passport booklet that opens the Passport. Black and white until
// the visual design lands. A just-collected pin flies into it: it catches the pin
// with a bounce and keeps a dot until the new stamp has been seen.
export function PassportButton() {
  const landed = useLanded()
  const fresh = useFresh()
  return (
    <Link
      to={fresh.length ? `/passport?pin=${fresh[fresh.length - 1]}` : '/passport'}
      aria-label={fresh.length ? `Passport, ${fresh.length} new` : 'Passport'}
      {...{ [PASSPORT_TARGET]: '' }}
      className="group relative block h-24 w-[68px] transition-transform active:scale-95"
    >
      {/* Keyed on landings, so each catch replays the bounce */}
      <span key={landed} className={cn('absolute inset-0', landed > 0 && 'animate-passport-catch')}>
        {/* Page edges peeking out behind the cover */}
        <span className="absolute inset-0 translate-x-[3px] translate-y-[3px] rounded-r-lg rounded-l-sm border bg-muted shadow-lg" />

        <span className="absolute inset-0 overflow-hidden rounded-r-lg rounded-l-sm border bg-background shadow-md">
          {/* Spine */}
          <span className="absolute inset-y-0 left-0 w-1.5 border-r bg-muted" />
          {/* Embossed frame */}
          <span className="absolute inset-y-1.5 right-1.5 left-3 rounded-[3px] border border-foreground/25" />

          <span className="absolute inset-y-0 right-0 left-1.5 flex flex-col items-center justify-between py-3.5 text-foreground">
            <span className="text-[8px] leading-none font-bold tracking-[0.18em]">LA28</span>
            <Globe className="size-6" strokeWidth={1.25} />
            <span className="text-[7px] leading-none font-bold tracking-[0.16em]">PASSPORT</span>
          </span>
        </span>
      </span>
      {fresh.length > 0 && landed > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex size-6 animate-pin-pop items-center justify-center rounded-full border-2 border-background bg-foreground text-[11px] font-semibold text-background tabular-nums">
          {fresh.length}
        </span>
      )}
    </Link>
  )
}
