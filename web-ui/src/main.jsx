import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { GeolocationProvider } from './hooks/useGeolocation'

const isAdmin = window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/');
const rootEl = document.getElementById('root');
if (!rootEl) {
  document.body.innerHTML = '<div style="padding:20px;font-family:sans-serif">App failed to mount: #root element not found.</div>';
} else {
createRoot(rootEl).render(
  <GeolocationProvider>
    <StrictMode>
      <ErrorBoundary>
        {isAdmin ? <AdminDashboard /> : <App />}
      </ErrorBoundary>
    </StrictMode>
  </GeolocationProvider>,
  )
}
