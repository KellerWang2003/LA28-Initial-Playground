import { useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { CalendarDays, Map, Trophy, Users } from 'lucide-react'
import { ActivityAddButton } from '@/components/activity-add-button'
import { CarryBar } from '@/components/carry-bar'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/explore', label: 'Explore', icon: Map },
  { to: '/events', label: 'Activities', icon: CalendarDays },
  { to: '/sports', label: 'Sports', icon: Trophy },
  { to: '/people', label: 'People', icon: Users },
]

// Mobile layout only; fills the viewport so it can be tested across device sizes.
// Pages own their header (Explore is a full-bleed map), the tab bar floats on top.
export function AppShell() {
  useNoBackFromTabs()
  const { pathname } = useLocation()
  return (
    <div className="relative h-dvh overflow-hidden bg-background">
      <main className="no-scrollbar h-full overflow-y-auto overscroll-contain">
        <Outlet />
      </main>

      <nav
        aria-label="Main"
        className="absolute inset-x-0 bottom-[max(env(safe-area-inset-bottom),1rem)] z-30 flex flex-col items-center gap-2 px-4"
      >
        {/* Activities' primary add button, bottom right above the tab bar. Only the button takes taps. */}
        {pathname === '/events' && (
          <div className="pointer-events-none flex w-full max-w-sm justify-end">
            <span className="pointer-events-auto">
              <ActivityAddButton />
            </span>
          </div>
        )}
        {/* Carry mode: the baton and its time left, on every tab */}
        <CarryBar />
        <div className="grid h-16 w-full max-w-sm grid-cols-4 rounded-full border bg-background/95 p-1.5 shadow-lg backdrop-blur">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              // Switching tabs doesn't stack history: tabs have nothing to go back to
              replace
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 rounded-full text-[11px] text-muted-foreground transition-transform active:scale-95',
                  isActive && 'bg-muted font-medium text-foreground',
                )
              }
            >
              <Icon className="size-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

// Tabs are first level, so the browser's edge swipe back (and Android's back gesture) shouldn't
// leave them. A page can't switch the gesture off, so each tab sits on a copy of itself: arriving
// fresh turns the entry into the copy and pushes the tab on top, and swiping back lands on the copy
// (it looks the same), which pushes the tab again.
function useNoBackFromTabs() {
  const location = useLocation()
  const navigate = useNavigate()
  const mark = (location.state as { tabBack?: 'copy' | 'tab' } | null)?.tabBack
  useEffect(() => {
    // A tab already moved on in its own effect (e.g. Explore clearing ?baton=); the next run handles it
    if ((window.history.state?.key ?? 'default') !== location.key) return
    const here = location.pathname + location.search + location.hash
    if (!mark) navigate(here, { replace: true, state: { tabBack: 'copy' } })
    else if (mark === 'copy') navigate(here, { state: { tabBack: 'tab' } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])
}
