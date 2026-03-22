import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Match3Game from '../platforms/desktop/match3-v12.0-desktop.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Match3Game />
  </StrictMode>
)
