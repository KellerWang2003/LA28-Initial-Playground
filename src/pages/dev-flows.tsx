import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { BookMarked, BookOpen, Bookmark, ChevronLeft, ChevronRight, RotateCcw, Sparkles, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DebugControls } from '@/components/debug-panel'
import { BatonDebugControls } from '@/components/baton-debug'
import { BatonFlowsSection } from '@/components/baton-flows'
import { bonusIcon, resetBonus, resetDemo } from '@/lib/bonuses'
import { setCollected } from '@/lib/collected'
import { localMinute } from '@/lib/clock'
import { setDebug, type DebugState } from '@/lib/debug'
import { debugMoments } from '@/features/crowdplay/schedule'
import { moveFan } from '@/lib/location'
import { pinById, placeById } from '@/data/la28'
import { BONUSES, bonusById, bonusKindTitle, type Bonus, type BonusKind } from '@/data/bonuses'

// Internal page: jump straight into each challenge flow with the right setup
// (standing at the pin, pin collected, clock inside the window, game on). Each jump opens
// the real screen, so it's the actual flow, not a copy.

type Jump = {
  title: string
  detail: string
  to: string
  debug?: Partial<DebugState>
  // Where the fan stands: a place id, or null for the hotel (away from every pin)
  at?: string | null
  collect?: Record<string, boolean>
  resetBonus?: string
}

const ON_TIME: Partial<DebugState> = { time: null, venueGame: 'schedule' }
// Standing at the pin's place
const atPin = (id: string) => pinById(id)!.place

const structure: Jump[] = [
  { title: 'Pin with bonuses, not collected', detail: 'Manhattan Beach · Collect and Bonus in the panel', to: '/explore/pins/p_manhattan', debug: ON_TIME, at: atPin('p_manhattan'), collect: { p_manhattan: false } },
  { title: 'Collect at the right moment', detail: 'Manhattan Beach at sunset · the sunset bonus comes with the photo, then the bonus list', to: '/explore/pins/p_manhattan/capture',
    debug: { ...ON_TIME, time: '2028-07-20T19:55' }, at: atPin('p_manhattan'), collect: { p_manhattan: false }, resetBonus: 'p_manhattan_sunset' },
  { title: 'Collected, bonuses to play', detail: 'Urban Light · 1 of 3 done', to: '/explore/pins/p_lacma', debug: ON_TIME, at: atPin('p_lacma'), collect: { p_lacma: true } },
  { title: 'Away from the pin', detail: 'Urban Light · bonuses wait until you’re there', to: '/explore/pins/p_lacma', debug: ON_TIME, at: null, collect: { p_lacma: true } },
  { title: 'Timed bonus not open yet', detail: 'Griffith Observatory before 7:40 PM · the pin is open, the city lights bonus waits', to: '/explore/pins/p_griffith', debug: ON_TIME, at: atPin('p_griffith'), collect: { p_griffith: false } },
  { title: 'Timed bonus open now', detail: 'Malibu Pier at sunset · not collected, the bonus comes with your photo', to: '/explore/pins/p_malibu',
    debug: { ...ON_TIME, time: '2028-07-20T19:55' }, at: atPin('p_malibu'), collect: { p_malibu: false }, resetBonus: 'p_malibu_sunset' },
  { title: 'Venue before the game', detail: 'Athletics at the Coliseum · start gun waits for 8:00 PM', to: '/explore/pins/p_coliseum', debug: ON_TIME, at: atPin('p_coliseum'), collect: { p_coliseum: true } },
  { title: 'Passport with marks', detail: 'Bonus counts on the stamps', to: '/passport' },
]

// The Passport booklet: the cover swings open onto each bookmark
const passport: Jump[] = [
  { title: 'Open the Passport', detail: 'Cover opens onto the ID page', to: '/passport' },
  { title: 'Challenges bookmark', detail: 'Daily and weekly challenges', to: '/passport?section=challenges' },
  { title: 'Just collected a pin', detail: 'Urban Light · opens on its page, highlighted', to: '/passport?pin=p_lacma', collect: { p_lacma: true } },
  { title: 'Batons bookmark', detail: 'Stamps from batons you carried', to: '/passport?section=batons' },
  { title: 'Ticket stubs bookmark', detail: 'Scanned tickets', to: '/passport?section=tickets' },
]

