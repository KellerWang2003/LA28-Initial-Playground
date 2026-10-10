import { Navigate, Route, Routes, useParams } from 'react-router'
import { AppShell } from '@/components/app-shell'
import { EmptyScreen } from '@/components/empty-screen'
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
import SportsPage from '@/pages/sports'
import ProfilePage from '@/pages/profile'
import ProfileSettingsPage from '@/pages/profile-settings'
import PeoplePage from '@/pages/people'
import PeopleAddPage from '@/pages/people-add'
import { chats, personById } from '@/data/mock'
import { eventById, placeById, sessionById } from '@/data/la28'

function App() {
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
      <Route path="sports/games/:sessionId" element={<GameRoom />} />
      <Route path="sports/games/:sessionId/recap" element={<GameRecap />} />
      <Route path="events/create" element={<EventCreatePage />} />
      <Route path="events/:eventId" element={<EventDetail />} />
      <Route path="places/:placeId" element={<PlaceDetail />} />
      <Route path="people/add" element={<PeopleAddPage />} />
      <Route path="people/chat/:chatId" element={<ChatThread />} />
      <Route path="people/:personId" element={<PersonProfile />} />

      {/* Prototype only: jump into each challenge flow */}
      <Route path="dev/flows" element={<DevFlowsPage />} />

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
  return <EmptyScreen title={eventById(eventId)?.title ?? 'Event'} />
}

function GameRoom() {
  const { sessionId = '' } = useParams()
  const session = sessionById(sessionId)
  return <EmptyScreen title={session ? `${session.title} · Room` : 'Game room'} />
}

function GameRecap() {
  const { sessionId = '' } = useParams()
  const session = sessionById(sessionId)
  return <EmptyScreen title={session ? `${session.title} · Recap` : 'Game recap'} />
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

function PersonProfile() {
  const { personId = '' } = useParams()
  return <EmptyScreen title={personById(personId)?.name ?? 'Profile'} />
}

export default App
