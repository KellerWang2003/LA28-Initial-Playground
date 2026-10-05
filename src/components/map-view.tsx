import { useEffect, useImperativeHandle, useRef, useState, type ReactNode, type Ref } from 'react'
import { createPortal } from 'react-dom'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { LA28_AREA_RINGS, MAP_LIMIT, type LngLat } from '@/data/map-layers'

const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

// offset: pixel shift, e.g. so an event doesn't cover a pin at the same place
export type MapMarker = { id: string; coords: LngLat; offset?: [number, number] }

export type MapPadding = { top: number; bottom: number; left: number; right: number }

export type MapViewHandle = {
  flyTo: (coords: LngLat, padding: MapPadding) => void
  fitTo: (coords: LngLat[], padding: MapPadding) => void
}

export type MapStyle = 'light' | 'streets' | 'satellite'

const styleUrls: Record<MapStyle, string> = {
  light: 'mapbox://styles/mapbox/light-v11',
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
}

const BUILDINGS_LAYER = '3d-buildings'
const AREA_DIM = 'la28-area-dim'
const AREA_LINE = 'la28-area-line'
const AREA_SOURCE = 'la28-area'

// Extruded buildings for 3D mode. Classic Mapbox styles carry building
// heights in the `composite` source but don't draw them in 3D by default.
function setBuildings(map: mapboxgl.Map, on: boolean) {
  const exists = !!map.getLayer(BUILDINGS_LAYER)
  if (on && !exists && map.getSource('composite')) {
    map.addLayer(
      {
        id: BUILDINGS_LAYER,
        type: 'fill-extrusion',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        minzoom: 13,
        paint: {
          'fill-extrusion-color': '#d4d4d4',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.7,
        },
      },
      // Keep the Games highlight above the buildings
      map.getLayer(AREA_DIM) ? AREA_DIM : undefined,
    )
  } else if (!on && exists) {
    map.removeLayer(BUILDINGS_LAYER)
  }
}

type Props = {
  markers: MapMarker[]
  renderMarker: (id: string) => ReactNode
  selectedId?: string | null
  onMarkerClick?: (id: string) => void
  onBackgroundClick?: () => void
  onZoomChange?: (zoom: number) => void
  initialBounds: LngLat[]
  initialPadding: MapPadding
  mapStyle?: MapStyle
  threeD?: boolean
  // false for a static preview map (no pan, zoom or rotate)
  interactive?: boolean
  // Visited places. Each one opens a soft hole in the mist. Omit for a clear map.
  revealed?: LngLat[]
  ref?: Ref<MapViewHandle>
}

const overlaps = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

// Hide marker text that would collide, like map apps do.
// 1. Countdown badges ([data-marker-badge]) only avoid each other; the soonest
//    deadline (smallest data-urgency, an ISO time) wins.
// 2. Name labels ([data-marker-label]) avoid badges, other labels and marker
//    bodies ([data-marker-body]); the selected marker (raised z-index) wins.
function declutterLabels(markers: Iterable<mapboxgl.Marker>) {
  const els = [...markers].map((m) => m.getElement()).sort((a, b) => Number(b.style.zIndex || 0) - Number(a.style.zIndex || 0))
  const bodies = els.flatMap((el) => [...el.querySelectorAll('[data-marker-body]')].map((b) => b.getBoundingClientRect()))
  const placed: DOMRect[] = []

  function place(node: HTMLElement, avoidBodies: boolean) {
    node.style.visibility = ''
    const rect = node.getBoundingClientRect()
    const hidden = placed.some((r) => overlaps(r, rect)) || (avoidBodies && bodies.some((r) => overlaps(r, rect)))
    node.style.visibility = hidden ? 'hidden' : ''
    if (!hidden) placed.push(rect)
  }

  els
    .flatMap((el) => [...el.querySelectorAll<HTMLElement>('[data-marker-badge]')])
    .sort((a, b) => (a.dataset.urgency ?? '').localeCompare(b.dataset.urgency ?? ''))
    .forEach((badge) => place(badge, false))
  els.forEach((el) => {
    const label = el.querySelector<HTMLElement>('[data-marker-label]')
    if (label) place(label, true)
  })
}

function boundsOf(coords: LngLat[]) {
  const b = new mapboxgl.LngLatBounds(coords[0], coords[0])
  coords.forEach((c) => b.extend(c))
  return b
}

const limit = new mapboxgl.LngLatBounds(MAP_LIMIT[0], MAP_LIMIT[1])

function closeRing(ring: LngLat[]) {
  const first = ring[0]
  const last = ring[ring.length - 1]
  return first[0] === last[0] && first[1] === last[1] ? ring : [...ring, first]
}

// Positive when the ring runs counterclockwise
function signedArea(ring: LngLat[]) {
  let sum = 0
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[(i + 1) % ring.length]
    sum += x1 * y2 - x2 * y1
  }
  return sum
}

