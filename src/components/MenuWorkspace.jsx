import { useState, useEffect } from 'react'
import api from '../api'

// ── SVG Icons ───────────────────────────────────────────────────────
const IconPlus = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconEdit = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IconTrash = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
)
const IconMenu = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
    <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
  </svg>
)
const IconImage = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)
const IconAlertCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

export default function MenuWorkspace({ categories, setCategories, menuItems, setMenuItems, fetchCategories, fetchMenuItems, selectedCategoryId, setSelectedCategoryId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryForm, setCategoryForm] = useState({ name_en: '', name_hi: '', sort_order: 0 })

  const [isDishModalOpen, setIsDishModalOpen] = useState(false)
  const [editingDish, setEditingDish] = useState(null)
  const [dishForm, setDishForm] = useState({
    name_en: '', name_hi: '', description_en: '', description_hi: '', price: '', image_url: '',
    is_veg: true, is_available: true, is_combo: false, sort_order: 1, category_id: '', combo_items: []
  })
  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null)
  const [shouldClearImage, setShouldClearImage] = useState(false)

  useEffect(() => {
    if (categories.length > 0 && (!selectedCategoryId || !categories.some(c => c.id === selectedCategoryId))) {
      setSelectedCategoryId(categories[0].id)
    }
  }, [categories, selectedCategoryId, setSelectedCategoryId])

  const handleSaveCategory = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editingCategory) {
        await api.put(`/api/categories/${editingCategory.id}`, categoryForm)
      } else {
        await api.post('/api/categories', categoryForm)
      }
      setIsCategoryModalOpen(false)
      setCategoryForm({ name_en: '', name_hi: '', sort_order: 0 })
      setEditingCategory(null)
      const updatedCats = await fetchCategories()
      if (!editingCategory && updatedCats?.length > 0) {
        setSelectedCategoryId(updatedCats[updatedCats.length - 1].id)
      }
    } catch (err) {
      setError(err.message || 'Failed to save category')
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Delete this category? All items inside must be removed or moved first.')) return
    setError('')
    try {
      await api.delete(`/api/categories/${categoryId}`)
      const updatedCats = await fetchCategories()
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId(updatedCats?.length > 0 ? updatedCats[0].id : null)
      }
      await fetchMenuItems()
    } catch (err) {
      setError(err.message || 'Failed to delete category. Make sure it is empty first.')
    }
  }

  const resetDishForm = (defaultCategoryId = '') => {
    setDishForm({
      name_en: '', name_hi: '', description_en: '', description_hi: '', price: '', image_url: '',
      is_veg: true, is_available: true, is_combo: false, sort_order: 1,
      category_id: defaultCategoryId || (categories.length > 0 ? categories[0].id : ''),
      combo_items: []
    })
    setSelectedImageFile(null)
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl)
    }
    setImagePreviewUrl(null)
    setShouldClearImage(false)
  }

  const handleSaveDish = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (dishForm.is_combo && (!dishForm.combo_items || dishForm.combo_items.length === 0)) {
        setError('Please select at least one menu item to build the combo meal.')
        return
      }
      if (editingDish) {
        if (selectedImageFile) {
          // Scenario A: Replacing/Uploading a new image via multipart/form-data
          const formData = new FormData()
          formData.append('name_en', dishForm.name_en)
          if (dishForm.name_hi) formData.append('name_hi', dishForm.name_hi)
          if (dishForm.description_en) formData.append('description_en', dishForm.description_en)
          if (dishForm.description_hi) formData.append('description_hi', dishForm.description_hi)
          formData.append('price', parseFloat(dishForm.price))
          formData.append('is_veg', dishForm.is_veg ? 'true' : 'false')
          formData.append('is_available', dishForm.is_available ? 'true' : 'false')
          formData.append('is_combo', dishForm.is_combo ? 'true' : 'false')
          formData.append('sort_order', parseInt(dishForm.sort_order) || 0)
          formData.append('category_id', dishForm.category_id)
          if (dishForm.is_combo && dishForm.combo_items) {
            formData.append('combo_items', JSON.stringify(dishForm.combo_items))
          }
          formData.append('image', selectedImageFile)
          await api.put(`/api/menu-items/${editingDish.id}`, formData)
        } else if (shouldClearImage) {
          // Scenario B: Clearing/Removing the image
          const payload = {
            name_en: dishForm.name_en,
            name_hi: dishForm.name_hi,
            description_en: dishForm.description_en,
            description_hi: dishForm.description_hi,
            price: parseFloat(dishForm.price),
            is_veg: dishForm.is_veg,
            is_available: dishForm.is_available,
            is_combo: dishForm.is_combo,
            sort_order: parseInt(dishForm.sort_order) || 0,
            category_id: dishForm.category_id,
            image_url: ''
          }
          if (dishForm.is_combo) payload.combo_items = dishForm.combo_items
          await api.put(`/api/menu-items/${editingDish.id}`, payload)
        } else {
          // Scenario C: Updating text fields only (no image change)
          const payload = {
            name_en: dishForm.name_en,
            name_hi: dishForm.name_hi,
            description_en: dishForm.description_en,
            description_hi: dishForm.description_hi,
            price: parseFloat(dishForm.price),
            is_veg: dishForm.is_veg,
            is_available: dishForm.is_available,
            is_combo: dishForm.is_combo,
            sort_order: parseInt(dishForm.sort_order) || 0,
            category_id: dishForm.category_id
          }
          if (dishForm.is_combo) payload.combo_items = dishForm.combo_items
          await api.put(`/api/menu-items/${editingDish.id}`, payload)
        }
      } else {
        // POST: Create dish (multipart/form-data)
        const formData = new FormData()
        formData.append('name_en', dishForm.name_en)
        if (dishForm.name_hi) formData.append('name_hi', dishForm.name_hi)
        if (dishForm.description_en) formData.append('description_en', dishForm.description_en)
        if (dishForm.description_hi) formData.append('description_hi', dishForm.description_hi)
        formData.append('price', parseFloat(dishForm.price))
        formData.append('is_veg', dishForm.is_veg ? 'true' : 'false')
        formData.append('is_available', dishForm.is_available ? 'true' : 'false')
        formData.append('is_combo', dishForm.is_combo ? 'true' : 'false')
        formData.append('sort_order', parseInt(dishForm.sort_order) || 0)
        formData.append('category_id', dishForm.category_id)
        if (dishForm.is_combo && dishForm.combo_items) {
          formData.append('combo_items', JSON.stringify(dishForm.combo_items))
        }
        if (selectedImageFile) {
          formData.append('image', selectedImageFile)
        }
        await api.post('/api/menu-items', formData)
      }
      setIsDishModalOpen(false)
      resetDishForm()
      setEditingDish(null)
      await fetchMenuItems()
    } catch (err) {
      setError(err.message || 'Failed to save dish')
    }
  }

  const handleDeleteDish = async (dishId) => {
    if (!confirm('Remove this dish from the menu?')) return
    setError('')
    try {
      await api.delete(`/api/menu-items/${dishId}`)
      await fetchMenuItems()
    } catch (err) {
      setError(err.message || 'Failed to delete dish')
    }
  }

  const handleToggleAvailability = async (dish) => {
    try {
      await api.put(`/api/menu-items/${dish.id}`, { is_available: !dish.is_available })
      await fetchMenuItems()
    } catch (err) {
      alert(err.message || 'Failed to update availability.')
    }
  }

  const activeCategory = categories.find(cat => cat.id === selectedCategoryId)
  const filteredDishes = menuItems.filter(item => item.category_id === selectedCategoryId)

  return (
    <>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="dd-page-header">
        <div>
          <h1 className="dd-page-title">Menu</h1>
          <p className="dd-page-subtitle">{categories.length} categories · {menuItems.length} items total</p>
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────── */}
      {error && (
        <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-medium flex items-start gap-2">
          <span className="shrink-0 mt-0.5"><IconAlertCircle /></span>
          <span>{error}</span>
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col overflow-y-auto space-y-4">

        {/* ── Category Tabs ────────────────────────────────────────── */}
        <div className="bg-white border rounded-xl p-4" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-wrap gap-2 items-center">
            {categories.map((cat) => {
              const isActive = selectedCategoryId === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-[#ba181b] text-white border-[#ba181b]'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                  }`}
                >
                  {cat.name_en}
                  {cat.name_hi && <span className={`ml-1 text-xs ${isActive ? 'text-red-200' : 'text-gray-400'}`}>({cat.name_hi})</span>}
                </button>
              )
            })}

            <button
              onClick={() => {
                setEditingCategory(null)
                setCategoryForm({ name_en: '', name_hi: '', sort_order: categories.length + 1 })
                setIsCategoryModalOpen(true)
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border-2 border-dashed border-gray-300 text-gray-500 hover:border-[#ba181b] hover:text-[#ba181b] transition-all cursor-pointer"
            >
              <IconPlus size={14} /> Add Category
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Click a category tab to view its dishes. Use Rename or Delete buttons to manage categories.
          </p>
        </div>

        {/* ── Dishes Table ────────────────────────────────────────── */}
        <div className="dd-card flex-1 flex flex-col min-h-[400px]">
          <div className="dd-card-header">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-900">
                {activeCategory ? activeCategory.name_en : 'No category selected'}
              </h3>
              {activeCategory && (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      setEditingCategory(activeCategory)
                      setCategoryForm({ name_en: activeCategory.name_en, name_hi: activeCategory.name_hi || '', sort_order: activeCategory.sort_order || 0 })
                      setIsCategoryModalOpen(true)
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border text-gray-600 hover:text-[#ba181b] hover:border-[#ba181b] hover:bg-red-50 transition-all cursor-pointer"
                    style={{ borderColor: 'var(--border)' }}
                    title="Rename category"
                  >
                    <IconEdit /> Rename
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(activeCategory.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                    title="Delete category"
                  >
                    <IconTrash /> Delete
                  </button>
                </div>
              )}
            </div>

            {activeCategory && (
              <button
                onClick={() => {
                  setEditingDish(null)
                  resetDishForm(activeCategory.id)
                  setIsDishModalOpen(true)
                }}
                className="dd-btn-primary"
              >
                <IconPlus size={14} /> Add Dish
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-16 flex-1 flex flex-col justify-center items-center gap-3">
              <div className="dd-spinner" />
              <p className="text-sm text-gray-400">Loading menu items...</p>
            </div>
          ) : !selectedCategoryId ? (
            <div className="p-16 flex-1 flex flex-col items-center justify-center text-center">
              <div className="text-gray-200 mb-4"><IconMenu /></div>
              <p className="text-base font-semibold text-gray-700">No categories yet</p>
              <p className="text-sm text-gray-400 mt-1 mb-5 max-w-xs">Create a category first (e.g. "Starters", "Main Course") to start adding dishes.</p>
              <button
                onClick={() => {
                  setEditingCategory(null)
                  setCategoryForm({ name_en: '', name_hi: '', sort_order: 1 })
                  setIsCategoryModalOpen(true)
                }}
                className="dd-btn-primary"
              >
                <IconPlus size={14} /> Create First Category
              </button>
            </div>
          ) : filteredDishes.length === 0 ? (
            <div className="p-16 flex-1 flex flex-col items-center justify-center text-center">
              <div className="text-gray-200 mb-4"><IconMenu /></div>
              <p className="text-base font-semibold text-gray-700">No dishes in {activeCategory?.name_en}</p>
              <p className="text-sm text-gray-400 mt-1 mb-5">Add the first dish to this category.</p>
              <button
                onClick={() => {
                  setEditingDish(null)
                  resetDishForm(selectedCategoryId)
                  setIsDishModalOpen(true)
                }}
                className="dd-btn-primary"
              >
                <IconPlus size={14} /> Add First Dish
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="dd-table">
                <thead>
                  <tr>
                    <th>Dish</th>
                    <th>Price</th>
                    <th>Type</th>
                    <th>Availability</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDishes.map((dish) => (
                    <tr key={dish.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          {dish.image_url ? (
                            <img src={dish.image_url} alt={dish.name_en} className="w-10 h-10 object-cover rounded-lg border" style={{ borderColor: 'var(--border)' }} />
                          ) : (
                            <div className="w-10 h-10 bg-gray-50 border rounded-lg flex items-center justify-center" style={{ borderColor: 'var(--border)' }}>
                              <IconImage />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{dish.name_en}</p>
                            {dish.name_hi && <p className="text-xs text-gray-400 mt-0.5">{dish.name_hi}</p>}
                            {dish.is_combo && dish.ComboComponents && (
                              <div className="text-[10px] text-gray-500 mt-1 max-w-xs leading-normal">
                                <span className="font-bold text-[#ba181b] uppercase tracking-wider" style={{ fontSize: '9px' }}>Combo Includes:</span>{' '}
                                {dish.ComboComponents.map((comp, idx) => (
                                  <span key={comp.id}>
                                    {idx > 0 ? ', ' : ''}
                                    {comp.ComboItem?.quantity || comp.quantity || 1}x {comp.name_en}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="font-semibold text-gray-900">₹{parseFloat(dish.price).toFixed(2)}</td>
                      <td>
                        <span className={`dd-badge ${dish.is_veg ? 'bg-[#f5f3f4] text-[#161a1d] border-[#d3d3d3]' : 'bg-[#f5f3f4] text-[#ba181b] border-[#d3d3d3]'}`}>
                          {dish.is_veg ? 'Veg' : 'Non-Veg'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleAvailability(dish)}
                          className={`dd-badge cursor-pointer transition-all ${
                            dish.is_available
                              ? 'bg-[#f5f3f4] text-[#ba181b] border-[#ba181b]/35 hover:bg-[#ba181b]/5'
                              : 'bg-[#f5f3f4] text-[#b1a7a6] border-[#d3d3d3] hover:bg-[#f5f3f4]/80'
                          }`}
                        >
                          {dish.is_available ? 'Available' : 'Out of Stock'}
                        </button>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingDish(dish)
                              setDishForm({
                                name_en: dish.name_en, name_hi: dish.name_hi || '',
                                description_en: dish.description_en || '', description_hi: dish.description_hi || '',
                                price: dish.price, image_url: dish.image_url || '',
                                is_veg: dish.is_veg, is_available: dish.is_available,
                                is_combo: dish.is_combo, sort_order: dish.sort_order || 1,
                                category_id: dish.category_id,
                                combo_items: dish.ComboComponents
                                  ? dish.ComboComponents.map(comp => ({
                                      item_id: comp.id,
                                      quantity: comp.ComboItem?.quantity || 1
                                    }))
                                  : []
                              })
                              setSelectedImageFile(null)
                              setImagePreviewUrl(null)
                              setShouldClearImage(false)
                              setIsDishModalOpen(true)
                            }}
                            className="dd-btn-secondary !py-1.5 !px-3 !text-xs"
                          >
                            <IconEdit /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDish(dish.id)}
                            className="dd-btn-danger !py-1.5 !px-3 !text-xs"
                          >
                            <IconTrash /> Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Category Modal ──────────────────────────────────────────── */}
      {isCategoryModalOpen && (
        <div className="dd-modal-backdrop">
          <div className="dd-modal max-w-sm dd-fade-in">
            <div className="dd-card-header">
              <h3 className="font-semibold text-gray-900">{editingCategory ? 'Rename Category' : 'Add New Category'}</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer"><IconX /></button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Category Name (English) *</label>
                <input type="text" required value={categoryForm.name_en}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name_en: e.target.value })}
                  placeholder="e.g. Starters, Main Course, Desserts"
                  className="dd-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Category Name (Hindi) — Optional</label>
                <input type="text" value={categoryForm.name_hi}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name_hi: e.target.value })}
                  placeholder="e.g. स्टार्टर्स"
                  className="dd-input" />
              </div>
              <div className="flex gap-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="dd-btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="dd-btn-primary flex-1 justify-center">{editingCategory ? 'Save Changes' : 'Add Category'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Dish Modal ──────────────────────────────────────────────── */}
      {isDishModalOpen && (
        <div className="dd-modal-backdrop">
          <div className="dd-modal max-w-lg dd-fade-in" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="dd-card-header sticky top-0">
              <h3 className="font-semibold text-gray-900">{editingDish ? 'Edit Dish' : 'Add New Dish'}</h3>
              <button onClick={() => setIsDishModalOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer"><IconX /></button>
            </div>
            <form onSubmit={handleSaveDish} className="p-5 space-y-4">

              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Name (English) *</label>
                  <input type="text" required value={dishForm.name_en}
                    onChange={(e) => setDishForm({ ...dishForm, name_en: e.target.value })}
                    placeholder="e.g. Paneer Tikka"
                    className="dd-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Name (Hindi)</label>
                  <input type="text" value={dishForm.name_hi}
                    onChange={(e) => setDishForm({ ...dishForm, name_hi: e.target.value })}
                    placeholder="e.g. पनीर टिक्का"
                    className="dd-input" />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Description (English)</label>
                  <textarea rows={2} value={dishForm.description_en}
                    onChange={(e) => setDishForm({ ...dishForm, description_en: e.target.value })}
                    placeholder="Short description..."
                    className="dd-input resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Description (Hindi)</label>
                  <textarea rows={2} value={dishForm.description_hi}
                    onChange={(e) => setDishForm({ ...dishForm, description_hi: e.target.value })}
                    placeholder="संक्षिप्त विवरण..."
                    className="dd-input resize-none" />
                </div>
              </div>

              {/* Price + Image */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Price (₹) *</label>
                  <input type="number" step="0.01" required value={dishForm.price}
                    onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                    placeholder="249"
                    className="dd-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Dish Image</label>
                  {(imagePreviewUrl || dishForm.image_url) ? (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 border rounded-lg" style={{ borderColor: 'var(--border)' }}>
                      <img
                        src={imagePreviewUrl || dishForm.image_url}
                        alt="Dish preview"
                        className="w-16 h-16 object-cover rounded border"
                        style={{ borderColor: 'var(--border)' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImageFile(null)
                          if (imagePreviewUrl) {
                            URL.revokeObjectURL(imagePreviewUrl)
                          }
                          setImagePreviewUrl(null)
                          setDishForm(prev => ({ ...prev, image_url: '' }))
                          setShouldClearImage(true)
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border border-red-200 text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                      >
                        <IconTrash size={12} /> Remove Image
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-5 cursor-pointer hover:border-[#ba181b] hover:text-[#ba181b] transition-all bg-gray-50/50">
                      <span className="text-gray-400 mb-1"><IconImage /></span>
                      <span className="text-xs font-semibold text-gray-600">Click to upload dish image</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, or WEBP</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) {
                            setSelectedImageFile(file)
                            if (imagePreviewUrl) {
                              URL.revokeObjectURL(imagePreviewUrl)
                            }
                            setImagePreviewUrl(URL.createObjectURL(file))
                            setShouldClearImage(false)
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Category *</label>
                <select value={dishForm.category_id}
                  onChange={(e) => setDishForm({ ...dishForm, category_id: e.target.value })}
                  className="dd-input">
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name_en}</option>)}
                </select>
              </div>

              {/* Flags */}
              <div className="grid grid-cols-3 gap-3 py-3 border-y" style={{ borderColor: 'var(--border)' }}>
                {[
                  { key: 'is_veg', label: 'Vegetarian' },
                  { key: 'is_available', label: 'Available Now' },
                  { key: 'is_combo', label: 'Combo Meal' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={dishForm[key]}
                      onChange={(e) => setDishForm({ ...dishForm, [key]: e.target.checked })}
                      className="w-4 h-4 rounded accent-[#ba181b] cursor-pointer" />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </label>
                ))}
              </div>

              {/* Combo Item Selection */}
              {dishForm.is_combo && (
                <div className="space-y-2 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Combo Components *
                  </label>
                  <p className="text-[10px] text-gray-400 mb-2">Select the menu items included in this combo and specify their quantities.</p>
                  
                  <select
                    onChange={(e) => {
                      const itemId = e.target.value
                      if (!itemId) return
                      setDishForm(prev => {
                        if (prev.combo_items.some(ci => ci.item_id === itemId)) return prev
                        return {
                          ...prev,
                          combo_items: [...prev.combo_items, { item_id: itemId, quantity: 1 }]
                        }
                      })
                      e.target.value = ""
                    }}
                    className="dd-input text-xs"
                  >
                    <option value="">+ Add item to combo...</option>
                    {menuItems
                      .filter(item => !item.is_combo && item.id !== editingDish?.id)
                      .map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name_en} (₹{parseFloat(item.price).toFixed(0)})
                        </option>
                      ))}
                  </select>

                  {dishForm.combo_items.length > 0 ? (
                    <div className="space-y-1.5 border rounded-lg p-3 bg-gray-50 max-h-44 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
                      {dishForm.combo_items.map((ci, idx) => {
                        const itemObj = menuItems.find(m => m.id === ci.item_id)
                        if (!itemObj) return null
                        return (
                          <div key={ci.item_id} className="flex items-center justify-between gap-3 text-xs py-1 border-b last:border-0" style={{ borderColor: 'var(--border-subtle)' }}>
                            <span className="font-semibold text-gray-700 truncate flex-1">{itemObj.name_en}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setDishForm(prev => {
                                    const next = [...prev.combo_items]
                                    const q = Math.max(1, ci.quantity - 1)
                                    next[idx] = { ...ci, quantity: q }
                                    return { ...prev, combo_items: next }
                                  })
                                }}
                                className="w-5 h-5 border rounded flex items-center justify-center bg-white text-gray-600 hover:bg-gray-100 font-bold"
                              >
                                −
                              </button>
                              <span className="w-5 text-center font-mono font-bold">{ci.quantity}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setDishForm(prev => {
                                    const next = [...prev.combo_items]
                                    next[idx] = { ...ci, quantity: ci.quantity + 1 }
                                    return { ...prev, combo_items: next }
                                  })
                                }}
                                className="w-5 h-5 border rounded flex items-center justify-center bg-white text-gray-600 hover:bg-gray-100 font-bold"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDishForm(prev => ({
                                    ...prev,
                                    combo_items: prev.combo_items.filter(item => item.item_id !== ci.item_id)
                                  }))
                                }}
                                className="p-1 text-gray-400 hover:text-red-600 cursor-pointer ml-1"
                              >
                                <IconTrash size={12} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No items added to this combo yet.</p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsDishModalOpen(false)} className="dd-btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="dd-btn-primary flex-1 justify-center">{editingDish ? 'Save Changes' : 'Add Dish'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
