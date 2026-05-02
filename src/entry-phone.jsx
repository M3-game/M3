import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Match3Game from '../platforms/phone/match3-v13.3.1-phone.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Match3Game />
  </StrictMode>
)
