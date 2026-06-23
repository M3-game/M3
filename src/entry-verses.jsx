import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Match3Verses from '../platforms/tablet-verses/match3-v1.17-tablet-verses.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Match3Verses />
  </StrictMode>
)
