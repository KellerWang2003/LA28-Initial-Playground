import { Navigate, Route, Routes, useParams } from 'react-router'
import { AppShell } from '@/components/app-shell'
import { EmptyScreen } from '@/components/empty-screen'
import ExplorePage from '@/pages/explore'
import PinCapturePage from '@/pages/pin-capture'
import PinDetailPage from '@/pages/pin-detail'
import PassportPage from '@/pages/passport'
import EventsPage from '@/pages/events'
import EventCreatePage from '@/pages/event-create'
import SportsPage from '@/pages/sports'
import PeoplePage from '@/pages/people'
import { chats, personById } from '@/data/mock'
import { eventById, placeById } from '@/data/la28'

function App() {
  return (
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
      <Route path="passport" element={<PassportPage />} />
      <Route path="profile" element={<EmptyScreen title="Profile" />} />
      <Route path="events/create" element={<EventCreatePage />} />
      <Route path="events/:eventId" element={<EventDetail />} />
      <Route path="places/:placeId" element={<PlaceDetail />} />
      <Route path="people/chat/:chatId" element={<ChatThread />} />
      <Route path="people/:personId" element={<PersonProfile />} />

      <Route path="*" element={<Navigate to="/explore" replace />} />
    </Routes>
  )
}

// Not designed yet: empty screens titled with the right name

function EventDetail() {
  const { eventId = '' } = useParams()
  return <EmptyScreen title={eventById(eventId)?.title ?? 'Event'} />
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
