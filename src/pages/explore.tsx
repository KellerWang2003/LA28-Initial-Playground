import { useRef, useState, type ReactNode, type UIEvent } from 'react'
import { useNavigate } from 'react-router'
import { Check, ChevronRight, Clock, Gift, Layers, Lock, LocateFixed, Navigation, Radio, Search, Tv, Users, X } from 'lucide-react'
import { MapView, type MapPadding, type MapStyle, type MapViewHandle } from '@/components/map-view'
import { BottomSheet, type Snap } from '@/components/bottom-sheet'
import { ProfileButton } from '@/components/profile-button'
import { PassportButton } from '@/components/passport-button'
import { KindIcon, PinShape, PinStatusChip } from '@/components/pin-art'
import { ShapeIcon } from '@/components/shape-art'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useCollected } from '@/lib/collected'
import { cn } from '@/lib/utils'
import { FAKE_USER_LOCATION, allItems, distance, layers, mapLayers, type Layer, type MapItem } from '@/data/map-layers'

const mapStyles: { id: MapStyle; label: string }[] = [
  { id: 'light', label: 'Default' },
  { id: 'streets', label: 'Streets' },
  { id: 'satellite', label: 'Satellite' },
]

const USER_MARKER = 'me'
// Zoom level from which every pin shows its status label
const LABEL_ZOOM = 12

// Space taken by overlays, so the map centers things in the visible area
const SHEET_PADDING: MapPadding = { top: 112, bottom: 340, left: 64, right: 72 }
const CARDS_PADDING: MapPadding = { top: 96, bottom: 300, left: 48, right: 48 }

const initialBounds = [...mapLayers.pins.map((i) => i.coords), FAKE_USER_LOCATION]

