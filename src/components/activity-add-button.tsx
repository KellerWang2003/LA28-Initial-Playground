import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import { CalendarPlus, Plus, Ticket } from 'lucide-react'
import { TicketScanSheet } from '@/components/ticket-scan-sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Rows at least 48px tall, above the 44pt minimum touch target in Apple's guidelines
const MENU_ITEM = 'min-h-12 gap-3 px-4 text-base [&_svg:not([class*=size-])]:size-5'

// The primary add button on Activities, Slack style: black, round, bottom right above the tab bar.
// It opens add a ticket and create an event.
export function ActivityAddButton() {
  const navigate = useNavigate()
  const [scanningTicket, setScanningTicket] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Add"
          className="flex size-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform active:scale-95"
        >
          <Plus className="size-6" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-64 p-2">
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
      {scanningTicket && createPortal(<TicketScanSheet onClose={() => setScanningTicket(false)} />, document.body)}
    </>
  )
}
