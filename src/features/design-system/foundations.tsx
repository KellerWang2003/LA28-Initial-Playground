import { CalendarDays, ChevronRight, MapPin, Search, Ticket, Trophy } from 'lucide-react'
import { PinShape } from '@/components/pin-art'
import { cn } from '@/lib/utils'
import type { PinStatus } from '@/data/la28'
import { Card, Count, Matches } from './entry'
import type { Usage } from './usage'

// Colors, type, radius, layout and icons: the rules every component builds on

// Theme tokens from index.css. Use them as classes (bg-primary, text-muted-foreground).
const COLORS: [token: string, role: string][] = [
  ['background', 'Pages, sheets, and anything inside a tinted block'],
  ['card', 'Tinted surface: cards, tables, grouped lists'],
  ['foreground', 'Body text and icons'],
  ['primary', 'Main actions, selected state'],
  ['primary-foreground', 'Text and icons on primary'],
  ['secondary', 'Quiet buttons'],
  ['muted', 'Fills: chips, placeholders, list rows'],
  ['muted-foreground', 'Secondary text and captions'],
  ['accent', 'Pressed and focused menu items'],
  ['destructive', 'Delete and errors'],
  ['border', 'Outlines and dividers'],
  ['input', 'Input fills (at 50%)'],
  ['ring', 'Focus rings'],
]

// From the page down to the most important thing on it
const SURFACES: [name: string, cls: string, role: string][] = [
  ['1. Page', 'bg-background', 'Headers, filters, section titles sit straight on it'],
  ['2. Tint', 'rounded-2xl bg-card', 'Content blocks: activity cards, the medal table, schedules, results. No outline.'],
  ['3. Inside a tint', 'bg-background', 'Notes, time chips and selected rows inside a block. Grouped rows split with divide-background.'],
  ['4. Emphasis', 'border-foreground or bg-foreground', 'Live, selected, and the main action. One per block at most.'],
]

const PREFIXES = ['bg', 'text', 'border', 'ring', 'fill', 'stroke', 'outline', 'divide']
const tokenUses = (token: string) => (u: Usage) => PREFIXES.reduce((n, p) => n + u.classCount(`${p}-${token}`), 0)

const PIN_STATUS: [status: PinStatus, name: string, cls: string, role: string][] = [
  ['locked', 'Gray', 'text-muted-foreground', 'Locked: not open yet'],
  ['open', 'Green', 'text-emerald-600', 'Open: go collect it'],
  ['expiring', 'Orange', 'text-amber-500', 'Expiring: closes soon'],
]

const OFF_PALETTE =
  /(?<![\w-])(?:bg|text|border|ring|fill|stroke|from|via|to|shadow|outline)-(?:(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}|white|black)(?![\w-])/g

const TYPE: [cls: string, role: string, sample: string, extra?: string][] = [
  ['text-4xl', 'Hero numbers: countdowns, awards', '12:04', 'font-heading font-bold tabular-nums'],
  ['text-3xl', 'Big stats', '48,210', 'font-heading font-semibold tabular-nums'],
  ['text-2xl', 'Tab page titles', 'Explore', 'font-heading font-semibold'],
  ['text-xl', 'Stat values', '3 of 5', 'font-heading font-semibold'],
  ['text-lg', 'Pushed screen titles', 'Urban Light', 'font-heading font-semibold'],
  ['text-base', 'Large buttons; inputs (stops iOS zoom)', 'Collect pin'],
  ['text-sm', 'Body, list titles, buttons', 'Manhattan Beach at sunset'],
  ['text-xs', 'Captions, secondary lines, badges', 'Opens at 7:45 PM · 2.1 km'],
]

const OFF_SCALE_TEXT = /(?<![\w-])text-\[[\d.]+(?:px|rem)\](?![\w-])/g

const RADII: [cls: string, role: string][] = [
  ['rounded-full', 'Pills, avatars, icon buttons'],
  ['rounded-4xl', 'Buttons'],
  ['rounded-3xl', 'Sheets, menus, inputs, big cards'],
  ['rounded-2xl', 'Cards and list rows'],
  ['rounded-xl', 'Thumbnails and small tiles'],
  ['rounded-lg', 'Small inner boxes'],
  ['rounded-md', 'Tiny marks'],
]

const LAYOUT: [rule: string, value: string][] = [
  ['Page side padding', 'px-4 (16px)'],
  ['Tab page header', 'PageHeader, h-16, text-2xl title'],
  ['Pushed screen header', 'h-14, back button (ghost, icon-lg), text-lg title'],
  ['Gap between sections', 'space-y-7'],
  ['Gap between list rows', 'space-y-1.5'],
  ['Safe areas', 'pt-[env(safe-area-inset-top)], pb-[max(env(safe-area-inset-bottom),24px)]'],
  ['Press feedback', 'active:scale-[0.98] on tappable cards and rows'],
]

const ICON_SIZES: [cls: string, role: string][] = [
  ['size-3.5', 'Inside badges and xs buttons'],
  ['size-4', 'Inline with text, list rows, menus'],
  ['size-5', 'Header and icon-lg buttons'],
]

