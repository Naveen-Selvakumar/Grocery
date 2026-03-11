import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Icon } from './Icon'
import { useAuth } from '../context/AuthContext'
import '../styles/admin.css'

const NAV = [
  { to: '/admin/dashboard', icon: <Icon name="grid_view" size={17} />, label: 'Dashboard' },
  { to: '/admin/products',  icon: <Icon name="inventory_2" size={17} />, label: 'Products' },
  { to: '/admin/orders',    icon: <Icon name="shopping_bag" size={17} />, label: 'Orders' },
  { to: '/admin/categories',icon: <Icon name="local_offer" size={17} />, label: 'Categories' },
  { to: '/admin/customers', icon: <Icon name="group" size={17} />, label: 'Customers' },
]

export default function AdminLayout({ children, title = 'Dashboard', subtitle = '' }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dropOpen, setDropOpen] = useState(false)

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'A'

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="admin-shell">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <div className="admin-logo-icon">🛒</div>
          <div className="admin-logo-text">
            <span className="admin-logo-name">SmartGrocery</span>
            <span className="admin-logo-sub">Admin Panel</span>
          </div>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-section">Main Menu</div>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="admin-nav-section" style={{ marginTop: 8 }}>Tools</div>
          <NavLink to="/ocr-scanner" className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
            <Icon name="photo_camera" size={17} /><span>OCR Scanner</span>
          </NavLink>

          <button className="admin-nav-link" style={{ marginTop: 'auto' }} onClick={handleLogout}>
            <Icon name="logout" size={17} /><span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <div className="admin-main">

        {/* Header */}
        <header className="admin-header">
          <div className="admin-header-left">
            <h2>Welcome back, {user?.name || 'Admin'}!</h2>
            <p>{subtitle || "Here's what's happening with your store today"}</p>
          </div>
          <div className="admin-header-right">
            <button className="admin-bell-btn" title="Notifications">
              <Icon name="notifications" size={20} />
            </button>
            <div className="admin-user-chip" onClick={() => setDropOpen(p => !p)} style={{ position: 'relative' }}>
              <div className="admin-user-avatar">{initials}</div>
              <div className="admin-user-info">
                <span className="admin-user-name">{user?.name}</span>
                <span className="admin-user-email">{user?.email}</span>
              </div>
              <Icon name="expand_more" size={14} style={{ color: '#6b7280', marginLeft: 4 }} />
              {dropOpen && (
                <div style={{ position: 'absolute', top: '110%', right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.12)', minWidth: 160, zIndex: 300, overflow: 'hidden' }}>
                  <button onClick={handleLogout} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', color: '#ef4444', fontFamily: 'inherit', fontWeight: 600 }}>
                    <Icon name="logout" size={15} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  )
}
