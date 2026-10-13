import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { placeById, sessionById } from '@/data/la28'
import { useMyAnswers, useMyCountry, useMyScore } from '@/features/game-room/crowd'
import { useKeepScores } from '@/features/game-room/game/engine'
import { AwardCarousel, ShareSheet } from '@/features/game-room/recap/award-cards'
import { buildRecap, type Award } from '@/features/game-room/recap/data'
import {
  LearnCard,
  PersonalSection,
  PreviewBanner,
  RoomStats,
  SatOutSection,
  SectionTitle,
} from '@/features/game-room/recap/sections'
import { sessionTorches } from '@/features/crowdplay/play'
import { FansLikeYou } from '@/features/game-room/room/fans-like-you'
import { useFriendsHere } from '@/features/game-room/room/friends'
import { LanguagesCard } from '@/features/game-room/room/languages-card'
import { crowdFor, languageMix } from '@/features/game-room/room/model'
import { VenueOnlineSplit } from '@/features/game-room/room/split'
import { YourPeople } from '@/features/game-room/room/your-people'
import { roundsFor } from '@/features/game-room/rounds'
import { WorldMap } from '@/features/game-room/world-map'
import { useClock } from '@/lib/clock'
import { gameFor, useMyGames } from '@/lib/my-games'
import { SWIM_SESSION } from '@/features/activity/keep-going'
import { cn } from '@/lib/utils'

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border p-4">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  )
}

// The recap of a game: your part, then what the room had in common
export default function GameRecapPage() {
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()
  const session = sessionById(sessionId)
  const title = session ? `${session.title} · Recap` : 'Game recap'
  // Back to where you came from (the room, My activities), or the room itself when opened directly
  const goBack = () =>
    window.history.state?.idx > 0 ? navigate(-1) : navigate(session ? `/sports/games/${session.id}` : '/sports', { replace: true })

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={goBack}>
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="truncate font-heading text-lg font-semibold">{title}</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
        {!session ? (
          <Message title="We could not find that game" body="Go back and pick a game from Sports." />
        ) : session.status === 'upcoming' ? (
          <Message title="The recap opens after the game" body="Come back when it is over to see how the room played." />
        ) : (
          <Recap sessionId={session.id} />
        )}
      </div>
    </div>
  )
}

function Recap({ sessionId }: { sessionId: string }) {
  const session = sessionById(sessionId)!
  useKeepScores(session)
  const answers = useMyAnswers(sessionId)
  const score = useMyScore(sessionId)
  const myCountry = useMyCountry(sessionId)
  const mode = gameFor(useMyGames(), sessionId)?.mode
  const minute = Math.floor(useClock() / 60_000) * 60_000
  const [sharing, setSharing] = useState<Award | null>(null)

  const rounds = useMemo(() => roundsFor(sessionId), [sessionId])
  const recap = useMemo(
    () => buildRecap({ session, rounds, answers, score, myCountry, nowMs: minute }),
    [session, rounds, answers, score, myCountry, minute],
  )
  const live = session.status === 'live'
  const venue = placeById(session.venue)?.name
  const crowd = useMemo(() => crowdFor(session), [session])
  const languages = useMemo(() => languageMix(session, crowd), [session, crowd])
  const friendsHere = useFriendsHere(sessionId)
  const answered = { n: rounds.filter((r) => r.id in answers).length, of: rounds.length }

  return (
    <div className="space-y-5 pb-2">
      {live && <PreviewBanner />}

      <section>
        <p className="mb-2 text-sm text-muted-foreground">
          {session.sport}
          {venue && ` · ${venue}`}
        </p>
        <RoomStats room={recap.room} />
      </section>

      {recap.personal ? (
        <PersonalSection personal={recap.personal} mode={mode} live={live} answered={answered} torches={sessionTorches(sessionId, answers)} />
      ) : (
        <SatOutSection hasRounds={rounds.length > 0} live={live} sessionId={sessionId} />
      )}

      {recap.awards.length > 0 && (
        <section>
          <SectionTitle hint={`${recap.awards.length} awards`}>What the room had in common</SectionTitle>
          <AwardCarousel awards={recap.awards} session={session.title} onShare={setSharing} />
        </section>
      )}

      <section>
        <SectionTitle hint={`${recap.room.countries.length} countries`}>Where the room is from</SectionTitle>
        <div className="rounded-2xl border p-3">
          <WorldMap
            points={recap.room.countries.map((c) => ({ code: c.code, value: c.fans }))}
            selected={recap.personal?.country?.code}
            selectedTag="You"
          />
        </div>
      </section>

      {crowd.total > 0 && (
        <section className="space-y-4">
          <SectionTitle hint={`${crowd.total.toLocaleString()} fans`}>Who was here</SectionTitle>
          <VenueOnlineSplit crowd={crowd} mode={mode ?? 'online'} ended={!live} />
          {languages.length > 0 && <LanguagesCard languages={languages} />}
          <YourPeople here={friendsHere} ended={!live} />
          <FansLikeYou sessionId={sessionId} answers={answers} crowd={crowd} />
        </section>
      )}

      <LearnCard learns={recap.learns} />

      {sessionId === SWIM_SESSION && (
        <section className="rounded-2xl border p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">After the final</p>
          <p className="mt-1 font-heading font-semibold">Keep going with fans from tonight</p>
          <p className="mt-1 text-sm text-muted-foreground">Get matched with a group from SoFi, then vote on a place nearby.</p>
          <Link to="/events/keep-going" className={cn(buttonVariants(), 'mt-4 w-full')}>
            Find a group
          </Link>
        </section>
      )}

      {sharing && <ShareSheet award={sharing} session={session.title} onClose={() => setSharing(null)} />}
    </div>
  )
}
