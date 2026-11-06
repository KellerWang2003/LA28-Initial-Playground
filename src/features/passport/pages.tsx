import type { ReactNode } from 'react'
import { Check, Pencil } from 'lucide-react'
import { ImagePlaceholder } from '@/components/image-placeholder'
import { BatonTile } from '@/components/baton-passport'
import { TicketStubArt } from '@/components/ticket-art'
import { TicketsEmpty } from '@/components/ticket-passport'
import { SEED_COLLECTED } from '@/lib/collected'
import { formatCountdown, useRemaining } from '@/lib/clock'
import { COUNTRIES, useProfile } from '@/lib/profile'
import type { LogEntry } from '@/lib/batons'
import type { Ticket } from '@/lib/tickets'
import { cn } from '@/lib/utils'
import { PINS, flag, sessionById, type Pin } from '@/data/la28'
import { CHALLENGES, DAILY_RESET, WEEKLY_RESET, challengeDone, pinsIn, type Challenge } from '@/data/passport'
import { PinTile } from './pin-sheet'
import { passportLines, type BookPage, type Bookmark } from './book-pages'
import type { EditTab } from './id-editor'
import { useLook } from './look'

function Progress({ value, max, className }: { value: number; max: number; className?: string }) {
  return (
    <div className={cn('h-1.5 overflow-hidden rounded-full bg-muted', className)}>
      <div className="h-full rounded-full bg-foreground transition-[width]" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  )
}

// Section title at the top of a page; later pages of a run say which part they are
function PageHead({ title, part, parts, aside }: { title: string; part: number; parts: number; aside: ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <h2 className="min-w-0 truncate font-heading font-semibold">
        {title}
        {parts > 1 && <span className="ml-1.5 text-xs font-normal text-muted-foreground tabular-nums">{part}/{parts}</span>}
      </h2>
      <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{aside}</span>
    </div>
  )
}

// ---- ID page: just the fan, with room to decorate ----

export function IdPage({
  collected,
  batons,
  stubs,
  editing,
  onJump,
  onCustomize,
}: {
  collected: readonly string[]
  batons: number
  stubs: number
  editing: boolean
  onJump: (to: Bookmark) => void
  // Opens Customize, on a tab when a field was tapped
  onCustomize: (tab: EditTab) => void
}) {
  const profile = useProfile()
  const { photo } = useLook()
  const country = COUNTRIES.find((c) => c.code === profile.country)?.name ?? profile.country
  const mrz = passportLines(profile.name, profile.country)
  // While customizing, the photo and details open their tab
  const editable = editing && 'rounded-lg outline-2 outline-offset-2 outline-foreground/40 outline-dashed'

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex h-6 items-center justify-between">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">LA28 Fan Passport</p>
        {!editing && (
          <button
            type="button"
            onClick={() => onCustomize('stickers')}
            className="flex h-6 items-center gap-1 rounded-full border bg-background px-2 text-[11px] font-semibold active:bg-muted"
          >
            <Pencil className="size-3" />
            Customize
          </button>
        )}
      </div>

      <div className="mt-3 flex gap-3">
        <button
          type="button"
          {...editOnly(editing)}
          onClick={() => editing && onCustomize('photo')}
          aria-label="Change photo"
          className={cn('aspect-[3/4] w-[6.5rem] shrink-0 overflow-hidden rounded-lg', editable)}
        >
          {photo ? <img src={photo} alt="" className="size-full object-cover grayscale" /> : <ImagePlaceholder className="size-full rounded-lg" />}
        </button>
        <button
          type="button"
          {...editOnly(editing)}
          onClick={() => editing && onCustomize('details')}
          className={cn('flex min-w-0 flex-1 flex-col gap-2 self-start text-left', editable)}
        >
          <IdField label="Name" value={profile.name || '—'} />
          <IdField label="Country" value={`${flag(profile.country)} ${country}`} />
          <IdField label="Speaks" value={profile.spoken.join(', ') || '—'} />
        </button>
      </div>

      {/* What's in the book so far; each opens its bookmark */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-y py-2">
        <Tally label="Pins" value={`${collected.length}/${PINS.length}`} onClick={() => onJump('pins')} />
        <Tally label="Batons" value={batons} onClick={() => onJump('batons')} />
        <Tally label="Stubs" value={stubs} onClick={() => onJump('tickets')} />
      </div>

      <button type="button" {...editOnly(editing)} onClick={() => editing && onCustomize('details')} className={cn('mt-3 text-left', editable)}>
        <span className="block text-[9px] font-medium tracking-widest text-muted-foreground uppercase">About</span>
        <span className="line-clamp-2 text-[13px] leading-snug">{profile.bio || 'Say something about your Games.'}</span>
      </button>

      <div aria-hidden className="mt-auto pt-2 font-mono text-[9.5px] leading-snug tracking-[0.1em] text-muted-foreground/70">
        {mrz.map((l) => (
          <p key={l} className="truncate">
            {l}
          </p>
        ))}
      </div>
    </div>
  )
}

// Fields that only respond while customizing. Not `disabled`: a disabled button swallows the
// pointer events a page swipe starting on it needs.
const editOnly = (editing: boolean) => ({ tabIndex: editing ? 0 : -1, 'aria-disabled': !editing })

