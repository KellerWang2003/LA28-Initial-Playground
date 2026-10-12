import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router'
import { AppShell } from '@/components/app-shell'
import { EmptyScreen } from '@/components/empty-screen'
import { SaveButton } from '@/components/save-sheet'
import ExplorePage from '@/pages/explore'
import PinCapturePage from '@/pages/pin-capture'
import PinDetailPage from '@/pages/pin-detail'
import BonusPage from '@/pages/bonus'
import DevFlowsPage from '@/pages/dev-flows'
import { DebugPanel } from '@/components/debug-panel'
import { BatonRuntime } from '@/components/baton-runtime'
import { FlowRunPill } from '@/components/flow-run-pill'
import BatonRecapPage from '@/pages/baton-recap'
import PassportPage, { PassportStorePage } from '@/pages/passport'
import EventsPage from '@/pages/events'
import EventCreatePage from '@/pages/event-create'
import KeepGoingPage from '@/pages/keep-going'
import SportsPage from '@/pages/sports'
import GameRoomPage from '@/pages/game-room'
import SavedPage from '@/pages/saved'
import SavedListPage from '@/pages/saved-list'
import GameRecapPage from '@/pages/game-recap'
import CrowdPlayPage from '@/pages/crowd-play'
import ProfilePage from '@/pages/profile'
import ProfileSettingsPage from '@/pages/profile-settings'
import PeoplePage from '@/pages/people'
import PeopleAddPage from '@/pages/people-add'
import MyCodePage from '@/pages/my-code'
import PersonPage from '@/pages/person'
import SearchPage from '@/pages/search'
import { chats, personById } from '@/data/mock'
import { eventById, placeById } from '@/data/la28'

// Loads only when opened: it reads the app's source to count where components are used
const DevDesignPage = lazy(() => import('@/pages/dev-design'))

function App() {
  // The compiler drops the keep-going route from this list. Leave the router unmemoized.
  "use no memo"
  return (
    <>
    <Routes>
      {/* Tabs (with the floating tab bar) */}
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/explore" replace />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="sports" element={<SportsPage />} />
        <Route path="people" element={<PeoplePage />} />
      </Route>

      {/* Pushed screens */}
      <Route path="explore/pins/:pinId" element={<PinDetailPage />} />
      <Route path="explore/pins/:pinId/capture" element={<PinCapturePage />} />
      <Route path="explore/pins/:pinId/bonus/:bonusId" element={<BonusPage />} />
      <Route path="passport" element={<PassportPage />} />
      <Route path="passport/store" element={<PassportStorePage />} />
      <Route path="batons/recap" element={<BatonRecapPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="profile/settings" element={<ProfileSettingsPage />} />
      <Route path="profile/saved" element={<SavedPage />} />
      <Route path="profile/saved/:listId" element={<SavedListPage />} />
      <Route path="sports/games/:sessionId" element={<GameRoomPage />} />
      <Route path="sports/games/:sessionId/recap" element={<GameRecapPage />} />
      <Route path="sports/games/:sessionId/play" element={<CrowdPlayPage />} />
      <Route path="events/create" element={<EventCreatePage />} />
      <Route path="events/keep-going" element={<KeepGoingPage />} />
      <Route path="events/:eventId" element={<EventDetail />} />
      <Route path="places/:placeId" element={<PlaceDetail />} />
      <Route path="search" element={<SearchPage />} />
      <Route path="people/add" element={<PeopleAddPage />} />
      <Route path="people/add/code" element={<MyCodePage />} />
      <Route path="people/chat/:chatId" element={<ChatThread />} />
      <Route path="people/:personId" element={<PersonPage />} />

      {/* Prototype only: jump into each challenge flow */}
      <Route path="dev/flows" element={<DevFlowsPage />} />
      {/* Prototype only: the design system, every shared component in its states */}
      <Route path="dev/design" element={<Suspense><DevDesignPage /></Suspense>} />

      <Route path="*" element={<Navigate to="/explore" replace />} />
    </Routes>
    <BatonRuntime />
    <DebugPanel />
    <FlowRunPill />
    </>
  )
}

// Not designed yet: empty screens titled with the right name

function EventDetail() {
  const { eventId = '' } = useParams()
  const event = eventById(eventId)
  // Not designed yet, but saving to a list lives here
  return <EmptyScreen title={event?.title ?? 'Event'} action={event && <SaveButton item={{ kind: 'event', id: event.id }} header />} />
}

function PlaceDetail() {
  const { placeId = '' } = useParams()
  return <EmptyScreen title={placeById(placeId)?.name ?? 'Place'} />
}

function ChatThread() {
  const { chatId = '' } = useParams()
  const chat = chats.find((c) => c.id === chatId)
  return <EmptyScreen title={chat ? personById(chat.personId)!.name : 'Chat'} />
}

export default App
