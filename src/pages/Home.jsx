import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { getProducts, getCategories } from '../services/api'
import ProductCard from '../components/ProductCard'
import CategoryCard from '../components/CategoryCard'
import { ProductCardSkeleton } from '../components/Loader'

/* ── Hero Slides ─────────────────────────────────────────────── */
const HERO_SLIDES = [
  {
    title: 'Fresh Groceries\nDelivered Fast',
    subtitle: 'Order fresh fruits, vegetables & daily needs delivered in 30 minutes',
    bg: 'linear-gradient(135deg, #1E1E2F 0%, #2d1b00 100%)',
    accent: '#FF6B00',
    emoji: '🥦🍎🥛🥩',
  },
  {
    title: 'Up to 40% Off\nFresh Produce',
    subtitle: 'Super savings on seasonal fruits and vegetables every day',
    bg: 'linear-gradient(135deg, #0c3c1e 0%, #155734 100%)',
    accent: '#22c55e',
    emoji: '🎉🥕🍊🍇',
  },
  {
    title: 'New Arrivals\nEvery Day',
    subtitle: 'Discover the latest products from local farms and trusted brands',
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #160040 100%)',
    accent: '#a855f7',
    emoji: '✨🍓🥑🫐',
  },
]

/* ── Features Strip ──────────────────────────────────────────── */
const FEATURES = [
  { icon: <Icon name="local_shipping" size={22} />, title: 'Free Delivery', desc: 'Orders over ₹500' },
  { icon: <Icon name="security" size={22} />, title: 'Secure Payment', desc: 'Encrypted checkout' },
  { icon: <Icon name="refresh" size={22} />, title: 'Easy Returns', desc: '7-day return policy' },
  { icon: <Icon name="local_offer" size={22} />, title: 'Best Prices', desc: 'Guaranteed lowest' },
]

