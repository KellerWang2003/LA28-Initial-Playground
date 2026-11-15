import { Navigate, useNavigate, useParams } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Matchup, PartyStack } from '@/features/watch-party/tonight'
import { PartyPage } from '@/features/watch-party/party-page'
import { CrowdPlay } from '@/features/watch-party/crowd-play'
import { partyById } from '@/features/watch-party/parties'

// Tonight's watch parties: swipe through the parties showing the game, see who's going, sign up
export default function WatchPartiesPage() {
  const navigate = useNavigate()
  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center gap-1 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={() => navigate(-1)}>
          <ChevronLeft className="size-5" />
        </Button>
        <Matchup className="text-lg" />
      </header>
      <PartyStack />
    </div>
  )
}

// One party's page: what you can do there, and the party itself once you arrive
export function WatchPartyPage() {
  const { partyId = '' } = useParams()
  const party = partyById(partyId)
  return party ? <PartyPage party={party} /> : <Navigate to="/events/tonight" replace />
}

// CrowdPlay on the party's big screen, with your phone as the controller
export function WatchPartyPlayPage() {
  const { partyId = '' } = useParams()
  const party = partyById(partyId)
  return party ? <CrowdPlay party={party} /> : <Navigate to="/events/tonight" replace />
}
