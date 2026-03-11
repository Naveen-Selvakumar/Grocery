import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { getProductById, getProductReviews, addReview } from '../services/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import RatingStars from '../components/RatingStars'
import { PageLoader } from '../components/Loader'
import '../styles/product.css'

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { user } = useAuth()

  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('description')
  const [addingToCart, setAddingToCart] = useState(false)

  const [myReview, setMyReview] = useState({ rating: 5, comment: '' })
  const [submitting, setSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([getProductById(id), getProductReviews(id)])
      .then(([pRes, rRes]) => {
        setProduct(pRes.data.data)
        setReviews(rRes.data.data || [])
      })
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false))
  }, [id])

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return }
    setAddingToCart(true)
    await addItem(product._id, qty)
    setAddingToCart(false)
  }

  const handleReview = async (e) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    setSubmitting(true); setReviewError('')
    try {
      await addReview(id, myReview)
      const { data } = await getProductReviews(id)
      setReviews(data.data || [])
      setMyReview({ rating: 5, comment: '' })
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Could not submit review')
    } finally { setSubmitting(false) }
  }

  const imgBase = (path) => path || '/placeholder.png'

  if (loading) return <PageLoader />
  if (!product) return null

  const images = product.images?.length > 0 ? product.images : [product.image || '']
  const discounted = product.discountPercentage > 0
  const finalPrice = discounted
    ? (product.price * (1 - product.discountPercentage / 100)).toFixed(2)
    : product.price?.toFixed(2)

  return (
    <div>
      {/* Breadcrumb */}
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span className="breadcrumb-sep"><Icon name="chevron_right" size={12} /></span>
            <Link to="/products">Products</Link>
            <span className="breadcrumb-sep"><Icon name="chevron_right" size={12} /></span>
            <span>{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '1rem', paddingBottom: '3rem' }}>

        {/* ── Main Product Section ─────────────────────────────── */}
        <div className="product-details-layout">

          {/* Gallery */}
          <div className="product-gallery">
            <div className="main-image-wrap">
              {discounted && <span className="badge badge-danger product-discount-badge">{product.discountPercentage}% OFF</span>}
              <img src={imgBase(images[activeImg])} alt={product.name} className="main-product-img" onError={(e) => { e.target.onerror=null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3C/svg%3E" }} />
            </div>
            {images.length > 1 && (
              <div className="thumbnail-row">
                {images.map((img, idx) => (
                  <img key={idx} src={imgBase(img)} alt={`thumb-${idx}`} className={`thumbnail ${activeImg === idx ? 'active' : ''}`}
                    onClick={() => setActiveImg(idx)}
                    onError={(e) => { e.target.onerror=null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23f3f4f6'/%3E%3C/svg%3E" }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="product-info-panel">
            {product.category && (
              <Link to={`/products?category=${product.category.slug}`} className="category-badge">{product.category.name}</Link>
            )}
            <h1 className="product-title">{product.name}</h1>

            <div className="product-rating-row">
              <RatingStars rating={product.rating?.average || 0} />
              <span className="rating-count">({product.rating?.count || 0} reviews)</span>
            </div>

            <div className="product-price-block">
              {discounted && <span className="original-price">₹{product.price?.toFixed(2)}</span>}
              <span className="final-price">₹{finalPrice}</span>
              {discounted && <span className="discount-tag">{product.discountPercentage}% off</span>}
              {product.unit && <span className="unit-tag">per {product.unit}</span>}
            </div>

            {/* Stock Badge */}
            <div style={{ marginBottom: '1rem' }}>
              {product.quantity > 10
                ? <span className="badge badge-success"><Icon name="verified_user" size={12} style={{ marginRight: 4 }} />In Stock</span>
                : product.quantity > 0
                  ? <span className="badge badge-warning">Only {product.quantity} left!</span>
                  : <span className="badge badge-danger">Out of Stock</span>}
            </div>

            {/* Short Description */}
            {product.description && (
              <p className="product-short-desc">{product.description.substring(0, 160)}{product.description.length > 160 ? '...' : ''}</p>
            )}

            <hr style={{ borderColor: 'var(--border)', margin: '1.2rem 0' }} />

            {/* Quantity + Add to Cart */}
            {product.quantity > 0 && (
              <div className="cart-actions">
                <div className="qty-control">
                  <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}><Icon name="remove" size={16} /></button>
                  <span className="qty-val">{qty}</span>
                  <button className="qty-btn" onClick={() => setQty(Math.min(product.quantity, qty + 1))}><Icon name="add" size={16} /></button>
                </div>
                <button className="btn btn-primary btn-lg" onClick={handleAddToCart} disabled={addingToCart} style={{ flex: 1 }}>
                  <Icon name="shopping_cart" style={{ marginRight: 8 }} size={18} />
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
            )}

            {/* Trust badges */}
            <div className="trust-badges">
              <div className="trust-item"><Icon name="local_shipping" size={18} /><span>Free delivery over ₹499</span></div>
              <div className="trust-item"><Icon name="verified_user" size={18} /><span>Quality guaranteed</span></div>
              <div className="trust-item"><Icon name="refresh" size={18} /><span>Easy returns</span></div>
            </div>

            {/* Product Meta */}
            <div className="product-meta">
              {product.brand && <div><span className="meta-label">Brand:</span> {product.brand}</div>}
              {product.weight && <div><span className="meta-label">Weight:</span> {product.weight}</div>}
              {product.sku && <div><span className="meta-label">SKU:</span> {product.sku}</div>}
            </div>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <div className="product-tabs" style={{ marginTop: '2.5rem' }}>
          <div className="tab-nav">
            {['description', 'reviews'].map((t) => (
              <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t === 'description' ? 'Description' : `Reviews (${reviews.length})`}
              </button>
            ))}
          </div>

          {tab === 'description' && (
            <div className="tab-content">
              <p style={{ lineHeight: 1.7 }}>{product.description || 'No description available.'}</p>
              {product.nutritionInfo && (
                <div style={{ marginTop: '1rem' }}>
                  <h4>Nutrition Information</h4>
                  <p>{product.nutritionInfo}</p>
                </div>
              )}
            </div>
          )}

          {tab === 'reviews' && (
            <div className="tab-content">
              {/* Write Review */}
              {user && (
                <form className="review-form" onSubmit={handleReview}>
                  <h4 style={{ marginBottom: '1rem' }}>Write a Review</h4>
                  {reviewError && <div className="alert-error">{reviewError}</div>}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label">Your Rating</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Icon key={s} name="star" size={24}
                          style={{ cursor: 'pointer', color: s <= myReview.rating ? '#f59e0b' : 'var(--border)', fill: s <= myReview.rating ? '#f59e0b' : 'none' }}
                          onClick={() => setMyReview((prev) => ({ ...prev, rating: s }))}
                        />
                      ))}
                    </div>
                  </div>
                  <textarea className="form-control" rows={3} placeholder="Share your experience..."
                    value={myReview.comment} onChange={(e) => setMyReview((prev) => ({ ...prev, comment: e.target.value }))} required />
                  <button className="btn btn-primary" type="submit" disabled={submitting} style={{ marginTop: '0.75rem' }}>
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}

              {/* Review List */}
              {reviews.length === 0
                ? <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No reviews yet. Be the first!</p>
                : reviews.map((r) => (
                  <div key={r._id} className="review-card">
                    <div className="review-header">
                      <div className="reviewer-avatar"><Icon name="person" size={16} /></div>
                      <div>
                        <div className="reviewer-name">{r.user?.name || 'Anonymous'}</div>
                        <RatingStars rating={r.rating} size={14} />
                      </div>
                      <div className="review-date">{new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                    <p className="review-comment">{r.comment}</p>
                    {r.verifiedPurchase && <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Verified Purchase</span>}
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