// CrowdPlay in the swim final: the button on the game page, each step of a round, and the recap
const SWIM = '/sports/games/s_swim_0720'
const crowdplay: Jump[] = [
  { title: 'Game page with the CrowdPlay button', detail: 'Live stats, the button counts down to the next round', to: SWIM, debug: { ...ON_TIME, time: '2028-07-20T19:19:40' } },
  ...debugMoments('s_swim_0720').map((m) => ({ title: m.label, detail: 'Who’s here round · full screen', to: `${SWIM}/play`, debug: { ...ON_TIME, time: m.time } })),
  { title: 'Recap with who was here', detail: 'Your answers, Torches and the crowd, after the game', to: `${SWIM}/recap`, debug: { ...ON_TIME, time: '2028-07-20T20:50' } },
]

// Activities: Right now, and saved lists with the Watch list
const activities: Jump[] = [
  { title: 'Right now', detail: 'Your live swimming room, the hangout, and the Watch list: a live game and a result', to: '/events', debug: ON_TIME },
  { title: 'Watch-listed game opens', detail: '8:05 PM · Brazil vs Morocco joins Right now, though you’re not going', to: '/events', debug: { ...ON_TIME, time: '2028-07-20T20:05' } },
  { title: 'Saved lists', detail: 'From the profile: Watch list, Beach days, Following Brazil, and New list', to: '/profile/saved', debug: ON_TIME },
  { title: 'Watch list', detail: 'Live, later and finished games on one list', to: '/profile/saved/watch', debug: ON_TIME },
]

// 'YYYY-MM-DDTHH:MM' a few minutes after `iso`, in local time like the mock data
const minutesAfter = (iso: string, minutes: number) => localMinute(Date.parse(iso) + minutes * 60_000)

// Ready to play: at the pin, pin collected, bonus not done, inside its window, game on
function bonusJump(b: Bonus): Jump {
  const pin = pinById(b.pin)!
  return {
    title: pin.name.replace(/ Pin$/, ''),
    detail: b.detail,
    to: `/explore/pins/${b.pin}/bonus/${b.id}`,
    debug: {
      time: b.window ? minutesAfter(b.window.opens, 5) : null,
      venueGame: pin.kind === 'venue' ? 'live' : 'schedule',
    },
    at: pin.place,
    collect: { [b.pin]: true },
    resetBonus: b.id,
  }
}

const kinds: BonusKind[] = ['angle', 'moment', 'selfie', 'game', 'together']

// Jump straight to a state inside a challenge's flow, set up like bonusJump.
// `at` opens the challenge at that point (no `at`: its intro); `time` moves the clock.
type State = { bonus: string; at?: string; time?: string | null; title: string; detail: string }

const states: Partial<Record<BonusKind, State[]>> = {
  angle: [
    { bonus: 'p_lacma_angle', at: 'hint', title: 'Hint', detail: 'Blurred hint of the target view' },
    { bonus: 'p_lacma_angle', at: 'camera', title: 'Not lined up', detail: 'Ghost over the camera, shutter locked' },
    { bonus: 'p_lacma_angle', at: 'matched', title: 'Lined up', detail: 'Matched, shutter open' },
  ],
  moment: [
    { bonus: 'p_manhattan_sunset', time: null, title: 'Countdown', detail: '7:20 PM, sunset opens at 7:45' },
    { bonus: 'p_manhattan_sunset', at: 'camera', title: 'Window open', detail: 'Camera with the time left' },
    { bonus: 'p_manhattan_sunset', at: 'camera', time: '2028-07-20T20:14', title: 'Closing', detail: 'One minute left, then it locks' },
    { bonus: 'p_manhattan_sunset', time: '2028-07-20T20:30', title: 'Window over', detail: '8:30 PM, closed for today' },
  ],
}

