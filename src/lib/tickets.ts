import { useSyncExternalStore } from 'react'
import { setGame } from '@/lib/my-games'

export type TicketSeat = {
  section: string
  row: string
  seat: string
}

export type Ticket = {
  id: string
  sessionId: string
  scannedAt: string
  photoUrl?: string
  seat: TicketSeat
}

const SEED_TICKETS: Ticket[] = [
  {
    id: 't_swim_0720',
    sessionId: 's_swim_0720',
    scannedAt: '2028-07-20T14:30:00Z',
    seat: { section: '108', row: '12', seat: '4' },
  },
]

let tickets: Ticket[] = [...SEED_TICKETS]
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useTickets() {
  return useSyncExternalStore(subscribe, () => tickets)
}

export function getTickets() {
  return tickets
}

export function ticketForSession(sessionId: string) {
  return tickets.find((t) => t.sessionId === sessionId)
}

export function addTicket(ticketData: {
  sessionId: string
  photoUrl?: string
  seat?: Partial<TicketSeat>
}) {
  const existingIndex = tickets.findIndex((t) => t.sessionId === ticketData.sessionId)
  const defaultSeat: TicketSeat = {
    section: String(Math.floor(Math.random() * 200) + 101),
    row: String(Math.floor(Math.random() * 20) + 1),
    seat: String(Math.floor(Math.random() * 25) + 1),
  }

  const newTicket: Ticket = {
    id: `t_${ticketData.sessionId}_${Date.now()}`,
    sessionId: ticketData.sessionId,
    scannedAt: new Date().toISOString(),
    photoUrl: ticketData.photoUrl,
    seat: {
      section: ticketData.seat?.section || defaultSeat.section,
      row: ticketData.seat?.row || defaultSeat.row,
      seat: ticketData.seat?.seat || defaultSeat.seat,
    },
  }

  if (existingIndex >= 0) {
    tickets = tickets.map((t, i) => (i === existingIndex ? newTicket : t))
  } else {
    tickets = [newTicket, ...tickets]
  }

  // Scanning a venue ticket registers you as attending at the venue
  setGame(ticketData.sessionId, 'venue')
  emit()
  return newTicket
}

export function removeTicket(id: string) {
  tickets = tickets.filter((t) => t.id !== id)
  emit()
}

export function resetTickets() {
  tickets = [...SEED_TICKETS]
  emit()
}
