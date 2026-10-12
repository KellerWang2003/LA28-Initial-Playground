import { useNavigate } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PassportCodePage } from '@/features/passport/code-page'

// Your code, so another fan can scan you: shown on your own Passport page, decorated the way you
// made it. Opened from the scanner (back returns to scanning) or from your profile.
export default function MyCodePage() {
  const navigate = useNavigate()

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={() => navigate(-1)}>
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="font-heading text-lg font-semibold">My code</h1>
      </header>
      <p className="shrink-0 px-4 text-center text-sm text-muted-foreground">Show this so another fan can add you.</p>
      <PassportCodePage />
    </div>
  )
}