// A hole in the shade is clockwise
function asHole(ring: LngLat[]) {
  const closed = closeRing(ring)
  return signedArea(closed) > 0 ? [...closed].reverse() : closed
}

const areaHoles = LA28_AREA_RINGS.map(asHole)

// World with the Games region cut out, so only the surroundings are shaded
const areaMask = {
  type: 'Feature' as const,
  properties: {},
  geometry: {
    type: 'Polygon' as const,
    coordinates: [
      [
        [-180, -85],
        [180, -85],
        [180, 85],
        [-180, 85],
        [-180, -85],
      ],
      ...areaHoles,
    ],
  },
}
const areaOutline = {
  type: 'Feature' as const,
  properties: {},
  geometry: { type: 'MultiLineString' as const, coordinates: areaHoles },
}

const MIST_SOURCE = 'la28-mist'
const MIST_LAYER = 'la28-mist'
// Clear core, then a long feather back into fog. Meters on the ground.
const MIST_CLEAR_M = 3200
const MIST_FADE_M = 8600

const MIST_WEST = MAP_LIMIT[0][0]
const MIST_SOUTH = MAP_LIMIT[0][1]
const MIST_EAST = MAP_LIMIT[1][0]
const MIST_NORTH = MAP_LIMIT[1][1]

// Top-left, top-right, bottom-right, bottom-left. The canvas is stretched
// across this region, so the fog is part of the map rather than the screen.
const MIST_COORDINATES: [[number, number], [number, number], [number, number], [number, number]] = [
  [MIST_WEST, MIST_NORTH],
  [MIST_EAST, MIST_NORTH],
  [MIST_EAST, MIST_SOUTH],
  [MIST_WEST, MIST_SOUTH],
]

function mercatorX(lng: number) {
  return (lng + 180) / 360
}

