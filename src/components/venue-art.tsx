import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Line drawings of the actual venues, for game markers. Simplified
// placeholders until real venue illustrations exist. 64x32, stroke only.
const outlines: Record<string, ReactNode> = {
  // Peristyle entrance: arch, columns and the torch
  coliseum: (
    <>
      <path d="M4 28h56M8 28V14h48v14M6 14h52" />
      <path d="M26 28v-8a6 6 0 0 1 12 0v8" />
      <path d="M14 28V18M20 28V18M44 28V18M50 28V18" />
      <path d="M30 14V9h4v5" />
      <path d="M32 9c-1.6-1.6-1.2-3.6 0-5.5 1.2 1.9 1.6 3.9 0 5.5Z" />
    </>
  ),
  // Floating canopy roof over a sunken bowl
  sofi: (
    <>
      <path d="M2 17c10-7 50-7 60 0" />
      <path d="M2 17c10 2.5 50 2.5 60 0" />
      <path d="M10 19v9M54 19v9" />
      <path d="M15 28v-6h34v6" />
      <path d="M4 28h56" />
    </>
  ),
  // Open oval bowl
  rosebowl: (
    <>
      <ellipse cx="32" cy="10" rx="26" ry="5" />
      <path d="M6 10l6 16h40l6-16" />
      <path d="M20 26l-2.5-11.5M32 26V15M44 26l2.5-11.5" />
      <path d="M4 28h56" />
    </>
  ),
  // Dome with ribbed roof
  intuit: (
    <>
      <path d="M8 28V18c0-6 10.5-11 24-11s24 5 24 11v10" />
      <path d="M8 18h48" />
      <path d="M19 9.5V18M32 7v11M45 9.5V18" />
      <path d="M26 28v-6h12v6" />
      <path d="M4 28h56" />
    </>
  ),
  // Curved arena with a glass front
  cryptoarena: (
    <>
      <path d="M6 28V16c8-6.5 44-6.5 52 0v12" />
      <path d="M6 20c8-4.5 44-4.5 52 0" />
      <path d="M14 28v-8.5M24 28v-9.5M40 28v-9.5M50 28v-8.5" />
      <path d="M27 28v-5h10v5" />
      <path d="M4 28h56" />
    </>
  ),
  // Sand court with a net, by the water
  alamitos: (
    <>
      <path d="M10 25l6-9h32l6 9Z" />
      <path d="M14 20V8M50 20V8M14 10h36M14 14h36" />
      <path d="M4 29c4-2 8 2 12 0s8 2 12 0 8 2 12 0 8 2 12 0 6 2 8 0" />
    </>
  ),
}

export function VenueOutline({ venue, className }: { venue: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      {outlines[venue] ?? <rect x="8" y="8" width="48" height="20" rx="3" />}
    </svg>
  )
}
