import { useState } from 'react'
import logoRed from '../assets/logored.png'

import {
  LayoutDashboard,
  UtensilsCrossed,
  QrCode,
  ClipboardList,
  ChefHat,
  Tag,
  Settings,
  LogOut,
  ShoppingCart,
} from 'lucide-react'

// Crown icon (inline SVG — no lucide equivalent)
const CrownIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M3 18h18v2H3v-2zm0-2l3-8 4.5 4L12 4l1.5 8L18 8l3 8H3z" />
  </svg>
)

const Icons = {
  Overview:     () => <LayoutDashboard size={18} />,
  POS:          () => <ShoppingCart size={18} />,
  Menu:         () => <UtensilsCrossed size={18} />,
  Tables:       () => <QrCode size={18} />,
  Orders:       () => <ClipboardList size={18} />,
  Kitchen:      () => <ChefHat size={18} />,
  Promotions:   () => <Tag size={18} />,
  Subscription: () => <CrownIcon size={18} />,
  Settings:     () => <Settings size={18} />,
  SignOut:      () => <LogOut size={15} />,
}

export default function DashboardLayout({ user, restaurant, activeTab, setActiveTab, waiterCalls, handleSignOut, children }) {
  const isOwner = user?.role === 'OWNER'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { name: 'Overview',      Icon: Icons.Overview },
    { name: 'POS',           Icon: Icons.POS,          ownerOnly: true },
    { name: 'Menu',          Icon: Icons.Menu,          ownerOnly: true },
    { name: 'Tables & QR',   Icon: Icons.Tables,        ownerOnly: true },
    { name: 'Orders',        Icon: Icons.Orders,        ownerOnly: true },
    { name: 'Kitchen',       Icon: Icons.Kitchen },
    { name: 'Promotions',    Icon: Icons.Promotions,    ownerOnly: true },
    { name: 'Subscription',  Icon: Icons.Subscription,  ownerOnly: true, isGold: true },
    { name: 'Settings',      Icon: Icons.Settings },
  ].filter(item => !item.ownerOnly || isOwner)

  return (
    <div className="h-screen flex overflow-hidden antialiased" style={{ backgroundColor: 'var(--bg-page)' }}>
      {/* Sidebar Backdrop (mobile) */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ────────────────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-56 bg-white flex flex-col justify-between shrink-0 border-r transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ borderColor: 'var(--border)' }}>
        <div>
          {/* Branding */}
          <div className="px-5 py-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2.5 min-w-0">
              {restaurant?.logo_url ? (
                <img src={restaurant.logo_url} alt="Logo" className="w-8 h-8 object-cover rounded border" style={{ borderColor: 'var(--border)' }} />
              ) : (
                <img src={logoRed} alt="DineDash" className="h-8 w-auto object-contain" />
              )}
              {restaurant?.logo_url && (
                <span className="font-outfit font-black text-sm text-[#0b090a] leading-tight select-none truncate max-w-[110px]" title={restaurant?.name}>
                  {restaurant?.name}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-gray-500 hover:text-gray-900 border border-gray-200 rounded cursor-pointer text-xs font-bold w-6 h-6 flex items-center justify-center font-mono shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-0.5">
            {navItems.map(({ name, Icon, isGold }) => {
              const isActive = activeTab === name
              const hasBadge = name === 'Orders' && waiterCalls.length > 0

              // Gold Subscription button
              if (isGold) {
                return (
                  <button
                    key={name}
                    onClick={() => { setActiveTab(name); setSidebarOpen(false) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer relative"
                    style={isActive ? {
                      background: '#ba181b',
                      color: '#fff',
                      boxShadow: '0 2px 10px rgba(186,24,27,0.25)',
                    } : {
                      background: '#fff5f5',
                      color: '#ba181b',
                      border: '1px solid #f5c6c6',
                    }}
                  >
                    <span style={{ color: isActive ? '#fff' : '#ba181b' }}>
                      <Icon />
                    </span>
                    <span>{name}</span>
                    {/* PRO badge */}
                    <span style={{
                      marginLeft: 'auto',
                      fontSize: '8px', fontWeight: 800,
                      padding: '1px 5px', borderRadius: '4px',
                      background: isActive ? 'rgba(255,255,255,0.2)' : '#fde8e8',
                      color: isActive ? '#fff' : '#ba181b',
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>PRO</span>
                  </button>
                )
              }

              return (
                <button
                  key={name}
                  onClick={() => { setActiveTab(name); setSidebarOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-[#ba181b]/10 text-[#ba181b] font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className={isActive ? 'text-[#ba181b]' : 'text-gray-400'}>
                    <Icon />
                  </span>
                  <span>{name}</span>
                  {hasBadge && (
                    <span className="absolute right-2 bg-[#ba181b] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                      {waiterCalls.length}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-3 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-[#ba181b] hover:bg-red-50 transition-all cursor-pointer"
          >
            <Icons.SignOut />
            Sign out
          </button>
          <p className="text-center text-[10px] text-gray-400 font-medium">
            © 2026 <a href="https://compunic.co.in" target="_blank" rel="noopener noreferrer" className="hover:underline">Compunic Pvt. Limited</a>
          </p>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Bar */}
        <div className="lg:hidden h-14 bg-white border-b flex items-center justify-between px-4 shrink-0" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2.5 cursor-pointer focus:outline-none hover:opacity-85 transition-opacity min-w-0"
          >
            {restaurant?.logo_url ? (
              <img src={restaurant.logo_url} alt="Logo" className="h-8 h-8 object-cover rounded border" style={{ borderColor: 'var(--border)' }} />
            ) : (
              <img src={logoRed} alt="DineDash" className="h-7 w-auto object-contain" />
            )}
            <span className="text-[9px] font-black uppercase tracking-widest text-[#ba181b] bg-[#ba181b]/5 px-2 py-0.5 border border-[#ba181b]/10 rounded-sm shrink-0">Menu</span>
          </button>
          <span className="text-xs font-black uppercase tracking-widest text-gray-500 truncate ml-2">{activeTab}</span>
        </div>

        {/* Workspace content wrapper */}
        <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-page)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
