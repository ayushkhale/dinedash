import { useState, useEffect } from 'react'
import api from '../api'

// ── Helpers ─────────────────────────────────────────────────────────
const rewardMeta = {
  DISCOUNT_PERCENT: { label: '% Percentage Off',  color: 'bg-violet-50 text-violet-700 border-violet-200' },
  DISCOUNT_FLAT:    { label: '₹ Flat Amount Off', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  FREE_ITEM:        { label: 'Free Item',          color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

const statusBadge = (promo) => {
  if (!promo.is_active) return { label: 'Inactive', cls: 'bg-gray-100 text-gray-500 border-gray-200' }
  const today = new Date().toISOString().split('T')[0]
  if (promo.start_date && today < promo.start_date) return { label: 'Scheduled', cls: 'bg-amber-50 text-amber-700 border-amber-200' }
  if (promo.end_date && today > promo.end_date) return { label: 'Expired', cls: 'bg-red-50 text-red-600 border-red-200' }
  return { label: 'Active', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const emptyForm = {
  title: '', description: '', promo_type: 'COUPON', is_active: true,
  start_date: '', end_date: '', start_time: '00:00:00', end_time: '23:59:59',
  min_cart_amount: '', min_quantity: '',
  menu_item_id: '',
  reward_type: 'DISCOUNT_PERCENT', reward_value: '', reward_item_id: '',
}

import { Plus, Tag, Edit2, Trash2, X, AlertCircle, CheckCircle } from 'lucide-react'

// ── SVG Icons replaced by Lucide ─────────────────────────────────────
const IconPlus = ({ size = 15 }) => <Plus size={size} />
const IconTag = () => <Tag size={36} className="text-gray-300" />
const IconTagSm = ({ size = 16 }) => <Tag size={size} />
const IconEdit = ({ size = 13 }) => <Edit2 size={size} />
const IconTrash = ({ size = 13 }) => <Trash2 size={size} />
const IconX = () => <X size={18} />
const IconAlertCircle = () => <AlertCircle size={15} />
const IconCheckCircle = () => <CheckCircle size={15} />

export default function PromotionsWorkspace() {
  const [promotions, setPromotions] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [promoRes, menuRes] = await Promise.all([
        api.get('/api/promotions'),
        api.get('/api/menu-items'),
      ])
      setPromotions(promoRes.data || promoRes || [])
      setMenuItems(menuRes.data || menuRes || [])
    } catch (err) {
      setError(err.message || 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(''), 4000)
    return () => clearTimeout(t)
  }, [success])

  const openCreate = () => {
    setEditingPromo(null)
    setForm({ ...emptyForm, start_date: new Date().toISOString().split('T')[0] })
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
        min_cart_amount: form.min_cart_amount !== '' ? parseFloat(form.min_cart_amount) : 0,
        min_quantity: form.min_quantity !== '' ? parseInt(form.min_quantity) : 0,
        menu_item_id: form.menu_item_id || null,
      },
      rewards: {
        reward_type: form.reward_type,
        reward_value: form.reward_value !== '' ? parseFloat(form.reward_value) : 0,
        reward_item_id: form.reward_item_id || null,
      }
    }
    try {
      if (editingPromo) {
        await api.put(`/api/promotions/${editingPromo.id}`, payload)
        setSuccess(`"${payload.title}" updated.`)
      } else {
        await api.post('/api/promotions', payload)
        setSuccess(`"${payload.title}" created.`)
      }
      setIsModalOpen(false)
      await fetchData()
    } catch (err) {
      setError(err.message || 'Failed to save promotion.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (promo) => {
    try {
      await api.put(`/api/promotions/${promo.id}`, {
        title: promo.title, description: promo.description, promo_type: promo.promo_type,
        is_active: !promo.is_active, start_date: promo.start_date, end_date: promo.end_date,
        start_time: promo.start_time, end_time: promo.end_time,
        requirements: promo.requirements, rewards: promo.rewards,
      })
      await fetchData()
    } catch (err) {
      setError(err.message || 'Failed to toggle.')
    }
  }

  const handleDelete = async (promo) => {
    if (!confirm(`Delete "${promo.title}"? This cannot be undone.`)) return
    try {
      await api.delete(`/api/promotions/${promo.id}`)
      setSuccess(`"${promo.title}" deleted.`)
      await fetchData()
    } catch (err) {
      setError(err.message || 'Failed to delete.')
    }
  }



  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }))
  const activePromoCount = promotions.filter(p => statusBadge(p).label === 'Active').length

  return (
    <div className="p-6 flex-1 flex flex-col overflow-y-auto space-y-5">

      {/* ── Flash Messages ──────────────────────────────────────── */}
      {error && (
        <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200 text-sm font-medium flex items-start gap-2">
          <span className="shrink-0 mt-0.5"><IconAlertCircle /></span><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-medium flex items-start gap-2">
          <span className="shrink-0 mt-0.5"><IconCheckCircle /></span><span>{success}</span>
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Promotions',   value: promotions.length,                          color: 'text-gray-900' },
          { label: 'Active Now',         value: activePromoCount,                            color: 'text-emerald-600' },
          { label: 'Inactive / Expired', value: promotions.length - activePromoCount,        color: 'text-gray-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border rounded p-4" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Promotions Table ──────────────────────────────────── */}
      <div className="dd-card flex-1 flex flex-col">
        <div className="dd-card-header">
          <div>
            <h3 className="font-semibold text-gray-900">Coupons & Promotions</h3>
            <p className="text-xs text-gray-400 mt-0.5">{promotions.length} promotion{promotions.length !== 1 ? 's' : ''} configured</p>
          </div>
          <button onClick={openCreate} className="dd-btn-primary"><IconPlus /> New Promotion</button>
        </div>

        {loading ? (
          <div className="p-16 flex-1 flex flex-col justify-center items-center gap-3">
            <div className="dd-spinner" />
            <p className="text-sm text-gray-400">Loading promotions...</p>
          </div>
        ) : promotions.length === 0 ? (
          <div className="p-20 flex-1 flex flex-col items-center justify-center text-center">
            <div className="text-gray-200 mb-4"><IconTag /></div>
            <p className="text-base font-semibold text-gray-700">No promotions yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-5 max-w-xs">Create coupon codes or automatic discounts to reward your customers.</p>
            <button onClick={openCreate} className="dd-btn-primary"><IconPlus /> Create First Promotion</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="dd-table">
              <thead>
                <tr>
                  <th>Code / Name</th>
                  <th>Type</th>
                  <th>Discount</th>
                  <th>Min. Requirements</th>
                  <th>Valid Until</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((promo) => {
                  const badge = statusBadge(promo)
                  const rMeta = rewardMeta[promo.rewards?.reward_type] || rewardMeta.DISCOUNT_PERCENT
                  const rewItem = menuItems.find(m => m.id === promo.rewards?.reward_item_id)
                  const reqItem = menuItems.find(m => m.id === promo.requirements?.menu_item_id)
                  return (
                    <tr key={promo.id}>
                      <td>
                        <p className="font-bold text-gray-900 tracking-wide font-mono">{promo.title}</p>
                        {promo.description && <p className="text-xs text-gray-400 mt-0.5 max-w-[160px] truncate">{promo.description}</p>}
                        <span className="text-[11px] font-medium text-gray-400">
                          {promo.promo_type === 'AUTO_APPLIED' ? 'Auto-applied' : 'Coupon code required'}
                        </span>
                      </td>
                      <td>
                        <span className={`dd-badge ${rMeta.color}`}>{rMeta.label}</span>
                      </td>
                      <td className="font-semibold text-gray-900">
                        {promo.rewards?.reward_type === 'DISCOUNT_PERCENT' && `${promo.rewards?.reward_value}% off`}
                        {promo.rewards?.reward_type === 'DISCOUNT_FLAT' && `₹${promo.rewards?.reward_value} off`}
                        {promo.rewards?.reward_type === 'FREE_ITEM' && `Free ${rewItem?.name_en || 'item'}`}
                      </td>
                      <td className="text-sm text-gray-500">
                        {promo.requirements?.min_cart_amount > 0 && <p>Min order: ₹{promo.requirements.min_cart_amount}</p>}
                        {promo.requirements?.min_quantity > 0 && <p>Min items: {promo.requirements.min_quantity}</p>}
                        {reqItem && <p className="text-[#ba181b] text-xs">Requires: {reqItem.name_en}</p>}
                        {!promo.requirements?.min_cart_amount && !promo.requirements?.min_quantity && !reqItem && <span className="text-gray-300">None</span>}
                      </td>
                      <td className="text-sm text-gray-500">
                        {promo.end_date ? formatDate(promo.end_date) : '—'}
                      </td>
                      <td>
                        <span className={`dd-badge ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => handleToggle(promo)} className={`dd-btn-secondary !py-1.5 !px-2.5 !text-xs ${promo.is_active ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}>
                            {promo.is_active ? 'Pause' : 'Activate'}
                          </button>
                          <button onClick={() => openEdit(promo)} className="dd-btn-secondary !py-1.5 !px-2.5 !text-xs"><IconEdit /></button>
                          <button onClick={() => handleDelete(promo)} className="dd-btn-danger !py-1.5 !px-2.5 !text-xs"><IconTrash /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>



      {/* ── Create / Edit Modal ────────────────────────────────── */}
      {isModalOpen && (
        <div className="dd-modal-backdrop">
          <div className="dd-modal max-w-lg dd-fade-in" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="dd-card-header sticky top-0">
              <h3 className="font-semibold text-gray-900">{editingPromo ? 'Edit Promotion' : 'Create Promotion'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer"><IconX /></button>
            </div>

            {error && (
              <div className="mx-5 mt-4 p-3 rounded bg-red-50 text-red-700 border border-red-200 text-sm">{error}</div>
            )}

            <form onSubmit={handleSave} className="p-5 space-y-5">
              {/* Basics */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Coupon Code / Promotion Name *
                    <span className="text-gray-400 font-normal normal-case ml-1">(e.g. SAVE20, WELCOME, DIWALI10)</span>
                  </label>
                  <input type="text" required value={form.title}
                    onChange={(e) => f('title', e.target.value.toUpperCase())}
                    placeholder="SAVE20"
                    className="dd-input font-mono uppercase tracking-widest" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Description (shown to customers)</label>
                  <input type="text" value={form.description}
                    onChange={(e) => f('description', e.target.value)}
                    placeholder="Get 20% off on your total bill"
                    className="dd-input" />
                </div>
              </div>

              {/* Type + Active */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Promotion Type *</label>
                  <select value={form.promo_type} onChange={(e) => f('promo_type', e.target.value)} className="dd-input">
                    <option value="COUPON">Customer enters a code</option>
                    <option value="AUTO_APPLIED">Applied automatically</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Status</label>
                  <label className="flex items-center gap-3 cursor-pointer mt-2">
                    <div
                      onClick={() => f('is_active', !form.is_active)}
                      className={`w-10 h-6 rounded transition-colors cursor-pointer flex items-center px-1 ${form.is_active ? 'bg-[#ba181b]' : 'bg-gray-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded shadow transition-transform ${form.is_active ? 'translate-x-4' : ''}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{form.is_active ? 'Active' : 'Inactive'}</span>
                  </label>
                </div>
              </div>

              {/* Validity Dates */}
              <div className="border rounded p-4 space-y-3" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Validity Period</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                    <input type="date" value={form.start_date} onChange={(e) => f('start_date', e.target.value)} className="dd-input" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">End Date</label>
                    <input type="date" value={form.end_date} onChange={(e) => f('end_date', e.target.value)} className="dd-input" />
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="border rounded p-4 space-y-3" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Eligibility Rules <span className="text-gray-400 font-normal normal-case">(leave blank for no restrictions)</span></p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Minimum Order Value (₹)</label>
                    <input type="number" min="0" step="0.01" value={form.min_cart_amount}
                      onChange={(e) => f('min_cart_amount', e.target.value)}
                      placeholder="0" className="dd-input" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Minimum Item Count</label>
                    <input type="number" min="0" value={form.min_quantity}
                      onChange={(e) => f('min_quantity', e.target.value)}
                      placeholder="0" className="dd-input" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Only applies when this item is ordered (Optional)</label>
                  <select value={form.menu_item_id} onChange={(e) => f('menu_item_id', e.target.value)} className="dd-input">
                    <option value="">Any item</option>
                    {menuItems.map(item => <option key={item.id} value={item.id}>{item.name_en} — ₹{parseFloat(item.price).toFixed(0)}</option>)}
                  </select>
                </div>
              </div>

              {/* Reward */}
              <div className="border rounded p-4 space-y-3" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Discount / Reward</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Discount Type</label>
                    <select value={form.reward_type} onChange={(e) => f('reward_type', e.target.value)} className="dd-input">
                      <option value="DISCOUNT_PERCENT">Percentage (e.g. 10% off)</option>
                      <option value="DISCOUNT_FLAT">Fixed amount (e.g. ₹50 off)</option>
                      <option value="FREE_ITEM">Free item</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      {form.reward_type === 'DISCOUNT_PERCENT' ? 'Percentage (%)' : form.reward_type === 'DISCOUNT_FLAT' ? 'Amount (₹)' : 'N/A'}
                    </label>
                    <input type="number" min="0" step="0.01"
                      disabled={form.reward_type === 'FREE_ITEM'}
                      value={form.reward_type === 'FREE_ITEM' ? '' : form.reward_value}
                      onChange={(e) => f('reward_value', e.target.value)}
                      placeholder={form.reward_type === 'DISCOUNT_PERCENT' ? '20' : '50'}
                      className="dd-input" />
                  </div>
                </div>
                {form.reward_type === 'FREE_ITEM' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Which free item? *</label>
                    <select required value={form.reward_item_id} onChange={(e) => f('reward_item_id', e.target.value)} className="dd-input">
                      <option value="">Choose item...</option>
                      {menuItems.map(item => <option key={item.id} value={item.id}>{item.name_en} — ₹{parseFloat(item.price).toFixed(0)}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="dd-btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="dd-btn-primary flex-1 justify-center">
                  {saving ? 'Saving...' : editingPromo ? 'Save Changes' : 'Create Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}



