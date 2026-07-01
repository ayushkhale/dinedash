import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import DashboardPage from './pages/DashboardPage'
import PublicMenuPage from './pages/PublicMenuPage'
import api from './api'

// Route helper to only allow authenticated users
function ProtectedRoute({ children }) {
  const hasAccessToken = !!api.accessToken
  const hasFallbackToken = !!localStorage.getItem('fallback_refresh_token')

  if (!hasAccessToken && !hasFallbackToken) {
    return <Navigate to="/login" replace />
  }
  return children
}

// Route helper to prevent authenticated users from visiting guest pages
function PublicRoute({ children }) {
  const hasAccessToken = !!api.accessToken
  if (hasAccessToken) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Silently attempt to restore a persistent session using
        // the HttpOnly cookie (or fallback_refresh_token in localStorage)
        await api.checkSessionPersistence()
      } catch (e) {
        console.error('Failed to restore session on boot:', e)
      }
      setLoading(false)
    }

    initAuth()

    const handleAuthLogout = () => {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    // Redirect to the Subscription tab when the API fires a 402
    const handleSubscriptionExpired = () => {
      window.location.href = '/dashboard?tab=Subscription'
    }

    window.addEventListener('auth-logout', handleAuthLogout)
    window.addEventListener('subscription-expired', handleSubscriptionExpired)
    return () => {
      window.removeEventListener('auth-logout', handleAuthLogout)
      window.removeEventListener('subscription-expired', handleSubscriptionExpired)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f3f4]">
        <div className="w-12 h-12 border-4 border-[#ba181b]/20 border-t-[#ba181b] rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-[#161a1d] font-outfit uppercase tracking-wider">
          Initializing DineDash...
        </p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/menu" element={<PublicMenuPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App


