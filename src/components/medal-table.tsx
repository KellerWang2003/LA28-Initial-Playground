import { Fragment, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CountryMedals } from '@/data/mock'

type RankBy = 'gold' | 'silver' | 'bronze' | 'total'

const total = (c: { gold: number; silver: number; bronze: number }) => c.gold + c.silver + c.bronze

// Gold is the IOC order. Silver and bronze sort by that column, then the other
// medals. Total ranks by the sum, then the same IOC order.
function sortKey(c: CountryMedals, by: RankBy) {
  if (by === 'gold') return [c.gold, c.silver, c.bronze]
  if (by === 'silver') return [c.silver, c.gold, c.bronze]
  if (by === 'bronze') return [c.bronze, c.gold, c.silver]
  return [total(c), c.gold, c.silver, c.bronze]
}

// The rank number uses the medals that define a tie. Gold needs the full IOC
// key. The other columns tie on that column alone, then break the tie for order.
function deciding(c: CountryMedals, by: RankBy) {
  if (by === 'gold') return [c.gold, c.silver, c.bronze].join(',')
  if (by === 'silver') return String(c.silver)
  if (by === 'bronze') return String(c.bronze)
  return String(total(c))
}

function rankTable(rows: CountryMedals[], by: RankBy) {
  const sorted = [...rows].sort((a, b) => {
    const ka = sortKey(a, by)
    const kb = sortKey(b, by)
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return kb[i] - ka[i]
    return a.code.localeCompare(b.code)
  })
  return sorted.map((c) => {
    const key = deciding(c, by)
    const rank = sorted.findIndex((o) => deciding(o, by) === key) + 1
    const shared = sorted.filter((o) => deciding(o, by) === key).length > 1
    return { ...c, rank, shared }
  })
}

// Medal colors are functional, like pin status colors
export const medalDot = {
  gold: 'bg-[#d4af37]',
  silver: 'bg-[#b8b8bd]',
  bronze: 'bg-[#c27c3e]',
} as const

const rankNote: Record<RankBy, string> = {
  gold: 'Ranked by golds, then silvers, then bronzes (IOC method). Tied teams share a rank.',
  silver: 'Ranked by silvers, then golds, then bronzes. Tied teams share a rank.',
  bronze: 'Ranked by bronzes, then golds, then silvers. Tied teams share a rank.',
  total: 'Ranked by total medals, then golds, silvers, and bronzes. Tied teams share a rank.',
}

function LegendButton({
  active,
  label,
  onClick,
  children,
  className,
}: {
  active: boolean
  label: string
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`Sort by ${label}`}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 items-center justify-center rounded-full text-muted-foreground',
        active && 'bg-foreground font-medium text-background',
        className,
      )}
    >
      {children}
    </button>
  )
}

const PREVIEW = 5

// `drilldown` turns off the per-sport rows, for tables that are already about one sport
export function MedalTable({
  rows,
  subtitle,
  title = 'Medal table',
  drilldown = true,
}: {
  rows: CountryMedals[]
  subtitle: string
  title?: string
  drilldown?: boolean
}) {
  const [rankBy, setRankBy] = useState<RankBy>('gold')
  const [expanded, setExpanded] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const ranked = rankTable(rows, rankBy)
  const shown = expanded ? ranked : ranked.slice(0, PREVIEW)

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
            <span className="block font-heading font-semibold">{title}</span>
            <span className="block text-xs text-muted-foreground">{subtitle}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? `Collapse ${title.toLowerCase()}` : `Expand ${title.toLowerCase()}`}
          className="shrink-0 text-muted-foreground"
        >
          <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>

      <table className="w-full table-fixed border-t text-sm tabular-nums">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th className="w-10 py-2 pl-4 text-left font-normal">#</th>
            <th className="py-2 text-left font-normal">Team</th>
            {(['gold', 'silver', 'bronze'] as const).map((medal) => (
              <th key={medal} className="w-9 py-2 text-center font-normal">
                <LegendButton
                  active={rankBy === medal}
                  label={medal}
                  onClick={() => setRankBy(medal)}
                  className="size-7"
                >
                  <span className={cn('size-3 rounded-full', medalDot[medal], rankBy === medal && 'ring-2 ring-background')} />
                </LegendButton>
              </th>
            ))}
            <th className="w-14 py-2 pr-3 text-center font-normal">
              <LegendButton
                active={rankBy === 'total'}
                label="total"
                onClick={() => setRankBy('total')}
                className="px-2 text-xs"
              >
                Total
              </LegendButton>
            </th>
          </tr>
        </thead>
        <tbody>
          {shown.map((c) => {
            const rowOpen = expanded && drilldown && open === c.code
            return (
              <Fragment key={c.code}>
                <tr
                  onClick={expanded && drilldown ? () => setOpen(rowOpen ? null : c.code) : undefined}
                  aria-expanded={expanded && drilldown ? rowOpen : undefined}
                  className={cn('border-t', expanded && drilldown && 'cursor-pointer', rowOpen && 'bg-muted/60')}
                >
                  <td className="py-2.5 pl-4 text-muted-foreground">
                    {c.shared && '='}
                    {c.rank}
                  </td>
                  <td className="max-w-0 py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="text-base leading-none">{c.flag}</span>
                      <span className="font-medium">{c.code}</span>
                      <span className="truncate text-xs text-muted-foreground">{c.name}</span>
                      {expanded && drilldown && (
                        <ChevronDown
                          className={cn(
                            'ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform',
                            rowOpen && 'rotate-180',
                          )}
                        />
                      )}
                    </span>
                  </td>
                  <td className={cn('text-center', rankBy === 'gold' && 'font-semibold')}>{c.gold}</td>
                  <td className={cn('text-center', rankBy === 'silver' && 'font-semibold')}>{c.silver}</td>
                  <td className={cn('text-center', rankBy === 'bronze' && 'font-semibold')}>{c.bronze}</td>
                  <td className={cn('pr-3 text-center', rankBy === 'total' && 'font-semibold')}>{total(c)}</td>
                </tr>
                {rowOpen &&
                  c.bySport.map((s) => (
                    <tr key={s.sport} className="bg-muted/60 text-xs text-muted-foreground">
                      <td />
                      <td className="py-1.5">{s.sport}</td>
                      <td className="text-center">{s.gold}</td>
                      <td className="text-center">{s.silver}</td>
                      <td className="text-center">{s.bronze}</td>
                      <td className="pr-3 text-center">{total(s)}</td>
                    </tr>
                  ))}
              </Fragment>
            )
          })}
        </tbody>
      </table>

      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full border-t px-4 py-2.5 text-center text-xs text-muted-foreground"
        >
          Show all {ranked.length} teams
        </button>
      )}

      {expanded && (
        <p className="border-t px-4 py-3 text-xs text-muted-foreground">
          {rankNote[rankBy]}{drilldown && ' Tap a team for medals by sport.'}
        </p>
      )}
    </section>
  )
}
