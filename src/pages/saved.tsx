import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChevronLeft, Plus } from 'lucide-react'
import { Sheet } from '@/components/game-sheets'
import { ListCover } from '@/components/save-sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { WATCH_LIST, createList, savedCount, useSaved } from '@/lib/saved'

// Every saved list as a tile, Watch list first. Opened from the Saved card on the profile.
export default function SavedPage() {
  const navigate = useNavigate()
  const lists = useSaved()
  const [naming, setNaming] = useState(false)
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/profile', { replace: true }))

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={goBack}>
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="font-heading text-lg font-semibold">Saved</h1>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-[max(env(safe-area-inset-bottom),24px)]">
        <p className="mb-4 text-sm text-muted-foreground">
          Games and events you’re interested in. Anything on your Watch list shows in Right now while it’s on.
        </p>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-4">
          {lists.map((list) => (
            <li key={list.id}>
              <Link to={`/profile/saved/${list.id}`} className="block active:opacity-80">
                <ListCover list={list} className="aspect-square w-full rounded-2xl" />
                <p className="mt-2 truncate text-sm font-medium">{list.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {list.id === WATCH_LIST ? `${savedCount(list)} · Shows in Right now` : savedCount(list)}
                </p>
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setNaming(true)}
              className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed text-sm font-medium text-muted-foreground active:opacity-80"
            >
              <Plus className="size-5" />
              New list
            </button>
          </li>
        </ul>
      </div>
      {naming && <NewListSheet onClose={() => setNaming(false)} />}
    </div>
  )
}

function NewListSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')

  return (
    <Sheet title="New list" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          const id = createList(name.trim())
          navigate(`/profile/saved/${id}`)
        }}
      >
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Finals I can’t miss" />
        <Button type="submit" className="mt-3 w-full" disabled={!name.trim()}>
          Create list
        </Button>
      </form>
    </Sheet>
  )
}
