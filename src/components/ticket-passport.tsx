import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Plus, Ticket as TicketIcon, Trash2, X } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { TicketStubArt } from '@/components/ticket-art'
import { sessionById } from '@/data/la28'
import { type Ticket } from '@/lib/tickets'
import { cn } from '@/lib/utils'

// Passport > Ticket stubs, before any ticket is scanned
export function TicketsEmpty() {
  const navigate = useNavigate()
  return (
    <div className="rounded-2xl border p-4 text-center">
      <TicketIcon className="mx-auto size-8 text-muted-foreground/60" />
      <p className="mt-2 text-sm font-medium">No ticket stubs yet</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Scan your physical or digital tickets in the Sports tab to save your Olympic stubs and register for venue access.
      </p>
      <Button variant="outline" size="sm" className="mt-3 rounded-full text-xs" onClick={() => navigate('/sports')}>
        <Plus className="size-3.5 mr-1" />
        Scan a ticket
      </Button>
    </div>
  )
}

export function TicketDetailSheet({
  ticket,
  onClose,
  onDelete,
}: {
  ticket: Ticket
  onClose: () => void
  onDelete: () => void
}) {
  const session = sessionById(ticket.sessionId)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true))
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  if (!session) return null

  return (
    <div role="dialog" aria-modal aria-label="Ticket Stub" className="fixed inset-0 z-50">
      <div
        aria-hidden
        onClick={onClose}
        className={cn('absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300', shown ? 'opacity-100' : 'opacity-0')}
      />
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 rounded-t-3xl border-t bg-background p-4 pb-[max(env(safe-area-inset-bottom),16px)] shadow-xl transition-transform duration-300 ease-out max-h-[90dvh] overflow-y-auto',
          shown ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold">Olympic Ticket Stub</h3>
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>

        <TicketStubArt ticket={ticket} session={session} />

        <div className="mt-4 flex flex-col gap-2">
          {session.status === 'finished' ? (
            <Link
              to={`/sports/games/${session.id}/recap`}
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full rounded-full')}
            >
              Game recap
            </Link>
          ) : (
            <Link
              to={`/sports/games/${session.id}`}
              className={cn(buttonVariants(), 'w-full rounded-full')}
            >
              Open game room
            </Link>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground text-xs hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5 mr-1" />
            Remove ticket stub
          </Button>
        </div>
      </div>
    </div>
  )
}
