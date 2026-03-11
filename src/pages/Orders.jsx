import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { getMyOrders } from '../services/api'
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

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  const justOrdered = location.state?.success

  useEffect(() => {
    getMyOrders()
      .then(({ data }) => setOrders(data.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

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
                    {(order.items || []).slice(0, 3).map((item, idx) => (
                      <div key={idx} className="order-item-preview">
                        <span className="order-item-name">{item.product?.name || 'Product'}</span>
                        <span className="order-item-qty">×{item.quantity}</span>
                        <span className="order-item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <div className="order-more">+{order.items.length - 3} more items</div>
                    )}
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
