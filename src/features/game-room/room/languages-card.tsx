import type { LanguageShare } from './model'
import { Section } from './section'

const BARS = 5

// The room's language mix: the biggest as bars, the rest as chips with their hello word
export function LanguagesCard({ languages }: { languages: LanguageShare[] }) {
  const top = languages.slice(0, BARS)
  const rest = languages.slice(BARS)
  const max = top[0]?.share || 1

  return (
    <Section title="Languages" aside={`${languages.length} ${languages.length === 1 ? 'language' : 'languages'} in the room`}>
      <ul className="space-y-2.5">
        {top.map((l) => (
          <li key={l.id}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span>
                <span className="font-medium">{l.name}</span>{' '}
                <span lang={l.id} className="text-muted-foreground">
                  · {l.hello}
                </span>
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">{Math.round(l.share * 100)}%</span>
            </div>
            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
              <span className="block h-full rounded-full bg-foreground" style={{ width: `${(l.share / max) * 100}%` }} />
            </span>
          </li>
        ))}
      </ul>
      {rest.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="More languages">
          {rest.map((l) => (
            <li key={l.id} className="rounded-full border px-2.5 py-1 text-xs">
              {l.name} <span lang={l.id} className="text-muted-foreground">· {l.hello}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
