import { useState, useEffect } from 'react'
import { Icon } from '../components/Icon'
import { getDashboardStats } from '../services/api'
import AdminLayout from '../components/AdminLayout'

/* ── Donut chart (pure SVG, no library) ──────────────────── */
const COLORS = ['#e53935', '#2563eb', '#8b5cf6', '#10b981', '#f59e0b']
const STATUS_ORDER = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

function DonutChart({ segments, total }) {
  const R = 68, cx = 90, cy = 90
  const circ = 2 * Math.PI * R

  if (total === 0) {
    return (
      <svg width="180" height="180" className="donut-svg">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#e5e7eb" strokeWidth="18" />
        <text x={cx} y={cy - 10} className="donut-center-text">{total}</text>
        <text x={cx} y={cy + 14} className="donut-center-sub">Total Orders</text>
      </svg>
    )
  }

  let offset = 0
  return (
    <svg width="180" height="180" className="donut-svg">
      {segments.map((seg, i) => {
        const len = (seg.count / total) * circ
        const el = (
          <circle key={seg.label} cx={cx} cy={cy} r={R}
            fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth="18"
            strokeDasharray={`${len} ${circ - len}`}
            strokeDashoffset={circ / 4 - offset}
          />
        )
        offset += len
        return el
      })}
      <text x={cx} y={cy - 10} className="donut-center-text">{total}</text>
      <text x={cx} y={cy + 14} className="donut-center-sub">Total Orders</text>
    </svg>
  )
}

/* ── Inline mini progress bar ────────────────────────────── */
function MiniBar({ pct, color }) {
  return (
    <div className="metric-row-bar-wrap">
      <div className="metric-row-bar" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats()
      .then(({ data }) => setStats({ ...data.data, ...data.data.summary }))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  /* ── Derived values ──────────────────────────────────── */
  const totalProducts = stats?.totalProducts ?? 0
  const totalOrders   = stats?.totalOrders   ?? 0
  const revenue       = stats?.totalRevenue  ?? 0
  const lowStock      = (stats?.lowStockProducts ?? []).length

  const statusMap = {}
  ;(stats?.ordersByStatus ?? []).forEach(s => { statusMap[s._id] = s.count })

  const pendingOrders  = statusMap['Pending'] ?? 0
  const orderSegments  = STATUS_ORDER
    .map((s, i) => ({ label: s, count: statusMap[s] ?? 0, color: COLORS[i] }))
    .filter(s => s.count > 0)

  const topProduct = (stats?.topProducts ?? [])[0]

  const fmtRevenue = (v) => v >= 100000
    ? `${(v / 100000).toFixed(1)}L`
    : v >= 1000
      ? `${(v / 1000).toFixed(1)}k`
      : v.toFixed(0)

  return (
    <AdminLayout subtitle="Here's what's happening with your store today">

      {/* ── 5 stat cards ─────────────────────────────────── */}
      <div className="admin-stats-row">
        {[
          { label: 'Total Products',  value: totalProducts },
          { label: 'Low Stock Items', value: lowStock },
          { label: 'Total Orders',    value: totalOrders },
          { label: 'Pending Orders',  value: pendingOrders },
          { label: 'Revenue (₹)',    value: fmtRevenue(revenue) },
        ].map(card => (
          <div key={card.label} className="admin-stat-card">
            <div className="stat-num">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* ── 2-col layout ─────────────────────────────────── */}
      <div className="admin-overview-grid">

        {/* ── LEFT: Business Performance ─────────────────── */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Business Performance Overview</h3>
            <p>Current statistics and trends</p>
          </div>

          <div className="admin-card-body">

            {/* Block 1 — Products */}
            <div className="metric-block">
              <div className="metric-top">
                <div className="metric-icon blue"><Icon name="inventory_2" size={18} /></div>
                <div>
                  <div className="metric-num">{totalProducts}</div>
                  <div className="metric-label">Total Products</div>
                </div>
              </div>
              <div className="metric-bar-wrap">
                <div className="metric-bar" style={{ width: '100%' }} />
              </div>
              {lowStock > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#f59e0b', marginTop: 6 }}>
                  <Icon name="warning" size={12} style={{ color: '#f59e0b' }} />
                  {lowStock} product{lowStock > 1 ? 's' : ''} running low on stock
                </div>
              )}
            </div>

            {/* Block 2 — Orders */}
            <div className="metric-block">
              <div className="metric-top">
                <div className="metric-icon red"><Icon name="shopping_bag" size={18} /></div>
                <div>
                  <div className="metric-num">{totalOrders}</div>
                  <div className="metric-label">Total Orders</div>
                </div>
              </div>
              <div className="metric-bar-wrap">
                <div className="metric-bar" style={{ width: totalOrders > 0 ? '100%' : '0%' }} />
              </div>
              {STATUS_ORDER.map((status, i) => {
                const cnt = statusMap[status] ?? 0
                const pct = totalOrders > 0 ? (cnt / totalOrders) * 100 : 0
                return (
                  <div key={status} className="metric-row">
                    <div className="metric-row-left">
                      <span style={{ color: COLORS[i], fontSize: 10 }}>●</span>
                      <span>{status}</span>
                    </div>
                    <MiniBar pct={pct} color={COLORS[i]} />
                    <span className="metric-row-count">{cnt}</span>
                  </div>
                )
              })}
            </div>

            {/* Block 3 — Revenue */}
            <div className="metric-block">
              <div className="metric-top">
                <div className="metric-icon green"><Icon name="currency_rupee" size={18} /></div>
                <div>
                  <div className="metric-num">₹{fmtRevenue(revenue)}</div>
                  <div className="metric-label">Total Revenue</div>
                </div>
              </div>
              <div className="metric-bar-wrap">
                <div className="metric-bar green-bar" style={{ width: revenue > 0 ? '100%' : '0%' }} />
              </div>
              {topProduct && (
                <div className="metric-row">
                  <div className="metric-row-left">
                    <Icon name="trending_up" size={13} style={{ color: '#10b981' }} />
                    <span>Top: {topProduct.name}</span>
                  </div>
                  <span className="metric-row-count">{topProduct.sold ?? 0} sold</span>
                </div>
              )}
              <div className="metric-footer-note">
                <Icon name="check_circle" size={12} />
                {totalOrders > 0
                  ? `₹${(revenue / totalOrders).toFixed(0)} avg order value`
                  : '0% request-to-invoice conversion'}
              </div>
            </div>

          </div>
        </div>

        {/* ── RIGHT: Activity Summary ─────────────────────── */}
        <div className="activity-card">
          <h3>Activity Summary</h3>
          <div className="donut-wrap">
            <DonutChart segments={orderSegments} total={totalOrders} />
          </div>
          <div className="activity-legend">
            {STATUS_ORDER.map((status, i) => {
              const cnt = statusMap[status] ?? 0
              const pct = totalOrders > 0 ? ((cnt / totalOrders) * 100).toFixed(0) : 0
              return (
                <div key={status} className="legend-item">
                  <div className="legend-dot" style={{ background: COLORS[i] }} />
                  <div className="legend-info">
                    <span className="legend-name">{status}</span>
                    <span className="legend-val">{cnt} ({pct}%)</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}
