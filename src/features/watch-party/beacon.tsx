import { useEffect } from 'react'
import { X } from 'lucide-react'
import { flag } from '@/data/la28'
import { teamCc, teamName, type WatchParty } from '@/features/watch-party/crowd'
import type { MySeat } from '@/features/watch-party/state'

// Hold it up: a full-screen card to find the group across a loud room, without
// asking around. The host and everyone checked in see the same card, so you look
// for your flag on a raised phone.
export function Beacon({ party, seat, number, onClose }: { party: WatchParty; seat: MySeat; number: number; onClose: () => void }) {
  const team = party.teams[seat.side]
  const host = party.event.host!

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal
      aria-label="Hold up your card"
      onClick={onClose}
      className="fixed inset-0 z-50 flex animate-in flex-col items-center justify-center bg-foreground px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-center text-background duration-300 fade-in"
    >
      <button type="button" aria-label="Close" onClick={onClose} className="absolute top-[calc(env(safe-area-inset-top)+12px)] right-4 flex size-12 items-center justify-center rounded-full">
        <X className="size-6" />
      </button>

      <div className="relative flex size-56 items-center justify-center">
        <span aria-hidden className="absolute inset-0 animate-baton-pulse rounded-full border-4 border-background" />
        <span aria-hidden className="absolute inset-0 animate-baton-pulse rounded-full border-4 border-background [animation-delay:1.2s]" />
        <span className="relative text-[8rem] leading-none">{flag(teamCc(team))}</span>
      </div>

      <p className="mt-8 font-heading text-5xl font-bold tracking-tight">{teamName(team)} side</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">Seat {number}</p>
      <p className="mt-8 max-w-xs text-sm text-background/70">
        Hold your phone up. {flag(host.cc)} {host.name} and everyone checked in has the same card, so look for your flag.
      </p>
      <p className="mt-6 text-xs text-background/50">Tap anywhere to close</p>
    </div>
  )
}
