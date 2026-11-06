import { useState, type ReactNode } from 'react'
import { ChevronRight, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { nowMs } from '@/lib/clock'
import { pinById } from '@/data/la28'
import { TogetherFlow, type Step } from './flow'
import { PinFlight } from './pin-flight'
import { MapScene, PassportScene } from './scenes'
import { PARTNER, addCoStamp, clearCoStamp, markFresh, resetTogether, startFlight } from './state'

// Playground: collecting a pin with a stranger. A page of its own, apart from the app.
// Pick a scene to jump straight to it, or run the whole flow end to end.
const PIN = pinById('p_griffith')!

type Scene = { kind: 'menu' } | { kind: 'flow'; start: Step; key: number } | { kind: 'map' } | { kind: 'passport' }

export function Playground() {
  const [scene, setScene] = useState<Scene>({ kind: 'menu' })
  const menu = () => setScene({ kind: 'menu' })
  const flow = (start: Step) => {
    clearCoStamp(PIN.id)
    // The stamp step shows a stamp that already happened
    if (start === 'stamp') addCoStamp({ pinId: PIN.id, name: PARTNER.name, flag: PARTNER.flag, at: nowMs(), tilt: -4, photo: true })
    setScene({ kind: 'flow', start, key: Date.now() })
  }

  return (
    <>
      {scene.kind === 'menu' && (
        <Menu
          rows={[
            { title: 'Whole flow', detail: 'Find someone, hold together, one photo, the shared stamp, then the pin flies into the Passport', go: () => flow('find') },
            { title: 'Hold it together', detail: 'Press and hold: rings fill from each side, Lina slips once, the halves click', go: () => flow('hold') },
            { title: 'Photo countdown', detail: '3, 2, 1 on both phones, then the stamp lands in both Passports', go: () => flow('photo') },
            { title: 'Co-stamp and you two', detail: 'The stamp thuds into both Passports, then one-tap reactions', go: () => flow('stamp') },
            {
              title: 'Pin flies into the Passport',
              detail: 'From the middle of the map into the Passport button, which catches it',
              go: () => {
                addCoStamp({ pinId: PIN.id, name: PARTNER.name, flag: PARTNER.flag, at: nowMs(), tilt: 5, photo: true })
                startFlight(PIN.id)
                setScene({ kind: 'map' })
              },
            },
            {
              title: 'Stamp inks into the Passport',
              detail: 'The empty outline fills in a little crooked. Tap a flagged tile to replay the moment',
              go: () => {
                addCoStamp({ pinId: PIN.id, name: PARTNER.name, flag: PARTNER.flag, at: nowMs(), tilt: 5, photo: true })
                markFresh(PIN.id)
                setScene({ kind: 'passport' })
              },
            },
          ]}
        />
      )}
      {scene.kind === 'flow' && (
        <TogetherFlow
          key={scene.key}
          pin={PIN}
          start={scene.start}
          onBack={menu}
          onMap={() => {
            startFlight(PIN.id)
            setScene({ kind: 'map' })
          }}
          onPassport={() => {
            markFresh(PIN.id)
            setScene({ kind: 'passport' })
          }}
        />
      )}
      {scene.kind === 'map' && <MapScene onBack={menu} onPassport={() => setScene({ kind: 'passport' })} />}
      {scene.kind === 'passport' && <PassportScene onBack={menu} />}
      <PinFlight />
    </>
  )
}

type Row = { title: string; detail: string; go: () => void }

function Menu({ rows }: { rows: Row[] }) {
  return (
    <div className="min-h-dvh bg-background px-4 pt-[calc(env(safe-area-inset-top)+24px)] pb-[max(env(safe-area-inset-bottom),24px)]">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Playground</p>
      <h1 className="mt-1 font-heading text-2xl font-semibold">Collect together</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Collecting {PIN.name.replace(/ Pin$/, '')} with a fan you meet there (Lina {PARTNER.flag}, simulated). Separate from the app: nothing here changes your demo.
      </p>
      <ul className="mt-6 space-y-1.5">
        {rows.map((r) => (
          <Item key={r.title} onClick={r.go} title={r.title}>
            {r.detail}
          </Item>
        ))}
      </ul>
      <Button variant="outline" className="mt-4 w-full" onClick={resetTogether}>
        <RotateCcw data-icon="inline-start" />
        Reset
      </Button>
    </div>
  )
}

function Item({ title, children, onClick }: { title: string; children: ReactNode; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl bg-card px-3.5 py-3 text-left transition-transform active:scale-[0.98]">
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{title}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{children}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </button>
    </li>
  )
}
