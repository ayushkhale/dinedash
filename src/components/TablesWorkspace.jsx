import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import api from '../api'
import { handlePrintCard, handlePrintAll } from '../utils/printUtils'

// ── SVG Icons ───────────────────────────────────────────────────────
const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconPrint = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
)
const IconRefresh = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)
const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
)
const IconTable = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
  </svg>
)
const IconCamera = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)
const IconAlertCircle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

export default function TablesWorkspace({ tables, setTables, fetchTables, user, restaurant }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isTableModalOpen, setIsTableModalOpen] = useState(false)
  const [editingTable, setEditingTable] = useState(null)
  const [tableForm, setTableForm] = useState({ table_number: '', is_active: true, count: 1 })
  const [showDangerZone, setShowDangerZone] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)

  const isOwner = user?.role === 'OWNER'

  // Close three-dot menu when clicking outside
  useEffect(() => {
    if (!openMenuId) return
    const close = () => setOpenMenuId(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [openMenuId])

  const handleSaveTable = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editingTable) {
        await api.put(`/api/tables/${editingTable.id}`, {
          table_number: tableForm.table_number
        })
        setIsTableModalOpen(false)
        setTableForm({ table_number: '', is_active: true, count: 1 })
        setEditingTable(null)
        await fetchTables()
      } else {
        const count = parseInt(tableForm.count, 10)
        if (!count || count < 1 || count > 100) {
          setError('Please enter a valid number between 1 and 100.')
          return
        }
        const response = await api.post('/api/tables', { count, is_active: tableForm.is_active })
        const createdTables = response?.data ?? []
        setIsTableModalOpen(false)
        setTableForm({ table_number: '', is_active: true, count: 1 })
        setTables((prev) => [...prev, ...createdTables])
      }
    } catch (err) {
      setError(err.message || 'Failed to save table')
    }
  }

  const handleRegenerateQr = async (table) => {
    if (!confirm(`Rotate QR code for ${table.table_number}? The old printed QR will stop working immediately.`)) return
    setError('')
    try {
      await api.put(`/api/tables/${table.id}`, { regenerate_qr: true })
      await fetchTables()
    } catch (err) {
      setError(err.message || 'Failed to regenerate QR')
    }
  }

  const handleOpenTable = async (tableId) => {
    setError('')
    try {
      await api.post(`/api/tables/${tableId}/open`)
      await fetchTables()
    } catch (err) {
      setError(err.message || 'Failed to open table session')
    }
  }

  const handleClearTable = async (tableId) => {
    if (!confirm('Are you sure you want to clear this table session? This will vacate the table and rotate the token.')) return
    setError('')
    try {
      await api.post(`/api/tables/${tableId}/clear`)
      await fetchTables()
    } catch (err) {
      setError(err.message || 'Failed to clear table session')
    }
  }

  const handleDeleteTable = async (table) => {
    if (!confirm(
      `Delete ${table.table_number}?\n\nNote: Tables with order history cannot be deleted. Deactivate the table instead.`
    )) return
    setError('')
    try {
      await api.delete(`/api/tables/${table.id}`)
      setTables(prev => prev.filter(t => t.id !== table.id))
    } catch (err) {
      setError(
        err.message ||
        `Cannot delete ${table.table_number}. If it has past orders, deactivate it instead using Edit.`
      )
    }
  }

  const handleBulkRegenerate = async () => {
    if (!confirm('Regenerate QR codes for ALL tables? All currently printed QR codes will stop working immediately. This cannot be undone.')) return
    setError('')
    try {
      setLoading(true)
      for (const table of tables) {
        await api.put(`/api/tables/${table.id}`, { regenerate_qr: true })
      }
      await fetchTables()
    } catch (err) {
      setError(err.message || 'Failed to complete bulk regeneration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="dd-page-header">
        <div>
          <h1 className="dd-page-title">Tables & QR Codes</h1>
          <p className="dd-page-subtitle">
            {tables.length === 0 ? 'No tables configured yet' : `${tables.length} table${tables.length > 1 ? 's' : ''} configured`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePrintAll(tables, restaurant || { name: user?.name })}
            disabled={tables.length === 0}
            className="dd-btn-secondary"
          >
            <IconPrint /> Print All QR Stickers
          </button>
          <button
            onClick={() => {
              setEditingTable(null)
              setTableForm({ table_number: '', is_active: true, count: 5 })
              setIsTableModalOpen(true)
            }}
            className="dd-btn-primary"
          >
            <IconPlus /> Add Tables
          </button>
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────── */}
      {error && (
        <div className="mx-6 mt-4 p-3 rounded bg-red-50 text-red-700 border border-red-200 text-sm font-medium flex items-start gap-2">
          <span className="shrink-0 mt-0.5"><IconAlertCircle /></span>
          <span>{error}</span>
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col overflow-y-auto space-y-5">

        {/* ── Table Grid ──────────────────────────────────────────── */}
        {loading ? (
          <div className="flex-1 flex flex-col justify-center items-center gap-3 py-20">
            <div className="dd-spinner" />
            <p className="text-sm text-gray-400">Loading tables...</p>
          </div>
        ) : tables.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
            <div className="text-gray-200 mb-5"><IconTable /></div>
            <p className="text-base font-semibold text-gray-700">No tables yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-5 max-w-xs">
              Add tables to generate QR codes that customers scan to place orders directly from their phones.
            </p>
            <button
              onClick={() => {
                setEditingTable(null)
                setTableForm({ table_number: '', is_active: true, count: 1 })
                setIsTableModalOpen(true)
              }}
              className="dd-btn-primary"
            >
              <IconPlus /> Add Your First Tables
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {tables.map((table) => (
              <div
                key={table.id}
                className="bg-white border rounded overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                style={{ borderColor: 'var(--border)' }}
              >
                {/* Card Top — Restaurant info + three-dot menu */}
                <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2">
                    {restaurant?.logo_url && (
                      <img 
                        src={restaurant.logo_url} 
                        alt="logo" 
                        className="w-7 h-7 rounded object-cover border"
                        style={{ borderColor: 'var(--border)' }}
                      />
                    )}
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{restaurant?.name || user?.name || 'Restaurant'}</p>
                      <p className="text-xs text-gray-400">Dine-in</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!table.is_active && (
                      <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-[#f5f3f4] text-[#b1a7a6]">
                        Disabled
                      </span>
                    )}
                    {/* Three-dot session menu */}
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === table.id ? null : table.id)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer text-lg font-black leading-none"
                        title="Session options"
                      >
                        ⋯
                      </button>
                      {openMenuId === table.id && (
                        <div className="absolute right-0 top-8 z-30 bg-white border border-gray-200 rounded shadow-lg py-1 min-w-[170px]">
                          {table.session_status !== 'OCCUPIED' ? (
                            <button
                              onClick={() => { handleOpenTable(table.id); setOpenMenuId(null) }}
                              className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[#161a1d] hover:bg-[#f5f3f4] flex items-center gap-2 cursor-pointer"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                              Seat Guests
                            </button>
                          ) : (
                            <>
                              <div className="px-4 py-2 text-[10px] font-bold text-[#ba181b] uppercase tracking-widest border-b border-gray-100">
                                Table is Occupied
                              </div>
                              {isOwner && (
                                <button
                                  onClick={() => { handleClearTable(table.id); setOpenMenuId(null) }}
                                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                                  Done — Free Up Table
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Table Number */}
                <div className={`px-4 py-3 text-white flex items-center justify-between transition-colors duration-150 ${table.session_status === 'OCCUPIED' ? 'bg-[#ba181b]' : 'bg-[#161a1d]'}`}>
                  <div>
                    <p className="text-xs text-white/70 font-medium">Table</p>
                    <p className="text-3xl font-bold leading-none mt-0.5">{table.table_number}</p>
                  </div>
                  <span className="text-xs font-medium bg-white/20 px-2.5 py-1 rounded">Dine In</span>
                </div>

                {/* QR Code */}
                <div className="p-4 flex flex-col items-center bg-gray-50 border-b" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-xs font-semibold text-gray-700 mb-1">Scan to Order</p>
                  <p className="text-[11px] text-gray-400 mb-3">Point your phone camera at this QR code</p>
                  <div className="p-2 bg-white rounded border shadow-sm" style={{ borderColor: 'var(--border)' }}>
                    <QRCodeSVG value={table.qr_url} size={120} level="H" includeMargin={true} />
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                    <IconCamera />
                    <span>Scan with phone camera</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handlePrintCard(table, restaurant || { name: user?.name })}
                      className="dd-btn-secondary !py-2 !text-xs justify-center"
                    >
                      <IconPrint /> Print Card
                    </button>
                    <button
                      onClick={() => handleRegenerateQr(table)}
                      className="dd-btn-secondary !py-2 !text-xs justify-center"
                    >
                      <IconRefresh /> New QR
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setEditingTable(table)
                        setTableForm({ table_number: table.table_number, is_active: table.is_active })
                        setIsTableModalOpen(true)
                      }}
                      className="text-xs font-medium text-gray-500 hover:text-gray-800 py-1.5 cursor-pointer transition-colors flex items-center justify-center gap-1"
                    >
                      <IconEdit /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTable(table)}
                      className="text-xs font-medium text-red-500 hover:text-red-700 py-1.5 cursor-pointer transition-colors flex items-center justify-center gap-1"
                    >
                      <IconTrash /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Danger Zone ──────────────────────────────────────────── */}
        {tables.length > 0 && (
          <div className="border border-red-200 rounded overflow-hidden">
            <button
              onClick={() => setShowDangerZone(!showDangerZone)}
              className="w-full flex items-center justify-between px-5 py-4 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-red-700">Danger Zone — Regenerate All QR Codes</p>
                <p className="text-xs text-red-500 mt-0.5">All printed QR codes will stop working immediately</p>
              </div>
              <span className="text-red-400 text-lg">{showDangerZone ? '▲' : '▼'}</span>
            </button>
            {showDangerZone && (
              <div className="px-5 py-4 bg-white border-t border-red-200">
                <p className="text-sm text-gray-600 mb-4">
                  This will generate new QR tokens for all <strong>{tables.length} tables</strong>. 
                  Any previously printed QR stickers or menus will no longer work. 
                  Only do this if your QR codes have been compromised.
                </p>
                <button
                  onClick={handleBulkRegenerate}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Regenerating...' : `Regenerate All ${tables.length} QR Codes`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add / Edit Table Modal ──────────────────────────────────── */}
      {isTableModalOpen && (
        <div className="dd-modal-backdrop">
          <div className="dd-modal max-w-sm dd-fade-in">
            <div className="dd-card-header">
              <h3 className="font-semibold text-gray-900">{editingTable ? 'Edit Table' : 'Add Tables'}</h3>
              <button onClick={() => setIsTableModalOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer"><IconX /></button>
            </div>
            <form onSubmit={handleSaveTable} className="p-5 space-y-4">
              {editingTable ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Table Name or Number
                  </label>
                  <input
                    type="text" required
                    value={tableForm.table_number}
                    onChange={(e) => setTableForm({ ...tableForm, table_number: e.target.value })}
                    placeholder="e.g. Table 5, VIP Room, Terrace 1"
                    className="dd-input"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    How many tables to add?
                  </label>
                  <input
                    type="number" min={1} max={100} required
                    value={tableForm.count}
                    onChange={(e) => setTableForm({ ...tableForm, count: e.target.value })}
                    className="dd-input"
                    style={{ fontFamily: 'monospace' }}
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Tables will be automatically numbered (e.g. T1, T2, T3...) starting from the last existing number.
                  </p>
                </div>
              )}


              {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

              <div className="flex gap-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <button type="button" onClick={() => setIsTableModalOpen(false)} className="dd-btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="dd-btn-primary flex-1 justify-center">
                  {editingTable ? 'Save Changes' : 'Add Tables'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}



