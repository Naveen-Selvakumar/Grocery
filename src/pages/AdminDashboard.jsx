import { useState, useEffect } from 'react'
import { Icon } from '../components/Icon'
import { getDashboardStats, sendOfferEmail, triggerLowStockAlert, getOfferCustomers } from '../services/api'
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

/* ── Revenue bar chart (pure SVG, zero deps) ─────────────── */
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return { year: d.getUTCFullYear(), week: Math.ceil((((d - yearStart) / 86400000) + 1) / 7) }
}

function buildDailyData(raw) {
  const now = new Date()
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now); d.setDate(now.getDate() - (29 - i))
    const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate()
    const match = raw.find(r => r._id.year === y && r._id.month === m && r._id.day === day)
    return { label: `${MONTH_NAMES[m-1]} ${day}`, value: match ? match.revenue : 0, orders: match?.orders ?? 0 }
  })
}

function buildWeeklyData(raw) {
  const now = new Date()
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now); d.setDate(now.getDate() - (11 - i) * 7)
    const { year, week } = getISOWeek(d)
    const match = raw.find(r => r._id.year === year && r._id.week === week)
    return { label: `W${week}`, value: match ? match.revenue : 0, orders: match?.orders ?? 0 }
  })
}

function buildMonthlyData(raw) {
  const now = new Date()
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const y = d.getFullYear(), m = d.getMonth() + 1
    const match = raw.find(r => r._id.year === y && r._id.month === m)
    return { label: `${MONTH_NAMES[m-1]} '${String(y).slice(-2)}`, value: match ? match.revenue : 0, orders: match?.orders ?? 0 }
  })
}