function stateJump(s: State): Jump {
  const base = bonusJump(bonusById(s.bonus)!)
  return {
    ...base,
    title: s.title,
    detail: s.detail,
    to: s.at ? `${base.to}?at=${s.at}` : base.to,
    debug: 'time' in s ? { ...base.debug, time: s.time } : base.debug,
  }
}

export default function DevFlowsPage() {
  const navigate = useNavigate()

  function go(jump: Jump) {
    if (jump.debug) setDebug(jump.debug)
    if (jump.at !== undefined) moveFan(jump.at ? { place: jump.at } : null)
    Object.entries(jump.collect ?? {}).forEach(([id, on]) => setCollected(id, on))
    if (jump.resetBonus) resetBonus(jump.resetBonus)
    navigate(jump.to)
  }

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={() => navigate(-1)}>
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="font-heading text-lg font-semibold">Flow gallery</h1>
        <span className="text-xs text-muted-foreground">Prototype only</span>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 space-y-7 overflow-y-auto overscroll-contain px-4 pt-2 pb-[max(env(safe-area-inset-bottom),24px)]">
        <Section icon={BookOpen} title="Collect and bonus">
          {structure.map((j) => (
            <JumpRow key={j.title} jump={j} onGo={go} />
          ))}
        </Section>

        <Section icon={Sparkles} title="CrowdPlay">
          {crowdplay.map((j) => (
            <JumpRow key={j.title} jump={j} onGo={go} />
          ))}
        </Section>

        <Section icon={Bookmark} title="Activities and saved">
          {activities.map((j) => (
            <JumpRow key={j.title} jump={j} onGo={go} />
          ))}
        </Section>

        <Section icon={BookMarked} title="Passport">
          {passport.map((j) => (
            <JumpRow key={j.title} jump={j} onGo={go} />
          ))}
        </Section>

        {kinds.map((kind) => (
          <Section key={kind} icon={bonusIcon[kind]} title={bonusKindTitle[kind]}>
            {BONUSES.filter((b) => b.kind === kind).map((b) => {
              const jump = bonusJump(b)
              return <JumpRow key={b.id} jump={jump} onGo={go} aside={placeById(pinById(b.pin)!.place).hood} />
            })}
            {states[kind] && (
              <li className="pt-2">
                <p className="mb-1.5 px-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  States · {pinById(bonusById(states[kind]![0].bonus)!.pin)!.name.replace(/ Pin$/, '')}
                </p>
                <ul className="grid grid-cols-2 gap-1.5">
                  {states[kind]!.map((st) => (
                    <StateTile key={st.title} jump={stateJump(st)} onGo={go} />
                  ))}
                </ul>
              </li>
            )}
          </Section>
        ))}

        <BatonFlowsSection />

        <Section icon={Sparkles} title="Current switches">
          <div className="rounded-2xl border p-3">
            <DebugControls />
          </div>
          <div className="mt-2 rounded-2xl border p-3">
            <BatonDebugControls />
          </div>
          <Button variant="outline" className="mt-2 w-full" onClick={resetDemo}>
            <RotateCcw data-icon="inline-start" />
            Reset demo
          </Button>
        </Section>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 font-heading font-semibold">
        <Icon className="size-4" />
        {title}
      </h2>
      <ul className="space-y-1.5">{children}</ul>
    </section>
  )
}

function StateTile({ jump, onGo }: { jump: Jump; onGo: (j: Jump) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onGo(jump)}
        className="flex h-full w-full flex-col rounded-2xl border px-3 py-2.5 text-left transition-transform active:scale-[0.98]"
      >
        <span className="text-sm font-medium">{jump.title}</span>
        <span className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{jump.detail}</span>
      </button>
    </li>
  )
}

function JumpRow({ jump, onGo, aside }: { jump: Jump; onGo: (j: Jump) => void; aside?: string }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onGo(jump)}
        className="flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-transform active:scale-[0.98]"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="truncate text-sm font-medium">{jump.title}</span>
            {aside && <span className="shrink-0 text-xs text-muted-foreground">{aside}</span>}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{jump.detail}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </button>
    </li>
  )
}
