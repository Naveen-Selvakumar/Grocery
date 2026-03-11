import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { getWishlist, removeFromWishlist, moveToCart } from '../services/api'
import { useCart } from '../context/CartContext'
import { PageLoader } from '../components/Loader'
import '../styles/product.css'

export default function Wishlist() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [moving, setMoving] = useState(null)
  const [removing, setRemoving] = useState(null)
  const { fetchCart } = useCart()

  const load = () => {
    setLoading(true)
    getWishlist().then(({ data }) => setItems(data.data?.products || [])).catch(() => setItems([])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleRemove = async (productId) => {
    setRemoving(productId)
    try { await removeFromWishlist(productId); setItems((prev) => prev.filter((p) => p._id !== productId)) }
    catch (e) { /* ignore */ } finally { setRemoving(null) }
  }

  const handleMoveToCart = async (productId) => {
    setMoving(productId)
    try { await moveToCart(productId); await fetchCart(); setItems((prev) => prev.filter((p) => p._id !== productId)) }
    catch (e) { /* ignore */ } finally { setMoving(null) }
  }

  const imgBase = (path) => path || ''

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb"><Link to="/">Home</Link><span className="breadcrumb-sep">/</span><span>Wishlist</span></div>
          <h1>My Wishlist</h1>
          <p>{items.length} {items.length === 1 ? 'item' : 'items'} saved</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Icon name="favorite_border" size={48} style={{ color: 'var(--text-muted)' }} /></div>
            <h2>Your wishlist is empty</h2>
            <p>Save products you love and revisit them anytime.</p>
            <Link to="/products" className="btn btn-primary btn-lg">Explore Products</Link>
          </div>
        ) : (
          <div className="products-grid">
            {items.map((product) => {
              const discounted = product.discountPercentage > 0
              const finalPrice = discounted ? (product.price * (1 - product.discountPercentage / 100)).toFixed(2) : product.price?.toFixed(2)
              return (
                <div key={product._id} className="product-card">
                  <div className="product-image-wrap">
                    {discounted && <span className="badge badge-danger product-discount-badge">{product.discountPercentage}% OFF</span>}
                    <Link to={`/products/${product._id}`}>
                      <img src={imgBase(product.image)} alt={product.name} className="product-img"
                        onError={(e) => { e.target.onerror=null; e.target.style.display='none' }} />
                    </Link>
                  </div>
                  <div className="product-body">
                    <Link to={`/products/${product._id}`}><h4 className="product-name">{product.name}</h4></Link>
                    <div className="product-price-row">
                      {discounted && <span className="old-price">₹{product.price?.toFixed(2)}</span>}
                      <span className="current-price">₹{finalPrice}</span>
                    </div>
                    <div className="wishlist-card-actions">
                      <button className="btn btn-primary btn-sm" style={{ flex: 1 }}
                        onClick={() => handleMoveToCart(product._id)} disabled={moving === product._id}>
                        <Icon name="shopping_cart" size={13} style={{ marginRight: 4 }} />
                        {moving === product._id ? 'Moving...' : 'Move to Cart'}
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => handleRemove(product._id)} disabled={removing === product._id}>
                        <Icon name="delete" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
