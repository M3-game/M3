import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Match3Game from '../platforms/phone-341/match3-v12.1-phone-341px.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Match3Game />
  </StrictMode>
)
