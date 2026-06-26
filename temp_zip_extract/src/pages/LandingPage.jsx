import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logoRed from '../assets/logored.png'

export default function LandingPage() {
  const navigate = useNavigate()
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: 'General Inquiry', message: '' })
  const [contactSubmitted, setContactSubmitted] = useState(false)
  const [trialEmail, setTrialEmail] = useState('')
  const [trialSubmitted, setTrialSubmitted] = useState(false)
  const [printKey, setPrintKey] = useState(0)

  const handleContactSubmit = (e) => {
    e.preventDefault()
    setContactSubmitted(true)
    setTimeout(() => {
      setContactSubmitted(false)
      setContactForm({ name: '', email: '', subject: 'General Query', message: '' })
    }, 3000)
  }

  const handleTrialSubmit = (e) => {
    e.preventDefault()
    if (trialEmail) {
      setTrialSubmitted(true)
      setTimeout(() => {
        setTrialSubmitted(false)
        setTrialEmail('')
        navigate('/register')
      }, 1500)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col font-sans select-none antialiased"
      style={{
        backgroundColor: '#f5f3f4',
        color: '#161a1d'
      }}
    >
      {/* 1. HEADER / NAVIGATION */}
      <header className="sticky top-0 z-50 bg-[#f5f3f4]/90 backdrop-blur-md border-b border-[#d3d3d3]/80 px-6 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={logoRed}
            alt="DineDash Logo"
            className="h-10 w-auto object-contain cursor-pointer"
            onClick={() => navigate('/')}
          />
        </div>

        <nav className="flex items-center gap-8">
          <a href="#features" className="text-sm font-bold text-[#b1a7a6] hover:text-[#161a1d] transition-colors">Features</a>
          <a href="#pricing" className="text-sm font-bold text-[#b1a7a6] hover:text-[#161a1d] transition-colors">Pricing</a>
          <a href="#contact" className="text-sm font-bold text-[#b1a7a6] hover:text-[#161a1d] transition-colors">Contact</a>
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-bold text-[#b1a7a6] hover:text-[#161a1d] transition-colors cursor-pointer"
          >
            Sign in
          </button>
          <button
            onClick={() => navigate('/register')}
            className="bg-[#ba181b] hover:bg-[#a4161a] active:bg-[#660708] text-white text-xs lg:text-sm font-bold px-4 py-2 rounded-lg transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.08)] cursor-pointer"
          >
            Start free trial
          </button>
        </nav>
      </header>

      {/* 2. HERO SECTION */}
      <section className="px-6 lg:px-16 py-16 lg:py-24 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          {/* Capsule Tag */}
          <span className="inline-flex items-center gap-2 bg-[#d3d3d3]/40 border border-[#b1a7a6] px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase text-[#161a1d] mb-6">
            Next-Gen QR Dine-in Ecosystem
          </span>

          {/* Main Headline */}
          <h1 className="font-outfit text-4xl lg:text-6xl font-black text-[#0b090a] leading-[1.15] tracking-tight mb-6">
            Dine & Scan. <span className="text-[#ba181b] px-3 py-1 rounded-lg inline-block lg:inline"> <br />
              No delays, No BS</span>
          </h1>

          {/* Subtext */}
          <p className="text-[#161a1d]/85 text-base lg:text-lg leading-relaxed max-w-xl mb-8 font-semibold">
            Empower your restaurant with DineDash. Guests scan the table QR to browse visual menus, customize orders, and checkout instantly. Orders stream directly to the chef's screen, accelerating service by 30%.
          </p>

          {/* CTA Form / Buttons */}
          <div className="w-full max-w-md">
            {trialSubmitted ? (
              <div className="bg-red-50 border border-red-200 text-[#ba181b] px-4 py-3 rounded-lg text-sm font-bold mb-3">
                Creating your DineDash trial workspace...
              </div>
            ) : (
              <form onSubmit={handleTrialSubmit} className="flex gap-2.5 mb-3">
                <input
                  type="email"
                  value={trialEmail}
                  onChange={(e) => setTrialEmail(e.target.value)}
                  placeholder="Enter your restaurant email"
                  required
                  className="flex-1 px-4 py-3 rounded-lg border border-[#d3d3d3] bg-white text-[#161a1d] placeholder-[#b1a7a6] text-sm focus:outline-none focus:border-[#ba181b] focus:ring-1 focus:ring-[#ba181b] transition-all"
                />
                <button
                  type="submit"
                  className="bg-[#ba181b] hover:bg-[#a4161a] active:bg-[#660708] text-white text-sm font-bold px-6 py-3 rounded-lg transition-colors cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.08)] whitespace-nowrap"
                >
                  Start free trial
                </button>
              </form>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <a href="#how" className="text-xs lg:text-sm font-bold text-[#ba181b] hover:underline flex items-center gap-1">
                Explore setup journey →
              </a>
            </div>

            <p className="text-[#b1a7a6] text-xs font-bold mt-4">
              Instant activation • Billed in INR • Cancel anytime
            </p>
          </div>
        </div>

        {/* Animated KOT / Bill Receipt Printer */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center w-full min-h-[460px]">
          {/* Printer Feed Machine Head */}
          <div className="w-full max-w-[340px] z-20">
            <div className="w-[85%] mx-auto h-4 bg-[#161a1d] rounded-t-lg border-x-4 border-t-4 border-neutral-700 relative shadow-inner">
              {/* Paper slot exit */}
              <div className="absolute inset-x-3 bottom-0 h-1 bg-[#0b090a] rounded-t"></div>
            </div>
          </div>

          {/* Receipts Paper Scroll */}
          <div className="w-full max-w-[340px] overflow-hidden mt-[-1px] pb-6 relative z-10">
            <div
              key={printKey}
              className="receipts-animate flex flex-col items-center"
            >
              {/* Ticket 1: KOT Bill Receipt */}
              <div className="w-[85%] bg-white border-x border-t border-[#d3d3d3] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)] font-mono text-xs text-[#161a1d] relative rounded-b-sm">

                {/* Brand Header */}
                <div className="flex justify-between items-center mb-3">
                  <img src={logoRed} alt="DineDash Logo" className="h-5 w-auto object-contain" />
                  <span className="text-[10px] font-bold text-[#ba181b] bg-[#ba181b]/10 px-2 py-0.5 rounded">LIVE ORDER</span>
                </div>

                {/* Header info */}
                <div className="flex justify-between items-center border-b border-dashed border-[#d3d3d3] pb-3 mb-3">
                  <div>
                    <p className="font-bold text-xs text-[#0b090a]">KOT #912</p>
                    <p className="text-[#b1a7a6] font-bold mt-0.5">TABLE 4</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#b1a7a6] font-bold">FLOOR 2</p>
                    <p className="text-[#b1a7a6]/70 font-bold mt-0.5">3 GUESTS · 9:15 PM</p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <div>
                      <span className="font-bold text-[#0b090a]">1x</span> Butter Chicken
                    </div>
                    <span className="font-semibold text-neutral-600">₹360</span>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <span className="font-bold text-[#0b090a]">2x</span> Garlic Naan
                    </div>
                    <span className="font-semibold text-neutral-600">₹90</span>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <span className="font-bold text-[#0b090a]">1x</span> Tandoori Roti
                    </div>
                    <span className="font-semibold text-neutral-600">₹30</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-[#0b090a]">1x</span> Mango Lassi
                      <p className="text-[#ba181b] text-[9px] font-bold mt-0.5 font-sans bg-[#ba181b]/10 px-1.5 py-0.5 rounded inline-block">
                        ↳ Note: extra ice
                      </p>
                    </div>
                    <span className="font-semibold text-neutral-600">₹120</span>
                  </div>
                </div>

                {/* Footer Summary */}
                <div className="border-t border-dashed border-[#d3d3d3] pt-3 flex justify-between items-center">
                  <span className="font-bold text-[#0b090a] text-xs">Total Amount</span>
                  <span className="font-bold text-[#ba181b] text-sm">₹600</span>
                </div>

                <div className="mt-4 text-center">
                  <span className="inline-flex items-center gap-1.5 bg-[#ba181b]/10 text-[#ba181b] px-2 py-0.5 rounded-full text-[9px] font-bold font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ba181b] animate-pulse"></span>
                    Sent to KDS Monitor
                  </span>
                </div>
              </div>

              {/* Ticket 2: QR Code Scan Ticket */}
              <div className="w-[85%] bg-white border-x border-b border-[#d3d3d3] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.06)] rounded-b-xl font-mono text-xs text-[#161a1d] relative receipt-qr-split flex flex-col items-center">
                {/* SVG QR Code */}
                <div className="my-2 bg-[#f5f3f4] p-2 rounded-lg border border-[#d3d3d3]">
                  <svg className="w-20 h-20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 29">
                    <path fill="#0b090a" d="M0 0h9v9H0zm1 1h7v7H1zm1 1h5v5H2zm9-2h2v1h-2zm2 1h1v1h-1zm-2 1h1v2h-1zm2 1h2v1h-2zm2-4h9v9h-9zm1 1h7v7h-7zm1 1h5v5h-5zm-11 9h2v1H2zm0 2h1v1H2zm1 1h2v1H3zm-3 1h1v1H0zm2 1h1v2H2zm1 1h2v-1H3zm2-3h1v1H5zm1 1h2v1H6zm-6 3h9v9H0zm1 1h7v7H1zm1 1h5v5H2zm18-7h2v1h-2zm1 1h1v1h-1zm1 1h2v1h-2zm3-3h1v1h-1zm-2 1h1v2h-1zm2 1h2v-1h-2zm-5 4h1v1h-1zm1 1h2v1h-2zm-1 2h1v1h-1zm2 0h2v1h-2zm1-3h1v1h-1zm1 1h2v1h-2zm0 2h1v1h-1zm-8 1h1v1h-1zm1 1h2v1h-2zm2 0h2v1h-2zm-3-3h1v1h-1zm1 1h2v1h-2zm0 2h1v1h-1zm6-9h9v9h-9zm1 1h7v7h-7zm1 1h5v5h-5z" />
                  </svg>
                </div>
                <div className="text-center mt-1">
                  <p className="font-bold text-[10px] uppercase tracking-wider text-[#0b090a]">Scan to Pay & Feed</p>
                  <p className="text-[#b1a7a6] text-[8px] font-bold mt-0.5">Dine & Scan Experience</p>
                  <p className="text-[#ba181b] text-[9px] font-bold mt-1.5 font-sans bg-[#ba181b]/10 px-2 py-0.5 rounded-full inline-block">No Delays. No BS.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Trigger Button */}
          <div className="mt-2 flex justify-center">
            <button
              onClick={() => setPrintKey(prev => prev + 1)}
              className="inline-flex items-center gap-2 border border-[#d3d3d3] hover:border-[#ba181b] hover:bg-[#ba181b]/5 hover:text-[#ba181b] text-[#161a1d]/70 text-[11px] font-bold py-1.5 px-3.5 rounded-lg transition-all cursor-pointer shadow-sm active:scale-95 bg-white"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18v3" />
              </svg>
              Reprint Bill Demo
            </button>
          </div>
        </div>
      </section>

      {/* 3. HIGHLIGHT SLIDER */}
      <section className="w-full bg-[#161a1d] py-4 border-y border-[#d3d3d3]/20 overflow-hidden relative">
        <div className="flex whitespace-nowrap animate-[marquee_25s_linear_infinite] gap-12 font-outfit text-xs font-bold uppercase tracking-widest text-[#f5f3f4]">
          <span>TAP-TO-ORDER</span>
          <span className="text-[#e5383b]">●</span>
          <span>INSTANT CHECKOUT</span>
          <span className="text-[#e5383b]">●</span>
          <span>SMART KITCHEN DISPLAYS</span>
          <span className="text-[#e5383b]">●</span>
          <span>SPLIT BILLING</span>
          <span className="text-[#e5383b]">●</span>
          <span>CUSTOM DISH ADD-ONS</span>
          <span className="text-[#e5383b]">●</span>
          <span>ZERO WAIT TIME</span>
          <span className="text-[#e5383b]">●</span>
          <span>UPI INSTANT PAY</span>
          <span className="text-[#e5383b]">●</span>
          <span>DASHBOARD ANALYTICS</span>
          <span className="text-[#e5383b]">●</span>
          <span>MULTI-FLOOR COMPATIBLE</span>
          <span className="text-[#e5383b]">●</span>
          {/* Duplicate for infinite loop spacing */}
          <span>TAP-TO-ORDER</span>
          <span className="text-[#e5383b]">●</span>
          <span>INSTANT CHECKOUT</span>
          <span className="text-[#e5383b]">●</span>
          <span>SMART KITCHEN DISPLAYS</span>
          <span className="text-[#e5383b]">●</span>
          <span>SPLIT BILLING</span>
          <span className="text-[#e5383b]">●</span>
          <span>CUSTOM DISH ADD-ONS</span>
          <span className="text-[#e5383b]">●</span>
          <span>ZERO WAIT TIME</span>
          <span className="text-[#e5383b]">●</span>
          <span>UPI INSTANT PAY</span>
          <span className="text-[#e5383b]">●</span>
          <span>DASHBOARD ANALYTICS</span>
          <span className="text-[#e5383b]">●</span>
          <span>MULTI-FLOOR COMPATIBLE</span>
        </div>
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
        `}} />
      </section>

      {/* 4. "SETUP JOURNEY" SECTION (Re-structured to a 3-step setup) */}
      <section id="how" className="px-6 lg:px-16 py-20 max-w-7xl mx-auto w-full">
        <span className="block text-center text-[10px] font-bold tracking-wider text-[#b1a7a6] uppercase mb-3">
          Onboarding Journey
        </span>
        <h2 className="font-outfit text-3xl lg:text-4xl font-bold text-center text-[#0b090a] tracking-tight mb-12">
          Up and running in three simple phases
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white rounded-xl border border-[#d3d3d3] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.005)]">
            <div className="w-10 h-10 rounded-lg bg-[#f5f3f4] border border-[#d3d3d3] flex items-center justify-center font-bold text-[#ba181b] text-base mb-6">
              1
            </div>
            <h3 className="font-outfit text-lg font-bold text-[#0b090a] mb-3">
              Onboard Your Venue
            </h3>
            <p className="text-[#b1a7a6] text-sm leading-relaxed font-semibold">
              Register, configure your logo, and add menu categories, pricing variations, food tags, and images. Link your UPI account for direct settlement.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-xl border border-[#d3d3d3] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.005)]">
            <div className="w-10 h-10 rounded-lg bg-[#f5f3f4] border border-[#d3d3d3] flex items-center justify-center font-bold text-[#ba181b] text-base mb-6">
              2
            </div>
            <h3 className="font-outfit text-lg font-bold text-[#0b090a] mb-3">
              Generate Table QRs
            </h3>
            <p className="text-[#b1a7a6] text-sm leading-relaxed font-semibold">
              Instantly generate unique QR codes for your tables. Print and place them at your tables so customers can access the system.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-xl border border-[#d3d3d3] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.005)]">
            <div className="w-10 h-10 rounded-lg bg-[#f5f3f4] border border-[#d3d3d3] flex items-center justify-center font-bold text-[#ba181b] text-base mb-6">
              3
            </div>
            <h3 className="font-outfit text-lg font-bold text-[#0b090a] mb-3">
              Instant Guest Access
            </h3>
            <p className="text-[#b1a7a6] text-sm leading-relaxed font-semibold">
              Customers scan, view, and place orders. The kitchen sees order tickets stream on their KDS in real time. Fast, secure, and touchless.
            </p>
          </div>
        </div>
      </section>

      {/* 5. "FEATURE ECOSYSTEM" SECTION (Updated copy and layout) */}
      <section id="features" className="bg-[#161a1d] text-[#f5f3f4] py-20 px-6 lg:px-16 border-y border-[#d3d3d3]/10">
        <div className="max-w-7xl mx-auto w-full">
          <span className="block text-center text-[10px] font-bold tracking-wider text-[#e5383b] uppercase mb-3">
            Feature Ecosystem
          </span>
          <h2 className="font-outfit text-3xl lg:text-4xl font-bold text-center text-white tracking-tight mb-16">
            A unified operations panel for your restaurant floor
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-8 mb-16">
            {/* Feature 1 */}
            <div>
              <span className="block text-[10px] font-bold text-[#e5383b] tracking-widest uppercase mb-1">
                Visual Menu
              </span>
              <h3 className="font-outfit text-lg font-bold text-white mb-2">
                Interactive Menu Builder
              </h3>
              <p className="text-[#b1a7a6] text-sm leading-relaxed font-semibold">
                Build high-conversion visual menus with categories, tags (veg/non-veg, spicy), and toggle items out of stock instantly.
              </p>
            </div>

            {/* Feature 2 */}
            <div>
              <span className="block text-[10px] font-bold text-[#e5383b] tracking-widest uppercase mb-1">
                Display
              </span>
              <h3 className="font-outfit text-lg font-bold text-white mb-2">
                Live Kitchen Screen (KDS)
              </h3>
              <p className="text-[#b1a7a6] text-sm leading-relaxed font-semibold">
                Forget printed receipts. Orders flow to a digital kitchen board. Chefs track preparation times and mark items ready.
              </p>
            </div>

            {/* Feature 3 */}
            <div>
              <span className="block text-[10px] font-bold text-[#e5383b] tracking-widest uppercase mb-1">
                Transactions
              </span>
              <h3 className="font-outfit text-lg font-bold text-white mb-2">
                Instant Mobile Payments
              </h3>
              <p className="text-[#b1a7a6] text-sm leading-relaxed font-semibold">
                Allow customers to checkout directly from the menu via UPI, credit cards, or digital wallets. Direct restaurant bank settlements.
              </p>
            </div>

            {/* Feature 4 */}
            <div>
              <span className="block text-[10px] font-bold text-[#e5383b] tracking-widest uppercase mb-1">
                Control
              </span>
              <h3 className="font-outfit text-lg font-bold text-white mb-2">
                Floor & Table Manager
              </h3>
              <p className="text-[#b1a7a6] text-sm leading-relaxed font-semibold">
                Track occupied tables, active billing requests, pending checkouts, and food prep statuses from one dashboard.
              </p>
            </div>

            {/* Feature 5 */}
            <div>
              <span className="block text-[10px] font-bold text-[#e5383b] tracking-widest uppercase mb-1">
                Insights
              </span>
              <h3 className="font-outfit text-lg font-bold text-white mb-2">
                Analytics Hub
              </h3>
              <p className="text-[#b1a7a6] text-sm leading-relaxed font-semibold">
                View real-time reports on menu item popularity, table sales performance, average order times, and floor bottlenecks.
              </p>
            </div>

            {/* Feature 6 */}
            <div>
              <span className="block text-[10px] font-bold text-[#e5383b] tracking-widest uppercase mb-1">
                Security
              </span>
              <h3 className="font-outfit text-lg font-bold text-white mb-2">
                Smart Staff Roles
              </h3>
              <p className="text-[#b1a7a6] text-sm leading-relaxed font-semibold">
                Control permissions for servers, managers, and kitchen teams to secure business financials and operations.
              </p>
            </div>
          </div>

          {/* Checklist */}
          <div className="border-t border-[#d3d3d3]/15 pt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Zero guest downloads required',
              'Runs natively in mobile browsers',
              'Direct-to-bank UPI transfers',
              'Multi-room and multi-floor support',
              'PDF bill generation & printing',
              'Universal responsive dashboard layout'
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm font-bold">
                <svg className="w-5 h-5 text-[#e5383b] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. PRICING SECTION (Upgraded to premium card grid design instead of tabular list) */}
      <section id="pricing" className="px-6 lg:px-16 py-20 max-w-7xl mx-auto w-full">
        <span className="block text-center text-[10px] font-bold tracking-wider text-[#b1a7a6] uppercase mb-3">
          Pricing Plans
        </span>
        <h2 className="font-outfit text-3xl lg:text-4xl font-bold text-center text-[#0b090a] tracking-tight mb-2">
          Transparent, order-independent pricing
        </h2>
        <p className="text-[#b1a7a6] text-sm font-semibold text-center mb-14 max-w-lg mx-auto">
          No commission cuts, no hidden service charges. Pick the plan that fits your venue scale.
        </p>

        {/* Side-by-side SaaS Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">

          {/* Card 1: Starter */}
          <div className="bg-white rounded-xl border border-[#d3d3d3] p-8 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.005)]">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-outfit text-lg font-bold text-[#0b090a]">Starter Plan</h3>
                <span className="bg-[#f5f3f4] text-[#b1a7a6] text-[10px] font-bold px-2 py-0.5 rounded">7-day free trial</span>
              </div>
              <p className="text-[#b1a7a6] text-xs font-semibold mb-6">Perfect for small cafes and food trucks.</p>
              <div className="mb-6">
                <span className="font-outfit text-3xl font-bold text-[#0b090a]">₹599</span>
                <span className="text-xs text-[#b1a7a6] font-semibold"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-[#161a1d] font-semibold mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-[#ba181b]">•</span> Up to 15 tables
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#ba181b]">•</span> Live KDS display
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#ba181b]">•</span> UPI payments setup
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#b1a7a6]/55">•</span> Email support
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/register')}
              className="w-full border border-[#d3d3d3] hover:bg-[#f5f3f4] text-[#161a1d] text-xs font-bold py-3 rounded-lg transition-colors cursor-pointer"
            >
              Start free trial
            </button>
          </div>

          {/* Card 2: Growth (Highlighted) */}
          <div className="bg-white rounded-xl border-2 border-[#ba181b] p-8 flex flex-col justify-between shadow-[0_8px_30px_rgba(186,24,27,0.03)] relative">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#ba181b] text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Most Picked
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-outfit text-lg font-bold text-[#0b090a]">Growth Plan</h3>
                <span className="text-[#ba181b] text-xs font-bold">Save ₹198</span>
              </div>
              <p className="text-[#b1a7a6] text-xs font-semibold mb-6">Best for busy bistros and family diners.</p>
              <div className="mb-6">
                <span className="font-outfit text-3xl font-bold text-[#0b090a]">₹1,599</span>
                <span className="text-xs text-[#b1a7a6] font-semibold"> / 3 months</span>
              </div>
              <ul className="space-y-3 text-xs text-[#161a1d] font-semibold mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-[#ba181b]">•</span> Up to 50 tables
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#ba181b]">•</span> Multi-floor operations
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#ba181b]">•</span> Full billing & reporting panel
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#ba181b]">•</span> Priority Whatsapp support
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/register')}
              className="w-full bg-[#ba181b] hover:bg-[#a4161a] text-white text-xs font-bold py-3 rounded-lg transition-colors cursor-pointer shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
            >
              Choose growth
            </button>
          </div>

          {/* Card 3: Professional */}
          <div className="bg-white rounded-xl border border-[#d3d3d3] p-8 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.005)]">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-outfit text-lg font-bold text-[#0b090a]">Professional</h3>
                <span className="text-[#ba181b] text-xs font-bold">Save ₹1,189</span>
              </div>
              <p className="text-[#b1a7a6] text-xs font-semibold mb-6">Built for large-scale premium dining halls.</p>
              <div className="mb-6">
                <span className="font-outfit text-3xl font-bold text-[#0b090a]">₹5,999</span>
                <span className="text-xs text-[#b1a7a6] font-semibold"> / 12 months</span>
              </div>
              <ul className="space-y-3 text-xs text-[#161a1d] font-semibold mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-[#ba181b]">•</span> Unlimited tables & floors
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#ba181b]">•</span> Analytics dashboard logs
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#ba181b]">•</span> Dedicated customer manager
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#ba181b]">•</span> API integrations access
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/register')}
              className="w-full border border-[#d3d3d3] hover:bg-[#f5f3f4] text-[#161a1d] text-xs font-bold py-3 rounded-lg transition-colors cursor-pointer"
            >
              Choose professional
            </button>
          </div>

        </div>

        <p className="text-center text-[#b1a7a6] text-xs font-bold mt-10">
          * GST excluded. Standard UPI, card, and net banking gateways apply.
        </p>
      </section>

      {/* 7. PRE-FOOTER CALL TO ACTION */}
      <section className="bg-[#660708] text-white py-16 px-6 lg:px-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-outfit text-3xl lg:text-4xl font-bold tracking-tight mb-8">
            Tonight's orders could already be streaming to your kitchen.
          </h2>
          <button
            onClick={() => navigate('/register')}
            className="bg-white hover:bg-[#f5f3f4] active:bg-[#d3d3d3] text-[#660708] text-sm font-bold px-8 py-3.5 rounded-lg transition-colors cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.15)] mb-4"
          >
            Launch Your DineDash Menu
          </button>
          <p className="text-red-100/70 text-xs font-bold">
            Start free week • No payment details requested • 10-minute setup
          </p>
        </div>
      </section>

      {/* 8. CONTACT & FOOTER SECTION */}
      <section id="contact" className="bg-[#f5f3f4] px-6 lg:px-16 py-20 border-t border-[#d3d3d3]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column info */}
          <div className="lg:col-span-5 text-left">
            <span className="block text-[10px] font-bold tracking-wider text-[#b1a7a6] uppercase mb-3">
              Get In Touch
            </span>
            <h2 className="font-outfit text-3xl lg:text-4xl font-bold text-[#0b090a] tracking-tight mb-10">
              Need a custom integration?
            </h2>

            <div className="space-y-8 font-medium">
              <div>
                <p className="text-[10px] font-bold text-[#b1a7a6] uppercase tracking-widest mb-1.5">Email Support</p>
                <a href="mailto:support@dinedash.com" className="text-[#161a1d] text-sm font-bold hover:underline">
                  support@dinedash.com
                </a>
                <p className="text-[#b1a7a6] text-xs mt-1">General inquiries, custom API hooks, or billing logs.</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-[#b1a7a6] uppercase tracking-widest mb-1.5">Support Hours</p>
                <p className="text-[#161a1d] text-sm font-bold">9:00 AM – 7:00 PM IST, Monday to Saturday</p>
                <p className="text-[#b1a7a6] text-xs mt-1">Our average response turn-around is under three hours.</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-[#b1a7a6] uppercase tracking-widest mb-1.5">Development Team</p>
                <p className="text-[#161a1d] text-sm font-bold">DineDash Software Group</p>
                <p className="text-[#b1a7a6] text-xs mt-1">Independent SaaS product engineers.</p>
              </div>
            </div>
          </div>

          {/* Right Column Form */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-[#d3d3d3] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.005)]">
            {contactSubmitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-12 h-12 rounded-full bg-red-50 text-[#ba181b] flex items-center justify-center mb-4 border border-red-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-outfit text-lg font-bold text-[#0b090a] mb-1">Message Sent!</h3>
                <p className="text-[#b1a7a6] text-sm">We'll get back to you as soon as possible.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#b1a7a6] uppercase tracking-wider mb-2">Your Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Rajesh Kumar"
                      className="w-full px-4 py-2.5 rounded-lg border border-[#d3d3d3] bg-white text-[#161a1d] placeholder-[#b1a7a6] text-sm focus:outline-none focus:border-[#ba181b] focus:ring-1 focus:ring-[#ba181b] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#b1a7a6] uppercase tracking-wider mb-2">Email Address</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="you@email.com"
                      className="w-full px-4 py-2.5 rounded-lg border border-[#d3d3d3] bg-white text-[#161a1d] placeholder-[#b1a7a6] text-sm focus:outline-none focus:border-[#ba181b] focus:ring-1 focus:ring-[#ba181b] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#b1a7a6] uppercase tracking-wider mb-2">Subject</label>
                  <select
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#d3d3d3] bg-white text-[#161a1d] text-sm focus:outline-none focus:border-[#ba181b] focus:ring-1 focus:ring-[#ba181b] transition-all"
                  >
                    <option>General Query</option>
                    <option>Pricing & Subscription</option>
                    <option>Technical Support</option>
                    <option>Custom Request</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#b1a7a6] uppercase tracking-wider mb-2">Message</label>
                  <textarea
                    rows={4}
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Tell us how we can help..."
                    className="w-full px-4 py-2.5 rounded-lg border border-[#d3d3d3] bg-white text-[#161a1d] placeholder-[#b1a7a6] text-sm focus:outline-none focus:border-[#ba181b] focus:ring-1 focus:ring-[#ba181b] transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#ba181b] hover:bg-[#a4161a] text-white text-sm font-bold py-3 px-4 rounded-lg transition-colors cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                >
                  Send message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0b090a] text-[#b1a7a6] px-6 lg:px-16 py-12 border-t border-red-950/20 text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
          <img
            src={logoRed}
            alt="DineDash Logo"
            className="h-11 w-auto object-contain cursor-pointer"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />

          <div className="flex gap-6 text-xs font-bold">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <span>•</span>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <span>•</span>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>

          <div className="text-[11px] font-semibold space-y-1 mt-4 text-[#b1a7a6]/70">
            <p>QR-based restaurant ordering · support@dinedash.com</p>
            <p>© 2026 DineDash. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
