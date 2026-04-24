import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Match3Sim from '../platforms/tablet-sim/match3-v1.1-tablet-sim.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Match3Sim />
  </StrictMode>
)
