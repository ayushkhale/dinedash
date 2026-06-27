import { useState, useEffect } from 'react'
import api from '../api'

const RAZORPAY_KEY = 'rzp_test_SbMjn5LrmOZKI7'

// ── Helpers ───────────────────────────────────────────────────────────────────
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })

const fmt = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

const daysLeft = (iso) => {
  const diff = new Date(iso) - new Date()
  return Math.max(0, Math.ceil(diff / 86400000))
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconCrown = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M3 18h18v2H3v-2zm0-2l3-8 4.5 4L12 4l1.5 8L18 8l3 8H3z"/>
  </svg>
)
const IconZap = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
)
const IconCheck = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconRefresh = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)
const IconAlertCircle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IconCheckCircle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)
const IconShield = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)

// ── Plan Card ─────────────────────────────────────────────────────────────────
function PlanCard({ plan, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(plan.key)}
      className={`text-left p-5 rounded border-2 transition-all cursor-pointer w-full relative ${
        selected
          ? 'border-[#ba181b] bg-[#ba181b]/5 shadow-[0_2px_12px_rgba(186,24,27,0.06)]'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {plan.badge && (
        <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#ba181b] text-white">
          {plan.badge}
        </span>
      )}

      <div className="flex items-baseline justify-between gap-2 mb-1">
        <p className={`font-bold text-base ${selected ? 'text-[#ba181b]' : 'text-gray-900'}`}>
          {plan.label}
        </p>
        <div className="text-right shrink-0">
          <span className="text-2xl font-black text-gray-900">{plan.price}</span>
          <span className="text-xs text-gray-500 font-semibold">{plan.period}</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 font-medium mb-4">{plan.desc}</p>

      <ul className="space-y-2">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-center gap-2.5 text-xs text-gray-700 font-medium">
            <span className="shrink-0 w-4 h-4 rounded-full bg-[#ba181b] text-white flex items-center justify-center">
              <IconCheck size={9} />
            </span>
            {f}
          </li>
        ))}
      </ul>
    </button>
  )
}

// ── Main Workspace ────────────────────────────────────────────────────────────
export default function SubscriptionWorkspace({ user }) {
  const [subscription, setSubscription] = useState(null)
  const [subLoading, setSubLoading] = useState(true)
  const [plans, setPlans] = useState([
    {
      key: 'MONTHLY',
      label: 'Monthly Plan',
      price: '₹99',
      period: '/month',
      desc: 'Full access to all dashboard operations, reporting, and staff options billed monthly.',
      features: ['Full dashboard access', 'POS & billing integration', 'Menu & inventory tools', 'Kitchen display & waiter alerts'],
    },
    {
      key: 'YEARLY',
      label: 'Yearly Plan',
      price: '₹990',
      period: '/year',
      desc: 'Full access to all dashboard operations, reporting, and staff options billed annually (includes 2 months free).',
      badge: '2 Months Free',
      features: ['Everything in Monthly', '2 months completely free', 'Priority partner support', 'Early access to updates'],
    },
  ])
  const [selectedPlan, setSelectedPlan] = useState('MONTHLY')
  const [payLoading, setPayLoading] = useState(false)
  const [syncBanner, setSyncBanner] = useState(false)
  const [isEditingPlan, setIsEditingPlan] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchPlans = async () => {
    try {
      const res = await api.get('/api/subscriptions/plans')
      const planData = res?.data ?? res
      if (Array.isArray(planData) && planData.length > 0) {
        const mapped = planData.map(p => {
          const key = p.id || p.key || 'MONTHLY'
          return {
            key,
            label: p.name || p.label || (key === 'MONTHLY' ? 'Monthly Plan' : 'Yearly Plan'),
            price: p.price ? `₹${p.price}` : (key === 'MONTHLY' ? '₹99' : '₹990'),
            period: p.durationDays ? (p.durationDays === 30 ? '/month' : '/year') : (key === 'MONTHLY' ? '/month' : '/year'),
            desc: p.description || p.desc || (key === 'MONTHLY' ? 'Full access to all dashboard operations, reporting, and staff options billed monthly.' : 'Full access to all dashboard operations, reporting, and staff options billed annually (includes 2 months free).'),
            badge: key === 'YEARLY' ? '2 Months Free' : null,
            features: key === 'MONTHLY'
              ? ['Full dashboard access', 'POS & billing integration', 'Menu & inventory tools', 'Kitchen display & waiter alerts']
              : ['Everything in Monthly', '2 months completely free', 'Priority partner support', 'Early access to updates']
          }
        })
        setPlans(mapped)
        if (!mapped.some(p => p.key === selectedPlan)) {
          setSelectedPlan(mapped[0].key)
        }
      }
    } catch (err) {
      console.error('Error fetching plans from API:', err)
    }
  }

  const fetchSubscription = async () => {
    setSubLoading(true)
    setError('')
    try {
      const res = await api.get('/api/subscriptions/active')
      const subData = res?.data ?? null
      setSubscription(subData)
      // If there is no active subscription, default to showing the upgrade chooser immediately
      if (!subData || subData.status !== 'ACTIVE') {
        setIsEditingPlan(true)
      } else {
        setIsEditingPlan(false)
      }
    } catch (_) {
      setSubscription(null)
      setIsEditingPlan(true)
    } finally {
      setSubLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscription()
    fetchPlans()
  }, [])

  const handleRenewal = async () => {
    setError(''); setSuccess('')
    setPayLoading(true)
    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        setError('Razorpay SDK failed to load. Check your internet connection.')
        setPayLoading(false)
        return
      }

      const res = await api.post('/api/subscriptions/renew', { plan: selectedPlan })
      if (!res?.success) {
        setError(res?.message || 'Could not initialize payment. Please try again.')
        setPayLoading(false)
        return
      }

      const { amount, currency, razorpay_order_id } = res.data
      const userData = JSON.parse(localStorage.getItem('user') || '{}')

      const options = {
        key: RAZORPAY_KEY,
        amount,
        currency,
        name: 'DineDash',
        description: `${selectedPlan === 'MONTHLY' ? 'Monthly' : 'Yearly'} Subscription`,
        order_id: razorpay_order_id,
        handler: () => {
          setSyncBanner(true)
          setPayLoading(false)
          let attempts = 0
          const poll = setInterval(async () => {
            attempts++
            try {
              const latest = await api.get('/api/subscriptions/active')
              if (latest?.data?.status === 'ACTIVE') {
                clearInterval(poll)
                setSyncBanner(false)
                setSubscription(latest.data)
                setIsEditingPlan(false)
                setSuccess('Subscription activated successfully! Welcome to DineDash Premium.')
              }
            } catch (_) {}
            if (attempts >= 15) {
              clearInterval(poll)
              setSyncBanner(false)
              setError('Activation timed out. Please refresh to check your subscription status.')
            }
          }, 2000)
        },
        prefill: {
          name: userData.name || 'Restaurant Owner',
          email: userData.email || '',
        },
        theme: { color: '#ba181b' },
        modal: { ondismiss: () => setPayLoading(false) },
      }

      new window.Razorpay(options).open()
    } catch (err) {
      setError(err.message || 'Payment initialization failed. Please try again.')
      setPayLoading(false)
    }
  }

  const isExpired = subscription && subscription.status !== 'ACTIVE'
  const remaining = subscription?.ends_at ? daysLeft(subscription.ends_at) : null
  const activePlanDetails = plans.find(p => p.key === selectedPlan) || plans[0]
  const activePrice = activePlanDetails?.price || '₹99'

  return (
    <div className="p-6 flex-1 flex flex-col overflow-y-auto space-y-6 bg-gray-50/50 min-h-0">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b pb-4 border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-[#ba181b]"><IconCrown size={20} /></span>
            Subscription Management
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">Manage your DineDash restaurant plan and premium billing cycle.</p>
        </div>
        {isEditingPlan && subscription && subscription.status === 'ACTIVE' && (
          <button
            onClick={() => setIsEditingPlan(false)}
            className="dd-btn-secondary !py-1.5 !px-3 !text-xs flex items-center gap-1.5"
          >
            <IconArrowLeft /> Back to Dashboard
          </button>
        )}
      </div>

      {/* ── Alerts & Notifications ───────────────────────────────────── */}
      {syncBanner && (
        <div className="p-3.5 rounded bg-white text-gray-900 border border-[#d3d3d3] text-sm font-semibold flex items-center gap-3 shadow-sm">
          <div className="dd-spinner !w-4 !h-4 shrink-0" />
          <span>Syncing payment metadata. Your workspace will update in a few seconds...</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded bg-red-50 text-red-800 border border-red-200 text-sm font-semibold flex items-start gap-2.5 shadow-sm">
          <span className="shrink-0 mt-0.5 text-red-600"><IconAlertCircle /></span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 rounded bg-green-50 text-green-800 border border-green-200 text-sm font-semibold flex items-start gap-2.5 shadow-sm">
          <span className="shrink-0 mt-0.5 text-green-600"><IconCheckCircle /></span>
          <span>{success}</span>
        </div>
      )}
      {isExpired && (
        <div className="p-3.5 rounded bg-red-50 border border-red-200 text-sm text-[#ba181b] font-bold flex items-center gap-2.5 shadow-sm">
          ⚠️ Attention: Your premium subscription has expired. Please upgrade or renew below to restore full dashboard access.
        </div>
      )}

      {/* ── Sub Loading State ───────────────────────────────────────── */}
      {subLoading ? (
        <div className="dd-card p-12 flex flex-col items-center justify-center gap-3">
          <div className="dd-spinner" />
          <span className="text-sm text-gray-500 font-semibold">Loading subscription info...</span>
        </div>
      ) : (
        <>
          {/* ── VIEW 1: Active Subscription Details (Default state) ───── */}
          {!isEditingPlan && subscription && subscription.status === 'ACTIVE' && (
            <div className="space-y-6">
              <div className="dd-card shadow-sm">
                <div className="dd-card-header !bg-white">
                  <div>
                    <h3 className="font-bold text-[#0b090a] text-sm flex items-center gap-2">
                      <span className="text-[#ba181b]"><IconCrown size={15} /></span>
                      Current Status: Premium Active
                    </h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Your restaurant has active premium status.</p>
                  </div>
                  <button onClick={fetchSubscription} className="dd-btn-secondary !py-1.5 !px-3 !text-xs">
                    <IconRefresh /> Refresh Status
                  </button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-50/70 border border-gray-200 rounded-lg p-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#ba181b] mb-1">Active Plan</p>
                      <p className="font-extrabold text-gray-900 text-base">{subscription.plan}</p>
                      <p className="text-[11px] text-gray-500 font-semibold mt-1">Unlimited operations</p>
                    </div>
                    <div className="bg-gray-50/70 border border-gray-200 rounded-lg p-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#ba181b] mb-1">Expiration Date</p>
                      <p className="font-extrabold text-gray-900 text-base">{fmt(subscription.ends_at)}</p>
                      {remaining !== null && (
                        <p className="text-[11px] text-[#ba181b] font-bold mt-1">
                          {remaining} {remaining === 1 ? 'day' : 'days'} remaining
                        </p>
                      )}
                    </div>
                    <div className="bg-gray-50/70 border border-gray-200 rounded-lg p-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#ba181b] mb-1">Last Billing Amount</p>
                      <p className="font-extrabold text-gray-900 text-base">₹{parseFloat(subscription.amount_paid).toLocaleString('en-IN')}</p>
                      <p className="text-[11px] text-gray-500 font-semibold mt-1">Inclusive of GST</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <p className="text-xs font-bold text-gray-900">Need to extend or modify your subscription?</p>
                      <p className="text-[11px] text-gray-500 font-medium">Select a new plan to renew or stack subscription time.</p>
                    </div>
                    <button
                      onClick={() => setIsEditingPlan(true)}
                      className="dd-btn-primary !px-5 !py-2 shadow-sm font-bold text-xs"
                    >
                      <IconZap size={12} /> Upgrade / Renew Plan
                    </button>
                  </div>
                </div>
              </div>

              {/* Features Checklist */}
              <div className="dd-card p-6 shadow-sm">
                <h4 className="font-bold text-gray-900 text-sm border-b pb-3 mb-4">Included in your Premium Package</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { title: 'POS & Billing Integration', desc: 'Process orders instantly, print customer bills and sync payments.' },
                    { title: 'Digital Menu & Categories', desc: 'Create items, set pricing, add descriptions, and upload photos.' },
                    { title: 'Tables & QR Ordering', desc: 'Generate unique QR codes for self-ordering at tables.' },
                    { title: 'Kitchen & Waiter Displays', desc: 'Real-time order statuses and active waiter calling logs.' },
                    { title: 'Staff Account Management', desc: 'Give restricted app credentials to waiter and cooking staff.' },
                    { title: 'Promotions & Discounts', desc: 'Configure promo codes and percentage discounts.' }
                  ].map((feat) => (
                    <div key={feat.title} className="flex gap-3">
                      <div className="shrink-0 w-5 h-5 rounded-full bg-green-50 border border-green-200 text-green-700 flex items-center justify-center">
                        <IconCheck size={10} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{feat.title}</p>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5 leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── VIEW 2: Upgrade/Renewal Screen (Interactive Plan Chooser) ───── */}
          {isEditingPlan && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              
              {/* Plans Selection & Actions */}
              <div className="md:col-span-2 space-y-5">
                <div className="dd-card shadow-sm">
                  <div className="dd-card-header !bg-white">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Select Subscription Plan</h3>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">Select a plan to start checkout via Razorpay securely.</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {plans.map(plan => (
                        <PlanCard
                          key={plan.key}
                          plan={plan}
                          selected={selectedPlan === plan.key}
                          onSelect={setSelectedPlan}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleRenewal}
                      disabled={payLoading || syncBanner}
                      className="dd-btn-primary w-full justify-center py-3 font-bold text-sm shadow-sm"
                    >
                      {payLoading ? (
                        <><div className="dd-spinner !w-4 !h-4 !border-white/30 !border-t-white" /> Initializing Payment...</>
                      ) : (
                        <><IconZap size={14} /> Pay {activePrice} secure via Razorpay</>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-5 flex-wrap pt-2 border-t border-gray-100">
                      {['Secured by Razorpay', 'Instant activation', 'Cancel anytime'].map((t) => (
                        <span key={t} className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
                          <IconShield /> {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Order Summary */}
              <div className="space-y-5">
                <div className="dd-card p-5 shadow-sm space-y-4">
                  <h4 className="font-bold text-gray-900 text-sm border-b pb-3">
                    Order Summary
                  </h4>
                  <div className="space-y-3 text-xs font-semibold text-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Plan Duration</span>
                      <span className="text-gray-900">{activePlanDetails?.label || selectedPlan}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Price</span>
                      <span className="text-gray-900">{activePrice}</span>
                    </div>
                    {activePlanDetails?.key === 'YEARLY' && (
                      <div className="flex justify-between items-center text-[#ba181b]">
                        <span>Special Promo Savings</span>
                        <span>- ₹198</span>
                      </div>
                    )}
                    <div className="border-t pt-3 flex justify-between items-center text-sm font-bold text-gray-900">
                      <span>Total Due</span>
                      <span className="text-[#ba181b] text-base">{activePrice}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed pt-1">
                    Billing runs automatically every cycle. Time stacks if renewing active plans. You can cancel recurring billings inside the workspace anytime.
                  </p>
                </div>
              </div>

            </div>
          )}
        </>
      )}
    </div>
  )
}
