import { useNavigate } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Placeholder } from '@/components/placeholder'

// Full-screen pushed page with a back button. Used for screens not designed yet.
export function EmptyScreen({ title }: { title: string }) {
  const navigate = useNavigate()

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={() => navigate(-1)}>
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="truncate font-heading text-lg font-semibold">{title}</h1>
      </header>
      <div className="min-h-0 flex-1 pb-[env(safe-area-inset-bottom)]">
        <Placeholder label={title} />
      </div>
    </div>
  )
}
