import { useState, useEffect } from 'react'
import logoRed from '../assets/logored.png'
import api from '../api'

export default function PublicMenuPage() {
  const [restaurant, setRestaurant] = useState(null)
  const [table, setTable] = useState(null)
  const [categories, setCategories] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState({})
  const [cartNotes, setCartNotes] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCartModalOpen, setIsCartModalOpen] = useState(false)

  // Ordering & Waiter Summoning States
  const [showCheckoutForm, setShowCheckoutForm] = useState(false)
  const [checkoutForm, setCheckoutForm] = useState({ customer_name: '', special_note: '' })
  const [activeOrder, setActiveOrder] = useState(null)
  const [showTracker, setShowTracker] = useState(false)
  const [waiterCallActive, setWaiterCallActive] = useState(false)

  // Session Management States
  const [sessionOrders, setSessionOrders] = useState([])
  const [showSessionExpired, setShowSessionExpired] = useState(false)

  // Restore Guest Name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('dine_dash_customer_name')
    if (savedName) {
      setCheckoutForm(prev => ({ ...prev, customer_name: savedName }))
    }
  }, [])

  // Refresh active orders for the current dining session
  const refreshActiveOrders = async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const tableToken = urlParams.get('table')
    if (!tableToken) return
    try {
      const res = await api.get(`/api/public/tables/${tableToken}/menu`)
      const data = res.data || res
      if (data.active_orders) {
        setSessionOrders(data.active_orders)
      }
    } catch (err) {
      if (err.status === 403) {
        localStorage.removeItem('dine_dash_session_token')
        setShowSessionExpired(true)
      }
    }
  }

  // Promotions & Coupon Engine States
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [promoError, setPromoError] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)

  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault()
    if (!promoCode.trim()) return
    if (!table) {
      setPromoError('Coupons can only be applied when dining at a table.')
      return
    }

    setPromoLoading(true)
    setPromoError('')

    try {
      const orderItems = Object.entries(cart).map(([itemId, qty]) => ({
        menu_item_id: itemId,
        quantity: qty,
        note: cartNotes[itemId] || ''
      }))

      const res = await api.post('/api/public/promotions/validate', {
        code: promoCode.trim().toUpperCase(),
        table_id: table.id,
        items: orderItems
      }, { skipAuth: true })

      const validationResult = res.data || res
      if (validationResult.eligible) {
        setAppliedPromo(validationResult)
      } else {
        setAppliedPromo(null)
        setPromoError(validationResult.message || 'This coupon code is not eligible.')
      }
    } catch (err) {
      setAppliedPromo(null)
      setPromoError(err.message || 'Failed to validate coupon code.')
    } finally {
      setPromoLoading(false)
    }
  }

  // Auto re-validate coupon code when items or quantities in cart change
  useEffect(() => {
    if (appliedPromo && Object.keys(cart).length > 0 && table) {
      const revalidate = async () => {
        try {
          const orderItems = Object.entries(cart).map(([itemId, qty]) => ({
            menu_item_id: itemId,
            quantity: qty,
            note: cartNotes[itemId] || ''
          }))
          const res = await api.post('/api/public/promotions/validate', {
            code: promoCode.trim().toUpperCase(),
            table_id: table.id,
            items: orderItems
          }, { skipAuth: true })

          const validationResult = res.data || res
          if (validationResult.eligible) {
            setAppliedPromo(validationResult)
          } else {
            setAppliedPromo(null)
            setPromoError('Coupon conditions no longer met.')
          }
        } catch (err) {
          setAppliedPromo(null)
          setPromoError('Coupon conditions no longer met.')
        }
      }
      revalidate()
    } else if (Object.keys(cart).length === 0) {
      setAppliedPromo(null)
      setPromoCode('')
      setPromoError('')
    }
  }, [cart])

  useEffect(() => {
    const fetchPublicMenu = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const tableToken = urlParams.get('table')
      const slug = urlParams.get('slug')

      setLoading(true)
      setError('')

      try {
        let res
        if (tableToken) {
          res = await api.get(`/api/public/tables/${tableToken}/menu`)
        } else if (slug) {
          res = await api.get(`/api/public/restaurants/${slug}/menu`)
        } else {
          throw new Error('Invalid URL parameters. Please scan a table QR code or visit a valid store link.')
        }

        const data = res.data || res
        setRestaurant(data.restaurant)
        setTable(data.table || null)
        
        if (data.table) {
          localStorage.setItem('dine_dash_table_id', data.table.id)
          if (data.table.session_token) {
            localStorage.setItem('dine_dash_session_token', data.table.session_token)
          }
          if (data.active_orders) {
            setSessionOrders(data.active_orders)
          }
        }
        
        const menuData = data.menu || []
        setCategories(menuData)

        if (menuData.length > 0) {
          setSelectedCategoryId(menuData[0].id)
        }
      } catch (err) {
        if (err.status === 403) {
          localStorage.removeItem('dine_dash_session_token')
          setShowSessionExpired(true)
        } else {
          setError(err.message || 'Unable to load restaurant menu. Please try scanning the QR code again.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPublicMenu()
  }, [])

  // Order status polling loop
  useEffect(() => {
    if (!activeOrder) return
    const pollInterval = setInterval(async () => {
      try {
        const res = await api.get(`/api/public/orders/${activeOrder.id}`)
        const updatedOrder = res.data || res
        setActiveOrder(updatedOrder)
      } catch (err) {
        console.error('Error polling order status:', err)
      }
    }, 5000)

    return () => clearInterval(pollInterval)
  }, [activeOrder])

  // Active session orders polling loop
  useEffect(() => {
    if (!table) return
    // Poll active orders every 15 seconds to sync group orders
    const pollInterval = setInterval(refreshActiveOrders, 15000)
    return () => clearInterval(pollInterval)
  }, [table])

  const updateCartQuantity = (itemId, delta) => {
    setCart((prev) => {
      const currentQty = prev[itemId] || 0
      const newQty = Math.max(0, currentQty + delta)
      const updated = { ...prev }
      if (newQty === 0) {
        delete updated[itemId]
      } else {
        updated[itemId] = newQty
      }
      return updated
    })
  }

  const cartItemsCount = Object.values(cart).reduce((a, b) => a + b, 0)

  const findItemById = (itemId) => {
    for (const cat of categories) {
      const found = cat.items?.find(item => item.id === itemId)
      if (found) return found
    }
    return null
  }

  const cartSubtotal = Object.entries(cart).reduce((sum, [itemId, qty]) => {
    const item = findItemById(itemId)
    return sum + (item ? parseFloat(item.price) * qty : 0)
  }, 0)

  const activeCategory = categories.find(cat => cat.id === selectedCategoryId)
  const filteredItems = activeCategory
    ? (activeCategory.items || []).filter(item =>
        item.name_en.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    const sessionToken = localStorage.getItem('dine_dash_session_token')
    if (!table || !sessionToken) {
      alert('No active session found. Please re-scan your table QR code.')
      return
    }
    if (!checkoutForm.customer_name) {
      alert('Please enter your name.')
      return
    }

    setLoading(true)
    setError('')

    // Store customer name locally
    localStorage.setItem('dine_dash_customer_name', checkoutForm.customer_name)

    const orderItems = Object.entries(cart).map(([itemId, qty]) => ({
      menu_item_id: itemId,
      quantity: qty,
      note: cartNotes[itemId] || ''
    }))

    const payload = {
      customer_name: checkoutForm.customer_name,
      table_id: table.id,
      session_token: sessionToken,
      special_note: checkoutForm.special_note,
      promo_code: appliedPromo ? promoCode.trim().toUpperCase() : undefined,
      items: orderItems
    }

    try {
      const res = await api.post('/api/public/orders', payload)
      const newOrder = res.data || res

      setActiveOrder(newOrder)
      setCart({})
      setIsCartModalOpen(false)
      setShowCheckoutForm(false)
      setShowTracker(true)
      await refreshActiveOrders()
    } catch (err) {
      if (err.status === 403) {
        localStorage.removeItem('dine_dash_session_token')
        setShowSessionExpired(true)
      } else {
        setError(err.message || 'Failed to submit order. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCallWaiter = async () => {
    if (!activeOrder) return
    setLoading(true)
    try {
      await api.post(`/api/public/orders/${activeOrder.id}/call-waiter`)
      setWaiterCallActive(true)
      setTimeout(() => {
        setWaiterCallActive(false)
      }, 6000)
    } catch (err) {
      alert(err.message || 'Failed to summon waiter.')
    } finally {
      setLoading(false)
    }
  }

  if (loading && categories.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f3f4] p-4 font-sans">
        <div className="w-10 h-10 border-4 border-[#ba181b]/20 border-t-[#ba181b] rounded-none animate-spin"></div>
        <p className="mt-4 text-sm font-bold text-[#161a1d]/60 uppercase tracking-widest">
          Loading Menu...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f3f4] p-6 text-center font-sans">
        <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-none flex items-center justify-center text-[#ba181b] mb-4 shadow-sm">
          <svg className="w-6 h-6 text-[#ba181b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="font-outfit text-lg font-black text-[#0b090a] tracking-tight uppercase mb-1">
          Menu Error
        </h3>
        <p className="text-xs text-[#161a1d]/70 max-w-xs font-semibold leading-relaxed mb-6">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#ba181b] hover:bg-[#a4161a] text-white text-xs font-black uppercase tracking-wider px-6 py-3 rounded-none transition-colors"
        >
          Retry Scan
        </button>
      </div>
    )
  }

  // --- RENDERING ORDER STATUS TRACKING PANEL ---
  if (showTracker && activeOrder) {
    const isCancelled = activeOrder.status === 'CANCELLED'
    const statusOrder = ['PENDING', 'PREPARING', 'READY', 'SERVED']
    const currentIndex = statusOrder.indexOf(activeOrder.status)

    // Combined bill across all session orders (same logic as tray)
    const allSessionItems = []
    sessionOrders.forEach(order => {
      order.OrderItems?.forEach(item => {
        const key = `${item.MenuItem?.name_en}||${item.note || ''}`
        const existing = allSessionItems.find(i => i.key === key)
        if (existing) {
          existing.quantity += item.quantity
          existing.total_price = (parseFloat(existing.total_price) + parseFloat(item.total_price)).toFixed(2)
        } else {
          allSessionItems.push({ key, ...item })
        }
      })
    })
    const sessionTotal = sessionOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
    const hasMultipleOrders = sessionOrders.length > 1

    return (
      <div className="min-h-screen bg-[#f5f3f4] font-sans antialiased text-[#161a1d] flex flex-col items-center">
        <div className="w-full max-w-[480px] min-h-screen bg-white shadow flex flex-col relative pb-24 border-x border-[#d3d3d3]/35">
          
          {/* Header */}
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#d3d3d3]/60 px-6 py-4 flex justify-between items-center shadow-sm">
            <div>
              <h1 className="font-outfit text-base font-black text-[#0b090a] tracking-tight">
                Order Tracking
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[10px] uppercase tracking-widest font-black text-[#ba181b] bg-[#ba181b]/10 px-2 py-0.5 rounded-none inline-block">
                  Latest: KOT #{activeOrder.order_number}
                </span>
                {hasMultipleOrders && (
                  <span className="text-[10px] uppercase tracking-widest font-black text-[#161a1d] bg-[#f5f3f4] border border-[#d3d3d3] px-2 py-0.5 rounded-none inline-block">
                    {sessionOrders.length} orders this session
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowTracker(false)}
              className="text-xs font-bold text-[#161a1d]/70 border border-[#d3d3d3] px-3 py-1.5 rounded-none hover:bg-neutral-50"
            >
              Browse Menu
            </button>
          </header>

          <div className="p-6 flex-1 flex flex-col justify-between space-y-6">

            {/* Combined session bill (shown if there are multiple orders) */}
            {allSessionItems.length > 0 && (
              <div className="bg-[#f5f3f4] border border-[#d3d3d3]/60 rounded-none p-4 space-y-2">
                <h3 className="text-[10px] font-black text-[#161a1d] uppercase tracking-widest border-b border-[#d3d3d3]/30 pb-2 flex justify-between items-center">
                  <span>Table's Running Bill</span>
                  <span className="text-[#ba181b] font-mono text-xs">₹{sessionTotal.toFixed(0)}</span>
                </h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {allSessionItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                        <span className="font-black text-[#0b090a] shrink-0 w-5 text-center">{item.quantity}×</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#161a1d] truncate">{item.MenuItem?.name_en || 'Item'}</p>
                          {item.note && <p className="text-[#b1a7a6] text-[10px] italic truncate">{item.note}</p>}
                        </div>
                      </div>
                      <span className="font-black text-[#0b090a] font-mono shrink-0">₹{parseFloat(item.total_price).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
                {/* Per-order breakdown when multiple orders */}
                {hasMultipleOrders && (
                  <div className="pt-2 border-t border-[#d3d3d3]/40 space-y-0.5">
                    <p className="text-[9px] font-black text-[#b1a7a6] uppercase tracking-widest mb-1">Breakdown by KOT</p>
                    {sessionOrders.map(order => (
                      <div key={order.id} className="flex justify-between items-center text-[10px]">
                        <span className="text-[#161a1d]/60 font-semibold">KOT #{order.order_number}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#161a1d]/60">₹{parseFloat(order.total_amount).toFixed(0)}</span>
                          <span className={`px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-extrabold rounded ${
                            order.status === 'SERVED' ? 'bg-[#161a1d]/10 text-[#161a1d]'
                            : order.status === 'READY' ? 'bg-[#ba181b]/10 text-[#ba181b]'
                            : order.status === 'PREPARING' ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-600'
                          }`}>{order.status}</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-1.5 border-t border-[#d3d3d3]/40 text-xs mt-1">
                      <span className="font-black text-[#161a1d] uppercase tracking-wider text-[10px]">Total Payable</span>
                      <span className="font-black text-[#ba181b] font-mono">₹{sessionTotal.toFixed(0)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Status Visual Tracker Timeline */}
            <div className="bg-gray-50 border border-[#d3d3d3]/60 rounded-none p-5 space-y-6">
              <h3 className="text-[10px] font-black text-[#ba181b] uppercase tracking-widest border-b border-[#d3d3d3]/30 pb-2">
                {hasMultipleOrders ? `KOT #${activeOrder.order_number} Status` : 'Order Status Updates'}
              </h3>

              {isCancelled ? (
                <div className="bg-red-50 text-[#a4161a] p-4 rounded-none text-sm font-bold border border-red-100 flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  Order was cancelled by kitchen staff.
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Step 1: Received */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-none flex items-center justify-center text-xs font-black border-2 ${currentIndex >= 0 ? 'bg-[#ba181b] border-[#ba181b] text-white' : 'bg-white border-[#d3d3d3] text-[#b1a7a6]'}`}>
                        {currentIndex >= 0 ? (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : '1'}
                      </div>
                      <div className={`w-0.5 h-10 ${currentIndex > 0 ? 'bg-[#ba181b]' : 'bg-[#d3d3d3]'}`}></div>
                    </div>
                    <div className="pt-0.5">
                      <p className={`text-sm font-bold ${currentIndex >= 0 ? 'text-[#0b090a]' : 'text-[#b1a7a6]'}`}>Order Received</p>
                      <p className="text-xs text-[#b1a7a6] mt-0.5">Sent to kitchen display</p>
                    </div>
                  </div>

                  {/* Step 2: Preparing */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-none flex items-center justify-center text-xs font-black border-2 ${currentIndex >= 1 ? 'bg-[#ba181b] border-[#ba181b] text-white' : 'bg-white border-[#d3d3d3] text-[#b1a7a6]'}`}>
                        {currentIndex >= 1 ? (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : '2'}
                      </div>
                      <div className={`w-0.5 h-10 ${currentIndex > 1 ? 'bg-[#ba181b]' : 'bg-[#d3d3d3]'}`}></div>
                    </div>
                    <div className="pt-0.5">
                      <p className={`text-sm font-bold ${currentIndex >= 1 ? 'text-[#0b090a]' : 'text-[#b1a7a6]'}`}>In the Kitchen</p>
                      <p className="text-xs text-[#b1a7a6] mt-0.5">Chef is preparing your dishes</p>
                    </div>
                  </div>

                  {/* Step 3: Ready */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-none flex items-center justify-center text-xs font-black border-2 ${currentIndex >= 2 ? 'bg-[#ba181b] border-[#ba181b] text-white' : 'bg-white border-[#d3d3d3] text-[#b1a7a6]'}`}>
                        {currentIndex >= 2 ? (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : '3'}
                      </div>
                      <div className={`w-0.5 h-10 ${currentIndex > 2 ? 'bg-[#ba181b]' : 'bg-[#d3d3d3]'}`}></div>
                    </div>
                    <div className="pt-0.5">
                      <p className={`text-sm font-bold ${currentIndex >= 2 ? 'text-[#0b090a]' : 'text-[#b1a7a6]'}`}>Dishes Ready</p>
                      <p className="text-xs text-[#b1a7a6] mt-0.5">Food prepared and waiting to be served</p>
                    </div>
                  </div>

                  {/* Step 4: Served */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-none flex items-center justify-center text-xs font-black border-2 ${currentIndex >= 3 ? 'bg-[#ba181b] border-[#ba181b] text-white' : 'bg-white border-[#d3d3d3] text-[#b1a7a6]'}`}>
                        {currentIndex >= 3 ? (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : '4'}
                      </div>
                    </div>
                    <div className="pt-0.5">
                      <p className={`text-sm font-bold ${currentIndex >= 3 ? 'text-[#0b090a]' : 'text-[#b1a7a6]'}`}>Served</p>
                      <p className="text-xs text-[#b1a7a6] mt-0.5">Enjoy your meal!</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

             {/* Waiter Summon Panel */}
            <div className="space-y-4 pt-6 border-t border-[#d3d3d3]/40">
              {waiterCallActive ? (
                <div className="bg-[#f5f3f4] text-[#161a1d] p-4 rounded-none border border-[#d3d3d3] text-xs font-bold text-center flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-[#ba181b] animate-bounce shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>Waiter summoned successfully! A team member is heading to your table.</span>
                </div>
              ) : (
                <button
                  onClick={handleCallWaiter}
                  disabled={loading}
                  className="w-full bg-[#161a1d] hover:bg-black text-white font-black py-4 px-6 rounded-none text-xs uppercase tracking-wider transition-all cursor-pointer shadow flex items-center justify-center gap-2.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Summon Waiter to Table
                </button>
              )}
            </div>

          </div>

          <footer className="py-6 bg-white border-t border-[#d3d3d3]/30 text-center text-xs text-[#b1a7a6] font-semibold tracking-wide">
            Powered by DineDash
          </footer>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f3f4] font-sans antialiased text-[#161a1d] flex flex-col items-center">
      
      {/* Floating active order tracking notification banner if order is placed */}
      {activeOrder && !showTracker && (
        <div
          onClick={() => setShowTracker(true)}
          className="fixed top-4 z-50 max-w-[440px] w-[90%] bg-[#ba181b] text-white py-3.5 px-4 rounded-none shadow-lg border border-[#ba181b]/20 flex justify-between items-center cursor-pointer font-bold text-xs animate-bounce"
        >
          <span className="flex items-center gap-2.5">
            <svg className="w-4 h-4 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
            </svg>
            <span>Order #{activeOrder.order_number}: <span className="uppercase tracking-wider text-[10px] bg-white/20 px-1.5 py-0.5 rounded-none">{activeOrder.status}</span></span>
          </span>
          <span className="underline text-[10px] tracking-wide uppercase">Track Order →</span>
        </div>
      )}

      {/* Phone container wrapper */}
      <div className="w-full max-w-[480px] min-h-screen bg-white shadow flex flex-col relative pb-24 border-x border-[#d3d3d3]/35">
        
        {/* 1. STICKY HEADER BRANDING */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#d3d3d3]/60 px-6 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2.5">
            {restaurant?.logo_url && (
              <img src={restaurant.logo_url} alt="Logo" className="w-8 h-8 object-cover rounded-none border border-[#d3d3d3]" />
            )}
            <div>
              <h1 className="font-outfit text-base font-black text-[#0b090a] tracking-tight">
                {restaurant?.name || 'Partner Outlet'}
              </h1>
              {!table && (
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#ba181b] bg-[#ba181b]/10 px-1.5 py-0.5 rounded-none mt-0.5 inline-block">
                  Storefront Browse
                </span>
              )}
            </div>
          </div>
          {table && (
            <span className="text-[10px] uppercase tracking-wider font-black text-[#0b090a] border border-[#0b090a] px-2.5 py-1 rounded-none inline-block">
              {String(table.table_number).toLowerCase().startsWith('table') ? table.table_number : `Table ${table.table_number}`}
            </span>
          )}
        </header>

        {/* Active Session Orders Group Tray — Combined Bill */}
        {table && sessionOrders && sessionOrders.length > 0 && (() => {
          // Flatten all items from all session orders into a single combined bill
          const allItems = []
          sessionOrders.forEach(order => {
            order.OrderItems?.forEach(item => {
              // Merge key: item name + note so we can group duplicates
              const key = `${item.MenuItem?.name_en}||${item.note || ''}`
              const existing = allItems.find(i => i.key === key)
              if (existing) {
                existing.quantity += item.quantity
                existing.total_price = (parseFloat(existing.total_price) + parseFloat(item.total_price)).toFixed(2)
              } else {
                allItems.push({ key, ...item, quantity: item.quantity, total_price: item.total_price })
              }
            })
          })

          const sessionTotal = sessionOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)

          // Determine if any order is still active (not yet served/cancelled)
          const activeOrders = sessionOrders.filter(o => !['SERVED', 'CANCELLED'].includes(o.status))
          const hasActiveKOT = activeOrders.length > 0

          return (
            <div className="bg-[#f5f3f4] border-b border-[#d3d3d3]/60">
              {/* Collapsed header — always visible */}
              <div className="px-4 py-3 flex justify-between items-center">
                <h3 className="text-[10px] font-black text-[#161a1d] uppercase tracking-widest flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#ba181b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Table's Running Bill
                  {hasActiveKOT && (
                    <span className="ml-1 text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider animate-pulse">
                      {activeOrders.length} KOT Active
                    </span>
                  )}
                </h3>
                <span className="text-sm font-black text-[#ba181b] font-mono">
                  ₹{sessionTotal.toFixed(0)}
                </span>
              </div>

              {/* Combined items list */}
              <div className="px-4 pb-3 space-y-1 max-h-44 overflow-y-auto">
                {allItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-[#d3d3d3]/20 last:border-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                      <span className="font-black text-[#0b090a] shrink-0 w-5 text-center">
                        {item.quantity}×
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#161a1d] truncate">{item.MenuItem?.name_en || 'Item'}</p>
                        {item.note && (
                          <p className="text-[#b1a7a6] text-[10px] truncate italic">{item.note}</p>
                        )}
                      </div>
                    </div>
                    <span className="font-black text-[#0b090a] font-mono shrink-0">
                      ₹{parseFloat(item.total_price).toFixed(0)}
                    </span>
                  </div>
                ))}

                {/* Per-order status summary */}
                {sessionOrders.length > 1 && (
                  <div className="pt-2 mt-1 border-t border-[#d3d3d3]/40 space-y-0.5">
                    <p className="text-[9px] font-black text-[#b1a7a6] uppercase tracking-widest mb-1">Order Breakdown</p>
                    {sessionOrders.map(order => (
                      <div key={order.id} className="flex justify-between items-center text-[10px]">
                        <span className="text-[#161a1d]/60 font-semibold">KOT #{order.order_number}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#161a1d]/60">₹{parseFloat(order.total_amount).toFixed(0)}</span>
                          <span className={`px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-extrabold rounded ${
                            order.status === 'SERVED' ? 'bg-[#161a1d]/10 text-[#161a1d]'
                            : order.status === 'READY' ? 'bg-[#ba181b]/10 text-[#ba181b]'
                            : order.status === 'PREPARING' ? 'bg-amber-100 text-amber-800'
                            : order.status === 'CANCELLED' ? 'bg-gray-100 text-gray-400 line-through'
                            : 'bg-gray-100 text-gray-600'
                          }`}>{order.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total row */}
                <div className="flex justify-between items-center pt-2 mt-1 border-t border-[#d3d3d3]/60 text-xs">
                  <span className="font-black text-[#161a1d] uppercase tracking-wider text-[10px]">Total Payable</span>
                  <span className="font-black text-[#ba181b] font-mono text-sm">₹{sessionTotal.toFixed(0)}</span>
                </div>
              </div>
            </div>
          )
        })()}

        {/* 2. SEARCH & NAVIGATION SECTION */}
        <div className="px-5 pt-4 pb-3 bg-white space-y-3">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b1a7a6] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" /></svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes..."
              className="w-full pl-10 pr-4 py-2.5 rounded-none border border-[#d3d3d3] bg-white placeholder-[#b1a7a6] text-sm focus:outline-none focus:border-[#ba181b] focus:ring-1 focus:ring-[#ba181b] transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isActive = selectedCategoryId === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-4 py-2 rounded-none text-sm font-semibold transition-all whitespace-nowrap cursor-pointer border ${
                    isActive
                      ? 'bg-[#ba181b] text-white border-[#ba181b]'
                      : 'bg-white text-[#161a1d] hover:border-[#ba181b] hover:text-[#ba181b] border-[#d3d3d3]'
                  }`}
                >
                  {cat.name_en}
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. DISH ITEMS LIST CONTAINER */}
        <div className="flex-1 px-5 py-4 bg-[#f5f3f4]/40">
          <h2 className="text-xs font-black text-[#161a1d] uppercase tracking-widest mb-3 border-b border-[#d3d3d3]/40 pb-2">
            {activeCategory?.name_en || 'Dishes'}
          </h2>

          {filteredItems.length === 0 ? (
            <div className="py-16 text-center">
              <svg className="w-10 h-10 text-[#d3d3d3] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              <p className="text-sm font-semibold text-[#b1a7a6]">No items found</p>
            </div>
          ) : (
            <div className="divide-y divide-[#d3d3d3]/40">
              {filteredItems.map((item) => {
                const qty = cart[item.id] || 0
                return (
                  <div key={item.id} className="py-4 bg-white px-3 mb-2 border border-[#e8e8e8]">
                    <div className="flex gap-3 justify-between items-start">
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex w-3.5 h-3.5 border-2 shrink-0 items-center justify-center ${item.is_veg ? 'border-[#2d6a4f]' : 'border-[#ba181b]'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-[#2d6a4f]' : 'bg-[#ba181b]'}`} />
                          </span>
                          {item.is_combo && (
                            <span className="bg-[#ba181b]/10 text-[#ba181b] text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5">
                              Combo
                            </span>
                          )}
                        </div>

                        <p className="font-bold text-base text-[#0b090a] leading-snug">
                          {item.name_en}
                        </p>
                        {item.name_hi && (
                          <p className="text-xs text-[#b1a7a6] font-medium">
                            {item.name_hi}
                          </p>
                        )}

                        {item.description_en && (
                          <p className="text-xs text-[#161a1d]/55 leading-relaxed pr-2">
                            {item.description_en}
                          </p>
                        )}

                        {item.is_combo && item.ComboComponents && (
                          <div className="mt-1.5 text-xs text-[#b1a7a6] bg-[#f5f3f4] px-2.5 py-1.5 border border-[#e8e8e8]">
                            <p className="uppercase tracking-widest text-[#ba181b] text-[10px] mb-1 font-bold">Includes:</p>
                            <ul className="space-y-0.5 list-disc pl-3">
                              {item.ComboComponents.map(comp => (
                                <li key={comp.id}>
                                  {comp.ComboItem?.quantity}x {comp.name_en}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <p className="font-black text-[#0b090a] text-base font-mono">
                          ₹{parseFloat(item.price).toFixed(0)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-2">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name_en}
                            className="w-20 h-20 object-cover border border-[#e8e8e8]"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-[#f5f3f4] border border-[#e8e8e8] flex items-center justify-center">
                            <svg className="w-8 h-8 text-[#d3d3d3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                          </div>
                        )}

                        {qty === 0 ? (
                          <button
                            onClick={() => updateCartQuantity(item.id, 1)}
                            className="bg-white border border-[#ba181b] text-[#ba181b] font-bold text-sm px-5 py-1.5 hover:bg-[#ba181b] hover:text-white transition-all cursor-pointer"
                          >
                            Add
                          </button>
                        ) : (
                          <div className="bg-[#ba181b] text-white flex items-center gap-0 font-bold text-sm overflow-hidden">
                            <button
                              onClick={() => updateCartQuantity(item.id, -1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-[#a4161a] select-none cursor-pointer text-base"
                            >
                              −
                            </button>
                            <span className="w-7 text-center font-black font-mono select-none">{qty}</span>
                            <button
                              onClick={() => updateCartQuantity(item.id, 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-[#a4161a] select-none cursor-pointer text-base"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {qty > 0 && (
                      <div className="pt-2">
                        <input
                          type="text"
                          value={cartNotes[item.id] || ''}
                          onChange={(e) => setCartNotes({ ...cartNotes, [item.id]: e.target.value })}
                          placeholder="Note for kitchen (e.g. no onions)..."
                          className="w-full px-3 py-2 border border-[#d3d3d3] bg-white placeholder-[#b1a7a6] text-xs focus:outline-none focus:border-[#ba181b]"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <footer className="py-5 bg-white border-t border-[#d3d3d3]/30 text-center text-xs text-[#b1a7a6] tracking-wide mt-4">
          Powered by DineDash
        </footer>

        {/* 4. STICKY FLOATING CART SUMMARY BAR */}
        {cartItemsCount > 0 && (
          <div className="fixed bottom-0 max-w-[480px] w-full bg-[#ba181b] text-white py-4 px-5 shadow-[0_-4px_24px_rgba(0,0,0,0.15)] flex justify-between items-center z-40">
            <div>
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider">{cartItemsCount} item{cartItemsCount > 1 ? 's' : ''}</p>
              <p className="text-lg font-black font-mono">₹{cartSubtotal.toFixed(0)}</p>
            </div>
            <button
              onClick={() => setIsCartModalOpen(true)}
              className="bg-white hover:bg-[#f5f3f4] text-[#ba181b] text-sm font-bold uppercase tracking-wider px-5 py-2.5 transition-colors cursor-pointer"
            >
              View Order
            </button>
          </div>
        )}

      </div>

      {/* F. CART REVIEW MODAL OVERLAY */}
      {isCartModalOpen && (
        <div className="fixed inset-0 bg-[#0b090a]/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white rounded-none border-t border-[#d3d3d3] w-full max-w-[480px] p-6 shadow-2xl animate-fade-in-up max-h-[85vh] flex flex-col justify-between">
            
            {!showCheckoutForm ? (
              <>
                <div>
                  <div className="flex justify-between items-center mb-5 border-b border-[#d3d3d3]/30 pb-4">
                    <h3 className="text-base font-black text-[#0b090a] uppercase tracking-wider">
                      Your Order
                    </h3>
                    <button
                      onClick={() => setIsCartModalOpen(false)}
                      className="text-[#161a1d]/50 hover:text-[#ba181b] text-sm font-semibold transition-all"
                    >
                      Close
                    </button>
                  </div>

                  <div className="overflow-y-auto divide-y divide-[#d3d3d3]/30 pr-1 space-y-1 max-h-[45vh]">
                    {Object.entries(cart).map(([itemId, qty]) => {
                      const item = findItemById(itemId)
                      if (!item) return null
                      return (
                        <div key={itemId} className="py-3 flex justify-between items-center">
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="text-sm font-bold text-[#0b090a]">{item.name_en}</p>
                            <p className="text-xs text-[#b1a7a6] font-mono mt-0.5">₹{parseFloat(item.price).toFixed(0)} × {qty} = ₹{(parseFloat(item.price) * qty).toFixed(0)}</p>
                            {cartNotes[itemId] && (
                              <p className="text-xs text-[#ba181b] mt-0.5">Note: {cartNotes[itemId]}</p>
                            )}
                          </div>

                          <div className="bg-[#ba181b] text-white flex items-center font-bold text-sm overflow-hidden shrink-0">
                            <button
                              onClick={() => updateCartQuantity(item.id, -1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-[#a4161a] cursor-pointer select-none"
                            >
                              −
                            </button>
                            <span className="w-7 text-center font-black font-mono">{qty}</span>
                            <button
                              onClick={() => updateCartQuantity(item.id, 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-[#a4161a] cursor-pointer select-none"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Coupon Input Area */}
                {table && (
                  <div className="border-t border-[#d3d3d3]/45 pt-4 mt-4 space-y-3">
                    <p className="text-[10px] font-black text-[#161a1d] uppercase tracking-widest">
                      Have a coupon code?
                    </p>
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value)
                          if (promoError) setPromoError('')
                        }}
                        disabled={promoLoading}
                        placeholder="ENTER CODE (e.g. SAVE20)"
                        className="flex-1 px-3 py-2 border border-[#d3d3d3] rounded-none text-xs font-mono font-bold uppercase tracking-wider focus:outline-none focus:border-[#ba181b]"
                      />
                      <button
                        type="submit"
                        disabled={promoLoading || !promoCode.trim()}
                        className="bg-[#161a1d] hover:bg-black text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-none transition-colors disabled:opacity-50"
                      >
                        {promoLoading ? 'Checking...' : 'Apply'}
                      </button>
                    </form>

                    {promoError && (
                      <p className="text-[10px] text-[#ba181b] font-bold flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[#ba181b] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {promoError}
                      </p>
                    )}

                    {appliedPromo && (
                      <div className="bg-[#f5f3f4] border border-[#d3d3d3] rounded-none p-2.5 flex justify-between items-center text-xs text-[#ba181b] font-bold">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-[#ba181b] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Code "{promoCode.toUpperCase()}" Applied!</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedPromo(null)
                            setPromoCode('')
                          }}
                          className="text-[#161a1d] hover:text-[#ba181b] font-black text-xs px-1"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t border-[#d3d3d3]/45 pt-5 mt-6 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#161a1d]/60 uppercase tracking-wider text-[10px]">Subtotal</span>
                    <span className="font-black text-[#0b090a] font-mono">₹{cartSubtotal.toFixed(0)}</span>
                  </div>

                  {appliedPromo && (
                    <div className="flex justify-between items-center text-xs text-[#ba181b] font-bold">
                      <span className="uppercase tracking-wider text-[10px]">Coupon Discount</span>
                      <span className="font-mono">- ₹{parseFloat(appliedPromo.discount_amount).toFixed(0)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm border-t border-dashed border-[#d3d3d3] pt-2.5">
                    <span className="font-bold text-[#161a1d] uppercase tracking-wider text-[10px]">Total Billed</span>
                    <span className="font-black text-[#ba181b] font-mono text-base">
                      ₹{appliedPromo ? parseFloat(appliedPromo.total_amount).toFixed(0) : cartSubtotal.toFixed(0)}
                    </span>
                  </div>

                  {table ? (
                    <button
                      onClick={() => setShowCheckoutForm(true)}
                      className="w-full bg-[#ba181b] hover:bg-[#a4161a] text-white font-black py-4 px-4 text-sm uppercase tracking-wider transition-colors cursor-pointer text-center"
                    >
                      Confirm &amp; Place Order
                    </button>
                  ) : (
                    <div className="p-3 bg-[#f5f3f4] border border-[#d3d3d3] text-sm text-[#ba181b] font-semibold text-center">
                      Ordering is available only at a table. Scan a QR code to order.
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* GUEST IDENTIFICATION & NOTE INPUT FORM */
              <form onSubmit={handlePlaceOrder} className="space-y-5">
                <div className="flex justify-between items-center border-b border-[#d3d3d3]/30 pb-4">
                  <h3 className="font-outfit text-base font-black text-[#0b090a] uppercase tracking-wider">
                    Place Table Order
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowCheckoutForm(false)}
                    className="text-xs font-bold text-[#ba181b] hover:underline"
                  >
                    ← Edit Cart
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="customer_name" className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                      Your Full Name
                    </label>
                    <input
                      id="customer_name"
                      type="text"
                      required
                      value={checkoutForm.customer_name}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_name: e.target.value })}
                      placeholder="Jane Doe"
                      className="w-full px-4 py-3 rounded-none border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] transition-all font-sans"
                    />
                  </div>

                  <div>
                    <label htmlFor="special_note" className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                      Special Note / Instructions <span className="text-[#b1a7a6] font-normal font-sans">(Optional)</span>
                    </label>
                    <textarea
                      id="special_note"
                      rows={2}
                      value={checkoutForm.special_note}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, special_note: e.target.value })}
                      placeholder="E.g. Make it extra spicy, less salt..."
                      className="w-full px-4 py-3 rounded-none border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] transition-all resize-none font-sans"
                    />
                  </div>
                </div>

                <div className="border-t border-[#d3d3d3]/45 pt-5 mt-6 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#161a1d]/60 uppercase tracking-wider text-[10px]">Subtotal</span>
                    <span className="font-bold text-[#0b090a] font-mono">₹{cartSubtotal.toFixed(0)}</span>
                  </div>

                  {appliedPromo && (
                    <div className="flex justify-between items-center text-xs text-[#ba181b] font-bold">
                      <span className="uppercase tracking-wider text-[10px]">Coupon Discount</span>
                      <span className="font-mono">- ₹{parseFloat(appliedPromo.discount_amount).toFixed(0)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm border-t border-dashed border-[#d3d3d3] pt-2.5">
                    <span className="font-bold text-[#161a1d] uppercase tracking-wider text-[10px]">Total Amount Billed</span>
                    <span className="font-black text-[#ba181b] font-mono text-base">
                      ₹{appliedPromo ? parseFloat(appliedPromo.total_amount).toFixed(0) : cartSubtotal.toFixed(0)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#ba181b] hover:bg-[#a4161a] text-white font-black py-4 px-4 rounded-none text-xs uppercase tracking-wider transition-colors cursor-pointer text-center"
                  >
                    Send Order to Kitchen
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* SESSION EXPIRED MODAL */}
      {showSessionExpired && (
        <div className="fixed inset-0 bg-[#0b090a]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-none border border-[#d3d3d3] w-full max-w-sm p-6 shadow-2xl animate-fade-in-up text-center">
            <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-none flex items-center justify-center text-[#ba181b] mx-auto mb-4 shadow-sm">
              <svg className="w-6 h-6 text-[#ba181b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-outfit text-base font-black text-[#0b090a] tracking-tight uppercase mb-1">
              Session Expired
            </h3>
            <p className="text-xs text-[#161a1d]/70 leading-relaxed mb-6 font-semibold">
              Your dining session has ended, or you are no longer seated at the table. Please scan the QR code on your table to open a new session.
            </p>
            <button
              onClick={() => {
                setShowSessionExpired(false)
                window.location.reload()
              }}
              className="w-full bg-[#ba181b] hover:bg-[#a4161a] text-white text-xs font-black uppercase tracking-wider py-3 rounded-none transition-colors"
            >
              Okay
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
