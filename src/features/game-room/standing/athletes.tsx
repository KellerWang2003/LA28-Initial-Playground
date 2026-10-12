import { ShapeIcon } from '@/components/shape-art'
import { SPORT_SHAPE, type Session } from '@/data/la28'
import { athletes } from '@/data/mock'
import { SectionTitle } from './parts'

// Athletes from src/data/mock.ts who compete in this session
export function AthletesInSession({ session }: { session: Session }) {
  const list = athletes.filter((a) => a.session === session.id)
  if (list.length === 0) return null

  return (
    <section aria-label="Athletes in this session">
      <SectionTitle>Athletes to watch</SectionTitle>
      <ul className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4">
        {list.map((athlete) => {
          const shape = SPORT_SHAPE[athlete.sport]
          return (
            <li key={athlete.id} className="w-64 shrink-0 snap-start">
              <article className="h-full rounded-2xl bg-card p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-background text-2xl leading-none" aria-hidden>
                    {athlete.flag}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium">{athlete.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {athlete.code} · {athlete.sport}
                    </p>
                  </div>
                  {shape && <ShapeIcon shape={shape} className="size-5 shrink-0 text-muted-foreground" />}
                </div>
                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{athlete.line}</p>
              </article>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
