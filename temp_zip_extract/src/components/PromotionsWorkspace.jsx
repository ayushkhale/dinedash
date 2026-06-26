import { useState, useEffect } from 'react'
import api from '../api'

// ── Reward type meta details ──────────────────────────────────────────────────
const rewardMeta = {
  DISCOUNT_PERCENT: { label: 'Percent %', color: 'bg-violet-50 text-violet-700 border-violet-100' },
  DISCOUNT_FLAT: { label: 'Flat ₹', color: 'bg-sky-50 text-sky-700 border-sky-100' },
  FREE_ITEM: { label: 'Free Item 🎁', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
}

// ── Promo type meta details ───────────────────────────────────────────────────
const promoTypeMeta = {
  COUPON: { label: 'Coupon Code', color: 'bg-amber-50 text-amber-800 border-amber-100 font-mono font-bold tracking-wider' },
  AUTO_APPLIED: { label: 'Auto Applied', color: 'bg-indigo-50 text-indigo-800 border-indigo-100' },
}

// ── Status badge colours ──────────────────────────────────────────────────────
const statusBadge = (promo) => {
  if (!promo.is_active) return { label: 'Inactive', color: 'bg-neutral-100 text-neutral-500 border-neutral-200' }
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0] // YYYY-MM-DD
  const timeStr = now.toTimeString().split(' ')[0] // HH:MM:SS
  
  if (promo.start_date && todayStr < promo.start_date) {
    return { label: 'Scheduled', color: 'bg-amber-50 text-amber-700 border-amber-100' }
  }
  if (promo.end_date && todayStr > promo.end_date) {
    return { label: 'Expired', color: 'bg-red-50 text-red-600 border-red-100' }
  }
  return { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const emptyForm = {
  title: '',
  description: '',
  promo_type: 'COUPON',
  is_active: true,
  start_date: '',
  end_date: '',
  start_time: '00:00:00',
  end_time: '23:59:59',
  min_cart_amount: '',
  min_quantity: '',
  menu_item_id: '',
  reward_type: 'DISCOUNT_PERCENT',
  reward_value: '',
  reward_item_id: '',
}

export default function PromotionsWorkspace() {
  const [promotions, setPromotions] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  // Preview / validate test panel
  const [testCode, setTestCode] = useState('')
  const [testTableId, setTestTableId] = useState('')
  const [testItems, setTestItems] = useState('')
  const [testResult, setTestResult] = useState(null)
  const [testLoading, setTestLoading] = useState(false)

  // ── Fetch all promotions and menu items ──────────────────────────────────────
  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [promoRes, menuRes] = await Promise.all([
        api.get('/api/promotions'),
        api.get('/api/menu-items')
      ])
      setPromotions(promoRes.data || promoRes || [])
      setMenuItems(menuRes.data || menuRes || [])
    } catch (err) {
      setError(err.message || 'Failed to load promotions workspace data.')
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    fetchData()
  }, [])

  // ── Clear flash messages after 4 s ────────────────────────────────────────
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(''), 4000)
    return () => clearTimeout(t)
  }, [success])

  // ── Open modal helpers ─────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingPromo(null)
    setForm({
      ...emptyForm,
      start_date: new Date().toISOString().split('T')[0]
    })
    setError('')
    setIsModalOpen(true)
  }

  const openEdit = (promo) => {
    setEditingPromo(promo)
    setForm({
      title: promo.title || '',
      description: promo.description || '',
      promo_type: promo.promo_type || 'COUPON',
      is_active: promo.is_active !== false,
      start_date: promo.start_date || '',
      end_date: promo.end_date || '',
      start_time: promo.start_time || '00:00:00',
      end_time: promo.end_time || '23:59:59',
      min_cart_amount: promo.requirements?.min_cart_amount ?? '',
      min_quantity: promo.requirements?.min_quantity ?? '',
      menu_item_id: promo.requirements?.menu_item_id || '',
      reward_type: promo.rewards?.reward_type || 'DISCOUNT_PERCENT',
      reward_value: promo.rewards?.reward_value ?? '',
      reward_item_id: promo.rewards?.reward_item_id || '',
    })
    setError('')
    setIsModalOpen(true)
  }

  // ── Save (create / update) ─────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      title: form.title.toUpperCase().trim(),
      description: form.description.trim() || undefined,
      promo_type: form.promo_type,
      is_active: form.is_active,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
      start_time: form.start_time || undefined,
      end_time: form.end_time || undefined,
      requirements: {
        min_cart_amount: form.min_cart_amount !== '' ? parseFloat(form.min_cart_amount) : 0.00,
        min_quantity: form.min_quantity !== '' ? parseInt(form.min_quantity) : 0,
        menu_item_id: form.menu_item_id || null,
      },
      rewards: {
        reward_type: form.reward_type,
        reward_value: form.reward_value !== '' ? parseFloat(form.reward_value) : 0.00,
        reward_item_id: form.reward_item_id || null,
      }
    }

    try {
      if (editingPromo) {
        await api.put(`/api/promotions/${editingPromo.id}`, payload)
        setSuccess(`Promotion "${payload.title}" updated successfully.`)
      } else {
        await api.post('/api/promotions', payload)
        setSuccess(`Promotion "${payload.title}" created successfully.`)
      }
      setIsModalOpen(false)
      await fetchData()
    } catch (err) {
      setError(err.message || 'Failed to save promotion.')
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle active status inline ────────────────────────────────────────────
  const handleToggle = async (promo) => {
    try {
      // Send full updated object for PUT
      const payload = {
        title: promo.title,
        description: promo.description,
        promo_type: promo.promo_type,
        is_active: !promo.is_active,
        start_date: promo.start_date,
        end_date: promo.end_date,
        start_time: promo.start_time,
        end_time: promo.end_time,
        requirements: promo.requirements,
        rewards: promo.rewards,
      }
      await api.put(`/api/promotions/${promo.id}`, payload)
      await fetchData()
    } catch (err) {
      setError(err.message || 'Failed to toggle status.')
    }
  }

  // ── Delete promo ───────────────────────────────────────────────────────────
  const handleDelete = async (promo) => {
    if (!confirm(`Delete promotion "${promo.title}"? This cannot be undone.`)) return
    try {
      await api.delete(`/api/promotions/${promo.id}`)
      setSuccess(`Promotion "${promo.title}" deleted.`)
      await fetchData()
    } catch (err) {
      setError(err.message || 'Failed to delete promotion.')
    }
  }

  // ── Validate / test coupon (public endpoint) ───────────────────────────────
  const handleTest = async (e) => {
    e.preventDefault()
    setTestLoading(true)
    setTestResult(null)

    let parsedItems = []
    try {
      parsedItems = JSON.parse(testItems)
    } catch {
      setTestResult({ error: 'Items must be a valid JSON array, e.g. [{"menu_item_id":"uuid-here","quantity":2}]' })
      setTestLoading(false)
      return
    }

    try {
      const res = await api.post('/api/public/promotions/validate', {
        code: testCode.toUpperCase().trim(),
        table_id: testTableId.trim(),
        items: parsedItems,
      }, { skipAuth: true })
      setTestResult({ data: res.data || res })
    } catch (err) {
      setTestResult({ error: err.message || 'Validation failed.' })
    } finally {
      setTestLoading(false)
    }
  }

  // ── Field update helper ────────────────────────────────────────────────────
  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  // ── Computed summary ───────────────────────────────────────────────────────
  const activePromoCount = promotions.filter(p => {
    const badge = statusBadge(p)
    return badge.label === 'Active'
  }).length

  return (
    <div className="p-8 flex-1 flex flex-col overflow-y-auto max-w-7xl w-full mx-auto">

      {/* ── Flash Messages ─────────────────────────────────────────────── */}
      {error && (
        <div className="mb-5 p-4 rounded-xl bg-red-50 text-[#a4161a] border border-red-100 text-xs font-bold flex items-start gap-2 animate-pulse">
          <span>⚠️</span><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-5 p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-bold flex items-start gap-2">
          <span>✅</span><span>{success}</span>
        </div>
      )}

      {/* ── Stats Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        {[
          { label: 'Total Promotions', value: promotions.length, icon: '🎟️' },
          { label: 'Active Now', value: activePromoCount, icon: '✅' },
          { label: 'Inactive / Expired', value: promotions.length - activePromoCount, icon: '⛔' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-[#d3d3d3] rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.005)]">
            <span className="text-2xl">{stat.icon}</span>
            <div>
              <p className="font-outfit text-2xl font-black text-[#0b090a]">{stat.value}</p>
              <p className="text-[10px] font-black text-[#b1a7a6] uppercase tracking-widest mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Coupons & Promotions Table ─────────────────────────────────── */}
      <div className="bg-white border border-[#d3d3d3] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.005)] overflow-hidden flex-1 flex flex-col mb-8">
        {/* Table header */}
        <div className="px-6 py-5 border-b border-[#d3d3d3] flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="font-outfit text-base font-black text-[#0b090a] uppercase tracking-wider">Coupons & Promotions</h3>
            <p className="text-[10px] font-bold text-[#b1a7a6] uppercase tracking-wider mt-0.5">
              {promotions.length} promotion{promotions.length !== 1 ? 's' : ''} configured
            </p>
          </div>
          <button
            onClick={openCreate}
            className="bg-[#ba181b] hover:bg-[#a4161a] active:bg-[#660708] text-white text-xs font-black uppercase tracking-wider py-2.5 px-5 rounded-xl transition-all cursor-pointer shadow-md shadow-[#ba181b]/10 active:scale-95"
          >
            + New Promo
          </button>
        </div>

        {/* Table body */}
        {loading ? (
          <div className="p-16 flex-1 flex flex-col justify-center items-center gap-2">
            <div className="w-8 h-8 border-4 border-[#ba181b]/20 border-t-[#ba181b] rounded-full animate-spin" />
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Loading promotions...</p>
          </div>
        ) : promotions.length === 0 ? (
          <div className="p-20 flex-1 flex flex-col items-center justify-center text-center">
            <span className="text-4xl mb-4">🎟️</span>
            <p className="text-sm font-bold text-[#161a1d]">No campaigns created yet</p>
            <p className="text-xs text-[#b1a7a6] mt-2 mb-6 font-semibold max-w-xs">
              Create discount codes or auto-applied promotions to drive customer orders.
            </p>
            <button
              onClick={openCreate}
              className="bg-[#ba181b] hover:bg-[#a4161a] text-white text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl transition-colors shadow-md shadow-[#ba181b]/10"
            >
              Create First Promotion
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#d3d3d3] bg-[#f5f3f4]/45 text-[10px] font-black text-[#161a1d] tracking-widest uppercase">
                  <th className="py-4 px-6">Trigger</th>
                  <th className="py-4 px-6">Trigger Type</th>
                  <th className="py-4 px-6">Reward Type</th>
                  <th className="py-4 px-6">Reward Value</th>
                  <th className="py-4 px-6">Requirements</th>
                  <th className="py-4 px-6">Validity Date</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d3d3d3]/50 text-xs font-medium text-[#161a1d]/85 bg-white">
                {promotions.map((promo) => {
                  const badge = statusBadge(promo)
                  const rMeta = rewardMeta[promo.rewards?.reward_type] || rewardMeta.DISCOUNT_PERCENT
                  const pMeta = promoTypeMeta[promo.promo_type] || promoTypeMeta.COUPON
                  
                  // Lookup item names if applicable
                  const reqItem = menuItems.find(item => item.id === promo.requirements?.menu_item_id)
                  const rewItem = menuItems.find(item => item.id === promo.rewards?.reward_item_id)

                  return (
                    <tr key={promo.id} className="hover:bg-[#f5f3f4]/35 transition-colors">
                      {/* Trigger (Code or Title) */}
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-lg ${pMeta.color}`}>
                          {promo.title}
                        </span>
                        {promo.description && (
                          <div className="text-[10px] text-neutral-400 font-semibold mt-1 max-w-[150px] truncate" title={promo.description}>
                            {promo.description}
                          </div>
                        )}
                      </td>
                      
                      {/* Trigger Type */}
                      <td className="py-4 px-6">
                        <span className="font-semibold text-neutral-600">
                          {promo.promo_type === 'AUTO_APPLIED' ? 'Auto-Applied' : 'Coupon Code'}
                        </span>
                      </td>

                      {/* Reward Type */}
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${rMeta.color}`}>
                          {rMeta.label}
                        </span>
                      </td>

                      {/* Reward Value */}
                      <td className="py-4 px-6 font-black text-sm text-[#0b090a]">
                        {promo.rewards?.reward_type === 'DISCOUNT_PERCENT' && `${promo.rewards?.reward_value}% Off`}
                        {promo.rewards?.reward_type === 'DISCOUNT_FLAT' && `₹${promo.rewards?.reward_value} Off`}
                        {promo.rewards?.reward_type === 'FREE_ITEM' && (
                          <span className="text-xs">
                            Free {rewItem ? rewItem.name_en : 'Item'}
                          </span>
                        )}
                      </td>

                      {/* Requirements */}
                      <td className="py-4 px-6 font-semibold text-neutral-600 space-y-0.5">
                        {promo.requirements?.min_cart_amount > 0 && (
                          <div>Min spend: ₹{promo.requirements.min_cart_amount}</div>
                        )}
                        {promo.requirements?.min_quantity > 0 && (
                          <div>Min items: {promo.requirements.min_quantity}</div>
                        )}
                        {reqItem && (
                          <div className="text-[10px] text-[#ba181b]">Requires: {reqItem.name_en}</div>
                        )}
                        {!promo.requirements?.min_cart_amount && !promo.requirements?.min_quantity && !reqItem && (
                          <span className="text-[#b1a7a6]">None</span>
                        )}
                      </td>

                      {/* Validity */}
                      <td className="py-4 px-6 text-[#b1a7a6] font-bold">
                        <div>{promo.start_date ? `From ${formatDate(promo.start_date)}` : 'Any Date'}</div>
                        {promo.end_date && <div className="text-[10px] mt-0.5">To {formatDate(promo.end_date)}</div>}
                        <div className="text-[9px] text-neutral-400 mt-1 font-mono tracking-wider">
                          {promo.start_time || '00:00'} - {promo.end_time || '23:59'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right space-x-2">
                        {/* Toggle active */}
                        <button
                          onClick={() => handleToggle(promo)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                            promo.is_active
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {promo.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => openEdit(promo)}
                          className="px-3 py-1.5 rounded-lg border border-[#d3d3d3] hover:border-[#ba181b] hover:bg-white text-[#161a1d]/80 hover:text-[#ba181b] font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(promo)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-[#ba181b] font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Coupon Validator / Test Panel ─────────────────────────────────── */}
      <div className="bg-white border border-[#d3d3d3] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.005)] overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-[#d3d3d3] bg-gray-50/50 flex items-center gap-3">
          <span className="text-lg">🧪</span>
          <div>
            <h3 className="font-outfit text-base font-black text-[#0b090a] uppercase tracking-wider">Test a Coupon Code</h3>
            <p className="text-[10px] font-bold text-[#b1a7a6] uppercase tracking-wider mt-0.5">
              Simulate the public validation endpoint used at checkout.
            </p>
          </div>
        </div>
        <form onSubmit={handleTest} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">Coupon Code</label>
              <input
                type="text"
                required
                value={testCode}
                onChange={(e) => setTestCode(e.target.value)}
                placeholder="SAVE20"
                className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-mono font-bold uppercase tracking-wider focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">Table UUID</label>
              <input
                type="text"
                required
                value={testTableId}
                onChange={(e) => setTestTableId(e.target.value)}
                placeholder="e30b6df4-411a-4d2b-..."
                className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-mono font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
              Items JSON <span className="text-[#b1a7a6] normal-case font-bold text-[9px]">(array of {`{menu_item_id, quantity}`})</span>
            </label>
            <textarea
              required
              rows={3}
              value={testItems}
              onChange={(e) => setTestItems(e.target.value)}
              placeholder={`[{"menu_item_id": "uuid-here", "quantity": 2}]`}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-xs font-mono font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all resize-none font-sans"
            />
          </div>
          <button
            type="submit"
            disabled={testLoading}
            className="bg-[#ba181b] hover:bg-[#a4161a] text-white text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-[#ba181b]/10 disabled:opacity-60"
          >
            {testLoading ? 'Validating...' : 'Validate Coupon'}
          </button>

          {testResult && (
            <div className={`mt-4 p-4 rounded-xl border text-xs font-mono font-semibold leading-relaxed ${
              testResult.error
                ? 'bg-red-50 text-red-700 border-red-100'
                : 'bg-emerald-50 text-emerald-800 border-emerald-100'
            }`}>
              {testResult.error ? (
                <span>❌ {testResult.error}</span>
              ) : (
                <pre className="whitespace-pre-wrap break-all">{JSON.stringify(testResult.data, null, 2)}</pre>
              )}
            </div>
          )}
        </form>
      </div>

      {/* ── CREATE / EDIT MODAL ─────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0b090a]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#d3d3d3] w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            {/* Modal header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-outfit text-lg font-black text-[#0b090a] uppercase tracking-wider">
                {editingPromo ? 'Edit Promotion' : 'Create Promotion'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#161a1d]/60 hover:text-[#ba181b] text-sm font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-[#a4161a] border border-red-100 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Trigger Name / Title */}
              <div>
                <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                  Promotion Title / Coupon Code <span className="text-[#ba181b]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => f('title', e.target.value.toUpperCase())}
                  placeholder="SAVE20"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-mono font-bold tracking-widest uppercase focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                />
                <p className="text-[9px] text-[#b1a7a6] font-bold uppercase tracking-wider mt-1">
                  Alphanumeric only. Used as code for coupons.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => f('description', e.target.value)}
                  placeholder="Get 20% off on your bill value"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all font-sans"
                />
              </div>

              {/* Promo Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                    Campaign Type <span className="text-[#ba181b]">*</span>
                  </label>
                  <select
                    value={form.promo_type}
                    onChange={(e) => f('promo_type', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-xs font-bold focus:outline-none focus:border-[#ba181b] transition-all bg-white"
                  >
                    <option value="COUPON">Coupon Code Required</option>
                    <option value="AUTO_APPLIED">Auto Applied at Checkout</option>
                  </select>
                </div>

                {/* Active Toggle */}
                <div>
                  <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">Status</label>
                  <label className="flex items-center gap-3 cursor-pointer py-2">
                    <button
                      type="button"
                      onClick={() => f('is_active', !form.is_active)}
                      className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer ${form.is_active ? 'bg-[#ba181b]' : 'bg-gray-300'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${form.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-xs font-bold text-[#161a1d]/85">
                      {form.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Validity Period (Dates & Times) */}
              <div className="border border-[#d3d3d3]/60 rounded-xl p-4 bg-gray-50/30 space-y-3">
                <p className="text-[10px] font-black text-[#0b090a] uppercase tracking-widest border-b border-[#d3d3d3]/30 pb-1">
                  Validity Window
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Start Date</label>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => f('start_date', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-[#d3d3d3] rounded-lg text-xs font-bold focus:outline-none focus:border-[#ba181b] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">End Date</label>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => f('end_date', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-[#d3d3d3] rounded-lg text-xs font-bold focus:outline-none focus:border-[#ba181b] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Start Time</label>
                    <input
                      type="time"
                      step="1"
                      value={form.start_time}
                      onChange={(e) => f('start_time', e.target.value.length === 5 ? `${e.target.value}:00` : e.target.value)}
                      className="w-full px-3 py-2 border-2 border-[#d3d3d3] rounded-lg text-xs font-bold focus:outline-none focus:border-[#ba181b] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">End Time</label>
                    <input
                      type="time"
                      step="1"
                      value={form.end_time}
                      onChange={(e) => f('end_time', e.target.value.length === 5 ? `${e.target.value}:00` : e.target.value)}
                      className="w-full px-3 py-2 border-2 border-[#d3d3d3] rounded-lg text-xs font-bold focus:outline-none focus:border-[#ba181b] bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="border border-[#d3d3d3]/60 rounded-xl p-4 bg-gray-50/30 space-y-3">
                <p className="text-[10px] font-black text-[#0b090a] uppercase tracking-widest border-b border-[#d3d3d3]/30 pb-1">
                  Eligibility Requirements
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Min Cart Amount (₹)</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={form.min_cart_amount}
                      onChange={(e) => f('min_cart_amount', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border-2 border-[#d3d3d3] rounded-lg text-xs font-bold focus:outline-none focus:border-[#ba181b] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Min Quantity (Items)</label>
                    <input
                      type="number" min="0"
                      value={form.min_quantity}
                      onChange={(e) => f('min_quantity', e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 border-2 border-[#d3d3d3] rounded-lg text-xs font-bold focus:outline-none focus:border-[#ba181b] bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Applicable Menu Item (Optional)</label>
                  <select
                    value={form.menu_item_id}
                    onChange={(e) => f('menu_item_id', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-[#d3d3d3] rounded-lg text-xs font-bold focus:outline-none focus:border-[#ba181b] bg-white"
                  >
                    <option value="">Any Menu Item</option>
                    {menuItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name_en} {item.price ? `(₹${item.price})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rewards */}
              <div className="border border-[#d3d3d3]/60 rounded-xl p-4 bg-gray-50/30 space-y-3">
                <p className="text-[10px] font-black text-[#0b090a] uppercase tracking-widest border-b border-[#d3d3d3]/30 pb-1">
                  Rewards Details
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Reward Type</label>
                    <select
                      value={form.reward_type}
                      onChange={(e) => f('reward_type', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-[#d3d3d3] rounded-lg text-xs font-bold focus:outline-none focus:border-[#ba181b] bg-white"
                    >
                      <option value="DISCOUNT_PERCENT">Percentage discount</option>
                      <option value="DISCOUNT_FLAT">Flat rupees off</option>
                      <option value="FREE_ITEM">Free designated item</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">
                      {form.reward_type === 'DISCOUNT_PERCENT' ? 'Percentage Value (%)' : form.reward_type === 'DISCOUNT_FLAT' ? 'Flat Amount (₹)' : '—'}
                    </label>
                    <input
                      type="number" min="0" step="0.01"
                      disabled={form.reward_type === 'FREE_ITEM'}
                      value={form.reward_type === 'FREE_ITEM' ? '' : form.reward_value}
                      onChange={(e) => f('reward_value', e.target.value)}
                      placeholder={form.reward_type === 'DISCOUNT_PERCENT' ? '20' : '50'}
                      className="w-full px-3 py-2 border-2 border-[#d3d3d3] rounded-lg text-xs font-bold focus:outline-none focus:border-[#ba181b] bg-white disabled:bg-neutral-100"
                    />
                  </div>
                </div>
                {form.reward_type === 'FREE_ITEM' && (
                  <div>
                    <label className="block text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5">Free Menu Item <span className="text-[#ba181b]">*</span></label>
                    <select
                      required
                      value={form.reward_item_id}
                      onChange={(e) => f('reward_item_id', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-[#d3d3d3] rounded-lg text-xs font-bold focus:outline-none focus:border-[#ba181b] bg-white"
                    >
                      <option value="">-- Choose Free Item --</option>
                      {menuItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name_en} {item.price ? `(₹${item.price})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-[#d3d3d3] hover:bg-neutral-50 text-[#161a1d] py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#ba181b] hover:bg-[#a4161a] text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-[#ba181b]/10 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingPromo ? 'Update Promotion' : 'Create Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