function mercatorY(lat: number) {
  const rad = (lat * Math.PI) / 180
  return (1 - Math.log(Math.tan(Math.PI / 4 + rad / 2)) / Math.PI) / 2
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Draw fog in mercator space so each opening is a circle on the map.
// The canvas is pinned to MIST_COORDINATES; panning moves the mist with the ground.
function paintMist(canvas: HTMLCanvasElement, revealed: LngLat[]) {
  const x0 = mercatorX(MIST_WEST)
  const y0 = mercatorY(MIST_NORTH)
  const xSpan = mercatorX(MIST_EAST) - x0
  const ySpan = mercatorY(MIST_SOUTH) - y0
  const max = 2048
  let width = max
  let height = Math.max(1, Math.round((max * ySpan) / xSpan))
  if (height > max) {
    height = max
    width = Math.max(1, Math.round((max * xSpan) / ySpan))
  }
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, width, height)
  ctx.globalCompositeOperation = 'source-over'
  // Cool gray veil, lighter than a slab and darker than the basemap,
  // so a visited neighborhood reads as a bright opening.
  ctx.fillStyle = 'rgba(198, 206, 212, 0.84)'
  ctx.fillRect(0, 0, width, height)

  const rand = mulberry32(28)
  for (let i = 0; i < 42; i++) {
    const x = rand() * width
    const y = rand() * height
    const r = (0.04 + rand() * 0.08) * width
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    const alpha = 0.035 + rand() * 0.09
    g.addColorStop(0, rand() > 0.4 ? `rgba(255,255,255,${alpha})` : `rgba(198,208,214,${alpha})`)
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  const unitsPerMeter = 1 / (Math.cos((34.05 * Math.PI) / 180) * 2 * Math.PI * 6378137)
  const pxPerUnit = width / xSpan
  const clearPx = MIST_CLEAR_M * unitsPerMeter * pxPerUnit
  const fadePx = MIST_FADE_M * unitsPerMeter * pxPerUnit

  ctx.globalCompositeOperation = 'destination-out'
  for (const [lng, lat] of revealed) {
    const x = ((mercatorX(lng) - x0) / xSpan) * width
    const y = ((mercatorY(lat) - y0) / ySpan) * height
    const g = ctx.createRadialGradient(x, y, clearPx, x, y, fadePx)
    g.addColorStop(0, 'rgba(0,0,0,1)')
    g.addColorStop(0.4, 'rgba(0,0,0,0.9)')
    g.addColorStop(0.72, 'rgba(0,0,0,0.34)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, fadePx, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalCompositeOperation = 'source-over'
}

function mistCanvas(ref: { current: HTMLCanvasElement | null }) {
  if (!ref.current) ref.current = document.createElement('canvas')
  return ref.current
}

// `revealed` omitted: no fog. An empty list: the whole region stays misty.
// Adding the Games overlay marks the style busy, so a call in that same turn
// waits until the map is idle before attaching the fog.
function syncMist(map: mapboxgl.Map, canvas: HTMLCanvasElement, revealed: LngLat[] | undefined, tries = 0) {
  if (!map.getStyle()) return
  if (!map.isStyleLoaded()) {
    if (tries > 5) return
    map.once('idle', () => syncMist(map, canvas, revealed, tries + 1))
    return
  }
  if (!revealed) {
    if (map.getLayer(MIST_LAYER)) map.removeLayer(MIST_LAYER)
    if (map.getSource(MIST_SOURCE)) map.removeSource(MIST_SOURCE)
    return
  }
  paintMist(canvas, revealed)
  if (!map.getSource(MIST_SOURCE)) {
    map.addSource(MIST_SOURCE, {
      type: 'canvas',
      canvas,
      coordinates: MIST_COORDINATES,
      animate: false,
    })
    map.addLayer({
      id: MIST_LAYER,
      type: 'raster',
      source: MIST_SOURCE,
      paint: {
        'raster-fade-duration': 0,
        'raster-resampling': 'linear',
        'raster-opacity': 1,
      },
    })
    return
  }
  // Copy the redrawn canvas on the next frame, then stop so the map can idle.
  const source = map.getSource(MIST_SOURCE) as mapboxgl.CanvasSource
  source.play()
  map.once('render', () => source.pause())
}

// Shade everywhere except the Games region, and trace that region.
// A new style drops custom layers, so this runs again after each style load.
function showGamesArea(map: mapboxgl.Map, style: MapStyle) {
  if (!map.isStyleLoaded() || map.getSource(AREA_SOURCE)) return
  const satellite = style === 'satellite'
  map.addSource(AREA_SOURCE, { type: 'geojson', data: areaMask })
  map.addSource('la28-area-outline', { type: 'geojson', data: areaOutline })
  map.addLayer({
    id: AREA_DIM,
    type: 'fill',
    source: AREA_SOURCE,
    paint: {
      'fill-color': '#000000',
      'fill-opacity': satellite ? 0.35 : 0.14,
    },
  })
  map.addLayer({
    id: AREA_LINE,
    type: 'line',
    source: 'la28-area-outline',
    paint: {
      'line-color': satellite ? '#ffffff' : '#1c1c1c',
      'line-width': satellite ? 2.5 : 2,
      'line-opacity': satellite ? 0.95 : 0.55,
    },
  })
}

// Furthest zoom-out that still fills the view with the allowed region.
// cameraForBounds fits the region inside the screen, which on a wide or tall
// window leaves room to see past it; this is the zoom where the region covers the screen.
function limitZoomOut(map: mapboxgl.Map) {
  const { width, height } = map.getContainer().getBoundingClientRect()
  if (width < 1 || height < 1) return
  const sw = mapboxgl.MercatorCoordinate.fromLngLat(limit.getSouthWest())
  const ne = mapboxgl.MercatorCoordinate.fromLngLat(limit.getNorthEast())
  const zoom = Math.log2(
    Math.max(width / (512 * Math.abs(ne.x - sw.x)), height / (512 * Math.abs(sw.y - ne.y))),
  )
  map.setMinZoom(zoom)
}

export function MapView({
  markers,
  renderMarker,
  selectedId,
  onMarkerClick,
  onBackgroundClick,
  onZoomChange,
  initialBounds,
  initialPadding,
  mapStyle = 'light',
  threeD = false,
  interactive = true,
  revealed,
  ref,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRefs = useRef(new Map<string, mapboxgl.Marker>())
  const [elements, setElements] = useState<Record<string, HTMLElement>>({})

  // Latest callbacks, so the map's listeners never go stale
  const callbacks = useRef({ onMarkerClick, onBackgroundClick, onZoomChange })
  useEffect(() => {
    callbacks.current = { onMarkerClick, onBackgroundClick, onZoomChange }
  })

  const mistCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const revealedRef = useRef(revealed)
  revealedRef.current = revealed

  useImperativeHandle(ref, () => ({
    flyTo: (center, padding) => {
      const map = mapRef.current
      if (!map) return
      map.easeTo({ center, zoom: Math.max(map.getZoom(), 12), padding, duration: 700 })
    },
    fitTo: (coords, padding) => {
      mapRef.current?.fitBounds(boundsOf(coords), { padding, maxZoom: 14, duration: 700 })
    },
  }))

  useEffect(() => {
    if (!token || !containerRef.current) return

    mapboxgl.accessToken = token
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: styleUrls[mapStyle],
      bounds: boundsOf(initialBounds),
      fitBoundsOptions: { padding: initialPadding },
      // Mercator so the bounds limit the view itself. The default globe only
      // pins the center, which still shows well past the region.
      projection: 'mercator',
      maxBounds: limit,
      renderWorldCopies: false,
      attributionControl: false,
      interactive,
    })
    limitZoomOut(map)
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'top-left')
    map.on('click', (e) => {
      // Marker clicks bubble through the canvas container; ignore those
      if ((e.originalEvent.target as HTMLElement).closest('.mapboxgl-marker')) return
      callbacks.current.onBackgroundClick?.()
    })
    map.on('zoom', () => callbacks.current.onZoomChange?.(map.getZoom()))
    map.on('moveend', () => declutterLabels(markerRefs.current.values()))
    map.once('load', () => {
      if (mapRef.current !== map) return
      limitZoomOut(map)
      showGamesArea(map, mapStyle)
      syncMist(map, mistCanvas(mistCanvasRef), revealedRef.current)
      callbacks.current.onZoomChange?.(map.getZoom())
    })
    mapRef.current = map

    // Keep the canvas sized to the container, and the zoom-out limit matched to it
    const observer = new ResizeObserver(() => {
      map.resize()
      limitZoomOut(map)
    })
    observer.observe(containerRef.current)

    const markerMap = markerRefs.current
    return () => {
      observer.disconnect()
      markerMap.clear()
      map.remove()
      mapRef.current = null
    }
    // Initial view only; later moves go through the ref handle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Map style. A new style drops custom layers, so restore 3D buildings after it loads.
  const threeDRef = useRef(threeD)
  const currentStyle = useRef(mapStyle)
  useEffect(() => {
    threeDRef.current = threeD
  })
  useEffect(() => {
    const map = mapRef.current
    if (!map || currentStyle.current === mapStyle) return
    currentStyle.current = mapStyle
    map.setStyle(styleUrls[mapStyle])
    map.once('style.load', () => {
      map.setProjection('mercator')
      setBuildings(map, threeDRef.current)
      showGamesArea(map, mapStyle)
      syncMist(map, mistCanvas(mistCanvasRef), revealedRef.current)
    })
  }, [mapStyle])

  // Repaint openings when the visited places change. The canvas is geographic,
  // so this does not run on pan or zoom.
  const revealedKey = revealed === undefined ? null : revealed.map(([lng, lat]) => `${lng.toFixed(5)},${lat.toFixed(5)}`).join(' ')
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    let gone = false
    const apply = () => {
      if (gone || mapRef.current !== map) return
      syncMist(map, mistCanvas(mistCanvasRef), revealedRef.current)
    }
    if (map.loaded()) apply()
    else map.once('load', apply)
    return () => {
      gone = true
    }
  }, [revealedKey])

  // 2D / 3D: tilt the camera and toggle extruded buildings
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.easeTo({ pitch: threeD ? 60 : 0, bearing: threeD ? -20 : 0, duration: 700 })
    if (map.isStyleLoaded()) setBuildings(map, threeD)
    else map.once('style.load', () => setBuildings(map, threeDRef.current))
  }, [threeD])

  // Sync mapbox markers with the `markers` prop; React renders into their elements
  const markerKey = markers.map((m) => m.id).join(',')
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const current = markerRefs.current
    const wanted = new Set(markers.map((m) => m.id))

    for (const [id, marker] of current) {
      if (!wanted.has(id)) {
        marker.remove()
        current.delete(id)
      }
    }
    for (const m of markers) {
      if (current.has(m.id)) continue
      const el = document.createElement('div')
      el.addEventListener('click', () => callbacks.current.onMarkerClick?.(m.id))
      current.set(m.id, new mapboxgl.Marker({ element: el, anchor: 'center', offset: m.offset }).setLngLat(m.coords).addTo(map))
    }

    setElements(Object.fromEntries([...current].map(([id, marker]) => [id, marker.getElement()])))
    // markerKey captures the identity of the list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerKey])

  // Selected marker sits above the others
  useEffect(() => {
    for (const [id, marker] of markerRefs.current) {
      marker.getElement().style.zIndex = id === selectedId ? '10' : ''
    }
  }, [selectedId, elements])

  // Marker content can change size on any render (labels, status chips), so re-check
  useEffect(() => {
    const frame = requestAnimationFrame(() => declutterLabels(markerRefs.current.values()))
    return () => cancelAnimationFrame(frame)
  })

  if (!token) {
    return (
      <div className="flex size-full items-center justify-center bg-muted p-6 text-center text-sm text-muted-foreground">
        Set VITE_MAPBOX_TOKEN in .env.local to load the map.
      </div>
    )
  }

  return (
    <>
      <div ref={containerRef} className="size-full" />
      {Object.entries(elements).map(([id, el]) => createPortal(renderMarker(id), el, id))}
    </>
  )
}

// "You are here" marker
export function UserDot() {
  return <div className="size-4 rounded-full border-2 border-white bg-blue-500 shadow ring-6 ring-blue-500/20" />
}
