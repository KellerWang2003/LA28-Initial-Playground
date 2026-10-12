import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Control } from '@/components/debug-panel'
import { selectClass } from '@/components/debug-where'
import { formatElapsed, useClock } from '@/lib/clock'
import { alertNearby, endDay, resetDay, setTimeLeft, useBatons, useCarried } from '@/lib/batons'
import { themeById } from '@/data/batons'
import { placeById } from '@/data/la28'

// Prototype only: baton switches, in the debug panel and the flow gallery.
// Where the fan stands and the clock are the universal Where and When.
export function BatonDebugControls() {
  const batons = useBatons()
  const carried = useCarried()
  const now = useClock()
  const resting = batons.filter((b) => b.state === 'resting')
  const [alertId, setAlertId] = useState('')
  const alertBaton = resting.find((b) => b.id === alertId) ?? resting[0]

  return (
    <div className="space-y-3">
      <Control label="Nearby alert">
        <div className="flex gap-1.5">
          <select aria-label="Baton" className={selectClass} value={alertBaton?.id ?? ''} onChange={(e) => setAlertId(e.target.value)}>
            {resting.map((b) => (
              <option key={b.id} value={b.id}>
                {themeById(b.theme).name} · {placeById(b.spot).name}
              </option>
            ))}
          </select>
          <Button size="sm" variant="outline" className="shrink-0" disabled={!alertBaton} onClick={() => alertBaton && alertNearby(alertBaton)}>
            Send
          </Button>
        </div>
      </Control>

      <Control label="Carry timer" aside={carried ? `${formatElapsed(Math.max(0, Math.ceil((carried.expiresAt! - now) / 1000)))} left` : 'Not carrying'}>
        <div className="grid grid-cols-2 gap-1.5">
          <Button size="sm" variant="outline" disabled={!carried} onClick={() => setTimeLeft(5 * 60)}>
            5 min left
          </Button>
          <Button size="sm" variant="outline" disabled={!carried} onClick={() => setTimeLeft(0)}>
            Time’s up
          </Button>
        </div>
      </Control>

      <Control label="Day">
        <div className="grid grid-cols-2 gap-1.5">
          <Button size="sm" variant="outline" onClick={endDay}>
            End the day
          </Button>
          <Button size="sm" variant="outline" onClick={() => resetDay()}>
            Reset batons
          </Button>
        </div>
      </Control>
    </div>
  )
}
