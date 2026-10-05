import { useNavigate } from 'react-router'
import { Check, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShapeIcon } from '@/components/shape-art'
import { cn } from '@/lib/utils'
import { SPORT_SHAPE, SPORTS } from '@/data/la28'
import { toggleFollowedSport, useFollowedSports } from '@/lib/followed-sports'

export default function SettingsPage() {
  const navigate = useNavigate()
  const followed = useFollowedSports()

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={() => navigate(-1)}>
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="font-heading text-lg font-semibold">Settings</h1>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-[max(env(safe-area-inset-bottom),24px)]">
        <h2 className="font-heading font-semibold">Sports you follow</h2>
        <p className="mt-1 text-sm text-muted-foreground">The Sports tab only shows these.</p>
        <ul className="mt-3 space-y-2">
          {SPORTS.map((sport) => {
            const on = followed.includes(sport)
            const shape = SPORT_SHAPE[sport]
            return (
              <li key={sport}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleFollowedSport(sport)}
                  className={cn('flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left', on && 'bg-muted')}
                >
                  {shape && <ShapeIcon shape={shape} className="size-5 shrink-0" />}
                  <span className="font-medium">{sport}</span>
                  <span
                    className={cn(
                      'ml-auto flex size-5 items-center justify-center rounded-full border',
                      on && 'border-foreground bg-foreground text-background',
                    )}
                  >
                    {on && <Check className="size-3.5" />}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
