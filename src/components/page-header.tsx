import type { ReactNode } from 'react'
import { ProfileButton } from '@/components/profile-button'

// Large title header for tab pages, with the profile avatar top right
export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4">
        <h1 className="font-heading text-2xl font-semibold">{title}</h1>
        <div className="flex items-center gap-2">
          {action}
          <ProfileButton />
        </div>
      </div>
    </header>
  )
}
