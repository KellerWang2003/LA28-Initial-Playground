import { EyeOff, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DELAY_PRESETS, setHideScores, setStreamOffset, useStreamDelay, useViewClock } from './delay'

const presetLabel = (s: number) => (s === 0 ? 'Live' : `${s}s`)

// "My stream is behind by Xs": delays the official updates on this tab to match the fan's own
// stream (TV, watch party, video feed), and can hide results until they are caught up.
// A finished game has nothing to delay, so only the spoiler switch is left.
export function StreamControl({ finished = false }: { finished?: boolean }) {
  const { offsetS, hideScores } = useStreamDelay()
  const view = useViewClock()
  const asOf = new Date(view).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })

  return (
    <section aria-label="Stream delay" className="rounded-2xl bg-card p-3">
      {!finished && (
        <div className="flex items-center gap-2">
          <Timer className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <h2 className="min-w-0 flex-1 text-sm font-medium">My stream is behind by</h2>
          <div role="group" aria-label="Stream delay" className="flex gap-1">
            {DELAY_PRESETS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={offsetS === s}
                onClick={() => setStreamOffset(s)}
                className={cn(
                  'h-9 min-w-11 rounded-full px-2.5 text-sm font-medium tabular-nums',
                  offsetS === s ? 'bg-foreground text-background' : 'bg-background',
                )}
              >
                {presetLabel(s)}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={hideScores}
        onClick={() => setHideScores(!hideScores)}
        className={cn('-mb-1 flex min-h-11 w-full items-center gap-3 text-left', finished ? '-mt-1' : 'mt-1.5')}
      >
        <EyeOff className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1 text-sm">{finished ? 'Hide results until I tap them' : "Hide scores until I'm caught up"}</span>
        <span
          aria-hidden
          className={cn('relative h-6 w-10 shrink-0 rounded-full transition-colors', hideScores ? 'bg-foreground' : 'bg-background')}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 size-5 rounded-full bg-background shadow transition-transform',
              hideScores && 'translate-x-4',
            )}
          />
        </span>
      </button>

      <p className="mt-1.5 text-xs text-muted-foreground">
        {finished
          ? hideScores
            ? 'Results stay hidden until you tap them.'
            : 'This game is over. Results are shown.'
          : offsetS === 0
            ? 'Showing official updates the moment they happen.'
            : `Showing the game as of ${asOf}, ${offsetS}s behind live, to match your stream.`}
        {!finished && hideScores && ' Results stay hidden until you tap them.'}
      </p>
    </section>
  )
}
