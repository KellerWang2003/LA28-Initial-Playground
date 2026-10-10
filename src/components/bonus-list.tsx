import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Check, ChevronRight, Flame, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { bonusIcon, bonusPath, useBonusState, useBonusStateLabel } from '@/lib/bonuses'
import { cn } from '@/lib/utils'
import { BONUS_REWARD, bonusTitle, bonusType, type Bonus } from '@/data/bonuses'

export function BonusTypeBadge({ bonus, className }: { bonus: Bonus; className?: string }) {
  return (
    <Badge variant="outline" className={cn('bg-background', className)}>
      {bonusType(bonus) === 'solo' ? 'Solo' : 'Together'}
    </Badge>
  )
}

export function BonusList({ bonuses, replace }: { bonuses: Bonus[]; replace?: boolean }) {
  return (
    <ul className="space-y-2">
      {bonuses.map((b) => (
        <BonusRow key={b.id} bonus={b} replace={replace} />
      ))}
    </ul>
  )
}

// One bonus: what it is, what to do, and whether it can be played now.
// Ready rows open the challenge; the rest say what they're waiting on.
function BonusRow({ bonus, replace }: { bonus: Bonus; replace?: boolean }) {
  const state = useBonusState(bonus)
  const label = useBonusStateLabel(state)
  const Icon = bonusIcon[bonus.kind]
  const done = state.status === 'done'
  const ready = state.status === 'ready'
  const now = state.status === 'with-collect'
  const waiting = !done && !ready && !now

  const body = (
    <>
      <span
        className={cn(
          'relative flex size-10 shrink-0 items-center justify-center rounded-full',
          done ? 'bg-foreground text-background' : 'border bg-background',
        )}
      >
        {done ? <Check className="size-4" /> : <Icon className="size-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{bonusTitle(bonus)}</span>
          <BonusTypeBadge bonus={bonus} />
        </span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{bonus.detail}</span>
        <span className={cn('mt-1 flex items-center gap-1 text-xs tabular-nums', done || ready || now ? 'font-medium' : 'text-muted-foreground')}>
          {waiting && <Lock className="size-3" />}
          {label}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-2 self-stretch">
        <span className={cn('flex items-center gap-0.5 text-sm font-semibold tabular-nums', done && 'text-muted-foreground')}>
          <Flame className="size-3.5 fill-current" />+{BONUS_REWARD[bonusType(bonus)]}
        </span>
        {ready && <ChevronRight className="mt-auto size-5 text-muted-foreground" />}
      </span>
    </>
  )

  const className = 'flex w-full items-start gap-3 rounded-2xl border p-3 text-left'
  return (
    <li>
      {ready ? (
        <Link to={bonusPath(bonus)} replace={replace} className={cn(className, 'transition-transform active:scale-[0.98]')}>
          {body}
        </Link>
      ) : (
        <div className={cn(className, waiting && 'bg-muted/40')}>{body}</div>
      )}
    </li>
  )
}

// The marks on a stamp, as small chips
export function MarkRow({ marks, className }: { marks: ReactNode[]; className?: string }) {
  if (!marks.length) return null
  return (
    <ul className={cn('flex flex-wrap justify-center gap-1.5', className)}>
      {marks.map((m, i) => (
        <li key={i} className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium">
          <Check className="size-3" />
          {m}
        </li>
      ))}
    </ul>
  )
}
