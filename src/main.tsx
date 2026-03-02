import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'

// Restore dark mode before first render to avoid flash of wrong theme
if (localStorage.getItem('danskprep_dark_mode') === 'true') {
  document.documentElement.classList.add('dark')
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
)
