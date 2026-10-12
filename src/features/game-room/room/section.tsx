import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// The recap's crowd card: a titled rounded-2xl border block
export function Section({
  title,
  aside,
  children,
  className,
}: {
  title: string
  aside?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-2xl border p-4', className)}>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-heading font-semibold">{title}</h2>
        {aside && <span className="text-xs text-muted-foreground">{aside}</span>}
      </div>
      {children}
    </section>
  )
}
