import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import logoRed from '../assets/logored.png'
import api from '../api'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    if (savedEmail) {
      setForm((prev) => ({ ...prev, email: savedEmail }))
      setRememberMe(true)
    }
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await api.post('/api/auth/login', {
        email: form.email,
        password: form.password
      })
      const resData = response.data || response || {}
      const accessToken = resData.accessToken || resData.data?.accessToken
      const refreshToken = resData.refreshToken || resData.data?.refreshToken
      const user = resData.user || resData.data?.user

      window.__accessToken = accessToken
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }
      localStorage.setItem('user', JSON.stringify(user))

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', form.email)
      } else {
        localStorage.removeItem('rememberedEmail')
      }

      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative px-4 py-8 font-sans antialiased"
      style={{
        backgroundColor: '#f5f3f4',
        backgroundImage: 'linear-gradient(to right, #d3d3d3 1px, transparent 1px), linear-gradient(to bottom, #d3d3d3 1px, transparent 1px)',
        backgroundSize: '36px 36px',
      }}
    >
      {/* Floating Back to Home button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-[#161a1d]/70 hover:text-[#ba181b] transition-colors text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl border border-[#d3d3d3] hover:bg-white bg-transparent shadow-sm z-20"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
        Back to website
      </button>

      {/* Form Container */}
      <div className="w-full max-w-[460px] bg-white rounded-2xl border border-[#d3d3d3] p-8 lg:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.015)] z-10">
        <div className="mb-8 flex justify-between items-center">
          <img src={logoRed} alt="DineDash Logo" className="h-9 w-auto object-contain" />
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#ba181b] bg-[#ba181b]/10 px-2 py-0.5 rounded">
            Partner Portal
          </span>
        </div>

        <div className="mb-8">
          <h2 className="font-outfit text-3xl lg:text-4xl font-black text-[#0b090a] tracking-tight mb-2">
            Welcome back
          </h2>
          <p className="text-[#161a1d]/60 text-sm font-semibold">
            Owner or kitchen staff — access your dashboard
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-[#a4161a] border border-red-100 text-xs font-bold leading-relaxed flex items-start gap-2 animate-pulse">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="login-email" className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
              Email Address
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@restaurant.com"
              className="w-full px-4 py-3.5 rounded-xl border-2 border-[#d3d3d3] bg-white text-[#161a1d] placeholder-[#b1a7a6] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="login-password" className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest">
                Password
              </label>
              <button
                type="button"
                className="text-[#ba181b] hover:text-[#a4161a] text-[10px] font-black uppercase tracking-widest hover:underline transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-4 pr-12 py-3.5 rounded-xl border-2 border-[#d3d3d3] bg-white text-[#161a1d] placeholder-[#b1a7a6] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#161a1d]/40 hover:text-[#ba181b] transition-colors p-1 flex items-center justify-center cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#ba181b] border-2 border-[#d3d3d3] focus:ring-[#ba181b]/10 cursor-pointer accent-[#ba181b]"
              />
              <span className="text-xs text-[#161a1d]/75 font-semibold">Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ba181b] hover:bg-[#a4161a] active:bg-[#660708] text-white font-black py-4 px-6 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-[#ba181b]/10 hover:shadow-xl hover:shadow-[#ba181b]/20 active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none uppercase tracking-widest text-center"
          >
            {loading ? 'Verifying session...' : 'Sign in to workspace'}
          </button>
        </form>

        {/* Navigation Helper */}
        <div className="mt-8 text-center pt-6 border-t border-[#d3d3d3]/30">
          <span className="text-xs text-[#161a1d]/75 font-semibold">
            New restaurant?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-[#ba181b] hover:text-[#a4161a] font-black hover:underline transition-colors cursor-pointer"
            >
              Register here
            </button>
          </span>
        </div>
      </div>
    </div>
  )
}
