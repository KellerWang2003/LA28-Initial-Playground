import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Check, ChevronLeft } from 'lucide-react'
import { ShapeIcon } from '@/components/shape-art'
import { Button } from '@/components/ui/button'
import { SPORTS, SPORT_SHAPE, flag } from '@/data/la28'
import { toggleFollowedSport, useFollowedSports } from '@/lib/followed-sports'
import {
  COUNTRIES,
  DISPLAY_LANGUAGES,
  SPOKEN_LANGUAGES,
  setCountry,
  setDisplayLanguage,
  toggleSpokenLanguage,
  useProfile,
} from '@/lib/profile'
import { cn } from '@/lib/utils'

export default function ProfileSettingsPage() {
  const navigate = useNavigate()
  const { hash } = useLocation()
  const sportsRef = useRef<HTMLElement>(null)
  const profile = useProfile()
  const followed = useFollowedSports()

  useEffect(() => {
    if (hash !== '#sports') return
    sportsRef.current?.scrollIntoView({ block: 'start' })
  }, [hash])

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={() => navigate(-1)}>
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="font-heading text-lg font-semibold">Settings</h1>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 space-y-8 overflow-y-auto overscroll-contain px-4 pt-2 pb-[max(env(safe-area-inset-bottom),24px)]">
        <section ref={sportsRef} id="sports" className="scroll-mt-4">
          <h2 className="font-heading font-semibold">Sports you follow</h2>
          <p className="mt-1 text-sm text-muted-foreground">The Sports tab only shows these.</p>
          <ul className="mt-3 space-y-2">
            {SPORTS.map((sport) => {
              const on = followed.includes(sport)
              const shape = SPORT_SHAPE[sport]
              return (
                <li key={sport}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleFollowedSport(sport)}
                    className={cn('flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left', on && 'bg-muted')}
                  >
                    {shape && <ShapeIcon shape={shape} className="size-5 shrink-0" />}
                    <span className="font-medium">{sport}</span>
                    <span
                      className={cn(
                        'ml-auto flex size-5 items-center justify-center rounded-full border',
                        on && 'border-foreground bg-foreground text-background',
                      )}
                    >
                      {on && <Check className="size-3.5" />}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section>
          <h2 className="font-heading font-semibold">Language</h2>
          <p className="mt-1 text-sm text-muted-foreground">Saved on your profile. The app stays in English.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DISPLAY_LANGUAGES.map((language) => {
              const on = profile.language === language.id
              return (
                <button
                  key={language.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setDisplayLanguage(language.id)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm font-medium',
                    on && 'border-foreground bg-foreground text-background',
                  )}
                >
                  {language.label}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <h2 className="font-heading font-semibold">Country</h2>
          <p className="mt-1 text-sm text-muted-foreground">Shows next to your name.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {COUNTRIES.map((country) => {
              const on = profile.country === country.code
              return (
                <button
                  key={country.code}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setCountry(country.code)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm',
                    on && 'border-foreground bg-foreground text-background',
                  )}
                >
                  {flag(country.code)} {country.name}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <h2 className="font-heading font-semibold">Languages you speak</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {SPOKEN_LANGUAGES.map((language) => {
              const on = profile.spoken.includes(language)
              return (
                <button
                  key={language}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleSpokenLanguage(language)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm',
                    on && 'border-foreground bg-foreground text-background',
                  )}
                >
                  {language}
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
