import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Check, ChevronLeft, ImagePlus, Globe, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { PLACES, TODAY } from '@/data/la28'
import { people } from '@/data/mock'

type Visibility = 'public' | 'private'

const categories = [
  { value: 'watch', label: 'Watch party' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'food', label: 'Food & drink' },
  { value: 'activity', label: 'Sport & activity' },
  { value: 'culture', label: 'Culture' },
]

// Public events must be at a spot that welcomes gatherings: public parks or opted-in shops
const hostable = PLACES.filter((p) => p.type === 'public' || p.hostsGatherings)
const locations = hostable.map((p) => ({
  value: p.id,
  label: p.capacity ? `${p.name} · up to ${p.capacity}` : p.name,
}))

// Prototype only: nothing is saved. Required fields gate the Create button.
export default function EventCreatePage() {
  const navigate = useNavigate()
  const [visibility, setVisibility] = useState<Visibility>('public')
  const [name, setName] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [date, setDate] = useState(TODAY)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [placeId, setPlaceId] = useState<string | null>(null)
  const [address, setAddress] = useState('')
  const [guests, setGuests] = useState('10')
  const [description, setDescription] = useState('')
  const [invited, setInvited] = useState<string[]>([])

  const isPublic = visibility === 'public'
  const place = hostable.find((p) => p.id === placeId)
  const maxGuests = isPublic ? place?.capacity : undefined
  const guestCount = Number(guests)
  const guestsValid = guestCount >= 2 && (!maxGuests || guestCount <= maxGuests)
  const canCreate = name.trim() && category && date && start && (isPublic ? placeId : address.trim()) && guestsValid

  function toggleInvite(id: string) {
    setInvited((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))
  }

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={() => navigate(-1)}>
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="font-heading text-lg font-semibold">New event</h1>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 pb-8">
        {/* Visibility */}
        <div className="grid grid-cols-2 gap-2">
          <VisibilityOption
            selected={isPublic}
            onClick={() => setVisibility('public')}
            icon={<Globe className="size-5" />}
            title="Public"
            text="Anyone can find it on the map and join"
          />
          <VisibilityOption
            selected={!isPublic}
            onClick={() => setVisibility('private')}
            icon={<Lock className="size-5" />}
            title="Private"
            text="Only people you invite can see it"
          />
        </div>

        <button
          type="button"
          className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed text-sm text-muted-foreground"
        >
          <ImagePlus className="size-6" />
          Add a cover photo
        </button>

        <Field id="ev-name" label="Event name" required>
          <Input id="ev-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Brazil vs Japan watch party" />
        </Field>

        <Field id="ev-category" label="Category" required>
          <Select items={categories} value={category} onValueChange={setCategory}>
            <SelectTrigger id="ev-category" className="w-full">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field id="ev-date" label="Date" required hint="During the Games, July 14–30">
          <Input id="ev-date" type="date" value={date} min="2028-07-14" max="2028-07-30" onChange={(e) => setDate(e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field id="ev-start" label="Starts" required>
            <Input id="ev-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field id="ev-end" label="Ends">
            <Input id="ev-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>

        {isPublic ? (
          <Field id="ev-place" label="Location" required hint="Public events are held at parks and local shops that host gatherings">
            <Select items={locations} value={placeId} onValueChange={setPlaceId}>
              <SelectTrigger id="ev-place" className="w-full">
                <SelectValue placeholder="Choose a spot" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : (
          <Field id="ev-address" label="Location" required hint="Only shared with people you invite">
            <Input id="ev-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address or place name" />
          </Field>
        )}

        <Field
          id="ev-guests"
          label="Max guests"
          required
          hint={maxGuests ? `${place!.name} fits up to ${maxGuests}` : 'Including you'}
          error={guests !== '' && !guestsValid ? (maxGuests ? `Up to ${maxGuests} at this spot` : 'At least 2') : undefined}
        >
          <Input id="ev-guests" type="number" inputMode="numeric" min={2} max={maxGuests} value={guests} onChange={(e) => setGuests(e.target.value)} />
        </Field>

        <Field id="ev-description" label="Description">
          <Textarea
            id="ev-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's the plan? What should people bring?"
            rows={4}
          />
        </Field>

        {!isPublic && (
          <Field label="Invite people" hint={invited.length ? `${invited.length} invited` : 'People you have met'}>
            <div className="flex flex-wrap gap-2">
              {people.map((p) => {
                const on = invited.includes(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleInvite(p.id)}
                    className={cn(
                      'flex h-9 items-center gap-1.5 rounded-full border pr-3 pl-1 text-sm',
                      on && 'border-primary bg-primary text-primary-foreground',
                    )}
                  >
                    <Avatar size="sm">
                      <AvatarFallback className="text-[10px]">{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {p.flag} {p.name}
                    {on && <Check className="size-3.5" />}
                  </button>
                )
              })}
            </div>
          </Field>
        )}
      </div>

      <div className="shrink-0 border-t px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <Button size="lg" className="w-full" disabled={!canCreate} onClick={() => navigate('/events', { replace: true })}>
          {isPublic ? 'Create public event' : 'Create private event'}
        </Button>
      </div>
    </div>
  )
}

function VisibilityOption({
  selected,
  onClick,
  icon,
  title,
  text,
}: {
  selected: boolean
  onClick: () => void
  icon: ReactNode
  title: string
  text: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn('flex flex-col items-start gap-1 rounded-2xl border-2 p-3 text-left', selected ? 'border-primary' : 'border-border')}
    >
      {icon}
      <span className="font-medium">{title}</span>
      <span className="text-xs text-muted-foreground">{text}</span>
    </button>
  )
}

function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id?: string
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-muted-foreground">*</span>}
      </Label>
      {children}
      {(error || hint) && <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>{error ?? hint}</p>}
    </div>
  )
}
