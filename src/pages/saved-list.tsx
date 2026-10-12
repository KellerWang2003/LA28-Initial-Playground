import { Link, useNavigate, useParams } from 'react-router'
import { ChevronLeft, Eye } from 'lucide-react'
import { LiveTimer } from '@/components/live-timer'
import { SaveButton } from '@/components/save-sheet'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime, sessionLine } from '@/data/la28'
import { WATCH_LIST, deleteList, listById, savedCount, savedItem, useSaved, type SavedItem } from '@/lib/saved'

// One saved list: what's on it, soonest first, finished games last
export default function SavedListPage() {
  const { listId = '' } = useParams()
  const navigate = useNavigate()
  const list = listById(useSaved(), listId)
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/profile/saved', { replace: true }))

  const items = (list?.items ?? []).flatMap((ref) => {
    const item = savedItem(ref)
    return item ? [item] : []
  })
  const done = (i: SavedItem) => i.kind === 'game' && i.session.status === 'finished'
  const sorted = [
    ...items.filter((i) => !done(i)).sort((a, b) => a.sortKey.localeCompare(b.sortKey)),
    ...items.filter(done).sort((a, b) => b.sortKey.localeCompare(a.sortKey)),
  ]

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={goBack}>
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="truncate font-heading text-lg font-semibold">{list?.name ?? 'List'}</h1>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(env(safe-area-inset-bottom),24px)]">
        {!list ? (
          <div className="rounded-2xl bg-card p-4">
            <p className="font-medium">This list is gone</p>
            <p className="mt-1 text-sm text-muted-foreground">It may have been deleted. Go back to Saved.</p>
          </div>
        ) : (
          <>
            <p className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              {list.id === WATCH_LIST && <Eye className="size-4 shrink-0" />}
              {list.id === WATCH_LIST
                ? 'Shows in Right now while it’s on, and the result once it’s over.'
                : savedCount(list)}
            </p>

            {sorted.length === 0 ? (
              <div className="rounded-2xl bg-card p-4">
                <p className="font-medium">Nothing saved yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tap the bookmark on a game in Sports or an event in For you to add it here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-background overflow-hidden rounded-2xl bg-card">
                {sorted.map((item) => (
                  <li key={`${item.kind}:${item.ref.id}`} className="flex items-start gap-3 py-3 pr-4">
                    <SavedRow item={item} />
                    <SaveButton item={item.ref} />
                  </li>
                ))}
              </ul>
            )}

            {list.id !== WATCH_LIST && (
              <Button
                variant="ghost"
                className="mt-4 w-full text-muted-foreground"
                onClick={() => {
                  deleteList(list.id)
                  navigate('/profile/saved', { replace: true })
                }}
              >
                Delete this list
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SavedRow({ item }: { item: SavedItem }) {
  const session = item.kind === 'game' ? item.session : null
  const live = session?.status === 'live'
  const finished = session?.status === 'finished'

  return (
    <Link to={item.to} className="flex min-w-0 flex-1 gap-3 pl-4 active:opacity-70">
      <span className="w-[4.5rem] shrink-0 pt-0.5 text-xs text-muted-foreground tabular-nums">
        {live && session ? (
          <LiveTimer since={`${session.date}T${session.start}`} className="whitespace-nowrap shadow-none" />
        ) : finished && session ? (
          formatDate(session.date)
        ) : (
          <>
            <span className="block">{formatDate(item.kind === 'game' ? item.session.date : item.event.date)}</span>
            <span className="block">{formatTime(item.kind === 'game' ? item.session.start : item.event.time)}</span>
          </>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs text-muted-foreground">{item.eyebrow}</span>
        <span className="block text-sm leading-snug font-medium">{item.title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {session && (live || finished) ? sessionLine(session) : item.where}
        </span>
      </span>
    </Link>
  )
}
