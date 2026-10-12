# LA28 Fan Passport — prototype

A mobile-first clickable prototype for testing layout, interaction and user flow for an LA28 Olympics fan app (map, pins, batons, sports, game rooms). It is a wireframe, not production code: everything runs on mock data in memory, with no backend.

## Commands

- `npm run dev`: Vite dev server. It listens on the LAN (`server.host`) so the app can be opened on a phone.
- `npm run build`: `tsc -b` type-check, then `vite build`. This is the only check. There are no tests.
- `npm run lint`: ESLint.
- Preview in the desktop app: `.claude/launch.json` defines `playground` (port 5173). `la28-app-web` is a separate Expo repo, not this one.
- The map needs `VITE_MAPBOX_TOKEN` in `.env.local` (see `.env.example`). Without it the map shows a placeholder.
- Deployed on Vercel as a single-page app (`vercel.json` rewrites every path to `index.html`).

Edit `vite.config.ts` only. Don't run `tsc` on a single file (e.g. `tsc vite.config.ts`): that skips the tsconfig's `noEmit` and writes a `vite.config.js`, which Vite loads *instead of* the `.ts`.

## Stack

React 19 + TypeScript, Vite 8, React Router 7 (`react-router`), Tailwind 4, shadcn (base-luma preset on `@base-ui/react`), lucide icons, mapbox-gl. The React Compiler runs through Babel, so don't hand-write `useMemo`/`useCallback`. `App.tsx` opts out with `"use no memo"` because the compiler drops a route. Keep that directive.

Import from `src` with the `@/` alias.

## Layout

- `src/App.tsx`: all routes. The tabs (Explore, Events, Sports, People) render inside `AppShell` with the floating tab bar. Everything else is a pushed screen. Screens that aren't designed yet use `EmptyScreen` with the right title.
- `src/pages/`: one file per route.
- `src/components/`: shared and feature components. `ui/` is shadcn-generated (add with the shadcn CLI and keep edits minimal).
- `src/features/<feature>/`: bigger features split into folders (`game-room/`, `crowdplay/`, `activity/`). Put new large features here instead of growing `components/`.
- `src/lib/`: small global stores and helpers.
- `src/data/`: static mock data. `la28.ts` holds places, pins, events and venues. `mock.ts` holds medals, people and chats. `batons.ts`, `bonuses.ts`, `passport.ts` and `map-layers.ts` cover their features.

## How state works

- **Stores are module-level variables plus `useSyncExternalStore`** (see `lib/collected.ts`, `lib/debug.ts`). Each one exports a `useX()` hook for render, a `getX()` for event handlers, and setters that notify listeners. Follow this pattern for new state. Don't add Redux, Zustand or context providers.
- **Everything is in-memory on purpose**: a reload resets the demo, which is how flows get re-tested. Don't persist to `localStorage`. Seed data (e.g. `SEED_COLLECTED`) keeps screens from looking empty.
- **Time**: the mock is frozen at `NOW` (Thu 20 Jul 2028, 7:20 PM, in `data/la28.ts`). Always read time from `lib/clock.ts` (`useClock()` in render, `nowMs()` in handlers), never `Date.now()` directly, so the debug panel can jump the clock and change its speed.
- **Location**: the fan's position is simulated in `lib/location.ts` (`useFanAt()`, `getFanAt()`, `moveFan()`). Pins, batons and distances all read this one position.

## Debug tooling (prototype only)

- `DebugPanel` (floating bug button on every screen) has one universal **Where** (tap the map to teleport, or pick a place) and one **When** (any date and time, plus speed). New features must read the shared clock and location. Don't add feature-specific location or time toggles. Put only switches unique to a feature in that feature's section (e.g. `BatonDebugControls`).
- `/dev/flows` is an internal gallery that sets up state and opens the real screen for each challenge flow. When you add a flow, add a jump to it there.
- `/dev/design` is the design system: foundations (tokens, type, corners, layout, icons) and every shared component rendered for real in its main states, with where it's used (counted from the source). Before building a small piece (section title, stat tile, list row), check there for one that already exists. When you add or change a shared component, add or update its entry in `features/design-system/registry.tsx`.

## Design rules

- **Black and white until designs exist.** Use the shadcn theme tokens (`primary`, `foreground`, `muted`, `border`, …), not custom colors. Undesigned art uses wireframe placeholders (a box with an X: `image-placeholder`, `placeholder`). The one exception is pin status: gray for locked, green for open, orange for expiring.
- **Hierarchy comes from grays, not color.** The page is white (`bg-background`). Content blocks (cards, tables, grouped lists) sit on the tint (`rounded-2xl bg-card`, no outline). Things inside a block that need to stand out (notes, chips, selected rows) go back to `bg-background`, and grouped rows split with `divide-background`. Live and selected use black (`border-foreground` / `bg-foreground`). See Surfaces on `/dev/design`.
- Mobile first: design at phone width. iOS page pinch-zoom is blocked in `main.tsx`, and the map handles its own gestures.
- Copy is plain and fan-facing.

## Product scope

Specs are in Notion ("LA28 — Pin Challenges Spec", "LA28 — Baton Feature Plan"). Where the two differ, the decisions below override the spec.

- **Pins**: collecting a pin = being there + taking any photo. Bonus challenges are optional extras that earn Torches and a mark on the stamp.
  - Being built: solo bonuses (unique angle, right moment, selfie with the view, solo mini games) and the together bonus (photo together).
  - There are only two social levels: solo and together (2+ people). Together can be your own party.
  - Attraction and shop pins have no time limit. Venue and event pins follow their session times, since the photo is of the game or event. Time otherwise only matters for the Right moment bonus: any photo inside the window earns it, including the one that collects the pin.
- **Batons** are their own feature, not a pin or a bonus. A baton should feel like a surprise found nearby, never something hunted from afar.
  - A baton is only visible (map marker and nearby alert) and claimable within 2 km of the fan. Daily placement keeps batons at least 4 km apart.
  - Dropping one requires being within 50 m of the spot. After dropping, you can't re-claim that baton the same day, but you can take another right away.
  - A drop note is optional text plus at most one photo (no voice or sketches). It stays sealed until the baton is claimed: until then the card only says "[name] left a note". The writer signs with a first name or as "Fan from [country]".
  - Resting batons show on the map under every filter.
- **Going vs saved**: going is taking part (a game at the venue or online, an event you join or host) and shows in My activities. Saved is just interested: Airbnb-style lists of games and events, reached from the Saved card on the profile. The built-in Watch list can't be deleted, and what's on it shows in Right now while it's on, plus today's results.
- **Not building unless asked**:
  - Back pocket: cheer swap and score prediction (later, in Sports, not as pin bonuses) and an archery game.
  - Archived: word swap, rival ritual, stadium wave, split clue, podium pose and moment burst.

## Commits

Commit messages are one or two plain sentences on what fans can now do (e.g. "Let fans earn bonus marks on pins by …"), not a list of files or components.
