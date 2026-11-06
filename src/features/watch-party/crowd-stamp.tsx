import { ShapeSticker } from '@/components/shape-art'
import { flag, pinById } from '@/data/la28'
import { cn } from '@/lib/utils'
import { crowdFlags, watchPartyForPin, type WatchParty } from '@/features/watch-party/crowd'

// The watch party's stamp: its pin ringed by the flags of everyone who was
// there when you checked in. A souvenir of who you watched with.

export function CrowdStamp({ party, className, animate }: { party: WatchParty; className?: string; animate?: boolean }) {
  const pin = party.event.pin ? pinById(party.event.pin) : undefined
  const flags = crowdFlags(party)
  return (
    <div className={cn('relative aspect-square w-40', animate && 'animate-stamp-in', className)}>
      <div className="absolute inset-[18%] flex items-center justify-center rounded-full border-2 border-dashed border-foreground bg-background">
        {pin && <ShapeSticker shape={pin.shape} className="size-3/5 text-foreground" />}
      </div>
      {flags.map((cc, i) => {
        const angle = (i / flags.length) * Math.PI * 2 - Math.PI / 2
        return (
          <span
            key={i}
            aria-hidden
            className="absolute text-lg leading-none"
            style={{ left: `${50 + Math.cos(angle) * 42}%`, top: `${50 + Math.sin(angle) * 42}%`, transform: 'translate(-50%, -50%)' }}
          >
            {flag(cc)}
          </span>
        )
      })}
    </div>
  )
}

// For the Passport's pin sheet: the stamp, if this pin came from a watch party
export function CrowdStampForPin({ pinId }: { pinId: string }) {
  const party = watchPartyForPin(pinId)
  if (!party) return null
  const countries = new Set(crowdFlags(party)).size
  return (
    <div className="mb-5 flex items-center gap-4 rounded-2xl bg-card p-3">
      <CrowdStamp party={party} className="w-24 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-semibold">Watched with fans from {countries} countries</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{party.event.title}</p>
      </div>
    </div>
  )
}
