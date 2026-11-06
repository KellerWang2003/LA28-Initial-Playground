import { useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProfile } from '@/lib/profile'
import { flag, type Pin } from '@/data/la28'
import { CoStampArt, SplitPin } from './co-stamp-art'
import { buzz, stampDate, type CoStamp } from './state'

type Phase = 'rest' | 'apart' | 'join' | 'stamp'

// A pin collected with someone, on its Passport sheet: the stamp, who it was with and what you
// sent each other. Replay runs the moment again: the halves slide together, then the stamp thuds.
export function CoStampMemory({ pin, stamp }: { pin: Pin; stamp: CoStamp }) {
  const profile = useProfile()
  const [phase, setPhase] = useState<Phase>('rest')
  const [take, setTake] = useState(0)

  useEffect(() => {
    if (phase === 'rest') return
    const next: Record<Exclude<Phase, 'rest'>, [Phase, number]> = { apart: ['join', 40], join: ['stamp', 900], stamp: ['rest', 700] }
    const [to, after] = next[phase]
    // The stamp hits as it lands
    if (phase === 'stamp') window.setTimeout(() => buzz(40), 400)
    const t = window.setTimeout(() => setPhase(to), after)
    return () => window.clearTimeout(t)
  }, [phase])

  const when = new Date(stamp.at)
  const day = when.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = when.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-card p-4">
      <span className="flex size-24 shrink-0 items-center justify-center">
        {phase === 'apart' || phase === 'join' ? (
          <SplitPin shape={pin.shape} left={phase === 'join' ? 1 : 0} right={phase === 'join' ? 1 : 0} smooth snap={false} className="size-16" />
        ) : (
          <CoStampArt
            key={take}
            shape={pin.shape}
            flags={[flag(profile.country), stamp.flag]}
            date={stampDate(stamp.at)}
            tilt={stamp.tilt}
            thud={phase === 'stamp'}
            className="size-24"
          />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          With {stamp.name} {stamp.flag}
        </p>
        <p className="text-xs text-muted-foreground">
          {day} · {time}
        </p>
        {(stamp.sent || stamp.got) && (
          <p className="mt-1 text-xs text-muted-foreground">
            {stamp.sent && <>You sent {stamp.sent}</>}
            {stamp.sent && stamp.got && ' · '}
            {stamp.got && (
              <>
                {stamp.name} sent {stamp.got}
              </>
            )}
          </p>
        )}
        <Button
          size="sm"
          variant="outline"
          className="mt-2 bg-background"
          disabled={phase !== 'rest'}
          onClick={() => {
            setTake((t) => t + 1)
            setPhase('apart')
          }}
        >
          <RotateCcw data-icon="inline-start" />
          Replay the moment
        </Button>
      </div>
    </div>
  )
}
