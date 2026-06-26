import { useState, useEffect } from 'react'
import api from '../api'

export default function SettingsWorkspace({ user, onUserUpdate }) {
  const isOwner = user.role === 'OWNER'
  const [activeSubTab, setActiveSubTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 1. Profile State
  const [profileForm, setProfileForm] = useState({ name: '', email: '', password: '' })
  const [profileData, setProfileData] = useState(null)

  // 2. Restaurant & Address State
  const [restaurantForm, setRestaurantForm] = useState({ name: '', phone: '', logo_url: '', gst_number: '' })
  const [addressForm, setAddressForm] = useState({ street_address: '', landmark: '', area_locality: '', city: '', state: '', pincode: '' })
  const [logoPreview, setLogoPreview] = useState('')

  // 3. Staff State
  const [staffList, setStaffList] = useState([])
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null) // null for create, object for edit
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '' })

  // Clear notifications on sub-tab switch
  useEffect(() => {
    setError('')
    setSuccess('')
  }, [activeSubTab])

  // Fetch Settings Data
  const fetchSettingsData = async () => {
    setLoading(true)
    setError('')
    try {
      // 1. Fetch Profile
      const profRes = await api.get('/api/profile')
      if (profRes && profRes.data) {
        setProfileData(profRes.data)
        setProfileForm({
          name: profRes.data.name || '',
          email: profRes.data.email || '',
          password: ''
        })
      }

      // 2. Fetch Restaurant Settings
      const restRes = await api.get('/api/restaurant')
      if (restRes && restRes.data) {
        const rest = restRes.data
        setRestaurantForm({
          name: rest.name || '',
          phone: rest.phone || '',
          logo_url: rest.logo_url || '',
          gst_number: rest.gst_number || ''
        })
        setLogoPreview(rest.logo_url || '')
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

      // 3. Fetch Staff (Owner Only)
      if (isOwner) {
        const staffRes = await api.get('/api/staff')
        if (staffRes && staffRes.data) {
          setStaffList(staffRes.data)
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load settings data.')
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    fetchSettingsData()
  }, [])

  // Refetch staff if switching to staff tab
  useEffect(() => {
    if (activeSubTab === 'staff' && isOwner) {
      setLoading(true)
      api.get('/api/staff')
        .then(res => {
          if (res && res.data) setStaffList(res.data)
        })
        .catch(err => setError(err.message || 'Failed to fetch staff.'))
        .finally(() => setLoading(false))
    }
  }, [activeSubTab])

  // Handle Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (profileForm.password && profileForm.password.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }

    const payload = {
      name: profileForm.name,
      email: profileForm.email
    }
    if (profileForm.password) {
      payload.password = profileForm.password
    }

    try {
      setLoading(true)
      await api.put('/api/profile', payload)
      setSuccess('Profile updated successfully!')
      
      // Update local storage user
      const updatedUser = { ...user, name: profileForm.name, email: profileForm.email }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      if (onUserUpdate) onUserUpdate(updatedUser)

      // Refresh profile data
      const refresh = await api.get('/api/profile')
      if (refresh && refresh.data) {
        setProfileData(refresh.data)
      }
      setProfileForm(prev => ({ ...prev, password: '' }))
    } catch (err) {
      setError(err.message || 'Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Restaurant Settings Save
  const handleSaveRestaurant = async (e) => {
    e.preventDefault()
    if (!isOwner) return
    setError('')
    setSuccess('')

    try {
      setLoading(true)
      await api.put('/api/restaurant', restaurantForm)
      setSuccess('Restaurant details updated successfully!')
      
      // Update local user logo if needed
      const cached = JSON.parse(localStorage.getItem('user')) || {}
      const updatedUser = { ...cached, logo_url: restaurantForm.logo_url }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      if (onUserUpdate) onUserUpdate(updatedUser)
    } catch (err) {
      setError(err.message || 'Failed to update restaurant settings.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Restaurant Address Save
  const handleSaveAddress = async (e) => {
    e.preventDefault()
    if (!isOwner) return
    setError('')
    setSuccess('')

    const cleanPincode = addressForm.pincode.trim()
    if (!/^\d{6}$/.test(cleanPincode)) {
      setError('Pincode must be exactly 6 digits.')
      return
    }

    try {
      setLoading(true)
      await api.put('/api/restaurant/address', addressForm)
      setSuccess('Restaurant address updated successfully!')
    } catch (err) {
      setError(err.message || 'Failed to update restaurant address.')
    } finally {
      setLoading(false)
    }
  }

  // Staff Management CRUD Handlers
  const handleOpenStaffModal = (staff = null) => {
    setEditingStaff(staff)
    if (staff) {
      setStaffForm({
        name: staff.name || '',
        email: staff.email || '',
        password: '' // empty for no change
      })
    } else {
      setStaffForm({ name: '', email: '', password: '' })
    }
    setError('')
    setIsStaffModalOpen(true)
  }

  const handleSaveStaff = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!editingStaff && !staffForm.password) {
      setError('Password is required for new staff accounts.')
      return
    }
    if (staffForm.password && staffForm.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    try {
      setLoading(true)
      if (editingStaff) {
        // Edit staff member details
        const payload = { name: staffForm.name, email: staffForm.email }
        if (staffForm.password) payload.password = staffForm.password

        await api.put(`/api/staff/${editingStaff.id}`, payload)
        setSuccess('Staff details modified successfully!')
      } else {
        // Create new staff member
        await api.post('/api/staff', staffForm)
        setSuccess('Staff account created successfully!')
      }
      setIsStaffModalOpen(false)
      
      // Refresh list
      const updatedStaff = await api.get('/api/staff')
      if (updatedStaff && updatedStaff.data) {
        setStaffList(updatedStaff.data)
      }
    } catch (err) {
      setError(err.message || 'Failed to save staff member.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStaff = async (staff) => {
    if (!confirm(`Are you sure you want to delete staff member "${staff.name}"? This will revoke their access to the kitchen and order boards immediately.`)) return
    setError('')
    setSuccess('')
    try {
      setLoading(true)
      await api.delete(`/api/staff/${staff.id}`)
      setSuccess('Staff member deleted successfully.')
      setStaffList(prev => prev.filter(s => s.id !== staff.id))
    } catch (err) {
      setError(err.message || 'Failed to delete staff member.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 flex-1 flex flex-col overflow-y-auto max-w-5xl w-full mx-auto space-y-6">
      
      {/* Visual Error / Success Status Banners */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-[#a4161a] border border-red-100 text-xs font-bold leading-relaxed flex items-start gap-2 animate-pulse">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-bold leading-relaxed flex items-start gap-2">
          <span>✓</span>
          <span>{success}</span>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="bg-white border border-[#d3d3d3] rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.005)]">
        <div className="flex flex-wrap gap-2.5 items-center">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`px-4 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer border ${
              activeSubTab === 'profile'
                ? 'bg-[#ba181b] text-white border-[#ba181b] shadow-md shadow-[#ba181b]/10'
                : 'bg-[#f5f3f4] hover:bg-[#d3d3d3]/50 text-[#161a1d]/80 border-[#d3d3d3]/60'
            }`}
          >
            👤 My Profile
          </button>
          
          <button
            onClick={() => setActiveSubTab('restaurant')}
            className={`px-4 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer border ${
              activeSubTab === 'restaurant'
                ? 'bg-[#ba181b] text-white border-[#ba181b] shadow-md shadow-[#ba181b]/10'
                : 'bg-[#f5f3f4] hover:bg-[#d3d3d3]/50 text-[#161a1d]/80 border-[#d3d3d3]/60'
            }`}
          >
            🏢 Restaurant Settings
          </button>

          {isOwner && (
            <button
              onClick={() => setActiveSubTab('staff')}
              className={`px-4 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                activeSubTab === 'staff'
                  ? 'bg-[#ba181b] text-white border-[#ba181b] shadow-md shadow-[#ba181b]/10'
                  : 'bg-[#f5f3f4] hover:bg-[#d3d3d3]/50 text-[#161a1d]/80 border-[#d3d3d3]/60'
              }`}
            >
              🛎️ Staff Directory
            </button>
          )}
        </div>
      </div>

      {/* TAB CONTENTS */}
      
      {/* 1. PROFILE SECTION */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Profile form inputs */}
          <div className="md:col-span-2 bg-white border border-[#d3d3d3] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.005)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[#d3d3d3] bg-gray-50/50">
              <h3 className="font-outfit text-sm font-black text-[#0b090a] uppercase tracking-wider">
                Personal Profile Details
              </h3>
            </div>
            
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="john.doe@example.com"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                  Change Password <span className="text-neutral-400 font-normal font-sans">(Leave blank to keep unchanged)</span>
                </label>
                <input
                  type="password"
                  value={profileForm.password}
                  onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                />
              </div>

              <div className="pt-4 border-t border-[#d3d3d3]/30">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#ba181b] hover:bg-[#a4161a] active:bg-[#660708] text-white text-xs font-black uppercase tracking-wider py-3 px-6 rounded-xl transition-all cursor-pointer shadow-md shadow-[#ba181b]/10 active:scale-95 disabled:opacity-50"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>

          {/* Profile metadata info display card */}
          <div className="bg-white border border-[#d3d3d3] rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.005)] space-y-4">
            <h4 className="text-xs font-black text-[#0b090a] uppercase tracking-wider border-b border-[#d3d3d3]/30 pb-3">
              Account Metadata
            </h4>
            
            {profileData ? (
              <div className="space-y-3 text-xs font-semibold text-[#161a1d]/85">
                <div>
                  <p className="text-[9px] font-black text-[#ba181b] uppercase tracking-widest">User UUID</p>
                  <p className="font-mono text-[#0b090a] mt-0.5 break-all select-all bg-neutral-50 border p-1.5 rounded">{profileData.id}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-[#ba181b] uppercase tracking-widest">Authorized Role</p>
                  <p className="mt-0.5 inline-block bg-neutral-100 border text-[#0b090a] font-extrabold uppercase px-2 py-0.5 rounded text-[10px]">
                    {profileData.role}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-[#ba181b] uppercase tracking-widest">Registered At</p>
                  <p className="text-neutral-500 mt-0.5">
                    {new Date(profileData.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Syncing details...</p>
            )}
          </div>
        </div>
      )}

      {/* 2. RESTAURANT SETTINGS SECTION */}
      {activeSubTab === 'restaurant' && (
        <div className="space-y-6">
          {!isOwner && (
            <div className="p-4 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold leading-relaxed flex items-start gap-2">
              <span>💡</span>
              <span>Logged-in staff role limits operations. General restaurant updates and address modifications are restricted to the Owner.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            {/* Restaurant Profile Metadata Form */}
            <div className="md:col-span-2 space-y-6">
              
              {/* General Restaurant Settings Info card */}
              <div className="bg-white border border-[#d3d3d3] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.005)] overflow-hidden">
                <div className="px-6 py-5 border-b border-[#d3d3d3] bg-gray-50/50">
                  <h3 className="font-outfit text-sm font-black text-[#0b090a] uppercase tracking-wider">
                    General Restaurant Information
                  </h3>
                </div>
                
                <form onSubmit={handleSaveRestaurant} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                        Restaurant Name
                      </label>
                      <input
                        type="text"
                        required
                        disabled={!isOwner}
                        value={restaurantForm.name}
                        onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
                        placeholder="Spice Garden"
                        className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all disabled:bg-neutral-50 disabled:text-neutral-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        disabled={!isOwner}
                        value={restaurantForm.phone}
                        onChange={(e) => setRestaurantForm({ ...restaurantForm, phone: e.target.value })}
                        placeholder="+919876543210"
                        className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all disabled:bg-neutral-50 disabled:text-neutral-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                        GST Number
                      </label>
                      <input
                        type="text"
                        disabled={!isOwner}
                        value={restaurantForm.gst_number}
                        onChange={(e) => setRestaurantForm({ ...restaurantForm, gst_number: e.target.value })}
                        placeholder="29AAAAA1111A1Z1"
                        className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all disabled:bg-neutral-50 disabled:text-neutral-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                        Logo Image URL
                      </label>
                      <input
                        type="url"
                        disabled={!isOwner}
                        value={restaurantForm.logo_url}
                        onChange={(e) => {
                          setRestaurantForm({ ...restaurantForm, logo_url: e.target.value })
                          setLogoPreview(e.target.value)
                        }}
                        placeholder="https://example.com/logo.jpg"
                        className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all disabled:bg-neutral-50 disabled:text-neutral-500"
                      />
                    </div>
                  </div>

                  {isOwner && (
                    <div className="pt-4 border-t border-[#d3d3d3]/30">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#ba181b] hover:bg-[#a4161a] active:bg-[#660708] text-white text-xs font-black uppercase tracking-wider py-3 px-6 rounded-xl transition-all cursor-pointer shadow-md shadow-[#ba181b]/10 active:scale-95 disabled:opacity-50"
                      >
                        Update General Settings
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* Address Settings Form */}
              <div className="bg-white border border-[#d3d3d3] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.005)] overflow-hidden">
                <div className="px-6 py-5 border-b border-[#d3d3d3] bg-gray-50/50">
                  <h3 className="font-outfit text-sm font-black text-[#0b090a] uppercase tracking-wider">
                    Store Location & Address Details
                  </h3>
                </div>
                
                <form onSubmit={handleSaveAddress} className="p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      disabled={!isOwner}
                      value={addressForm.street_address}
                      onChange={(e) => setAddressForm({ ...addressForm, street_address: e.target.value })}
                      placeholder="123 Main Street"
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all disabled:bg-neutral-50 disabled:text-neutral-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                        Landmark
                      </label>
                      <input
                        type="text"
                        disabled={!isOwner}
                        value={addressForm.landmark}
                        onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                        placeholder="Near Central Park"
                        className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all disabled:bg-neutral-50 disabled:text-neutral-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                        Area Locality
                      </label>
                      <input
                        type="text"
                        disabled={!isOwner}
                        value={addressForm.area_locality}
                        onChange={(e) => setAddressForm({ ...addressForm, area_locality: e.target.value })}
                        placeholder="Downtown"
                        className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all disabled:bg-neutral-50 disabled:text-neutral-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        disabled={!isOwner}
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        placeholder="Bengaluru"
                        className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all disabled:bg-neutral-50 disabled:text-neutral-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        disabled={!isOwner}
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        placeholder="Karnataka"
                        className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all disabled:bg-neutral-50 disabled:text-neutral-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                        Pincode
                      </label>
                      <input
                        type="text"
                        disabled={!isOwner}
                        value={addressForm.pincode}
                        onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                        placeholder="560001"
                        className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all disabled:bg-neutral-50 disabled:text-neutral-500 font-mono"
                      />
                    </div>
                  </div>

                  {isOwner && (
                    <div className="pt-4 border-t border-[#d3d3d3]/30">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#ba181b] hover:bg-[#a4161a] active:bg-[#660708] text-white text-xs font-black uppercase tracking-wider py-3 px-6 rounded-xl transition-all cursor-pointer shadow-md shadow-[#ba181b]/10 active:scale-95 disabled:opacity-50"
                      >
                        Update Location Address
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Logo URL preview panel column */}
            <div className="bg-white border border-[#d3d3d3] rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.005)] flex flex-col items-center text-center space-y-4">
              <h4 className="text-xs font-black text-[#0b090a] uppercase tracking-wider border-b border-[#d3d3d3]/30 pb-3 w-full">
                Brand Logo Preview
              </h4>
              
              <div className="w-32 h-32 rounded-full border border-[#d3d3d3] flex items-center justify-center overflow-hidden bg-neutral-50 shadow-inner relative">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Restaurant Logo"
                    className="w-full h-full object-cover"
                    onError={() => setLogoPreview('')}
                  />
                ) : (
                  <span className="text-4xl text-neutral-300">🏢</span>
                )}
              </div>
              
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider leading-relaxed">
                Provide a valid image URL to display your outlet logo on customer menus and digital storefront banners.
              </p>
            </div>
            
          </div>
        </div>
      )}

      {/* 3. STAFF DIRECTORY SECTION */}
      {activeSubTab === 'staff' && isOwner && (
        <div className="bg-white border border-[#d3d3d3] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.005)] overflow-hidden flex-1 flex flex-col min-h-[400px]">
          {/* Header Action Bar */}
          <div className="px-6 py-5 border-b border-[#d3d3d3] flex justify-between items-center bg-gray-50/50">
            <h3 className="font-outfit text-base font-black text-[#0b090a] uppercase tracking-wider">
              Waitstaff Directory
            </h3>
            <button
              onClick={() => handleOpenStaffModal()}
              className="bg-[#ba181b] hover:bg-[#a4161a] active:bg-[#660708] text-white text-xs font-black uppercase tracking-wider py-2 px-4 rounded-xl transition-all cursor-pointer shadow-md shadow-[#ba181b]/10 active:scale-95"
            >
              + Add Staff Account
            </button>
          </div>

          {/* Staff list records */}
          {staffList.length === 0 ? (
            <div className="p-16 flex-1 flex flex-col items-center justify-center text-center">
              <span className="text-3xl mb-3">🛎️</span>
              <p className="text-sm font-bold text-[#161a1d]">No staff accounts configured</p>
              <p className="text-xs text-[#b1a7a6] mt-1 mb-6 font-semibold">Generate staff credentials so waitstaff can manage tickets and summon alerts.</p>
              <button
                onClick={() => handleOpenStaffModal()}
                className="bg-[#ba181b] hover:bg-[#a4161a] text-white text-xs font-black uppercase tracking-wider px-5 py-3 rounded-xl transition-colors shadow-md shadow-[#ba181b]/10"
              >
                Create Staff User
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#d3d3d3] bg-[#f5f3f4]/45 text-[10px] font-black text-[#161a1d] tracking-widest uppercase">
                    <th className="py-4 px-6">Staff Member</th>
                    <th className="py-4 px-6">Email Address</th>
                    <th className="py-4 px-6">Account Created</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d3d3d3]/50 text-xs font-medium text-[#161a1d]/85 bg-white">
                  {staffList.map((staff) => (
                    <tr key={staff.id} className="hover:bg-[#f5f3f4]/35 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-100 border border-[#d3d3d3] flex items-center justify-center font-bold text-neutral-500">
                            👤
                          </div>
                          <p className="font-extrabold text-sm text-[#0b090a]">{staff.name}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-neutral-600">
                        {staff.email}
                      </td>
                      <td className="py-4 px-6 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                        {new Date(staff.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleOpenStaffModal(staff)}
                          className="px-3 py-1.5 rounded-lg border border-[#d3d3d3] hover:border-[#ba181b] hover:bg-white text-[#161a1d]/80 hover:text-[#ba181b] font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(staff)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-[#ba181b] font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT STAFF DIALOG MODAL */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-[#0b090a]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#d3d3d3] w-full max-w-[400px] p-6 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-outfit text-base font-black text-[#0b090a] uppercase tracking-wider">
                {editingStaff ? 'Edit Staff Account' : 'Register Staff Account'}
              </h3>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="text-[#161a1d]/60 hover:text-[#ba181b] text-sm font-bold transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                  Staff Member Name
                </label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="Jane Staff"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                  Staff Email Address
                </label>
                <input
                  type="email"
                  required
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  placeholder="jane.staff@example.com"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                  Password {editingStaff && <span className="text-neutral-400 font-normal font-sans">(Leave blank to keep unchanged)</span>}
                </label>
                <input
                  type="password"
                  required={!editingStaff}
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-5 border-t border-[#d3d3d3]/30">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="flex-1 border border-[#d3d3d3] hover:bg-neutral-50 text-[#161a1d] py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#ba181b] hover:bg-[#a4161a] text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-[#ba181b]/10"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
