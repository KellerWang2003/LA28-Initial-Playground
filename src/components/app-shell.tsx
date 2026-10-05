import { NavLink, Outlet } from 'react-router'
import { CalendarDays, Map, Trophy, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/explore', label: 'Explore', icon: Map },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/sports', label: 'Sports', icon: Trophy },
  { to: '/people', label: 'People', icon: Users },
]

// Mobile layout only; fills the viewport so it can be tested across device sizes.
// Pages own their header (Explore is a full-bleed map), the tab bar floats on top.
export function AppShell() {
  return (
    <div className="relative h-dvh overflow-hidden bg-background">
      <main className="no-scrollbar h-full overflow-y-auto overscroll-contain">
        <Outlet />
      </main>

      <nav
        aria-label="Main"
        className="absolute inset-x-0 bottom-[max(env(safe-area-inset-bottom),1rem)] z-30 flex justify-center px-4"
      >
        <div className="grid h-16 w-full max-w-sm grid-cols-4 rounded-full border bg-background/95 p-1.5 shadow-lg backdrop-blur">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
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
