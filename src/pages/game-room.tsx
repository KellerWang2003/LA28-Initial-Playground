import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ChevronLeft, MapPin, Plus, Trophy, Tv, Users } from 'lucide-react'
import { GameModeSheet } from '@/components/game-sheets'
import { LiveTimer } from '@/components/live-timer'
import { Button } from '@/components/ui/button'
import { formatTime, placeById, sessionById, type Session } from '@/data/la28'
import { FloatingVideo, WatchButton, type VideoState } from '@/features/game-room/feed'
import { CrowdPlayButton } from '@/features/crowdplay/button'
import { LiveView } from '@/features/game-room/live-view'
import { useRoomStage } from '@/features/game-room/round-phase'
import { DelayChip, RoomSettingsSheet, SettingsButton } from '@/features/game-room/room-settings'
import { gameFor, modeLabel, useMyGames, type AttendMode } from '@/lib/my-games'
import { SWIM_SESSION } from '@/features/activity/keep-going'
import { keepStep, useKeepGoing, useKeepGoingOn } from '@/features/activity/keep-going-state'
import { KeepGoingStrip } from '@/features/activity/keep-going-strip'

const modeIcon = { venue: MapPin, online: Tv } satisfies Record<AttendMode, unknown>

// Back to where you came from, or the Sports tab when the room was opened directly
function useGoBack() {
  const navigate = useNavigate()
  return () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/sports', { replace: true }))
}

function BackButton() {
  const goBack = useGoBack()
  return (
    <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={goBack}>
      <ChevronLeft className="size-5" />
    </Button>
  )
}

export default function GameRoomPage() {
  const { sessionId = '' } = useParams()
  const session = sessionById(sessionId)
  return session ? <Room session={session} /> : <UnknownGame />
}

function UnknownGame() {
  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2">
        <BackButton />
        <h1 className="truncate font-heading text-lg font-semibold">Game room</h1>
      </header>
      <div className="px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="rounded-2xl border p-4">
          <p className="font-medium">We could not find that game</p>
          <p className="mt-1 text-sm text-muted-foreground">The link may be old. Go back and pick a game from Sports.</p>
        </div>
      </div>
    </div>
  )
}

function Room({ session }: { session: Session }) {
  const mine = useMyGames()
  const attending = gameFor(mine, session.id)
  const mode: AttendMode = attending?.mode ?? 'online'
  const stage = useRoomStage(session)
  const [sheet, setSheet] = useState<'mode' | 'settings'>()
  const [video, setVideo] = useState<VideoState>('off')
  // After swimming: the question lives at the top of the room. Once you pass, it stays with a way back.
  const keepOn = useKeepGoingOn(session.id)
  const keepPassed = keepStep(useKeepGoing()) === 'out'
  const keepGoing = keepOn || (session.id === SWIM_SESSION && keepPassed)

  const ModeIcon = modeIcon[mode]

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="shrink-0 px-2 pb-2">
        <div className="flex min-h-14 items-center gap-1 py-1">
          <BackButton />
          <div className="min-w-0 flex-1">
            <h1 className="line-clamp-2 font-heading text-lg leading-tight font-semibold">{session.title}</h1>
            <p className="truncate text-xs text-muted-foreground">
              {session.sport} · {placeById(session.venue).name}
            </p>
          </div>
          {stage === 'live' && <WatchButton state={video} onChange={setVideo} />}
          <SettingsButton onClick={() => setSheet('settings')} />
        </div>

        <div className="flex flex-wrap items-center gap-2 px-2">
          {stage === 'live' ? (
            <LiveTimer since={`${session.date}T${session.start}`} className="h-7 px-2.5 shadow-none" />
          ) : (
            <span className="inline-flex h-7 items-center text-xs text-muted-foreground">
              {stage === 'ended' ? 'Finished' : `Starts ${formatTime(session.start)}`}
            </span>
          )}
          {session.fansOnApp !== undefined && (
            <span className="inline-flex h-7 items-center gap-1 text-xs text-muted-foreground tabular-nums">
              <Users className="size-3.5" />
              {session.fansOnApp.toLocaleString()}
            </span>
          )}
          {attending ? (
            <button
              type="button"
              onClick={() => setSheet('mode')}
              aria-label={`Change how you attend: ${modeLabel(mode)}`}
              className="inline-flex h-7 items-center gap-1 rounded-full bg-muted px-2.5 text-xs font-medium"
            >
              <ModeIcon className="size-3.5" />
              {mode === 'venue' ? 'Venue' : 'Online'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSheet('mode')}
              className="inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium"
            >
              <Plus className="size-3.5" />
              Add this game
            </button>
          )}
          <DelayChip onClick={() => setSheet('settings')} />
          {stage === 'ended' && (
            <Link to={`/sports/games/${session.id}/recap`} className="inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium">
              <Trophy className="size-3.5" />
              See recap
            </Link>
          )}
        </div>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="pt-2 pb-[max(env(safe-area-inset-bottom),16px)]">
          {keepGoing && <KeepGoingStrip passed className="mx-4 mb-4 rounded-2xl bg-card px-4 py-3" />}
          <LiveView session={session} mode={mode} />
        </div>
      </div>

      <CrowdPlayButton session={session} />
      <FloatingVideo session={session} state={video} onChange={setVideo} />
      {sheet === 'mode' && <GameModeSheet session={session} onClose={() => setSheet(undefined)} />}
      {sheet === 'settings' && <RoomSettingsSheet session={session} onClose={() => setSheet(undefined)} />}
    </div>
  )
}
