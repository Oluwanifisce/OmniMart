// AdminAnalytics.jsx — Revenue, sales, users, conversions with SVG charts
import { useState, useEffect } from 'react'
import api from '../../api/axios'

// ── Inline SVG Bar Chart ──────────────────────────────────────────────────────
const BarChart = ({ data, color = '#10B981', height = 120 }) => {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map(d => d.value), 1)
  const w = 100 / data.length
  return (
    <svg viewBox={`0 0 100 ${height}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      {data.map((d, i) => {
        const barH = (d.value / max) * (height - 20)
        const y = height - barH
        return (
          <g key={i}>
            <rect x={i * w + w * 0.1} y={y} width={w * 0.8} height={barH}
              fill={color} rx="2" opacity="0.85" />
          </g>
        )
      })}
    </svg>
  )
}

// ── Inline SVG Sparkline ──────────────────────────────────────────────────────
const Sparkline = ({ data, color = '#10B981', height = 40 }) => {
  if (!data || data.length < 2) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 100 ${height}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null)
  const [orders,    setOrders]    = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [ar, or] = await Promise.all([
          api.get('/admin/analytics'),
          api.get('/orders/admin/all').catch(() => ({ data: {} })),
        ])
        const raw = ar.data.analytics || ar.data
        setAnalytics({
          totalUsers:     raw.users?.total     ?? raw.totalUsers    ?? 0,
          totalVendors:   raw.vendors?.total   ?? raw.totalVendors  ?? 0,
          pendingVendors: raw.vendors?.breakdown?.pending ?? raw.pendingVendors ?? 0,
          totalProducts:  raw.products?.total  ?? raw.totalProducts ?? 0,
          activeProducts: raw.products?.active ?? raw.activeProducts ?? 0,
          totalOrders:    raw.orders?.total    ?? raw.totalOrders   ?? 0,
        })
        setOrders(or.data.orders || or.data.data || [])
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  // Derive revenue from orders
  const grossRevenue = orders.reduce((s, o) => s + (o.totalAmount || o.totalPrice || 0), 0)
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length
  const conversionRate = analytics?.totalUsers > 0
    ? ((deliveredOrders / analytics.totalUsers) * 100).toFixed(1)
    : '0.0'

  // Build monthly revenue chart data from orders (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d    = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const m    = d.getMonth()
    const y    = d.getFullYear()
    const value = orders
      .filter(o => { const od = new Date(o.createdAt); return od.getMonth() === m && od.getFullYear() === y })
      .reduce((s, o) => s + (o.totalAmount || o.totalPrice || 0), 0)
    return { label: MONTH_LABELS[m], value }
  })

  const orderStatusDist = [
    { label: 'Pending',    value: orders.filter(o => o.status === 'pending').length,    color: '#F59E0B' },
    { label: 'Processing', value: orders.filter(o => o.status === 'processing').length, color: '#3B82F6' },
    { label: 'Shipped',    value: orders.filter(o => o.status === 'shipped').length,    color: '#8B5CF6' },
    { label: 'Delivered',  value: orders.filter(o => o.status === 'delivered').length,  color: '#10B981' },
    { label: 'Refunded',   value: orders.filter(o => o.status === 'refunded').length,   color: '#EF4444' },
  ]
  const maxDist = Math.max(...orderStatusDist.map(x => x.value), 1)

  const fmt = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
      <div className="spinner-border text-secondary" role="status" />
    </div>
  )

  const KPI_CARDS = [
    { label: 'Gross Revenue',     value: fmt(grossRevenue),           sub: `${orders.length} total orders`,  color: '#10B981', spark: monthlyData.map(d => d.value) },
    { label: 'Total Users',       value: analytics?.totalUsers ?? 0,  sub: 'Registered accounts',             color: '#3B82F6', spark: [2,4,3,6,5,8,7,9,8,10,9,11] },
    { label: 'Active Products',   value: analytics?.activeProducts ?? 0, sub: `of ${analytics?.totalProducts ?? 0} total`, color: '#8B5CF6', spark: [5,6,5,7,8,6,9,8,10,9,11,10] },
    { label: 'Conversion Rate',   value: `${conversionRate}%`,        sub: 'Delivered / users',               color: '#F59E0B', spark: [1,1.2,1.5,1.3,1.8,2,1.9,2.2,2.5,2.3,2.8,3] },
  ]

  return (
    <div>
      {/* ── KPI cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '28px' }}>
        {KPI_CARDS.map(card => (
          <div key={card.label} className="admin-stat-card">
            <div className="admin-stat-label">{card.label}</div>
            <div className="admin-stat-value" style={{ color: card.color }}>{card.value}</div>
            <div className="admin-stat-sub">{card.sub}</div>
            <div style={{ marginTop: '12px', opacity: .7 }}>
              <Sparkline data={card.spark} color={card.color} height={36} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        {/* Revenue Bar Chart */}
        <div className="admin-card">
          <div className="admin-card-header">
            <span>Monthly Revenue</span>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Last 6 months</span>
          </div>
          <div style={{ padding: '20px 20px 8px' }}>
            <BarChart data={monthlyData} color="#10B981" height={140} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              {monthlyData.map(d => (
                <span key={d.label} style={{ fontSize: '11px', color: '#94A3B8', flex: 1, textAlign: 'center' }}>
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="admin-card">
          <div className="admin-card-header">
            <span>Order Status</span>
          </div>
          <div style={{ padding: '16px 20px' }}>
            {orderStatusDist.map(s => (
              <div key={s.label} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px',
                  fontWeight: 600, marginBottom: '4px' }}>
                  <span style={{ color: '#475569' }}>{s.label}</span>
                  <span style={{ color: s.color }}>{s.value}</span>
                </div>
                <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(s.value / maxDist) * 100}%`,
                    background: s.color, borderRadius: '3px', transition: 'width .6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vendor Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginTop: '16px' }}>
        {[
          { label: 'Total Vendors',   value: analytics?.totalVendors ?? 0,   color: '#6366F1' },
          { label: 'Pending Approval',value: analytics?.pendingVendors ?? 0,  color: '#F59E0B' },
          { label: 'Inactive Products',value: (analytics?.totalProducts ?? 0) - (analytics?.activeProducts ?? 0), color: '#EF4444' },
        ].map(s => (
          <div key={s.label} className="admin-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: 48, height: 48, borderRadius: '12px', background: `${s.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: s.color }} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '.06em', color: '#94A3B8' }}>{s.label}</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders Table */}
      <div className="admin-card" style={{ marginTop: '16px' }}>
        <div className="admin-card-header">
          <span>Recent Orders</span>
          <span style={{ fontSize: '12px', color: '#64748B' }}>Latest 8</span>
        </div>
        <div className="table-responsive">
          <table className="admin-table">
            <thead><tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {orders.slice(0, 8).map(o => {
                const c = o.customer || o.user || {}
                return (
                  <tr key={o._id}>
                    <td style={{ fontFamily:'monospace', fontSize:'12px', color:'#94A3B8' }}>
                      #{o._id.slice(-8).toUpperCase()}
                    </td>
                    <td>{c.firstname} {c.lastname}</td>
                    <td style={{ color:'#94A3B8' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td style={{ fontWeight:700, color:'#10B981' }}>${(o.totalAmount||o.totalPrice||0).toFixed(2)}</td>
                    <td><span className={`admin-badge admin-badge-${o.status||'pending'}`}>{o.status||'pending'}</span></td>
                  </tr>
                )
              })}
              {orders.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign:'center', padding:'32px', color:'#94A3B8', fontSize:'13px' }}>No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminAnalytics
