import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { useCart } from '../context/CartContext'
import CartItem from '../components/CartItem'
import '../styles/cart.css'

export default function Cart() {
  const { cart, cartCount, emptyCart } = useCart()
  const navigate = useNavigate()

  const items = cart?.items || []
  const subtotal = cart?.totalPrice || 0
  const shipping = subtotal >= 499 ? 0 : 49
  const tax = +(subtotal * 0.05).toFixed(2)
  const total = +(subtotal + shipping + tax).toFixed(2)

  if (cartCount === 0) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add items to your cart to get started!</p>
          <Link to="/products" className="btn btn-primary btn-lg">Browse Products</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb"><Link to="/">Home</Link><span className="breadcrumb-sep">/</span><span>Cart</span></div>
          <h1>My Cart</h1>
          <p>{cartCount} {cartCount === 1 ? 'item' : 'items'} in your cart</p>
        </div>
      </div>

      <div className="container cart-container">
        <div className="cart-layout">
          {/* Items */}
          <div>
            <div className="cart-items-header">
              <span>Product</span>
              <button className="btn btn-ghost btn-sm" onClick={emptyCart}
                style={{ color: 'var(--danger)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="delete" size={13} /> Clear Cart
              </button>
            </div>
            {items.map((item) => <CartItem key={item._id} item={item} />)}
          </div>

          {/* Summary */}
          <aside>
            <div className="cart-summary sticky-summary">
              <h3 className="summary-title">Order Summary</h3>

              <div className="summary-row">
                <span>Subtotal ({cartCount} items)</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span style={{ color: shipping === 0 ? 'var(--success)' : 'inherit' }}>
                  {shipping === 0 ? 'FREE' : `₹${shipping}`}
                </span>
              </div>
              <div className="summary-row">
                <span>Tax (5%)</span>
                <span>₹{tax}</span>
              </div>

              {shipping > 0 && (
                <div className="savings-banner">
                <Icon name="local_offer" size={13} /> Add ₹{(499 - subtotal).toFixed(0)} more for FREE delivery
                </div>
              )}

              <hr style={{ borderColor: 'var(--border)', margin: '1rem 0' }} />
              <div className="summary-row total-row">
                <span>Total</span>
                <span>₹{total}</span>
              </div>

              <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1rem' }}
                onClick={() => navigate('/checkout')}>
                Proceed to Checkout <Icon name="arrow_forward" style={{ marginLeft: 6 }} size={16} />
              </button>
              <Link to="/products" className="btn btn-outline btn-lg" style={{ width: '100%', marginTop: '0.75rem', textAlign: 'center' }}>
                Continue Shopping
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
