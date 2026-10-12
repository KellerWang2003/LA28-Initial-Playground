import { Link } from 'react-router'
import { MapPin, Tv } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Here } from './friends'
import { Section } from './section'

export function YourPeople({ here, ended }: { here: Here[]; ended: boolean }) {
  return (
    <Section title="Your people" aside={here.length > 0 ? `${here.length} ${ended ? 'were here' : 'here'}` : undefined}>
      {here.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {ended ? 'None of your people were in this room.' : 'None of your people are in this room yet. Add friends from the People tab and they will show here when they join.'}
        </p>
      ) : (
        <ul className="-mx-2">
          {here.map(({ person, mode }) => (
            <li key={person.id}>
              <Link to={`/people/${person.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted active:bg-muted">
                <Avatar size="lg">
                  <AvatarFallback>{person.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {person.flag} {person.name}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
                  {mode === 'venue' ? <MapPin className="size-3" aria-hidden /> : <Tv className="size-3" aria-hidden />}
                  {mode === 'venue' ? 'At the venue' : 'Online'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
