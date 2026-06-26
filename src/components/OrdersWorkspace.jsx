import { useState } from 'react'
import { RefreshCw, Bell, Printer, Check, Eye, X, Receipt } from 'lucide-react'

// ── SVG Icons replaced by Lucide ─────────────────────────────────────
const IconRefresh = () => <RefreshCw size={14} />
const IconBell = () => <Bell size={14} />
const IconPrint = () => <Printer size={14} />
const IconCheck = () => <Check size={14} />
const IconEye = () => <Eye size={14} />
const IconX = () => <X size={18} />
const IconReceipt = () => <Receipt size={36} className="text-gray-300" />

const STATUS_FILTERS = [
  { key: 'ALL', label: 'All Orders' },
  { key: 'PENDING', label: 'New' },
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'READY', label: 'Ready' },
  { key: 'SERVED', label: 'Served' },
  { key: 'CANCELLED', label: 'Cancelled' },
]

const statusBadgeClass = (status) => {
  switch (status) {
    case 'PENDING':   return 'dd-badge dd-badge-pending'
    case 'PREPARING': return 'dd-badge dd-badge-preparing'
    case 'READY':     return 'dd-badge dd-badge-ready'
    case 'SERVED':    return 'dd-badge dd-badge-served'
    case 'CANCELLED': return 'dd-badge dd-badge-cancelled'
    default:          return 'dd-badge dd-badge-pending'
  }
}

const statusLabel = (status) => {
  if (status === 'PENDING') return 'New'
  return status.charAt(0) + status.slice(1).toLowerCase()
}

