import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Match3Rewardmode from '../platforms/tablet-rewardmode/match3-v1.0-tablet-rewardmode.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Match3Rewardmode />
  </StrictMode>
)
