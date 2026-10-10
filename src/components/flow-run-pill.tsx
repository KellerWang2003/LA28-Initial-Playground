import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Check, LayoutList, Route } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { closeBatonOverlays } from '@/lib/batons'
import { setClockSpeed } from '@/lib/clock'
import { exitFlowRun, useFlowRun, type FlowRun } from '@/lib/flow-run'
import { cn } from '@/lib/utils'

// How long "Flow complete" stays before heading back to the gallery
const RETURN_MS = 3500

// Prototype only: while a gallery flow runs, a small tab under the debug button with
// its name and shortcuts. When the flow ends it returns to the gallery.
export function FlowRunPill() {
  const run = useFlowRun()
  return run ? <Pill key={run.id} run={run} /> : null
}

function Pill({ run }: { run: FlowRun }) {
  const navigate = useNavigate()
  // Starts folded so it doesn't cover the screens under test; a dot marks shortcuts inside
  const [open, setOpen] = useState(false)

  function back() {
    exitFlowRun()
    closeBatonOverlays()
    setClockSpeed(1)
    navigate('/dev/flows')
  }

  const done = run.done
  useEffect(() => {
    if (!done) return
    const timer = window.setTimeout(back, RETURN_MS)
    return () => window.clearTimeout(timer)
    // back only reads stable module functions and navigate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])


  return (
    <div className="fixed top-[calc(33.333%+44px)] left-0 z-[55] flex items-start">
      <button
        type="button"
        aria-label={open ? 'Hide flow' : 'Show flow'}
        onClick={() => setOpen(!open)}
        className={cn(
          'relative flex size-9 items-center justify-center rounded-r-full border border-l-0 shadow-md backdrop-blur active:scale-95',
          done ? 'bg-foreground text-background' : 'bg-background/90 text-foreground',
        )}
      >
        {done ? <Check className="size-4" /> : <Route className="size-4" />}
        {!done && !open && run.actions.length > 0 && (
          <span className="absolute top-1 right-1 size-2 rounded-full bg-foreground ring-2 ring-background" />
        )}
      </button>
      {(open || done) && (
        <div className="ml-1.5 max-w-[calc(100vw-7rem)] rounded-2xl border bg-background/95 py-1.5 pr-1.5 pl-3 shadow-lg backdrop-blur">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-xs">
              <span className="font-semibold">{done ? 'Done · ' : ''}</span>
              {run.title}
            </p>
            <Button size="xs" variant={done ? 'default' : 'ghost'} onClick={back}>
              <LayoutList data-icon="inline-start" />
              {done ? 'Back' : 'Exit'}
            </Button>
          </div>
          {!done && run.actions.length > 0 && (
            <div className="mt-1 mb-0.5 flex flex-wrap gap-1.5">
              {run.actions.map((a) => (
                <Button key={a.label} size="xs" variant="outline" onClick={a.run}>
                  {a.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
