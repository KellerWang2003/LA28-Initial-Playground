import { useState, type ReactNode } from 'react'
import { Plus, Pencil, Share2, Trash2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BottomSheet, type Snap } from '@/components/bottom-sheet'
import { TabActions } from '@/components/tab-actions'

// Demos that need state or several parts, for the registry

// A phone-wide strip with the page background, for headers
export function Frame({ children }: { children: ReactNode }) {
  return <div className="w-full overflow-hidden rounded-xl border bg-background [&_header]:static [&_header]:pt-0">{children}</div>
}

export function SelectDemo() {
  return (
    <Select defaultValue="friends">
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="everyone">Everyone</SelectItem>
        <SelectItem value="friends">Friends</SelectItem>
        <SelectItem value="me">Only me</SelectItem>
      </SelectContent>
    </Select>
  )
}

export function TabsDemo({ variant }: { variant: 'default' | 'line' }) {
  return (
    <Tabs defaultValue="standing" className="w-full">
      <TabsList variant={variant} className="w-full">
        <TabsTrigger value="standing">Standing</TabsTrigger>
        <TabsTrigger value="room">Room</TabsTrigger>
        <TabsTrigger value="game">Game</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

export function MenuDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="More" className={buttonVariants({ variant: 'outline', size: 'icon-lg' })}>
        <Plus className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-52">
        <DropdownMenuLabel>This pin</DropdownMenuLabel>
        <DropdownMenuItem>
          <Pencil />
          Edit note
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Share2 />
          Share
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2 />
          Remove photo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SearchActionsDemo() {
  return (
    <div className="flex gap-2">
      <TabActions search />
    </div>
  )
}

export function SheetDemo() {
  const [snap, setSnap] = useState<Snap>('min')
  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-xl border bg-muted">
      <BottomSheet
        snap={snap}
        onSnapChange={setSnap}
        header={<p className="px-4 pb-2 text-sm font-medium">Snap: {snap}</p>}
      >
        <ul className="space-y-1.5 px-4">
          {Array.from({ length: 12 }, (_, i) => (
            <li key={i} className="rounded-2xl border px-3.5 py-3 text-sm">
              Row {i + 1}
            </li>
          ))}
        </ul>
      </BottomSheet>
    </div>
  )
}
