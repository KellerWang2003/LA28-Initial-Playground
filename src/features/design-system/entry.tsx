import { Suspense, use, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { loadUsage, type Usage } from './usage'

// One component on the design page: the real component, rendered in its main states
export type Entry = {
  name: string
  // Path under src without the extension, as imports name it ('components/page-header')
  file: string
  // When to reach for it
  use: string
  demos: Demo[]
}

export type Demo = {
  label: string
  node: ReactNode
  // Takes the whole row (sheets, headers, anything phone-wide)
  full?: boolean
}

export function EntryCard({ entry }: { entry: Entry }) {
  return (
    <Card title={entry.name} file={entry.file} note={entry.use}>
      <div className="flex flex-wrap gap-3">
        {entry.demos.map((d) => (
          <figure key={d.label} className={cn('min-w-0', d.full && 'w-full')}>
            <div className="flex min-h-16 items-center justify-center rounded-2xl bg-muted/50 p-3">{d.node}</div>
            <figcaption className="mt-1 px-0.5 text-xs text-muted-foreground">{d.label}</figcaption>
          </figure>
        ))}
      </div>
    </Card>
  )
}

// The frame every block on the page sits in. With `file`, it shows where it's used.
export function Card({ title, file, note, children }: { title: string; file?: string; note?: string; children: ReactNode }) {
  return (
    <article className="rounded-3xl border p-4">
      <div className="flex items-baseline gap-2">
        <h3 className="font-heading font-semibold">{title}</h3>
        {file && <p className="min-w-0 truncate font-mono text-xs text-muted-foreground">{file}</p>}
      </div>
      {note && <p className="mt-0.5 text-sm text-muted-foreground">{note}</p>}
      {file && <UsedIn file={file} />}
      <div className="mt-3">{children}</div>
    </article>
  )
}

function UsedIn({ file }: { file: string }) {
  return (
    <Suspense fallback={<p className="mt-2 text-xs text-muted-foreground">Counting uses…</p>}>
      <UsedInList file={file} />
    </Suspense>
  )
}

function UsedInList({ file }: { file: string }) {
  const importers = use(loadUsage()).importers(file)
  const [open, setOpen] = useState(false)

  if (!importers.length) return <p className="mt-2 text-xs font-medium text-muted-foreground">Not used anywhere yet</p>
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center gap-1 text-xs font-medium"
      >
        Used in {importers.length} {importers.length === 1 ? 'file' : 'files'}
        <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <ul className="mt-1.5 space-y-0.5">
          {importers.map((f) => (
            <li key={f} className="truncate font-mono text-xs text-muted-foreground">
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// A count read from the source ("270×"), for foundations like type sizes and radius
export function Count({ of }: { of: (usage: Usage) => number }) {
  return (
    <Suspense fallback={<span className="text-xs text-muted-foreground">…</span>}>
      <CountValue of={of} />
    </Suspense>
  )
}

function CountValue({ of }: { of: (usage: Usage) => number }) {
  const n = of(use(loadUsage()))
  return <span className="text-xs text-muted-foreground tabular-nums">{n}×</span>
}

// Every class matching `pattern` with its count; for spotting values off the scale
export function Matches({ pattern, empty }: { pattern: RegExp; empty: string }) {
  return (
    <Suspense fallback={<p className="text-xs text-muted-foreground">Scanning…</p>}>
      <MatchList pattern={pattern} empty={empty} />
    </Suspense>
  )
}

function MatchList({ pattern, empty }: { pattern: RegExp; empty: string }) {
  const found = use(loadUsage()).classesMatching(pattern)
  if (!found.length) return <p className="text-xs text-muted-foreground">{empty}</p>
  return (
    <ul className="flex flex-wrap gap-1.5">
      {found.map(([cls, n]) => (
        <li key={cls} className="rounded-full border px-2 py-0.5 font-mono text-xs">
          {cls} <span className="text-muted-foreground">{n}×</span>
        </li>
      ))}
    </ul>
  )
}
