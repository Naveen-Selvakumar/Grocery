import { Link } from 'react-router-dom'
import { Icon } from './Icon'

export default function Footer() {
  return (
    <footer style={{ background: 'var(--secondary)', color: 'rgba(255,255,255,.8)', padding: '60px 0 0' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, paddingBottom: 48 }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, background: 'var(--primary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>🛒</div>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>Smart Grocery</span>
            </div>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.7, opacity: .75, marginBottom: 20 }}>
              Fresh groceries delivered to your door. Quality products, best prices, fastest delivery.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {['instagram', 'facebook', 'share'].map((iconName, i) => (
                <a key={i} href="#" style={{ width: 36, height: 36, background: 'rgba(255,255,255,.08)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'var(--transition)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.08)'}>
                  <Icon name={iconName} size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: '#fff', marginBottom: 20, fontSize: '1rem' }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['/', 'Home'], ['/products', 'Products'], ['/cart', 'Cart'], ['/orders', 'My Orders'], ['/ocr-scanner', 'Bill Scanner']].map(([to, label]) => (
                <Link key={to} to={to} style={{ fontSize: '0.88rem', opacity: .75, transition: 'opacity 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = .75}>{label}</Link>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 style={{ color: '#fff', marginBottom: 20, fontSize: '1rem' }}>Categories</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Fresh Fruits', 'Vegetables', 'Dairy & Eggs', 'Meat & Fish', 'Bakery', 'Beverages'].map((cat) => (
                <Link key={cat} to={`/products?category=${cat.toLowerCase().replace(/ & /g, '-')}`}
                  style={{ fontSize: '0.88rem', opacity: .75, transition: 'opacity 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = .75}>{cat}</Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: '#fff', marginBottom: 20, fontSize: '1rem' }}>Contact Us</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                ['location_on', '123 Market Street, Food City, FC 12345'],
                ['phone', '+91 98765 43210'],
                ['mail', 'support@smartgrocery.com'],
              ].map(([iconName, text], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.86rem', opacity: .8 }}>
                  <Icon name={iconName} size={16} style={{ flexShrink: 0, marginTop: 2, color: 'var(--primary)' }} />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', padding: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: '0.82rem', opacity: .6 }}>
          <span>© {new Date().getFullYear()} Smart Grocery Store. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
