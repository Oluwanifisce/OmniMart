// AdminUsers.jsx — User & Access Control with role/status management
import { useState, useEffect } from 'react'
import { Modal } from 'react-bootstrap'
import api from '../../api/axios'

const ROLE_CONFIG = {
  admin:    { bg: '#D1FAE5', color: '#065F46', label: 'Admin'    },
  vendor:   { bg: '#FEF3C7', color: '#92400E', label: 'Vendor'   },
  customer: { bg: '#F1F5F9', color: '#475569', label: 'Customer' },
}

const STATUS_CONFIG = {
  active:    { bg: '#D1FAE5', color: '#065F46' },
  suspended: { bg: '#FEE2E2', color: '#991B1B' },
}

const AdminUsers = () => {
  const [users,      setUsers]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [roleFilter, setRoleFilter] = useState('')
  const [searchQ,    setSearchQ]    = useState('')
  const [selected,   setSelected]   = useState(null)
  const [showModal,  setShowModal]  = useState(false)
  const [saving,     setSaving]     = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const res = await api.get('/getusers')
        setUsers(res.data.users || res.data.data || [])
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchUsers()
  }, [])

  const openUser = (u) => { setSelected({ ...u }); setShowModal(true) }

  const saveUser = async () => {
    setSaving(true)
    try {
      await api.patch(`/admin/users/${selected._id}`, {
        role:   selected.role,
        status: selected.status,
      })
      setUsers(prev => prev.map(u => u._id === selected._id ? { ...u, ...selected } : u))
      setShowModal(false)
    } catch (e) {
      // Fallback: endpoint may not exist — show graceful error
      alert(e.response?.data?.message || 'User update not available (endpoint not configured).')
    } finally { setSaving(false) }
  }

  const filtered = users.filter(u => {
    const matchRole = roleFilter ? u.role === roleFilter : true
    const q = searchQ.toLowerCase()
    const matchSearch = q
      ? `${u.firstname||''} ${u.lastname||''} ${u.email||''}`.toLowerCase().includes(q)
      : true
    return matchRole && matchSearch
  })

  const initials = (u) => `${u.firstname?.[0]||''}${u.lastname?.[0]||''}`.toUpperCase() || '?'

  return (
    <div>
      {/* Role tabs */}
      <div style={{ display:'flex', gap:'10px', marginBottom:'20px', flexWrap:'wrap' }}>
        {[{v:'',l:'All Users'},{v:'admin',l:'Admins'},{v:'vendor',l:'Vendors'},{v:'customer',l:'Customers'}].map(r => (
          <button key={r.v} className={`admin-filter-pill ${roleFilter === r.v ? 'active' : ''}`}
            onClick={() => setRoleFilter(r.v)}>
            {r.l} ({r.v ? users.filter(u => u.role === r.v).length : users.length})
          </button>
        ))}
      </div>

      <div className="admin-card">
        {/* Toolbar */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid #E2E8F0', display:'flex', gap:'12px', alignItems:'center' }}>
          <input type="text" placeholder="Search by name or email…"
            value={searchQ} onChange={e => setSearchQ(e.target.value)}
            style={{ flex:1, padding:'8px 14px', border:'1.5px solid #E2E8F0', borderRadius:'8px',
              fontSize:'13px', fontFamily:'inherit', outline:'none' }} />
          <span style={{ fontSize:'12px', color:'#94A3B8', whiteSpace:'nowrap' }}>
            {filtered.length} of {users.length} users
          </span>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:'40px', color:'#94A3B8' }}>
                  <div className="spinner-border spinner-border-sm" role="status" />
                </td></tr>
              ) : filtered.map(u => {
                const roleCfg   = ROLE_CONFIG[u.role] || { bg:'#F1F5F9', color:'#475569', label: u.role }
                const statusCfg = STATUS_CONFIG[u.status||'active'] || STATUS_CONFIG.active
                return (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <div style={{ width:34, height:34, borderRadius:'50%', background:'#F1F5F9',
                          border:'1px solid #E2E8F0', display:'flex', alignItems:'center',
                          justifyContent:'center', fontSize:'12px', fontWeight:700,
                          color:'#475569', flexShrink:0 }}>
                          {initials(u)}
                        </div>
                        <div>
                          <div style={{ fontSize:'13px', fontWeight:600 }}>{u.firstname} {u.lastname}</div>
                          <div style={{ fontSize:'11px', color:'#94A3B8' }}>ID: {u._id.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize:'12px', color:'#64748B' }}>{u.email}</td>
                    <td>
                      <span style={{ ...roleCfg, fontSize:'11px', fontWeight:700,
                        padding:'3px 10px', borderRadius:'12px' }}>
                        {roleCfg.label}
                      </span>
                    </td>
                    <td>
                      <span style={{ ...statusCfg, fontSize:'11px', fontWeight:700,
                        padding:'3px 10px', borderRadius:'12px' }}>
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td style={{ fontSize:'12px', color:'#94A3B8' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button className="admin-action-btn" onClick={() => openUser(u)}>
                        Manage →
                      </button>
                    </td>
                  </tr>
                )
              })}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:'40px', color:'#94A3B8', fontSize:'13px' }}>
                  No users match your filter.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── User Management Modal ── */}
      {selected && (
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton style={{ borderBottom:'1px solid #E2E8F0', padding:'18px 24px' }}>
            <Modal.Title style={{ fontSize:'16px', fontWeight:700 }}>
              Manage User
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding:'24px' }}>
            {/* User header */}
            <div style={{ display:'flex', alignItems:'center', gap:'14px',
              padding:'16px', background:'#F8FAFC', borderRadius:'10px', marginBottom:'20px' }}>
              <div style={{ width:48, height:48, borderRadius:'50%', background:'#E2E8F0',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'16px', fontWeight:700, color:'#475569' }}>
                {initials(selected)}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:'15px' }}>{selected.firstname} {selected.lastname}</div>
                <div style={{ fontSize:'12px', color:'#64748B' }}>{selected.email}</div>
                <div style={{ fontSize:'11px', color:'#94A3B8', marginTop:'2px' }}>
                  Joined {new Date(selected.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}
                </div>
              </div>
            </div>

            {/* Role select */}
            <div style={{ marginBottom:'16px' }}>
              <label style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase',
                letterSpacing:'.06em', color:'#64748B', display:'block', marginBottom:'6px' }}>
                System Role
              </label>
              <select value={selected.role} onChange={e => setSelected(s => ({ ...s, role: e.target.value }))}
                style={{ width:'100%', padding:'9px 14px', border:'1.5px solid #E2E8F0', borderRadius:'8px',
                  fontSize:'13px', fontFamily:'inherit', outline:'none', background:'#fff', color:'#0F172A' }}>
                <option value="customer">Customer — Standard buyer account</option>
                <option value="vendor">Vendor — Can list and sell products</option>
                <option value="admin">Admin — Full platform access</option>
              </select>
            </div>

            {/* Account status */}
            <div>
              <label style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase',
                letterSpacing:'.06em', color:'#64748B', display:'block', marginBottom:'6px' }}>
                Account Status
              </label>
              <div style={{ display:'flex', gap:'10px' }}>
                {['active', 'suspended'].map(st => {
                  const cfg = STATUS_CONFIG[st]
                  return (
                    <button key={st} onClick={() => setSelected(s => ({ ...s, status: st }))}
                      style={{ flex:1, padding:'10px', borderRadius:'8px', fontSize:'13px', fontWeight:600,
                        cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
                        border: selected.status === st ? `2px solid ${cfg.color}` : '2px solid #E2E8F0',
                        background: selected.status === st ? cfg.bg : '#fff',
                        color: selected.status === st ? cfg.color : '#64748B' }}>
                      {st.charAt(0).toUpperCase() + st.slice(1)}
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
            <button onClick={saveUser} disabled={saving}
              style={{ padding:'9px 20px', border:'none', borderRadius:'8px', fontSize:'13px',
                fontWeight:700, cursor:'pointer', fontFamily:'inherit', background:'#0F172A', color:'#fff' }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  )
}

export default AdminUsers
