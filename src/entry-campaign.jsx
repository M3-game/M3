import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Match3Campaign from '../platforms/campaign/tablet/match3-v1.7-campaign-tablet.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Match3Campaign />
  </StrictMode>
)