function IdField({ label, value }: { label: string; value: string }) {
  return (
    <span className="block min-w-0">
      <span className="block text-[9px] font-medium tracking-widest text-muted-foreground uppercase">{label}</span>
      <span className="block truncate text-sm leading-tight font-semibold">{value}</span>
    </span>
  )
}

function Tally({ label, value, onClick }: { label: string; value: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="min-w-0 rounded-md text-left transition-colors active:bg-muted">
      <span className="block text-[9px] font-medium tracking-widest text-muted-foreground uppercase">{label}</span>
      <span className="block truncate font-heading text-base leading-tight font-semibold tabular-nums">{value}</span>
    </button>
  )
}

// ---- Challenges: every daily and weekly one, with progress ----

export function ChallengesPage({ collected }: { collected: readonly string[] }) {
  const daily = CHALLENGES.filter((c) => c.period === 'daily')
  const weekly = CHALLENGES.filter((c) => c.period === 'weekly')

  return (
    <>
      <h2 className="mb-2 font-heading font-semibold">Challenges</h2>
      <div className="space-y-3">
        <ChallengeGroup title="Daily" resetsAt={DAILY_RESET}>
          {daily.map((c) => (
            <ChallengeRow key={c.id} challenge={c} done={challengeDone(c, collected, SEED_COLLECTED)} />
          ))}
        </ChallengeGroup>
        <ChallengeGroup title="Weekly" resetsAt={WEEKLY_RESET}>
          {weekly.map((c) => (
            <ChallengeRow key={c.id} challenge={c} done={challengeDone(c, collected, SEED_COLLECTED)} />
          ))}
        </ChallengeGroup>
      </div>
    </>
  )
}

function ChallengeGroup({ title, resetsAt, children }: { title: string; resetsAt: string; children: ReactNode }) {
  const left = useRemaining(resetsAt)
  return (
    <section>
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="font-heading text-sm font-semibold">{title}</h2>
        <span className="text-[11px] text-muted-foreground tabular-nums">Resets in {formatCountdown(left)}</span>
      </div>
      <ul className="divide-y rounded-2xl border bg-background">{children}</ul>
    </section>
  )
}

function ChallengeRow({ challenge, done }: { challenge: Challenge; done: number }) {
  const complete = done >= challenge.goal
  return (
    <li className={cn('flex items-center gap-2.5 px-3 py-2', complete && 'opacity-60')}>
      <p className="min-w-0 flex-1 truncate text-[13px] font-medium">{challenge.title}</p>
      {complete ? (
        <Check aria-label="Completed" className="size-4 shrink-0 text-muted-foreground" />
      ) : (
        <>
          <Progress value={done} max={challenge.goal} className="w-12 shrink-0" />
          <span className="w-7 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
            {Math.min(done, challenge.goal)}/{challenge.goal}
          </span>
        </>
      )}
    </li>
  )
}

// ---- Pins: one category per page, more pages for a long one ----

export function PinsPage({
  page,
  collected,
  customIds,
  highlight,
  onOpen,
}: {
  page: Extract<BookPage, { kind: 'pins' }>
  collected: readonly string[]
  customIds: readonly string[]
  highlight: string | null
  onOpen: (pin: Pin) => void
}) {
  const all = pinsIn(page.category.kinds)
  const have = all.filter((p) => collected.includes(p.id)).length
  return (
    <>
      <PageHead title={page.category.title} part={page.part} parts={page.parts} aside={`${have}/${all.length}`} />
      <Progress value={have} max={all.length} />
      <div className="mt-3 grid grid-cols-4 gap-x-2 gap-y-3">
        {page.pins.map((pin) => (
          <PinTile
            key={pin.id}
            pin={pin}
            have={collected.includes(pin.id)}
            custom={customIds.includes(pin.id)}
            highlight={pin.id === highlight}
            onOpen={() => onOpen(pin)}
          />
        ))}
      </div>
    </>
  )
}

// ---- Batons: a stamp for every baton carried to its next spot ----

export function BatonsPage({ page, total, onOpen }: { page: Extract<BookPage, { kind: 'batons' }>; total: number; onOpen: (e: LogEntry) => void }) {
  return (
    <>
      <PageHead title="Batons" part={page.part} parts={page.parts} aside={`${total} carried`} />
      {page.entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Batons turn up by chance at landmarks. Carry one to the next spot to earn its stamp.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {page.entries.map((e) => (
            <BatonTile key={e.id} entry={e} onOpen={() => onOpen(e)} />
          ))}
        </div>
      )}
    </>
  )
}

// ---- Ticket stubs ----

export function TicketsPage({ page, total, onOpen }: { page: Extract<BookPage, { kind: 'tickets' }>; total: number; onOpen: (t: Ticket) => void }) {
  return (
    <>
      <PageHead title="Ticket stubs" part={page.part} parts={page.parts} aside={`${total} ${total === 1 ? 'stub' : 'stubs'}`} />
      {page.tickets.length === 0 ? (
        <TicketsEmpty />
      ) : (
        <div className="space-y-3">
          {page.tickets.map((t) => {
            const session = sessionById(t.sessionId)
            return session && <TicketStubArt key={t.id} ticket={t} session={session} compact onClick={() => onOpen(t)} />
          })}
        </div>
      )}
    </>
  )
}
