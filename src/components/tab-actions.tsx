import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import { CalendarPlus, Plus, ScanQrCode, Search, Ticket } from 'lucide-react'
import { TicketScanSheet } from '@/components/ticket-scan-sheet'
import { ButtonGroup, GROUP_BUTTON } from '@/components/button-group'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// The same add button on Activity, Sports and People: scan someone's code, add a ticket,
// or create an event. Search opens the search page, and only shows where the tab has one.
// Both share one ButtonGroup capsule.
// Rows at least 48px tall, above the 44pt minimum touch target in Apple's guidelines
const MENU_ITEM = 'min-h-12 gap-3 px-4 text-base [&_svg:not([class*=size-])]:size-5'

export function TabActions({
  search,
  ticketSport,
}: {
  // Show the search button
  search?: boolean
  // Sport to guess first when scanning a ticket
  ticketSport?: string
}) {
  const navigate = useNavigate()
  const [scanningTicket, setScanningTicket] = useState(false)

  return (
    <>
      <ButtonGroup label="Page actions">
        {search && (
          <button type="button" aria-label="Search" className={GROUP_BUTTON} onClick={() => navigate('/search')}>
            <Search />
          </button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Add" className={GROUP_BUTTON}>
            <Plus />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2">
            <DropdownMenuItem className={MENU_ITEM} onClick={() => navigate('/people/add')}>
              <ScanQrCode />
              Scan QR code
            </DropdownMenuItem>
            <DropdownMenuItem className={MENU_ITEM} onClick={() => setScanningTicket(true)}>
              <Ticket />
              Add a ticket
            </DropdownMenuItem>
            <DropdownMenuItem className={MENU_ITEM} onClick={() => navigate('/events/create')}>
              <CalendarPlus />
              Create an event
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>
      {/* Out of the header: its backdrop blur would trap the full-screen sheet inside it */}
      {scanningTicket &&
        createPortal(<TicketScanSheet initialSport={ticketSport} onClose={() => setScanningTicket(false)} />, document.body)}
    </>
  )
}
