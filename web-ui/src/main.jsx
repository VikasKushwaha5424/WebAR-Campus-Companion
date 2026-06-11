import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

const isAdmin = window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      {isAdmin ? <AdminDashboard /> : <App />}
    </ErrorBoundary>
  </StrictMode>,
)
