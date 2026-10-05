import { Fragment, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { CountryMedals } from '@/data/mock'

type RankBy = 'gold' | 'total'

const total = (c: { gold: number; silver: number; bronze: number }) => c.gold + c.silver + c.bronze

// IOC method: golds, then silvers, then bronzes. "Total" (common with US
// broadcasters) ranks by total medals, then the same order.
function sortKey(c: CountryMedals, by: RankBy) {
  return by === 'gold' ? [c.gold, c.silver, c.bronze] : [total(c), c.gold, c.silver, c.bronze]
}

// Rank only counts the medals that decide the order; teams level on those share
// a rank (shown "=7") and are listed alphabetically by country code.
function rankTable(rows: CountryMedals[], by: RankBy) {
  const deciding = (c: CountryMedals) => (by === 'gold' ? sortKey(c, by) : [total(c)]).join(',')
  const sorted = [...rows].sort((a, b) => {
    const ka = sortKey(a, by)
    const kb = sortKey(b, by)
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return kb[i] - ka[i]
    return a.code.localeCompare(b.code)
  })
  return sorted.map((c) => {
    const rank = sorted.findIndex((o) => deciding(o) === deciding(c)) + 1
    const shared = sorted.filter((o) => deciding(o) === deciding(c)).length > 1
    return { ...c, rank, shared }
  })
}

// Medal colors are functional, like pin status colors
const medalDot = {
  gold: 'bg-[#d4af37]',
  silver: 'bg-[#b8b8bd]',
  bronze: 'bg-[#c27c3e]',
}

function MedalHeader({ medal, label }: { medal: keyof typeof medalDot; label: string }) {
  return (
    <th className="w-9 py-2 text-center font-normal" aria-label={label}>
      <span className={cn('inline-block size-3 rounded-full', medalDot[medal])} />
    </th>
  )
}

const PREVIEW = 3

export function MedalTable({ rows, subtitle }: { rows: CountryMedals[]; subtitle: string }) {
  const [rankBy, setRankBy] = useState<RankBy>('gold')
  const [expanded, setExpanded] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const ranked = rankTable(rows, rankBy)
  const preview = ranked.slice(0, PREVIEW)

  return (
    <section className="overflow-hidden rounded-2xl border">
      <div className="flex items-center gap-2 p-4">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="min-w-0">
            <span className="block font-heading font-semibold">Medal table</span>
            <span className="block text-xs text-muted-foreground">{subtitle}</span>
          </span>
        </button>
        {expanded && (
          <Tabs value={rankBy} onValueChange={(v) => setRankBy(v as RankBy)}>
            <TabsList>
              <TabsTrigger value="gold">Gold</TabsTrigger>
              <TabsTrigger value="total">Total</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? 'Collapse medal table' : 'Expand medal table'}
          className="shrink-0 text-muted-foreground"
        >
          <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>

      {!expanded && (
        <>
          <ol>
            {preview.map((c) => (
              <li key={c.code} className="flex items-center gap-2 border-t px-4 py-2 text-sm tabular-nums">
                <span className="w-6 text-muted-foreground">
                  {c.shared && '='}
                  {c.rank}
                </span>
                <span className="text-base leading-none">{c.flag}</span>
                <span className="font-medium">{c.code}</span>
                <span className="truncate text-xs text-muted-foreground">{c.name}</span>
                <span className="ml-auto flex items-center gap-1.5">
                  <span className={cn('size-2.5 rounded-full', rankBy === 'total' ? 'bg-foreground' : medalDot.gold)} />
                  {rankBy === 'total' ? total(c) : c.gold}
                </span>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="w-full border-t px-4 py-2.5 text-center text-xs text-muted-foreground"
          >
            Show all {ranked.length} teams
          </button>
        </>
      )}

      {expanded && (
      <>
      <table className="w-full border-t text-sm tabular-nums">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th className="w-10 py-2 pl-4 text-left font-normal">#</th>
            <th className="py-2 text-left font-normal">Team</th>
            <MedalHeader medal="gold" label="Gold" />
            <MedalHeader medal="silver" label="Silver" />
            <MedalHeader medal="bronze" label="Bronze" />
            <th className="w-12 py-2 pr-4 text-right font-normal">Total</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((c) => {
            const rowOpen = open === c.code
            return (
              <Fragment key={c.code}>
                <tr
                  onClick={() => setOpen(rowOpen ? null : c.code)}
                  aria-expanded={rowOpen}
                  className={cn('cursor-pointer border-t', rowOpen && 'bg-muted/60')}
                >
                  <td className="py-2.5 pl-4 text-muted-foreground">
                    {c.shared && '='}
                    {c.rank}
                  </td>
                  <td className="py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="text-base leading-none">{c.flag}</span>
                      <span className="font-medium">{c.code}</span>
                      <span className="truncate text-xs text-muted-foreground">{c.name}</span>
                      <ChevronDown className={cn('ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform', rowOpen && 'rotate-180')} />
                    </span>
                  </td>
                  <td className={cn('text-center', rankBy === 'gold' && 'font-semibold')}>{c.gold}</td>
                  <td className="text-center">{c.silver}</td>
                  <td className="text-center">{c.bronze}</td>
                  <td className={cn('pr-4 text-right', rankBy === 'total' && 'font-semibold')}>{total(c)}</td>
                </tr>
                {rowOpen &&
                  c.bySport.map((s) => (
                    <tr key={s.sport} className="bg-muted/60 text-xs text-muted-foreground">
                      <td />
                      <td className="py-1.5">{s.sport}</td>
                      <td className="text-center">{s.gold}</td>
                      <td className="text-center">{s.silver}</td>
                      <td className="text-center">{s.bronze}</td>
                      <td className="pr-4 text-right">{total(s)}</td>
                    </tr>
                  ))}
              </Fragment>
            )
          })}
        </tbody>
      </table>

      <p className="border-t px-4 py-3 text-xs text-muted-foreground">
        {rankBy === 'gold'
          ? 'Ranked by golds, then silvers, then bronzes (IOC method). Tied teams share a rank.'
          : 'Ranked by total medals. Tied teams share a rank.'}{' '}
        Tap a team for medals by sport.
      </p>
      </>
      )}
    </section>
  )
}
