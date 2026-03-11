import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { placeOrder, createRazorpayOrder, verifyRazorpayPayment } from '../services/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import '../styles/cart.css'

/* ── Load Razorpay script dynamically ───────────────────── */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const PAYMENT_METHODS = [
  {
    value: 'UPI',
    label: 'Pay via UPI',
    sub: 'Google Pay, PhonePe, Paytm & all UPI apps',
    icon: <Icon name="smartphone" size={22} />,
    badge: 'Instant',
    badgeColor: '#16a34a',
  },
  {
    value: 'COD',
    label: 'Cash on Delivery',
    sub: 'Pay when your order arrives',
    icon: <Icon name="inventory_2" size={22} />,
    badge: null,
  },
]

export default function Checkout() {
  const navigate = useNavigate()
  const { cart, fetchCart } = useCart()
  const { user }            = useAuth()

  const items    = cart?.items || []
  const subtotal = cart?.totalPrice || 0
  const shipping = subtotal >= 499 ? 0 : 49
  const tax      = +(subtotal * 0.05).toFixed(2)
  const total    = +(subtotal + shipping + tax).toFixed(2)

  const [address, setAddress] = useState({
    street: '', city: '', state: '', zipCode: '', country: 'India',
  })
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [placing,  setPlacing]  = useState(false)
  const [error,    setError]    = useState('')

  const handleChange = (e) =>
    setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const validateAddress = () => {
    if (!address.street || !address.city || !address.state || !address.zipCode) {
      setError('Please fill all address fields'); return false
    }
    setError(''); return true
  }

  /* ── Razorpay UPI Payment ───────────────────────────── */
  const handleUPIPayment = async () => {
    const loaded = await loadRazorpayScript()
    if (!loaded) {
      setError('Failed to load payment gateway. Check your internet connection.')
      setPlacing(false)
      return
    }

    let rzpOrder
    try {
      const { data } = await createRazorpayOrder({ amount: total })
      rzpOrder = data.data
    } catch (err) {
      setError(err.response?.data?.message || 'Could not initiate payment.')
      setPlacing(false)
      return
    }

    const options = {
      key:         rzpOrder.keyId,
      amount:      rzpOrder.amount,
      currency:    rzpOrder.currency,
      name:        'Arunachalam Grocery Store',
      description: 'Order Payment',
      order_id:    rzpOrder.orderId,
      prefill: {
        name:    user?.name  || '',
        email:   user?.email || '',
        contact: user?.phone || '',
      },
      theme: { color: '#e53935' },
      modal: {
        ondismiss: () => {
          setPlacing(false)
          setError('Payment cancelled. Please try again.')
        },
      },
      handler: async (response) => {
        try {
          await verifyRazorpayPayment({
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
          })
          await placeOrder({
            shippingAddress:    address,
            paymentMethod:      'UPI',
            razorpayPaymentId:  response.razorpay_payment_id,
            razorpayOrderId:    response.razorpay_order_id,
            razorpaySignature:  response.razorpay_signature,
            isPaid: true,
          })
          await fetchCart()
          navigate('/orders', { state: { success: true, method: 'UPI' } })
        } catch (err) {
          setError(err.response?.data?.message || 'Payment verified but order failed. Contact support.')
          setPlacing(false)
        }
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (resp) => {
      setError(`Payment failed: ${resp.error.description}`)
      setPlacing(false)
    })
    rzp.open()
  }

  /* ── COD ────────────────────────────────────────────── */
  const handleCOD = async () => {
    try {
      await placeOrder({ shippingAddress: address, paymentMethod: 'COD' })
      await fetchCart()
      navigate('/orders', { state: { success: true, method: 'COD' } })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.')
      setPlacing(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateAddress()) return
    setPlacing(true); setError('')
    if (paymentMethod === 'UPI') await handleUPIPayment()
    else await handleCOD()
  }

  if (items.length === 0) return (
    <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
      <Icon name="inventory_2" size={48} style={{ color: '#9ca3af' }} />
      <h2 style={{ marginTop: 16 }}>Your cart is empty</h2>
      <Link to="/products" className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse Products</Link>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/cart">Cart</Link>
            <span className="breadcrumb-sep">/</span>
            <span>Checkout</span>
          </div>
          <h1>Checkout</h1>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        {error && (
          <div className="alert-error" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="error" size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="checkout-layout">
            <div>
              {/* Address */}
              <div className="checkout-card">
                <h3 className="checkout-section-title"><Icon name="location_on" size={18} /> Shipping Address</h3>
                <div className="form-grid-2">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Street Address *</label>
                    <input className="form-control" name="street"
                      placeholder="House no., Street, Area, Landmark"
                      value={address.street} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input className="form-control" name="city" placeholder="City"
                      value={address.city} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <input className="form-control" name="state" placeholder="State"
                      value={address.state} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PIN Code *</label>
                    <input className="form-control" name="zipCode" placeholder="6-digit PIN"
                      value={address.zipCode} onChange={handleChange} required maxLength={6} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <input className="form-control" name="country" value={address.country}
                      onChange={handleChange} />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="checkout-card" style={{ marginTop: '1.5rem' }}>
                <h3 className="checkout-section-title"><Icon name="payment" size={18} /> Payment Method</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {PAYMENT_METHODS.map((m) => (
                    <label key={m.value} style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '16px 18px', borderRadius: 12, cursor: 'pointer',
                      border: paymentMethod === m.value ? '2px solid #e53935' : '2px solid #e5e7eb',
                      background: paymentMethod === m.value ? '#fff5f5' : '#fff',
                      transition: 'all .15s',
                    }}>
                      <input type="radio" name="payment" value={m.value}
                        checked={paymentMethod === m.value}
                        onChange={() => setPaymentMethod(m.value)}
                        style={{ display: 'none' }} />
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: paymentMethod === m.value ? '#e53935' : '#f3f4f6',
                        color: paymentMethod === m.value ? '#fff' : '#6b7280',
                        transition: 'all .15s',
                      }}>
                        {m.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, color: '#0f1d35', fontSize: '0.95rem' }}>{m.label}</span>
                          {m.badge && (
                            <span style={{
                              fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                              background: '#f0fdf4', color: m.badgeColor, border: `1px solid ${m.badgeColor}`,
                            }}>{m.badge}</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>{m.sub}</div>
                      </div>
                      {paymentMethod === m.value && <Icon name="check_circle" size={20} style={{ color: '#e53935' }} />}
                    </label>
                  ))}
                </div>

                {paymentMethod === 'UPI' && (
                  <div style={{
                    marginTop: 16, padding: '12px 14px', borderRadius: 10,
                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}>
                    <Icon name="security" size={16} style={{ color: '#16a34a', marginTop: 2, flexShrink: 0 }} />
                    <div style={{ fontSize: '0.8rem', color: '#15803d', lineHeight: 1.5 }}>
                      <strong>Secure Payment via Razorpay</strong><br />
                      You'll be redirected to a secure Razorpay page. Supports Google Pay, PhonePe, Paytm &amp; all UPI IDs.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <aside>
              <div className="cart-summary sticky-summary">
                <h3 className="summary-title">Order Summary</h3>
                <div className="checkout-items-list">
                  {items.map((item) => (
                    <div key={item._id} className="checkout-item-row">
                      <span className="checkout-item-name">{item.product?.name}</span>
                      <span className="checkout-item-qty">×{item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <hr style={{ borderColor: 'var(--border)', margin: '1rem 0' }} />
                <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span style={{ color: shipping === 0 ? 'var(--success)' : 'inherit' }}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                <div className="summary-row"><span>Tax (5%)</span><span>₹{tax}</span></div>
                <hr style={{ borderColor: 'var(--border)', margin: '1rem 0' }} />
                <div className="summary-row total-row"><span>Total</span><span>₹{total}</span></div>

                <div style={{
                  margin: '12px 0', padding: '8px 12px', borderRadius: 8, fontSize: '0.8rem',
                  background: paymentMethod === 'UPI' ? '#eff6ff' : '#f9fafb',
                  color: paymentMethod === 'UPI' ? '#2563eb' : '#6b7280',
                  border: `1px solid ${paymentMethod === 'UPI' ? '#bfdbfe' : '#e5e7eb'}`,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {paymentMethod === 'UPI'
                    ? <><Icon name="smartphone" size={13} /> Paying ₹{total} via UPI (Razorpay)</>
                    : <><Icon name="inventory_2" size={13} /> Pay ₹{total} on delivery</>
                  }
                </div>

                <button type="submit" className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: '0.75rem' }} disabled={placing}>
                  {placing ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span style={{
                        width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block',
                        animation: 'spin 0.7s linear infinite'
                      }} />
                      {paymentMethod === 'UPI' ? 'Opening Payment…' : 'Placing Order…'}
                    </span>
                  ) : paymentMethod === 'UPI'
                    ? <><Icon name="smartphone" style={{ marginRight: 8 }} size={16} />Pay ₹{total} via UPI</>
                    : <><Icon name="local_shipping" style={{ marginRight: 8 }} size={16} />Place Order — ₹{total}</>
                  }
                </button>

                <p style={{ fontSize: '0.72rem', color: '#9ca3af', textAlign: 'center', marginTop: 10 }}>
                  <Icon name="security" size={11} style={{ marginRight: 4 }} />
                  256-bit SSL encrypted. Powered by Razorpay.
                </p>
              </div>
            </aside>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
