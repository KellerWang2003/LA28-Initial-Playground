import { Link } from 'react-router'
import { Globe } from 'lucide-react'

// A closed passport booklet that opens the Passport. Black and white until
// the visual design lands.
export function PassportButton() {
  return (
    <Link
      to="/passport"
      aria-label="Passport"
      className="group relative block h-24 w-[68px] transition-transform active:scale-95"
    >
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
    </Link>
  )
}
