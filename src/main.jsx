import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Match3Game from '../platforms/tablet/match3-v10.5.3-tablet.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Match3Game />
  </StrictMode>
)
