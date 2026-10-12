import { useState } from 'react'
import { useNavigate, useNavigationType, useSearchParams } from 'react-router'
import { ChevronLeft, Flame, QrCode, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImagePlaceholder } from '@/components/image-placeholder'
import { BatonEntrySheet } from '@/components/baton-passport'
import { TicketDetailSheet } from '@/components/ticket-passport'
import { useCollected, useCustomIds } from '@/lib/collected'
import { useBatonLog, type LogEntry } from '@/lib/batons'
import { removeTicket, useTickets, type Ticket } from '@/lib/tickets'
import { redeemItem, useWallet } from '@/lib/wallet'
import { cn } from '@/lib/utils'
import type { Pin } from '@/data/la28'
import { STORE_ITEMS, type StoreItem } from '@/data/passport'
import { PassportBook } from '@/features/passport/book'
import { buildPages, type BookPage, type Bookmark } from '@/features/passport/book-pages'
import { BatonsPage, ChallengesPage, IdPage, PinsPage, TicketsPage } from '@/features/passport/pages'
import { PinSheet } from '@/features/passport/pin-sheet'
import { IdEditor, type EditTab } from '@/features/passport/id-editor'
import { StickerLayer } from '@/features/passport/stickers'

// The page the fan left the booklet on, so coming back from a pin or game reopens it there
let savedPage: number | null = null

export default function PassportPage() {
  const navigate = useNavigate()
  const navType = useNavigationType()
  const [params] = useSearchParams()
  const collected = useCollected()
  const customIds = useCustomIds()
  const log = useBatonLog()
  const tickets = useTickets()
  const { balance } = useWallet()
  const [pin, setPin] = useState<Pin | null>(null)
  const [baton, setBaton] = useState<LogEntry | null>(null)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  // Customizing the ID page: which tray tab is open, and the sticker in hand
  const [editTab, setEditTab] = useState<EditTab | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const editing = editTab !== null

  const pages = buildPages(collected, log, tickets)
  // Back from a screen opened here: same page, already open. Otherwise the cover
  // swings open onto the asked-for section (or a just-collected pin), else the ID page.
  const returning = navType === 'POP' && savedPage !== null
  const section = params.get('section')
  const highlight = params.get('pin')
  const [startAt] = useState(() => {
    if (returning) return savedPage!
    const at = highlight
      ? pages.findIndex((p) => p.kind === 'pins' && p.pins.some((x) => x.id === highlight))
      : pages.findIndex((p) => p.kind === section)
    return Math.max(0, at)
  })

  function render(page: BookPage, jump: (to: Bookmark) => void) {
    switch (page.kind) {
      case 'id':
        return <IdPage collected={collected} batons={log.length} stubs={tickets.length} editing={editing} onJump={jump} onCustomize={setEditTab} />
      case 'challenges':
        return <ChallengesPage collected={collected} />
      case 'pins':
        return (
          <PinsPage
            page={page}
            collected={collected}
            customIds={customIds}
            highlight={highlight}
            // A pin you have opens its photos; one you don't goes to its page to collect it
            onOpen={(p) => (collected.includes(p.id) ? setPin(p) : navigate(`/explore/pins/${p.id}`))}
          />
        )
      case 'batons':
        return <BatonsPage page={page} total={log.length} onOpen={setBaton} />
      case 'tickets':
        return <TicketsPage page={page} total={tickets.length} onOpen={setTicket} />
    }
  }

  return (
    <div className={cn('flex h-dvh flex-col overflow-hidden bg-background pt-[env(safe-area-inset-top)]', !editing && 'pb-[env(safe-area-inset-bottom)]')}>
      <ScreenHeader title="Passport" balance={balance} onBack={() => navigate(-1)} onStore={() => navigate('/passport/store')} />

      <PassportBook
        pages={pages}
        startAt={startAt}
        closed={!returning}
        locked={editing}
        renderPage={render}
        renderOverlay={(page) => page.kind === 'id' && <StickerLayer editing={editing} selected={selected} onSelect={setSelected} />}
        onPage={(i) => {
          savedPage = i
        }}
      />

      {editTab && (
        <IdEditor
          tab={editTab}
          onTab={setEditTab}
          onAdded={setSelected}
          onDone={() => {
            setEditTab(null)
            setSelected(null)
          }}
        />
      )}

      {pin && <PinSheet pin={pin} custom={customIds.includes(pin.id)} onClose={() => setPin(null)} />}
      {/* The log entry gains its recap tonight, so read it fresh */}
      {baton && <BatonEntrySheet entry={log.find((e) => e.id === baton.id) ?? baton} onClose={() => setBaton(null)} />}
      {ticket && (
        <TicketDetailSheet
          ticket={ticket}
          onClose={() => setTicket(null)}
          onDelete={() => {
            removeTicket(ticket.id)
            setTicket(null)
          }}
        />
      )}
    </div>
  )
}

