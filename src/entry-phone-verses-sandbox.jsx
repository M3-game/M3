import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Match3VersesSandbox from '../platforms/phone-verses-sandbox/match3-v1.12-phone-verses-sandbox.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Match3VersesSandbox />
  </StrictMode>
)
