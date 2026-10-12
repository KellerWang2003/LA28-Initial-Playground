import { useState } from 'react'
import { Link } from 'react-router'
import { Check, Flame, X } from 'lucide-react'
import { formatTime, type Session } from '@/data/la28'
import { CROWD_COUNTRIES, crowdCountry } from '@/features/game-room/crowd'
import { shareOf, topId, type Dist } from '@/features/game-room/game/crowd-model'
import { WorldMap } from '@/features/game-room/world-map'
import { formatCountdown } from '@/lib/clock'
import { cn } from '@/lib/utils'
import { answeredIn, answeredSoFar, resultOf, rightAnswer, roundTorches, TORCHES_PER_ANSWER, TORCHES_PER_ROUND } from './play'
import { setsFor, type Phase, type PlaySet, type Question } from './schedule'

// The full-screen CrowdPlay screens, one per phase of the schedule. Dark and big, like a game show
// on a phone: one thing to read, one thing to tap.

const SHAPES = ['▲', '◆', '●', '■', '★', '✚']

const clockOf = (ms: number) => {
  const d = new Date(ms)
  return formatTime(`${d.getHours()}:${d.getMinutes()}`)
}
const pct = (n: number) => `${Math.round(n * 100)}%`

export type PlayCtx = {
  session: Session
  now: number
  answers: Record<string, string>
  players: number
  onAnswer: (question: Question, value: string) => void
  onClose: () => void
}

// ---- Frame ----

export function TopBar({ ctx, phase }: { ctx: PlayCtx; phase: Phase }) {
  const torches = setsFor(ctx.session.id).reduce((sum, set) => sum + roundTorches(set, ctx.answers), 0)
  const inRound = phase.kind === 'intro' || phase.kind === 'question' || phase.kind === 'result'
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 px-3">
      <button type="button" onClick={ctx.onClose} aria-label="Close CrowdPlay" className="grid size-10 place-items-center rounded-full bg-background/10">
        <X className="size-5" />
      </button>
      <div className="min-w-0 flex-1 text-center">
        <p className="truncate text-sm font-semibold">{inRound ? phase.set.title : 'CrowdPlay'}</p>
        {inRound && phase.kind !== 'intro' ? (
          <Dots set={phase.set} current={phase.question.index} answers={ctx.answers} />
        ) : (
          <p className="truncate text-xs opacity-60">{ctx.session.title}</p>
        )}
      </div>
      <span className="inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-full bg-background/10 px-3 text-sm font-semibold tabular-nums" aria-label={`${torches} Torches earned in this game`}>
        <Flame className="size-4 fill-current" />
        {torches}
      </span>
    </header>
  )
}

function Dots({ set, current, answers }: { set: PlaySet; current: number; answers: Record<string, string> }) {
  return (
    <span className="mt-1 flex justify-center gap-1.5" aria-label={`Question ${current + 1} of ${set.questions.length}`}>
      {set.questions.map((q, i) => (
        <span
          key={q.id}
          className={cn('h-1.5 rounded-full transition-all', i === current ? 'w-5 bg-background' : q.id in answers ? 'w-1.5 bg-background/70' : 'w-1.5 bg-background/25')}
        />
      ))}
    </span>
  )
}

// ---- Waiting for the next round ----

export function Waiting({ ctx, next, left }: { ctx: PlayCtx; next: PlaySet; left: number }) {
  return (
    <div className="flex flex-1 flex-col px-5 pb-6">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-6xl" aria-hidden>
          {next.emoji}
        </p>
        <p className="mt-4 text-sm opacity-60">Next round · {clockOf(next.start)}</p>
        <h1 className="mt-1 font-heading text-3xl font-bold">{next.title}</h1>
        <p className="mt-6 font-heading text-7xl leading-none font-bold tabular-nums">{formatCountdown(left)}</p>
        <p className="mt-4 text-sm opacity-60 tabular-nums">
          {Math.round(ctx.players * (left < 120 ? 0.9 : 0.55)).toLocaleString()} fans waiting · {next.questions.length} questions
        </p>
      </div>
      <TorchNote />
      <RoundList ctx={ctx} />
    </div>
  )
}

function TorchNote() {
  return (
    <p className="mb-3 flex items-center justify-center gap-1.5 text-center text-xs opacity-70">
      <Flame className="size-3.5 fill-current" />
      {TORCHES_PER_ANSWER} Torches for every answer, {TORCHES_PER_ROUND} more for finishing a round
    </p>
  )
}

