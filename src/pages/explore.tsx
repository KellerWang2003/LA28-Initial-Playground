import { useEffect, useRef, useState, type ReactNode, type UIEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Check, ChevronRight, Clock, Gift, Layers, Lock, LocateFixed, Radio, Search, Tv, Users, X } from 'lucide-react'
import { MapView, UserDot, type MapPadding, type MapStyle, type MapViewHandle } from '@/components/map-view'
import { BottomSheet, MIN_HEIGHT, type Snap } from '@/components/bottom-sheet'
import { BatonMarker, DropSpotMarker } from '@/components/baton-art'
import { CARRY_BAR_SPACE } from '@/components/carry-bar'
import { ProfileButton } from '@/components/profile-button'
import { PassportButton } from '@/components/passport-button'
import { KindIcon, PinShape, PinStatusChip, PinStatusText } from '@/components/pin-art'
import { ShapeIcon, ShapeSticker } from '@/components/shape-art'
import { VenueOutline } from '@/components/venue-art'
import { ImagePlaceholder } from '@/components/image-placeholder'
import { LiveTimer } from '@/components/live-timer'
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
import { placeCoords, useFanAt, useFanLocation } from '@/lib/location'
import { dropSpotFor, getBatons, openBatonCard, startDrop, useBatons, useCarried, useOpenCard } from '@/lib/batons'
import { cn } from '@/lib/utils'
import { pinById, pinCountdownTarget, pinKindLabel, placeById, type Pin } from '@/data/la28'
import { BATON_SPOTS } from '@/data/batons'
import { bonusesFor } from '@/data/bonuses'
import { FAKE_USER_LOCATION, allItems, distance, formatMinutes, layers, mapLayers, travelFromYou, type Layer, type LngLat, type MapItem } from '@/data/map-layers'

const mapStyles: { id: MapStyle; label: string }[] = [
  { id: 'light', label: 'Default' },
  { id: 'streets', label: 'Streets' },
  { id: 'satellite', label: 'Satellite' },
  { id: 'mist', label: 'Mist' },
]

const USER_MARKER = 'me'

// Holes in the mist: where you are, and every place you've already collected.
function mistOpenings(collected: string[], here: LngLat): LngLat[] {
  const spots: LngLat[] = [here]
  for (const id of collected) {
    const pin = pinById(id)
    if (!pin) continue
    const place = placeById(pin.place)
    spots.push([place.lng, place.lat])
  }
  return spots
}
// Baton markers sit beside whatever pin is at the same spot
const BATON_MARKER = 'baton:'
const DROP_MARKER = 'drop:'
const BATON_OFFSET: [number, number] = [34, -8]
const DROP_OFFSET: [number, number] = [-34, -4]
// Zoom level from which every pin shows its status label
const LABEL_ZOOM = 12

// Space taken by overlays, so the map centers things in the visible area
// Bottom also leaves room for labels hanging under markers
const SHEET_PADDING: MapPadding = { top: 112, bottom: 400, left: 72, right: 80 }
// The baton card covers most of the screen; keep its spot in the strip above it
const BATON_CARD_PADDING: MapPadding = { top: 72, bottom: 520, left: 48, right: 48 }
// Cards are taller for pins (photo strip), so leave more room under the selected marker
const CARDS_PADDING: MapPadding = { top: 96, bottom: 400, left: 48, right: 48 }
// Placeholder photos per place until real ones exist
const PLACE_PHOTOS = 5

// Pins that frame the map when the Pins filter is on.
// An unfiltered map keeps this many of the nearest relevant markers.
const PIN_ROW = 14
const MIX_CAP = 14

// Lower is more relevant. Distance leads; live and expiring only nudge things
// that are already nearby, so a pin across the city doesn't jump the row.
function relevance(item: MapItem) {
  const km = distance(item.coords, FAKE_USER_LOCATION) * 111
  let penalty = km
  if (km <= 8) {
    if (item.liveSince) penalty -= 2
    if (item.pin?.status === 'expiring') penalty -= 1.5
  }
  return penalty
}

