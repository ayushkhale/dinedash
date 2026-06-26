import { useState } from 'react'
import { TrendingUp, IndianRupee, Clock, Flame, CheckCircle, Utensils, Bell, QrCode, ShoppingCart } from 'lucide-react'

// ── SVG Icons replaced by Lucide ─────────────────────────────────────
const IconTrendingUp = () => <TrendingUp size={16} />
const IconCurrency = () => <IndianRupee size={16} />
const IconClock = () => <Clock size={16} />
const IconFire = () => <Flame size={16} />
const IconCheck = () => <CheckCircle size={16} />
const IconUtensils = () => <Utensils size={16} />
const IconBell = () => <Bell size={14} />
const IconTable = () => <QrCode size={16} />

export default function OverviewWorkspace({ orders, tables, waiterCalls, setActiveTab }) {
  const [selectedTable, setSelectedTable] = useState(null)

  // Derived stats
  const today = new Date().toDateString()
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today)
  const totalRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
  const pendingCount = orders.filter(o => o.status === 'PENDING').length
  const preparingCount = orders.filter(o => o.status === 'PREPARING').length
  const readyCount = orders.filter(o => o.status === 'READY').length
  const servedCount = todayOrders.filter(o => o.status === 'SERVED').length

  const occupiedTableIds = new Set(
    orders.filter(o => o.status === 'PENDING' || o.status === 'PREPARING').map(o => o.table_id)
  )
  const readyTableIds = new Set(
    orders.filter(o => o.status === 'READY').map(o => o.table_id)
  )
  const freeCount = tables.filter(t => t.session_status !== 'OCCUPIED').length

  const tableOrders = selectedTable
    ? orders.filter(o => o.table_id === selectedTable.id && ['PENDING', 'PREPARING', 'READY'].includes(o.status))
    : []

  const statCards = [
    { label: "Today's Orders",    value: todayOrders.length,              Icon: IconTrendingUp, accent: 'var(--onyx)' },
    { label: "Today's Revenue",   value: `₹${totalRevenue.toFixed(0)}`,   Icon: IconCurrency,  accent: 'var(--mahogany-red-2)' },
    { label: 'Pending',           value: pendingCount,                    Icon: IconClock,     accent: 'var(--silver)' },
    { label: 'Preparing',         value: preparingCount,                  Icon: IconFire,      accent: 'var(--carbon-black)' },
    { label: 'Ready to Serve',    value: readyCount,                      Icon: IconCheck,     accent: 'var(--mahogany-red)' },
    { label: 'Served Today',      value: servedCount,                     Icon: IconUtensils,  accent: 'var(--onyx)' },
  ]

  const statusLabel = (table) => {
    if (table.session_status === 'OCCUPIED') {
      return { label: 'Occupied', cls: 'bg-[#ba181b] text-white border-[#ba181b]' }
    }
    if (readyTableIds.has(table.id)) {
      return { label: 'Ready', cls: 'bg-[#161a1d] text-white border-[#161a1d]' }
    }
    return { label: 'Free', cls: 'bg-[#b1a7a6] text-white border-[#b1a7a6]' }
  }

  return (
    <div className="p-6 flex-1 flex flex-col overflow-y-auto space-y-5">

      {/* ── Workspace Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-outfit">Overview</h1>
          <p className="text-xs text-gray-400 mt-0.5">Real-time status of your restaurant operations</p>
        </div>
        <button
          onClick={() => setActiveTab('POS')}
          className="bg-[#ba181b] hover:bg-[#a4161a] active:bg-[#660708] text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer transition-colors shadow-sm self-start sm:self-auto"
        >
          <ShoppingCart size={15} />
          <span>Open POS Terminal</span>
        </button>
      </div>

      {/* ── Waiter Calls Alert ──────────────────────────────────────── */}
      {waiterCalls.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
          <span className="text-amber-600 mt-0.5 shrink-0"><IconBell /></span>
          <div className="flex flex-wrap gap-2 flex-1">
            {waiterCalls.map(call => (
              <span key={call.id} className="text-sm font-semibold text-amber-800">
                Table {call.table_number} is calling for a waiter
                {waiterCalls.indexOf(call) < waiterCalls.length - 1 && ' ·'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── KPI Stat Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(({ label, value, Icon, accent }) => (
          <div key={label} className="bg-white border rounded-xl p-4 flex flex-col gap-2" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">{label}</span>
              <span style={{ color: accent }}><Icon /></span>
            </div>
            <span className="text-2xl font-bold" style={{ color: accent }}>{value}</span>
          </div>
        ))}
      </div>

      {/* ── Main Section ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start flex-1">

        {/* Live Table Map */}
        <div className="lg:col-span-2 bg-white border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="px-5 py-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
            <div>
              <p className="font-semibold text-gray-900">Live Table Map</p>
              <p className="text-xs text-gray-400 mt-0.5">Click a table to see its active order</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium text-gray-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#b1a7a6] inline-block"></span> Free {freeCount}</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ba181b] inline-block"></span> Occupied {tables.filter(t => t.session_status === 'OCCUPIED').length}</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#161a1d] inline-block"></span> Ready {readyTableIds.size}</span>
            </div>
          </div>

          {tables.length === 0 ? (
            <div className="p-16 text-center">
              <span className="text-gray-300"><IconTable /></span>
              <p className="text-sm font-semibold text-gray-700 mt-3">No tables configured yet</p>
              <p className="text-xs text-gray-400 mt-1">Add tables from the Tables & QR section</p>
            </div>
          ) : (
            <div className="p-4 grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))' }}>
              {tables.map(table => {
                const { label, cls } = statusLabel(table)
                const isSelected = selectedTable?.id === table.id
                return (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTable(isSelected ? null : table)}
                    className={`relative flex flex-col items-center justify-center rounded-lg aspect-square text-center transition-all cursor-pointer border-2 ${cls} ${
                      isSelected ? 'scale-95 ring-2 ring-offset-1 ring-[#ba181b]' : 'hover:scale-105 hover:shadow-sm'
                    }`}
                  >
                    {!table.is_active && (
                      <span className="absolute top-1 right-1 text-[8px] opacity-50">Off</span>
                    )}
                    <span className="text-sm font-bold leading-tight">{table.table_number}</span>
                    <span className="text-[10px] font-medium mt-0.5 opacity-80">{label}</span>
                    {occupiedTableIds.has(table.id) && (
                      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div>
          {selectedTable ? (
            <div className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <div className="px-5 py-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="font-semibold text-gray-900">{selectedTable.table_number}</p>
                  <span className={`text-xs font-semibold ${
                    occupiedTableIds.has(selectedTable.id) ? 'text-[#ba181b]'
                    : readyTableIds.has(selectedTable.id) ? 'text-[#161a1d]'
                    : 'text-[#b1a7a6]'
                  }`}>
                    {occupiedTableIds.has(selectedTable.id) ? 'Occupied' : readyTableIds.has(selectedTable.id) ? 'Ready to Serve' : 'Free'}
                  </span>
                </div>
                <button onClick={() => setSelectedTable(null)} className="text-gray-400 hover:text-gray-700 text-lg leading-none cursor-pointer">×</button>
              </div>
              {tableOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-400">No active orders at this table</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {tableOrders.map(order => (
                    <div key={order.id} className="p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-800">#{order.order_number} · {order.customer_name}</span>
                        <span className={`dd-badge ${
                          order.status === 'READY' ? 'dd-badge-ready'
                          : order.status === 'PREPARING' ? 'dd-badge-preparing'
                          : 'dd-badge-pending'
                        }`}>{order.status}</span>
                      </div>
                      {order.OrderItems?.map(item => (
                        <div key={item.id} className="space-y-0.5">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{item.MenuItem?.name_en} <span className="text-gray-400">×{item.quantity}</span></span>
                            <span className="font-semibold">₹{parseFloat(item.total_price).toFixed(0)}</span>
                          </div>
                          {item.MenuItem?.is_combo && item.MenuItem?.ComboComponents && (
                            <div className="text-[10px] text-gray-400 pl-3">
                              {item.MenuItem.ComboComponents.map(comp => (
                                <div key={comp.id}>
                                  - {(comp.ComboItem?.quantity || comp.quantity || 1) * item.quantity}x {comp.name_en}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="flex justify-between pt-1.5 border-t text-xs font-bold" style={{ borderColor: 'var(--border-subtle)' }}>
                        <span>Total</span>
                        <span className="text-[#ba181b]">₹{parseFloat(order.total_amount).toFixed(0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <p className="font-semibold text-gray-900">Recent Orders</p>
              </div>
              {orders.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-400">No orders yet today</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {orders.slice(0, 8).map(order => (
                    <div key={order.id} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">#{order.order_number} — {order.RestaurantTable?.table_number || 'N/A'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{order.customer_name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-[#ba181b]">₹{parseFloat(order.total_amount).toFixed(0)}</p>
                        <span className={`dd-badge ${
                          order.status === 'SERVED' ? 'dd-badge-served'
                          : order.status === 'READY' ? 'dd-badge-ready'
                          : order.status === 'PREPARING' ? 'dd-badge-preparing'
                          : order.status === 'CANCELLED' ? 'dd-badge-cancelled'
                          : 'dd-badge-pending'
                        }`}>{order.status === 'PENDING' ? 'New' : order.status.charAt(0) + order.status.slice(1).toLowerCase()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
