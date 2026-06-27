import { useState } from 'react'
import { Plus, Minus, Trash2, Search, ShoppingCart, Check, AlertCircle, UtensilsCrossed, Package, Printer, X, Receipt } from 'lucide-react'
import api from '../api'

const IconPrint = () => <Printer size={14} />
const IconX = () => <X size={18} />

/* ── small veg/non-veg dot ──────────────────────────────────────── */
function VegDot({ isVeg }) {
  return (
    <span className={`inline-flex w-3.5 h-3.5 border-2 items-center justify-center shrink-0 ${isVeg ? 'border-[#2d6a4f]' : 'border-[#ba181b]'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-[#2d6a4f]' : 'bg-[#ba181b]'}`} />
    </span>
  )
}

/* ── qty stepper used in cart rows ──────────────────────────────── */
function QtyStepper({ qty, onMinus, onPlus, size = 'md' }) {
  const big = size === 'lg'
  return (
    <div className={`flex items-center bg-[#ba181b] text-white rounded-none gap-0 overflow-hidden font-mono font-bold select-none ${big ? 'text-base' : 'text-sm'}`}>
      <button type="button" onClick={onMinus}
        className={`flex items-center justify-center hover:bg-[#a4161a] transition-colors cursor-pointer ${big ? 'w-9 h-9' : 'w-7 h-7'}`}>
        <Minus size={big ? 14 : 12} strokeWidth={3} />
      </button>
      <span className={`px-2.5 ${big ? 'text-base' : 'text-sm'}`}>{qty}</span>
      <button type="button" onClick={onPlus}
        className={`flex items-center justify-center hover:bg-[#a4161a] transition-colors cursor-pointer ${big ? 'w-9 h-9' : 'w-7 h-7'}`}>
        <Plus size={big ? 14 : 12} strokeWidth={3} />
      </button>
    </div>
  )
}

