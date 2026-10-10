// AdminVendors.jsx — Vendor management extracted from old AdminDashboard
import { useState, useEffect } from 'react'
import { Modal } from 'react-bootstrap'
import api from '../../api/axios'

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
const resolveImg = url => (!url ? '' : url.startsWith('http') ? url : `${BASE_URL}${url}`)

const STATUS_CONFIG = {
  approved:  { bg:'#D1FAE5', color:'#065F46', label:'✅ Approved'  },
  pending:   { bg:'#FEF3C7', color:'#92400E', label:'🕐 Pending'   },
  rejected:  { bg:'#FEE2E2', color:'#991B1B', label:'❌ Rejected'  },
  suspended: { bg:'#FEE2E2', color:'#991B1B', label:'🚫 Suspended' },
}

const AdminVendors = () => {
  const [vendors,      setVendors]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQ,      setSearchQ]      = useState('')
  const [actionVendor, setActionVendor] = useState(null)
  const [vendorDetail, setVendorDetail] = useState(null)
  const [detailLoading,setDetailLoading]= useState(false)
  const [newStatus,    setNewStatus]    = useState('approved')
  const [showModal,    setShowModal]    = useState(false)
  const [saving,       setSaving]       = useState(false)

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true)
      try {
        const params = {}
        if (statusFilter) params.status = statusFilter
        const res = await api.get('/admin/vendors', { params })
        setVendors(res.data.vendors || res.data.data || [])
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchVendors()
  }, [statusFilter])

  const quickUpdate = async (vendorId, status) => {
    try {
      await api.patch(`/admin/vendors/${vendorId}/status`, { verificationStatus: status })
      setVendors(prev => prev.map(v => v._id === vendorId ? { ...v, verificationStatus: status } : v))
    } catch (e) { alert(e.response?.data?.message || 'Update failed') }
  }

  const openManage = async (vendor) => {
    setActionVendor(vendor)
    setNewStatus(vendor.verificationStatus || 'pending')
    setShowModal(true)
    setVendorDetail(null)
    setDetailLoading(true)
    try {
      const res = await api.get(`/admin/vendors/${vendor._id}`)
      setVendorDetail(res.data.vendor || vendor)
    } catch { setVendorDetail(vendor) }
    finally { setDetailLoading(false) }
  }

  const confirmUpdate = async () => {
    setSaving(true)
    try {
      await api.patch(`/admin/vendors/${actionVendor._id}/status`, { verificationStatus: newStatus })
      setVendors(prev => prev.map(v => v._id === actionVendor._id ? { ...v, verificationStatus: newStatus } : v))
      setShowModal(false)
    } catch (e) { alert(e.response?.data?.message || 'Update failed') }
    finally { setSaving(false) }
  }

  const filtered = vendors.filter(v => {
    if (!searchQ) return true
    const q = searchQ.toLowerCase()
    const owner = v.owner || v.user || {}
    return (
      (v.storeName||'').toLowerCase().includes(q) ||
      (owner.firstname||'').toLowerCase().includes(q) ||
      (owner.email||'').toLowerCase().includes(q)
    )
  })

  const pendingCount = vendors.filter(v => v.verificationStatus === 'pending').length

  return (
    <div>
      {/* Pending alert */}
      {pendingCount > 0 && (
        <div style={{ background:'#FEF3C7', border:'1px solid #FDE68A', borderRadius:'10px',
          padding:'12px 16px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'18px' }}>🕐</span>
          <span style={{ fontSize:'13px', fontWeight:600, color:'#92400E' }}>
            {pendingCount} vendor{pendingCount > 1 ? 's' : ''} awaiting approval
          </span>
          <button onClick={() => setStatusFilter('pending')}
            style={{ marginLeft:'auto', padding:'5px 14px', background:'#92400E', color:'#fff',
              border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            Review Now →
          </button>
        </div>
      )}

      {/* Status filter pills */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
        {[{v:'',l:'All'},{v:'pending',l:'Pending'},{v:'approved',l:'Approved'},{v:'rejected',l:'Rejected'},{v:'suspended',l:'Suspended'}].map(s => (
          <button key={s.v} className={`admin-filter-pill ${statusFilter === s.v ? 'active' : ''}`}
            onClick={() => setStatusFilter(s.v)}>
            {s.l} ({s.v ? vendors.filter(v => v.verificationStatus === s.v).length : vendors.length})
          </button>
        ))}
      </div>

      <div className="admin-card">
        {/* Toolbar */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid #E2E8F0', display:'flex', gap:'12px', alignItems:'center' }}>
          <input type="text" placeholder="Search vendors by name, store, email…"
            value={searchQ} onChange={e => setSearchQ(e.target.value)}
            style={{ flex:1, padding:'8px 14px', border:'1.5px solid #E2E8F0', borderRadius:'8px',
              fontSize:'13px', fontFamily:'inherit', outline:'none' }} />
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr><th>Store</th><th>Owner</th><th>Email</th><th>Commission</th><th>Joined</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign:'center',padding:'40px',color:'#94A3B8' }}>
                  <div className="spinner-border spinner-border-sm" role="status" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:'center',padding:'40px',color:'#94A3B8',fontSize:'13px' }}>
                  No vendors found.
                </td></tr>
              ) : filtered.map(v => {
                const owner = v.owner || v.user || {}
                const cfg   = STATUS_CONFIG[v.verificationStatus] || STATUS_CONFIG.pending
                return (
                  <tr key={v._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <div style={{ width:34, height:34, borderRadius:'8px', overflow:'hidden',
                          border:'1px solid #E2E8F0', background:'#F1F5F9', flexShrink:0,
                          display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>
                          {v.logo ? <img src={resolveImg(v.logo)} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" /> : '🏪'}
                        </div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:'13px' }}>{v.storeName || '—'}</div>
                          {v.description && (
                            <div style={{ fontSize:'11px', color:'#94A3B8',
                              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'160px' }}>
                              {v.description.slice(0, 50)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize:'13px' }}>{owner.firstname} {owner.lastname}</td>
                    <td style={{ fontSize:'12px', color:'#64748B' }}>{owner.email}</td>
                    <td style={{ fontSize:'12px', color:'#64748B' }}>{v.commissionRate ?? 10}%</td>
                    <td style={{ fontSize:'12px', color:'#94A3B8' }}>{new Date(v.createdAt||owner.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 10px',
                        borderRadius:'12px', background:cfg.bg, color:cfg.color }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:'6px' }}>
                        {v.verificationStatus === 'pending' && (
                          <button className="admin-action-btn"
                            style={{ background:'#D1FAE5', color:'#065F46', border:'none', fontWeight:700 }}
                            onClick={() => quickUpdate(v._id, 'approved')}>
                            Approve
                          </button>
                        )}
                        <button className="admin-action-btn" onClick={() => openManage(v)}>Manage →</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Vendor Detail Modal ── */}
      {actionVendor && (
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
          <Modal.Header closeButton style={{ borderBottom:'1px solid #E2E8F0', padding:'18px 24px' }}>
            <Modal.Title style={{ fontSize:'16px', fontWeight:700 }}>
              Vendor — {actionVendor.storeName}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding:0 }}>
            {detailLoading ? (
              <div style={{ textAlign:'center', padding:'40px', color:'#94A3B8' }}>
                <div className="spinner-border spinner-border-sm" role="status" />
              </div>
            ) : (() => {
              const v     = vendorDetail || actionVendor
              const owner = v.owner || v.user || {}
              const cfg   = STATUS_CONFIG[v.verificationStatus] || STATUS_CONFIG.pending
              return (
                <>
                  {/* Profile header */}
                  <div style={{ background:'#F8FAFC', borderBottom:'1px solid #E2E8F0', padding:'20px 24px',
                    display:'flex', alignItems:'center', gap:'16px' }}>
                    <div style={{ width:60, height:60, borderRadius:'12px', overflow:'hidden',
                      border:'2px solid #E2E8F0', background:'#F1F5F9', flexShrink:0,
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px' }}>
                      {v.logo ? <img src={resolveImg(v.logo)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : '🏪'}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:'17px' }}>{v.storeName}</div>
                      <div style={{ fontSize:'12px', color:'#64748B', marginTop:'2px', maxWidth:'400px' }}>
                        {v.description || v.storeDescription || 'No store description.'}
                      </div>
                      <span style={{ display:'inline-block', marginTop:'6px', fontSize:'11px', fontWeight:700,
                        padding:'3px 10px', borderRadius:'12px', background:cfg.bg, color:cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0, borderBottom:'1px solid #E2E8F0' }}>
                    <div style={{ padding:'18px 24px', borderRight:'1px solid #E2E8F0' }}>
                      <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase',
                        letterSpacing:'.07em', color:'#94A3B8', marginBottom:'10px' }}>Owner</div>
                      <div style={{ fontWeight:700, fontSize:'14px' }}>{owner.firstname} {owner.lastname}</div>
                      <div style={{ fontSize:'12px', color:'#64748B', marginTop:'2px' }}>{owner.email || v.contactEmail}</div>
                      {v.phone && <div style={{ fontSize:'12px', color:'#64748B', marginTop:'2px' }}>📞 {v.phone}</div>}
                      <div style={{ fontSize:'11px', color:'#94A3B8', marginTop:'6px' }}>
                        Joined {new Date(v.createdAt||owner.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}
                      </div>
                    </div>
                    <div style={{ padding:'18px 24px' }}>
                      <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase',
                        letterSpacing:'.07em', color:'#94A3B8', marginBottom:'10px' }}>Store Details</div>
                      <div style={{ fontSize:'12px', color:'#475569', lineHeight:1.8 }}>
                        <div>📧 {v.contactEmail || owner.email || '—'}</div>
                        {v.businessAddress && <div>📍 {v.businessAddress}</div>}
                        <div>💹 Commission Rate: <strong>{v.commissionRate ?? 10}%</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Status change */}
                  <div style={{ padding:'20px 24px' }}>
                    <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase',
                      letterSpacing:'.07em', color:'#94A3B8', marginBottom:'12px' }}>
                      Update Vendor Status
                    </div>
                    <div style={{ background:'#FEF3C7', border:'1px solid #FDE68A', borderRadius:'8px',
                      padding:'10px 14px', fontSize:'12px', color:'#92400E', marginBottom:'14px' }}>
                      ⚠️ Setting status to <strong>pending, rejected, or suspended</strong> immediately hides all vendor products from buyers.
                    </div>
                    <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                      {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
                        <button key={k} onClick={() => setNewStatus(k)}
                          style={{ padding:'8px 18px', borderRadius:'20px', fontSize:'12px', fontWeight:600,
                            cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
                            border: newStatus === k ? `2px solid ${cfg.color}` : '2px solid #E2E8F0',
                            background: newStatus === k ? cfg.bg : '#fff',
                            color: newStatus === k ? cfg.color : '#64748B' }}>
                          {cfg.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )
            })()}
          </Modal.Body>
          <Modal.Footer style={{ borderTop:'1px solid #E2E8F0', padding:'14px 24px' }}>
            <button onClick={() => setShowModal(false)}
              style={{ padding:'9px 20px', border:'1.5px solid #E2E8F0', borderRadius:'8px',
                background:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              Cancel
            </button>
            <button onClick={confirmUpdate} disabled={saving}
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

export default AdminVendors