export function Foundations() {
  return (
    <div className="space-y-3">
      <Card title="Color" note="Black and white until designs exist. Use these tokens, not raw colors.">
        <ul className="space-y-2">
          {COLORS.map(([token, role]) => (
            <li key={token} className="flex items-center gap-3">
              <span className="size-9 shrink-0 rounded-xl border" style={{ background: `var(--${token})` }} />
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-xs">{token}</span>
                <span className="block text-xs text-muted-foreground">{role}</span>
              </span>
              <Count of={tokenUses(token)} />
            </li>
          ))}
        </ul>
      </Card>

      <Card
        title="Surfaces"
        note="Hierarchy in grays, no color. The page is white, content blocks sit on a tint, and what matters most inside a block flips back to white or to black."
      >
        <ol className="space-y-3">
          {SURFACES.map(([name, cls, role]) => (
            <li key={name}>
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">
                {role} · <span className="font-mono">{cls}</span>
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-4 mb-1.5 text-xs font-medium">All four together</p>
        <div className="rounded-2xl border bg-background p-3">
          <p className="mb-2 px-1 font-heading text-sm font-semibold">Right now</p>
          <div className="space-y-2">
            <div className="rounded-2xl border border-foreground bg-card p-3">
              <p className="text-xs text-muted-foreground">Swimming · SoFi Stadium</p>
              <p className="font-heading font-semibold">Finals session</p>
              <p className="mt-2 rounded-xl bg-background px-3 py-2 text-xs">
                <span className="text-muted-foreground">Up next 8:05 PM · </span>
                Women&rsquo;s 200m freestyle
              </p>
              <span className="mt-2 flex h-9 items-center justify-center rounded-4xl bg-primary text-sm font-medium text-primary-foreground">
                Join the room
              </span>
            </div>
            <ul className="divide-y divide-background overflow-hidden rounded-2xl bg-card">
              {['Watch party at the pier', 'Morning run with fans'].map((t) => (
                <li key={t} className="px-3 py-2.5 text-sm">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Page, then a live card (tint, black outline) with a white note and a black button, then a grouped list split by
          white lines.
        </p>
      </Card>

      <Card title="Pin status" note="The one place color is allowed. It shows on the pin's outline; collected pins go faded.">
        <ul className="space-y-2">
          {PIN_STATUS.map(([status, name, cls, role]) => (
            <li key={status} className="flex items-center gap-3">
              <PinShape shape="running" status={status} className="size-9" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{name}</span>
                <span className="block text-xs text-muted-foreground">
                  {role} · <span className="font-mono">{cls}</span>
                </span>
              </span>
            </li>
          ))}
          <li className="flex items-center gap-3">
            <PinShape shape="running" status="open" collected className="size-9" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">Collected</span>
              <span className="block text-xs text-muted-foreground">
                Any status, faded · <span className="font-mono">text-foreground/50</span>
              </span>
            </span>
          </li>
        </ul>
        <p className="mt-4 mb-1.5 text-xs font-medium">Other raw colors in the app</p>
        <Matches pattern={OFF_PALETTE} empty="None. Everything uses theme tokens." />
      </Card>

      <Card title="Type" note="Nunito Sans. Headings add font-heading font-semibold.">
        <ul className="space-y-3">
          {TYPE.map(([cls, role, sample, extra]) => (
            <li key={cls}>
              <p className={cn('truncate leading-tight', cls, extra)}>{sample}</p>
              <p className="mt-0.5 flex items-baseline gap-2 text-xs text-muted-foreground">
                <span className="font-mono text-foreground">{cls}</span>
                <span className="min-w-0 flex-1 truncate">{role}</span>
                <Count of={(u) => u.classCount(cls)} />
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-4 mb-1.5 text-xs font-medium">Sizes off the scale</p>
        <Matches pattern={OFF_SCALE_TEXT} empty="None. Every size is on the scale." />
      </Card>

      <Card title="Corners" note="Rounder for bigger and more tappable things.">
        <ul className="space-y-2">
          {RADII.map(([cls, role]) => (
            <li key={cls} className="flex items-center gap-3">
              <span className={cn('h-16 w-24 shrink-0 border-2 border-foreground/70 bg-muted', cls)} />
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-xs">{cls}</span>
                <span className="block text-xs text-muted-foreground">{role}</span>
              </span>
              <Count of={(u) => u.classCount(cls)} />
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Layout" note="Phone width first. These repeat on every screen.">
        <dl className="space-y-2">
          {LAYOUT.map(([rule, value]) => (
            <div key={rule}>
              <dt className="text-sm">{rule}</dt>
              <dd className="font-mono text-xs break-words text-muted-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card title="Icons" note="Lucide, at stroke 2. Pin and marker art uses ShapeSticker (see Building blocks).">
        <ul className="space-y-2">
          {ICON_SIZES.map(([cls, role]) => (
            <li key={cls} className="flex items-center gap-3">
              <span className="flex w-28 shrink-0 items-center gap-1.5">
                {[MapPin, Search, Ticket, CalendarDays, Trophy, ChevronRight].map((Icon, i) => (
                  <Icon key={i} className={cls} />
                ))}
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-xs">{cls}</span>
                <span className="block text-xs text-muted-foreground">{role}</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
