import { useEffect, useImperativeHandle, useRef, useState, type ReactNode, type Ref } from 'react'
import { createPortal } from 'react-dom'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { LngLat } from '@/data/map-layers'

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

// Extruded buildings for 3D mode. Classic Mapbox styles carry building
// heights in the `composite` source but don't draw them in 3D by default.
function setBuildings(map: mapboxgl.Map, on: boolean) {
  const exists = !!map.getLayer(BUILDINGS_LAYER)
  if (on && !exists && map.getSource('composite')) {
    map.addLayer({
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
    })
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
      attributionControl: false,
    })
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'top-left')
    map.on('click', (e) => {
      // Marker clicks bubble through the canvas container; ignore those
      if ((e.originalEvent.target as HTMLElement).closest('.mapboxgl-marker')) return
      callbacks.current.onBackgroundClick?.()
    })
    map.on('zoom', () => callbacks.current.onZoomChange?.(map.getZoom()))
    map.on('moveend', () => declutterLabels(markerRefs.current.values()))
    map.once('load', () => callbacks.current.onZoomChange?.(map.getZoom()))
    mapRef.current = map

    // Keep the canvas sized to the container
    const observer = new ResizeObserver(() => map.resize())
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
    map.once('style.load', () => setBuildings(map, threeDRef.current))
  }, [mapStyle])

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
