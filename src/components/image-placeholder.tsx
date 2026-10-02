import { cn } from '@/lib/utils'

// Wireframe-style image box (rectangle with an X), matching the sketches
export function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl border bg-muted', className)}>
      <svg className="absolute inset-0 size-full text-border" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden>
        <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  )
}
