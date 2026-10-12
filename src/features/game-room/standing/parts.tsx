import type { ReactNode } from 'react'
import { Eye } from 'lucide-react'
import { ShapeIcon } from '@/components/shape-art'
import { SPORT_SHAPE, type Session } from '@/data/la28'
import { cn } from '@/lib/utils'
import { revealResult, useResultGate } from './delay'
import type { Phase } from './status'

// Small pieces shared by the Standing cards

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <h2 className="font-heading font-semibold">{children}</h2>
      {aside}
    </div>
  )
}

type Tone = 'live' | 'next' | 'done' | 'quiet'

const TONE: Record<Tone, string> = {
  live: 'bg-red-500/10 text-red-600',
  next: 'bg-foreground text-background',
  done: 'bg-muted text-muted-foreground',
  quiet: 'border text-muted-foreground',
}

export function Chip({ tone, children, pulse }: { tone: Tone; children: ReactNode; pulse?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-xs leading-none font-semibold tabular-nums',
        TONE[tone],
      )}
    >
      {pulse && <span className="size-1.5 animate-pulse rounded-full bg-current" />}
      {children}
    </span>
  )
}

/**
 * Shows `children` once the official update (at `eventMs`) has reached the fan's stream.
 * With spoiler hiding on, it shows a tap-to-reveal button instead. `pending` is what to show
 * until then (nothing by default).
 */
export function ResultGate({
  id,
  eventMs,
  children,
  pending = null,
  label = 'Result hidden. Tap to reveal',
  className,
}: {
  id: string
  eventMs: number
  children: ReactNode
  pending?: ReactNode
  label?: string
  className?: string
}) {
  const gate = useResultGate(id, eventMs)
  if (gate === 'pending') return <>{pending}</>
  if (gate === 'shown') return <>{children}</>
  return (
    <button
      type="button"
      onClick={() => revealResult(id)}
      className={cn(
        'inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-dashed px-3 text-sm font-medium text-muted-foreground',
        className,
      )}
    >
      <Eye className="size-4" aria-hidden />
      {label}
    </button>
  )
}

const TITLE: Record<Phase, string> = { live: 'Live now', finished: 'Final result', upcoming: 'Up next' }

export function Shell({ phase, chip, session, children }: { phase: Phase; chip?: ReactNode; session: Session; children: ReactNode }) {
  const shape = SPORT_SHAPE[session.sport]
  return (
    <section aria-label={TITLE[phase]} className="rounded-2xl border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-2 font-heading font-semibold">
          {shape && <ShapeIcon shape={shape} className="size-4 shrink-0 text-muted-foreground" />}
          <span className="truncate">{TITLE[phase]}</span>
        </h2>
        {chip}
      </div>
      {children}
    </section>
  )
}

