import { useState, useEffect } from 'react'
import api from '../api'

// ── SVG Icons ───────────────────────────────────────────────────────
const IconUser = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconBuilding = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="15" rx="1"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    <path d="M6 11h2M6 15h2M16 11h2M16 15h2"/>
  </svg>
)
const IconUsers = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IconAlertCircle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IconCheckCircle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)
const IconInfoCircle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)
const IconEdit = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IconTrash = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
)
const IconPlus = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconImage = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)


const TABS = [
  { key: 'profile',    label: 'My Profile',         Icon: IconUser },
  { key: 'restaurant', label: 'Restaurant Settings', Icon: IconBuilding },
  { key: 'staff',      label: 'Staff Accounts',      Icon: IconUsers, ownerOnly: true },
]

export default function SettingsWorkspace({ user, onUserUpdate, onRestaurantUpdate }) {
  const isOwner = user.role === 'OWNER'
  const [activeSubTab, setActiveSubTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [profileForm, setProfileForm] = useState({ name: '', email: '', password: '' })
  const [profileData, setProfileData] = useState(null)

  const [restaurantForm, setRestaurantForm] = useState({ name: '', phone: '', logo_url: '', gst_number: '' })
  const [addressForm, setAddressForm] = useState({ street_address: '', landmark: '', area_locality: '', city: '', state: '', pincode: '' })
  const [logoPreview, setLogoPreview] = useState('')
  const [selectedLogoFile, setSelectedLogoFile] = useState(null)
  const [shouldClearLogo, setShouldClearLogo] = useState(false)

  const [staffList, setStaffList] = useState([])
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '' })

  useEffect(() => { setError(''); setSuccess('') }, [activeSubTab])


  const fetchSettingsData = async () => {
    setLoading(true)
    setError('')
    try {
      const profRes = await api.get('/api/profile')
      if (profRes?.data) {
        setProfileData(profRes.data)
        setProfileForm({ name: profRes.data.name || '', email: profRes.data.email || '', password: '' })
      }
      const restRes = await api.get('/api/restaurant')
      if (restRes?.data) {
        const rest = restRes.data
        setRestaurantForm({ name: rest.name || '', phone: rest.phone || '', logo_url: rest.logo_url || '', gst_number: rest.gst_number || '' })
        setLogoPreview(rest.logo_url || '')
        setSelectedLogoFile(null)
        setShouldClearLogo(false)
        if (rest.Address) {
          setAddressForm({
            street_address: rest.Address.street_address || '',
            landmark: rest.Address.landmark || '',
            area_locality: rest.Address.area_locality || '',
            city: rest.Address.city || '',
            state: rest.Address.state || '',
            pincode: rest.Address.pincode || ''
          })
        }
      }
      if (isOwner) {
        const staffRes = await api.get('/api/staff')
        if (staffRes?.data) setStaffList(staffRes.data)
      }
    } catch (err) {
      setError(err.message || 'Failed to load settings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSettingsData() }, [])

  useEffect(() => {
    if (activeSubTab === 'staff' && isOwner) {
      setLoading(true)
      api.get('/api/staff')
        .then(res => { if (res?.data) setStaffList(res.data) })
        .catch(err => setError(err.message || 'Failed to fetch staff.'))
        .finally(() => setLoading(false))
    }
  }, [activeSubTab])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (profileForm.password && profileForm.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    const payload = { name: profileForm.name, email: profileForm.email }
    if (profileForm.password) payload.password = profileForm.password
    try {
      setLoading(true)
      await api.put('/api/profile', payload)
      setSuccess('Profile updated successfully.')
      const updatedUser = { ...user, name: profileForm.name, email: profileForm.email }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      if (onUserUpdate) onUserUpdate(updatedUser)
      const refresh = await api.get('/api/profile')
      if (refresh?.data) setProfileData(refresh.data)
      setProfileForm(prev => ({ ...prev, password: '' }))
    } catch (err) {
      setError(err.message || 'Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveRestaurant = async (e) => {
    e.preventDefault()
    if (!isOwner) return
    setError(''); setSuccess('')
    try {
      setLoading(true)
      let updatedRest = null
      if (selectedLogoFile) {
        // Scenario A: Replacing/Uploading restaurant logo via FormData
        const formData = new FormData()
        formData.append('name', restaurantForm.name)
        if (restaurantForm.phone) formData.append('phone', restaurantForm.phone)
        if (restaurantForm.gst_number) formData.append('gst_number', restaurantForm.gst_number)
        formData.append('logo', selectedLogoFile)
        updatedRest = await api.put('/api/restaurant', formData)
      } else if (shouldClearLogo) {
        // Scenario B: Clearing the logo
        const payload = {
          name: restaurantForm.name,
          phone: restaurantForm.phone,
          gst_number: restaurantForm.gst_number,
          logo_url: ''
        }
        updatedRest = await api.put('/api/restaurant', payload)
      } else {
        // Scenario C: Updating text fields only (no logo change)
        const payload = {
          name: restaurantForm.name,
          phone: restaurantForm.phone,
          gst_number: restaurantForm.gst_number
        }
        updatedRest = await api.put('/api/restaurant', payload)
      }
      setSuccess('Restaurant details updated.')

      // Clean up logo file states if a logo was uploaded
      if (selectedLogoFile) {
        setSelectedLogoFile(null)
      }
      setShouldClearLogo(false)

      // Update logo preview and cached user with logo_url returned from response if any
      const returnedLogoUrl = updatedRest?.data?.logo_url || ''
      setRestaurantForm(prev => ({ ...prev, logo_url: returnedLogoUrl }))
      setLogoPreview(returnedLogoUrl)

      const cached = JSON.parse(localStorage.getItem('user')) || {}
      const updatedUser = { ...cached, logo_url: returnedLogoUrl }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      if (onUserUpdate) onUserUpdate(updatedUser)
      if (onRestaurantUpdate) onRestaurantUpdate()
    } catch (err) {
      setError(err.message || 'Failed to update restaurant.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAddress = async (e) => {
    e.preventDefault()
    if (!isOwner) return
    setError(''); setSuccess('')
    if (!/^\d{6}$/.test(addressForm.pincode.trim())) {
      setError('Pincode must be exactly 6 digits.')
      return
    }
    try {
      setLoading(true)
      await api.put('/api/restaurant/address', addressForm)
      setSuccess('Address updated.')
    } catch (err) {
      setError(err.message || 'Failed to update address.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenStaffModal = (staff = null) => {
    setEditingStaff(staff)
    setStaffForm(staff ? { name: staff.name || '', email: staff.email || '', password: '' } : { name: '', email: '', password: '' })
    setError('')
    setIsStaffModalOpen(true)
  }

  const handleSaveStaff = async (e) => {
    e.preventDefault()
    setError('')
    if (!editingStaff && !staffForm.password) { setError('Password is required for new staff accounts.'); return }
    if (staffForm.password && staffForm.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    try {
      setLoading(true)
      if (editingStaff) {
        const payload = { name: staffForm.name, email: staffForm.email }
        if (staffForm.password) payload.password = staffForm.password
        await api.put(`/api/staff/${editingStaff.id}`, payload)
        setSuccess('Staff account updated.')
      } else {
        await api.post('/api/staff', staffForm)
        setSuccess('Staff account created.')
      }
      setIsStaffModalOpen(false)
      const updatedStaff = await api.get('/api/staff')
      if (updatedStaff?.data) setStaffList(updatedStaff.data)
    } catch (err) {
      setError(err.message || 'Failed to save staff.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStaff = async (staff) => {
    if (!confirm(`Remove "${staff.name}" from your team? They will immediately lose access.`)) return
    setError(''); setSuccess('')
    try {
      setLoading(true)
      await api.delete(`/api/staff/${staff.id}`)
      setSuccess('Staff account removed.')
      setStaffList(prev => prev.filter(s => s.id !== staff.id))
    } catch (err) {
      setError(err.message || 'Failed to remove staff.')
    } finally {
      setLoading(false)
    }
  }

  const tabs = TABS.filter(t => !t.ownerOnly || isOwner)

  return (
    <div className="p-6 flex-1 flex flex-col overflow-y-auto space-y-5 min-h-0">

      {/* ── Flash Messages ──────────────────────────────────────── */}
      {error && (
        <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200 text-sm font-medium flex items-start gap-2">
          <span className="shrink-0 mt-0.5"><IconAlertCircle /></span><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 rounded bg-[#f5f3f4] text-[#ba181b] border border-[#d3d3d3] text-sm font-medium flex items-start gap-2">
          <span className="shrink-0 mt-0.5"><IconCheckCircle /></span><span>{success}</span>
        </div>
      )}

      {/* ── Sub-tab Navigation ──────────────────────────────────── */}
      <div className="bg-white border rounded p-3 flex flex-wrap gap-1.5" style={{ borderColor: 'var(--border)' }}>
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveSubTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded text-sm font-medium transition-all cursor-pointer border ${
              activeSubTab === key
                ? 'bg-[#ba181b] text-white border-[#ba181b]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* ── 1. PROFILE ──────────────────────────────────────────── */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          <div className="md:col-span-2 dd-card">
            <div className="dd-card-header">
              <h3 className="font-semibold text-gray-900">Personal Details</h3>
            </div>
            <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Full Name</label>
                <input type="text" required value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="John Doe" className="dd-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Email Address</label>
                <input type="email" required value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="john@example.com" className="dd-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  New Password <span className="text-gray-400 font-normal normal-case">— Leave blank to keep current</span>
                </label>
                <input type="password" value={profileForm.password}
                  onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                  placeholder="••••••••" className="dd-input" />
              </div>
              <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <button type="submit" disabled={loading} className="dd-btn-primary">
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Account info panel */}
          <div className="dd-card p-5 space-y-4">
            <h4 className="font-semibold text-gray-900 text-sm border-b pb-3" style={{ borderColor: 'var(--border)' }}>Account Info</h4>
            {profileData ? (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-0.5">Role</p>
                  <span className={`dd-badge ${isOwner ? 'bg-[#f5f3f4] text-[#ba181b] border-[#d3d3d3]' : 'bg-[#f5f3f4] text-[#161a1d] border-[#d3d3d3]'}`}>
                    {profileData.role}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-0.5">Member Since</p>
                  <p className="text-gray-700">{new Date(profileData.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-0.5">User ID</p>
                  <p className="text-xs font-mono text-gray-400 break-all select-all bg-gray-50 border rounded p-1.5" style={{ borderColor: 'var(--border)' }}>{profileData.id}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Loading...</p>
            )}
          </div>
        </div>
      )}

      {/* ── 2. RESTAURANT ───────────────────────────────────────── */}
      {activeSubTab === 'restaurant' && (
        <div className="space-y-5">
          {!isOwner && (
            <div className="p-3 rounded bg-amber-50 border border-amber-200 text-sm text-amber-800 flex items-start gap-2">
              <span className="shrink-0 mt-0.5"><IconInfoCircle /></span>
              <span>Restaurant settings can only be changed by the Owner account.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            <div className="md:col-span-2 space-y-5">
              {/* General Info */}
              <div className="dd-card">
                <div className="dd-card-header"><h3 className="font-semibold text-gray-900">Restaurant Information</h3></div>
                <form onSubmit={handleSaveRestaurant} className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Restaurant Name</label>
                      <input type="text" required disabled={!isOwner} value={restaurantForm.name}
                        onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
                        placeholder="e.g. Spice Garden" className="dd-input" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Phone Number</label>
                      <input type="text" disabled={!isOwner} value={restaurantForm.phone}
                        onChange={(e) => setRestaurantForm({ ...restaurantForm, phone: e.target.value })}
                        placeholder="+919876543210" className="dd-input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">GST Number</label>
                      <input type="text" disabled={!isOwner} value={restaurantForm.gst_number}
                        onChange={(e) => setRestaurantForm({ ...restaurantForm, gst_number: e.target.value })}
                        placeholder="29AAAAA1111A1Z1" className="dd-input" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Restaurant Logo</label>
                      {logoPreview ? (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 border rounded-lg" style={{ borderColor: 'var(--border)' }}>
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="w-16 h-16 object-cover rounded border"
                            style={{ borderColor: 'var(--border)' }}
                          />
                          <button
                            type="button"
                            disabled={!isOwner}
                            onClick={() => {
                              setSelectedLogoFile(null)
                              setLogoPreview('')
                              setRestaurantForm(prev => ({ ...prev, logo_url: '' }))
                              setShouldClearLogo(true)
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-all cursor-pointer"
                          >
                            <IconTrash size={12} /> Remove Logo
                          </button>
                        </div>
                      ) : (
                        <label className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-5 transition-all bg-gray-50/50 ${isOwner ? 'cursor-pointer hover:border-[#ba181b] hover:text-[#ba181b]' : 'opacity-50'}`}>
                          <span className="text-gray-400 mb-1"><IconImage /></span>
                          <span className="text-xs font-semibold text-gray-600">Click to upload logo</span>
                          <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, or WEBP</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={!isOwner}
                            onChange={(e) => {
                              const file = e.target.files[0]
                              if (file) {
                                setSelectedLogoFile(file)
                                setLogoPreview(URL.createObjectURL(file))
                                setShouldClearLogo(false)
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  {isOwner && (
                    <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                      <button type="submit" disabled={loading} className="dd-btn-primary">{loading ? 'Saving...' : 'Save Restaurant Info'}</button>
                    </div>
                  )}
                </form>
              </div>

              {/* Address */}
              <div className="dd-card">
                <div className="dd-card-header"><h3 className="font-semibold text-gray-900">Location & Address</h3></div>
                <form onSubmit={handleSaveAddress} className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Street Address</label>
                    <input type="text" disabled={!isOwner} value={addressForm.street_address}
                      onChange={(e) => setAddressForm({ ...addressForm, street_address: e.target.value })}
                      placeholder="123 Main Street" className="dd-input" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Landmark</label>
                      <input type="text" disabled={!isOwner} value={addressForm.landmark}
                        onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                        placeholder="Near Central Park" className="dd-input" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Area / Locality</label>
                      <input type="text" disabled={!isOwner} value={addressForm.area_locality}
                        onChange={(e) => setAddressForm({ ...addressForm, area_locality: e.target.value })}
                        placeholder="Downtown" className="dd-input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">City</label>
                      <input type="text" disabled={!isOwner} value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        placeholder="Bengaluru" className="dd-input" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">State</label>
                      <input type="text" disabled={!isOwner} value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        placeholder="Karnataka" className="dd-input" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Pincode</label>
                      <input type="text" disabled={!isOwner} value={addressForm.pincode}
                        onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                        placeholder="560001" className="dd-input" style={{ fontFamily: 'monospace' }} />
                    </div>
                  </div>
                  {isOwner && (
                    <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                      <button type="submit" disabled={loading} className="dd-btn-primary">{loading ? 'Saving...' : 'Save Address'}</button>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Logo Preview */}
            <div className="dd-card p-5 flex flex-col items-center text-center space-y-3">
              <h4 className="font-semibold text-gray-900 text-sm w-full border-b pb-3 text-left" style={{ borderColor: 'var(--border)' }}>Logo Preview</h4>
              <div className="w-28 h-28 rounded border-2 flex items-center justify-center overflow-hidden bg-gray-50" style={{ borderColor: 'var(--border)' }}>
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" onError={() => setLogoPreview('')} />
                ) : (
                  <IconImage />
                )}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Enter an image URL in the Logo URL field. This appears on customer menus and receipts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. STAFF ────────────────────────────────────────────── */}
      {activeSubTab === 'staff' && isOwner && (
        <div className="dd-card flex-1 flex flex-col min-h-[400px]">
          <div className="dd-card-header">
            <div>
              <h3 className="font-semibold text-gray-900">Staff Accounts</h3>
              <p className="text-xs text-gray-400 mt-0.5">Staff can access the Kitchen screen</p>
            </div>
            <button onClick={() => handleOpenStaffModal()} className="dd-btn-primary">
              <IconPlus /> Add Staff
            </button>
          </div>

          {loading ? (
            <div className="p-16 flex-1 flex flex-col justify-center items-center gap-3">
              <div className="dd-spinner" />
              <p className="text-sm text-gray-400">Loading staff...</p>
            </div>
          ) : staffList.length === 0 ? (
            <div className="p-16 flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                <IconUsers size={24} />
              </div>
              <p className="text-base font-semibold text-gray-700">No staff accounts</p>
              <p className="text-sm text-gray-400 mt-1 mb-5 max-w-xs">Create accounts for your waitstaff and kitchen team.</p>
              <button onClick={() => handleOpenStaffModal()} className="dd-btn-primary"><IconPlus /> Add Staff Account</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="dd-table">
                <thead>
                  <tr>
                    <th>Staff Member</th>
                    <th>Email Address</th>
                    <th>Added On</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((staff) => (
                    <tr key={staff.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded bg-gray-100 border flex items-center justify-center font-bold text-gray-600 text-sm uppercase" style={{ borderColor: 'var(--border)' }}>
                            {(staff.name || '?')[0]}
                          </div>
                          <p className="font-semibold text-gray-900">{staff.name}</p>
                        </div>
                      </td>
                      <td className="text-gray-600">{staff.email}</td>
                      <td className="text-gray-400 text-sm">{new Date(staff.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => handleOpenStaffModal(staff)} className="dd-btn-secondary !py-1.5 !px-2.5 !text-xs">
                            <IconEdit /> Edit
                          </button>
                          <button onClick={() => handleDeleteStaff(staff)} className="dd-btn-danger !py-1.5 !px-2.5 !text-xs">
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
      )}

      {/* ── 4. BILLING ──────────────────────────────────────────── */}
      {activeSubTab === 'billing' && isOwner && (
        <div className="space-y-5">

          {/* Post-payment sync banner */}
          {syncBanner && (
            <div className="p-4 rounded bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <span>Syncing payment state with billing gateway — this usually takes a few seconds...</span>
            </div>
          )}

          {/* Current Subscription Card */}
          <div className="dd-card">
            <div className="dd-card-header">
              <div>
                <h3 className="font-semibold text-gray-900">Current Subscription</h3>
                <p className="text-xs text-gray-400 mt-0.5">Your active plan and billing cycle details</p>
              </div>
              <button onClick={fetchSubscription} disabled={subLoading}
                className="dd-btn-secondary !py-1.5 !px-3 !text-xs">
                {subLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            <div className="p-5">
              {subLoading ? (
                <div className="flex items-center gap-3 py-4">
                  <div className="dd-spinner" />
                  <span className="text-sm text-gray-400">Loading subscription details...</span>
                </div>
              ) : subscription ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 border rounded-lg p-4" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Plan</p>
                    <p className="font-bold text-gray-900">{subscription.plan}</p>
                  </div>
                  <div className="bg-gray-50 border rounded-lg p-4" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Status</p>
                    <span className={`dd-badge ${
                      subscription.status === 'ACTIVE'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-[#ba181b] border-red-200'
                    }`}>{subscription.status}</span>
                  </div>
                  <div className="bg-gray-50 border rounded-lg p-4" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Expires On</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {new Date(subscription.ends_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="bg-gray-50 border rounded-lg p-4" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Amount Paid</p>
                    <p className="font-bold text-gray-900">₹{parseFloat(subscription.amount_paid).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-3">
                    <IconCreditCard size={22} />
                  </div>
                  <p className="text-sm font-semibold text-gray-600">No active subscription found</p>
                  <p className="text-xs text-gray-400 mt-1">Subscribe below to unlock your dashboard.</p>
                </div>
              )}
            </div>
          </div>

          {/* Renew / Subscribe Card */}
          <div className="dd-card">
            <div className="dd-card-header">
              <div>
                <h3 className="font-semibold text-gray-900">Renew / Subscribe</h3>
                <p className="text-xs text-gray-400 mt-0.5">Choose a plan and complete payment via Razorpay</p>
              </div>
            </div>
            <div className="p-5 space-y-5">
              {/* Plan Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'MONTHLY', label: 'Monthly', price: '₹99', period: '/month', desc: 'Billed every 30 days' },
                  { key: 'YEARLY',  label: 'Yearly',  price: '₹999', period: '/year', desc: 'Save ~16% vs monthly' },
                ].map(plan => (
                  <button
                    key={plan.key}
                    type="button"
                    onClick={() => setSelectedPlan(plan.key)}
                    className={`text-left p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedPlan === plan.key
                        ? 'border-[#ba181b] bg-[#ba181b]/5'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900">{plan.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{plan.desc}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-lg text-gray-900">{plan.price}</span>
                        <span className="text-xs text-gray-400">{plan.period}</span>
                      </div>
                    </div>
                    {selectedPlan === plan.key && (
                      <div className="mt-2 flex items-center gap-1.5 text-[#ba181b] text-xs font-semibold">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Selected
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleRenewal}
                disabled={payLoading}
                className="dd-btn-primary w-full justify-center py-3"
              >
                {payLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Processing...</>
                ) : (
                  <><IconCreditCard size={16} /> Pay with Razorpay — {selectedPlan === 'MONTHLY' ? '₹99' : '₹999'}</>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Payments are securely processed by Razorpay. Your subscription activates within seconds of payment confirmation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Staff Modal ─────────────────────────────────────────── */}
      {isStaffModalOpen && (
        <div className="dd-modal-backdrop">
          <div className="dd-modal max-w-sm dd-fade-in">
            <div className="dd-card-header">
              <h3 className="font-semibold text-gray-900">{editingStaff ? 'Edit Staff Account' : 'Add Staff Account'}</h3>
              <button onClick={() => setIsStaffModalOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer"><IconX /></button>
            </div>
            {error && <div className="mx-5 mt-4 p-3 rounded bg-red-50 text-red-700 border border-red-200 text-sm">{error}</div>}
            <form onSubmit={handleSaveStaff} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Full Name</label>
                <input type="text" required value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="e.g. Rahul Kumar" className="dd-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Email Address</label>
                <input type="email" required value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  placeholder="rahul@restaurant.com" className="dd-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Password {editingStaff && <span className="text-gray-400 font-normal normal-case">— Leave blank to keep current</span>}
                </label>
                <input type="password" required={!editingStaff} value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  placeholder="••••••••" className="dd-input" />
              </div>
              <div className="flex gap-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <button type="button" onClick={() => setIsStaffModalOpen(false)} className="dd-btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={loading} className="dd-btn-primary flex-1 justify-center">
                  {loading ? 'Saving...' : editingStaff ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}



