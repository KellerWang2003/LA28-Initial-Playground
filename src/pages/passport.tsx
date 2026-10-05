import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Check, ChevronLeft, Flame, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShapeSticker } from '@/components/shape-art'
import { ImagePlaceholder } from '@/components/image-placeholder'
import { SEED_COLLECTED, useCollected, useCustomIds } from '@/lib/collected'
import { CustomPin } from '@/components/place-photo'
import { claimChallenge, redeemItem, useWallet } from '@/lib/wallet'
import { formatCountdown, useRemaining } from '@/lib/clock'
import { cn } from '@/lib/utils'
import { PINS, type Pin } from '@/data/la28'
import {
  CATEGORIES,
  CHALLENGES,
  DAILY_RESET,
  PIN_VALUE,
  STORE_ITEMS,
  WEEKLY_RESET,
  pinsIn,
  type Challenge,
  type StoreItem,
} from '@/data/passport'

type Tab = 'collection' | 'challenges' | 'store'

export default function PassportPage() {
  const navigate = useNavigate()
  const collected = useCollected()
  const customIds = useCustomIds()
  const { balance } = useWallet()
  const [tab, setTab] = useState<Tab>('collection')

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={() => navigate(-1)}>
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="font-heading text-lg font-semibold">Passport</h1>
        {/* Currency, like a game HUD */}
        <span
          aria-label={`${balance} Torches`}
          className="mr-2 ml-auto flex h-10 items-center rounded-full bg-muted pr-4 pl-3 text-base font-semibold"
        >
          <Torches amount={balance} iconClassName="size-5" />
        </span>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mt-1 min-h-0 flex-1">
        <TabsList className="mx-4 w-auto shrink-0">
          <TabsTrigger value="collection">Collection</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="store">Store</TabsTrigger>
        </TabsList>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-[max(env(safe-area-inset-bottom),24px)]">
          <TabsContent value="collection">
            <Collection collected={collected} customIds={customIds} />
          </TabsContent>
          <TabsContent value="challenges">
            <Challenges collected={collected} />
          </TabsContent>
          <TabsContent value="store">
            <Store balance={balance} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
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

// ---- Challenges: daily and weekly, claim Torches when complete ----

function Challenges({ collected }: { collected: string[] }) {
  const { claimed } = useWallet()
  const today = collected.filter((id) => !SEED_COLLECTED.includes(id)).length

  const progressOf = (c: Challenge) =>
    c.progress.type === 'static' ? c.progress.done : c.progress.type === 'pinsToday' ? today : collected.length

  return (
    <div className="space-y-7 pt-2">
      <ChallengeGroup title="Daily" resetsAt={DAILY_RESET}>
        {CHALLENGES.filter((c) => c.period === 'daily').map((c) => (
          <ChallengeRow key={c.id} challenge={c} done={progressOf(c)} claimed={claimed.includes(c.id)} />
        ))}
      </ChallengeGroup>
      <ChallengeGroup title="Weekly" resetsAt={WEEKLY_RESET}>
        {CHALLENGES.filter((c) => c.period === 'weekly').map((c) => (
          <ChallengeRow key={c.id} challenge={c} done={progressOf(c)} claimed={claimed.includes(c.id)} />
        ))}
      </ChallengeGroup>
      <p className="text-center text-xs text-muted-foreground">
        Pins earn Torches too: {PIN_VALUE.Common} for Common, up to {PIN_VALUE.Legendary} for Legendary.
      </p>
    </div>
  )
}

function ChallengeGroup({ title, resetsAt, children }: { title: string; resetsAt: string; children: ReactNode }) {
  const left = useRemaining(resetsAt)
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-heading font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground tabular-nums">Resets in {formatCountdown(left)}</span>
      </div>
      <ul className="space-y-2">{children}</ul>
    </section>
  )
}

function ChallengeRow({ challenge, done, claimed }: { challenge: Challenge; done: number; claimed: boolean }) {
  const complete = done >= challenge.goal
  return (
    <li className={cn('rounded-2xl border p-3', claimed && 'opacity-60')}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{challenge.title}</p>
          <p className="text-xs text-muted-foreground">{challenge.detail}</p>
        </div>
        <Torches amount={challenge.reward} className="shrink-0 text-sm font-semibold" />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1">
          <Progress value={done} max={challenge.goal} />
        </div>
        <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
          {Math.min(done, challenge.goal)}/{challenge.goal}
        </span>
        {claimed ? (
          <span className="flex w-20 items-center justify-end gap-1 text-xs text-muted-foreground">
            <Check className="size-3.5" />
            Claimed
          </span>
        ) : (
          <Button size="sm" className="w-20" disabled={!complete} onClick={() => claimChallenge(challenge.id)}>
            Claim
          </Button>
        )}
      </div>
    </li>
  )
}

// ---- Store: spend Torches on merch, pick up with a QR code ----

function Store({ balance }: { balance: number }) {
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