export default function Home() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [popular, setPopular] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [heroIndex, setHeroIndex] = useState(0)
  const heroTimer = useRef(null)

  useEffect(() => {
    Promise.all([
      getProducts({ limit: 8, sort: 'latest' }),
      getProducts({ limit: 8, sort: 'popular' }),
      getCategories(),
    ]).then(([p1, p2, cats]) => {
      setProducts(p1.data.data || [])
      setPopular(p2.data.data || [])
      setCategories(cats.data.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  // Auto-advance hero
  useEffect(() => {
    heroTimer.current = setInterval(() => setHeroIndex((i) => (i + 1) % HERO_SLIDES.length), 5000)
    return () => clearInterval(heroTimer.current)
  }, [])

  const goHero = (dir) => {
    clearInterval(heroTimer.current)
    setHeroIndex((i) => (i + dir + HERO_SLIDES.length) % HERO_SLIDES.length)
  }

  const slide = HERO_SLIDES[heroIndex]

  return (
    <div>
      {/* ── Hero Banner ─────────────────────────────────────────── */}
      <section style={{ background: slide.bg, color: '#fff', padding: '80px 0', position: 'relative', overflow: 'hidden', transition: 'background 0.7s ease', minHeight: 460, display: 'flex', alignItems: 'center' }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', fontSize: 'clamp(5rem, 15vw, 12rem)', opacity: .12, userSelect: 'none', letterSpacing: 20 }}>
          {slide.emoji}
        </div>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse at 20% 50%, rgba(255,107,0,.08) 0%, transparent 60%)' }} />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: 560 }}>
            <span style={{ display: 'inline-block', background: `${slide.accent}22`, border: `1px solid ${slide.accent}44`, color: slide.accent, padding: '6px 16px', borderRadius: 100, fontSize: '0.8rem', fontWeight: 700, marginBottom: 20, letterSpacing: 1 }}>
              🔥 Special Offer Today
            </span>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', whiteSpace: 'pre-line', color: '#fff', marginBottom: 18, lineHeight: 1.2 }}>
              {slide.title}
            </h1>
            <p style={{ fontSize: '1.05rem', opacity: .8, marginBottom: 32, lineHeight: 1.7, maxWidth: 440 }}>{slide.subtitle}</p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/products')}>
                Shop Now <Icon name="arrow_forward" size={16} />
              </button>
              <button className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,.4)', color: '#fff' }}
                onClick={() => navigate('/products?sort=popular')}>
                View Deals
              </button>
            </div>
          </div>
        </div>

        {/* Slider controls */}
        <button onClick={() => goHero(-1)} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.12)', border: 'none', color: '#fff', width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', zIndex: 3, transition: 'var(--transition)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.12)'}>
          <Icon name="chevron_left" size={22} />
        </button>
        <button onClick={() => goHero(1)} style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.12)', border: 'none', color: '#fff', width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', zIndex: 3, transition: 'var(--transition)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.12)'}>
          <Icon name="chevron_right" size={22} />
        </button>

        {/* Dots */}
        <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 3 }}>
          {HERO_SLIDES.map((_, i) => (
            <button key={i} onClick={() => setHeroIndex(i)} style={{ width: i === heroIndex ? 24 : 8, height: 8, borderRadius: 100, border: 'none', cursor: 'pointer', background: i === heroIndex ? slide.accent : 'rgba(255,255,255,.4)', transition: 'all .3s' }} />
          ))}
        </div>
      </section>

      {/* ── Features Strip ──────────────────────────────────────── */}
      <section style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 0 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px', borderRight: i < FEATURES.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 44, height: 44, background: 'rgba(255,107,0,.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '1.2rem', flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{f.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Shop by Category</h2>
            <p>Explore our wide range of fresh produce and grocery essentials</p>
          </div>
          {categories.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16 }}>
              {categories.slice(0, 10).map((cat, i) => <CategoryCard key={cat._id} category={cat} index={i} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16 }}>
              {['Fruits', 'Vegetables', 'Dairy', 'Meat', 'Bakery', 'Beverages', 'Snacks', 'Spices'].map((name, i) => (
                <CategoryCard key={name} category={{ name, slug: name.toLowerCase(), _id: i }} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Featured Products ────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Featured Products</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Handpicked fresh products just for you</p>
            </div>
            <Link to="/products" className="btn btn-outline btn-sm">View All <Icon name="arrow_forward" size={14} /></Link>
          </div>
          <div className="products-grid">
            {loading
              ? Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
              : products.length > 0
                ? products.map((p) => <ProductCard key={p._id} product={p} />)
                : <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>No products yet. Check back soon!</p>
            }
          </div>
        </div>
      </section>

      {/* ── Promo Banner ─────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { bg: 'linear-gradient(135deg, #ff6b00, #ff9a3d)', title: 'Daily Essentials', sub: 'Milk, Eggs, Bread & more', cta: 'Shop Now', emoji: '🥛' },
              { bg: 'linear-gradient(135deg, #0891b2, #06b6d4)', title: 'Fresh Fruits', sub: 'Farm fresh, delivered daily', cta: 'Explore', emoji: '🍎' },
              { bg: 'linear-gradient(135deg, #16a34a, #22c55e)', title: 'Organic Veggies', sub: 'Certified organic produce', cta: 'Buy Now', emoji: '🥦' },
            ].map((promo, i) => (
              <div key={i} style={{ background: promo.bg, borderRadius: 'var(--radius-lg)', padding: '32px 28px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'transform 0.25s, box-shadow 0.25s', overflow: 'hidden', position: 'relative' }}
                onClick={() => navigate('/products')}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,.2)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                <div style={{ zIndex: 1 }}>
                  <h3 style={{ color: '#fff', fontSize: '1.15rem', marginBottom: 6 }}>{promo.title}</h3>
                  <p style={{ opacity: .85, fontSize: '0.82rem', marginBottom: 16 }}>{promo.sub}</p>
                  <button className="btn" style={{ background: 'rgba(255,255,255,.25)', color: '#fff', backdropFilter: 'blur(10px)', padding: '8px 18px', fontSize: '0.82rem' }}>
                    {promo.cta} <Icon name="arrow_forward" size={14} />
                  </button>
                </div>
                <div style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', opacity: .3, position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', userSelect: 'none' }}>{promo.emoji}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular Products ─────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Popular This Week</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Most loved by our customers</p>
            </div>
            <Link to="/products?sort=popular" className="btn btn-outline btn-sm">View All <Icon name="arrow_forward" size={14} /></Link>
          </div>
          <div className="products-grid">
            {loading
              ? Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
              : popular.length > 0
                ? popular.map((p) => <ProductCard key={p._id} product={p} />)
                : products.map((p) => <ProductCard key={p._id} product={p} />)
            }
          </div>
        </div>
      </section>

      {/* ── Newsletter ───────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, var(--secondary) 0%, var(--secondary-light) 100%)', padding: '64px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>📧</div>
          <h2 style={{ color: '#fff', fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', marginBottom: 10 }}>Subscribe for Exclusive Deals</h2>
          <p style={{ color: 'rgba(255,255,255,.7)', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
            Get weekly offers, early access to sales, and recipes delivered straight to your inbox.
          </p>
          <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: 0, maxWidth: 460, margin: '0 auto', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,.3)' }}>
            <input type="email" placeholder="Enter your email address" className="form-control"
              style={{ borderRadius: 0, border: 'none', flex: 1, padding: '14px 20px', fontSize: '0.95rem' }} />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: 0, padding: '14px 28px', flexShrink: 0 }}>
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
