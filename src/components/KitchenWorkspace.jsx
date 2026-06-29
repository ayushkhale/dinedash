import { useState } from 'react'
import { ChefHat, CheckCircle, Clock, Flame } from 'lucide-react'

// ── SVG Icons replaced by Lucide ─────────────────────────────────────
const IconChefHat = () => <ChefHat size={36} className="text-gray-300" />
const IconChefHatSm = ({ size = 16 }) => <ChefHat size={size} />
const IconCheckCircle = ({ size = 16 }) => <CheckCircle size={size} />
const IconClock = ({ size = 14 }) => <Clock size={size} />
const IconFire = ({ size = 14 }) => <Flame size={size} />

export default function KitchenWorkspace({ orders, fetchOrders }) {
  const [loading, setLoading] = useState(false)

  const activeKitchenTickets = orders.filter(order =>
    order.status === 'PENDING' || order.status === 'PREPARING' || order.status === 'READY'
  )

  const pendingCount = activeKitchenTickets.filter(t => t.status === 'PENDING').length
  const preparingCount = activeKitchenTickets.filter(t => t.status === 'PREPARING').length
  const readyCount = activeKitchenTickets.filter(t => t.status === 'READY').length

  const getMinutesAgo = (createdAt) => {
    const diffMs = new Date() - new Date(createdAt)
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins <= 0) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const hrs = (diffMins / 60).toFixed(1)
    return `${hrs}hrs ago`
  }

  const getUrgencyClass = (createdAt) => {
    const diffMins = Math.floor((new Date() - new Date(createdAt)) / 60000)
    if (diffMins >= 20) return 'border-red-400'
    if (diffMins >= 10) return 'border-amber-400'
    return 'border-gray-200'
  }

  const handleUpdateOrderStatus = async (orderId, targetStatus) => {
    try {
      const api = (await import('../api')).default
      await api.put(`/api/orders/${orderId}/status`, { status: targetStatus })
      await fetchOrders()
    } catch (err) {
      alert(err.message || 'Failed to update status.')
    }
  }

  return (
    <>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="dd-page-header">
        <div>
          <h1 className="dd-page-title">Kitchen Display</h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="flex items-center gap-1.5 text-xs text-[#ba181b] font-medium">
              <IconClock size={12} /> {pendingCount} new
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[#161a1d] font-medium">
              <IconFire size={12} /> {preparingCount} cooking
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[#b1a7a6] font-medium">
              <IconCheckCircle size={12} /> {readyCount} ready
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex-1 flex flex-col justify-center items-center gap-3 py-20">
            <div className="dd-spinner" />
            <p className="text-sm text-gray-400">Loading kitchen tickets...</p>
          </div>
        ) : activeKitchenTickets.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
            <div className="text-gray-200 mb-4"><IconChefHat /></div>
            <p className="text-base font-semibold text-gray-700">Kitchen is clear</p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">New orders will appear here as soon as customers place them. The display updates in real time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeKitchenTickets.map((ticket) => {
              const isPending   = ticket.status === 'PENDING'
              const isPreparing = ticket.status === 'PREPARING'
              const isReady     = ticket.status === 'READY'

              return (
                <div
                  key={ticket.id}
                  className={`bg-white border-2 rounded overflow-hidden flex flex-col shadow-sm ${getUrgencyClass(ticket.created_at)}`}
                >
                  {/* Ticket Header */}
                  <div className="px-4 py-3 flex justify-between items-center border-b bg-[#f5f3f4] border-[#d3d3d3]">
                    <div>
                      <p className="text-xs font-semibold text-[#b1a7a6]">
                        {ticket.order_type === 'PARCEL' || ticket.order_type === 'TAKEAWAY'
                          ? 'Parcel / Takeaway'
                          : (ticket.RestaurantTable?.table_number
                            ? (String(ticket.RestaurantTable.table_number).toLowerCase().startsWith('table')
                                ? ticket.RestaurantTable.table_number
                                : `Table ${ticket.RestaurantTable.table_number}`)
                            : 'N/A')}
                      </p>
                      <p className="text-lg font-bold text-[#0b090a] leading-tight">#{ticket.order_number}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 ${
                        isPending   ? 'bg-[#ba181b] text-white'
                        : isPreparing ? 'bg-[#161a1d] text-white'
                        : 'bg-green-100 text-green-700'
                      }`}>
                        {isPending ? 'New' : isPreparing ? 'Cooking' : 'Ready'}
                      </span>
                      <p className={`text-xs mt-1 font-medium ${
                        Math.floor((new Date() - new Date(ticket.created_at)) / 60000) >= 10
                          ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {getMinutesAgo(ticket.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-4 flex-1 space-y-2.5">
                    {ticket.OrderItems?.map((item) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm leading-snug">{item.MenuItem?.name_en}</p>
                          {item.MenuItem?.is_combo && item.MenuItem?.ComboComponents && (
                            <div className="text-xs text-gray-500 pl-3 mt-1 space-y-0.5">
                              {item.MenuItem.ComboComponents.map(comp => (
                                <div key={comp.id}>
                                  - {(comp.ComboItem?.quantity || comp.quantity || 1) * item.quantity}x {comp.name_en}
                                </div>
                              ))}
                            </div>
                          )}
                          {item.note && (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-0.5 mt-1 inline-block">
                              Note: {item.note}
                            </p>
                          )}
                        </div>
                        <span className="ml-3 shrink-0 bg-gray-900 text-white text-sm font-bold w-7 h-7 rounded flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Special note */}
                  {ticket.special_note && (
                    <div className="mx-4 mb-3 bg-[#f5f3f4] border border-[#d3d3d3] rounded p-2.5 text-xs text-[#0b090a]">
                      <strong>Note:</strong> {ticket.special_note}
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="p-3 border-t flex flex-col gap-2" style={{ borderColor: 'var(--border)' }}>
                    {isPending && (
                      <button
                        onClick={() => handleUpdateOrderStatus(ticket.id, 'PREPARING')}
                        className="w-full py-2.5 text-sm font-bold text-white bg-[#161a1d] hover:bg-black transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <IconChefHatSm size={15} /> Accept — Start Cooking
                      </button>
                    )}
                    {isPreparing && (
                      <button
                        onClick={() => handleUpdateOrderStatus(ticket.id, 'READY')}
                        className="w-full py-2.5 text-sm font-bold text-white bg-[#ba181b] hover:bg-[#a4161a] transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <IconCheckCircle size={15} /> Mark Ready
                      </button>
                    )}
                    {isReady && (
                      <div className="w-full py-2.5 text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-2 select-none">
                        <IconCheckCircle size={15} className="text-emerald-600" /> Ready for Pickup
                      </div>
                    )}
                    {isPending && (
                      <button
                        onClick={() => handleUpdateOrderStatus(ticket.id, 'CANCELLED')}
                        className="w-full py-1.5 text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}



