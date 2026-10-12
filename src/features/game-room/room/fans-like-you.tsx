import { useState } from 'react'
import { Link } from 'react-router'
import { Check, Hand } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { crowdCountry } from '../crowd'
import { cohortsFor, matchableRounds, roundsNeeded } from './cohorts'
import type { Crowd } from './model'
import { Section } from './section'

const countryName = (code: string) => crowdCountry(code)?.name ?? code

function countriesText(codes: string[]) {
  const names = codes.map(countryName)
  return names.length > 1 ? `${names[0]} and ${names[1]}` : (names[0] ?? 'around the world')
}

export function FansLikeYou({ sessionId, answers, crowd }: { sessionId: string; answers: Record<string, string>; crowd: Crowd }) {
  const [waved, setWaved] = useState<Set<number>>(new Set())
  const needed = roundsNeeded(sessionId)
  const { answered, cohorts } = cohortsFor(sessionId, answers, crowd)

  const toggle = (matched: number) =>
    setWaved((prev) => {
      const next = new Set(prev)
      if (!next.delete(matched)) next.add(matched)
      return next
    })

  return (
    <Section title="Fans like you">
      {matchableRounds(sessionId).length === 0 ? (
        <p className="text-sm text-muted-foreground">There is no CrowdPlay in this game, so there is nothing to compare yet.</p>
      ) : answered < needed ? (
        <div>
          <p className="text-sm text-muted-foreground">
            Answer a few CrowdPlay questions to see fans like you.{' '}
            <span className="tabular-nums">
              {answered} of {needed} answered.
            </span>
          </p>
          <Link to={`/sports/games/${sessionId}/play`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-3')}>
            Open CrowdPlay
          </Link>
        </div>
      ) : cohorts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Your answers are one of a kind so far. Groups under 10 fans stay hidden.</p>
      ) : (
        <>
          <ul className="space-y-3">
            {cohorts.map((c) => (
              <li key={c.matched} className="flex items-start gap-3">
                <p className="min-w-0 flex-1 text-sm">
                  <span className="font-semibold tabular-nums">{c.size.toLocaleString()} fans</span> answered the same as you on{' '}
                  <span className="tabular-nums">
                    {c.matched} of {c.of}
                  </span>{' '}
                  questions
                  <span className="text-muted-foreground"> — mostly from {countriesText(c.countries)}</span>
                </p>
                <Button
                  variant={waved.has(c.matched) ? 'secondary' : 'outline'}
                  size="xs"
                  aria-pressed={waved.has(c.matched)}
                  onClick={() => toggle(c.matched)}
                >
                  {waved.has(c.matched) ? <Check /> : <Hand />}
                  {waved.has(c.matched) ? 'Waved' : 'Say hi'}
                </Button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">Groups only, never individuals. Say hi is opt-in and nobody sees who you are.</p>
        </>
      )}
    </Section>
  )
}