export default function ExplorePage() {
  const mapRef = useRef<MapViewHandle>(null)
  const collected = useCollected()
  const [snap, setSnap] = useState<Snap>('min')
  // Each pill is a map layer
  const [layer, setLayer] = useState<Layer>('pins')
  const [query, setQuery] = useState('')
  // anchorId fixes the order of the "nearby" cards; selectedId follows swipes
  const [anchorId, setAnchorId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mapStyle, setMapStyle] = useState<MapStyle>('light')
  const [threeD, setThreeD] = useState(false)
  const [showLabels, setShowLabels] = useState(false)

  const visibleItems = mapLayers[layer]
  // Prefer the current layer's copy (a drop's card differs under Drops)
  const itemById = (id: string) => visibleItems.find((i) => i.id === id) ?? allItems.find((i) => i.id === id)!
  const markers = [
    ...visibleItems.map((i) => ({ id: i.id, coords: i.coords, offset: i.offset })),
    { id: USER_MARKER, coords: FAKE_USER_LOCATION },
  ]

  const nearby = anchorId
    ? [...visibleItems].sort((a, b) => distance(a.coords, itemById(anchorId).coords) - distance(b.coords, itemById(anchorId).coords))
    : []

  function select(id: string) {
    const item = itemById(id)
    // Search results can come from another layer: switch to it
    if (item.layer !== layer) setLayer(item.layer)
    setAnchorId(id)
    setSelectedId(id)
    setSnap('min')
    mapRef.current?.flyTo(itemById(id).coords, CARDS_PADDING)
  }

  function clearSelection() {
    setAnchorId(null)
    setSelectedId(null)
  }

  function onCardSwipe(id: string) {
    if (id === selectedId) return
    setSelectedId(id)
    mapRef.current?.flyTo(itemById(id).coords, CARDS_PADDING)
  }

  function changeLayer(next: Layer) {
    setLayer(next)
    clearSelection()
    const coords = mapLayers[next].map((i) => i.coords)
    if (coords.length) mapRef.current?.fitTo([...coords, FAKE_USER_LOCATION], SHEET_PADDING)
  }

  function renderMarker(id: string) {
    if (id === USER_MARKER) return <UserDot />
    const item = itemById(id)
    return (
      <ItemMarker
        item={item}
        selected={id === selectedId}
        collected={collected.includes(id)}
        showLabel={showLabels}
      />
    )
  }

  return (
    <div className="absolute inset-0">
      <MapView
        ref={mapRef}
        markers={markers}
        renderMarker={renderMarker}
        selectedId={selectedId}
        onMarkerClick={(id) => id !== USER_MARKER && select(id)}
        onBackgroundClick={clearSelection}
        onZoomChange={(z) => setShowLabels(z >= LABEL_ZOOM)}
        initialBounds={initialBounds}
        initialPadding={SHEET_PADDING}
        mapStyle={mapStyle}
        threeD={threeD}
      />

      {/* Top right: profile + map options */}
      <div className="absolute top-[calc(env(safe-area-inset-top)+12px)] right-4 z-20 flex flex-col items-end gap-3">
        <ProfileButton className="shadow-md" />
        <div className="flex flex-col overflow-hidden rounded-full border bg-background shadow-md">
          <Button
            variant="ghost"
            size="icon-lg"
            className="rounded-none text-xs font-semibold"
            aria-label={threeD ? 'Switch to 2D' : 'Switch to 3D'}
            onClick={() => setThreeD(!threeD)}
          >
            {threeD ? '2D' : '3D'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Map layers"
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon-lg' }), 'rounded-none border-t')}
            >
              <Layers />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="left" className="w-40">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Map style</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={mapStyle} onValueChange={(v) => setMapStyle(v as MapStyle)}>
                  {mapStyles.map((m) => (
                    <DropdownMenuRadioItem key={m.id} value={m.id}>
                      {m.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <BottomSheet
        snap={snap}
        onSnapChange={setSnap}
        hidden={selectedId !== null}
        accessory={
          <>
            <Button
              variant="outline"
              size="icon"
              className="size-12 rounded-full bg-background shadow-md"
              aria-label="My location"
              onClick={() => mapRef.current?.flyTo(FAKE_USER_LOCATION, SHEET_PADDING)}
            >
              <LocateFixed className="size-5" />
            </Button>
            <PassportButton />
          </>
        }
        header={
          <div className="px-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSnap('full')}
                placeholder="Search pins, events, places, people"
                className="h-10 rounded-full pl-9"
              />
            </div>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-3">
              {layers.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => changeLayer(l.id)}
                  className={cn(
                    'h-8 shrink-0 rounded-full border px-3 text-sm',
                    layer === l.id && 'border-primary bg-primary text-primary-foreground',
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        }
      >
        <SheetList layer={layer} query={query} collected={collected} onSelect={select} />
      </BottomSheet>

      {anchorId && (
        <NearbyCards
          key={anchorId}
          items={nearby}
          collected={collected}
          onSwipe={onCardSwipe}
          onClose={clearSelection}
        />
      )}
    </div>
  )
}

// ---- Map markers ----

function ItemMarker({
  item,
  selected,
  collected,
  showLabel,
}: {
  item: MapItem
  selected: boolean
  collected: boolean
  showLabel: boolean
}) {
  return (
    <div className="relative flex cursor-pointer flex-col items-center [perspective:400px]">
      <div data-marker-body className={cn('transition-transform', selected && 'scale-125')}>
        <MarkerVisual item={item} selected={selected} collected={collected} />
      </div>
      {/* Name under every marker; pins add their status when zoomed in */}
      <div data-marker-label className={cn('absolute top-full flex w-max max-w-28 flex-col items-center gap-1', selected ? 'mt-3' : 'mt-1')}>
        <span className="line-clamp-2 text-center text-[11px] leading-tight font-semibold [text-shadow:0_0_3px_var(--background),0_0_3px_var(--background),0_0_3px_var(--background)]">
          {item.label}
        </span>
        {item.pin && (selected || showLabel) && (
          <PinStatusChip status={item.pin.status} label={selected ? item.pin.label : item.pin.short} collected={collected} />
        )}
      </div>
    </div>
  )
}

function MarkerVisual({ item, selected, collected }: { item: MapItem; selected: boolean; collected: boolean }) {
  // Pins: glowing die-cut collectible
  if (item.pin) {
    return (
      <PinShape
        shape={item.pin.shape}
        status={item.pin.status}
        collected={collected}
        className={cn('block size-12', selected && 'animate-coin-spin')}
      />
    )
  }

  // Crew: avatar with their initial
  if (item.kind === 'crew') {
    return (
      <div className="flex size-10 items-center justify-center rounded-full border-2 border-background bg-foreground text-sm font-semibold text-background shadow-md ring-2 ring-foreground">
        {item.label[0]}
      </div>
    )
  }

  // Everything else: a flat round bubble with the shape inside (live adds a dot)
  return (
    <div
      className={cn(
        'relative flex size-10 items-center justify-center rounded-full border bg-background shadow-md',
        selected && 'border-primary bg-primary text-primary-foreground',
      )}
    >
      <ShapeIcon shape={item.shape!} className="size-5" />
      {item.kind === 'live' && (
        <span className="absolute -top-0.5 -right-0.5 size-3 animate-pulse rounded-full border-2 border-background bg-red-500" />
      )}
    </div>
  )
}

function UserDot() {
  return <div className="size-4 rounded-full border-2 border-white bg-blue-500 shadow ring-6 ring-blue-500/20" />
}

// ---- Sheet list ----

function SheetList({
  layer,
  query,
  collected,
  onSelect,
}: {
  layer: Layer
  query: string
  collected: string[]
  onSelect: (id: string) => void
}) {
  const q = query.trim().toLowerCase()
  const layerLabel = (l: Layer) => layers.find((x) => x.id === l)!.label

  // Searching looks across every layer; otherwise list the current one
  const results = (q ? allItems : mapLayers[layer])
    .filter((i) => !q || `${i.title} ${i.place.name} ${i.place.hood}`.toLowerCase().includes(q))
    .sort((a, b) => distance(a.coords, FAKE_USER_LOCATION) - distance(b.coords, FAKE_USER_LOCATION))

  if (!q && layer === 'saved') {
    return <p className="px-4 py-10 text-center text-sm text-muted-foreground">Nothing saved yet</p>
  }

  return (
    <ListSection title={q ? 'Results' : 'Nearby'}>
      {results.length === 0 && <p className="px-4 py-6 text-sm text-muted-foreground">No matches</p>}
      {results.map((i) => (
        <ListRow
          key={i.id}
          leading={<ItemThumb item={i} collected={collected.includes(i.id)} />}
          title={i.title}
          subtitle={[q && layerLabel(i.layer), i.place.name, i.status].filter(Boolean).join(' · ')}
          done={collected.includes(i.id)}
          onClick={() => onSelect(i.id)}
        />
      ))}
    </ListSection>
  )
}

function ListSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="px-4 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h2>
      {children}
    </section>
  )
}

// Same shapes as on the map; crew fall back to an icon
function ItemThumb({ item, collected }: { item: MapItem; collected?: boolean }) {
  if (item.kind === 'pin') {
    return (
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted">
        <PinShape shape={item.pin!.shape} status={item.pin!.status} collected={collected} className="size-9" />
      </div>
    )
  }
  if (item.shape) {
    return (
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full border bg-background">
        <ShapeIcon shape={item.shape} className="size-5" />
      </div>
    )
  }
  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-muted">
      <KindIcon kind={item.kind} className="size-5" />
    </div>
  )
}

function ListRow({
  leading,
  title,
  subtitle,
  done,
  onClick,
}: {
  leading?: ReactNode
  title: string
  subtitle: string
  done?: boolean
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted">
      {leading ?? <div className="size-12 shrink-0 rounded-xl border bg-muted" />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {done ? <Check className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
    </button>
  )
}

// ---- Nearby cards (shown when a marker is selected) ----

function NearbyCards({
  items,
  collected,
  onSwipe,
  onClose,
}: {
  items: MapItem[]
  collected: string[]
  onSwipe: (id: string) => void
  onClose: () => void
}) {
  const navigate = useNavigate()
  const settle = useRef<number | undefined>(undefined)

  // After a swipe settles, select the card closest to the center
  function onScroll(e: UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    window.clearTimeout(settle.current)
    settle.current = window.setTimeout(() => {
      const center = el.scrollLeft + el.clientWidth / 2
      const offsets = Array.from(el.children as HTMLCollectionOf<HTMLElement>).map((c) =>
        Math.abs(c.offsetLeft + c.offsetWidth / 2 - center),
      )
      onSwipe(items[offsets.indexOf(Math.min(...offsets))].id)
    }, 120)
  }

  return (
    <div className="absolute inset-x-0 bottom-[calc(max(env(safe-area-inset-bottom),12px)+76px)] z-20">
      <div
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1"
      >
        {items.map((item) => {
          const done = collected.includes(item.id)
          const directions = `https://www.google.com/maps/dir/?api=1&destination=${item.coords[1]},${item.coords[0]}`
          return (
            <article key={item.id} className="w-[85%] shrink-0 snap-start rounded-2xl border bg-background p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <ItemThumb item={item} collected={done} />
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 font-heading leading-tight font-semibold">{item.title}</h3>
                  <p className="truncate text-xs text-muted-foreground">{item.place.name}</p>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose} className="-mt-1 -mr-1">
                  <X />
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="max-w-full">
                  <StatusIcon item={item} />
                  <span className="truncate">{item.status}</span>
                </Badge>
                {item.meta && (
                  <Badge variant="outline" className="max-w-full">
                    <Users data-icon="inline-start" />
                    <span className="truncate">{item.meta}</span>
                  </Badge>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button size="lg" disabled={done} onClick={() => navigate(item.action.to)}>
                  {done ? 'Collected' : item.action.label}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  nativeButton={false}
                  render={<a href={directions} target="_blank" rel="noreferrer" />}
                >
                  <Navigation data-icon="inline-start" />
                  Navigate
                </Button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function StatusIcon({ item }: { item: MapItem }) {
  if (item.pin?.status === 'locked') return <Lock data-icon="inline-start" />
  if (item.kind === 'live') return <Radio data-icon="inline-start" />
  if (item.kind === 'watch') return <Tv data-icon="inline-start" />
  if (item.kind === 'shop') return <Gift data-icon="inline-start" />
  return <Clock data-icon="inline-start" />
}
