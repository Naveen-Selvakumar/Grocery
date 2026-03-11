import { useState, useEffect, useCallback } from 'react'
import { Icon } from '../components/Icon'
import { getAllOrders, updateOrderStatus } from '../services/api'
import AdminLayout from '../components/AdminLayout'
import '../styles/admin.css'

const STATUS_COLORS = {
  Pending:    { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  Processing: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  Shipped:    { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  Delivered:  { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
  Cancelled:  { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
}

const STATUS_LIST = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

export default function AdminOrders() {
  const [orders,     setOrders]     = useState([])
  const [total,      setTotal]      = useState(0)
  const [page,       setPage]       = useState(1)
  const [search,     setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading,    setLoading]    = useState(true)
  const [selected,   setSelected]   = useState(null)   // order detail modal
  const [updating,   setUpdating]   = useState(false)

  const LIMIT = 10

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: LIMIT }
      if (search)       params.search = search
      if (statusFilter) params.status = statusFilter
      const { data } = await getAllOrders(params)
      setOrders(data.data || [])
      setTotal(data.pagination?.total || 0)
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(true)
    try {
      await updateOrderStatus(orderId, { status: newStatus })
      await fetchOrders()
      if (selected?._id === orderId) setSelected(s => ({ ...s, orderStatus: newStatus }))
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const pages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div className="admin-page-title">
          <Icon name="shopping_bag" size={22} />
          <div>
            <h1>Orders</h1>
            <p>{total} total orders</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-table-toolbar">
        <div className="admin-search-box">
          <Icon name="search" size={15} />
          <input
            placeholder="Search order ID or customer…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['', ...STATUS_LIST].map(s => (
            <button
              key={s}
              className={`admin-filter-btn${statusFilter === s ? ' active' : ''}`}
              onClick={() => { setStatusFilter(s); setPage(1) }}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="admin-empty">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="admin-empty">No orders found.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id}>
                  <td><span className="admin-id-cell">#{o._id.slice(-6).toUpperCase()}</span></td>
                  <td>
                    <div className="admin-user-cell">
                      <div className="admin-avatar">{(o.user?.name || 'U')[0].toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{o.user?.name || 'N/A'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{o.user?.email || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td>{o.orderItems?.length || 0} item{o.orderItems?.length !== 1 ? 's' : ''}</td>
                  <td style={{ fontWeight: 700, color: '#0f1d35' }}>₹{o.totalPrice?.toFixed(2)}</td>
                  <td>
                    <span className="admin-status-badge"
                      style={{ background: STATUS_COLORS[o.orderStatus]?.bg, color: STATUS_COLORS[o.orderStatus]?.color, border: `1px solid ${STATUS_COLORS[o.orderStatus]?.border}` }}>
                      {o.orderStatus}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <button className="admin-icon-btn" title="View" onClick={() => setSelected(o)}>
                      <Icon name="visibility" size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="admin-pagination">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}><Icon name="chevron_left" size={18} /></button>
            <span>Page {page} / {pages}</span>
            <button disabled={page === pages} onClick={() => setPage(p => p + 1)}><Icon name="chevron_right" size={18} /></button>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selected && (
        <div className="admin-modal-overlay" onClick={() => setSelected(null)}>
          <div className="admin-modal" style={{ maxWidth: 560, width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Order #{selected._id.slice(-6).toUpperCase()}</h3>
              <button className="admin-modal-close" onClick={() => setSelected(null)}><Icon name="close" size={18} /></button>
            </div>

            <div style={{ padding: '20px 24px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div className="admin-detail-box">
                  <label>Customer</label>
                  <strong>{selected.user?.name}</strong>
                  <span>{selected.user?.email}</span>
                </div>
                <div className="admin-detail-box">
                  <label>Order Total</label>
                  <strong style={{ fontSize: '1.2rem', color: '#e53935' }}>₹{selected.totalPrice?.toFixed(2)}</strong>
                  <span>{selected.orderItems?.length} item(s)</span>
                </div>
              </div>

              {/* Items */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.85rem', color: '#374151' }}>Items</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selected.orderItems?.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f9fafb', borderRadius: 8, fontSize: '0.83rem' }}>
                      <span>{item.name} × {item.quantity}</span>
                      <span style={{ fontWeight: 700 }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address */}
              {selected.shippingAddress && (
                <div style={{ marginBottom: 16, padding: '10px 12px', background: '#f9fafb', borderRadius: 8, fontSize: '0.82rem', color: '#374151' }}>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>Delivery Address</p>
                  <p>{selected.shippingAddress.address}, {selected.shippingAddress.city}</p>
                  <p>{selected.shippingAddress.state} — {selected.shippingAddress.postalCode}, {selected.shippingAddress.country}</p>
                </div>
              )}

              {/* Status update */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.85rem', color: '#374151' }}>Update Status</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {STATUS_LIST.map(s => (
                    <button
                      key={s}
                      disabled={updating || selected.orderStatus === s}
                      onClick={() => handleStatusChange(selected._id, s)}
                      className="admin-filter-btn"
                      style={{
                        ...(selected.orderStatus === s ? { background: STATUS_COLORS[s]?.bg, color: STATUS_COLORS[s]?.color, borderColor: STATUS_COLORS[s]?.border, fontWeight: 700 } : {})
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
