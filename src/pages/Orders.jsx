import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { getMyOrders, addReview } from '../services/api'
import { PageLoader } from '../components/Loader'
import '../styles/cart.css'

const STATUS_STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered']

const statusColor = {
  Pending: '#f59e0b',
  Processing: '#3b82f6',
  Shipped: '#8b5cf6',
  Delivered: '#10b981',
  Cancelled: '#ef4444',
}

/* ── Inline review form for a single product ─────────────── */
function ReviewForm({ productId, productName, onDone }) {
  const [rating, setRating]     = useState(5)
  const [hovered, setHovered]   = useState(0)
  const [comment, setComment]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!comment.trim()) { setError('Please write a comment'); return }
    setSaving(true); setError('')
    try {
      await addReview({ productId, rating, comment })
      onDone(productId, rating)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit review')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}
      style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1rem 1.1rem', marginTop: 8 }}>
      <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: 10, color: '#0f172a' }}>
        Review: {productName}
      </div>

      {/* Star selector */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {[1, 2, 3, 4, 5].map(s => (
          <button key={s} type="button"
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(s)}
            style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', fontSize: '1.5rem',
              color: s <= (hovered || rating) ? '#f59e0b' : '#d1d5db',
              transform: s <= (hovered || rating) ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform .15s, color .15s' }}>
            ★
          </button>
        ))}
        <span style={{ fontSize: '.8rem', color: '#64748b', alignSelf: 'center', marginLeft: 4 }}>
          {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hovered || rating]}
        </span>
      </div>

      {/* Comment */}
      <textarea
        rows={3}
        className="form-control"
        placeholder="Share your experience with this product…"
        value={comment}
        onChange={e => setComment(e.target.value)}
        style={{ fontSize: '.87rem', resize: 'vertical', marginBottom: 8 }}
      />

      {error && <div style={{ color: '#dc2626', fontSize: '.8rem', marginBottom: 6 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" type="submit" disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon name="rate_review" size={14} />
          {saving ? 'Submitting…' : 'Submit Review'}
        </button>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => onDone(null)}>Cancel</button>
      </div>
    </form>
  )
}

export default function Orders() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  // openReview: productId currently showing review form
  const [openReview, setOpenReview] = useState(null)
  // reviewed: Set of productIds reviewed in this session
  const [reviewed, setReviewed] = useState(new Set())
  const location  = useLocation()
  const justOrdered = location.state?.success

  useEffect(() => {
    getMyOrders()
      .then(({ data }) => setOrders(data.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  const handleReviewDone = (productId) => {
    if (productId) setReviewed(prev => new Set([...prev, productId]))
    setOpenReview(null)
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb"><Link to="/">Home</Link><span className="breadcrumb-sep">/</span><span>My Orders</span></div>
          <h1>My Orders</h1>
          <p>{orders.length} {orders.length === 1 ? 'order' : 'orders'} placed</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        {justOrdered && (
          <div className="success-banner" style={{ marginBottom: '1.5rem' }}>
            <Icon name="check_circle" size={20} style={{ marginRight: 8 }} />
            Order placed successfully! You'll receive a confirmation soon.
          </div>
        )}

        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Icon name="inventory_2" size={48} style={{ color: 'var(--text-muted)' }} /></div>
            <h2>No orders yet</h2>
            <p>Start shopping to see your order history here.</p>
            <Link to="/products" className="btn btn-primary btn-lg">Shop Now</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const stepIdx = STATUS_STEPS.indexOf(order.orderStatus)
              const isDelivered = order.orderStatus === 'Delivered'
              return (
                <div key={order._id} className="order-card">
                  <div className="order-card-header">
                    <div>
                      <div className="order-id">Order #{order._id.slice(-8).toUpperCase()}</div>
                      <div className="order-date">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge" style={{ backgroundColor: statusColor[order.orderStatus] + '20', color: statusColor[order.orderStatus], border: `1px solid ${statusColor[order.orderStatus]}` }}>
                        {order.orderStatus}
                      </span>
                      <div className="order-total" style={{ marginTop: 4 }}>₹{order.totalAmount?.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Status Stepper */}
                  {order.orderStatus !== 'Cancelled' && (
                    <div className="status-stepper">
                      {STATUS_STEPS.map((step, i) => (
                        <div key={step} className={`step ${i <= stepIdx ? 'done' : ''} ${i === stepIdx ? 'current' : ''}`}>
                          <div className="step-dot">{i < stepIdx ? '✓' : i + 1}</div>
                          <div className="step-label">{step}</div>
                          {i < STATUS_STEPS.length - 1 && <div className={`step-line ${i < stepIdx ? 'done' : ''}`} />}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="order-items-preview">
                    {(order.items || []).map((item, idx) => {
                      const pid = item.product?._id || item.product
                      const alreadyReviewed = reviewed.has(pid)
                      const showingForm = openReview === pid
                      return (
                        <div key={idx}>
                          <div className="order-item-preview" style={{ alignItems: 'center' }}>
                            <span className="order-item-name">{item.product?.name || 'Product'}</span>
                            <span className="order-item-qty">×{item.quantity}</span>
                            <span className="order-item-price">₹{(item.price * item.quantity).toFixed(2)}</span>

                            {/* Rate button — only for delivered orders */}
                            {isDelivered && pid && (
                              alreadyReviewed ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.75rem', color: '#10b981', fontWeight: 600, marginLeft: 8, whiteSpace: 'nowrap' }}>
                                  <Icon name="check_circle" size={13} /> Reviewed
                                </span>
                              ) : (
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => setOpenReview(showingForm ? null : pid)}
                                  style={{ marginLeft: 8, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4, fontSize: '.75rem',
                                    color: showingForm ? '#6b7280' : '#f59e0b',
                                    borderColor: showingForm ? '#e5e7eb' : '#fde68a' }}>
                                  <Icon name="star" size={13} />
                                  {showingForm ? 'Cancel' : 'Rate'}
                                </button>
                              )
                            )}
                          </div>

                          {/* Inline review form */}
                          {showingForm && (
                            <ReviewForm
                              productId={pid}
                              productName={item.product?.name || 'this product'}
                              onDone={handleReviewDone}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="order-card-footer">
                    <div className="order-address">
                      <span>📍</span>
                      <span>{order.shippingAddress?.city}, {order.shippingAddress?.state}</span>
                    </div>
                    <div className="order-payment">{order.paymentMethod}</div>
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
