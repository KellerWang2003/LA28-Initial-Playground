import { useNavigate } from 'react-router'
import { QrCode, ScanQrCode, Search } from 'lucide-react'
import { ButtonGroup, GROUP_BUTTON } from '@/components/button-group'

// The page actions at the top of a tab, each tab with its own, in one ButtonGroup capsule.
// Search opens the search page. People scans another fan's code or pulls up your own.
// Activities and Sports have search alone (Activities adds from its own button above the tab bar).
export function TabActions({
  search,
  tab,
}: {
  // Show the search button
  search?: boolean
  // Which tab's own actions to show next to search
  tab?: 'people'
}) {
  const navigate = useNavigate()

  return (
    <ButtonGroup label="Page actions">
      {search && (
        <button type="button" aria-label="Search" className={GROUP_BUTTON} onClick={() => navigate('/search')}>
          <Search />
        </button>
      )}
      {tab === 'people' && (
        <>
          <button type="button" aria-label="Scan QR code" className={GROUP_BUTTON} onClick={() => navigate('/people/add')}>
            <ScanQrCode />
          </button>
          <button type="button" aria-label="My code" className={GROUP_BUTTON} onClick={() => navigate('/people/add/code')}>
            <QrCode />
          </button>
        </>
      )}
    </ButtonGroup>
  )
}
