import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import './together.css'
import { Playground } from './playground'

// Its own page, apart from the app: open /playgrounds/together/ on the dev server.
// iOS ignores user-scalable=no; block page pinch-zoom, as the app does
document.addEventListener('gesturestart', (e) => e.preventDefault())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Playground />
  </StrictMode>,
)
