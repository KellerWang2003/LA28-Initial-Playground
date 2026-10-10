import { useNavigate } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { BatonGlyph } from '@/components/baton-art'
import { nowMs, setClockSpeed } from '@/lib/clock'
import { setCollected } from '@/lib/collected'
import { setDebug } from '@/lib/debug'
import { moveFan } from '@/lib/location'
import { clearToasts } from '@/lib/toasts'
import { startFlowRun, type FlowAction } from '@/lib/flow-run'
import {
  acceptBaton,
  dropBaton,
  dropNothing,
  finishDrop,
  openBatonCard,
  endDay,
  ensureDay,
  quietAlerts,
  stageBaton,
  stageCarriedEarlier,
  stageCarry,
  type BatonEvent,
} from '@/lib/batons'

// Prototype only: the Baton group in the flow gallery. Each entry sets up the
// state its flow needs, opens the real first screen, and the flow pill takes
// it back to the gallery once the flow's last step happens.

type BatonFlow = {
  title: string
  detail: string
  endsOn: BatonEvent[]
  // Sets the state up; returns where to start and any shortcuts
  setup: () => { to: string; actions?: FlowAction[] }
}

const walk = (place: string, label: string): FlowAction => ({ label, run: () => moveFan({ place, near: false }) })

const FLOWS: BatonFlow[] = [
  {
    title: 'Found by notification',
    detail: 'Near Union Station → alert → card → walk there → Accept',
    endsOn: ['accepted'],
    setup: () => {
      const id = stageBaton('swimming', 'union')
      quietAlerts(id)
      moveFan({ place: 'union', near: true })
      return { to: '/explore', actions: [walk('union', 'Walk to Union Station')] }
    },
  },
  {
    title: 'Found at a pin',
    detail: 'Collect the Union Station pin → baton offer → card → Accept',
    endsOn: ['accepted'],
    setup: () => {
      stageBaton('athletics', 'union')
      quietAlerts()
      setCollected('p_union', false)
      setDebug({ inRadius: true })
      moveFan({ place: 'union', near: false })
      return { to: '/explore/pins/p_union' }
    },
  },
  {
    title: 'Accept, carry and drop',
    detail: 'Concert Hall → Accept → carry bar → Grand Park → note → stamp → Passport',
    endsOn: ['dropFinished'],
    setup: () => {
      const id = stageBaton('basketball', 'concerthall')
      quietAlerts()
      moveFan({ place: 'concerthall', near: false })
      return { to: `/explore?baton=${id}`, actions: [walk('grandpark', 'Walk to Grand Park')] }
    },
  },
  {
    title: 'Right after a drop',
    detail: 'Just left the basketball baton at Grand Park → it’s off limits → take the track baton nearby',
    endsOn: ['accepted'],
    setup: () => {
      // Carry the basketball baton from the Concert Hall and leave it at Grand Park
      const dropped = stageBaton('basketball', 'concerthall')
      moveFan({ place: 'concerthall', near: false })
      acceptBaton(dropped)
      moveFan({ place: 'grandpark', near: false })
      dropBaton('Left it by the fountain', false)
      finishDrop()
      // A different baton a short walk away (in claim range)
      const next = stageBaton('athletics', 'angelsflight')
      quietAlerts()
      return {
        to: `/explore?baton=${dropped}`,
        actions: [{ label: 'Open the track baton', run: () => openBatonCard(next) }],
      }
    },
  },
  {
    title: 'Pass',
    detail: 'Angels Flight → Pass → it stays on the map, no more alerts today',
    endsOn: ['passed'],
    setup: () => {
      const id = stageBaton('gymnastics', 'angelsflight')
      quietAlerts()
      moveFan({ place: 'angelsflight', near: false })
      return { to: `/explore?baton=${id}` }
    },
  },
  {
    title: 'Already carrying',
    detail: 'Carrying the track baton, standing at another one → Accept is off',
    endsOn: ['cardClosed', 'passed'],
    setup: () => {
      stageCarry('athletics', 'coliseum', 40 * 60)
      const id = stageBaton('swimming', 'gcm')
      quietAlerts()
      moveFan({ place: 'gcm', near: false })
      return { to: `/explore?baton=${id}` }
    },
  },
  {
    title: 'Reminders and timeout',
    detail: '6 min left at 10× → 5-min reminder → 0:00 → back at SoFi Stadium',
    endsOn: ['timedOut'],
    setup: () => {
      stageCarry('swimming', 'sofi', 6 * 60)
      quietAlerts()
      moveFan(null)
      setClockSpeed(10)
      return { to: '/explore' }
    },
  },
  {
    title: 'End-of-day recap',
    detail: 'You carried a baton today → recap alert → playback → saved → reset',
    endsOn: ['recapClosed'],
    setup: () => {
      stageCarriedEarlier('swimming', 'smpier', 'venice', 'Carried it along the beach. Say hi to the pier for me!')
      quietAlerts()
      moveFan(null)
      endDay()
      return { to: '/explore' }
    },
  },
]

export function BatonFlowsSection() {
  const navigate = useNavigate()

  function go(flow: BatonFlow) {
    // Same starting point every time: today's clock at normal speed, empty hands
    clearToasts()
    setDebug({ time: null })
    setClockSpeed(1)
    ensureDay(nowMs())
    dropNothing()
    const { to, actions = [] } = flow.setup()
    startFlowRun({ title: flow.title, endsOn: flow.endsOn, actions })
    navigate(to)
  }

  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 font-heading font-semibold">
        <BatonGlyph className="size-5 bg-transparent [&>span]:h-4 [&>span]:w-2" />
        Baton
      </h2>
      <ul className="space-y-1.5">
        {FLOWS.map((f) => (
          <li key={f.title}>
            <button
              type="button"
              onClick={() => go(f)}
              className="flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-transform active:scale-[0.98]"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{f.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{f.detail}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
