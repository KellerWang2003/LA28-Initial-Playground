import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import { CalendarPlus, Plus, QrCode, ScanQrCode, Search, Ticket } from 'lucide-react'
import { TicketScanSheet } from '@/components/ticket-scan-sheet'
import { ButtonGroup, GROUP_BUTTON } from '@/components/button-group'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// The page actions at the top of a tab, each tab with its own, in one ButtonGroup capsule.
// Search opens the search page. Activities adds a ticket or creates an event from its add menu.
// People scans another fan's code or pulls up your own. Sports only reads, so it has search alone.
// Rows at least 48px tall, above the 44pt minimum touch target in Apple's guidelines
const MENU_ITEM = 'min-h-12 gap-3 px-4 text-base [&_svg:not([class*=size-])]:size-5'

export function TabActions({
  search,
  tab,
}: {
  // Show the search button
  search?: boolean
  // Which tab's own actions to show next to search
  tab?: 'activities' | 'people'
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
        {tab === 'people' && (
          <>
            <button type="button" aria-label="Scan QR code" className={GROUP_BUTTON} onClick={() => navigate('/people/add')}>
              <ScanQrCode />
            </button>
            <button type="button" aria-label="My code" className={GROUP_BUTTON} onClick={() => navigate('/people/add/code')}>
              <QrCode />
            </button>
          </>
        )}
        {tab === 'activities' && (
          <DropdownMenu>
            <DropdownMenuTrigger aria-label="Add" className={GROUP_BUTTON}>
              <Plus />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
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
        )}
      </ButtonGroup>
      {/* Out of the header: its backdrop blur would trap the full-screen sheet inside it */}
      {scanningTicket && createPortal(<TicketScanSheet onClose={() => setScanningTicket(false)} />, document.body)}
    </>
  )
}
