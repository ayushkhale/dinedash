import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import logoRed from '../assets/logored.png'
import api from '../api'

const STEPS = {
  EMAIL: 1,
  OTP: 2,
  PASSWORD: 3,
  DONE: 4
}

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: 'bg-gray-200' }
  if (password.length < 6) return { score: 1, label: 'Too Short', color: 'bg-red-500' }
  
  let score = 2
  const hasLetters = /[a-zA-Z]/.test(password)
  const hasNumbers = /[0-9]/.test(password)
  const hasSpecial = /[^a-zA-Z0-9]/.test(password)
  
  if (hasLetters && hasNumbers) score = 3
  if (hasLetters && hasNumbers && hasSpecial && password.length >= 8) score = 4
  
  if (score === 2) return { score, label: 'Weak', color: 'bg-orange-500' }
  if (score === 3) return { score, label: 'Good', color: 'bg-blue-500' }
  return { score, label: 'Strong', color: 'bg-green-500' }
}

const maskEmail = (emailStr) => {
  if (!emailStr) return ''
  const parts = emailStr.split('@')
  if (parts.length !== 2) return emailStr
  const [local, domain] = parts
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`
  }
  return `${local.substring(0, 2)}***${local.charAt(local.length - 1)}@${domain}`
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  
  // Flow State
  const [step, setStep] = useState(STEPS.EMAIL)
  const [email, setEmail] = useState('')
  const [otpArray, setOtpArray] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // UI / UX States
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [redirectCountdown, setRedirectCountdown] = useState(3)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Refs for OTP Inputs
  const otpRefs = useRef([])

  // OTP values combined
  const otpString = otpArray.join('')

  // Countdown timer for Resend OTP
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  // Redirect timer for Success state
  useEffect(() => {
    if (step !== STEPS.DONE) return
    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate('/login')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [step, navigate])

  // Step 1: Send OTP to Email
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    try {
      // Backend always returns 200 to prevent user enumeration
      await api.post('/api/auth/forgot-password/send-otp', { email })
      setStep(STEPS.OTP)
      setCountdown(60)
      setSuccessMsg('If this email is registered, an OTP has been sent. Check your inbox.')
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP Inputs
  const handleOtpChange = (val, idx) => {
    const numericVal = val.replace(/\D/g, '') // Only allow numbers
    const newOtp = [...otpArray]
    newOtp[idx] = numericVal.substring(numericVal.length - 1) // Store single digit
    setOtpArray(newOtp)
    if (error) setError('')

    // Auto-focus next input if a digit is entered
    if (numericVal && idx < 5) {
      otpRefs.current[idx + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      if (!otpArray[idx] && idx > 0) {
        // Move focus backward if current box is empty
        const newOtp = [...otpArray]
        newOtp[idx - 1] = ''
        setOtpArray(newOtp)
        otpRefs.current[idx - 1]?.focus()
      } else {
        // Just clear current box
        const newOtp = [...otpArray]
        newOtp[idx] = ''
        setOtpArray(newOtp)
      }
      e.preventDefault()
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      otpRefs.current[idx - 1]?.focus()
    } else if (e.key === 'ArrowRight' && idx < 5) {
      otpRefs.current[idx + 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, 6)
    if (pastedData.length > 0) {
      const newOtp = [...otpArray]
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedData[i] || ''
      }
      setOtpArray(newOtp)
      if (error) setError('')
      
      // Focus the last filled box or last box overall
      const focusIndex = Math.min(pastedData.length, 5)
      otpRefs.current[focusIndex]?.focus()
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (otpString.length !== 6) {
      setError('Please enter a 6-digit OTP code.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/api/auth/forgot-password/verify-otp', { email, otp: otpString })
      setStep(STEPS.PASSWORD)
      setSuccessMsg('')
    } catch (err) {
      setError(err.message || 'OTP verification failed.')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP from step 2
  const handleResendOtp = async () => {
    if (countdown > 0) return
    setLoading(true)
    setError('')
    try {
      await api.post('/api/auth/forgot-password/send-otp', { email })
      setCountdown(60)
      setOtpArray(['', '', '', '', '', ''])
      setSuccessMsg('A new OTP has been dispatched to your email.')
      otpRefs.current[0]?.focus()
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Confirm password must match new password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/api/auth/forgot-password/reset', {
        email,
        otp: otpString,
        new_password: newPassword,
        confirm_password: confirmPassword
      })
      setStep(STEPS.DONE)
    } catch (err) {
      setError(err.message || 'Password reset failed.')
      // If OTP invalid or expired, push them back to verify OTP step
      if (err.message && (err.message.toLowerCase().includes('otp') || err.message.toLowerCase().includes('code'))) {
        setStep(STEPS.OTP)
      }
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = getPasswordStrength(newPassword)

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative px-4 py-8 font-sans antialiased"
      style={{
        backgroundColor: '#f5f3f4',
        backgroundImage: 'linear-gradient(to right, #d3d3d3 1px, transparent 1px), linear-gradient(to bottom, #d3d3d3 1px, transparent 1px)',
        backgroundSize: '36px 36px',
      }}
    >
      {/* Floating Back to Login button (only shown when not in Success state) */}
      {step !== STEPS.DONE && (
        <button
          onClick={() => navigate('/login')}
          className="absolute top-6 left-6 flex items-center gap-2 text-[#161a1d]/70 hover:text-[#ba181b] transition-colors text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl border border-[#d3d3d3] hover:bg-white bg-transparent shadow-sm z-20 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Login
        </button>
      )}

      {/* Spacious Card Container */}
      <div className="w-full max-w-[460px] bg-white rounded-2xl border border-[#d3d3d3] p-8 lg:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.015)] z-10">
        
        {/* Brand Logo & Tag */}
        <div className="mb-8 flex justify-between items-center">
          <img src={logoRed} alt="DineDash Logo" className="h-9 w-auto object-contain" />
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#ba181b] bg-[#ba181b]/10 px-2 py-0.5 rounded">
            Security Recovery
          </span>
        </div>

        {/* Stepper Progress Bar */}
        {step !== STEPS.DONE && (
          <div className="flex items-center justify-between mb-8 border-b border-[#d3d3d3]/30 pb-6">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${step >= STEPS.EMAIL ? 'bg-[#ba181b] text-white shadow-md shadow-[#ba181b]/20' : 'bg-[#f5f3f4] text-[#161a1d]/40 border border-[#d3d3d3]'}`}>
                1
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider transition-all ${step === STEPS.EMAIL ? 'text-[#161a1d]' : 'text-[#161a1d]/40'}`}>Email</span>
            </div>
            <div className={`h-[2px] flex-1 mx-2 transition-all duration-300 ${step >= STEPS.OTP ? 'bg-[#ba181b]' : 'bg-[#d3d3d3]'}`}></div>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${step >= STEPS.OTP ? 'bg-[#ba181b] text-white shadow-md shadow-[#ba181b]/20' : 'bg-[#f5f3f4] text-[#161a1d]/40 border border-[#d3d3d3]'}`}>
                2
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider transition-all ${step === STEPS.OTP ? 'text-[#161a1d]' : 'text-[#161a1d]/40'}`}>Verify</span>
            </div>
            <div className={`h-[2px] flex-1 mx-2 transition-all duration-300 ${step >= STEPS.PASSWORD ? 'bg-[#ba181b]' : 'bg-[#d3d3d3]'}`}></div>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${step >= STEPS.PASSWORD ? 'bg-[#ba181b] text-white shadow-md shadow-[#ba181b]/20' : 'bg-[#f5f3f4] text-[#161a1d]/40 border border-[#d3d3d3]'}`}>
                3
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider transition-all ${step === STEPS.PASSWORD ? 'text-[#161a1d]' : 'text-[#161a1d]/40'}`}>Reset</span>
            </div>
          </div>
        )}

        {/* Dynamic Titles */}
        {step !== STEPS.DONE && (
          <div className="mb-6">
            <h2 className="font-outfit text-3xl font-black text-[#0b090a] tracking-tight mb-2">
              {step === STEPS.EMAIL && 'Forgot Password'}
              {step === STEPS.OTP && 'Verify Identity'}
              {step === STEPS.PASSWORD && 'Create New Password'}
            </h2>
            <p className="text-[#161a1d]/60 text-sm font-semibold">
              {step === STEPS.EMAIL && 'Enter your restaurant email to receive a password reset code.'}
              {step === STEPS.OTP && `Enter the 6-digit OTP code dispatched to `}
              {step === STEPS.OTP && <strong className="text-[#161a1d]">{maskEmail(email)}</strong>}
              {step === STEPS.PASSWORD && 'Enter your new workspace security password.'}
            </p>
          </div>
        )}

        {/* Feedback Alert Banners */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-[#a4161a] border border-red-100 text-xs font-bold leading-relaxed flex items-start gap-2 animate-pulse">
            <AlertCircle className="w-4 h-4 text-[#a4161a] shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && step !== STEPS.DONE && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 text-[#1b4332] border border-green-100 text-xs font-bold leading-relaxed flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2d6a4f] shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: EMAIL REQUEST */}
        {step === STEPS.EMAIL && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label htmlFor="reset-email" className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                Email Address
              </label>
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError('')
                }}
                placeholder="owner@restaurant.com"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-[#d3d3d3] bg-white text-[#161a1d] placeholder-[#b1a7a6] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ba181b] hover:bg-[#a4161a] active:bg-[#660708] text-white font-black py-4 px-6 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-[#ba181b]/10 hover:shadow-xl hover:shadow-[#ba181b]/20 active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none uppercase tracking-widest text-center"
            >
              {loading ? 'Sending Request...' : 'Send OTP Code'}
            </button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === STEPS.OTP && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-3 text-center">
                6-Digit Security OTP
              </label>
              <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                {otpArray.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpRefs.current[idx] = el)}
                    type="text"
                    required
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-[#d3d3d3] bg-white text-[#161a1d] focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all font-mono"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpString.length !== 6}
              className="w-full bg-[#ba181b] hover:bg-[#a4161a] active:bg-[#660708] text-white font-black py-4 px-6 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-[#ba181b]/10 hover:shadow-xl hover:shadow-[#ba181b]/20 active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none uppercase tracking-widest text-center"
            >
              {loading ? 'Verifying Code...' : 'Verify OTP'}
            </button>

            {/* Back & Resend Links */}
            <div className="flex justify-between items-center text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep(STEPS.EMAIL)
                  setSuccessMsg('')
                }}
                className="text-[#161a1d]/60 hover:text-[#ba181b] font-black uppercase tracking-wider transition-colors cursor-pointer"
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
                  className="text-[#ba181b] hover:text-[#a4161a] font-black uppercase tracking-wider hover:underline transition-colors animate-pulse cursor-pointer"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        )}

        {/* STEP 3: RESET PASSWORD */}
        {step === STEPS.PASSWORD && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            
            {/* New Password Input */}
            <div>
              <label htmlFor="new-pass" className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-pass"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-12 py-3.5 rounded-xl border-2 border-[#d3d3d3] bg-white text-[#161a1d] placeholder-[#b1a7a6] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#161a1d]/40 hover:text-[#ba181b] transition-colors p-1 flex items-center justify-center cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength Indicator Bar */}
              {newPassword && (
                <div className="mt-2.5">
                  <div className="flex justify-between items-center mb-1 text-[9px] font-black uppercase tracking-wider">
                    <span className="text-[#161a1d]/60">Strength</span>
                    <span style={{
                      color: passwordStrength.score === 1 ? '#e63946' :
                             passwordStrength.score === 2 ? '#f4a261' :
                             passwordStrength.score === 3 ? '#457b9d' : '#2a9d8f'
                    }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden flex gap-0.5">
                    <div className={`h-full ${passwordStrength.color} transition-all duration-300`} style={{ width: `${passwordStrength.score * 25}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="confirm-pass" className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest">
                  Confirm Password
                </label>
                {confirmPassword && (
                  <span className={`text-[9px] font-black lowercase ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                    {newPassword === confirmPassword ? '✓ matches' : '✗ mismatch'}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  id="confirm-pass"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-4 pr-12 py-3.5 rounded-xl border-2 ${
                    confirmPassword
                      ? newPassword === confirmPassword
                        ? 'border-green-500 focus:border-green-600 focus:ring-4 focus:ring-green-100'
                        : 'border-red-500 focus:border-red-600 focus:ring-4 focus:ring-red-100'
                      : 'border-[#d3d3d3] focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10'
                  } bg-white text-sm font-semibold focus:outline-none transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#161a1d]/40 hover:text-[#ba181b] transition-colors p-1 flex items-center justify-center cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !newPassword || newPassword !== confirmPassword}
              className="w-full bg-[#ba181b] hover:bg-[#a4161a] active:bg-[#660708] text-white font-black py-4 px-6 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-[#ba181b]/10 hover:shadow-xl hover:shadow-[#ba181b]/20 active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none uppercase tracking-widest text-center"
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>

            {/* Back Link */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setStep(STEPS.OTP)}
                className="text-xs text-[#161a1d]/60 hover:text-[#ba181b] font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                ← Back to OTP Verification
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: SUCCESS REDIRECT */}
        {step === STEPS.DONE && (
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center border-2 border-green-200 mb-6 text-green-600 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <h2 className="font-outfit text-3xl font-black text-[#0b090a] tracking-tight mb-3">
              Reset Complete
            </h2>
            <p className="text-[#161a1d]/60 text-sm font-semibold max-w-sm mb-8 leading-relaxed">
              Your security password was successfully reset. You will be automatically redirected to your partner login interface shortly.
            </p>

            {/* Redirect Countdown bar */}
            <div className="w-full max-w-[280px]">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-[#161a1d]/60 mb-2">
                <span>Redirecting in</span>
                <span>{redirectCountdown}s</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#ba181b] transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${(redirectCountdown / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