export function PassportStorePage() {
  const navigate = useNavigate()
  const { balance } = useWallet()

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <ScreenHeader title="Store" balance={balance} onBack={() => navigate(-1)} />

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-[max(env(safe-area-inset-bottom),24px)]">
        <StoreShelf balance={balance} />
      </div>
    </div>
  )
}

function ScreenHeader({ title, balance, onBack, onStore }: { title: string; balance: number; onBack: () => void; onStore?: () => void }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 px-2">
      <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={onBack}>
        <ChevronLeft className="size-5" />
      </Button>
      <h1 className="font-heading text-lg font-semibold">{title}</h1>
      <span
        aria-label={`${balance} Torches`}
        className={cn('ml-auto flex h-10 items-center rounded-full bg-muted pr-4 pl-3 text-base font-semibold', !onStore && 'mr-2')}
      >
        <Torches amount={balance} iconClassName="size-5" />
      </span>
      {onStore && (
        <Button variant="secondary" size="icon-lg" aria-label="Store" className="mr-2 rounded-full" onClick={onStore}>
          <Store className="size-5" />
        </Button>
      )}
    </header>
  )
}

function Torches({ amount, className, iconClassName }: { amount: number; className?: string; iconClassName?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 tabular-nums', className)}>
      <Flame className={cn('size-4 fill-current', iconClassName)} />
      {amount.toLocaleString()}
    </span>
  )
}

// ---- Store: spend Torches on merch, pick up with a QR code ----

function StoreShelf({ balance }: { balance: number }) {
  const { redeemed } = useWallet()
  const ready = STORE_ITEMS.filter((i) => redeemed.includes(i.id))

  return (
    <div className="space-y-7 pt-2">
      {ready.length > 0 && (
        <section>
          <h2 className="mb-2 font-heading font-semibold">Ready for pickup</h2>
          <ul className="space-y-2">
            {ready.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-2xl border p-3">
                <QrPlaceholder seed={item.id} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Show this code at an LA28 store or Fan Zone</p>
                  <p className="mt-1 font-mono text-xs">LA28-{item.id.toUpperCase()}-4821</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-heading font-semibold">Merch</h2>
          <span className="text-xs text-muted-foreground">Pick up at LA28 stores and Fan Zones</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {STORE_ITEMS.map((item) => (
            <StoreCard key={item.id} item={item} balance={balance} redeemed={redeemed.includes(item.id)} />
          ))}
        </div>
      </section>
    </div>
  )
}

function StoreCard({ item, balance, redeemed }: { item: StoreItem; balance: number; redeemed: boolean }) {
  // Two taps to spend: Redeem, then Confirm
  const [confirming, setConfirming] = useState(false)
  const short = item.price - balance

  return (
    <div className="flex flex-col rounded-2xl border p-2.5">
      <ImagePlaceholder className="aspect-square w-full" />
      <p className="mt-2 text-sm leading-tight font-medium">{item.name}</p>
      <p className="text-xs text-muted-foreground">{item.detail}</p>
      <Torches amount={item.price} className="mt-1 text-sm font-semibold" />
      <div className="mt-2">
        {redeemed ? (
          <Button size="sm" variant="secondary" className="w-full" disabled>
            <QrCode data-icon="inline-start" />
            Redeemed
          </Button>
        ) : short > 0 ? (
          <Button size="sm" variant="outline" className="w-full" disabled>
            Need {short} more
          </Button>
        ) : confirming ? (
          <Button size="sm" className="w-full" onClick={() => redeemItem(item.id)}>
            Confirm −{item.price}
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="w-full" onClick={() => setConfirming(true)}>
            Redeem
          </Button>
        )}
      </div>
    </div>
  )
}

// Stand-in QR code: a deterministic pattern, not a real code
function QrPlaceholder({ seed }: { seed: string }) {
  let h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
  const cells: [number, number][] = []
  for (let y = 0; y < 11; y++) {
    for (let x = 0; x < 11; x++) {
      h = (h * 1103515245 + 12345) >>> 0
      const corner = (x < 3 && y < 3) || (x > 7 && y < 3) || (x < 3 && y > 7)
      if (corner || h % 3 === 0) cells.push([x, y])
    }
  }
  return (
    <svg viewBox="0 0 11 11" className="size-16 shrink-0 rounded-md border bg-background p-1" aria-label="Pickup code">
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" />
      ))}
    </svg>
  )
}
