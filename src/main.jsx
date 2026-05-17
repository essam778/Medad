import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { BrowserRouter as Router } from 'react-router-dom'
import App from './App'
import './index.css'

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.2),
    environment: import.meta.env.MODE,
  })
}

// Handle chunk loading errors gracefully
window.addEventListener('error', (e) => {
  if (e.message?.includes('Failed to fetch dynamically imported module') ||
      e.message?.includes('Importing a disallowed module type')) {
    window.location.reload()
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </Router>
  </React.StrictMode>
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
