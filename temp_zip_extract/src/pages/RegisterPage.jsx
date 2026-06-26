import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logoRed from '../assets/logored.png'
import api from '../api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: Setup
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 3 details form
  const [details, setDetails] = useState({
    owner_name: '',
    owner_password: '',
    restaurant_name: '',
    restaurant_slug: '',
    street_address: '',
    landmark: '',
    area_locality: '',
    city: '',
    state: '',
    pincode: ''
  })

  // Timer countdown hook for Resend OTP
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    try {
      await api.post('/api/auth/send-otp', { email })
      setStep(2)
      setCountdown(60)
    } catch (err) {
      setError(err.message || 'Failed to send verification code.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = async (e) => {
    const val = e.target.value.replace(/\D/g, '') // Numeric only
    setOtp(val)
    if (error) setError('')

    if (val.length === 6) {
      setLoading(true)
      setError('')
      try {
        await api.post('/api/auth/verify-otp', { email, otp: val })
        setOtpVerified(true)
        setLoading(false)
        // Auto advance step after 800ms
        setTimeout(() => {
          setStep(3)
        }, 800)
      } catch (err) {
        setOtpVerified(false)
        setLoading(false)
        setError(err.message || 'Invalid OTP code. Please try again.')
      }
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    setLoading(true)
    setError('')
    try {
      await api.post('/api/auth/send-otp', { email })
      setCountdown(60)
      setOtp('')
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.')
    } finally {
      setLoading(false)
    }
  }

  const handleDetailsChange = (e) => {
    const { name, value } = e.target
    let newDetails = { ...details, [name]: value }

    if (name === 'restaurant_name') {
      newDetails.restaurant_slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric except spaces/hyphens
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/-+/g, '-') // Collapse multiple hyphens
    }

    setDetails(newDetails)
    if (error) setError('')
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    if (details.owner_password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setError('')

    const payload = {
      ...details,
      owner_email: email,
      otp
    }

    try {
      // 1. Complete Registration
      await api.post('/api/auth/register', payload)

      // 2. Background Login for a Frictionless Experience
      try {
        const loginRes = await api.post('/api/auth/login', {
          email,
          password: details.owner_password
        })
        const { accessToken, refreshToken, user } = loginRes.data
        window.__accessToken = accessToken
        localStorage.setItem('refreshToken', refreshToken)
        localStorage.setItem('user', JSON.stringify(user))

        // Redirect directly to dashboard
        navigate('/dashboard')
      } catch (loginErr) {
        // Fallback: If auto-login fails, redirect to login page with success notification
        alert('Registration successful! Please sign in with your password.')
        navigate('/login')
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
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

      {/* Spacious, Dynamic Form Card */}
      <div
        className={`w-full ${step === 3 ? 'max-w-[720px]' : 'max-w-[460px]'} bg-white rounded-2xl border border-[#d3d3d3] p-8 lg:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.015)] z-10 transition-all duration-500`}
      >
        {/* Brand Logo Image */}
        <div className="mb-8 flex justify-between items-center">
          <img src={logoRed} alt="DineDash Logo" className="h-9 w-auto object-contain" />
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#ba181b] bg-[#ba181b]/10 px-2 py-0.5 rounded">
            Partner Sign Up
          </span>
        </div>

        {/* Stepper Progress Bubbles */}
        <div className="flex items-center justify-between mb-8 border-b border-[#d3d3d3]/30 pb-6">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${step >= 1 ? 'bg-[#ba181b] text-white shadow-md shadow-[#ba181b]/20' : 'bg-[#f5f3f4] text-[#161a1d]/40 border border-[#d3d3d3]'}`}>
              1
            </div>
            <span className={`text-xs font-black uppercase tracking-wider transition-all ${step === 1 ? 'text-[#161a1d]' : 'text-[#161a1d]/40'}`}>Email</span>
          </div>
          <div className={`h-[2px] flex-1 mx-3 transition-all duration-300 ${step >= 2 ? 'bg-[#ba181b]' : 'bg-[#d3d3d3]'}`}></div>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${step >= 2 ? 'bg-[#ba181b] text-white shadow-md shadow-[#ba181b]/20' : 'bg-[#f5f3f4] text-[#161a1d]/40 border border-[#d3d3d3]'}`}>
              2
            </div>
            <span className={`text-xs font-black uppercase tracking-wider transition-all ${step === 2 ? 'text-[#161a1d]' : 'text-[#161a1d]/40'}`}>Verify</span>
          </div>
          <div className={`h-[2px] flex-1 mx-3 transition-all duration-300 ${step >= 3 ? 'bg-[#ba181b]' : 'bg-[#d3d3d3]'}`}></div>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${step >= 3 ? 'bg-[#ba181b] text-white shadow-md shadow-[#ba181b]/20' : 'bg-[#f5f3f4] text-[#161a1d]/40 border border-[#d3d3d3]'}`}>
              3
            </div>
            <span className={`text-xs font-black uppercase tracking-wider transition-all ${step === 3 ? 'text-[#161a1d]' : 'text-[#161a1d]/40'}`}>Setup</span>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h2 className="font-outfit text-3xl font-black text-[#0b090a] tracking-tight mb-2">
            {step === 1 && 'Register your outlet'}
            {step === 2 && 'Security check'}
            {step === 3 && 'Onboard outlet details'}
          </h2>
          <p className="text-[#161a1d]/60 text-sm font-semibold">
            {step === 1 && 'Begin your DineDash onboarding setup'}
            {step === 2 && `An OTP was dispatched to your email`}
            {step === 3 && 'Configure your credentials and coordinates'}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-[#a4161a] border border-red-100 text-xs font-bold leading-relaxed flex items-start gap-2 animate-pulse">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: EMAIL ENTRY */}
        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label htmlFor="reg-email" className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError('')
                }}
                placeholder="owner@example.com"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-[#d3d3d3] bg-white text-[#161a1d] placeholder-[#b1a7a6] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ba181b] hover:bg-[#a4161a] active:bg-[#660708] text-white font-black py-4 px-6 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-[#ba181b]/10 hover:shadow-xl hover:shadow-[#ba181b]/20 active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none uppercase tracking-widest"
            >
              {loading ? 'Sending verification...' : 'Send Verification OTP'}
            </button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 2 && (
          <div className="space-y-6">
            {otpVerified ? (
              <div className="bg-emerald-50 text-[#1a5336] p-5 rounded-xl text-xs font-bold border border-emerald-100 flex items-center justify-center gap-2.5 animate-bounce">
                <span className="text-base">🟢</span> OTP Verified! Loading setup wizard...
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label htmlFor="reg-otp" className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                    Verification Code (OTP)
                  </label>
                  <input
                    id="reg-otp"
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={handleOtpChange}
                    disabled={loading}
                    placeholder="000000"
                    className="w-full text-center tracking-[0.6em] font-mono px-4 py-4 rounded-xl border-2 border-[#d3d3d3] bg-white text-lg font-black text-[#161a1d] placeholder-[#b1a7a6] focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                  />
                  <div className="mt-4 flex justify-between items-center text-xs">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[#161a1d]/60 hover:text-[#ba181b] font-black uppercase tracking-wider transition-colors"
                    >
                      ← Change Email
                    </button>
                    {countdown > 0 ? (
                      <span className="text-[#b1a7a6] font-bold">
                        Resend OTP in {countdown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-[#ba181b] hover:text-[#a4161a] font-black uppercase tracking-wider hover:underline transition-colors animate-pulse"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
                {loading && (
                  <div className="flex justify-center items-center py-2 gap-2 text-xs text-[#161a1d]/60 font-semibold">
                    <div className="w-4 h-4 border-2 border-[#ba181b]/20 border-t-[#ba181b] rounded-full animate-spin"></div>
                    Verifying code...
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: DETAILS SETUP */}
        {step === 3 && (
          <form onSubmit={handleRegisterSubmit} className="space-y-6">
            {/* Group A: Owner Settings */}
            <div className="bg-[#f5f3f4]/60 border border-[#d3d3d3] rounded-2xl p-5 lg:p-6 space-y-4">
              <h3 className="text-xs font-black text-[#ba181b] uppercase tracking-widest border-b border-[#d3d3d3]/30 pb-2">
                1. Owner Profile
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="owner_name" className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="owner_name"
                    name="owner_name"
                    type="text"
                    required
                    value={details.owner_name}
                    onChange={handleDetailsChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-lg border-2 border-[#d3d3d3] bg-white text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="owner_password" className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-1.5">
                    Password (Min 6 chars)
                  </label>
                  <input
                    id="owner_password"
                    name="owner_password"
                    type="password"
                    required
                    minLength={6}
                    value={details.owner_password}
                    onChange={handleDetailsChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-lg border-2 border-[#d3d3d3] bg-white text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Group B: Restaurant Details */}
            <div className="bg-[#f5f3f4]/60 border border-[#d3d3d3] rounded-2xl p-5 lg:p-6 space-y-4">
              <h3 className="text-xs font-black text-[#ba181b] uppercase tracking-widest border-b border-[#d3d3d3]/30 pb-2">
                2. Restaurant Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="restaurant_name" className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-1.5">
                    Restaurant Name
                  </label>
                  <input
                    id="restaurant_name"
                    name="restaurant_name"
                    type="text"
                    required
                    value={details.restaurant_name}
                    onChange={handleDetailsChange}
                    placeholder="Dine Dash Bistro"
                    className="w-full px-4 py-3 rounded-lg border-2 border-[#d3d3d3] bg-white text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="restaurant_slug" className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-1.5 flex justify-between">
                    <span>URL Identifier Slug</span>
                    <span className="text-[9px] text-[#b1a7a6] font-semibold lowercase">auto</span>
                  </label>
                  <input
                    id="restaurant_slug"
                    name="restaurant_slug"
                    type="text"
                    required
                    value={details.restaurant_slug}
                    onChange={handleDetailsChange}
                    placeholder="dinedash-bistro"
                    className="w-full px-4 py-3 rounded-lg border-2 border-[#d3d3d3] bg-white text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all font-mono"
                  />
                </div>
              </div>

              {details.restaurant_slug && (
                <div className="text-[11px] font-semibold text-[#161a1d]/60 flex items-center gap-1.5 bg-white border border-[#d3d3d3]/50 px-3 py-2 rounded-lg font-mono">
                  <span className="text-emerald-500">🌍</span> Public link: <span className="text-[#ba181b] font-bold">dinedash.com/menu/{details.restaurant_slug}</span>
                </div>
              )}
            </div>

            {/* Group C: Location Address */}
            <div className="bg-[#f5f3f4]/60 border border-[#d3d3d3] rounded-2xl p-5 lg:p-6 space-y-4">
              <h3 className="text-xs font-black text-[#ba181b] uppercase tracking-widest border-b border-[#d3d3d3]/30 pb-2">
                3. Location / Address
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="street_address" className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-1.5">
                    Street Address
                  </label>
                  <input
                    id="street_address"
                    name="street_address"
                    type="text"
                    required
                    value={details.street_address}
                    onChange={handleDetailsChange}
                    placeholder="123 Main Street, Ground Floor"
                    className="w-full px-4 py-3 rounded-lg border-2 border-[#d3d3d3] bg-white text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="landmark" className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-1.5">
                      Landmark <span className="text-[#b1a7a6] font-normal font-sans">(Optional)</span>
                    </label>
                    <input
                      id="landmark"
                      name="landmark"
                      type="text"
                      value={details.landmark}
                      onChange={handleDetailsChange}
                      placeholder="Near Central Park"
                      className="w-full px-4 py-3 rounded-lg border-2 border-[#d3d3d3] bg-white text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="area_locality" className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-1.5">
                      Area / Locality <span className="text-[#b1a7a6] font-normal font-sans">(Optional)</span>
                    </label>
                    <input
                      id="area_locality"
                      name="area_locality"
                      type="text"
                      value={details.area_locality}
                      onChange={handleDetailsChange}
                      placeholder="Downtown"
                      className="w-full px-4 py-3 rounded-lg border-2 border-[#d3d3d3] bg-white text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="pincode" className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-1.5">
                      Pincode
                    </label>
                    <input
                      id="pincode"
                      name="pincode"
                      type="text"
                      required
                      maxLength={10}
                      value={details.pincode}
                      onChange={handleDetailsChange}
                      placeholder="560001"
                      className="w-full px-3.5 py-3 rounded-lg border-2 border-[#d3d3d3] bg-white text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-1.5">
                      City
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      required
                      value={details.city}
                      onChange={handleDetailsChange}
                      placeholder="Bengaluru"
                      className="w-full px-3.5 py-3 rounded-lg border-2 border-[#d3d3d3] bg-white text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-1.5">
                      State
                    </label>
                    <input
                      id="state"
                      name="state"
                      type="text"
                      required
                      value={details.state}
                      onChange={handleDetailsChange}
                      placeholder="Karnataka"
                      className="w-full px-3.5 py-3 rounded-lg border-2 border-[#d3d3d3] bg-white text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ba181b] hover:bg-[#a4161a] active:bg-[#660708] text-white font-black py-4 px-6 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-[#ba181b]/10 hover:shadow-xl hover:shadow-[#ba181b]/20 active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none uppercase tracking-widest text-center"
            >
              {loading ? 'Completing onboarding...' : 'Onboard Outlet & Create Workspace'}
            </button>
          </form>
        )}

        {/* Navigation Helper */}
        <div className="mt-8 text-center pt-6 border-t border-[#d3d3d3]/30">
          <span className="text-xs text-[#161a1d]/75 font-semibold">
            Already registered?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-[#ba181b] hover:text-[#a4161a] font-black hover:underline transition-colors cursor-pointer"
            >
              Sign in
            </button>
          </span>
        </div>
      </div>
    </div>
  )
}
