import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Control, Segmented } from '@/components/debug-panel'
import { formatElapsed, setClockSpeed, useClock } from '@/lib/clock'
import { useDebug } from '@/lib/debug'
import { moveFan, useFanAt } from '@/lib/location'
import { alertNearby, endDay, resetDay, setTimeLeft, useBatons, useCarried } from '@/lib/batons'
import { BATON_SPOTS, themeById } from '@/data/batons'
import { placeById } from '@/data/la28'

const selectClass = 'h-9 w-full min-w-0 rounded-xl bg-muted px-2 text-xs font-medium'

// Spots by name, for the teleport list
const spotsByName = [...BATON_SPOTS].sort((a, b) => placeById(a).name.localeCompare(placeById(b).name))

// Prototype only: baton switches, in the debug panel and the flow gallery
export function BatonDebugControls() {
  const batons = useBatons()
  const carried = useCarried()
  const fan = useFanAt()
  const { speed } = useDebug()
  const now = useClock()
  const resting = batons.filter((b) => b.state === 'resting')
  const [alertId, setAlertId] = useState('')
  const alertBaton = resting.find((b) => b.id === alertId) ?? resting[0]

  return (
    <div className="space-y-3">
      <Control label="Fan location" aside={fan ? (fan.near ? 'Nearby' : 'At the spot') : 'Hotel'}>
        <div className="flex gap-1.5">
          <select
            aria-label="Teleport to"
            className={selectClass}
            value={fan?.place ?? ''}
            onChange={(e) => moveFan(e.target.value ? { place: e.target.value, near: fan?.near ?? false } : null)}
          >
            <option value="">Downtown hotel (start)</option>
            <optgroup label="Batons resting">
              {resting.map((b) => (
                <option key={b.id} value={b.spot}>
                  {placeById(b.spot).name} · {themeById(b.theme).name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Significant spots">
              {spotsByName.map((s) => (
                <option key={s} value={s}>
                  {placeById(s).name}
                </option>
              ))}
            </optgroup>
          </select>
          <div className="w-36 shrink-0">
            <Segmented
              value={fan?.near ?? false}
              options={[
                { value: false, label: 'At' },
                { value: true, label: 'Nearby' },
              ]}
              onChange={(near) => fan && moveFan({ place: fan.place, near })}
            />
          </div>
        </div>
      </Control>

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

      <Control label="Clock speed">
        <Segmented
          value={speed}
          options={[1, 10, 60].map((n) => ({ value: n, label: `${n}×` }))}
          onChange={setClockSpeed}
        />
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
