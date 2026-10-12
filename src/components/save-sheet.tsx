import { useState } from 'react'
import { Bookmark, Check, Eye, Plus } from 'lucide-react'
import { Sheet } from '@/components/game-sheets'
import { ImagePlaceholder } from '@/components/image-placeholder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  WATCH_LIST,
  createList,
  inList,
  isSaved,
  savedCount,
  savedItem,
  toggleSaved,
  useSaved,
  type SavedList,
  type SavedRef,
} from '@/lib/saved'
import { cn } from '@/lib/utils'

// Bookmark for a game or event: "I'm interested", as opposed to going.
// Filled when it's on any list; tapping opens the lists to choose from.
// `header` is the plain icon size for a screen's top bar; otherwise a small round button.
export function SaveButton({ item, header, className }: { item: SavedRef; header?: boolean; className?: string }) {
  const saved = isSaved(useSaved(), item)
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-label={saved ? 'Saved. Change lists' : 'Save'}
        aria-pressed={saved}
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full',
          header ? 'size-10 hover:bg-muted' : 'size-7 border bg-background',
          className,
        )}
      >
        <Bookmark className={cn(header ? 'size-5' : 'size-3.5', saved && 'fill-current')} />
      </button>
      {open && <SaveSheet item={item} onClose={() => setOpen(false)} />}
    </>
  )
}

// Pick the lists this item is on. Each row toggles; the sheet stays open until Done.
export function SaveSheet({ item, onClose }: { item: SavedRef; onClose: () => void }) {
  const lists = useSaved()
  const info = savedItem(item)
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')

  return (
    <Sheet title="Save to a list" onClose={onClose}>
      {info && (
        <div className="mb-3 rounded-2xl bg-muted/60 px-4 py-3">
          <p className="font-medium">{info.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {info.eyebrow} · {info.when} · {info.where}
          </p>
        </div>
      )}

      <ul className="-mx-1">
        {lists.map((list) => {
          const on = inList(list, item)
          return (
            <li key={list.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => toggleSaved(list.id, item)}
                className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left hover:bg-muted"
              >
                <ListCover list={list} className="size-12 rounded-xl" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{list.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {list.id === WATCH_LIST ? 'Shows in Right now while it’s on' : savedCount(list)}
                  </span>
                </span>
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full border',
                    on && 'border-foreground bg-foreground text-background',
                  )}
                >
                  {on && <Check className="size-3.5" />}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {naming ? (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            createList(name.trim(), item)
            setName('')
            setNaming(false)
          }}
        >
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Name your list" />
          <Button type="submit" disabled={!name.trim()}>
            Create
          </Button>
        </form>
      ) : (
        <Button variant="outline" className="mt-2 w-full" onClick={() => setNaming(true)}>
          <Plus data-icon="inline-start" />
          New list
        </Button>
      )}

      <Button className="mt-2 w-full" onClick={onClose}>
        Done
      </Button>
    </Sheet>
  )
}

// The Watch list gets an eye; other lists show up to four placeholders, like a photo grid
export function ListCover({ list, className }: { list: SavedList; className?: string }) {
  if (list.id === WATCH_LIST) {
    return (
      <span className={cn('flex shrink-0 items-center justify-center bg-foreground text-background', className)}>
        <Eye className="size-1/3" />
      </span>
    )
  }
  const tiles = Math.min(4, Math.max(1, list.items.length))
  return (
    <span className={cn('grid shrink-0 gap-px overflow-hidden', tiles > 1 && 'grid-cols-2', className)}>
      {Array.from({ length: tiles === 3 ? 4 : tiles }, (_, i) => (
        <ImagePlaceholder key={i} className="size-full rounded-none" />
      ))}
    </span>
  )
}
