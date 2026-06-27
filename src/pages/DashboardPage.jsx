import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api'

// Custom Hooks & Utilities
import { useRestaurantSocket } from '../hooks/useRestaurantSocket'

// Layouts & Workspaces
import DashboardLayout from '../layouts/DashboardLayout'
import OverviewWorkspace from '../components/OverviewWorkspace'
import POSWorkspace from '../components/POSWorkspace'
import MenuWorkspace from '../components/MenuWorkspace'
import TablesWorkspace from '../components/TablesWorkspace'
import OrdersWorkspace from '../components/OrdersWorkspace'
import KitchenWorkspace from '../components/KitchenWorkspace'
import PromotionsWorkspace from '../components/PromotionsWorkspace'
import SettingsWorkspace from '../components/SettingsWorkspace'
import SubscriptionWorkspace from '../components/SubscriptionWorkspace'

export default function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // User state
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {}
    } catch (_) {
      return {}
    }
  })

  const isOwner = user?.role === 'OWNER'

  // Read ?tab= and ?billing= query params set by subscription-expired redirect
  const searchParams = new URLSearchParams(location.search)
  const tabFromUrl = searchParams.get('tab')
  const openBillingFromUrl = searchParams.get('billing') === '1'

  // Tab state — honour URL param on first render
  const [activeTab, setActiveTab] = useState(() => {
    if (tabFromUrl) return tabFromUrl
    return isOwner ? 'Overview' : 'Kitchen'
  })

  // Shared Data States
  const [restaurant, setRestaurant] = useState(null)
  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [tables, setTables] = useState([])
  const [orders, setOrders] = useState([])
  const [waiterCalls, setWaiterCalls] = useState([])

  const fetchRestaurant = useCallback(async () => {
    try {
      const res = await api.get('/api/restaurant')
      if (res?.data) {
        setRestaurant(res.data)
      }
    } catch (err) {
      console.error('Error fetching restaurant details:', err)
    }
  }, [])

  // Loading & Error States
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch functions wrapped in useCallback to avoid unnecessary recreation
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/api/categories')
      const data = res.data || res || []
      setCategories(data)
      return data
    } catch (err) {
      console.error('Error fetching categories:', err)
      return []
    }
  }, [])

  const fetchMenuItems = useCallback(async () => {
    try {
      const res = await api.get('/api/menu-items')
      const data = res.data || res || []
      setMenuItems(data)
    } catch (err) {
      console.error('Error fetching menu items:', err)
    }
  }, [])

  const fetchTables = useCallback(async () => {
    try {
      const res = await api.get('/api/tables')
      const data = res.data || res || []
      setTables(data)
    } catch (err) {
      console.error('Error fetching tables:', err)
    }
  }, [])

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/api/orders')
      const data = res.data || res || []
      setOrders(data)
    } catch (err) {
      console.error('Error fetching orders:', err)
    }
  }, [])

  const fetchWaiterCalls = useCallback(async () => {
    try {
      const res = await api.get('/api/orders/waiter/calls')
      const data = res.data || res || []
      setWaiterCalls(data.filter(c => !c.is_resolved))
    } catch (err) {
      console.error('Error fetching waiter calls:', err)
    }
  }, [])

  // Initialize Real-time Socket
  useRestaurantSocket({
    user,
    setOrders,
    setWaiterCalls,
    setTables
  })

  // Fetch restaurant info on mount
  useEffect(() => {
    fetchRestaurant()
  }, [fetchRestaurant])

  // Tab-based data fetching
  useEffect(() => {
    if (activeTab === 'Overview') {
      setLoading(true)
      setError('')
      Promise.all([fetchTables(), fetchOrders(), fetchWaiterCalls()])
        .finally(() => setLoading(false))
    } else if (activeTab === 'POS') {
      setLoading(true)
      setError('')
      Promise.all([fetchTables(), fetchCategories(), fetchMenuItems()])
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
      fetchTables().finally(() => setLoading(false))
    } else if (activeTab === 'Orders' || activeTab === 'Kitchen') {
      setLoading(true)
      setError('')
      Promise.all([fetchOrders(), fetchWaiterCalls()])
        .finally(() => setLoading(false))
    }
  }, [activeTab, fetchCategories, fetchMenuItems, fetchOrders, fetchTables, fetchWaiterCalls])

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      // api.logoutUser() invalidates the session on the server,
      // clears the HttpOnly cookie, wipes local state, and redirects to /login
      await api.logoutUser()
    }
  }

  const renderActiveWorkspace = () => {
    switch (activeTab) {
      case 'Overview':
        return <OverviewWorkspace orders={orders} tables={tables} waiterCalls={waiterCalls} setActiveTab={setActiveTab} />
      case 'POS':
        return (
          <POSWorkspace
            categories={categories}
            menuItems={menuItems}
            tables={tables}
            fetchOrders={fetchOrders}
            user={user}
            restaurant={restaurant}
          />
        )
      case 'Menu':
        return (
          <MenuWorkspace
            categories={categories}
            setCategories={setCategories}
            menuItems={menuItems}
            setMenuItems={setMenuItems}
            fetchCategories={fetchCategories}
            fetchMenuItems={fetchMenuItems}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
          />
        )
      case 'Tables & QR':
        return <TablesWorkspace tables={tables} setTables={setTables} fetchTables={fetchTables} user={user} restaurant={restaurant} />
      case 'Orders':
        return (
          <OrdersWorkspace
            orders={orders}
            fetchOrders={fetchOrders}
            waiterCalls={waiterCalls}
            setWaiterCalls={setWaiterCalls}
            user={user}
            restaurant={restaurant}
          />
        )
      case 'Kitchen':
        return <KitchenWorkspace orders={orders} fetchOrders={fetchOrders} />
      case 'Promotions':
        return <PromotionsWorkspace />
      case 'Subscription':
        return <SubscriptionWorkspace user={user} />
      case 'Settings':
        return (
          <SettingsWorkspace
            user={user}
            onUserUpdate={(updated) => setUser(updated)}
            onRestaurantUpdate={fetchRestaurant}
          />
        )
      default:
        return (
          <div className="p-8 flex-1 flex flex-col">
            <div className="bg-white border border-[#d3d3d3] rounded-xl flex-1 shadow-[0_2px_8px_rgba(0,0,0,0.005)] flex items-center justify-center p-8">
              <span className="text-[#b1a7a6] text-sm font-semibold">
                Workspace empty. Select menu options on the left to begin setup.
              </span>
            </div>
          </div>
        )
    }
  }

  return (
    <DashboardLayout
      user={user}
      restaurant={restaurant}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      waiterCalls={waiterCalls}
      handleSignOut={handleSignOut}
    >
      {renderActiveWorkspace()}
    </DashboardLayout>
  )
}
