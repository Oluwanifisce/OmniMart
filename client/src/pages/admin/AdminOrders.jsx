// AdminOrders.jsx — Full order orchestration with lifecycle management
import { useState, useEffect } from 'react'
import { Modal } from 'react-bootstrap'
import api from '../../api/axios'

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'refunded', 'cancelled']

const STATUS_CONFIG = {
  pending:    { bg: '#FEF3C7', color: '#92400E', label: '🕐 Pending'    },
  processing: { bg: '#DBEAFE', color: '#1E40AF', label: '⚙️ Processing' },
  shipped:    { bg: '#EDE9FE', color: '#5B21B6', label: '🚚 Shipped'    },
  delivered:  { bg: '#D1FAE5', color: '#065F46', label: '✅ Delivered'  },
  refunded:   { bg: '#FEE2E2', color: '#991B1B', label: '↩️ Refunded'  },
  cancelled:  { bg: '#F1F5F9', color: '#475569', label: '✕ Cancelled'  },
}

const AdminOrders = () => {
  const [orders,      setOrders]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [searchQ,     setSearchQ]     = useState('')
  const [selected,    setSelected]    = useState(null)
  const [showModal,   setShowModal]   = useState(false)
  const [newStatus,   setNewStatus]   = useState('')
  const [saving,      setSaving]      = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await api.get('/orders/admin/all')
        setOrders(res.data.orders || res.data.data || [])
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const openOrder = (o) => {
    setSelected(o)
    setNewStatus(o.status || 'pending')
    setShowModal(true)
  }

  const updateStatus = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await api.patch(`/orders/${selected._id}/status`, { status: newStatus })
      setOrders(prev => prev.map(o => o._id === selected._id ? { ...o, status: newStatus } : o))
      setSelected(prev => ({ ...prev, status: newStatus }))
      setShowModal(false)
    } catch (e) {
      alert(e.response?.data?.message || 'Could not update order status')
    } finally { setSaving(false) }
  }

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus ? o.status === filterStatus : true
    const matchSearch = searchQ
      ? o._id.includes(searchQ) ||
        `${o.customer?.firstname||o.user?.firstname||''} ${o.customer?.lastname||o.user?.lastname||''}`.toLowerCase().includes(searchQ.toLowerCase())
      : true
    return matchStatus && matchSearch
  })

  const fmt = n => `₦${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  return (
    <div>
      {/* Summary pills */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <button className={`admin-filter-pill ${filterStatus === '' ? 'active' : ''}`}
          onClick={() => setFilterStatus('')}>All ({orders.length})</button>
        {ORDER_STATUSES.map(s => (
          <button key={s} className={`admin-filter-pill ${filterStatus === s ? 'active' : ''}`}
            style={filterStatus === s ? {} : {}}
            onClick={() => setFilterStatus(filterStatus === s ? '' : s)}>
            {STATUS_CONFIG[s]?.label || s} ({orders.filter(o => o.status === s).length})
          </button>
        ))}
      </div>

      <div className="admin-card">
        {/* Toolbar */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by Order ID or customer name…"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            style={{ flex: 1, padding: '8px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px',
              fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '8px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px',
              fontSize: '13px', fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th><th>Customer</th><th>Items</th>
                <th>Total</th><th>Payment</th><th>Date</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign:'center',padding:'40px',color:'#94A3B8' }}>
                  <div className="spinner-border spinner-border-sm" role="status" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign:'center',padding:'40px',color:'#94A3B8',fontSize:'13px' }}>
                  No orders match your filter.
                </td></tr>
              ) : filtered.map(o => {
                const customer = o.customer || o.user || {}
                const cfg = STATUS_CONFIG[o.status] || { bg:'#F1F5F9', color:'#475569', label: o.status }
                return (
                  <tr key={o._id}>
                    <td style={{ fontFamily:'monospace', fontSize:'12px', color:'#6366F1', fontWeight:700 }}>
                      #{o._id.slice(-8).toUpperCase()}
                    </td>
                    <td>
                      <div style={{ fontSize:'13px', fontWeight:600 }}>{customer.firstname} {customer.lastname}</div>
                      <div style={{ fontSize:'11px', color:'#94A3B8' }}>{customer.email}</div>
                    </td>
                    <td style={{ fontSize:'12px', color:'#64748B' }}>{(o.items||o.orderItems||[]).length} items</td>
                    <td style={{ fontWeight:700, color:'#0F172A' }}>{fmt(o.totalAmount||o.totalPrice)}</td>
                    <td style={{ fontSize:'12px', color:'#64748B' }}>{o.paymentMethod||'—'}</td>
                    <td style={{ fontSize:'12px', color:'#94A3B8' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span style={{ ...cfg, fontSize:'11px', fontWeight:700,
                        padding:'3px 10px', borderRadius:'12px', whiteSpace:'nowrap',
                        background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td>
                      <button className="admin-action-btn" onClick={() => openOrder(o)}>Manage →</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Order Detail Modal ── */}
      {selected && (
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
          <Modal.Header closeButton style={{ borderBottom:'1px solid #E2E8F0', padding:'18px 24px' }}>
            <Modal.Title style={{ fontSize:'16px', fontWeight:700 }}>
              Order #{selected._id.slice(-8).toUpperCase()}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: 0 }}>
            {/* Customer + Shipping */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0',
              borderBottom:'1px solid #E2E8F0' }}>
              <div style={{ padding:'20px 24px', borderRight:'1px solid #E2E8F0' }}>
                <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase',
                  letterSpacing:'.07em', color:'#94A3B8', marginBottom:'10px' }}>Customer</div>
                <div style={{ fontWeight:600, fontSize:'14px' }}>
                  {(selected.customer||selected.user||{}).firstname} {(selected.customer||selected.user||{}).lastname}
                </div>
                <div style={{ fontSize:'12px', color:'#64748B', marginTop:'2px' }}>
                  {(selected.customer||selected.user||{}).email}
                </div>
              </div>
              <div style={{ padding:'20px 24px' }}>
                <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase',
                  letterSpacing:'.07em', color:'#94A3B8', marginBottom:'10px' }}>Shipping Address</div>
                <div style={{ fontSize:'13px', color:'#475569', lineHeight:1.6 }}>
                  {selected.shippingAddress
                    ? `${selected.shippingAddress.street||''}, ${selected.shippingAddress.city||''}, ${selected.shippingAddress.country||''}`
                    : 'Not provided'}
                </div>
              </div>
            </div>

            {/* Items */}
            <div style={{ padding:'20px 24px', borderBottom:'1px solid #E2E8F0' }}>
              <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase',
                letterSpacing:'.07em', color:'#94A3B8', marginBottom:'12px' }}>Order Items</div>
              {(selected.items || selected.orderItems || []).map((item, i) => {
                const prod = item.product || {}
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px',
                    padding:'8px 0', borderBottom:'1px solid #F1F5F9' }}>
                    <div style={{ width:40, height:40, background:'#F8FAFC', borderRadius:'6px',
                      border:'1px solid #E2E8F0', display:'flex', alignItems:'center',
                      justifyContent:'center', fontSize:'16px', flexShrink:0 }}>
                      {prod.images?.[0] ? (
                        <img src={prod.images[0]} style={{ width:'100%', height:'100%', objectFit:'contain', padding:'2px' }} alt="" />
                      ) : '📦'}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'13px', fontWeight:600 }}>{prod.title || prod.name || item.name || 'Product'}</div>
                      <div style={{ fontSize:'11px', color:'#94A3B8' }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight:700, fontSize:'13px' }}>${((item.price || prod.price || 0) * item.quantity).toFixed(2)}</div>
                  </div>
                )
              })}
              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'12px',
                fontWeight:800, fontSize:'15px' }}>
                Total: <span style={{ color:'#10B981', marginLeft:'8px' }}>
                  ${(selected.totalAmount || selected.totalPrice || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Status Change */}
            <div style={{ padding:'20px 24px' }}>
              <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase',
                letterSpacing:'.07em', color:'#94A3B8', marginBottom:'12px' }}>Update Order Status</div>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                {ORDER_STATUSES.map(s => {
                  const cfg = STATUS_CONFIG[s] || {}
                  return (
                    <button key={s}
                      onClick={() => setNewStatus(s)}
                      style={{ padding:'8px 16px', borderRadius:'20px', fontSize:'12px', fontWeight:600,
                        cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
                        border: newStatus === s ? `2px solid ${cfg.color}` : '2px solid #E2E8F0',
                        background: newStatus === s ? cfg.bg : '#fff',
                        color: newStatus === s ? cfg.color : '#64748B' }}>
                      {cfg.label || s}
                    </button>
                  )
                })}
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer style={{ borderTop:'1px solid #E2E8F0', padding:'14px 24px' }}>
            <button onClick={() => setShowModal(false)}
              style={{ padding:'9px 20px', border:'1.5px solid #E2E8F0', borderRadius:'8px',
                background:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              Cancel
            </button>
            <button onClick={updateStatus} disabled={saving}
              style={{ padding:'9px 20px', border:'none', borderRadius:'8px', fontSize:'13px',
                fontWeight:700, cursor:'pointer', fontFamily:'inherit', background:'#0F172A', color:'#fff' }}>
              {saving ? 'Saving…' : 'Update Status'}
            </button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  )
}

export default AdminOrders
