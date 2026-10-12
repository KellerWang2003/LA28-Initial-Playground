import { useEffect, useState } from 'react'
import { Check, Copy, Download, Share2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Award, Tint } from './data'

const TINT: Record<Tint, string> = {
  amber: 'bg-amber-50 dark:bg-amber-950/30',
  sky: 'bg-sky-50 dark:bg-sky-950/30',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/30',
  rose: 'bg-rose-50 dark:bg-rose-950/30',
  violet: 'bg-violet-50 dark:bg-violet-950/30',
}

function YouChip({ you }: { you: NonNullable<Award['you']> }) {
  return (
    <p className="mt-3 inline-flex w-fit max-w-full items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium">
      {you.match && <Check className="size-3.5 shrink-0" aria-hidden />}
      <span className="truncate">{you.text}</span>
      {you.match && <span className="sr-only">(a match)</span>}
    </p>
  )
}

// One crowd award, in the card layout used on screen and in the share preview
function CardFace({ award, session, large }: { award: Award; session: string; large?: boolean }) {
  return (
    <div className={cn('flex h-full flex-col rounded-3xl border p-5', TINT[award.tint], large && 'p-6')}>
      <div className="flex items-center gap-2">
        <span className="text-2xl leading-none" aria-hidden>
          {award.emoji}
        </span>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{award.title}</p>
      </div>
      <p className={cn('mt-4 font-heading leading-tight font-bold tracking-tight text-balance', large ? 'text-4xl' : 'text-3xl')}>{award.big}</p>
      <p className="mt-2 text-sm text-pretty text-foreground/80">{award.line}</p>
      {award.you && !large && <YouChip you={award.you} />}
      <p className="mt-auto pt-4 text-[11px] text-muted-foreground">{session} · LA28 fan room</p>
    </div>
  )
}

export function AwardCarousel({ awards, session, onShare }: { awards: Award[]; session: string; onShare: (award: Award) => void }) {
  return (
    <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1">
      {awards.map((award, i) => (
        <li key={award.id} className="flex w-[17.5rem] shrink-0 snap-start flex-col gap-2" aria-label={`Award ${i + 1} of ${awards.length}`}>
          <div className="min-h-[15rem] flex-1">
            <CardFace award={award} session={session} />
          </div>
          <Button variant="outline" size="sm" className="w-full" aria-label={`Share: ${award.title}`} onClick={() => onShare(award)}>
            <Share2 />
            Share
          </Button>
        </li>
      ))}
    </ul>
  )
}

// Prototype only: nothing is shared or saved, the buttons just show what would happen
export function ShareSheet({ award, session, onClose }: { award: Award; session: string; onClose: () => void }) {
  const [done, setDone] = useState<'copy' | 'save' | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (!done) return
    const t = window.setTimeout(() => setDone(null), 2000)
    return () => window.clearTimeout(t)
  }, [done])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal
        aria-label={`Share: ${award.title}`}
        onClick={(e) => e.stopPropagation()}
        className="no-scrollbar m-3 mb-[max(env(safe-area-inset-bottom),12px)] max-h-[calc(100dvh-24px)] w-full max-w-sm overflow-y-auto overscroll-contain rounded-3xl border bg-background p-4 shadow-xl"
      >
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-heading font-semibold">Share this card</h2>
          <Button variant="ghost" size="icon-sm" aria-label="Close" className="ml-auto" onClick={onClose}>
            <X />
          </Button>
        </div>

        <div className="aspect-[4/5] w-full">
          <CardFace award={award} session={session} large />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setDone('copy')}>
            {done === 'copy' ? <Check /> : <Copy />}
            {done === 'copy' ? 'Link copied' : 'Copy link'}
          </Button>
          <Button onClick={() => setDone('save')}>
            {done === 'save' ? <Check /> : <Download />}
            {done === 'save' ? 'Image saved' : 'Save image'}
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground" aria-live="polite">
          {done ? 'Prototype: nothing was actually shared.' : 'The card shows the room, not you. No names or locations.'}
        </p>
      </div>
    </div>
  )
}