const rank = (items: MapItem[]) => [...items].sort((a, b) => relevance(a) - relevance(b))

// Frame the items nearest you rather than all of LA; the rest are a pan away
const NEAREST = 15
const nearestCoords = (items: MapItem[]) => [
  ...[...items]
    .sort((a, b) => distance(a.coords, FAKE_USER_LOCATION) - distance(b.coords, FAKE_USER_LOCATION))
    .slice(0, NEAREST)
    .map((i) => i.coords),
  FAKE_USER_LOCATION,
]
const initialBounds = nearestCoords(mapLayers.pins)

export default function ExplorePage() {
  const mapRef = useRef<MapViewHandle>(null)
  const collected = useCollected()
  const [snap, setSnap] = useState<Snap>('min')
  // A filter pill, or none: no selection shows the most relevant of everything
  const [layer, setLayer] = useState<Layer | null>('pins')
  const [query, setQuery] = useState('')
  // anchorId fixes the order of the "nearby" cards; selectedId follows swipes
  const [anchorId, setAnchorId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mapStyle, setMapStyle] = useState<MapStyle>('light')
  const [threeD, setThreeD] = useState(false)
  const [showLabels, setShowLabels] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const fan = useFanAt()
  const fanLocation = useFanLocation()
  const batons = useBatons()
  const carried = useCarried()
  const openCard = useOpenCard()
  // Batons show under every filter. A carried one is on nobody's map; instead
  // the carrier sees where it can go (any other significant spot).
  const restingBatons = batons.filter((b) => b.state === 'resting')
  const dropSpots = carried ? BATON_SPOTS.filter((s) => s !== carried.spot) : []
  const dropHere = dropSpotFor(carried, fan)

  const pinRow = rank(mapLayers.pins).slice(0, PIN_ROW)
  const mix = rank(allItems).slice(0, MIX_CAP)
  // Pins filter keeps every pin (you're looking for them). No filter keeps a short mix.
  const visibleItems = layer === null ? mix : layer === 'pins' ? mapLayers.pins : mapLayers[layer]
  const itemById = (id: string) => allItems.find((i) => i.id === id)!
  const markers = [
    ...visibleItems.map((i) => ({ id: i.id, coords: i.coords, offset: i.offset })),
    ...restingBatons.map((b) => ({ id: BATON_MARKER + b.id, coords: placeCoords(b.spot), offset: BATON_OFFSET })),
    ...dropSpots.map((s) => ({ id: DROP_MARKER + s, coords: placeCoords(s), offset: DROP_OFFSET })),
    { id: USER_MARKER, coords: fanLocation },
  ]

  // A nearby alert or a drop links here with ?baton=: center on it and open its card
  const batonParam = searchParams.get('baton')
  useEffect(() => {
    if (!batonParam) return
    setSearchParams({}, { replace: true })
    const baton = getBatons().find((b) => b.id === batonParam)
    if (!baton) return
    if (baton.state === 'resting') openBatonCard(baton.id)
    mapRef.current?.flyTo(placeCoords(baton.spot), BATON_CARD_PADDING)
  }, [batonParam, setSearchParams])

  function openBaton(id: string) {
    const baton = batons.find((b) => b.id === id)
    if (!baton) return
    clearSelection()
    openBatonCard(id)
    mapRef.current?.flyTo(placeCoords(baton.spot), BATON_CARD_PADDING)
  }

  // Tapping the drop spot you're standing at starts the drop; others just come into view
  function onDropSpot(spot: string) {
    if (spot === dropHere) startDrop()
    else mapRef.current?.flyTo(placeCoords(spot), SHEET_PADDING)
  }

  function onMarkerClick(id: string) {
    if (id === USER_MARKER) return
    if (id.startsWith(BATON_MARKER)) return openBaton(id.slice(BATON_MARKER.length))
    if (id.startsWith(DROP_MARKER)) return onDropSpot(id.slice(DROP_MARKER.length))
    select(id)
  }

  const nearby = anchorId
    ? [...visibleItems].sort((a, b) => distance(a.coords, itemById(anchorId).coords) - distance(b.coords, itemById(anchorId).coords))
    : []

  function select(id: string) {
    const item = itemById(id)
    // A chosen filter follows a search result onto that result's layer
    if (layer !== null && item.layer !== layer) setLayer(item.layer)
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
    const selected = layer === next ? null : next
    setLayer(selected)
    clearSelection()
    const items = selected === null ? mix : selected === 'pins' ? pinRow : mapLayers[selected]
    if (items.length) mapRef.current?.fitTo(nearestCoords(items), SHEET_PADDING)
  }

  function renderMarker(id: string) {
    if (id === USER_MARKER) return <UserDot />
    if (id.startsWith(BATON_MARKER)) {
      const baton = batons.find((b) => BATON_MARKER + b.id === id)
      return baton ? <BatonMarker theme={baton.theme} selected={openCard === baton.id} /> : null
    }
    if (id.startsWith(DROP_MARKER)) {
      const spot = id.slice(DROP_MARKER.length)
      return <DropSpotMarker here={spot === dropHere} label={placeById(spot).name} />
    }
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
    // Starts below the status bar so the map never sits under it (iOS blurs whatever is there)
    <div className="absolute inset-x-0 top-[env(safe-area-inset-top)] bottom-0">
      <MapView
        ref={mapRef}
        markers={markers}
        renderMarker={renderMarker}
        selectedId={selectedId}
        onMarkerClick={onMarkerClick}
        onBackgroundClick={clearSelection}
        onZoomChange={(z) => setShowLabels(z >= LABEL_ZOOM)}
        initialBounds={initialBounds}
        initialPadding={SHEET_PADDING}
        mapStyle={mapStyle}
        threeD={threeD}
        revealed={mapStyle === 'mist' ? mistOpenings(collected, fanLocation) : undefined}
      />

      {/* Top right: profile + map options (hidden while the sheet is fully open) */}
      <div
        className={cn(
          'absolute top-3 right-4 z-20 flex flex-col items-end gap-3 transition-[opacity,translate] duration-300',
          snap === 'full' && 'pointer-events-none -translate-y-2 opacity-0',
        )}
        aria-hidden={snap === 'full'}
      >
        <ProfileButton className="shadow-md" />
        <div className="flex flex-col overflow-hidden rounded-full border bg-background shadow-md">
          <Button
            variant="ghost"
            size="icon-lg"
            className="rounded-none text-sm font-semibold"
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
        // Room for the carry bar above the tab bar
        minHeight={carried ? MIN_HEIGHT + CARRY_BAR_SPACE : undefined}
        accessory={
          <>
            <Button
              variant="outline"
              size="icon"
              className="size-12 rounded-full bg-background shadow-md"
              aria-label="My location"
              onClick={() => mapRef.current?.flyTo(fanLocation, SHEET_PADDING)}
            >
              <LocateFixed className="size-5" />
            </Button>
            <PassportButton />
          </>
        }
        header={
          <div className="px-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSnap('full')}
                placeholder="Search pins, events, places, people"
                className="h-12 rounded-full pl-11 text-base"
              />
            </div>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto overscroll-x-contain px-4 py-3">
              {layers.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={layer === l.id}
                  onClick={() => changeLayer(l.id)}
                  className={cn(
                    'h-10 shrink-0 rounded-full border px-4 text-[15px] transition-transform active:scale-95',
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
        <SheetList layer={layer} query={query} mix={mix} collected={collected} revealed={snap !== 'min'} onSelect={select} />
      </BottomSheet>

      {anchorId && (
        <NearbyCards
          key={anchorId}
          items={nearby}
          collected={collected}
          onSwipe={onCardSwipe}
          onClose={clearSelection}
          lift={carried ? CARRY_BAR_SPACE : 0}
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
  // Locked and expiring pins carry a countdown that never hides
  const countdown = !!item.pin && !!pinCountdownTarget(item.pin) && !collected
  return (
    <div className="relative flex cursor-pointer flex-col items-center [perspective:400px]">
      <div data-marker-body className={cn('relative transition-transform', selected && 'scale-125')}>
        <MarkerVisual item={item} selected={selected} collected={collected} />
        {countdown && !selected && (
          <span
            data-marker-badge
            data-urgency={pinCountdownTarget(item.pin!)}
            className="absolute bottom-full left-1/2 mb-0.5 -translate-x-1/2"
          >
            <PinStatusChip pin={item.pin!} />
          </span>
        )}
      </div>
      {/* Name under every marker; games add sport + timer, pins their status when zoomed in */}
      <div
        data-marker-label
        className={cn(
          'absolute top-full flex w-max max-w-32 flex-col items-center gap-0.5 text-center [text-shadow:0_0_3px_var(--background),0_0_3px_var(--background),0_0_3px_var(--background)]',
          selected ? 'mt-3' : 'mt-1',
        )}
      >
        <span className="line-clamp-2 text-[11px] leading-tight font-semibold">{item.label}</span>
        {item.subtitle && (
          <span className="flex max-w-full items-center gap-1 text-[10px] leading-tight font-medium text-muted-foreground">
            {item.shape && <ShapeIcon shape={item.shape} className="size-3 shrink-0" strokeWidth={2.5} />}
            <span className="truncate">{item.subtitle}</span>
          </span>
        )}
        {item.liveSince && <LiveTimer since={item.liveSince} className="mt-0.5 [text-shadow:none]" />}
        {/* Full status when selected; "Open" when zoomed in (countdowns sit on top) */}
        {item.pin && (selected || (showLabel && !countdown)) && (
          <PinStatusChip pin={item.pin} collected={collected} verbose={selected} />
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

  // People: avatar with their initial
  if (item.kind === 'person') {
    return (
      <div className="flex size-10 items-center justify-center rounded-full border-2 border-background bg-foreground text-sm font-semibold text-background shadow-md ring-2 ring-foreground">
        {item.label[0]}
      </div>
    )
  }

  // Games: a tile with the venue's outline (live adds a dot)
  if (item.venue) {
    return (
      <div
        className={cn(
          'relative flex h-11 w-[68px] items-center justify-center rounded-xl border bg-background shadow-md',
          selected && 'border-primary bg-primary text-primary-foreground',
        )}
      >
        <VenueOutline venue={item.venue} className="h-8 w-14" />
        {item.liveSince && (
          <span className="absolute -top-1 -right-1 size-3 animate-pulse rounded-full border-2 border-background bg-red-500" />
        )}
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
      {item.liveSince && (
        <span className="absolute -top-0.5 -right-0.5 size-3 animate-pulse rounded-full border-2 border-background bg-red-500" />
      )}
    </div>
  )
}

// ---- Sheet list ----

// Every pin is collected with a photo; some have bonuses on top
function collectMethod(pin: Pin) {
  const bonuses = bonusesFor(pin.id).length
  return bonuses ? `Snap a photo · ${bonuses} bonus` : 'Snap a photo'
}

function SheetList({
  layer,
  query,
  mix,
  collected,
  revealed,
  onSelect,
}: {
  layer: Layer | null
  query: string
  mix: MapItem[]
  collected: string[]
  revealed: boolean
  onSelect: (id: string) => void
}) {
  const q = query.trim().toLowerCase()
  const layerLabel = (l: Layer) => layers.find((x) => x.id === l)!.label

  // Searching looks across every layer; otherwise list the current one
  const source = q ? allItems : layer && layer !== 'pins' ? mapLayers[layer] : []
  const results = source
    .filter((i) => !q || `${i.title} ${i.place.name} ${i.place.hood}`.toLowerCase().includes(q))
    .sort((a, b) => distance(a.coords, FAKE_USER_LOCATION) - distance(b.coords, FAKE_USER_LOCATION))

  const row = (i: MapItem) => (
    <ListRow
      key={i.id}
      leading={<ItemThumb item={i} collected={collected.includes(i.id)} />}
      title={i.title}
      subtitle={[q && layerLabel(i.layer), i.place.name, i.status].filter(Boolean).join(' · ')}
      done={collected.includes(i.id)}
      onClick={() => onSelect(i.id)}
    />
  )

  if (!q && layer === 'saved') {
    return <p className="px-4 py-10 text-center text-sm text-muted-foreground">Nothing saved yet</p>
  }

  // No filter: the other relevant things nearby
  if (!q && layer === null) {
    const rest = mix.filter((i) => i.kind !== 'pin')
    if (!rest.length) return null
    return <ListSection title="Also nearby">{rest.map(row)}</ListSection>
  }

  // Pins filter: every collectible pin.
  // Hidden at the smallest snap so only search and the filter chips remain.
  if (!q && layer === 'pins') {
    if (!revealed) return null
    const pins = rank(mapLayers.pins)
    return (
      <div className="space-y-3 pb-2">
        {pins.map((i) => (
          <PinCard key={i.id} item={i} collected={collected.includes(i.id)} />
        ))}
      </div>
    )
  }

  // Layers with sections (Watch parties) list each section separately, in layer order
  const sections =
    !q && layer && layer !== 'pins' ? [...new Set(mapLayers[layer].flatMap((i) => (i.section ? [i.section] : [])))] : []
  if (sections.length) {
    return (
      <div className="space-y-4">
        {sections.map((section) => (
          <ListSection key={section} title={section}>
            {results.filter((i) => i.section === section).map(row)}
          </ListSection>
        ))}
      </div>
    )
  }

  return (
    <ListSection title={q ? 'Results' : 'Nearby'}>
      {results.length === 0 && <p className="px-4 py-6 text-sm text-muted-foreground">No matches</p>}
      {results.map(row)}
    </ListSection>
  )
}

// One collectible pin: the pin on its place, how far, how you collect it, and a few photos.
const CARD_PHOTOS = 4

function PinCard({ item, collected }: { item: MapItem; collected: boolean }) {
  const pin = item.pin!
  const trip = travelFromYou(item.coords)
  return (
    <Link
      to={item.to}
      className="mx-4 block w-[calc(100%-2rem)] overflow-hidden rounded-2xl border bg-background text-left active:bg-muted"
    >
      <div className="flex items-start gap-3 p-3">
        <div className="relative h-[4.75rem] w-[4.75rem] shrink-0">
          <ImagePlaceholder className="size-full" />
          <PinShape
            shape={pin.shape}
            status={pin.status}
            collected={collected}
            className="absolute bottom-1 left-1/2 size-11 -translate-x-1/2 drop-shadow-md"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">{pin.name}</p>
            {collected ? (
              <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">{formatMinutes(trip.walk)} walk</p>
          <p className="truncate text-xs tabular-nums">{collected ? 'Collected' : <PinStatusText pin={pin} verbose />}</p>
          <p className="truncate text-xs text-muted-foreground">{collectMethod(pin)}</p>
          <p className="truncate text-xs text-muted-foreground">
            {pinKindLabel[pin.kind]} · {pin.rarity}
          </p>
        </div>
      </div>
      {/* Padding sits outside the scroller so the first and last thumbs stay inset */}
      <div className="px-3 pb-3">
        <div aria-label={`Photos of ${item.place.name}`} className="no-scrollbar flex snap-x gap-2 overflow-x-auto overscroll-x-contain">
          {Array.from({ length: CARD_PHOTOS }, (_, i) => (
            <ImagePlaceholder key={i} className="aspect-[4/3] w-[calc((100%-1rem)/3.15)] shrink-0 snap-start" />
          ))}
        </div>
      </div>
    </Link>
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
  if (item.venue) {
    return (
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-background">
        <VenueOutline venue={item.venue} className="w-10" />
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
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted active:bg-muted">
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
  lift,
}: {
  items: MapItem[]
  collected: string[]
  onSwipe: (id: string) => void
  onClose: () => void
  // Extra space above the tab bar (the carry bar)
  lift: number
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
    <div
      className="absolute inset-x-0 z-20"
      style={{ bottom: `calc(4rem + max(env(safe-area-inset-bottom), 1rem) + 12px + ${lift}px)` }}
    >
      <div
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-[7.5vw] pb-1"
      >
        {items.map((item) => {
          const done = collected.includes(item.id)
          // Info only; the whole card opens the detail page
          return (
            <article
              key={item.id}
              role="link"
              tabIndex={0}
              aria-label={item.title}
              onClick={() => navigate(item.to)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(item.to)}
              className="w-[85vw] shrink-0 cursor-pointer snap-center rounded-2xl border bg-background p-4 shadow-lg transition-transform active:scale-[0.98]"
            >
              <div className="flex items-start gap-3">
                <ItemThumb item={item} collected={done} />
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 font-heading leading-tight font-semibold">{item.title}</h3>
                  <p className="truncate text-xs text-muted-foreground">{item.place.name}</p>
                  {item.subtitle && (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      {item.shape && <ShapeIcon shape={item.shape} className="size-3 shrink-0" />}
                      {item.subtitle.split(' · ')[0]}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                  }}
                  className="-mt-1 -mr-1"
                >
                  <X />
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {item.liveSince && <LiveTimer since={item.liveSince} className="h-5 px-2 text-xs shadow-none" />}
                <Badge variant="secondary" className="max-w-full">
                  <StatusIcon item={item} />
                  <span className="truncate tabular-nums">{item.pin ? <PinStatusText pin={item.pin} verbose /> : item.status}</span>
                </Badge>
                {item.meta && (
                  <Badge variant="outline" className="max-w-full">
                    <Users data-icon="inline-start" />
                    <span className="truncate">{item.meta}</span>
                  </Badge>
                )}
              </div>

              {/* Pins: photos of the place so you know what you're looking for */}
              {item.pin && (
                <div
                  aria-label={`Photos of ${item.place.name}`}
                  className="no-scrollbar -mx-4 mt-3 flex snap-x gap-2 overflow-x-auto overscroll-x-contain scroll-px-4 px-4"
                >
                  {Array.from({ length: PLACE_PHOTOS }, (_, i) => (
                    <ImagePlaceholder key={i} className="h-20 w-28 shrink-0 snap-start" />
                  ))}
                </div>
              )}

              {item.lines && item.lines.length > 0 && (
                <div className="mt-3 space-y-0.5 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Coming up</p>
                  {item.lines.map((line) => (
                    <p key={line} className="truncate">
                      {line}
                    </p>
                  ))}
                </div>
              )}

              {/* Events, games and shops award a pin; it isn't drawn on the map */}
              {item.reward && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted px-2.5 py-2 text-xs">
                  <ShapeSticker shape={item.reward.shape} className="size-6 text-foreground" />
                  <span className="min-w-0 flex-1 truncate">
                    <span className="text-muted-foreground">Earn the </span>
                    <span className="font-medium">{item.reward.name}</span>
                  </span>
                  {collected.includes(item.reward.id) && <Check className="size-4 text-muted-foreground" />}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}

function StatusIcon({ item }: { item: MapItem }) {
  if (item.pin?.status === 'locked') return <Lock data-icon="inline-start" />
  if (item.liveSince && item.kind === 'game') return <Radio data-icon="inline-start" />
  if (item.section === 'Public') return <Tv data-icon="inline-start" />
  if (item.kind === 'shop') return <Gift data-icon="inline-start" />
  return <Clock data-icon="inline-start" />
}