function BarChart({ data }) {
  if (!data || data.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: '.85rem' }}>No data available</div>
  )
  const maxVal   = Math.max(...data.map(d => d.value), 1)
  const nonZero  = data.filter(d => d.value > 0).map(d => d.value)
  const highVal  = nonZero.length > 0 ? Math.max(...nonZero) : 0
  const lowVal   = nonZero.length > 1 ? Math.min(...nonZero) : -1
  const CHART_H  = 148
  const barSlot  = Math.max(20, Math.floor(620 / data.length))
  const barW     = Math.max(10, barSlot - 7)
  const totalW   = data.length * barSlot + 20
  const fmtShort = v => v >= 100000 ? `${(v/100000).toFixed(1)}L` : v >= 1000 ? `${(v/1000).toFixed(1)}k` : `${Math.round(v)}`
  const showEvery = data.length > 20 ? Math.ceil(data.length / 10) : 1

  return (
    <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
      <svg width={Math.max(totalW, 300)} height={CHART_H + 56} style={{ display: 'block', minWidth: 300 }}>
        {/* Gridlines */}
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={8} y1={CHART_H - f * CHART_H + 8} x2={totalW - 4} y2={CHART_H - f * CHART_H + 8}
            stroke="#f3f4f6" strokeWidth="1" />
        ))}
        {/* Baseline */}
        <line x1={8} y1={CHART_H + 8} x2={totalW - 4} y2={CHART_H + 8} stroke="#e5e7eb" strokeWidth="1.5" />

        {data.map((d, i) => {
          const barH  = Math.max(d.value > 0 ? 3 : 0, (d.value / maxVal) * CHART_H)
          const x     = 10 + i * barSlot
          const y     = CHART_H - barH + 8
          const isHigh = d.value > 0 && d.value === highVal
          const isLow  = d.value > 0 && d.value === lowVal
          const color  = isHigh ? '#f59e0b' : isLow ? '#ef4444' : '#16a34a'
          return (
            <g key={i}>
              <rect x={x} y={d.value > 0 ? y : CHART_H + 5} width={barW}
                height={d.value > 0 ? barH : 3} rx={3}
                fill={color} opacity={d.value > 0 ? 0.85 : 0.18} />
              {d.value > 0 && (isHigh || isLow) && (
                <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="9" fill={color} fontWeight="700">
                  ₹{fmtShort(d.value)}
                </text>
              )}
              {i % showEvery === 0 && (
                <text x={x + barW / 2} y={CHART_H + 24} textAnchor={data.length > 20 ? 'end' : 'middle'}
                  fontSize="8.5" fill="#9ca3af"
                  transform={data.length > 20 ? `rotate(-40,${x + barW/2},${CHART_H + 22})` : ''}>
                  {d.label}
                </text>
              )}
              {(isHigh || isLow) && (
                <text x={x + barW / 2} y={CHART_H + 44} textAnchor="middle" fontSize="8" fill={color} fontWeight="700">
                  {isHigh ? '▲ Peak' : '▼ Low'}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [offer, setOffer] = useState({ title: '', description: '', code: '', discount: '', expiryDate: '' })
  const [offerSending, setOfferSending] = useState(false)
  const [offerMsg, setOfferMsg] = useState(null)
  const [alertSending, setAlertSending] = useState(false)
  const [alertMsg, setAlertMsg] = useState(null)
  const [revTab, setRevTab] = useState('month')

  // Offer panel state
  const [customers, setCustomers]         = useState([])
  const [custLoading, setCustLoading]     = useState(false)
  const [custSearch, setCustSearch]       = useState('')
  const [selected, setSelected]           = useState(new Set())   // Set of user _id strings
  const [custLoaded, setCustLoaded]       = useState(false)

  const loadStats = () => {
    setLoading(true)
    getDashboardStats()
      .then(({ data }) => setStats({ ...data.data, ...data.data.summary }))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadStats() }, [])

  const handleTestLowStockAlert = async () => {
    setAlertSending(true)
    setAlertMsg(null)
    try {
      const { data } = await triggerLowStockAlert()
      setAlertMsg({ type: 'success', text: data.message })
    } catch (err) {
      setAlertMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to send alert' })
    } finally {
      setAlertSending(false)
    }
  }

  const loadCustomers = async () => {
    if (custLoaded) return
    setCustLoading(true)
    try {
      const { data } = await getOfferCustomers()
      setCustomers(data.data || [])
      setCustLoaded(true)
    } catch {
      setCustomers([])
    } finally {
      setCustLoading(false)
    }
  }

  const toggleCustomer = (id) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const selectAll   = () => setSelected(new Set(filteredCustomers.map(c => c._id)))
  const deselectAll = () => setSelected(new Set())

  const handleSendOffer = async (e) => {
    e.preventDefault()
    if (selected.size === 0) {
      setOfferMsg({ type: 'error', text: 'Please select at least one customer.' })
      return
    }
    setOfferSending(true)
    setOfferMsg(null)
    try {
      const payload = { ...offer, userIds: [...selected] }
      const { data } = await sendOfferEmail(payload)
      setOfferMsg({ type: 'success', text: data.message })
      setOffer({ title: '', description: '', code: '', discount: '', expiryDate: '' })
      setSelected(new Set())
    } catch (err) {
      setOfferMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to send offer' })
    } finally {
      setOfferSending(false)
    }
  }

  /* ── Derived values ──────────────────────────────────── */
  const totalProducts = stats?.totalProducts ?? 0
  const totalOrders   = stats?.totalOrders   ?? 0
  const revenue       = stats?.totalRevenue  ?? 0
  const lowStockProducts = stats?.lowStockProducts ?? []
  const lowStock         = lowStockProducts.length

  const statusMap = stats?.orderStatusBreakdown ?? {}

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

  // ── Revenue analytics chart data ─────────────────────────
  const dailyChartData   = buildDailyData(stats?.dailyRevenue   ?? [])
  const weeklyChartData  = buildWeeklyData(stats?.weeklyRevenue  ?? [])
  const monthlyChartData = buildMonthlyData(stats?.monthlyRevenue ?? [])

  const chartData = revTab === 'day' ? dailyChartData : revTab === 'week' ? weeklyChartData : monthlyChartData
  const nonZeroVals  = chartData.filter(d => d.value > 0).map(d => d.value)
  const periodTotal  = chartData.reduce((s, d) => s + d.value, 0)
  const periodAvg    = nonZeroVals.length > 0 ? periodTotal / nonZeroVals.length : 0
  const periodHigh   = nonZeroVals.length > 0 ? Math.max(...nonZeroVals) : 0
  const periodLow    = nonZeroVals.length > 1 ? Math.min(...nonZeroVals) : 0
  const highItem     = chartData.find(d => d.value === periodHigh && periodHigh > 0)
  const lowItem      = nonZeroVals.length > 1 ? chartData.find(d => d.value === periodLow) : null
  const fmtCur       = v => `₹${v >= 100000 ? (v/100000).toFixed(2)+'L' : v >= 1000 ? (v/1000).toFixed(1)+'k' : v.toFixed(0)}`

  // Customer picker derived
  const filteredCustomers = customers.filter(c =>
    !custSearch ||
    c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(custSearch.toLowerCase())
  )

  return (
    <AdminLayout subtitle="Here's what's happening with your store today">

      {/* ── Refresh button ───────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          onClick={loadStats}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}
        >
          <Icon name="refresh" size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

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
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#f59e0b', marginBottom: 6, fontWeight: 600 }}>
                    <Icon name="warning" size={12} style={{ color: '#f59e0b' }} />
                    {lowStock} product{lowStock > 1 ? 's' : ''} running low on stock (≤20)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {lowStockProducts.map(p => (
                      <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 8, background: '#fff7ed', border: '1px solid #fed7aa' }}>
                        <img
                          src={p.image || 'https://placehold.co/40x40?text=No+Img'}
                          alt={p.name}
                          style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: '1px solid #fcd34d' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#92400e', fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                          <div style={{ color: '#b45309', fontWeight: 500, fontSize: '0.73rem' }}>₹{p.price?.toFixed(2)}</div>
                        </div>
                        <span style={{ color: p.quantity <= 5 ? '#dc2626' : '#ea580c', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{p.quantity} left</span>
                      </div>
                    ))}
                  </div>
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

      {/* ── Revenue Analytics ────────────────────────────── */}
      <div className="admin-card" style={{ marginTop: 24 }}>
        {/* Header row with tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, padding: '18px 20px 0' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="bar_chart" size={18} style={{ color: '#16a34a' }} />
              Revenue Analytics
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '.78rem', color: '#9ca3af' }}>
              {revTab === 'day' ? 'Last 30 days' : revTab === 'week' ? 'Last 12 weeks' : 'Last 12 months'} — from delivered orders
            </p>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 8, padding: 3 }}>
            {[['day','Day'],['week','Week'],['month','Month']].map(([key, label]) => (
              <button key={key} onClick={() => setRevTab(key)}
                style={{ padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '.8rem', fontWeight: 600,
                  background: revTab === key ? '#fff' : 'transparent',
                  color: revTab === key ? '#16a34a' : '#6b7280',
                  boxShadow: revTab === key ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
                  transition: 'all .15s' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, padding: '16px 20px 4px' }}>
          {[
            { icon: 'payments',      label: revTab === 'day' ? '30-Day Total' : revTab === 'week' ? '12-Week Total' : '12-Month Total', value: fmtCur(periodTotal), color: '#2563eb', bg: '#eff6ff' },
            { icon: 'trending_flat', label: 'Average',  value: fmtCur(periodAvg),  color: '#7c3aed', bg: '#f5f3ff' },
            { icon: 'arrow_upward',  label: `Peak${highItem ? ` (${highItem.label})` : ''}`,   value: periodHigh  > 0 ? fmtCur(periodHigh)  : '—', color: '#d97706', bg: '#fffbeb' },
            { icon: 'arrow_downward',label: `Lowest${lowItem  ? ` (${lowItem.label})`  : ''}`, value: periodLow   > 0 ? fmtCur(periodLow)   : '—', color: '#dc2626', bg: '#fef2f2' },
          ].map(c => (
            <div key={c.label} style={{ background: c.bg, borderRadius: 10, padding: '12px 14px', border: `1px solid ${c.color}22` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Icon name={c.icon} size={14} style={{ color: c.color }} />
                <span style={{ fontSize: '.72rem', color: '#6b7280', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</span>
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div style={{ padding: '8px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8, fontSize: '.73rem', color: '#6b7280' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#16a34a', display: 'inline-block' }} /> Normal</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b', display: 'inline-block' }} /> Peak</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444', display: 'inline-block' }} /> Lowest</span>
            <span style={{ marginLeft: 'auto', color: '#9ca3af' }}>Revenue from Delivered orders only</span>
          </div>
          <BarChart data={chartData} />
        </div>

        {/* Highest / Lowest callout row */}
        {(highItem || lowItem) && (
          <div style={{ display: 'flex', gap: 12, padding: '0 16px 18px', flexWrap: 'wrap' }}>
            {highItem && (
              <div style={{ flex: 1, minWidth: 180, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="emoji_events" size={22} style={{ color: '#d97706' }} />
                <div>
                  <div style={{ fontSize: '.72rem', color: '#92400e', fontWeight: 600 }}>Highest Revenue</div>
                  <div style={{ fontSize: '.95rem', fontWeight: 800, color: '#d97706' }}>{fmtCur(periodHigh)}</div>
                  <div style={{ fontSize: '.72rem', color: '#b45309' }}>{highItem.label} · {highItem.orders} order{highItem.orders !== 1 ? 's' : ''}</div>
                </div>
              </div>
            )}
            {lowItem && (
              <div style={{ flex: 1, minWidth: 180, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="trending_down" size={22} style={{ color: '#dc2626' }} />
                <div>
                  <div style={{ fontSize: '.72rem', color: '#991b1b', fontWeight: 600 }}>Lowest Revenue</div>
                  <div style={{ fontSize: '.95rem', fontWeight: 800, color: '#dc2626' }}>{fmtCur(periodLow)}</div>
                  <div style={{ fontSize: '.72rem', color: '#b91c1c' }}>{lowItem.label} · {lowItem.orders} order{lowItem.orders !== 1 ? 's' : ''}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Low Stock Alert Email Panel ──────────────────── */}
      <div className="admin-card" style={{ marginTop: 24 }}>
        <div className="admin-card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="notification_important" size={18} style={{ color: '#dc2626' }} />
            Low Stock Email Alert
          </h3>
          <p>Send an immediate low stock alert email to <strong>nveen3484@gmail.com</strong> for all products with ≤20 units</p>
        </div>
        <div style={{ padding: '4px 0 12px' }}>
          {alertMsg && (
            <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: '.85rem', fontWeight: 500, background: alertMsg.type === 'success' ? '#f0fdf4' : '#fef2f2', color: alertMsg.type === 'success' ? '#166534' : '#dc2626', border: `1px solid ${alertMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
              {alertMsg.text}
            </div>
          )}
          <button
            onClick={handleTestLowStockAlert}
            disabled={alertSending}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#dc2626', borderColor: '#dc2626' }}
          >
            <Icon name="notification_important" size={15} />
            {alertSending ? 'Sending Alert…' : 'Send Low Stock Alert Email Now'}
          </button>
          <p style={{ margin: '10px 0 0', fontSize: '.78rem', color: '#9ca3af' }}>
            📬 This is also sent automatically whenever a customer places an order that drops any product stock to ≤20 units.
          </p>
        </div>
      </div>

      {/* ── Offer / Discount Email Panel ────────────────── */}
      <div className="admin-card" style={{ marginTop: 24 }}>
        <div className="admin-card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="local_offer" size={18} style={{ color: '#7c3aed' }} />
            Send Discount / Offer Email
          </h3>
          <p>Select customers manually or choose all, then fill in the offer details</p>
        </div>

        {/* ── Customer Picker ─────────────────────────── */}
        <div style={{ padding: '0 0 16px' }}>

          {/* Load customers button (lazy) */}
          {!custLoaded && (
            <button
              type="button"
              onClick={loadCustomers}
              disabled={custLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px dashed #c4b5fd', background: '#faf5ff', color: '#7c3aed', cursor: custLoading ? 'not-allowed' : 'pointer', fontSize: '.83rem', fontWeight: 600, marginBottom: 14 }}
            >
              <Icon name="group" size={15} />
              {custLoading ? 'Loading customers…' : 'Load Customers'}
            </button>
          )}

          {custLoaded && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>

              {/* Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 160, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 7, padding: '5px 10px' }}>
                  <Icon name="search" size={13} style={{ color: '#9ca3af' }} />
                  <input
                    value={custSearch}
                    onChange={e => setCustSearch(e.target.value)}
                    placeholder="Search by name or email…"
                    style={{ border: 'none', outline: 'none', fontSize: '.82rem', flex: 1, background: 'transparent' }}
                  />
                  {custSearch && <button onClick={() => setCustSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: '#9ca3af', lineHeight: 1 }}><Icon name="close" size={13} /></button>}
                </div>

                <button type="button" onClick={selectAll}
                  style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #7c3aed', background: '#faf5ff', color: '#7c3aed', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <Icon name="select_all" size={13} style={{ marginRight: 4 }} />Select All ({filteredCustomers.length})
                </button>
                <button type="button" onClick={deselectAll}
                  style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Deselect All
                </button>
                <span style={{ marginLeft: 'auto', fontSize: '.78rem', color: '#7c3aed', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {selected.size} selected
                </span>
              </div>

              {/* Customer rows */}
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {filteredCustomers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: '.85rem' }}>No customers found</div>
                ) : filteredCustomers.map((c, idx) => {
                  const isSelected = selected.has(c._id)
                  const topColors  = ['#d97706','#6b7280','#b45309']
                  const topLabels  = ['🥇 Top 1','🥈 Top 2','🥉 Top 3']
                  return (
                    <div
                      key={c._id}
                      onClick={() => toggleCustomer(c._id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', cursor: 'pointer', background: isSelected ? '#faf5ff' : idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f3f4f6', transition: 'background .1s' }}
                    >
                      {/* Checkbox */}
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${isSelected ? '#7c3aed' : '#d1d5db'}`, background: isSelected ? '#7c3aed' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
                        {isSelected && <Icon name="check" size={11} style={{ color: '#fff' }} />}
                      </div>

                      {/* Avatar */}
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: c.topRank ? topColors[c.topRank-1] : '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700, flexShrink: 0 }}>
                        {c.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: '.82rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                          {c.topRank && (
                            <span style={{ fontSize: '.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: 12, background: c.topRank === 1 ? '#fef3c7' : c.topRank === 2 ? '#f3f4f6' : '#fff7ed', color: topColors[c.topRank-1], border: `1px solid ${topColors[c.topRank-1]}44`, whiteSpace: 'nowrap' }}>
                              {topLabels[c.topRank-1]}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '.73rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</div>
                      </div>

                      {/* Stats */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#16a34a' }}>₹{c.totalSpent.toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: '.7rem', color: '#9ca3af' }}>{c.totalOrders} order{c.totalOrders !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Offer form */}
          <form onSubmit={handleSendOffer}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Offer Title *</label>
                <input value={offer.title} onChange={e => setOffer(o => ({ ...o, title: e.target.value }))} required placeholder="e.g. Weekend Sale" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '.88rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Discount % *</label>
                <input value={offer.discount} onChange={e => setOffer(o => ({ ...o, discount: e.target.value }))} required type="number" min="1" max="100" placeholder="e.g. 20" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '.88rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Coupon Code *</label>
                <input value={offer.code} onChange={e => setOffer(o => ({ ...o, code: e.target.value.toUpperCase() }))} required placeholder="e.g. SAVE20" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '.88rem', fontFamily: 'monospace', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Expiry Date (optional)</label>
                <input value={offer.expiryDate} onChange={e => setOffer(o => ({ ...o, expiryDate: e.target.value }))} type="date" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '.88rem', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Description *</label>
              <textarea value={offer.description} onChange={e => setOffer(o => ({ ...o, description: e.target.value }))} required rows={3} placeholder="Describe the offer…" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '.88rem', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            {offerMsg && (
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: '.85rem', fontWeight: 500, background: offerMsg.type === 'success' ? '#f0fdf4' : '#fef2f2', color: offerMsg.type === 'success' ? '#166534' : '#dc2626', border: `1px solid ${offerMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
                {offerMsg.text}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button type="submit" disabled={offerSending} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="send" size={15} />
                {offerSending ? 'Sending…' : `Send to ${selected.size > 0 ? selected.size + ' Customer' + (selected.size !== 1 ? 's' : '') : 'Selected Customers'}`}
              </button>
              {selected.size === 0 && custLoaded && (
                <span style={{ fontSize: '.78rem', color: '#f59e0b', fontWeight: 500 }}>
                  <Icon name="warning" size={12} style={{ marginRight: 4 }} />Select at least 1 customer above
                </span>
              )}
            </div>
          </form>
        </div>
      </div>

    </AdminLayout>
  )
}
