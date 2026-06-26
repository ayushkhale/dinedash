import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { io } from 'socket.io-client'
import logoRed from '../assets/logored.png'
import api from '../api'
import SettingsWorkspace from '../components/SettingsWorkspace'
import PromotionsWorkspace from '../components/PromotionsWorkspace'

export default function DashboardPage() {
  const navigate = useNavigate()

  // User must be declared first — isOwner and activeTab default depend on it
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {}
    } catch (_) {
      return {}
    }
  })

  const isOwner = user?.role === 'OWNER'
  const [activeTab, setActiveTab] = useState(() => {
    // STAFF can only access their permitted tabs — default to Kitchen
    return isOwner ? 'Overview' : 'Kitchen'
  })

  // Categories & Menu Items Data States
  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null) // null for create, object for edit
  const [categoryForm, setCategoryForm] = useState({ name_en: '', name_hi: '', sort_order: 0 })

  // Dish/Menu-item Modal State
  const [isDishModalOpen, setIsDishModalOpen] = useState(false)
  const [editingDish, setEditingDish] = useState(null) // null for create, object for edit
  const [dishForm, setDishForm] = useState({
    name_en: '',
    name_hi: '',
    description_en: '',
    description_hi: '',
    price: '',
    image_url: '',
    is_veg: true,
    is_available: true,
    is_combo: false,
    sort_order: 1,
    category_id: '',
    combo_items: [] // array of { item_id, quantity }
  })

  // Table Management Data States
  const [tables, setTables] = useState([])
  const [isTableModalOpen, setIsTableModalOpen] = useState(false)
  const [editingTable, setEditingTable] = useState(null) // null for create, object for edit
  const [tableForm, setTableForm] = useState({ table_number: '', is_active: true, count: 1 })
  const [multipleFloors, setMultipleFloors] = useState(false)

  // Orders & Waiter Summoning States
  const [orders, setOrders] = useState([])
  const [waiterCalls, setWaiterCalls] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderFilter, setOrderFilter] = useState('ALL') // ALL, PENDING, PREPARING, READY, SERVED, CANCELLED
  const [orderDateFilter, setOrderDateFilter] = useState('')
  const [orderTableFilter, setOrderTableFilter] = useState('ALL')
  const [billPreviewOrder, setBillPreviewOrder] = useState(null)

  // Overview tab state
  const [selectedTable, setSelectedTable] = useState(null)
  // Fetch Categories & Dishes
  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/categories')
      const data = res.data || res || []
      setCategories(data)
      return data
    } catch (err) {
      console.error('Error fetching categories:', err)
      return []
    }
  }

  const fetchMenuItems = async () => {
    try {
      const res = await api.get('/api/menu-items')
      const data = res.data || res || []
      setMenuItems(data)
    } catch (err) {
      console.error('Error fetching menu items:', err)
    }
  }

  // Fetch Tables Data
  const fetchTables = async () => {
    try {
      const res = await api.get('/api/tables')
      const data = res.data || res || []
      setTables(data)
    } catch (err) {
      console.error('Error fetching tables:', err)
    }
  }

  // Fetch Orders & Waiter Calls
  const fetchOrders = async () => {
    try {
      const res = await api.get('/api/orders')
      const data = res.data || res || []
      setOrders(data)
    } catch (err) {
      console.error('Error fetching orders:', err)
    }
  }

  const fetchWaiterCalls = async () => {
    try {
      const res = await api.get('/api/orders/waiter/calls')
      const data = res.data || res || []
      setWaiterCalls(data.filter(c => !c.is_resolved))
    } catch (err) {
      console.error('Error fetching waiter calls:', err)
    }
  }

  // Real-time Sockets Integration
  useEffect(() => {
    const ts = () => new Date().toISOString()

    if (!user.restaurant_id) {
      console.warn(`[Socket][${ts()}] ⛔ Skipping — no restaurant_id on user`, user)
      return
    }

    const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.0.104:3005'
    console.info(`[Socket][${ts()}] 🔌 Initialising connection to: ${BASE_URL}`)
    console.info(`[Socket][${ts()}] 👤 userId: ${user.id} | restaurant_id: ${user.restaurant_id}`)

    const socketConn = io(BASE_URL, {
      transports: ['websocket'], // backend requires direct WS — no polling endpoint exposed
      query: { userId: user.id },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    // ── Core lifecycle ──────────────────────────────────────────────
    socketConn.on('connect', () => {
      const roomName = `restaurant_${user.restaurant_id}`
      console.log(`[Socket][${ts()}] ✅ Connected | socket.id: ${socketConn.id} | transport: ${socketConn.io.engine.transport.name}`)

      socketConn.emit('join_room', roomName, (ack) => {
        if (ack) {
          console.log(`[Socket][${ts()}] 🏠 Room join ACK received:`, ack)
        } else {
          console.log(`[Socket][${ts()}] 🏠 Room join emitted (no ack from server): ${roomName}`)
        }
      })
    })

    socketConn.on('disconnect', (reason) => {
      console.warn(`[Socket][${ts()}] ❌ Disconnected | reason: "${reason}"`)
      if (reason === 'io server disconnect') {
        console.info(`[Socket][${ts()}] 🔄 Server-initiated disconnect — attempting manual reconnect`)
        socketConn.connect()
      }
    })

    socketConn.on('connect_error', (err) => {
      console.error(`[Socket][${ts()}] 💥 connect_error: ${err.message}`)
      console.error(`[Socket][${ts()}]    type: ${err.type || 'n/a'} | description:`, err.description || err)
      console.error(`[Socket][${ts()}]    Current transport: ${socketConn.io.engine?.transport?.name || 'unknown'}`)
      console.error(`[Socket][${ts()}]    Target URL: ${BASE_URL}`)
    })

    socketConn.on('reconnect_attempt', (attempt) => {
      console.info(`[Socket][${ts()}] 🔁 Reconnect attempt #${attempt}`)
    })

    socketConn.on('reconnect', (attempt) => {
      console.log(`[Socket][${ts()}] ♻️  Reconnected after ${attempt} attempt(s) | socket.id: ${socketConn.id}`)
    })

    socketConn.on('reconnect_failed', () => {
      console.error(`[Socket][${ts()}] 🚫 All reconnect attempts exhausted — giving up`)
    })

    // ── Transport upgrade ───────────────────────────────────────────
    socketConn.io.engine?.on('upgrade', (transport) => {
      console.info(`[Socket][${ts()}] ⬆️  Transport upgraded to: ${transport.name}`)
    })

    socketConn.io.engine?.on('upgradeError', (err) => {
      console.warn(`[Socket][${ts()}] ⚠️  Transport upgrade failed:`, err.message)
    })

    // ── Incoming real-time events ───────────────────────────────────
    socketConn.on('new_order', (newOrder) => {
      console.log(`[Socket][${ts()}] 📦 new_order received:`, newOrder)
      setOrders((prev) => [newOrder, ...prev])
    })

    socketConn.on('waiter_call', (newCall) => {
      console.log(`[Socket][${ts()}] 🛎️  waiter_call received:`, newCall)
      setWaiterCalls((prev) => [newCall, ...prev])
    })

    socketConn.on('order_status_update', (payload) => {
      console.log(`[Socket][${ts()}] 🔄 order_status_update:`, payload)
      setOrders((prev) =>
        prev.map(ord => ord.id === payload.id ? { ...ord, status: payload.status } : ord)
      )
    })

    socketConn.on('payment_status_update', (payload) => {
      console.log(`[Socket][${ts()}] 💳 payment_status_update:`, payload)
      setOrders((prev) =>
        prev.map(ord => ord.id === payload.id ? { ...ord, payment_status: payload.payment_status } : ord)
      )
    })

    socketConn.on('waiter_call_resolved', (payload) => {
      console.log(`[Socket][${ts()}] ✔️  waiter_call_resolved:`, payload)
      setWaiterCalls((prev) => prev.filter(c => c.id !== payload.id))
    })

    // ── Catch-all for any unhandled server events (debug helper) ────
    socketConn.onAny((eventName, ...args) => {
      const knownEvents = ['connect', 'disconnect', 'connect_error', 'reconnect_attempt',
        'reconnect', 'reconnect_failed', 'new_order', 'waiter_call',
        'order_status_update', 'payment_status_update', 'waiter_call_resolved']
      if (!knownEvents.includes(eventName)) {
        console.log(`[Socket][${ts()}] 📨 Unhandled event "${eventName}":`, args)
      }
    })

    return () => {
      console.info(`[Socket][${ts()}] 🧹 Cleaning up — disconnecting socket ${socketConn.id}`)
      socketConn.disconnect()
    }
  }, [user.restaurant_id, user.id])

  useEffect(() => {
    if (activeTab === 'Overview') {
      setLoading(true)
      setError('')
      Promise.all([fetchTables(), fetchOrders(), fetchWaiterCalls()])
        .finally(() => setLoading(false))
    } else if (activeTab === 'Menu') {
      setLoading(true)
      setError('')
      Promise.all([fetchCategories(), fetchMenuItems()])
        .then(([cats]) => {
          if (cats && cats.length > 0 && !selectedCategoryId) {
            setSelectedCategoryId(cats[0].id)
          }
        })
        .finally(() => setLoading(false))
    } else if (activeTab === 'Tables & QR') {
      setLoading(true)
      setError('')
      fetchTables()
        .finally(() => setLoading(false))
    } else if (activeTab === 'Orders' || activeTab === 'Kitchen') {
      setLoading(true)
      setError('')
      Promise.all([fetchOrders(), fetchWaiterCalls()])
        .finally(() => setLoading(false))
    }
  }, [activeTab])

  // Automatically select the first category if current selection gets deleted/invalidated
  useEffect(() => {
    if (categories.length > 0 && (!selectedCategoryId || !categories.some(c => c.id === selectedCategoryId))) {
      setSelectedCategoryId(categories[0].id)
    }
  }, [categories, selectedCategoryId])

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      const storedRefreshToken = localStorage.getItem('refreshToken')
      try {
        if (storedRefreshToken) {
          await api.post('/api/auth/logout', { refreshToken: storedRefreshToken })
        }
      } catch (err) {
        console.error('Failed to log out from API:', err)
      } finally {
        window.__accessToken = null
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        navigate('/login')
      }
    }
  }

  // Category Save / Delete handlers
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
      if (!editingCategory && updatedCats.length > 0) {
        setSelectedCategoryId(updatedCats[updatedCats.length - 1].id)
      }
    } catch (err) {
      setError(err.message || 'Failed to save category')
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category? All assigned menu items must be reassigned or deleted first.')) return
    setError('')
    try {
      await api.delete(`/api/categories/${categoryId}`)
      const updatedCats = await fetchCategories()
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId(updatedCats.length > 0 ? updatedCats[0].id : null)
      }
      await fetchMenuItems()
    } catch (err) {
      setError(err.message || 'Failed to delete category. Make sure it is completely empty first.')
    }
  }

  // Dish Save / Delete handlers
  const resetDishForm = (defaultCategoryId = '') => {
    setDishForm({
      name_en: '',
      name_hi: '',
      description_en: '',
      description_hi: '',
      price: '',
      image_url: '',
      is_veg: true,
      is_available: true,
      is_combo: false,
      sort_order: 1,
      category_id: defaultCategoryId || (categories.length > 0 ? categories[0].id : ''),
      combo_items: []
    })
  }

  const handleSaveDish = async (e) => {
    e.preventDefault()
    setError('')

    const payload = {
      ...dishForm,
      price: parseFloat(dishForm.price),
      sort_order: parseInt(dishForm.sort_order)
    }

    if (!payload.is_combo) {
      delete payload.combo_items
    }

    try {
      if (editingDish) {
        await api.put(`/api/menu-items/${editingDish.id}`, payload)
      } else {
        await api.post('/api/menu-items', payload)
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
    if (!confirm('Are you sure you want to delete this menu item?')) return
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
      await api.put(`/api/menu-items/${dish.id}`, {
        is_available: !dish.is_available
      })
      await fetchMenuItems()
    } catch (err) {
      alert(err.message || 'Failed to update availability status.')
    }
  }

  // Table Add / Regen / Delete handlers
  const handleSaveTable = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editingTable) {
        // Editing — PUT with table_number and is_active
        await api.put(`/api/tables/${editingTable.id}`, {
          table_number: tableForm.table_number,
          is_active: tableForm.is_active
        })
        setIsTableModalOpen(false)
        setTableForm({ table_number: '', is_active: true, count: 1 })
        setEditingTable(null)
        await fetchTables()
      } else {
        // Creation — backend always uses { count, is_active }, auto-names tables
        // Single mode = count of 1; Bulk mode = user-specified count
        const count = parseInt(tableForm.count, 10)
        if (!count || count < 1 || count > 100) {
          setError('Please enter a valid count between 1 and 100.')
          return
        }
        // Response: { success, message, data: [...] } — data is always the array
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
    if (!confirm(`Are you sure you want to rotate the QR token for ${table.table_number}? The old QR code printout will immediately stop working.`)) return
    setError('')
    try {
      await api.put(`/api/tables/${table.id}`, {
        regenerate_qr: true
      })
      await fetchTables()
    } catch (err) {
      setError(err.message || 'Failed to regenerate QR token')
    }
  }

  const handleDeleteTable = async (table) => {
    if (!confirm(
      `Are you sure you want to delete ${table.table_number}?\n\n` +
      `⚠️ This will fail if the table has any orders — including past (served/cancelled) ones.\n` +
      `If the table has order history, deactivate it (Edit → uncheck "Active") instead of deleting it.`
    )) return
    setError('')
    try {
      await api.delete(`/api/tables/${table.id}`)
      setTables(prev => prev.filter(t => t.id !== table.id))
    } catch (err) {
      setError(
        err.message ||
        `Cannot delete ${table.table_number}. Tables with any order history (including past served or cancelled orders) cannot be deleted to preserve records. Use Edit to deactivate it instead.`
      )
    }
  }

  const handleBulkRegenerate = async (e) => {
    e.preventDefault()
    if (!confirm('Are you sure you want to regenerate QR codes for ALL configured tables? Warning: all currently printed QR codes will be invalidated.')) return
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

  // Order status actions
  const handleUpdateOrderStatus = async (orderId, targetStatus) => {
    try {
      await api.put(`/api/orders/${orderId}/status`, { status: targetStatus })
      await fetchOrders()
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: targetStatus }))
      }
    } catch (err) {
      alert(err.message || 'Failed to update status.')
    }
  }

  const handleUpdatePaymentStatus = async (orderId, targetPaymentStatus) => {
    try {
      await api.put(`/api/orders/${orderId}/payment`, { payment_status: targetPaymentStatus })
      await fetchOrders()
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, payment_status: targetPaymentStatus }))
      }
    } catch (err) {
      alert(err.message || 'Failed to update payment.')
    }
  }

  const handleResolveWaiterCall = async (callId) => {
    try {
      await api.put(`/api/orders/waiter/calls/${callId}/resolve`)
      setWaiterCalls(prev => prev.filter(c => c.id !== callId))
    } catch (err) {
      alert(err.message || 'Failed to resolve call.')
    }
  }

  // Elapsed preparation timer calculation
  const getMinutesAgo = (createdAt) => {
    const diffMs = new Date() - new Date(createdAt)
    const diffMins = Math.floor(diffMs / 60000)
    return diffMins <= 0 ? 'Just now' : `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
  }

  // Print single QR card popup
  const handlePrintCard = (table) => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR - ${table.table_number}</title>
          <style>
            body {
              font-family: sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #fff;
            }
            .card {
              border: 3px solid #ba181b;
              padding: 35px;
              border-radius: 24px;
              text-align: center;
              width: 280px;
              box-shadow: 0 8px 30px rgba(0,0,0,0.08);
            }
            h1 {
              margin: 0 0 5px 0;
              font-size: 24px;
              color: #0b090a;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            h2 {
              margin: 0 0 20px 0;
              font-size: 16px;
              color: #ba181b;
              font-weight: bold;
              text-transform: uppercase;
            }
            .qr-container {
              background: #f5f3f4;
              padding: 20px;
              border-radius: 18px;
              display: inline-block;
              margin-bottom: 20px;
              border: 1px solid #d3d3d3;
            }
            img {
              display: block;
            }
            p {
              margin: 0;
              font-size: 11px;
              color: #b1a7a6;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1.5px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${user.name || 'Spice Garden'}</h1>
            <h2>${table.table_number}</h2>
            <div class="qr-container">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(table.qr_url)}&ecc=H" width="200" height="200" />
            </div>
            <p>Scan to view menu & order</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // Print all QR cards grid sheet popup
  const handlePrintAll = () => {
    const printWindow = window.open('', '_blank')
    let cardsHtml = ''

    tables.forEach(table => {
      cardsHtml += `
        <div class="card">
          <h1>${user.name || 'Spice Garden'}</h1>
          <h2>${table.table_number}</h2>
          <div class="qr-container">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(table.qr_url)}&ecc=H" width="200" height="200" />
          </div>
          <p>Scan to view menu & order</p>
        </div>
      `
    })

    printWindow.document.write(`
      <html>
        <head>
          <title>Print All QR Cards</title>
          <style>
            body {
              font-family: sans-serif;
              margin: 30px;
              background-color: #fff;
            }
            .grid {
              display: grid;
              grid-template-cols: repeat(auto-fill, minmax(280px, 1fr));
              gap: 30px;
            }
            .card {
              border: 3px solid #ba181b;
              padding: 30px;
              border-radius: 24px;
              text-align: center;
              box-shadow: 0 4px 15px rgba(0,0,0,0.05);
              page-break-inside: avoid;
            }
            h1 {
              margin: 0 0 5px 0;
              font-size: 24px;
              color: #0b090a;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            h2 {
              margin: 0 0 20px 0;
              font-size: 16px;
              color: #ba181b;
              font-weight: bold;
              text-transform: uppercase;
            }
            .qr-container {
              background: #f5f3f4;
              padding: 20px;
              border-radius: 18px;
              display: inline-block;
              margin-bottom: 20px;
              border: 1px solid #d3d3d3;
            }
            img {
              display: block;
            }
            p {
              margin: 0;
              font-size: 11px;
              color: #b1a7a6;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1.5px;
            }
            @media print {
              .grid {
                grid-template-cols: repeat(2, 1fr);
              }
            }
          </style>
        </head>
        <body>
          <div class="grid">
            ${cardsHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const activeCategory = categories.find(cat => cat.id === selectedCategoryId)
  const filteredDishes = menuItems.filter(item => item.category_id === selectedCategoryId)

  // Filtering orders by status, date, and table
  const filteredOrders = orders.filter(order => {
    let match = true
    if (orderFilter !== 'ALL' && order.status !== orderFilter) match = false
    if (orderTableFilter !== 'ALL' && order.RestaurantTable?.table_number !== orderTableFilter && order.table_id !== orderTableFilter) match = false
    if (orderDateFilter) {
      const orderDate = new Date(order.created_at).toLocaleDateString('en-CA') // YYYY-MM-DD
      if (orderDate !== orderDateFilter) match = false
    }
    return match
  })

  const activeKitchenTickets = orders.filter(order =>
    order.status === 'PENDING' || order.status === 'PREPARING' || order.status === 'READY'
  )

  const navItems = [
    { name: 'Overview', icon: '▦' },
    { name: 'Menu', icon: '◈', ownerOnly: true },
    { name: 'Tables & QR', icon: '⊞', ownerOnly: true },
    { name: 'Orders', icon: '◎' },
    { name: 'Kitchen', icon: '◉' },
    { name: 'Promotions', icon: '🎟', ownerOnly: true },
    { name: 'Settings', icon: '◇' }
  ].filter(item => !item.ownerOnly || isOwner)

  return (
    <div
      className="min-h-screen flex font-sans antialiased overflow-hidden"
      style={{ backgroundColor: '#f5f3f4' }}
    >
      {/* 1. LIGHT-THEMED SIDEBAR */}
      <aside className="w-64 bg-white text-[#161a1d] flex flex-col justify-between shrink-0 border-r border-[#d3d3d3] z-20">
        <div>
          {/* Header & Branding */}
          <div className="p-6 border-b border-[#d3d3d3] flex flex-col gap-2">
            <img src={logoRed} alt="DineDash Logo" className="h-9 w-auto object-contain self-start" />
            <span className="text-[10px] uppercase tracking-wider text-[#b1a7a6] font-bold block mt-1">
              {user.name || 'Partner'} • Portal
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.name
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${isActive
                    ? 'bg-[#ba181b]/10 text-[#ba181b]'
                    : 'text-[#161a1d]/70 hover:text-[#161a1d] hover:bg-[#f5f3f4]'
                    }`}
                >
                  <span className="text-sm leading-none">{item.icon}</span>
                  {item.name}
                  {item.name === 'Orders' && waiterCalls.length > 0 && (
                    <span className="absolute right-3 bg-[#ba181b] text-white w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-black animate-bounce">
                      {waiterCalls.length}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Footer Area */}
        <div className="p-4 border-t border-[#d3d3d3] space-y-3 bg-white">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 border border-[#d3d3d3] hover:border-[#ba181b] hover:bg-[#ba181b]/5 hover:text-[#ba181b] text-[#161a1d]/70 text-xs font-bold py-2 px-3 rounded-lg transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
          <div className="text-center text-[9px] text-[#b1a7a6] font-bold uppercase tracking-wider">
            © 2026 DineDash
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE AREA */}
      <main className="flex-1 flex flex-col min-w-0 relative h-screen overflow-y-auto bg-[#f5f3f4]">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-[#d3d3d3] px-8 py-5 flex justify-between items-center z-10 shrink-0 sticky top-0">
          <div>
            <h1 className="font-outfit text-2xl font-bold text-[#0b090a] tracking-tight">
              {activeTab === 'Tables & QR' ? 'Tables and QR codes' : activeTab}
            </h1>
            <p className="text-[#b1a7a6] text-xs font-semibold mt-0.5">
              {activeTab === 'Menu' && `${categories.length} categories · ${menuItems.length} dishes total`}
              {activeTab === 'Tables & QR' && `${tables.length} tables configured`}
              {activeTab === 'Orders' && `${orders.length} orders total`}
              {activeTab === 'Kitchen' && `${activeKitchenTickets.length} active tickets`}
              {activeTab === 'Promotions' && 'Manage coupons and discount campaigns'}
              {activeTab !== 'Menu' && activeTab !== 'Tables & QR' && activeTab !== 'Orders' && activeTab !== 'Kitchen' && activeTab !== 'Promotions' && 'Live partner dashboard workspace'}
            </p>
          </div>

          {/* Header Action triggers */}
          {activeTab === 'Tables & QR' && (
            <div className="flex gap-3">
              <button
                onClick={handlePrintAll}
                disabled={tables.length === 0}
                className="bg-white hover:bg-neutral-50 text-[#161a1d]/80 border border-[#d3d3d3] hover:border-[#ba181b] hover:text-[#ba181b] text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                Print All QR Stickers
              </button>
              <button
                onClick={() => {
                  setEditingTable(null)
                  setTableForm({ table_number: '', is_active: true, mode: 'single', count: 5 })
                  setIsTableModalOpen(true)
                }}
                className="bg-[#ba181b] hover:bg-[#a4161a] active:bg-[#660708] text-white text-xs font-black uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-md shadow-[#ba181b]/10 active:scale-95"
              >
                + Add table
              </button>
            </div>
          )}
        </header>

        {error && (
          <div className="mx-8 mt-6 p-4 rounded-xl bg-red-50 text-[#a4161a] border border-red-100 text-xs font-bold leading-relaxed flex items-start gap-2 animate-pulse">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Dynamic tabs render switch */}

        {/* TAB: Overview */}
        {activeTab === 'Overview' && (() => {
          // Derived stats from live data
          const today = new Date().toDateString()
          const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today)
          const totalRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
          const pendingCount = orders.filter(o => o.status === 'PENDING').length
          const preparingCount = orders.filter(o => o.status === 'PREPARING').length
          const readyCount = orders.filter(o => o.status === 'READY').length
          const servedCount = todayOrders.filter(o => o.status === 'SERVED').length

          // Table occupancy — a table is "occupied" if it has a PENDING/PREPARING order, "ready" if READY
          const occupiedTableIds = new Set(
            orders.filter(o => o.status === 'PENDING' || o.status === 'PREPARING').map(o => o.table_id)
          )
          const readyTableIds = new Set(
            orders.filter(o => o.status === 'READY').map(o => o.table_id)
          )
          const freeCount = tables.filter(t => !occupiedTableIds.has(t.id) && !readyTableIds.has(t.id)).length

          // Orders for the selected table (for the side panel)
          const tableOrders = selectedTable
            ? orders.filter(o => o.table_id === selectedTable.id && ['PENDING', 'PREPARING', 'READY'].includes(o.status))
            : []

          const statCards = [
            { label: "Today's Orders", value: todayOrders.length, icon: '📋', color: 'from-violet-500 to-purple-600' },
            { label: "Today's Revenue", value: `₹${totalRevenue.toFixed(0)}`, icon: '💰', color: 'from-emerald-500 to-teal-600' },
            { label: 'Pending', value: pendingCount, icon: '🕐', color: 'from-amber-500 to-orange-500' },
            { label: 'Preparing', value: preparingCount, icon: '🍳', color: 'from-blue-500 to-indigo-600' },
            { label: 'Ready to Serve', value: readyCount, icon: '✅', color: 'from-green-500 to-emerald-600' },
            { label: 'Served Today', value: servedCount, icon: '🍽️', color: 'from-rose-500 to-[#ba181b]' },
          ]

          return (
            <div className="p-8 flex-1 flex flex-col overflow-y-auto max-w-7xl w-full mx-auto space-y-6">

              {/* KPI Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {statCards.map(card => (
                  <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-2xl p-4 text-white shadow-lg flex flex-col gap-1 relative overflow-hidden`}>
                    <div className="absolute -right-3 -top-3 text-5xl opacity-15 select-none">{card.icon}</div>
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-80">{card.label}</span>
                    <span className="text-2xl font-black font-outfit leading-none">{card.value}</span>
                  </div>
                ))}
              </div>

              {/* Waiter calls strip */}
              {waiterCalls.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {waiterCalls.map(call => (
                    <div key={call.id} className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2 text-xs font-bold animate-pulse">
                      🛎️ {call.table_number} needs a waiter
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* Table Map */}
                <div className="lg:col-span-2 bg-white border border-[#d3d3d3] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.005)] overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#d3d3d3] bg-gray-50/50 flex justify-between items-center">
                    <div>
                      <h3 className="font-outfit text-sm font-black text-[#0b090a] uppercase tracking-wider">Live Table Map</h3>
                      <p className="text-[10px] text-[#b1a7a6] font-semibold mt-0.5">Click a table to see its active order</p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span> Free {freeCount}</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#ba181b] inline-block"></span> Occupied {occupiedTableIds.size}</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span> Ready {readyTableIds.size}</span>
                    </div>
                  </div>

                  {tables.length === 0 ? (
                    <div className="p-16 text-center">
                      <span className="text-4xl">⊞</span>
                      <p className="text-sm font-bold text-[#161a1d] mt-3">No tables configured yet</p>
                      <p className="text-xs text-[#b1a7a6] font-semibold mt-1">Add tables from the Tables & QR tab</p>
                    </div>
                  ) : (
                    <div className="p-5 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))' }}>
                      {tables.map(table => {
                        const isOccupied = occupiedTableIds.has(table.id)
                        const isReady = readyTableIds.has(table.id)
                        const isFree = !isOccupied && !isReady
                        const isSelected = selectedTable?.id === table.id
                        return (
                          <button
                            key={table.id}
                            onClick={() => setSelectedTable(isSelected ? null : table)}
                            className={`relative flex flex-col items-center justify-center rounded-xl aspect-square text-center transition-all cursor-pointer border-2 ${
                              isSelected
                                ? 'scale-95 shadow-inner'
                                : 'hover:scale-105 hover:shadow-md'
                            } ${
                              isOccupied
                                ? 'bg-[#ba181b] border-[#ba181b] text-white'
                                : isReady
                                ? 'bg-amber-400 border-amber-400 text-white'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            }`}
                          >
                            {!table.is_active && (
                              <span className="absolute top-1 right-1 text-[8px] opacity-60">⊘</span>
                            )}
                            <span className="text-[10px] font-black leading-tight">{table.table_number}</span>
                            <span className={`text-[8px] font-bold uppercase tracking-wider mt-0.5 ${isOccupied ? 'text-white/70' : isReady ? 'text-white/80' : 'text-emerald-500'}`}>
                              {isOccupied ? 'Busy' : isReady ? 'Ready' : 'Free'}
                            </span>
                            {isOccupied && (
                              <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Side Panel: Table Detail or Recent Orders */}
                <div className="space-y-4">

                  {/* Table detail panel */}
                  {selectedTable ? (
                    <div className="bg-white border border-[#d3d3d3] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.005)] overflow-hidden">
                      <div className="px-5 py-4 border-b border-[#d3d3d3] flex justify-between items-center bg-gray-50/50">
                        <div>
                          <h4 className="font-outfit text-sm font-black text-[#0b090a]">{selectedTable.table_number}</h4>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${occupiedTableIds.has(selectedTable.id) ? 'text-[#ba181b]' : readyTableIds.has(selectedTable.id) ? 'text-amber-500' : 'text-emerald-600'}`}>
                            {occupiedTableIds.has(selectedTable.id) ? '● Occupied' : readyTableIds.has(selectedTable.id) ? '● Ready to Serve' : '● Free'}
                          </span>
                        </div>
                        <button onClick={() => setSelectedTable(null)} className="text-[#161a1d]/40 hover:text-[#ba181b] text-sm transition-all">✕</button>
                      </div>
                      {tableOrders.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-xs text-[#b1a7a6] font-semibold">No active orders at this table</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-[#d3d3d3]/50">
                          {tableOrders.map(order => (
                            <div key={order.id} className="p-4 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-[#161a1d] uppercase tracking-wider">#{order.order_number} · {order.customer_name}</span>
                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                  order.status === 'READY' ? 'bg-amber-100 text-amber-700' :
                                  order.status === 'PREPARING' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>{order.status}</span>
                              </div>
                              {order.OrderItems?.map(item => (
                                <div key={item.id} className="flex justify-between text-xs text-[#161a1d]/70">
                                  <span className="font-semibold">{item.MenuItem?.name_en} <span className="text-[#b1a7a6]">×{item.quantity}</span></span>
                                  <span className="font-bold">₹{parseFloat(item.total_price).toFixed(0)}</span>
                                </div>
                              ))}
                              <div className="flex justify-between pt-1 border-t border-[#d3d3d3]/40">
                                <span className="text-[10px] font-black text-[#161a1d]">Total</span>
                                <span className="text-[10px] font-black text-[#ba181b]">₹{parseFloat(order.total_amount).toFixed(0)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Recent orders feed when no table selected */
                    <div className="bg-white border border-[#d3d3d3] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.005)] overflow-hidden">
                      <div className="px-5 py-4 border-b border-[#d3d3d3] bg-gray-50/50">
                        <h4 className="font-outfit text-sm font-black text-[#0b090a] uppercase tracking-wider">Recent Orders</h4>
                      </div>
                      {orders.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-xs text-[#b1a7a6] font-semibold">No orders yet today</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-[#d3d3d3]/50">
                          {orders.slice(0, 6).map(order => (
                            <div key={order.id} className="px-5 py-3 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-extrabold text-[#0b090a]">#{order.order_number} — {order.RestaurantTable?.table_number || 'N/A'}</p>
                                <p className="text-[10px] text-[#b1a7a6] font-semibold">{order.customer_name}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-black text-[#ba181b]">₹{parseFloat(order.total_amount).toFixed(0)}</p>
                                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                                  order.status === 'SERVED' ? 'bg-emerald-100 text-emerald-700' :
                                  order.status === 'READY' ? 'bg-amber-100 text-amber-700' :
                                  order.status === 'PREPARING' ? 'bg-blue-100 text-blue-700' :
                                  order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>{order.status}</span>
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
        })()}

        {/* TAB: Promotions */}
        {activeTab === 'Promotions' && <PromotionsWorkspace />}

        {/* TAB: Menu */}
        {activeTab === 'Menu' && (
          <div className="p-8 flex-1 flex flex-col overflow-y-auto max-w-7xl w-full mx-auto">
            {/* A. CATEGORIES TAB SCROLL BAR */}
            <div className="bg-white border border-[#d3d3d3] rounded-xl p-4 mb-6 shadow-[0_2px_8px_rgba(0,0,0,0.005)]">
              <div className="flex flex-wrap gap-2.5 items-center">
                {categories.map((cat) => {
                  const isActive = selectedCategoryId === cat.id
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer border ${isActive
                        ? 'bg-[#ba181b] text-white border-[#ba181b] shadow-md shadow-[#ba181b]/10'
                        : 'bg-[#f5f3f4] hover:bg-[#d3d3d3]/50 text-[#161a1d]/80 border-[#d3d3d3]/60'
                        }`}
                    >
                      <span>{cat.name_en}</span>
                      {cat.name_hi && <span className={`text-[10px] font-normal ${isActive ? 'text-white/80' : 'text-neutral-400'}`}>({cat.name_hi})</span>}
                    </button>
                  )
                })}

                <button
                  onClick={() => {
                    setEditingCategory(null)
                    setCategoryForm({ name_en: '', name_hi: '', sort_order: categories.length + 1 })
                    setIsCategoryModalOpen(true)
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer border-2 border-dashed border-[#ba181b]/50 text-[#ba181b] hover:bg-[#ba181b]/5 bg-transparent"
                >
                  <span>+ Category</span>
                </button>
              </div>
              <p className="text-[9px] uppercase tracking-wider text-[#b1a7a6] font-bold mt-3">
                Select category tabs above to browse, edit, or append dishes.
              </p>
            </div>

            {/* B. DISH TABLE CONTAINER */}
            <div className="bg-white border border-[#d3d3d3] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.005)] overflow-hidden flex-1 flex flex-col min-h-[400px]">
              <div className="px-6 py-5 border-b border-[#d3d3d3] flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3.5">
                  <h3 className="font-outfit text-base font-black text-[#0b090a] uppercase tracking-wider">
                    {activeCategory ? activeCategory.name_en : 'No active category'}
                  </h3>
                  {activeCategory && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(activeCategory)
                          setCategoryForm({
                            name_en: activeCategory.name_en,
                            name_hi: activeCategory.name_hi || '',
                            sort_order: activeCategory.sort_order || 0
                          })
                          setIsCategoryModalOpen(true)
                        }}
                        className="text-[9px] font-bold uppercase tracking-wider text-[#161a1d]/60 hover:text-[#ba181b] hover:border-[#ba181b] transition-all border border-[#d3d3d3] px-2.5 py-1 rounded-md hover:bg-white bg-transparent"
                      >
                        ✏️ Rename
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(activeCategory.id)}
                        className="text-[9px] font-bold uppercase tracking-wider text-[#ba181b] hover:bg-red-50 transition-all border border-red-200 px-2.5 py-1 rounded-md bg-transparent"
                      >
                        🗑️ Delete Tab
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
                    className="bg-[#ba181b] hover:bg-[#a4161a] active:bg-[#660708] text-white text-xs font-black uppercase tracking-wider py-2 px-4 rounded-xl transition-all cursor-pointer shadow-md shadow-[#ba181b]/10 active:scale-95"
                  >
                    + Add dish
                  </button>
                )}
              </div>

              {loading ? (
                <div className="p-16 flex-1 flex flex-col justify-center items-center gap-2">
                  <div className="w-8 h-8 border-4 border-[#ba181b]/20 border-t-[#ba181b] rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Loading records...</p>
                </div>
              ) : !selectedCategoryId ? (
                <div className="p-16 flex-1 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl mb-3">📂</span>
                  <p className="text-sm font-bold text-[#161a1d]">No categories created yet</p>
                  <p className="text-xs text-[#b1a7a6] mt-1 mb-4 font-semibold">Categories partition your menu so guests scan and browse items easily.</p>
                  <button
                    onClick={() => {
                      setEditingCategory(null)
                      setCategoryForm({ name_en: '', name_hi: '', sort_order: 1 })
                      setIsCategoryModalOpen(true)
                    }}
                    className="bg-[#ba181b] hover:bg-[#a4161a] text-white text-xs font-black uppercase tracking-wider px-5 py-3 rounded-xl transition-colors shadow-md shadow-[#ba181b]/10"
                  >
                    Create your first category
                  </button>
                </div>
              ) : filteredDishes.length === 0 ? (
                <div className="p-16 flex-1 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl mb-3">🍲</span>
                  <p className="text-sm font-bold text-[#161a1d]">No dishes under {activeCategory?.name_en}</p>
                  <p className="text-xs text-[#b1a7a6] mt-1 mb-6 font-semibold">Start building your menu folder by creating a fresh dish.</p>
                  <button
                    onClick={() => {
                      setEditingDish(null)
                      resetDishForm(selectedCategoryId)
                      setIsDishModalOpen(true)
                    }}
                    className="bg-[#ba181b] hover:bg-[#a4161a] text-white text-xs font-black uppercase tracking-wider px-5 py-3 rounded-xl transition-colors shadow-md shadow-[#ba181b]/10"
                  >
                    Add Dish to Category
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto flex-1">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#d3d3d3] bg-[#f5f3f4]/45 text-[10px] font-black text-[#161a1d] tracking-widest uppercase">
                        <th className="py-4 px-6 w-12">
                          <input type="checkbox" className="rounded border-gray-300" />
                        </th>
                        <th className="py-4 px-6">Dish</th>
                        <th className="py-4 px-6">Price</th>
                        <th className="py-4 px-6">Type</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d3d3d3]/50 text-xs font-medium text-[#161a1d]/85 bg-white">
                      {filteredDishes.map((dish) => (
                        <tr key={dish.id} className="hover:bg-[#f5f3f4]/35 transition-colors">
                          <td className="py-4.5 px-6">
                            <input type="checkbox" className="rounded border-gray-300" />
                          </td>
                          <td className="py-4.5 px-6">
                            <div className="flex items-center gap-3.5">
                              {dish.image_url ? (
                                <img src={dish.image_url} alt={dish.name_en} className="w-11 h-11 object-cover rounded-xl border border-[#d3d3d3]" />
                              ) : (
                                <div className="w-11 h-11 bg-neutral-100 border border-[#d3d3d3] rounded-xl flex items-center justify-center text-lg shadow-inner">
                                  🍲
                                </div>
                              )}
                              <div>
                                <p className="font-extrabold text-sm text-[#0b090a]">{dish.name_en}</p>
                                {dish.name_hi && <p className="text-[10px] text-[#b1a7a6] mt-0.5 font-bold uppercase tracking-wider">{dish.name_hi}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="py-4.5 px-6 font-black text-sm text-[#0b090a]">
                            ₹{parseFloat(dish.price).toFixed(2)}
                          </td>
                          <td className="py-4.5 px-6">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${dish.is_veg
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-red-50 text-[#ba181b] border-red-100'
                              }`}>
                              {dish.is_veg ? 'Veg' : 'Non-Veg'}
                            </span>
                          </td>
                          <td className="py-4.5 px-6">
                            <button
                              onClick={() => handleToggleAvailability(dish)}
                              className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase transition-all cursor-pointer border ${dish.is_available
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200/70'
                                : 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200/70'
                                }`}
                            >
                              {dish.is_available ? 'Available' : 'Out of Stock'}
                            </button>
                          </td>
                          <td className="py-4.5 px-6 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingDish(dish)
                                setDishForm({
                                  name_en: dish.name_en,
                                  name_hi: dish.name_hi || '',
                                  description_en: dish.description_en || '',
                                  description_hi: dish.description_hi || '',
                                  price: dish.price,
                                  image_url: dish.image_url || '',
                                  is_veg: dish.is_veg,
                                  is_available: dish.is_available,
                                  is_combo: dish.is_combo,
                                  sort_order: dish.sort_order || 1,
                                  category_id: dish.category_id,
                                  combo_items: dish.combo_items || []
                                })
                                setIsDishModalOpen(true)
                              }}
                              className="px-3.5 py-2 rounded-xl border border-[#d3d3d3] hover:border-[#ba181b] hover:bg-white text-[#161a1d]/80 hover:text-[#ba181b] font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteDish(dish.id)}
                              className="px-3.5 py-2 rounded-xl border border-red-200 hover:bg-red-50 text-[#ba181b] font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer"
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
          </div>
        )}

        {/* TAB: Tables & QR */}
        {activeTab === 'Tables & QR' && (
          <div className="p-8 flex-1 flex flex-col overflow-y-auto max-w-7xl w-full mx-auto">
            <div className="bg-white border border-[#d3d3d3] rounded-xl p-5 mb-6 shadow-[0_2px_8px_rgba(0,0,0,0.005)] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setMultipleFloors(!multipleFloors)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${multipleFloors ? 'bg-[#ba181b]' : 'bg-gray-300'
                    }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${multipleFloors ? 'translate-x-6' : 'translate-x-0'
                      }`}
                  ></div>
                </button>
                <div>
                  <h4 className="text-xs font-black text-[#0b090a] uppercase tracking-wider">
                    My restaurant has multiple floors / halls
                  </h4>
                  <p className="text-[10px] font-bold text-[#b1a7a6] mt-0.5 uppercase tracking-wide">
                    {multipleFloors ? 'On — group and manage tables by sections' : 'Off — all tables in one place, numbered sequentially'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#d3d3d3] rounded-xl p-5 mb-6 shadow-[0_2px_8px_rgba(0,0,0,0.005)]">
              <h4 className="text-xs font-black text-[#0b090a] uppercase tracking-wider mb-2">
                Regenerate all tables
              </h4>
              <p className="text-[10px] font-bold text-[#b1a7a6] mb-4 uppercase tracking-wide">
                Replaces ALL existing QR codes. Warning: this revokes all printed codes immediately.
              </p>
              <form onSubmit={handleBulkRegenerate} className="flex gap-3 items-center max-w-md">
                <input
                  type="number"
                  min={1}
                  readOnly
                  value={tables.length}
                  className="w-20 px-3 py-2 border-2 border-[#d3d3d3] rounded-xl text-center text-xs font-black bg-gray-50 text-[#161a1d]/60 font-mono focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || tables.length === 0}
                  className="bg-[#ba181b] hover:bg-[#a4161a] active:bg-[#660708] text-white text-[10px] font-black uppercase tracking-wider px-5 py-3.5 rounded-xl transition-all cursor-pointer shadow-md shadow-[#ba181b]/10 disabled:opacity-50"
                >
                  Regenerate
                </button>
              </form>
              <p className="text-[10px] text-[#ba181b] font-bold mt-2 uppercase tracking-wide">
                * Warning: replaces QR codes in all sections.
              </p>
            </div>

            {loading ? (
              <div className="p-16 flex-1 flex flex-col justify-center items-center gap-2">
                <div className="w-8 h-8 border-4 border-[#ba181b]/20 border-t-[#ba181b] rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Loading tables...</p>
              </div>
            ) : tables.length === 0 ? (
              <div className="p-16 bg-white border border-[#d3d3d3] rounded-xl flex-1 flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.005)] min-h-[300px]">
                <span className="text-3xl mb-3">⊞</span>
                <p className="text-sm font-bold text-[#161a1d]">No tables configured yet</p>
                <p className="text-xs text-[#b1a7a6] mt-1 mb-6 font-semibold">Generate table records to obtain printable QR codes for customer ordering.</p>
                <button
                  onClick={() => {
                    setEditingTable(null)
                    setTableForm({ table_number: '', is_active: true })
                    setIsTableModalOpen(true)
                  }}
                  className="bg-[#ba181b] hover:bg-[#a4161a] text-white text-xs font-black uppercase tracking-wider px-5 py-3.5 rounded-xl transition-colors shadow-md shadow-[#ba181b]/10"
                >
                  Configure first table
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {tables.map((table) => (
                  <div
                    key={table.id}
                    className="bg-white border border-[#d3d3d3] rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.005)] flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                  >
                    <div className="flex justify-between items-center mb-4 border-b border-[#d3d3d3]/30 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <div>
                          <p className="text-[10px] font-black text-[#0b090a] uppercase tracking-wider">{user.name || 'Spice Garden'}</p>
                          <p className="text-[8px] font-bold text-[#b1a7a6] uppercase tracking-widest mt-0.5">Dine-in Experience</p>
                        </div>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#ba181b] bg-[#ba181b]/10 px-2 py-0.5 rounded">
                        {table.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className="bg-gradient-to-r from-[#ba181b] to-[#e5383b] text-white p-4 rounded-xl flex justify-between items-center mb-4">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-red-100">Table</p>
                        <p className="font-outfit text-2xl font-black leading-none mt-1">{table.table_number}</p>
                      </div>
                      <div className="bg-[#0b090a] text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5">
                        <span>☕</span>
                        <span>Dine In</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-[#d3d3d3]/60 rounded-xl p-4 flex flex-col items-center justify-center my-3 relative shadow-inner">
                      <p className="text-[10px] font-black text-[#0b090a] uppercase tracking-wider mb-1">Scan to Order</p>
                      <p className="text-[8px] font-bold text-[#b1a7a6] uppercase tracking-wider mb-3">Explore menu and place order instantly</p>

                      <div className="p-2 bg-white rounded-xl border border-[#d3d3d3] shadow-sm relative">
                        <QRCodeSVG
                          value={table.qr_url}
                          size={130}
                          level="H"
                          includeMargin={true}
                        />
                      </div>

                      <span className="inline-flex items-center gap-1 bg-white border border-[#d3d3d3] rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-[#161a1d]/60 mt-3 shadow-sm">
                        📷 Point camera to scan
                      </span>
                    </div>

                    <div className="border-t border-[#d3d3d3]/30 pt-4 flex flex-col gap-2 mt-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePrintCard(table)}
                          className="flex-1 bg-white hover:bg-neutral-50 text-[#161a1d]/80 border border-[#d3d3d3] hover:border-[#ba181b] hover:text-[#ba181b] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer text-center"
                        >
                          Print
                        </button>
                        <button
                          onClick={() => handleRegenerateQr(table)}
                          className="flex-1 bg-white hover:bg-neutral-50 text-[#161a1d]/80 border border-[#d3d3d3] hover:border-[#ba181b] hover:text-[#ba181b] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer text-center"
                        >
                          Regen
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteTable(table)}
                        className="w-full text-center text-[9px] font-bold text-[#ba181b] hover:underline uppercase tracking-wider mt-1 cursor-pointer"
                      >
                        Remove Table
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Orders */}
        {activeTab === 'Orders' && (() => {
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

          // Table options for filter
          const uniqueTables = [...new Set(orders.map(o => o.RestaurantTable?.table_number).filter(Boolean))]

          return (
            <div className="p-8 flex-1 flex flex-col overflow-y-auto max-w-7xl w-full mx-auto space-y-6 bg-[#f5f3f4]">
              
              {/* 1. WAITER ASSISTANCE REQUESTS ALERTS */}
              {waiterCalls.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-[10px] font-black text-[#ba181b] uppercase tracking-widest">
                    ⚠️ Active Waiter Summon Requests ({waiterCalls.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {waiterCalls.map((call) => (
                      <div
                        key={call.id}
                        className="bg-red-50 border border-red-200 rounded-xl p-4 flex justify-between items-center shadow-sm animate-pulse"
                      >
                        <div>
                          <p className="text-xs font-black text-[#a4161a] uppercase tracking-wide">
                            🛎️ {call.table_number} summoned waiter
                          </p>
                          <p className="text-[9px] text-[#b1a7a6] font-bold uppercase tracking-wider mt-1">
                            KOT #{call.order_number} · {getMinutesAgo(call.created_at)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleResolveWaiterCall(call.id)}
                          className="bg-[#ba181b] hover:bg-[#a4161a] text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Resolve
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-[#161a1d]">Order history</h2>
                  <p className="text-sm text-[#b1a7a6] font-semibold mt-1">Updates live as orders come in</p>
                </div>
                <button 
                  onClick={() => fetchOrders()}
                  className="px-6 py-2.5 rounded-xl border border-[#d3d3d3] text-sm font-black text-[#161a1d] hover:bg-gray-50 transition-colors bg-white shadow-sm"
                >
                  Refresh
                </button>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-[#d3d3d3] rounded-2xl p-6 shadow-sm">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Today's Revenue</p>
                  <p className="font-outfit text-3xl font-black text-[#161a1d] mb-1">Rs.{todayRev.toFixed(0)}</p>
                  <p className="text-[10px] font-black text-[#ba181b] uppercase tracking-widest">{todayOrders.length} Orders</p>
                </div>
                <div className="bg-white border border-[#d3d3d3] rounded-2xl p-6 shadow-sm">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">This Week</p>
                  <p className="font-outfit text-3xl font-black text-[#161a1d] mb-1">Rs.{weekRev.toFixed(0)}</p>
                  <p className="text-[10px] font-black text-[#ba181b] uppercase tracking-widest">{weekOrders.length} Orders</p>
                </div>
                <div className="bg-white border border-[#d3d3d3] rounded-2xl p-6 shadow-sm">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">This Month</p>
                  <p className="font-outfit text-3xl font-black text-[#161a1d] mb-1">Rs.{monthRev.toFixed(0)}</p>
                  <p className="text-[10px] font-black text-[#ba181b] uppercase tracking-widest">{monthOrders.length} Orders</p>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white border border-[#d3d3d3] rounded-2xl p-5 shadow-sm flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Date</label>
                  <input 
                    type="date" 
                    value={orderDateFilter}
                    onChange={(e) => setOrderDateFilter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b]"
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Table</label>
                  <select 
                    value={orderTableFilter}
                    onChange={(e) => setOrderTableFilter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] appearance-none bg-white"
                  >
                    <option value="ALL">All tables</option>
                    {uniqueTables.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Status</label>
                  <select 
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] appearance-none bg-white"
                  >
                    <option value="ALL">All</option>
                    <option value="PENDING">Pending</option>
                    <option value="PREPARING">Preparing</option>
                    <option value="READY">Ready</option>
                    <option value="SERVED">Served</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <button 
                  onClick={() => { setOrderDateFilter(''); setOrderTableFilter('ALL'); setOrderFilter('ALL'); }}
                  className="px-6 py-2.5 rounded-xl border border-[#d3d3d3] text-sm font-black text-[#161a1d] hover:bg-gray-50 transition-colors bg-white shadow-sm"
                >
                  Clear
                </button>
              </div>

              {/* Table */}
              <div className="bg-[#eeece8] border border-[#d3d3d3]/60 rounded-2xl overflow-hidden shadow-inner">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#d3d3d3]/80">
                        <th className="py-4 px-6 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Order</th>
                        <th className="py-4 px-6 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Table</th>
                        <th className="py-4 px-6 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Customer</th>
                        <th className="py-4 px-6 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Items</th>
                        <th className="py-4 px-6 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Total</th>
                        <th className="py-4 px-6 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Status</th>
                        <th className="py-4 px-6 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Time</th>
                        <th className="py-4 px-6 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-center">Bill Paid</th>
                        <th className="py-4 px-6 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d3d3d3]/50">
                      {loading ? (
                        <tr>
                          <td colSpan="9" className="py-16 text-center text-xs font-bold text-neutral-400 uppercase tracking-widest">Loading...</td>
                        </tr>
                      ) : filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="py-16 text-center text-xs font-bold text-[#161a1d]">No orders found</td>
                        </tr>
                      ) : (
                        filteredOrders.map(ord => (
                          <tr key={ord.id} className="hover:bg-white/50 transition-colors">
                            <td className="py-4 px-6 text-xs text-neutral-400 font-mono font-semibold">#{ord.order_number.toString().padStart(6, '0')}</td>
                            <td className="py-4 px-6">
                              <p className="text-xs font-bold text-[#0b090a]">{ord.RestaurantTable?.table_number || 'N/A'}</p>
                              <p className="text-[9px] text-[#ba181b] font-bold mt-0.5">Dine In</p>
                            </td>
                            <td className="py-4 px-6 text-xs text-[#0b090a] font-medium">{ord.customer_name}</td>
                            <td className="py-4 px-6 text-xs text-[#0b090a] font-bold">{ord.OrderItems?.length || 0}</td>
                            <td className="py-4 px-6 text-xs text-[#0b090a] font-bold">Rs.{parseFloat(ord.total_amount).toFixed(0)}</td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border ${
                                ord.status === 'SERVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                ord.status === 'READY' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                                ord.status === 'PREPARING' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                ord.status === 'CANCELLED' ? 'bg-red-50 text-[#ba181b] border-red-200' :
                                'bg-[#fefae0] text-[#dda15e] border-[#dda15e]/30'
                              }`}>
                                {ord.status === 'PENDING' ? 'NEW' : ord.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-[10px] text-neutral-500 font-medium">
                              {new Date(ord.created_at).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}<br/>
                              {new Date(ord.created_at).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded border-[#d3d3d3] text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600" 
                                checked={ord.payment_status === 'PAID'}
                                onChange={(e) => handleUpdatePaymentStatus(ord.id, e.target.checked ? 'PAID' : 'UNPAID')}
                              />
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setSelectedOrder(ord)} className="px-4 py-2 border border-[#d3d3d3] text-[#161a1d] hover:border-[#161a1d] hover:bg-gray-50 text-[10px] font-black uppercase tracking-wider rounded-lg bg-white transition-colors shadow-sm">View</button>
                                <button onClick={() => setBillPreviewOrder(ord)} className="px-4 py-2 border border-[#ba181b] text-white bg-[#ba181b] hover:bg-[#a4161a] text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors shadow-sm">Bill</button>
                                {ord.status !== 'SERVED' && ord.status !== 'CANCELLED' && (
                                  <button onClick={() => handleUpdateOrderStatus(ord.id, 'SERVED')} className="px-4 py-2 border border-emerald-200 text-emerald-600 hover:border-emerald-600 hover:bg-emerald-50 text-[10px] font-black uppercase tracking-wider rounded-lg bg-white transition-colors shadow-sm">Served</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* View Order Modal (Replaces Sidebar) */}
              {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="px-6 py-5 border-b border-[#d3d3d3] flex justify-between items-center bg-gray-50">
                      <div>
                        <h4 className="font-outfit text-lg font-black text-[#0b090a] uppercase tracking-wider">
                          KOT #{selectedOrder.order_number}
                        </h4>
                        <span className="text-[10px] text-[#b1a7a6] font-bold font-mono">
                          {getMinutesAgo(selectedOrder.created_at)}
                        </span>
                      </div>
                      <button onClick={() => setSelectedOrder(null)} className="text-[#161a1d]/40 hover:text-[#ba181b] text-xl transition-all">✕</button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto flex-1 space-y-5">
                      <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
                        Table: <span className="text-[#0b090a] font-extrabold">{selectedOrder.RestaurantTable?.table_number || 'N/A'}</span> <span className="mx-2">•</span> Guest: <span className="text-[#0b090a] font-extrabold">{selectedOrder.customer_name}</span>
                      </p>

                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-[#ba181b] uppercase tracking-widest">Order Items</p>
                        <div className="border border-[#d3d3d3] rounded-xl overflow-hidden">
                          <div className="divide-y divide-[#d3d3d3]/50">
                            {selectedOrder.OrderItems?.map((item) => (
                              <div key={item.id} className="p-4 flex justify-between items-start bg-white">
                                <div>
                                  <p className="font-bold text-[#0b090a] text-sm">{item.MenuItem?.name_en} <span className="text-neutral-400 font-medium">x {item.quantity}</span></p>
                                  {item.note && (
                                    <p className="text-[10px] text-[#ba181b] font-bold mt-1.5 bg-red-50 px-2 py-1 rounded inline-block">
                                      ↳ {item.note}
                                    </p>
                                  )}
                                </div>
                                <span className="font-black text-neutral-600 font-mono">₹{parseFloat(item.total_price).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="bg-gray-50 p-4 border-t border-[#d3d3d3] flex justify-between items-center">
                            <span className="font-black text-[10px] uppercase tracking-widest text-neutral-500">Subtotal</span>
                            <span className="font-black text-lg text-[#0b090a] font-mono">₹{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {selectedOrder.special_note && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs font-bold text-[#ba181b] leading-relaxed">
                          💡 Instructions: {selectedOrder.special_note}
                        </div>
                      )}

                      <div className="pt-2">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">Manage Order State</p>
                        <div className="grid grid-cols-2 gap-3">
                          {selectedOrder.status === 'PENDING' && (
                            <button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'PREPARING')} className="bg-[#161a1d] hover:bg-black text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors">Accept</button>
                          )}
                          {selectedOrder.status === 'PREPARING' && (
                            <button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'READY')} className="bg-[#ba181b] hover:bg-[#a4161a] text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors col-span-2">Mark Ready</button>
                          )}
                          {selectedOrder.status === 'READY' && (
                            <button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'SERVED')} className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors col-span-2">Mark Served</button>
                          )}
                          {selectedOrder.status !== 'SERVED' && selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'READY' && (
                            <button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'CANCELLED')} className="border-2 border-red-200 hover:bg-red-50 text-[#ba181b] py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors">Cancel</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Thermal Bill Preview Modal */}
              {billPreviewOrder && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col w-full max-w-[340px] max-h-[90vh]">
                    <div className="px-5 py-4 border-b border-[#d3d3d3] flex justify-between items-center bg-white">
                      <h4 className="font-outfit text-base font-black text-[#0b090a]">Thermal Print Preview</h4>
                      <button onClick={() => setBillPreviewOrder(null)} className="text-[#161a1d]/40 hover:text-[#ba181b] text-xl transition-all">✕</button>
                    </div>
                    
                    {/* Receipt Preview Area */}
                    <div className="p-6 bg-gray-100 overflow-y-auto flex justify-center">
                      <div className="bg-white p-6 shadow-md" id="bill-print-area" style={{ width: '80mm', minHeight: '100px', fontFamily: 'monospace', color: '#000', fontSize: '12px', lineHeight: '1.4' }}>
                        
                        <div className="text-center mb-4 border-b border-black border-dashed pb-4">
                          <h2 className="text-xl font-bold uppercase mb-1">{user.name || 'Spice Garden'}</h2>
                          <p className="text-[10px]">TAX INVOICE</p>
                        </div>
                        
                        <div className="mb-4">
                          <p>Order No: {billPreviewOrder.order_number.toString().padStart(6, '0')}</p>
                          <p>Table: {billPreviewOrder.RestaurantTable?.table_number || 'N/A'}</p>
                          <p>Guest: {billPreviewOrder.customer_name}</p>
                          <p>Date: {new Date(billPreviewOrder.created_at).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}</p>
                        </div>

                        <div className="border-t border-black border-dashed pt-2 mb-2">
                          <table className="w-full text-left" style={{ fontSize: '11px' }}>
                            <thead>
                              <tr>
                                <th className="pb-2 font-normal border-b border-black border-dashed">Item</th>
                                <th className="pb-2 text-center w-8 font-normal border-b border-black border-dashed">Qty</th>
                                <th className="pb-2 text-right w-12 font-normal border-b border-black border-dashed">Amt</th>
                              </tr>
                            </thead>
                            <tbody>
                              {billPreviewOrder.OrderItems?.map(item => (
                                <tr key={item.id}>
                                  <td className="py-1">
                                    <div className="pr-2 whitespace-normal break-words leading-tight">{item.MenuItem?.name_en}</div>
                                  </td>
                                  <td className="py-1 text-center align-top">{item.quantity}</td>
                                  <td className="py-1 text-right align-top">{parseFloat(item.total_price).toFixed(0)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="border-t border-black border-dashed pt-3 mb-6 mt-2">
                          <div className="flex justify-between font-bold text-sm">
                            <span>TOTAL:</span>
                            <span>Rs.{parseFloat(billPreviewOrder.total_amount).toFixed(0)}</span>
                          </div>
                        </div>

                        <div className="text-center">
                          <p className="text-[10px] mb-1">Thank you for visiting!</p>
                          <p className="text-[9px]">Powered by Dine Dash</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-5 bg-white border-t border-[#d3d3d3]">
                      <button 
                        onClick={async () => {
                          try {
                            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://192.168.0.104:3005';
                            const response = await fetch(`${baseUrl}/api/orders/${billPreviewOrder.id}/receipt`, {
                              headers: {
                                Authorization: `Bearer ${window.__accessToken}`
                              }
                            });
                            
                            if (!response.ok) throw new Error('Failed to fetch receipt');
                            
                            const blob = await response.blob();
                            const fileURL = URL.createObjectURL(blob);

                            // 1. Create a hidden iframe
                            const iframe = document.createElement('iframe');
                            iframe.style.position = 'fixed';
                            iframe.style.right = '0';
                            iframe.style.bottom = '0';
                            iframe.style.width = '0';
                            iframe.style.height = '0';
                            iframe.style.border = 'none';
                            iframe.src = fileURL;

                            document.body.appendChild(iframe);

                            // 2. Wait for PDF loading and trigger print dialog
                            iframe.onload = () => {
                              iframe.contentWindow.focus();
                              iframe.contentWindow.print();
                              
                              // 3. Clean up element after short delay
                              setTimeout(() => {
                                document.body.removeChild(iframe);
                                URL.revokeObjectURL(fileURL);
                              }, 1000);
                            };
                          } catch (error) {
                            console.error('Error triggering receipt print:', error);
                            alert('Failed to print receipt. Please try again.');
                          }
                        }}
                        className="w-full bg-[#ba181b] hover:bg-[#a4161a] text-white py-3.5 rounded-xl text-sm font-black uppercase tracking-wider transition-colors shadow-md"
                      >
                        Print Receipt (80mm)
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )
        })()}

        {/* TAB: Kitchen Display System (KDS) */}
        {activeTab === 'Kitchen' && (
          <div className="p-8 flex-1 flex flex-col overflow-y-auto max-w-7xl w-full mx-auto space-y-6">

            {loading ? (
              <div className="p-16 flex-1 flex flex-col justify-center items-center gap-2">
                <div className="w-8 h-8 border-4 border-[#ba181b]/20 border-t-[#ba181b] rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Loading tickets...</p>
              </div>
            ) : activeKitchenTickets.length === 0 ? (
              <div className="p-16 bg-white border border-[#d3d3d3] rounded-xl flex-1 flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.005)] min-h-[300px]">
                <span className="text-3xl mb-3">🍳</span>
                <p className="text-sm font-bold text-[#161a1d]">No active kitchen tickets</p>
                <p className="text-xs text-[#b1a7a6] mt-1 font-semibold">Kitchen display monitor is empty. Orders will appear here as soon as they are submitted.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {activeKitchenTickets.map((ticket) => {
                  const isPreparing = ticket.status === 'PREPARING'
                  const isReady = ticket.status === 'READY'
                  return (
                    <div
                      key={ticket.id}
                      className="bg-white border-2 border-[#d3d3d3] rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm"
                    >
                      {/* Ticket Header */}
                      <div className="p-4 bg-gray-50 border-b border-[#d3d3d3] flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-wider">
                            {ticket.RestaurantTable?.table_number || 'N/A'}
                          </p>
                          <p className="font-outfit text-base font-black text-[#0b090a] leading-none mt-1">
                            KOT #{ticket.order_number}
                          </p>
                        </div>
                        <span className="text-[9px] font-black font-mono bg-[#ba181b]/10 text-[#ba181b] px-2 py-1 rounded-md animate-pulse">
                          {getMinutesAgo(ticket.created_at)}
                        </span>
                      </div>

                      {/* Dish List */}
                      <div className="p-4.5 flex-1 divide-y divide-[#d3d3d3]/40 space-y-3">
                        {ticket.OrderItems?.map((item) => (
                          <div key={item.id} className="pt-2.5 first:pt-0 flex justify-between items-start text-xs font-semibold">
                            <div className="space-y-1">
                              <p className="font-extrabold text-[#0b090a] leading-snug">{item.MenuItem?.name_en}</p>
                              {item.note && (
                                <p className="text-[9px] font-black uppercase text-[#ba181b] bg-red-50 border border-red-100 rounded px-1.5 py-0.5 inline-block">
                                  ↳ Note: {item.note}
                                </p>
                              )}
                            </div>
                            <span className="bg-[#161a1d] text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-sm shrink-0 font-mono">
                              {item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Special Notes & CTA */}
                      <div className="p-4 bg-white border-t border-[#d3d3d3]/40 space-y-3">
                        {ticket.special_note && (
                          <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 text-[9px] font-bold text-[#ba181b] leading-relaxed">
                            💡 Note: {ticket.special_note}
                          </div>
                        )}

                        {!isReady ? (
                          <button
                            onClick={() => handleUpdateOrderStatus(ticket.id, isPreparing ? 'READY' : 'PREPARING')}
                            className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center shadow-sm ${isPreparing
                              ? 'bg-[#ba181b] hover:bg-[#a4161a] text-white shadow-[#ba181b]/10'
                              : 'bg-[#161a1d] hover:bg-black text-white'
                              }`}
                          >
                            {isPreparing ? '🍲 Mark Ready' : '🍳 Start Preparing'}
                          </button>
                        ) : (
                          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-center py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">
                            ✓ Prepared
                          </div>
                        )}
                      </div>

                    </div>
                  )
                })}
              </div>
            )}

          </div>
        )}

        {/* TAB: Settings */}
        {activeTab === 'Settings' && (
          <SettingsWorkspace user={user} onUserUpdate={(updated) => setUser(updated)} />
        )}

        {/* Fallback View for other tabs */}
        {activeTab !== 'Menu' && activeTab !== 'Tables & QR' && activeTab !== 'Orders' && activeTab !== 'Kitchen' && activeTab !== 'Settings' && activeTab !== 'Promotions' && (
          <div className="p-8 flex-1 flex flex-col">
            <div className="bg-white border border-[#d3d3d3] rounded-xl flex-1 shadow-[0_2px_8px_rgba(0,0,0,0.005)] flex items-center justify-center p-8">
              <span className="text-[#b1a7a6] text-sm font-semibold">
                Workspace empty. Select menu options on the left to begin setup.
              </span>
            </div>
          </div>
        )}
      </main>

      {/* E. MODALS ZONE */}

      {/* 1. CATEGORY CREATION/EDIT MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-[#0b090a]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#d3d3d3] w-full max-w-[400px] p-6 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-outfit text-lg font-black text-[#0b090a] uppercase tracking-wider">
                {editingCategory ? 'Rename Category' : 'Create Category'}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-[#161a1d]/60 hover:text-[#ba181b] text-sm font-bold transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                  English Name
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name_en}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name_en: e.target.value })}
                  placeholder="Starters"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                  Hindi Name (Optional)
                </label>
                <input
                  type="text"
                  value={categoryForm.name_hi}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name_hi: e.target.value })}
                  placeholder="स्टार्टर्स"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                  Sort Sorting Index
                </label>
                <input
                  type="number"
                  value={categoryForm.sort_order}
                  onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-5 border-t border-[#d3d3d3]/30">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 border border-[#d3d3d3] hover:bg-neutral-50 text-[#161a1d] py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#ba181b] hover:bg-[#a4161a] text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-[#ba181b]/10"
                >
                  Save category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. DISH CREATION/EDIT MODAL */}
      {isDishModalOpen && (
        <div className="fixed inset-0 bg-[#0b090a]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#d3d3d3] w-full max-w-[540px] p-6 shadow-2xl overflow-y-auto max-h-[90vh] animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-outfit text-lg font-black text-[#0b090a] uppercase tracking-wider">
                {editingDish ? 'Edit Dish details' : 'Add Dish details'}
              </h3>
              <button
                onClick={() => setIsDishModalOpen(false)}
                className="text-[#161a1d]/60 hover:text-[#ba181b] text-sm font-bold transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-1.5">
                    English Name
                  </label>
                  <input
                    type="text"
                    required
                    value={dishForm.name_en}
                    onChange={(e) => setDishForm({ ...dishForm, name_en: e.target.value })}
                    placeholder="Paneer Tikka"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-[#d3d3d3] text-xs font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-1.5">
                    Hindi Name
                  </label>
                  <input
                    type="text"
                    value={dishForm.name_hi}
                    onChange={(e) => setDishForm({ ...dishForm, name_hi: e.target.value })}
                    placeholder="पनीर टिक्का"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-[#d3d3d3] text-xs font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-1.5">
                    English Description
                  </label>
                  <textarea
                    rows={2}
                    value={dishForm.description_en}
                    onChange={(e) => setDishForm({ ...dishForm, description_en: e.target.value })}
                    placeholder="Grilled cottage cheese cubes..."
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-[#d3d3d3] text-xs font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all resize-none font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-1.5">
                    Hindi Description
                  </label>
                  <textarea
                    rows={2}
                    value={dishForm.description_hi}
                    onChange={(e) => setDishForm({ ...dishForm, description_hi: e.target.value })}
                    placeholder="मसालेदार पनीर टिक्का..."
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-[#d3d3d3] text-xs font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all resize-none font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-1.5">
                    Price (INR ₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={dishForm.price}
                    onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                    placeholder="249.00"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-[#d3d3d3] text-xs font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-1.5">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={dishForm.image_url}
                    onChange={(e) => setDishForm({ ...dishForm, image_url: e.target.value })}
                    placeholder="https://example.com/paneer.jpg"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-[#d3d3d3] text-xs font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-1.5">
                    Category
                  </label>
                  <select
                    value={dishForm.category_id}
                    onChange={(e) => setDishForm({ ...dishForm, category_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-[#d3d3d3] text-xs font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name_en}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-1.5">
                    Sort Index
                  </label>
                  <input
                    type="number"
                    value={dishForm.sort_order}
                    onChange={(e) => setDishForm({ ...dishForm, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-[#d3d3d3] text-xs font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-6 py-2 border-y border-[#d3d3d3]/30">
                <label className="flex items-center gap-2 text-xs font-bold text-[#161a1d]/85 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dishForm.is_veg}
                    onChange={(e) => setDishForm({ ...dishForm, is_veg: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span>Vegetarian (Veg)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-[#161a1d]/85 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dishForm.is_available}
                    onChange={(e) => setDishForm({ ...dishForm, is_available: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span>Available</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-[#161a1d]/85 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dishForm.is_combo}
                    onChange={(e) => setDishForm({ ...dishForm, is_combo: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span>Is Combo Package</span>
                </label>
              </div>

              {/* Combo components selectors */}
              {dishForm.is_combo && (
                <div className="border border-[#d3d3d3] rounded-xl p-4 bg-gray-50/50 space-y-3 animate-fade-in">
                  <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest">
                    Combo Components selection
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-[#d3d3d3] rounded-lg bg-white p-3 divide-y divide-[#d3d3d3]/40 space-y-2">
                    {menuItems
                      .filter(item => !item.is_combo && item.id !== (editingDish?.id))
                      .map(item => {
                        const component = dishForm.combo_items.find(c => c.item_id === item.id)
                        const isSelected = !!component
                        return (
                          <div key={item.id} className="flex justify-between items-center py-2 text-xs">
                            <label className="flex items-center gap-2 font-semibold text-[#161a1d]/85 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setDishForm(prev => ({
                                      ...prev,
                                      combo_items: [...prev.combo_items, { item_id: item.id, quantity: 1 }]
                                    }))
                                  } else {
                                    setDishForm(prev => ({
                                      ...prev,
                                      combo_items: prev.combo_items.filter(c => c.item_id !== item.id)
                                    }))
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <span>{item.name_en}</span>
                            </label>

                            {isSelected && (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-[#b1a7a6] font-bold uppercase tracking-wider mr-1">Qty:</span>
                                <input
                                  type="number"
                                  min={1}
                                  value={component.quantity}
                                  onChange={(e) => {
                                    const qty = parseInt(e.target.value) || 1
                                    setDishForm(prev => ({
                                      ...prev,
                                      combo_items: prev.combo_items.map(c =>
                                        c.item_id === item.id ? { ...c, quantity: qty } : c
                                      )
                                    }))
                                  }}
                                  className="w-12 px-1 py-0.5 border border-[#d3d3d3] rounded text-center font-bold"
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-5 border-t border-[#d3d3d3]/30">
                <button
                  type="button"
                  onClick={() => setIsDishModalOpen(false)}
                  className="flex-1 border border-[#d3d3d3] hover:bg-neutral-50 text-[#161a1d] py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#ba181b] hover:bg-[#a4161a] text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-[#ba181b]/10"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. TABLE CREATION/EDIT MODAL */}
      {isTableModalOpen && (
        <div className="fixed inset-0 bg-[#0b090a]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#d3d3d3] w-full max-w-[420px] p-6 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-outfit text-lg font-black text-[#0b090a] uppercase tracking-wider">
                {editingTable ? 'Edit Table Settings' : 'Add Tables'}
              </h3>
              <button
                onClick={() => setIsTableModalOpen(false)}
                className="text-[#161a1d]/60 hover:text-[#ba181b] text-sm font-bold transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-4">

              {/* EDIT MODE: show table name and active toggle */}
              {editingTable && (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                      Table Number / Identifier
                    </label>
                    <input
                      type="text"
                      required
                      value={tableForm.table_number}
                      onChange={(e) => setTableForm({ ...tableForm, table_number: e.target.value })}
                      placeholder="e.g. Table 12-B"
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-[#161a1d]/85 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tableForm.is_active}
                        onChange={(e) => setTableForm({ ...tableForm, is_active: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span>Table is active and online</span>
                    </label>
                  </div>
                </>
              )}

              {/* CREATE MODE: count input + is_active — backend auto-names all tables */}
              {!editingTable && (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-[#161a1d] uppercase tracking-widest mb-2">
                      How many tables to add?
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={tableForm.count}
                      onChange={(e) => setTableForm({ ...tableForm, count: e.target.value })}
                      placeholder="e.g. 1"
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#d3d3d3] text-sm font-semibold focus:outline-none focus:border-[#ba181b] focus:ring-4 focus:ring-[#ba181b]/10 transition-all"
                    />
                    <p className="mt-1.5 text-[10px] text-neutral-400 font-semibold">
                      Tables are auto-named sequentially (e.g. Table 4, Table 5…). Max 100 per request.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-[#161a1d]/85 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tableForm.is_active}
                        onChange={(e) => setTableForm({ ...tableForm, is_active: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span>Set tables as active and online</span>
                    </label>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-5 border-t border-[#d3d3d3]/30">
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
                  className="flex-1 border border-[#d3d3d3] hover:bg-neutral-50 text-[#161a1d] py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#ba181b] hover:bg-[#a4161a] text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-[#ba181b]/10"
                >
                  {editingTable ? 'Save Changes' : tableForm.mode === 'bulk' ? `Create ${tableForm.count || ''} Tables` : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
