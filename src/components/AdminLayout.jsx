import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Icon } from './Icon'
import { useAuth } from '../context/AuthContext'
import { getDashboardStats } from '../services/api'
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
  const [bellOpen, setBellOpen] = useState(false)
  const [lowStockItems, setLowStockItems] = useState([])
  const bellRef = useRef(null)

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'A'

  const handleLogout = () => { logout(); navigate('/login') }

  // Fetch low stock products for the bell notification
  useEffect(() => {
    const fetchLowStock = () => {
      getDashboardStats()
        .then(({ data }) => setLowStockItems(data?.data?.lowStockProducts ?? []))
        .catch(() => {})
    }
    fetchLowStock()
    const interval = setInterval(fetchLowStock, 60000) // refresh every 60s
    return () => clearInterval(interval)
  }, [])

  // Close bell dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
            {/* ── Bell notification ───────────────────── */}
            <div ref={bellRef} style={{ position: 'relative' }}>
              <button
                className="admin-bell-btn"
                title="Low Stock Alerts"
                onClick={() => setBellOpen(p => !p)}
                style={{ position: 'relative' }}
              >
                <Icon name="notifications" size={20} />
                {lowStockItems.length > 0 && (
                  <span style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                    {lowStockItems.length > 9 ? '9+' : lowStockItems.length}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div style={{ position: 'absolute', top: '110%', right: 0, width: 320, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,.15)', zIndex: 400, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="warning" size={15} style={{ color: '#f59e0b' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#374151' }}>
                      Low Stock Alerts
                    </span>
                    {lowStockItems.length > 0 && (
                      <span style={{ marginLeft: 'auto', background: '#fef3c7', color: '#92400e', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                        {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {lowStockItems.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                        <Icon name="check_circle" size={28} style={{ color: '#10b981', display: 'block', margin: '0 auto 8px' }} />
                        All products are well-stocked!
                      </div>
                    ) : (
                      lowStockItems.map(p => (
                        <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid #f9fafb' }}>
                          {p.image
                            ? <img src={p.image} alt={p.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: '1px solid #e5e7eb' }} />
                            : <div style={{ width: 36, height: 36, borderRadius: 6, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="inventory_2" size={16} style={{ color: '#9ca3af' }} /></div>
                          }
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>₹{p.price?.toFixed(2)}</div>
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap', color: p.quantity <= 5 ? '#dc2626' : '#ea580c', background: p.quantity <= 5 ? '#fef2f2' : '#fff7ed', padding: '3px 8px', borderRadius: 20, border: `1px solid ${p.quantity <= 5 ? '#fecaca' : '#fed7aa'}` }}>
                            {p.quantity} left
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  {lowStockItems.length > 0 && (
                    <div style={{ padding: '10px 16px', borderTop: '1px solid #f3f4f6' }}>
                      <button
                        onClick={() => { navigate('/admin/products'); setBellOpen(false) }}
                        style={{ width: '100%', padding: '8px', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#92400e' }}
                      >
                        Manage Stock →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
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
