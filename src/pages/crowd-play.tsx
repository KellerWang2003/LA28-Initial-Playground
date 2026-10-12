import { Navigate, useNavigate, useParams } from 'react-router'
import { sessionById } from '@/data/la28'
import { answerQuestion, playersIn } from '@/features/crowdplay/play'
import { phaseAt } from '@/features/crowdplay/schedule'
import { Done, Intro, Over, QuestionScreen, ResultScreen, TopBar, Waiting, type PlayCtx } from '@/features/crowdplay/screens'
import { useMyAnswers } from '@/features/game-room/crowd'
import { useClock } from '@/lib/clock'

// CrowdPlay, full screen: wait for the next round, play its questions with everyone at once, see
// how the crowd answered. Closing it goes back to the game; the button there shows where the
// round is, so you can jump back in.
export default function CrowdPlayPage() {
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()
  const session = sessionById(sessionId)
  const now = useClock()
  const answers = useMyAnswers(sessionId)

  const close = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate(`/sports/games/${sessionId}`, { replace: true }))

  if (!session) return <Navigate to="/sports" replace />

  const phase = phaseAt(session.id, now)
  const ctx: PlayCtx = {
    session,
    now,
    answers,
    players: playersIn(session),
    onAnswer: (question, value) => answerQuestion(session.id, question, value, answers),
    onClose: close,
  }

  return (
    <div className="flex h-dvh flex-col bg-foreground pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-background">
      <TopBar ctx={ctx} phase={phase} />
      {phase.kind === 'waiting' ? (
        <Waiting ctx={ctx} next={phase.next} left={phase.left} />
      ) : phase.kind === 'intro' ? (
        <Intro set={phase.set} left={phase.left} />
      ) : phase.kind === 'question' ? (
        <QuestionScreen key={phase.question.id} ctx={ctx} question={phase.question} left={phase.left} />
      ) : phase.kind === 'result' ? (
        <ResultScreen ctx={ctx} question={phase.question} left={phase.left} last={phase.question.index === phase.set.questions.length - 1} />
      ) : phase.kind === 'done' ? (
        <Done ctx={ctx} set={phase.set} next={phase.next} />
      ) : (
        <Over ctx={ctx} />
      )}
    </div>
  )
}
