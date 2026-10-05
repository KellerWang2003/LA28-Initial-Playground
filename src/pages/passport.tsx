import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Check, ChevronLeft, Flame, QrCode, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShapeSticker } from '@/components/shape-art'
import { ImagePlaceholder } from '@/components/image-placeholder'
import { SEED_COLLECTED, useCollected, useCustomIds } from '@/lib/collected'
import { CustomPin } from '@/components/place-photo'
import { redeemItem, useWallet } from '@/lib/wallet'
import { formatCountdown, useRemaining } from '@/lib/clock'
import { cn } from '@/lib/utils'
import { PINS, type Pin } from '@/data/la28'
import {
  CATEGORIES,
  CHALLENGES,
  DAILY_RESET,
  STORE_ITEMS,
  WEEKLY_RESET,
  challengeDone,
  pinsIn,
  type Challenge,
  type StoreItem,
} from '@/data/passport'

const VISIBLE_PER_PERIOD = 2

export default function PassportPage() {
  const navigate = useNavigate()
  const collected = useCollected()
  const customIds = useCustomIds()
  const { balance } = useWallet()

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <ScreenHeader title="Passport" balance={balance} onBack={() => navigate(-1)} />

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-[max(env(safe-area-inset-bottom),6.5rem)]">
        <Challenges collected={collected} />
        <div className="mt-6">
          <Collection collected={collected} customIds={customIds} />
        </div>
      </div>

      <StoreButton />
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

function ScreenHeader({ title, balance, onBack }: { title: string; balance: number; onBack: () => void }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 px-2">
      <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={onBack}>
        <ChevronLeft className="size-5" />
      </Button>
      <h1 className="font-heading text-lg font-semibold">{title}</h1>
      <span
        aria-label={`${balance} Torches`}
        className="mr-2 ml-auto flex h-10 items-center rounded-full bg-muted pr-4 pl-3 text-base font-semibold"
      >
        <Torches amount={balance} iconClassName="size-5" />
      </span>
    </header>
  )
}

function StoreButton() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      aria-label="Store"
      onClick={() => navigate('/passport/store')}
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 w-[4.75rem] shadow-lg transition-transform active:scale-95"
    >
      <span aria-hidden className="flex h-3 overflow-hidden rounded-t-md">
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} className={cn('h-full flex-1', i % 2 === 0 ? 'bg-foreground' : 'bg-foreground/35')} />
        ))}
      </span>
      <span className="flex h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-b-2xl bg-primary text-primary-foreground">
        <Store className="size-5" strokeWidth={2} />
        <span className="font-heading text-[11px] leading-none font-semibold">Store</span>
      </span>
    </button>
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

function Progress({ value, max }: { value: number; max: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-foreground transition-[width]" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  )
}

// ---- Collection: pins by category; ones you don't have are grayed out ----

function Collection({ collected, customIds }: { collected: string[]; customIds: string[] }) {
  return (
    <div className="space-y-7 pt-2">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">{collected.length}</span> of {PINS.length} pins collected
      </p>
      {CATEGORIES.map((cat) => {
        const pins = pinsIn(cat.kinds)
        const have = pins.filter((p) => collected.includes(p.id))
        // Collected first, then the rest
        const ordered = [...have, ...pins.filter((p) => !collected.includes(p.id))]
        return (
          <section key={cat.id}>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="font-heading font-semibold">{cat.title}</h2>
              <span className="text-sm text-muted-foreground tabular-nums">
                {have.length}/{pins.length}
              </span>
            </div>
            <Progress value={have.length} max={pins.length} />
            <div className="mt-3 grid grid-cols-4 gap-x-2 gap-y-3">
              {ordered.map((pin) => (
                <PinTile key={pin.id} pin={pin} have={collected.includes(pin.id)} custom={customIds.includes(pin.id)} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function PinTile({ pin, have, custom }: { pin: Pin; have: boolean; custom?: boolean }) {
  const navigate = useNavigate()
  return (
    <button type="button" onClick={() => navigate(`/explore/pins/${pin.id}`)} className="flex flex-col items-center gap-1 text-center transition-transform active:scale-95">
      <span className={cn('flex aspect-square w-full items-center justify-center rounded-2xl', have ? 'bg-muted' : 'border border-dashed')}>
        {have && custom ? (
          <CustomPin seed={pin.id} shape={pin.shape} className="size-3/5 shadow-none" />
        ) : (
          <ShapeSticker shape={pin.shape} className={cn('size-3/5', have ? 'text-foreground' : 'text-muted-foreground/30 drop-shadow-none')} />
        )}
      </span>
      <span className={cn('line-clamp-2 text-[11px] leading-tight', have ? 'font-medium' : 'text-muted-foreground/60')}>
        {pin.name.replace(/ Pin$/, '')}
      </span>
    </button>
  )
}

// ---- Challenges: two daily and two weekly, inline above the collection ----

function Challenges({ collected }: { collected: string[] }) {
  const daily = CHALLENGES.filter((c) => c.period === 'daily').slice(0, VISIBLE_PER_PERIOD)
  const weekly = CHALLENGES.filter((c) => c.period === 'weekly').slice(0, VISIBLE_PER_PERIOD)

  return (
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
  )
}

function ChallengeGroup({ title, resetsAt, children }: { title: string; resetsAt: string; children: ReactNode }) {
  const left = useRemaining(resetsAt)
  return (
    <section>
      <div className="mb-1.5 flex items-baseline justify-between">
        <h2 className="font-heading text-sm font-semibold">{title}</h2>
        <span className="text-[11px] text-muted-foreground tabular-nums">Resets in {formatCountdown(left)}</span>
      </div>
      <ul className="space-y-1.5">{children}</ul>
    </section>
  )
}

function ChallengeRow({ challenge, done }: { challenge: Challenge; done: number }) {
  const complete = done >= challenge.goal
  return (
    <li className={cn('flex items-center gap-3 rounded-2xl border px-3.5 py-4', complete && 'opacity-60')}>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{challenge.title}</p>
        <div className="mt-3">
          <Progress value={done} max={challenge.goal} />
        </div>
      </div>
      {complete ? (
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <Check className="size-3.5" />
          Completed
        </span>
      ) : (
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {Math.min(done, challenge.goal)}/{challenge.goal}
        </span>
      )}
    </li>
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
