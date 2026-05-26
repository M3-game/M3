import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Match3Verses from '../platforms/phone-verses/match3-v1.8-phone-verses.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Match3Verses />
  </StrictMode>
)
