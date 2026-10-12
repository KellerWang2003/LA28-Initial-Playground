import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { QrCode, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConnections } from '@/lib/connections'
import { meetable } from '@/data/mock'

// Mock detection: how long the camera takes to pick up a fan's code
const DETECT_MS = 2500

// Fans already scanned this visit, so coming back from a profile you didn't add
// doesn't pick the same code up again. In-memory: a reload resets it.
const scanned = new Set<string>()

// Scan QR code: the camera fills the screen. A fan's code is picked up on its own
// (mocked: the next fan you haven't added, after a moment) and opens their profile.
// Your own code is its own page.
export default function PeopleAddPage() {
  const navigate = useNavigate()
  const connections = useConnections()
  const next = meetable.find((p) => !connections.includes(p.id) && !scanned.has(p.id))

  useEffect(() => {
    if (!next) return
    const timer = window.setTimeout(() => {
      scanned.add(next.id)
      navigate(`/people/${next.id}`)
    }, DETECT_MS)
    return () => window.clearTimeout(timer)
  }, [next, navigate])

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-black text-white">
      {/* Stand-in for the live camera feed */}
      <img src="/camera/downtown.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-50" />

      <header className="relative box-content flex h-14 shrink-0 items-center gap-2 px-2 pt-[env(safe-area-inset-top)]">
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="Close"
          className="text-white hover:bg-white/10 hover:text-white"
          onClick={() => navigate(-1)}
        >
          <X className="size-5" />
        </Button>
        <h1 className="font-heading text-lg font-semibold">Scan QR code</h1>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-8">
        <Viewfinder scanning={!!next} />
        <p className="mt-6 text-center text-sm text-white/80">
          {next ? 'Point your camera at another fan’s code' : 'No more codes to scan here right now.'}
        </p>
      </div>

      <div className="relative shrink-0 px-4 pt-4 pb-[max(env(safe-area-inset-bottom),24px)]">
        <Button type="button" variant="secondary" size="lg" className="w-full" onClick={() => navigate('/people/add/code')}>
          <QrCode />
          Show my code
        </Button>
      </div>
    </div>
  )
}

// White corners over the camera, with a line sweeping while it looks for a code
function Viewfinder({ scanning }: { scanning: boolean }) {
  return (
    <div className="relative aspect-square w-full max-w-64">
      {scanning && <span className="absolute inset-x-6 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-white" />}
      <span className="absolute top-0 left-0 size-10 rounded-tl-3xl border-t-4 border-l-4 border-white" />
      <span className="absolute top-0 right-0 size-10 rounded-tr-3xl border-t-4 border-r-4 border-white" />
      <span className="absolute bottom-0 left-0 size-10 rounded-bl-3xl border-b-4 border-l-4 border-white" />
      <span className="absolute right-0 bottom-0 size-10 rounded-br-3xl border-r-4 border-b-4 border-white" />
    </div>
  )
}
