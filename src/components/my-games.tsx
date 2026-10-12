import { useState } from 'react'
import { Bookmark, Check, Plus } from 'lucide-react'
import { GameModeSheet } from '@/components/game-sheets'
import { SaveSheet } from '@/components/save-sheet'
import type { Session } from '@/data/la28'
import { gameFor, useMyGames } from '@/lib/my-games'
import { isSaved, useSaved } from '@/lib/saved'
import { cn } from '@/lib/utils'

// The one button on a session row: going (at the venue or online), or just interested
// (save it to a list). Icon only, at a full 44pt touch target; the sheet it opens says the rest.
// Check: going. Bookmark: saved only. Plus: neither.
export function GoingButton({ session }: { session: Session }) {
  const current = gameFor(useMyGames(), session.id)
  const saved = isSaved(useSaved(), { kind: 'game', id: session.id })
  const [sheet, setSheet] = useState<'mode' | 'save' | null>(null)
  if (session.status === 'finished') return null

  return (
    <>
      <button
        type="button"
        aria-pressed={!!current}
        aria-label={
          current
            ? `Going, ${current.mode === 'venue' ? 'at the venue' : 'online'}. Change`
            : saved
              ? 'Saved. Change'
              : 'Add this game'
        }
        onClick={() => setSheet('mode')}
        className={cn(
          'inline-flex size-11 shrink-0 items-center justify-center rounded-full border transition-transform active:scale-90',
          current ? 'border-foreground bg-foreground text-background' : 'bg-background text-foreground',
        )}
      >
        {current ? <Check className="size-5" /> : saved ? <Bookmark className="size-5 fill-current" /> : <Plus className="size-5" />}
      </button>
      {sheet === 'mode' && <GameModeSheet session={session} onClose={() => setSheet(null)} onSave={() => setSheet('save')} />}
      {sheet === 'save' && <SaveSheet item={{ kind: 'game', id: session.id }} onClose={() => setSheet(null)} />}
    </>
  )
}
