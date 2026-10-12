import { ShapeIcon } from '@/components/shape-art'
import { SPORT_SHAPE, formatDate, formatTime, placeById, type Session } from '@/data/la28'
import { type Ticket } from '@/lib/tickets'
import { cn } from '@/lib/utils'

export function TicketStubArt({
  ticket,
  session,
  className,
  compact = false,
  onClick,
}: {
  ticket: Ticket
  session: Session
  className?: string
  compact?: boolean
  onClick?: () => void
}) {
  const shape = SPORT_SHAPE[session.sport]
  const venue = placeById(session.venue)
  const codeSeed = ticket.id.replace(/\D/g, '').slice(-6) || '482109'

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm transition-all',
        onClick && 'cursor-pointer active:scale-[0.98]',
        className,
      )}
    >
      {/* Top Header / Band */}
      <div className="flex items-center justify-between border-b bg-muted/70 px-3.5 py-2">
        <div className="flex items-center gap-1.5">
          <span className="font-heading text-[11px] font-bold tracking-widest uppercase">LA28 PASS</span>
          {!compact && (
            <>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[10px] font-medium text-muted-foreground">OLYMPIC GAMES</span>
            </>
          )}
        </div>
        <span className="rounded-full bg-foreground px-2 py-0.5 text-[9px] font-semibold text-background uppercase tracking-wide">
          VENUE TICKET
        </span>
      </div>

      {/* Main Ticket Body */}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              {shape && <ShapeIcon shape={shape} className="size-3.5 shrink-0" />}
              <span>{session.sport}</span>
            </p>
            <p className={cn('mt-0.5 font-heading font-bold text-foreground', compact ? 'line-clamp-1 text-sm' : 'text-base')}>
              {session.title}
            </p>
          </div>
          {ticket.photoUrl && (
            <div className="size-10 shrink-0 overflow-hidden rounded-lg border bg-muted">
              <img src={ticket.photoUrl} alt="Ticket photo" className="size-full object-cover" />
            </div>
          )}
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          {venue.name} · {venue.hood}
        </p>
        <p className="mt-1 text-xs font-medium text-foreground">
          {formatDate(session.date)} · {formatTime(session.start)}
        </p>

        {/* Seat matrix */}
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl border bg-muted/40 p-2 text-center">
          <div>
            <p className="text-[9px] font-medium tracking-wider text-muted-foreground uppercase">Section</p>
            <p className="font-heading text-xs font-bold">{ticket.seat.section}</p>
          </div>
          <div className="border-x">
            <p className="text-[9px] font-medium tracking-wider text-muted-foreground uppercase">Row</p>
            <p className="font-heading text-xs font-bold">{ticket.seat.row}</p>
          </div>
          <div>
            <p className="text-[9px] font-medium tracking-wider text-muted-foreground uppercase">Seat</p>
            <p className="font-heading text-xs font-bold">{ticket.seat.seat}</p>
          </div>
        </div>
      </div>

      {/* Perforation Line with notches */}
      <div className="relative flex items-center justify-between border-t border-dashed px-3 py-2 bg-muted/20">
        <span className="absolute -left-2 size-3.5 rounded-full border bg-background" aria-hidden />
        <span className="absolute -right-2 size-3.5 rounded-full border bg-background" aria-hidden />

        <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
          <span>#LA28-{codeSeed}</span>
        </div>

        {/* Simulated Barcode */}
        <div className="flex items-center gap-0.5" aria-hidden>
          {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1].map((width, idx) => (
            <span
              key={idx}
              className="h-4 bg-foreground/80"
              style={{ width: `${width}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