function RoundList({ ctx }: { ctx: PlayCtx }) {
  const sets = setsFor(ctx.session.id)
  const upNext = sets.find((set) => ctx.now < set.start)
  return (
    <ol className="divide-y divide-background/10 rounded-2xl bg-background/10">
      {sets.map((set) => {
        const done = ctx.now >= set.end
        const live = ctx.now >= set.start && !done
        const n = answeredIn(set, ctx.answers)
        return (
          <li key={set.id} className="flex items-center gap-3 px-4 py-3">
            <span className="text-xl" aria-hidden>
              {set.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn('block truncate text-sm font-medium', done && 'opacity-60')}>{set.title}</span>
              <span className="block text-xs tabular-nums opacity-60">{clockOf(set.start)}</span>
            </span>
            <span className="shrink-0 text-xs font-semibold tabular-nums">
              {live ? (
                <span className="inline-flex items-center gap-1 text-red-400">
                  <span className="size-1.5 animate-pulse rounded-full bg-current" />
                  Live
                </span>
              ) : done ? (
                <span className="opacity-60">{n ? `${n} of ${set.questions.length} answered` : 'Missed'}</span>
              ) : set === upNext ? (
                <span>Up next</span>
              ) : (
                <span className="opacity-60">Later</span>
              )}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

// ---- Round intro: 5, 4, 3... ----

export function Intro({ set, left }: { set: PlaySet; left: number }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <p className="text-7xl" aria-hidden>
        {set.emoji}
      </p>
      <h1 className="mt-5 font-heading text-4xl font-bold">{set.title}</h1>
      <p className="mt-2 opacity-60">
        {set.questions.length} questions · answer fast, it’s all at once
      </p>
      <p key={left} className="animate-in zoom-in-50 fade-in mt-10 font-heading text-8xl leading-none font-bold tabular-nums duration-500">
        {left}
      </p>
    </div>
  )
}

// ---- A question ----

function Timer({ left, total }: { left: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-label="Time left to answer"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={left}
        className="h-2 flex-1 overflow-hidden rounded-full bg-background/15"
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-1000 ease-linear', left <= 3 ? 'bg-red-500' : 'bg-background')}
          style={{ width: `${(left / total) * 100}%` }}
        />
      </div>
      <span className={cn('w-8 text-right font-heading text-2xl font-bold tabular-nums', left <= 3 && 'text-red-400')}>{left}</span>
    </div>
  )
}

export function QuestionScreen({ ctx, question, left }: { ctx: PlayCtx; question: Question; left: number }) {
  const mine = ctx.answers[question.id]
  const answered = answeredSoFar(question, ctx.players, ctx.now)
  return (
    <div className="flex flex-1 flex-col px-5 pb-6">
      <Timer left={left} total={question.seconds} />
      <h1 className="mt-6 font-heading text-[1.7rem] leading-tight font-bold">{question.title}</h1>
      <p className="mt-1.5 text-sm opacity-60">{question.prompt}</p>

      <div className="mt-auto pt-6">
        {question.kind === 'pin-map' ? (
          <MapAnswer question={question} mine={mine} onAnswer={(code) => ctx.onAnswer(question, code)} />
        ) : (
          <Tiles question={question} mine={mine} onAnswer={(id) => ctx.onAnswer(question, id)} />
        )}
        <p className="mt-4 text-center text-sm tabular-nums opacity-70" aria-live="polite">
          {mine !== undefined ? (
            <>
              <span className="font-semibold">Locked in · +{TORCHES_PER_ANSWER} Torches.</span> Waiting for the crowd · {answered.toLocaleString()} answered
            </>
          ) : (
            `${answered.toLocaleString()} of ${ctx.players.toLocaleString()} answered`
          )}
        </p>
      </div>
    </div>
  )
}

function Tiles({ question, mine, onAnswer }: { question: Question; mine?: string; onAnswer: (id: string) => void }) {
  const options = question.options ?? []
  const locked = mine !== undefined
  return (
    <div role="group" aria-label={question.title} className="grid grid-cols-2 gap-3">
      {options.map((o, i) => {
        const picked = mine === o.id
        return (
          <button
            key={o.id}
            type="button"
            disabled={locked}
            aria-pressed={picked}
            onClick={() => onAnswer(o.id)}
            className={cn(
              'relative flex min-h-32 flex-col items-center justify-center gap-1.5 rounded-3xl p-3 text-center font-semibold transition-all active:scale-95',
              picked ? 'bg-background text-foreground' : 'bg-background/10',
              locked && !picked && 'opacity-30',
              options.length === 2 && 'min-h-44',
            )}
          >
            <span className="absolute top-3 left-3.5 text-xs opacity-50" aria-hidden>
              {SHAPES[i]}
            </span>
            {picked && <Check className="absolute top-3 right-3 size-4" aria-hidden />}
            {o.emoji && (
              <span className="text-4xl leading-none" aria-hidden>
                {o.emoji}
              </span>
            )}
            <span className={cn('leading-tight', o.emoji ? 'text-base' : 'text-xl')}>{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// Tap your country on the map (or pick it from the list), then lock it in
function MapAnswer({ question, mine, onAnswer }: { question: Question; mine?: string; onAnswer: (code: string) => void }) {
  const [picked, setPicked] = useState<string>()
  const selected = mine ?? picked
  const country = selected ? crowdCountry(selected) : undefined
  return (
    <div>
      <div className="overflow-hidden rounded-3xl bg-background p-2 text-foreground">
        <WorldMap selected={selected} onPick={mine ? undefined : setPicked} selectedTag={mine ? 'You' : undefined} />
      </div>
      {mine ? (
        <p className="mt-3 text-center text-lg font-semibold">
          {country?.flag} {country?.name}
        </p>
      ) : (
        <div className="mt-3 flex gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{question.title}</span>
            <select
              value={picked ?? ''}
              onChange={(e) => setPicked(e.target.value || undefined)}
              className="h-12 w-full rounded-full bg-background/10 px-4 text-sm font-medium text-background outline-none"
            >
              <option value="">Or pick from the list</option>
              {CROWD_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={!picked}
            onClick={() => picked && onAnswer(picked)}
            className="h-12 shrink-0 rounded-full bg-background px-5 text-sm font-semibold text-foreground disabled:opacity-30"
          >
            Lock in
          </button>
        </div>
      )}
    </div>
  )
}

// ---- The result of a question ----

export function ResultScreen({ ctx, question, left, last }: { ctx: PlayCtx; question: Question; left: number; last: boolean }) {
  const mine = ctx.answers[question.id]
  const dist = resultOf(question, ctx.now, mine)
  return (
    <div className="flex flex-1 flex-col px-5 pb-6">
      <div className="my-auto py-4">
        <p className="text-sm opacity-60">{question.title}</p>
        {question.kind === 'pin-map' ? <MapResult dist={dist} mine={mine} /> : <ChoiceResult question={question} dist={dist} mine={mine} />}
      </div>
      <p className="pt-2 text-center text-sm tabular-nums opacity-60">
        {last ? 'Round wraps up' : 'Next question'} in {left}
      </p>
    </div>
  )
}

function ChoiceResult({ question, dist, mine }: { question: Question; dist: Dist; mine?: string }) {
  const options = question.options ?? []
  const right = rightAnswer(question)
  const top = topId(dist)
  const label = (id?: string) => options.find((o) => o.id === id)?.label ?? ''
  const headline =
    right !== undefined
      ? mine === undefined
        ? { big: `It’s ${label(right)}`, small: 'You missed this one.' }
        : mine === right
          ? { big: 'You got it! 🎉', small: `${pct(shareOf(dist, right))} of the crowd did too.` }
          : { big: 'Not quite', small: `It’s ${label(right)}.` }
      : question.kind === 'predict'
        ? { big: `Crowd picks ${label(top)}`, small: 'We’ll know after the race.' }
        : mine === undefined
          ? { big: `Most said ${label(top)}`, small: 'You missed this one.' }
          : { big: `Most said ${label(top)}`, small: mine === top ? 'You’re with the crowd.' : `You’re with ${pct(shareOf(dist, mine))} of the crowd.` }

  return (
    <>
      <h1 className="mt-2 font-heading text-3xl font-bold">{headline.big}</h1>
      <p className="mt-1 opacity-70">{headline.small}</p>
      <ol className="mt-6 space-y-2.5">
        {options.map((o, i) => {
          const share = shareOf(dist, o.id)
          const strong = right !== undefined ? o.id === right : o.id === top
          return (
            <li key={o.id} className="relative overflow-hidden rounded-2xl bg-background/10">
              <span
                className={cn('animate-in slide-in-from-left absolute inset-y-0 left-0 duration-700', strong ? 'bg-background' : 'bg-background/20')}
                style={{ width: `${share * 100}%` }}
                aria-hidden
              />
              <span className={cn('relative flex min-h-14 items-center gap-3 px-4 mix-blend-difference')}>
                <span className="text-xs opacity-60" aria-hidden>
                  {SHAPES[i]}
                </span>
                {o.emoji && <span aria-hidden>{o.emoji}</span>}
                <span className="min-w-0 flex-1 truncate font-medium">{o.label}</span>
                {mine === o.id && <span className="rounded-full border border-current px-2 py-0.5 text-[11px] font-semibold">You</span>}
                {right === o.id && <Check className="size-4" aria-label="Right answer" />}
                <span className="w-11 text-right font-semibold tabular-nums">{pct(share)}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </>
  )
}

function MapResult({ dist, mine }: { dist: Dist; mine?: string }) {
  const top = Object.entries(dist.counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
  const me = mine ? crowdCountry(mine) : undefined
  const countries = Object.values(dist.counts).filter((n) => n > 0).length
  return (
    <>
      <h1 className="mt-2 font-heading text-3xl font-bold">{countries} countries here</h1>
      <p className="mt-1 opacity-70">
        {me ? `You’re one of ${Math.round(dist.counts[me.code] ?? 0).toLocaleString()} fans from ${me.name}.` : 'You missed this one.'}
      </p>
      <div className="mt-5 overflow-hidden rounded-3xl bg-background p-2 text-foreground">
        <WorldMap points={Object.entries(dist.counts).map(([code, n]) => ({ code, value: Math.sqrt(n) }))} selected={mine} selectedTag="You" />
      </div>
      <ol className="mt-4 grid grid-cols-3 gap-2 text-center">
        {top.map(([code, n]) => {
          const c = crowdCountry(code)
          return (
            <li key={code} className="rounded-2xl bg-background/10 px-2 py-3">
              <span className="text-2xl" aria-hidden>
                {c?.flag}
              </span>
              <span className="mt-1 block text-xs font-semibold">{code}</span>
              <span className="block text-xs tabular-nums opacity-60">{pct(n / dist.total)}</span>
            </li>
          )
        })}
      </ol>
    </>
  )
}

// ---- After a round, and after the last one ----

export function Done({ ctx, set, next }: { ctx: PlayCtx; set: PlaySet; next?: PlaySet }) {
  const n = answeredIn(set, ctx.answers)
  const torches = roundTorches(set, ctx.answers)
  return (
    <div className="flex flex-1 flex-col px-5 pb-6">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-6xl" aria-hidden>
          {n ? '🎉' : set.emoji}
        </p>
        <h1 className="mt-4 font-heading text-3xl font-bold">{set.title} is done</h1>
        <p className="mt-2 opacity-70">
          You answered {n} of {set.questions.length}
        </p>
        {torches > 0 && (
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-background px-5 py-3 font-heading text-2xl font-bold text-foreground tabular-nums">
            <Flame className="size-6 fill-current" />+{torches} Torches
          </p>
        )}
        {next && (
          <p className="mt-8 text-sm opacity-70 tabular-nums">
            Next: {next.title} at {clockOf(next.start)} · in {formatCountdown(Math.max(0, Math.ceil((next.start - ctx.now) / 1000)))}
          </p>
        )}
      </div>
      <button type="button" onClick={ctx.onClose} className="h-14 rounded-full bg-background font-semibold text-foreground">
        Back to the game
      </button>
    </div>
  )
}

export function Over({ ctx }: { ctx: PlayCtx }) {
  const torches = setsFor(ctx.session.id).reduce((sum, set) => sum + roundTorches(set, ctx.answers), 0)
  return (
    <div className="flex flex-1 flex-col px-5 pb-6">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-6xl" aria-hidden>
          🏁
        </p>
        <h1 className="mt-4 font-heading text-3xl font-bold">That’s all for tonight</h1>
        <p className="mt-2 opacity-70">
          {torches ? `You earned ${torches} Torches in CrowdPlay.` : 'No more rounds in this game.'}
        </p>
      </div>
      <Link to={`/sports/games/${ctx.session.id}/recap`} className="flex h-14 items-center justify-center rounded-full bg-background font-semibold text-foreground">
        See how the crowd played
      </Link>
      <button type="button" onClick={ctx.onClose} className="mt-2 h-12 font-medium opacity-70">
        Back to the game
      </button>
    </div>
  )
}
