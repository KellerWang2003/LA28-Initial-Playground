import { useState } from 'react'
import { Sheet } from '@/components/game-sheets'
import { cn } from '@/lib/utils'
import { GROUPINGS, type Grouping, type Person } from './crowd'
import { CrowdStage, type Picked } from './crowd-stage'

// The crowd in detail, from the crowd pin: everyone as bubbles you regroup by country,
// language or age
export function WhoSheet({ people, onClose }: { people: Person[]; onClose: () => void }) {
  const [by, setBy] = useState<Grouping>('country')
  const [picked, setPicked] = useState<Picked>(null)
  return (
    <Sheet title="Who’s going" onClose={onClose}>
      <div className="overflow-hidden rounded-3xl bg-card">
        <div className="relative h-80">
          <CrowdStage people={people} by={by} picked={picked} onPick={setPicked} arriving={false} />
        </div>
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
    </Sheet>
  )
}
