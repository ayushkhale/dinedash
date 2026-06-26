import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import PublicMenuPage from './pages/PublicMenuPage'
import api from './api'

// Route helper to only allow authenticated users
function ProtectedRoute({ children }) {
  const hasAccessToken = !!window.__accessToken
  const hasRefreshToken = !!localStorage.getItem('refreshToken')

  if (!hasAccessToken && !hasRefreshToken) {
    return <Navigate to="/login" replace />
  }
  return children
}

// Route helper to prevent authenticated users from visiting guest pages
function PublicRoute({ children }) {
  const hasAccessToken = !!window.__accessToken
  if (hasAccessToken) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const storedRefreshToken = localStorage.getItem('refreshToken')
      if (storedRefreshToken) {
        try {
          await api.refreshSession()
        } catch (e) {
          console.error("Failed to restore session on boot:", e)
        }
      }
      setLoading(false)
    }

    initAuth()

    const handleAuthLogout = () => {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    window.addEventListener('auth-logout', handleAuthLogout)
    return () => {
      window.removeEventListener('auth-logout', handleAuthLogout)
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
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/menu" element={<PublicMenuPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App


