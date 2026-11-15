import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { Shape } from '@/data/la28'
import { cn } from '@/lib/utils'
import { GROUPINGS, type Grouping, type Person } from './crowd'
import { CrowdPin } from './crowd-pin'
import { CrowdStage, type Picked } from './crowd-stage'

// Who's going, opened from the crowd icon: the icon grows into a bigger card that stays at the
// top of the screen, with everyone as bubbles you regroup by country, language or age
export function WhoPanel({ shape, title, people, onClose }: { shape: Shape; title: string; people: Person[]; onClose: () => void }) {
  const [by, setBy] = useState<Grouping>('country')
  const [picked, setPicked] = useState<Picked>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div aria-hidden onClick={onClose} className="absolute inset-0 z-40 animate-in bg-background/60 backdrop-blur-sm duration-200 fade-in" />
      <div
        role="dialog"
        aria-modal
        aria-label="Who’s going"
        className="absolute inset-x-3 top-[calc(env(safe-area-inset-top)+8px)] z-50 origin-top animate-in rounded-[2rem] border bg-background shadow-xl duration-300 fade-in zoom-in-90"
      >
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <CrowdPin shape={shape} people={people} className="size-10" />
          <h2 className="min-w-0 flex-1 truncate font-heading text-lg font-semibold">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="grid size-11 place-items-center rounded-full active:bg-card">
            <X className="size-6" />
          </button>
        </div>
        <div className="p-3">
          <div className="relative h-80 overflow-hidden rounded-3xl bg-card">
            <CrowdStage people={people} by={by} picked={picked} onPick={setPicked} arriving={false} />
          </div>
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {GROUPINGS.map((g) => (
              <button
                key={g.id}
                type="button"
                aria-pressed={by === g.id}
                onClick={() => {
                  setBy(g.id)
                  setPicked(null)
                }}
                className={cn('h-11 shrink-0 rounded-full px-4 text-base font-semibold active:scale-95', by === g.id ? 'bg-foreground text-background' : 'bg-card')}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
