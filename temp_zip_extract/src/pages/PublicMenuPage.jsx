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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCartModalOpen, setIsCartModalOpen] = useState(false)

  // Ordering & Waiter Summoning States
  const [showCheckoutForm, setShowCheckoutForm] = useState(false)
  const [checkoutForm, setCheckoutForm] = useState({ customer_name: '', special_note: '' })
  const [activeOrder, setActiveOrder] = useState(null)
  const [showTracker, setShowTracker] = useState(false)
  const [waiterCallActive, setWaiterCallActive] = useState(false)

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
        quantity: qty
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
            quantity: qty
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
        
        const menuData = data.menu || []
        setCategories(menuData)

        if (menuData.length > 0) {
          setSelectedCategoryId(menuData[0].id)
        }
      } catch (err) {
        setError(err.message || 'Unable to load restaurant menu. Please try scanning the QR code again.')
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
    if (!table) {
      alert('Ordering is only available at a physical table scan. Please scan a table QR sticker.')
      return
    }
    if (!checkoutForm.customer_name) {
      alert('Please enter your name.')
      return
    }

    setLoading(true)
    setError('')

    const orderItems = Object.entries(cart).map(([itemId, qty]) => ({
      menu_item_id: itemId,
      quantity: qty
    }))

    const payload = {
      customer_name: checkoutForm.customer_name,
      table_id: table.id,
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
    } catch (err) {
      setError(err.message || 'Failed to submit order. Please try again.')
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f3f4] p-4">
        <div className="w-10 h-10 border-4 border-[#ba181b]/20 border-t-[#ba181b] rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-[#161a1d]/60 uppercase tracking-widest">
          Fetching Menu...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f3f4] p-6 text-center">
        <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-full flex items-center justify-center text-[#ba181b] text-xl mb-4 shadow-sm animate-bounce">
          ⚠️
        </div>
        <h3 className="font-outfit text-lg font-black text-[#0b090a] tracking-tight uppercase mb-1">
          Menu Error
        </h3>
        <p className="text-xs text-[#161a1d]/70 max-w-xs font-semibold leading-relaxed mb-6">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#ba181b] hover:bg-[#a4161a] text-white text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl transition-colors shadow-md shadow-[#ba181b]/10"
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

    return (
      <div className="min-h-screen bg-[#f5f3f4] font-sans antialiased text-[#161a1d] flex flex-col items-center">
        <div className="w-full max-w-[480px] min-h-screen bg-white shadow-xl flex flex-col relative pb-24">
          
          {/* Header */}
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#d3d3d3]/60 px-6 py-4 flex justify-between items-center shadow-sm">
            <div>
              <h1 className="font-outfit text-base font-black text-[#0b090a] tracking-tight">
                Order Tracking
              </h1>
              <span className="text-[10px] uppercase tracking-widest font-black text-[#ba181b] bg-[#ba181b]/10 px-2 py-0.5 rounded mt-0.5 inline-block">
                KOT #{activeOrder.order_number}
              </span>
            </div>
            <button
              onClick={() => setShowTracker(false)}
              className="text-xs font-bold text-[#161a1d]/70 border border-[#d3d3d3] px-3 py-1.5 rounded-lg hover:bg-neutral-50"
            >
              Browse Menu
            </button>
          </header>

          <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
            
            {/* Status Visual Tracker Timeline */}
            <div className="bg-gray-50 border border-[#d3d3d3]/60 rounded-2xl p-5 space-y-6">
              <h3 className="text-[10px] font-black text-[#ba181b] uppercase tracking-widest border-b border-[#d3d3d3]/30 pb-2">
                Order Status Updates
              </h3>

              {isCancelled ? (
                <div className="bg-red-50 text-[#a4161a] p-4 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                  <span>❌</span> Order was cancelled by kitchen staff.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Step 1: Received */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${currentIndex >= 0 ? 'bg-emerald-600 border-emerald-600 text-white shadow' : 'bg-white border-[#d3d3d3] text-neutral-400'}`}>
                        {currentIndex >= 0 ? '✓' : '1'}
                      </div>
                      <div className={`w-0.5 h-10 ${currentIndex > 0 ? 'bg-emerald-600' : 'bg-[#d3d3d3]'}`}></div>
                    </div>
                    <div>
                      <p className={`text-xs font-extrabold ${currentIndex >= 0 ? 'text-[#0b090a]' : 'text-neutral-400'}`}>Order Received</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5 font-semibold">Table order sent to the kitchen monitor</p>
                    </div>
                  </div>

                  {/* Step 2: Preparing */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${currentIndex >= 1 ? 'bg-emerald-600 border-emerald-600 text-white shadow' : 'bg-white border-[#d3d3d3] text-neutral-400'}`}>
                        {currentIndex >= 1 ? '✓' : '2'}
                      </div>
                      <div className={`w-0.5 h-10 ${currentIndex > 1 ? 'bg-emerald-600' : 'bg-[#d3d3d3]'}`}></div>
                    </div>
                    <div>
                      <p className={`text-xs font-extrabold ${currentIndex >= 1 ? 'text-[#0b090a]' : 'text-neutral-400'}`}>In the Kitchen</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5 font-semibold">Chef is actively preparing your dishes</p>
                    </div>
                  </div>

                  {/* Step 3: Ready */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${currentIndex >= 2 ? 'bg-emerald-600 border-emerald-600 text-white shadow' : 'bg-white border-[#d3d3d3] text-neutral-400'}`}>
                        {currentIndex >= 2 ? '✓' : '3'}
                      </div>
                      <div className={`w-0.5 h-10 ${currentIndex > 2 ? 'bg-emerald-600' : 'bg-[#d3d3d3]'}`}></div>
                    </div>
                    <div>
                      <p className={`text-xs font-extrabold ${currentIndex >= 2 ? 'text-[#0b090a]' : 'text-neutral-400'}`}>Dishes Ready</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5 font-semibold">Food is prepared and ready to serve</p>
                    </div>
                  </div>

                  {/* Step 4: Served */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${currentIndex >= 3 ? 'bg-emerald-600 border-emerald-600 text-white shadow' : 'bg-white border-[#d3d3d3] text-neutral-400'}`}>
                        {currentIndex >= 3 ? '✓' : '4'}
                      </div>
                    </div>
                    <div>
                      <p className={`text-xs font-extrabold ${currentIndex >= 3 ? 'text-[#0b090a]' : 'text-neutral-400'}`}>Served</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5 font-semibold">Dishes served. Enjoy your meal!</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Waiter Summon Panel */}
            <div className="space-y-4 pt-6 border-t border-[#d3d3d3]/40">
              {waiterCallActive ? (
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-xs font-bold border border-emerald-100 text-center animate-pulse">
                  🔔 Waiter summoned successfully! A team member is heading to your table.
                </div>
              ) : (
                <button
                  onClick={handleCallWaiter}
                  disabled={loading}
                  className="w-full bg-[#161a1d] hover:bg-black text-white font-black py-4 px-6 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <span>🔔</span> Summon Waiter to Table
                </button>
              )}
            </div>

          </div>

          <footer className="py-6 bg-white border-t border-[#d3d3d3]/30 text-center text-[10px] text-[#b1a7a6] font-bold uppercase tracking-wider">
            A product by Vyuhanam
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
          className="fixed top-2 z-50 max-w-[440px] w-[90%] bg-emerald-600 text-white py-3 px-4 rounded-xl shadow-lg border border-emerald-500/20 flex justify-between items-center cursor-pointer font-bold text-xs animate-bounce"
        >
          <span className="flex items-center gap-2">
            <span>🍲</span> Order #{activeOrder.order_number}: <span className="uppercase">{activeOrder.status}</span>
          </span>
          <span className="underline text-[10px] tracking-wide uppercase">Track Order →</span>
        </div>
      )}

      {/* Phone container wrapper */}
      <div className="w-full max-w-[480px] min-h-screen bg-white shadow-xl flex flex-col relative pb-24">
        
        {/* 1. STICKY HEADER BRANDING */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#d3d3d3]/60 px-6 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="font-outfit text-lg font-black text-[#0b090a] tracking-tight">
              {restaurant?.name || 'Partner Outlet'}
            </h1>
            {table ? (
              <span className="text-[10px] uppercase tracking-widest font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-md mt-0.5 inline-block">
                🟢 {table.table_number}
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-widest font-black text-[#ba181b] bg-[#ba181b]/10 px-2.5 py-0.5 rounded-md mt-0.5 inline-block">
                Storefront Browse
              </span>
            )}
          </div>
          {restaurant?.logo_url ? (
            <img src={restaurant.logo_url} alt="Logo" className="w-10 h-10 object-cover rounded-full border border-[#d3d3d3]" />
          ) : (
            <img src={logoRed} alt="Logo" className="h-6 w-auto object-contain" />
          )}
        </header>

        {/* 2. SEARCH & NAVIGATION SECTION */}
        <div className="px-6 pt-5 pb-3 bg-white space-y-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#b1a7a6] pointer-events-none text-xs">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes..."
              className="w-full pl-9 pr-4 py-2.5 rounded-full border border-[#d3d3d3] bg-white placeholder-[#b1a7a6] text-xs font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-1 focus:ring-[#ba181b] transition-all"
            />
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-none">
            {categories.map((cat) => {
              const isActive = selectedCategoryId === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-black tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
                    isActive
                      ? 'bg-[#161a1d] text-white border-[#161a1d]'
                      : 'bg-[#f5f3f4] text-[#161a1d]/70 hover:bg-[#d3d3d3]/40 border-[#d3d3d3]/40'
                  }`}
                >
                  {cat.name_en}
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. DISH ITEMS LIST CONTAINER */}
        <div className="flex-1 px-6 py-4 space-y-4 bg-gray-50/50">
          <h2 className="text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2 border-b border-[#d3d3d3]/30 pb-1">
            {activeCategory?.name_en || 'Dishes'}
          </h2>

          {filteredItems.length === 0 ? (
            <div className="py-16 text-center">
              <span className="text-2xl">🍲</span>
              <p className="text-xs font-bold text-neutral-400 mt-2 uppercase tracking-wide">No items found</p>
            </div>
          ) : (
            <div className="divide-y divide-[#d3d3d3]/40">
              {filteredItems.map((item) => {
                const qty = cart[item.id] || 0
                return (
                  <div key={item.id} className="py-4.5 flex gap-4 justify-between items-start">
                    
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`border p-0.5 w-4 h-4 flex items-center justify-center shrink-0 ${item.is_veg ? 'border-emerald-600' : 'border-red-600'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`}></div>
                        </div>
                        {item.is_combo && (
                          <span className="bg-[#ba181b]/10 text-[#ba181b] text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                            Combo
                          </span>
                        )}
                      </div>

                      <p className="font-extrabold text-sm text-[#0b090a] leading-tight">
                        {item.name_en}
                      </p>
                      {item.name_hi && (
                        <p className="text-[10px] text-[#b1a7a6] font-bold uppercase tracking-wider">
                          {item.name_hi}
                        </p>
                      )}
                      
                      {item.description_en && (
                        <p className="text-[10px] text-[#161a1d]/60 font-semibold leading-relaxed pr-2">
                          {item.description_en}
                        </p>
                      )}

                      {item.is_combo && item.ComboComponents && (
                        <div className="mt-2 text-[10px] text-neutral-400 font-bold bg-[#f5f3f4] px-2.5 py-1.5 rounded-lg border border-[#d3d3d3]/30 max-w-xs">
                          <p className="uppercase tracking-widest text-[#ba181b] text-[8px] mb-1">Includes:</p>
                          <ul className="space-y-0.5 list-disc pl-3">
                            {item.ComboComponents.map(comp => (
                              <li key={comp.id}>
                                {comp.ComboItem?.quantity}x {comp.name_en}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <p className="font-black text-[#0b090a] text-sm pt-1">
                        ₹{parseFloat(item.price).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex flex-col items-center shrink-0 relative">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name_en}
                          className="w-18 h-18 object-cover rounded-xl border border-[#d3d3d3] shadow-sm mb-2"
                        />
                      ) : (
                        <div className="w-18 h-18 bg-white border border-[#d3d3d3] rounded-xl flex items-center justify-center text-lg shadow-inner mb-2">
                          🍛
                        </div>
                      )}

                      {qty === 0 ? (
                        <button
                          onClick={() => updateCartQuantity(item.id, 1)}
                          className="absolute -bottom-2 bg-white border border-[#ba181b] hover:bg-[#ba181b]/5 text-[#ba181b] font-black text-[10px] uppercase tracking-wider px-5 py-1.5 rounded-full shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer"
                        >
                          Add
                        </button>
                      ) : (
                        <div className="absolute -bottom-2 bg-[#ba181b] text-white flex items-center justify-between font-black text-[11px] w-20 py-1.5 px-2.5 rounded-full shadow-md">
                          <button
                            onClick={() => updateCartQuantity(item.id, -1)}
                            className="w-4 h-4 flex items-center justify-center hover:opacity-85 text-xs select-none cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-black font-mono select-none">{qty}</span>
                          <button
                            onClick={() => updateCartQuantity(item.id, 1)}
                            className="w-4 h-4 flex items-center justify-center hover:opacity-85 text-xs select-none cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                )
              })}
            </div>
          )}
        </div>

        <footer className="py-6 bg-white border-t border-[#d3d3d3]/30 text-center text-[10px] text-[#b1a7a6] font-bold uppercase tracking-wider mt-4">
          A product by Vyuhanam
        </footer>

        {/* 4. STICKY FLOATING CART SUMMARY BAR */}
        {cartItemsCount > 0 && (
          <div className="fixed bottom-0 max-w-[480px] w-full bg-[#ba181b] text-white py-4 px-6 rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] flex justify-between items-center z-40 animate-fade-in-up font-outfit">
            <div>
              <p className="text-[9px] uppercase tracking-widest font-black text-red-100">Your Selection</p>
              <p className="text-sm font-black mt-0.5">{cartItemsCount} item{cartItemsCount > 1 ? 's' : ''} added · ₹{cartSubtotal.toFixed(2)}</p>
            </div>
            <button
              onClick={() => setIsCartModalOpen(true)}
              className="bg-white hover:bg-neutral-50 active:bg-neutral-100 text-[#ba181b] text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl shadow transition-colors cursor-pointer"
            >
              View Order →
            </button>
          </div>
        )}

      </div>

      {/* F. CART REVIEW MODAL OVERLAY */}
      {isCartModalOpen && (
        <div className="fixed inset-0 bg-[#0b090a]/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl border-t border-[#d3d3d3] w-full max-w-[480px] p-6 shadow-2xl animate-fade-in-up max-h-[85vh] flex flex-col justify-between">
            
            {!showCheckoutForm ? (
              <>
                <div>
                  <div className="flex justify-between items-center mb-5 border-b border-[#d3d3d3]/30 pb-4">
                    <h3 className="font-outfit text-base font-black text-[#0b090a] uppercase tracking-wider flex items-center gap-2">
                      <span>🛒</span> Your Selected Order
                    </h3>
                    <button
                      onClick={() => setIsCartModalOpen(false)}
                      className="text-[#161a1d]/60 hover:text-[#ba181b] text-sm font-bold transition-all"
                    >
                      Close
                    </button>
                  </div>

                  <div className="overflow-y-auto divide-y divide-[#d3d3d3]/30 pr-1 space-y-1 max-h-[45vh]">
                    {Object.entries(cart).map(([itemId, qty]) => {
                      const item = findItemById(itemId)
                      if (!item) return null
                      return (
                        <div key={itemId} className="py-3 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-[#0b090a]">{item.name_en}</p>
                            <p className="text-[10px] text-neutral-500 font-bold mt-0.5 font-mono">₹{parseFloat(item.price).toFixed(2)} x {qty}</p>
                          </div>
                          
                          <div className="bg-[#ba181b] text-white flex items-center justify-between font-black text-[10px] w-18 py-1 px-2 rounded-full">
                            <button
                              onClick={() => updateCartQuantity(item.id, -1)}
                              className="w-3.5 h-3.5 flex items-center justify-center text-xs cursor-pointer select-none"
                            >
                              -
                            </button>
                            <span className="font-bold font-mono">{qty}</span>
                            <button
                              onClick={() => updateCartQuantity(item.id, 1)}
                              className="w-3.5 h-3.5 flex items-center justify-center text-xs cursor-pointer select-none"
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
                        className="flex-1 px-3 py-2 border border-[#d3d3d3] rounded-lg text-xs font-mono font-bold uppercase tracking-wider focus:outline-none focus:border-[#ba181b]"
                      />
                      <button
                        type="submit"
                        disabled={promoLoading || !promoCode.trim()}
                        className="bg-[#161a1d] hover:bg-black text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {promoLoading ? 'Checking...' : 'Apply'}
                      </button>
                    </form>

                    {promoError && (
                      <p className="text-[10px] text-[#ba181b] font-bold">
                        ⚠️ {promoError}
                      </p>
                    )}

                    {appliedPromo && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 flex justify-between items-center text-xs text-emerald-800 font-bold">
                        <span>🎉 Code "{promoCode.toUpperCase()}" Applied!</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedPromo(null)
                            setPromoCode('')
                          }}
                          className="text-emerald-700 hover:text-emerald-950 font-black text-xs px-1"
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
                    <span className="font-black text-[#0b090a] font-mono">₹{cartSubtotal.toFixed(2)}</span>
                  </div>

                  {appliedPromo && (
                    <div className="flex justify-between items-center text-xs text-emerald-700 font-bold">
                      <span className="uppercase tracking-wider text-[10px]">Coupon Discount</span>
                      <span className="font-mono">- ₹{parseFloat(appliedPromo.discount_amount).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm border-t border-dashed border-[#d3d3d3] pt-2.5">
                    <span className="font-bold text-[#161a1d] uppercase tracking-wider text-[10px]">Total Billed</span>
                    <span className="font-black text-[#ba181b] font-mono text-base">
                      ₹{appliedPromo ? parseFloat(appliedPromo.total_amount).toFixed(2) : cartSubtotal.toFixed(2)}
                    </span>
                  </div>

                  {table ? (
                    <button
                      onClick={() => setShowCheckoutForm(true)}
                      className="w-full bg-[#ba181b] hover:bg-[#a4161a] text-white font-black py-4 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer text-center shadow-lg shadow-[#ba181b]/10"
                    >
                      Confirm Guest Info
                    </button>
                  ) : (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[10px] text-[#ba181b] font-bold text-center uppercase tracking-wider">
                      ⚠️ Ordering is restricted to table scans
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
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all font-sans"
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
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all resize-none font-sans"
                    />
                  </div>
                </div>

                <div className="border-t border-[#d3d3d3]/45 pt-5 mt-6 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#161a1d]/60 uppercase tracking-wider text-[10px]">Subtotal</span>
                    <span className="font-bold text-[#0b090a] font-mono">₹{cartSubtotal.toFixed(2)}</span>
                  </div>

                  {appliedPromo && (
                    <div className="flex justify-between items-center text-xs text-emerald-700 font-bold">
                      <span className="uppercase tracking-wider text-[10px]">Coupon Discount</span>
                      <span className="font-mono">- ₹{parseFloat(appliedPromo.discount_amount).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm border-t border-dashed border-[#d3d3d3] pt-2.5">
                    <span className="font-bold text-[#161a1d] uppercase tracking-wider text-[10px]">Total Amount Billed</span>
                    <span className="font-black text-emerald-700 font-mono text-base">
                      ₹{appliedPromo ? parseFloat(appliedPromo.total_amount).toFixed(2) : cartSubtotal.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer text-center shadow-lg shadow-emerald-600/10"
                  >
                    Send Order to Kitchen
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
