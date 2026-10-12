import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Icon buttons sharing one glass capsule, like iOS toolbar groups (search + add in a
// tab header). Same glass as the floating tab bar. Put GROUP_BUTTON on each child:
// a Button, a menu trigger, a link.
export function ButtonGroup({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('inline-flex h-12 items-center rounded-full border bg-background/80 p-[3px] backdrop-blur-md', className)}
    >
      {children}
    </div>
  )
}

// Classes for a button inside a ButtonGroup: round, no frame of its own, presses in
export const GROUP_BUTTON =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-full text-foreground outline-none transition-[background-color,transform] focus-visible:ring-3 focus-visible:ring-ring/30 active:scale-90 active:bg-muted aria-expanded:bg-muted disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-5'
