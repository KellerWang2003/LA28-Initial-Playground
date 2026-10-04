import { formatElapsed, useElapsed } from '@/lib/clock'
import { cn } from '@/lib/utils'

// "● LIVE 50:12": how long a session has been going
export function LiveTimer({ since, className }: { since: string; className?: string }) {
  const elapsed = useElapsed(since)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border bg-background px-1.5 py-0.5 text-[10px] leading-none font-semibold tabular-nums shadow-sm',
        className,
      )}
    >
      <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
      LIVE {formatElapsed(elapsed)}
    </span>
  )
}
