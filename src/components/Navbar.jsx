import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Icon } from './Icon'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useProduct } from '../context/ProductContext'
import '../styles/navbar.css'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const { cartCount } = useCart()
  const { theme, toggleTheme } = useProduct()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) { navigate(`/products?search=${encodeURIComponent(search.trim())}`) }
    setMobileOpen(false)
  }

  const handleLogout = () => { logout(); setShowUserMenu(false); navigate('/') }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">🛒</div>
          <span className="logo-text">Arunachalam<span> Grocery</span></span>
        </Link>

        {/* Search Bar */}
        <form className="navbar-search" onSubmit={handleSearch}>
          <input
            type="text" placeholder="Search products, categories..."
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="navbar-search-btn"><Icon name="search" size={18} /></button>
        </form>

        {/* Desktop Nav Links */}
        <div className="navbar-links">
          <NavLink to="/" className="nav-link" end>Home</NavLink>
          <NavLink to="/products" className="nav-link">Products</NavLink>
          {user && <NavLink to="/orders" className="nav-link">Orders</NavLink>}
          {user && <NavLink to="/ocr-scanner" className="nav-link">Scan Bill</NavLink>}
          {isAdmin && (
            <NavLink to="/admin/dashboard" className="nav-link" style={{ background: '#e53935', color: '#fff', borderRadius: 6, padding: '5px 14px', fontWeight: 700, fontSize: '0.82rem' }}>
              ⚡ Admin Panel
            </NavLink>
          )}
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          {/* Theme Toggle */}
          <button className="nav-icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Icon name="light_mode" size={18} /> : <Icon name="dark_mode" size={18} />}
          </button>

          {/* Wishlist */}
          {user && (
            <Link to="/wishlist" className="nav-icon-btn" title="Wishlist">
              <Icon name="favorite_border" size={18} />
            </Link>
          )}

          {/* Cart */}
          <Link to="/cart" className="nav-icon-btn" title="Cart">
            <Icon name="shopping_cart" size={18} />
            {cartCount > 0 && <span className="nav-badge">{cartCount > 99 ? '99+' : cartCount}</span>}
          </Link>

          {/* User Menu */}
          {user ? (
            <div className="user-menu" ref={menuRef}>
              <button className="user-menu-btn" onClick={() => setShowUserMenu((v) => !v)}>
                <div className="user-avatar">{user.name?.charAt(0).toUpperCase()}</div>
                <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name?.split(' ')[0]}</span>
              </button>
              {showUserMenu && (
                <div className="user-dropdown">
                  <Link to="/orders" className="dropdown-item" onClick={() => setShowUserMenu(false)}><Icon name="inventory_2" size={16} /> My Orders</Link>
                  <Link to="/wishlist" className="dropdown-item" onClick={() => setShowUserMenu(false)}><Icon name="favorite_border" size={16} /> Wishlist</Link>
                  {isAdmin && <>
                    <div className="dropdown-divider" />
                    <Link to="/admin/dashboard" className="dropdown-item" onClick={() => setShowUserMenu(false)}><Icon name="grid_view" size={16} /> Dashboard</Link>
                    <Link to="/admin/products" className="dropdown-item" onClick={() => setShowUserMenu(false)}><Icon name="settings" size={16} /> Manage Products</Link>
                  </>}
                  <div className="dropdown-divider" />
                  <button className="dropdown-item danger" onClick={handleLogout}><Icon name="logout" size={16} /> Logout</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ padding: '8px 22px', fontWeight: 700, fontSize: '0.95rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="person" size={18} /> Login
            </Link>
          )}

          {/* Mobile Menu */}
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}><Icon name="menu" size={22} /></button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`mobile-drawer ${mobileOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-overlay" onClick={() => setMobileOpen(false)} />
        <div className="mobile-drawer-panel">
          <button className="mobile-drawer-close" onClick={() => setMobileOpen(false)}><Icon name="close" size={22} /></button>

          {/* Mobile Search */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input className="form-control" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1 }} />
            <button type="submit" className="btn btn-primary btn-sm"><Icon name="search" size={16} /></button>
          </form>

          <Link to="/" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>🏠 Home</Link>
          <Link to="/products" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>🛍️ Products</Link>
          <Link to="/cart" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>🛒 Cart {cartCount > 0 && `(${cartCount})`}</Link>
          {user && <Link to="/wishlist" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>❤️ Wishlist</Link>}
          {user && <Link to="/orders" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>📦 Orders</Link>}
          {user && <Link to="/ocr-scanner" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>📷 Scan Bill</Link>}
          {isAdmin && <Link to="/admin/dashboard" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>⚡ Admin</Link>}

          <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,.1)' }}>
            {user ? (
              <button className="btn btn-danger" style={{ width: '100%' }} onClick={() => { handleLogout(); setMobileOpen(false) }}>
                <Icon name="logout" size={16} /> Logout
              </button>
            ) : (
              <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMobileOpen(false)}>
                <Icon name="person" size={16} /> Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
