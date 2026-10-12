import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EntryCard } from '@/features/design-system/entry'
import { Foundations } from '@/features/design-system/foundations'
import { BLOCKS, PRIMITIVES } from '@/features/design-system/registry'

// Internal page: the design system. Foundations, then every shared component rendered
// for real, with where it's used. It keeps components reused across the app instead
// of rebuilt per screen.

const SECTIONS = [
  { id: 'foundations', title: 'Foundations' },
  { id: 'primitives', title: 'Primitives' },
  { id: 'blocks', title: 'Building blocks' },
]

export default function DevDesignPage() {
  const navigate = useNavigate()

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="shrink-0">
        <div className="flex h-14 items-center gap-2 px-2">
          <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={() => navigate(-1)}>
            <ChevronLeft className="size-5" />
          </Button>
          <h1 className="font-heading text-lg font-semibold">Design system</h1>
          <span className="text-xs text-muted-foreground">Prototype only</span>
        </div>
        <nav className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-3">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })}
              className="shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium active:bg-muted"
            >
              {s.title}
            </button>
          ))}
        </nav>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 space-y-7 overflow-y-auto overscroll-contain border-t px-4 pt-4 pb-[max(env(safe-area-inset-bottom),24px)]">
        <Section id="foundations" title="Foundations" note="Counts are read from the app's source each time this page opens.">
          <Foundations />
        </Section>

        <Section id="primitives" title="Primitives" note="shadcn components in components/ui. Add more with the shadcn CLI.">
          {PRIMITIVES.map((e) => (
            <EntryCard key={e.file} entry={e} />
          ))}
        </Section>

        <Section id="blocks" title="Building blocks" note="App components shared across screens.">
          {BLOCKS.map((e) => (
            <EntryCard key={e.file} entry={e} />
          ))}
        </Section>
      </div>
    </div>
  )
}

function Section({ id, title, note, children }: { id: string; title: string; note: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4">
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      <p className="mt-0.5 mb-3 text-sm text-muted-foreground">{note}</p>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