export default function OrdersWorkspace({ orders, fetchOrders, waiterCalls, setWaiterCalls, user, restaurant }) {
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderFilter, setOrderFilter] = useState('ALL')
  const [orderDateFilter, setOrderDateFilter] = useState('')
  const [orderTableFilter, setOrderTableFilter] = useState('ALL')
  const [billPreviewOrder, setBillPreviewOrder] = useState(null)

  const getMinutesAgo = (createdAt) => {
    const diffMs = new Date() - new Date(createdAt)
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins <= 0) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    const hrs = (diffMins / 60).toFixed(1)
    return `${hrs} hrs ago`
  }

  const handleUpdateOrderStatus = async (orderId, targetStatus) => {
    try {
      const api = (await import('../api')).default
      await api.put(`/api/orders/${orderId}/status`, { status: targetStatus })
      await fetchOrders()
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: targetStatus }))
      }
    } catch (err) {
      alert(err.message || 'Failed to update status.')
    }
  }

  // Payment Received: mark SERVED + PAID + open bill preview + auto-clear table session
  const handlePaymentReceived = async (ord) => {
    try {
      const api = (await import('../api')).default
      await api.put(`/api/orders/${ord.id}/status`, { status: 'SERVED' })
      await api.put(`/api/orders/${ord.id}/payment`, { payment_status: 'PAID' })
      await fetchOrders()
      if (selectedOrder?.id === ord.id) {
        setSelectedOrder(prev => ({ ...prev, status: 'SERVED', payment_status: 'PAID' }))
      }
      setBillPreviewOrder({ ...ord, status: 'SERVED', payment_status: 'PAID' })

      // Auto-clear the table session if this is a dine-in order
      const tableId = ord.table_id || ord.RestaurantTable?.id
      if (tableId && ord.order_type !== 'PARCEL' && ord.order_type !== 'TAKEAWAY') {
        try {
          await api.post(`/api/tables/${tableId}/clear`)
        } catch (_) {
          // Silently ignore — table may already be vacant or backend handles it
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to process payment.')
    }
  }

  const handleUpdatePaymentStatus = async (orderId, targetPaymentStatus) => {
    try {
      const api = (await import('../api')).default
      await api.put(`/api/orders/${orderId}/payment`, { payment_status: targetPaymentStatus })
      await fetchOrders()
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, payment_status: targetPaymentStatus }))
      }
    } catch (err) {
      alert(err.message || 'Failed to update payment.')
    }
  }

  const handleResolveWaiterCall = async (callId) => {
    try {
      const api = (await import('../api')).default
      await api.put(`/api/orders/waiter/calls/${callId}/resolve`)
      setWaiterCalls(prev => prev.filter(c => c.id !== callId))
    } catch (err) {
      alert(err.message || 'Failed to resolve call.')
    }
  }

  const filteredOrders = orders.filter(order => {
    let match = true
    if (orderFilter !== 'ALL' && order.status !== orderFilter) match = false
    if (orderTableFilter !== 'ALL' && order.RestaurantTable?.table_number !== orderTableFilter) match = false
    if (orderDateFilter) {
      const orderDate = new Date(order.created_at).toLocaleDateString('en-CA')
      if (orderDate !== orderDateFilter) match = false
    }
    return match
  })

  const now = new Date()
  const today = now.toDateString()
  const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today)
  const todayRev = todayOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
  const weekOrders = orders.filter(o => new Date(o.created_at) >= thisWeekStart)
  const weekRev = weekOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
  const monthOrders = orders.filter(o => new Date(o.created_at) >= thisMonthStart)
  const monthRev = monthOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)

  const uniqueTables = [...new Set(orders.map(o => o.RestaurantTable?.table_number).filter(Boolean))]

  const hasActiveFilters = orderFilter !== 'ALL' || orderDateFilter || orderTableFilter !== 'ALL'

  return (
    <>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="dd-page-header">
        <div>
          <h1 className="dd-page-title">Orders</h1>
          <p className="dd-page-subtitle">{orders.length} orders total · Updates live</p>
        </div>
        <button onClick={() => fetchOrders()} className="dd-btn-secondary">
          <IconRefresh /> Refresh
        </button>
      </div>

      <div className="p-6 flex-1 flex flex-col overflow-y-auto space-y-5">

        {/* ── Waiter Calls ─────────────────────────────────────────── */}
        {waiterCalls.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-600"><IconBell /></span>
              <p className="text-sm font-semibold text-amber-800">Waiter Requested ({waiterCalls.length})</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {waiterCalls.map((call) => (
                <div key={call.id} className="bg-white border border-amber-200 rounded px-4 py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Table {call.table_number}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Order #{call.order_number} · {getMinutesAgo(call.created_at)}</p>
                  </div>
                  <button onClick={() => handleResolveWaiterCall(call.id)} className="dd-btn-primary !py-1.5 !px-3 !text-xs">
                    <IconCheck /> Done
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── KPI Cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Today's Revenue", amount: todayRev, count: todayOrders.length, period: 'today' },
            { label: "This Week", amount: weekRev, count: weekOrders.length, period: 'this week' },
            { label: "This Month", amount: monthRev, count: monthOrders.length, period: 'this month' },
          ].map(({ label, amount, count }) => (
            <div key={label} className="bg-white border rounded p-5" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₹{amount.toFixed(0)}</p>
              <p className="text-sm text-[#ba181b] font-medium mt-0.5">{count} order{count !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>

        {/* ── Status Filter Tabs ───────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setOrderFilter(key)}
              className={`px-3.5 py-2 rounded text-sm font-medium border transition-all cursor-pointer ${
                orderFilter === key
                  ? 'bg-[#ba181b] text-white border-[#ba181b]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {label}
              {key !== 'ALL' && (
                <span className={`ml-1.5 text-xs ${orderFilter === key ? 'text-[#f5f3f4]' : 'text-gray-400'}`}>
                  ({orders.filter(o => o.status === key).length})
                </span>
              )}
            </button>
          ))}

          {/* Extra Filters */}
          <div className="flex gap-2 ml-auto flex-wrap">
            <input
              type="date" value={orderDateFilter}
              onChange={(e) => setOrderDateFilter(e.target.value)}
              className="dd-input !w-auto !py-2 !text-sm"
            />
            <select
              value={orderTableFilter} onChange={(e) => setOrderTableFilter(e.target.value)}
              className="dd-input !w-auto !py-2 !text-sm"
            >
              <option value="ALL">All Tables</option>
              {uniqueTables.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {hasActiveFilters && (
              <button
                onClick={() => { setOrderDateFilter(''); setOrderTableFilter('ALL'); setOrderFilter('ALL') }}
                className="dd-btn-secondary !py-2 !text-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* ── Orders Table ─────────────────────────────────────────── */}
        <div className="dd-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="dd-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Table</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th className="text-center">Bill Paid</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9" className="py-16 text-center text-sm text-gray-400">Loading orders...</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <IconReceipt />
                        <p className="text-sm font-medium">No orders found</p>
                        {hasActiveFilters && <p className="text-xs">Try adjusting your filters</p>}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(ord => (
                    <tr key={ord.id}>
                      <td className="font-mono text-xs text-gray-400">#{ord.order_number.toString().padStart(6, '0')}</td>
                      <td>
                        {ord.order_type === 'PARCEL' || ord.order_type === 'TAKEAWAY' ? (
                          <>
                            <p className="font-semibold text-gray-900">Parcel</p>
                            <p className="text-xs text-gray-400">Takeaway</p>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold text-gray-900">{ord.RestaurantTable?.table_number || 'N/A'}</p>
                            <p className="text-xs text-gray-400">Dine In</p>
                          </>
                        )}
                      </td>
                      <td className="text-gray-700">{ord.customer_name}</td>
                      <td className="font-semibold">{ord.OrderItems?.length || 0}</td>
                      <td className="font-semibold">₹{parseFloat(ord.total_amount).toFixed(0)}</td>
                      <td>
                        {/* Click-through status action button */}
                        {ord.status === 'PENDING' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'PREPARING')}
                            className="text-xs font-bold px-3 py-1.5 bg-[#161a1d] text-white hover:bg-black transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Accept
                          </button>
                        )}
                        {ord.status === 'PREPARING' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'READY')}
                            className="text-xs font-bold px-3 py-1.5 bg-[#ba181b] text-white hover:bg-[#a4161a] transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Mark Ready
                          </button>
                        )}
                        {ord.status === 'READY' && (
                          <button
                            onClick={() => handlePaymentReceived(ord)}
                            className="text-xs font-bold px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Payment Received
                          </button>
                        )}
                        {ord.status === 'SERVED' && (
                          <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                            <Check size={12} className="text-emerald-500" /> Served
                          </span>
                        )}
                        {ord.status === 'CANCELLED' && (
                          <span className="text-xs font-semibold text-red-400">Cancelled</span>
                        )}
                      </td>
                      <td className="text-xs text-gray-400">
                        <p>{new Date(ord.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                        <p>{new Date(ord.created_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                      </td>
                      <td className="text-center">
                        {ord.payment_status === 'PAID'
                          ? <Check size={16} className="text-emerald-500 mx-auto" />
                          : <span className="text-xs text-gray-300 font-semibold">—</span>}
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => setSelectedOrder(ord)} className="dd-btn-secondary !py-1.5 !px-2.5 !text-xs" title="View order details">
                            <IconEye />
                          </button>
                          <button onClick={() => setBillPreviewOrder(ord)} className="dd-btn-primary !py-1.5 !px-2.5 !text-xs" title="Print bill">
                            <IconPrint />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── View Order Modal ────────────────────────────────────────── */}
      {selectedOrder && (
        <div className="dd-modal-backdrop">
          <div className="dd-modal max-w-md dd-fade-in" style={{ maxHeight: '90vh' }}>
            <div className="dd-card-header">
              <div>
                <h4 className="font-semibold text-gray-900">Order #{selectedOrder.order_number}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{getMinutesAgo(selectedOrder.created_at)}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer"><IconX /></button>
            </div>
            <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <div className="flex gap-4 text-sm mb-4">
                <div className="bg-gray-50 rounded px-3 py-2 flex-1">
                  <p className="text-xs text-gray-400 font-medium">
                    {selectedOrder.order_type === 'PARCEL' || selectedOrder.order_type === 'TAKEAWAY' ? 'Type' : 'Table'}
                  </p>
                  <p className="font-semibold text-gray-900">
                    {selectedOrder.order_type === 'PARCEL' || selectedOrder.order_type === 'TAKEAWAY'
                      ? 'Parcel'
                      : (selectedOrder.RestaurantTable?.table_number || 'N/A')}
                  </p>
                </div>
                <div className="bg-gray-50 rounded px-3 py-2 flex-1">
                  <p className="text-xs text-gray-400 font-medium">Customer</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.customer_name}</p>
                </div>
                <div className="bg-gray-50 rounded px-3 py-2 flex-1">
                  <p className="text-xs text-gray-400 font-medium">Status</p>
                  <span className={statusBadgeClass(selectedOrder.status)}>{statusLabel(selectedOrder.status)}</span>
                </div>
              </div>

              <div className="border rounded overflow-hidden mb-4" style={{ borderColor: 'var(--border)' }}>
                <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {selectedOrder.OrderItems?.map((item) => (
                    <div key={item.id} className="p-3.5 flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{item.MenuItem?.name_en} <span className="text-gray-400 text-xs">× {item.quantity}</span></p>
                        {item.MenuItem?.is_combo && item.MenuItem?.ComboComponents && (
                          <div className="text-xs text-gray-500 pl-3 mt-1.5 space-y-0.5">
                            {item.MenuItem.ComboComponents.map(comp => (
                              <div key={comp.id}>
                                - {comp.ComboItem?.quantity || comp.quantity || 1}x {comp.name_en}
                              </div>
                            ))}
                          </div>
                        )}
                        {item.note && <p className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block">{item.note}</p>}
                      </div>
                      <span className="font-semibold text-gray-700 text-sm">₹{parseFloat(item.total_price).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-t" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-sm font-semibold text-gray-600">Total</span>
                  <span className="text-lg font-bold text-gray-900">₹{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                </div>
              </div>

              {selectedOrder.special_note && (
                <div className="bg-amber-50 border border-amber-100 rounded p-3 text-sm text-amber-800 mb-4">
                  <strong>Note:</strong> {selectedOrder.special_note}
                </div>
              )}

              <div className="space-y-2">
                {selectedOrder.status === 'PENDING' && (
                  <button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'PREPARING')} className="w-full dd-btn-primary justify-center py-3">
                    Accept — Start Cooking
                  </button>
                )}
                {selectedOrder.status === 'PREPARING' && (
                  <button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'READY')} className="w-full bg-[#161a1d] hover:bg-[#0b090a] text-white font-semibold py-3 transition-colors cursor-pointer">
                    Mark as Ready
                  </button>
                )}
                {selectedOrder.status === 'READY' && (
                  <button
                    onClick={() => handlePaymentReceived(selectedOrder)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check size={16} /> Payment Received — Mark Served
                  </button>
                )}
                {selectedOrder.status === 'SERVED' && (
                  <div className="flex items-center justify-center gap-2 py-3 text-emerald-600 text-sm font-bold">
                    <Check size={16} /> Order served &amp; payment received
                  </div>
                )}
                {selectedOrder.status !== 'SERVED' && selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'READY' && (
                  <button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'CANCELLED')} className="w-full dd-btn-danger justify-center py-3">
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
                          <td className="py-0.5 text-right align-top">₹{parseFloat(item.total_price).toFixed(0)}</td>
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
            <div className="p-4 bg-white border-t" style={{ borderColor: 'var(--border)' }}>
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
                    await writer.write(encoder.encode(formatted))
                    writer.releaseLock()
                  } catch (error) {
                    alert('Print failed: ' + error.message)
                  }
                }}
                className="w-full dd-btn-primary justify-center py-3"
              >
                <IconPrint /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}



