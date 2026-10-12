import { EyeOff, Settings2, Timer } from 'lucide-react'
import { Sheet } from '@/components/game-sheets'
import { Button } from '@/components/ui/button'
import type { Session } from '@/data/la28'
import { StreamControl } from './standing/stream-control'
import { useStreamDelay } from './standing/delay'

// Header button for the room's settings
export function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon-lg" aria-label="Room settings" onClick={onClick}>
      <Settings2 className="size-5" />
    </Button>
  )
}

// Header chip while the room is matched to a delayed stream or hiding scores, so it is never a surprise
export function DelayChip({ onClick }: { onClick: () => void }) {
  const { offsetS, hideScores } = useStreamDelay()
  if (!offsetS && !hideScores) return null
  const Icon = offsetS ? Timer : EyeOff
  const text = [offsetS ? `${offsetS}s behind` : null, hideScores ? 'Scores hidden' : null].filter(Boolean).join(' · ')
  return (
    <button type="button" onClick={onClick} className="inline-flex h-7 items-center gap-1 rounded-full bg-muted px-2.5 text-xs font-medium tabular-nums">
      <Icon className="size-3.5" />
      {text}
    </button>
  )
}

// Match the room to the fan's own stream (TV, watch party, the video here) and hide spoilers
export function RoomSettingsSheet({ session, onClose }: { session: Session; onClose: () => void }) {
  return (
    <Sheet title="Room settings" onClose={onClose}>
      <StreamControl finished={session.status === 'finished'} />
    </Sheet>
  )
}
