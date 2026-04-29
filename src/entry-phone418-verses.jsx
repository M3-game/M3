import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Match3Verses from '../platforms/phone-418-verses/match3-v1.0-phone-418-verses.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Match3Verses />
  </StrictMode>
)
