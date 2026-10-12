import type { NoteParts } from '@/lib/batons'
import { cn } from '@/lib/utils'

// A carrier's note: some text, one photo, or both. Shown only to whoever
// claimed the baton (and the writer); the card before that just says it's there.
export function NoteBody({ note, photo, size = 'md', className }: NoteParts & { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {photo && (
        <img
          src={photo}
          alt=""
          className={cn('w-full rounded-xl object-cover', size === 'sm' ? 'aspect-[4/3] max-w-40' : 'aspect-[4/3]')}
        />
      )}
      {note && (
        <blockquote className={cn(size === 'lg' ? 'font-heading text-lg leading-snug' : 'text-sm')}>“{note}”</blockquote>
      )}
    </div>
  )
}