export default function POSWorkspace({ categories, menuItems, tables, fetchOrders, user, restaurant }) {
  /* ── menu browser state ─────────────────────────────────────── */
  const [searchQuery, setSearchQuery]       = useState('')
  const [selectedCatId, setSelectedCatId]   = useState(categories[0]?.id ?? 'ALL')

  /* ── cart: { [itemId]: { name, price, quantity, note } } ────── */
  const [cart, setCart] = useState({})

  /* ── checkout form state ─────────────────────────────────────── */
  const [customerName,  setCustomerName]  = useState('')
  const [orderType,     setOrderType]     = useState('DINE_IN')
  const [tableId,       setTableId]       = useState('')
  const [specialNote,   setSpecialNote]   = useState('')
  const [promoCode,     setPromoCode]     = useState('')
  const [paymentStatus, setPaymentStatus] = useState('UNPAID')
  const [orderStatus,   setOrderStatus]   = useState('PENDING')

  /* ── ui & mobile states ───────────────────────────────────────── */
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const [step,           setStep]           = useState(1)
  const [billPreviewOrder, setBillPreviewOrder] = useState(null)

  /* ── ui state ─────────────────────────────────────────────────── */
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  /* ── cart helpers ─────────────────────────────────────────────── */
  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev[item.id]
      return {
        ...prev,
        [item.id]: {
          name: item.name_en,
          price: parseFloat(item.price),
          quantity: ex ? ex.quantity + 1 : 1,
          note: ex?.note ?? '',
          is_combo: item.is_combo,
          ComboComponents: item.ComboComponents
        }
      }
    })
    setStep(1)
  }

  const changeQty = (id, delta) => setCart(prev => {
    const ex = prev[id]; if (!ex) return prev
    const q = ex.quantity + delta
    const next = { ...prev }
    if (q <= 0) delete next[id]; else next[id] = { ...ex, quantity: q }
    return next
  })

  const setNote = (id, note) => setCart(prev => {
    const ex = prev[id]; if (!ex) return prev
    return { ...prev, [id]: { ...ex, note } }
  })

  const removeFromCart = (id) => setCart(prev => { const n = { ...prev }; delete n[id]; return n })

  const clearCart = () => {
    setCart({}); setCustomerName(''); setTableId(''); setSpecialNote('')
    setPromoCode(''); setPaymentStatus('UNPAID'); setOrderStatus('PENDING')
    setStep(1)
  }

  /* ── derived ─────────────────────────────────────────────────── */
  const cartEntries  = Object.entries(cart)
  const cartCount    = cartEntries.reduce((s, [, v]) => s + v.quantity, 0)
  const cartSubtotal = cartEntries.reduce((s, [, v]) => s + v.price * v.quantity, 0)

  const filteredItems = menuItems.filter(item => {
    if (!item.is_available) return false
    if (selectedCatId !== 'ALL' && item.category_id !== selectedCatId) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return item.name_en?.toLowerCase().includes(q) || item.name_hi?.toLowerCase().includes(q) || item.description_en?.toLowerCase().includes(q)
    }
    return true
  })

  const activeTables = tables.filter(t => t.is_active)

  /* ── submit ─────────────────────────────────────────────────── */
  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    if (cartEntries.length === 0) { setError('Add at least one item to the cart.'); return }
    if (orderType === 'DINE_IN' && !tableId) { setError('Select a table for Dine-In.'); return }
    setLoading(true); setError(''); setSuccessMsg('')
    try {
      const response = await api.post('/api/orders/counter', {
        customer_name:  customerName.trim() || undefined,
        order_type:     orderType,
        table_id:       orderType === 'DINE_IN' ? tableId : null,
        special_note:   specialNote.trim() || undefined,
        promo_code:     promoCode.trim().toUpperCase() || undefined,
        payment_status: 'PAID',
        status:         'PENDING',
        items: cartEntries.map(([id, v]) => ({ menu_item_id: id, quantity: v.quantity, note: v.note.trim() || undefined }))
      })
      
      const createdOrder = response?.data || response
      const tableObj = tables.find(t => t.id === (orderType === 'DINE_IN' ? tableId : null))
      const augmentedOrder = {
        order_number: createdOrder?.order_number || Math.floor(100000 + Math.random() * 900000),
        customer_name: customerName.trim() || 'Counter Customer',
        created_at: new Date().toISOString(),
        order_type: orderType,
        RestaurantTable: tableObj ? { table_number: tableObj.table_number } : null,
        total_amount: cartSubtotal,
        OrderItems: cartEntries.map(([id, v]) => ({
          id: id,
          quantity: v.quantity,
          total_price: v.price * v.quantity,
          MenuItem: {
            name_en: v.name,
            is_combo: v.is_combo,
            ComboComponents: v.ComboComponents
          }
        }))
      }

      setBillPreviewOrder(augmentedOrder)
      clearCart()
      setMobileCartOpen(false)
      setSuccessMsg('✓ Order placed!')
      if (fetchOrders) fetchOrders()
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      setError(err.message || 'Failed to place order.')
    } finally {
      setLoading(false)
    }
  }

  /* ── RENDER ─────────────────────────────────────────────────── */
  return (
    <div className="flex flex-1 h-full overflow-hidden relative" style={{ backgroundColor: 'var(--bg-page)' }}>

      {/* ── COLUMN A — Category Sidebar (fixed, scrollable) ── */}
      <div className="hidden lg:flex w-40 bg-white border-r border-[#e8e8e8] flex flex-col shrink-0 overflow-y-auto">
        <div className="px-4 py-3 border-b border-[#e8e8e8]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#b1a7a6]">Categories</p>
        </div>
        <div className="flex flex-col py-1">
          <button
            onClick={() => setSelectedCatId('ALL')}
            className={`text-left px-4 py-3 text-sm font-semibold transition-all cursor-pointer border-l-[3px] ${
              selectedCatId === 'ALL'
                ? 'border-[#ba181b] text-[#ba181b] bg-[#ba181b]/5 font-bold'
                : 'border-transparent text-[#161a1d]/70 hover:text-[#161a1d] hover:bg-[#f5f3f4]'
            }`}
          >
            All Items
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`text-left px-4 py-3 text-sm font-semibold transition-all cursor-pointer border-l-[3px] ${
                selectedCatId === cat.id
                  ? 'border-[#ba181b] text-[#ba181b] bg-[#ba181b]/5 font-bold'
                  : 'border-transparent text-[#161a1d]/70 hover:text-[#161a1d] hover:bg-[#f5f3f4]'
              }`}
            >
              {cat.name_en}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          COLUMN B — Menu Grid (fills remaining space, scrollable)
      ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Horizontal scrollable category bar for mobile/tablet */}
        <div
          className="lg:hidden flex items-center gap-2 overflow-x-auto px-4 py-2.5 bg-white border-b border-[#e8e8e8] shrink-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <button
            type="button"
            onClick={() => setSelectedCatId('ALL')}
            className={`px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all border ${
              selectedCatId === 'ALL'
                ? 'bg-[#ba181b] text-white border-[#ba181b]'
                : 'bg-[#f5f3f4] text-[#161a1d]/70 border-[#ebebeb] hover:bg-[#ebebeb]'
            }`}
          >
            All Items
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCatId(cat.id)}
              className={`px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCatId === cat.id
                  ? 'bg-[#ba181b] text-white border-[#ba181b]'
                  : 'bg-[#f5f3f4] text-[#161a1d]/70 border-[#ebebeb] hover:bg-[#ebebeb]'
              }`}
            >
              {cat.name_en}
            </button>
          ))}
        </div>

        {/* ── Search bar ─────────────────────────────────────── */}
        <div className="bg-white border-b border-[#e8e8e8] px-4 py-2.5 shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b1a7a6] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search dishes..."
              className="w-full pl-9 pr-4 py-2 border border-[#d3d3d3] text-sm bg-white placeholder-[#b1a7a6] focus:outline-none focus:border-[#ba181b] focus:ring-1 focus:ring-[#ba181b] transition-all"
            />
          </div>
        </div>

        {/* ── Item tiles grid ────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-3">
              <UtensilsCrossed size={40} className="opacity-30" />
              <p className="text-base font-semibold">No items found</p>
              <p className="text-sm">Try a different category or search term</p>
            </div>
          ) : (
            <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))' }}>
              {filteredItems.map(item => {
                const inCart   = cart[item.id]
                const hasQty   = !!inCart
                return (
                  <div
                    key={item.id}
                    className={`bg-white border flex flex-col overflow-hidden transition-all cursor-default ${
                      hasQty ? 'border-[#ba181b] shadow-[0_0_0_1px_rgba(186,24,27,0.15)]' : 'border-[#e0e0e0] hover:border-[#d3d3d3] hover:shadow-sm'
                    }`}
                  >
                    {/* Tile image or placeholder */}
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name_en} className="w-full h-20 md:h-24 object-cover" />
                    ) : (
                      <div className="w-full h-20 md:h-24 bg-[#f5f3f4] border-b border-[#e8e8e8] flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#d3d3d3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                      </div>
                    )}

                    <div className="p-2.5 flex flex-col gap-1.5 flex-1">
                      <div className="flex items-start gap-1.5">
                        <VegDot isVeg={item.is_veg} />
                        <p className="text-xs md:text-sm font-bold text-[#0b090a] leading-snug flex-1">{item.name_en}</p>
                      </div>
                      {item.is_combo && item.ComboComponents && (
                        <div className="text-[10px] text-[#b1a7a6] bg-[#f5f3f4] p-1.5 border border-[#e8e8e8] rounded">
                          <p className="uppercase tracking-wider text-[#ba181b] font-bold mb-0.5" style={{ fontSize: '9px' }}>Includes:</p>
                          <ul className="space-y-0.5 list-disc pl-3">
                            {item.ComboComponents.map(comp => (
                              <li key={comp.id}>
                                {comp.ComboItem?.quantity || comp.quantity || 1}x {comp.name_en}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="text-sm md:text-base font-black text-[#161a1d] font-mono">₹{parseFloat(item.price).toFixed(0)}</p>

                      {hasQty ? (
                        <div className="flex items-center justify-between mt-auto pt-1">
                          <QtyStepper
                            qty={inCart.quantity}
                            onMinus={() => changeQty(item.id, -1)}
                            onPlus={() => changeQty(item.id, 1)}
                            size="md"
                          />
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 text-[#b1a7a6] hover:text-[#ba181b] hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="mt-auto w-full py-2 border border-[#ba181b] text-[#ba181b] hover:bg-[#ba181b] hover:text-white text-xs md:text-sm font-bold cursor-pointer transition-all flex items-center justify-center gap-1"
                        >
                          <Plus size={13} strokeWidth={2.5} /> Add
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Sidebar backdrop for mobile ── */}
      {mobileCartOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/45 z-40 transition-opacity"
          onClick={() => setMobileCartOpen(false)}
        />
      )}

      {/* ══════════════════════════════════════════════════════════
          COLUMN C — Checkout Panel (responsive drawer, wider)
      ══════════════════════════════════════════════════════════ */}
      <div className={`
        fixed inset-y-0 right-0 z-40 w-full sm:w-[440px] lg:w-[440px] xl:w-[480px] bg-white border-l border-[#e8e8e8] flex flex-col shrink-0 overflow-hidden transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0
        ${mobileCartOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>

        {/* ── Panel header ──────────────────────────────────── */}
        <div className="px-5 py-3.5 border-b border-[#e8e8e8] bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-[#ba181b]" />
            <h2 className="text-sm font-black text-[#0b090a] uppercase tracking-wider">Order</h2>
          </div>
          <div className="flex items-center gap-3">
            {cartCount > 0 && (
              <>
                <span className="text-xs font-semibold text-[#b1a7a6]">{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-[#ba181b] hover:text-[#a4161a] font-bold cursor-pointer"
                >
                  Clear
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setMobileCartOpen(false)}
              className="lg:hidden text-xs font-bold text-gray-500 border border-gray-300 hover:bg-gray-50 px-2.5 py-1 rounded cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Step Progress Indicator */}
        {cartEntries.length > 0 && (
          <div className="px-5 py-2.5 bg-[#f5f3f4] border-b border-[#e8e8e8] flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-500 shrink-0">
            <span className={step === 1 ? 'text-[#ba181b]' : 'text-gray-400'}>1. Cart</span>
            <span className="text-gray-300 font-normal">/</span>
            <span className={step === 2 ? 'text-[#ba181b]' : 'text-gray-400'}>2. Details</span>
            <span className="text-gray-300 font-normal">/</span>
            <span className={step === 3 ? 'text-[#ba181b]' : 'text-gray-400'}>3. Payment</span>
          </div>
        )}

        {/* ── Alert messages ────────────────────────────────── */}
        {(error || successMsg) && (
          <div className={`mx-4 mt-3 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${
            error ? 'bg-red-50 border border-red-200 text-[#ba181b]' : 'bg-green-50 border border-green-200 text-green-800'
          }`}>
            {error ? <AlertCircle size={16} className="shrink-0" /> : <Check size={16} className="shrink-0" />}
            {error || successMsg}
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="flex-1 flex flex-col overflow-hidden">
          {/* Step 1: Cart Items List */}
          {step === 1 && (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {cartEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 py-16">
                    <ShoppingCart size={42} className="opacity-25" />
                    <p className="text-base font-semibold">Cart is empty</p>
                    <p className="text-sm text-center">Tap <strong>Add</strong> on any dish<br/>to start an order</p>
                  </div>
                ) : (
                  cartEntries.map(([id, item]) => (
                    <div key={id} className="border border-[#ebebeb] rounded-xl p-3 space-y-2 bg-[#fafafa]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 leading-tight">{item.name}</p>
                          <p className="text-xs text-[#ba181b] font-black font-mono mt-0.5">
                            ₹{item.price.toFixed(0)} × {item.quantity} = <span className="text-gray-700">₹{(item.price * item.quantity).toFixed(0)}</span>
                          </p>
                          {item.is_combo && item.ComboComponents && (
                            <div className="mt-1 text-[10px] text-gray-500 bg-white p-1.5 border border-gray-200 rounded">
                              <p className="uppercase tracking-wider text-[#ba181b] font-bold mb-0.5" style={{ fontSize: '9px' }}>Includes:</p>
                              <ul className="space-y-0.5 list-disc pl-3">
                                {item.ComboComponents.map(comp => (
                                  <li key={comp.id}>
                                    {comp.ComboItem?.quantity || comp.quantity || 1}x {comp.name_en}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <QtyStepper qty={item.quantity} onMinus={() => changeQty(id, -1)} onPlus={() => changeQty(id, 1)} size="sm" />
                          <button
                            type="button"
                            onClick={() => removeFromCart(id)}
                            className="p-1.5 rounded text-gray-400 hover:text-[#ba181b] hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={item.note}
                        onChange={e => setNote(id, e.target.value)}
                        placeholder="Note for kitchen (e.g. no onions)"
                        className="w-full px-3 py-1.5 border border-[#d3d3d3] rounded-lg text-xs placeholder-gray-400 focus:outline-none focus:border-[#ba181b] bg-white"
                      />
                    </div>
                  ))
                )}
              </div>

              {cartEntries.length > 0 && (
                <div className="border-t border-[#e8e8e8] px-5 py-4 space-y-3 shrink-0 bg-white">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Subtotal</span>
                    <span className="text-2xl font-black text-[#ba181b] font-mono">₹{cartSubtotal.toFixed(0)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full bg-[#161a1d] hover:bg-black text-white font-black py-4 rounded-lg text-base uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md"
                  >
                    Next: Customer & Table →
                  </button>
                </div>
              )}
            </>
          )}

          {/* Step 2: Customer Name & Table Selection */}
          {step === 2 && (
            <>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                <div>
                  <p className="text-sm font-bold text-gray-800 mb-1">Step 2: Table & Customer</p>
                  <p className="text-xs text-gray-400">Specify dining table and customer identity.</p>
                </div>

                {/* Customer name */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#b1a7a6] mb-1.5">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Customer name (optional)"
                    className="w-full px-4 py-3 border border-[#d3d3d3] rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-[#ba181b] bg-white"
                  />
                </div>

                {/* Order Type */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#b1a7a6] mb-1.5">Order Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderType('DINE_IN')}
                      className={`py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                        orderType === 'DINE_IN'
                          ? 'bg-[#161a1d] text-white border-[#161a1d]'
                          : 'bg-white text-gray-600 border-[#d3d3d3] hover:bg-gray-50'
                      }`}
                    >
                      <UtensilsCrossed size={15} /> Dine In
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOrderType('PARCEL'); setTableId('') }}
                      className={`py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                        orderType === 'PARCEL'
                          ? 'bg-[#161a1d] text-white border-[#161a1d]'
                          : 'bg-white text-gray-600 border-[#d3d3d3] hover:bg-gray-50'
                      }`}
                    >
                      <Package size={15} /> Parcel
                    </button>
                  </div>
                </div>

                {/* Table grid (only for DINE_IN) */}
                {orderType === 'DINE_IN' && (
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#b1a7a6] mb-1.5">Select Table</label>
                    {activeTables.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No active tables configured.</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-1.5">
                        {activeTables.map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setTableId(t.id)}
                            className={`py-2 text-sm font-bold border transition-all cursor-pointer ${
                              tableId === t.id
                                ? 'bg-[#ba181b] text-white border-[#ba181b]'
                                : 'bg-white text-[#161a1d] border-[#d3d3d3] hover:border-[#ba181b] hover:text-[#ba181b]'
                            }`}
                          >
                            {t.table_number}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-[#e8e8e8] px-5 py-4 grid grid-cols-2 gap-2 bg-white shrink-0">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-4 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (orderType === 'DINE_IN' && !tableId) {
                      setError('Select a table for Dine-In.');
                      return;
                    }
                    setError('');
                    setStep(3);
                  }}
                  className="w-full bg-[#161a1d] hover:bg-black text-white font-black py-4 rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Next: Payment →
                </button>
              </div>
            </>
          )}

          {/* Step 3: Billing & Confirmation */}
          {step === 3 && (
            <>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                <div>
                  <p className="text-sm font-bold text-gray-800 mb-1">Step 3: Billing & Notes</p>
                  <p className="text-xs text-gray-400">Add order details and complete transaction.</p>
                </div>

                {/* Kitchen note + coupon row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#b1a7a6] mb-1.5">Kitchen Note</label>
                    <input
                      type="text"
                      value={specialNote}
                      onChange={e => setSpecialNote(e.target.value)}
                      placeholder="Kitchen note..."
                      className="w-full px-3 py-2.5 border border-[#d3d3d3] rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-[#ba181b] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#b1a7a6] mb-1.5">Coupon Code</label>
                    <input
                      type="text"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value)}
                      placeholder="Coupon"
                      className="w-full px-3 py-2.5 border border-[#d3d3d3] rounded-lg text-sm placeholder-gray-400 uppercase font-mono focus:outline-none focus:border-[#ba181b] bg-white"
                    />
                  </div>
                </div>

                {/* Automatic payment banner */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-emerald-800">Auto-Paid Order</p>
                    <p className="text-[11px] text-emerald-700/80 mt-0.5">Counter orders are automatically marked as PAID. A thermal print invoice will open on submit.</p>
                  </div>
                </div>
              </div>

              {/* Total + CTA */}
              <div className="border-t border-[#e8e8e8] px-5 py-4 space-y-3 bg-white shrink-0">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Total</span>
                  <span className="text-2xl font-black text-[#ba181b] font-mono">₹{cartSubtotal.toFixed(0)}</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="col-span-1 py-4 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="col-span-2 bg-[#ba181b] hover:bg-[#a4161a] active:bg-[#660708] text-white font-black py-4 rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2.5 shadow-md disabled:opacity-60"
                  >
                    <ShoppingCart size={16} />
                    {loading ? 'Placing…' : 'Place & Print'}
                  </button>
                </div>
              </div>
            </>
          )}
        </form>
      </div>

      {/* ── Thermal Bill Preview ────────────────────────────────────── */}
      {billPreviewOrder && (
        <div className="dd-modal-backdrop" style={{ zIndex: 60 }}>
          <div className="dd-modal max-w-xs dd-fade-in" style={{ maxHeight: '90vh' }}>
            <div className="dd-card-header">
              <h4 className="font-semibold text-gray-900">Bill Preview</h4>
              <button onClick={() => setBillPreviewOrder(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer"><IconX /></button>
            </div>
            <div className="p-5 bg-gray-100 overflow-y-auto flex justify-center">
              <div className="bg-white p-5 shadow-sm" id="bill-print-area" style={{ width: '80mm', fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.5', color: '#000' }}>
                <div className="text-center border-b border-dashed border-black pb-3 mb-3 flex flex-col items-center">
                  {restaurant?.logo_url && (
                    <img
                      src={restaurant.logo_url}
                      alt="Logo"
                      className="w-12 h-12 object-cover rounded mb-2 border border-black"
                    />
                  )}
                  <h2 className="text-sm font-bold uppercase mb-0.5">{restaurant?.name || user?.name || 'Restaurant'}</h2>
                  <p className="text-[10px]">TAX INVOICE</p>
                </div>
                <div className="mb-3 space-y-0.5 text-xs">
                  <p>Order: #{billPreviewOrder.order_number.toString().padStart(6, '0')}</p>
                  <p>
                    {billPreviewOrder.order_type === 'PARCEL' || billPreviewOrder.order_type === 'TAKEAWAY'
                      ? 'Type: Parcel'
                      : `Table: ${billPreviewOrder.RestaurantTable?.table_number || 'N/A'}`}
                  </p>
                  <p>Guest: {billPreviewOrder.customer_name}</p>
                  <p>Date: {new Date(billPreviewOrder.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}</p>
                </div>
                <div className="border-t border-b border-dashed border-black py-2 mb-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-dashed border-black">
                        <th className="pb-1 font-normal text-left">Item</th>
                        <th className="pb-1 font-normal text-center w-8">Qty</th>
                        <th className="pb-1 font-normal text-right w-12">Amt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billPreviewOrder.OrderItems?.map(item => (
                        <tr key={item.id}>
                          <td className="py-0.5 pr-2 break-words">
                            <div>{item.MenuItem?.name_en}</div>
                            {item.MenuItem?.is_combo && item.MenuItem?.ComboComponents && (
                              <div className="text-[10px] text-gray-500 pl-2">
                                {item.MenuItem.ComboComponents.map(comp => (
                                  <div key={comp.id}>
                                    - {comp.ComboItem?.quantity || comp.quantity || 1}x {comp.name_en}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-0.5 text-center align-top">{item.quantity}</td>
                          <td className="py-0.5 text-right font-mono align-top">₹{parseFloat(item.total_price).toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-between font-bold text-sm mb-4">
                  <span>TOTAL</span>
                  <span>₹{parseFloat(billPreviewOrder.total_amount).toFixed(0)}</span>
                </div>
                <div className="text-center text-xs border-t border-dashed border-black pt-3">
                  <p>Thank you for dining with us!</p>
                  <p className="text-gray-500 mt-0.5">Powered by DineDash</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white border-t border-gray-200">
              <button
                onClick={async () => {
                  try {
                    if (!('serial' in navigator)) {
                      alert('Web Serial is not supported in this browser. Please use Chrome or Edge.')
                      return
                    }
                    const typeLabel = billPreviewOrder.order_type === 'PARCEL' || billPreviewOrder.order_type === 'TAKEAWAY' ? 'Type: Parcel' : `Table: ${billPreviewOrder.RestaurantTable?.table_number || 'N/A'}`
                    const text = `${restaurant?.name || user?.name || 'Restaurant'}\nTAX INVOICE\n--------------------------------\nOrder: ${billPreviewOrder.order_number.toString().padStart(6, '0')}\n${typeLabel}\nGuest: ${billPreviewOrder.customer_name}\n--------------------------------\nItem                Qty      Amt\n--------------------------------\n${billPreviewOrder.OrderItems?.map(item => {
                      const name = (item.MenuItem?.name_en || '').padEnd(20, ' ').substring(0, 20)
                      const qty = item.quantity.toString().padStart(3, ' ')
                      const amt = parseFloat(item.total_price).toFixed(0).padStart(7, ' ')
                      let line = `${name}${qty}${amt}`
                      if (item.MenuItem?.is_combo && item.MenuItem?.ComboComponents) {
                        const comboLines = item.MenuItem.ComboComponents.map(comp => {
                          const compQty = (comp.ComboItem?.quantity || comp.quantity || 1) * item.quantity
                          const compLabel = `  - ${compQty}x ${comp.name_en}`
                          return compLabel.padEnd(30, ' ').substring(0, 30)
                        }).join('\n')
                        if (comboLines) {
                          line += `\n${comboLines}`
                        }
                      }
                      return line
                    }).join('\n') || ''}\n--------------------------------\nTOTAL: ${' '.repeat(14)}Rs.${parseFloat(billPreviewOrder.total_amount).toFixed(0)}\n--------------------------------\nThank you for dining with us!\n`
                    let printerPort = window.__printerPort
                    if (!printerPort) {
                      const ports = await navigator.serial.getPorts()
                      printerPort = ports.length > 0 ? ports[0] : await navigator.serial.requestPort()
                      window.__printerPort = printerPort
                    }
                    if (!printerPort.writable) {
                      await printerPort.open({ baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none', flowControl: 'none', bufferSize: 4096 })
                      try { await printerPort.setSignals({ dataTerminalReady: true, requestToSend: true }) } catch (e) { console.warn('DTR/RTS:', e) }
                    }
                    const writer = printerPort.writable.getWriter()
                    const encoder = new TextEncoder()
                    const formatted = text.replace(/\n/g, '\r\n') + '\r\n\r\n\r\n\r\n\r\n'
                    await writer.write(new Uint8Array([0x1b, 0x40]))
                    await writer.write(new Uint8Array([0x1b, 0x61, 0]))
                    await writer.write(new Uint8Array([0x1b, 0x45, 1])) // ESC E 1 - Enable bold text for darker print
                    await writer.write(encoder.encode(formatted))
                    await writer.write(new Uint8Array([0x1b, 0x45, 0])) // ESC E 0 - Disable bold text
                    writer.releaseLock()
                  } catch (error) {
                    alert('Print failed: ' + error.message)
                  }
                }}
                className="w-full dd-btn-primary justify-center py-3 flex items-center gap-2"
              >
                <IconPrint /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Button (mobile/tablet only) */}
      <button
        type="button"
        onClick={() => setMobileCartOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-[#ba181b] hover:bg-[#a4161a] active:bg-[#660708] text-white p-4 shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer rounded-full"
      >
        <ShoppingCart size={22} />
        {cartCount > 0 && (
          <span className="bg-white text-[#ba181b] text-xs font-black min-w-5 h-5 px-1 rounded-full flex items-center justify-center font-mono">
            {cartCount}
          </span>
        )}
      </button>

    </div>
  )
}
