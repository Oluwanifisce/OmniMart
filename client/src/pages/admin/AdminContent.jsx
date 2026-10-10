// AdminContent.jsx — Content & Marketing: Announcements, Discounts, Banners
import { useState } from 'react'
import { Modal } from 'react-bootstrap'

// ── Local-state-only (no backend endpoints for content yet) ──
// These features are stored in component state and show the UI scaffold
// ready for backend integration.

const BANNER_PRESETS = [
  { id: 1, title: 'Summer Sale',       subtitle: 'Up to 50% off selected items', cta:'Shop Now', bg:'linear-gradient(135deg,#10B981,#059669)', active: true },
  { id: 2, title: 'New Arrivals',      subtitle: 'Fresh drops every week',        cta:'Explore',  bg:'linear-gradient(135deg,#6366F1,#8B5CF6)', active: false },
  { id: 3, title: 'Free Shipping',     subtitle: 'On orders over $75',            cta:'Learn More',bg:'linear-gradient(135deg,#F59E0B,#D97706)',active: true },
]

const genCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({length: 8}, () => chars[Math.floor(Math.random()*chars.length)]).join('')
}

const AdminContent = () => {
  // ── Banners ──
  const [banners, setBanners]         = useState(BANNER_PRESETS)
  const [showBannerModal, setShowBannerModal] = useState(false)
  const [editBanner, setEditBanner]   = useState(null)
  const [bannerForm, setBannerForm]   = useState({ title:'', subtitle:'', cta:'', bg:'', active:true })

  // ── Discount Codes ──
  const [discounts, setDiscounts]     = useState([
    { id:1, code:'WELCOME20', type:'percent', value:20, minOrder:0,    used:14, active:true,  expires:'2026-12-31' },
    { id:2, code:'SAVE10',    type:'percent', value:10, minOrder:50,   used:38, active:true,  expires:'2026-11-30' },
    { id:3, code:'FLAT15',    type:'fixed',   value:15, minOrder:100,  used:5,  active:false, expires:'2026-10-15' },
  ])
  const [showDiscModal, setShowDiscModal] = useState(false)
  const [discForm, setDiscForm]       = useState({ code:'', type:'percent', value:'', minOrder:'0', expires:'', active:true })

  // ── Announcements ──
  const [announcements, setAnnouncements] = useState([
    { id:1, message:'OmniMart is open for new vendors! Apply today.', type:'info',    active:true  },
    { id:2, message:'Scheduled maintenance on Oct 10 at 2am UTC.',   type:'warning', active:true  },
    { id:3, message:'Holiday shipping deadlines: Dec 18.',            type:'info',    active:false },
  ])
  const [showAnnModal, setShowAnnModal] = useState(false)
  const [annForm, setAnnForm]         = useState({ message:'', type:'info', active:true })

  const TYPE_COLORS = {
    info:    { bg:'#DBEAFE', color:'#1E40AF', label:'ℹ️ Info'    },
    warning: { bg:'#FEF3C7', color:'#92400E', label:'⚠️ Warning' },
    success: { bg:'#D1FAE5', color:'#065F46', label:'✅ Success' },
    danger:  { bg:'#FEE2E2', color:'#991B1B', label:'🔴 Urgent'  },
  }

  // ── Banner actions ──
  const toggleBanner = (id) => setBanners(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b))
  const deleteBanner = (id) => setBanners(prev => prev.filter(b => b.id !== id))
  const saveBanner = () => {
    if (editBanner) {
      setBanners(prev => prev.map(b => b.id === editBanner.id ? { ...b, ...bannerForm } : b))
    } else {
      setBanners(prev => [...prev, { id: Date.now(), ...bannerForm }])
    }
    setShowBannerModal(false)
  }
  const openBannerEdit = (b) => {
    setEditBanner(b); setBannerForm({ title:b.title, subtitle:b.subtitle, cta:b.cta, bg:b.bg, active:b.active })
    setShowBannerModal(true)
  }
  const openBannerAdd = () => {
    setEditBanner(null); setBannerForm({ title:'', subtitle:'', cta:'Shop Now', bg:'linear-gradient(135deg,#10B981,#059669)', active:true })
    setShowBannerModal(true)
  }

  // ── Discount actions ──
  const toggleDiscount = (id) => setDiscounts(prev => prev.map(d => d.id === id ? { ...d, active: !d.active } : d))
  const deleteDiscount = (id) => setDiscounts(prev => prev.filter(d => d.id !== id))
  const saveDiscount = () => {
    if (!discForm.code || !discForm.value) return
    setDiscounts(prev => [...prev, { id: Date.now(), ...discForm, value: +discForm.value, used: 0 }])
    setShowDiscModal(false)
  }

  // ── Announcement actions ──
  const toggleAnn = (id) => setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a))
  const deleteAnn = (id) => setAnnouncements(prev => prev.filter(a => a.id !== id))
  const saveAnn = () => {
    if (!annForm.message) return
    setAnnouncements(prev => [...prev, { id: Date.now(), ...annForm }])
    setShowAnnModal(false)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>

      {/* ════════════ HOMEPAGE BANNERS ════════════ */}
      <div className="admin-card">
        <div className="admin-card-header" style={{ padding:'14px 20px' }}>
          <span>Homepage Banners</span>
          <button onClick={openBannerAdd}
            style={{ padding:'7px 16px', background:'#0F172A', color:'#fff', border:'none',
              borderRadius:'7px', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            + Add Banner
          </button>
        </div>
        <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:'12px' }}>
          {banners.map(b => (
            <div key={b.id} style={{ display:'flex', alignItems:'center', gap:'14px',
              padding:'14px 16px', border:'1.5px solid #E2E8F0', borderRadius:'10px',
              background: b.active ? '#fff' : '#F8FAFC', opacity: b.active ? 1 : .65 }}>
              {/* Preview swatch */}
              <div style={{ width:56, height:40, borderRadius:'8px', background:b.bg,
                flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ color:'#fff', fontSize:'10px', fontWeight:700, textAlign:'center',
                  padding:'0 4px', lineHeight:1.2 }}>{b.cta}</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:'13px' }}>{b.title}</div>
                <div style={{ fontSize:'12px', color:'#64748B' }}>{b.subtitle}</div>
              </div>
              <div style={{ display:'flex', gap:'8px', alignItems:'center', flexShrink:0 }}>
                <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'12px',
                  background: b.active ? '#D1FAE5' : '#F1F5F9', color: b.active ? '#065F46' : '#94A3B8' }}>
                  {b.active ? 'Live' : 'Draft'}
                </span>
                <button className="admin-action-btn" onClick={() => openBannerEdit(b)}>Edit</button>
                <button className="admin-action-btn" onClick={() => toggleBanner(b.id)}>
                  {b.active ? 'Disable' : 'Enable'}
                </button>
                <button className="admin-action-btn admin-action-btn-danger" onClick={() => deleteBanner(b.id)}>✕</button>
              </div>
            </div>
          ))}
          {banners.length === 0 && (
            <p style={{ textAlign:'center', color:'#94A3B8', fontSize:'13px', padding:'20px' }}>No banners yet.</p>
          )}
        </div>
      </div>

      {/* ════════════ DISCOUNT CODES ════════════ */}
      <div className="admin-card">
        <div className="admin-card-header">
          <span>Promotional Discount Codes</span>
          <button onClick={() => { setDiscForm({ code: genCode(), type:'percent', value:'', minOrder:'0', expires:'', active:true }); setShowDiscModal(true) }}
            style={{ padding:'7px 16px', background:'#0F172A', color:'#fff', border:'none',
              borderRadius:'7px', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            + Generate Code
          </button>
        </div>
        <div className="table-responsive">
          <table className="admin-table">
            <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Used</th><th>Expires</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {discounts.map(d => (
                <tr key={d.id}>
                  <td style={{ fontFamily:'monospace', fontWeight:700, color:'#6366F1', letterSpacing:'.06em' }}>{d.code}</td>
                  <td style={{ fontSize:'12px', color:'#64748B' }}>{d.type === 'percent' ? 'Percentage' : 'Fixed ($)'}</td>
                  <td style={{ fontWeight:700 }}>{d.type === 'percent' ? `${d.value}%` : `$${d.value}`}</td>
                  <td style={{ fontSize:'12px', color:'#64748B' }}>{d.minOrder > 0 ? `$${d.minOrder}` : 'None'}</td>
                  <td style={{ fontSize:'12px', color:'#94A3B8' }}>{d.used}×</td>
                  <td style={{ fontSize:'12px', color:'#94A3B8' }}>{d.expires || '—'}</td>
                  <td>
                    <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'12px',
                      background: d.active ? '#D1FAE5' : '#F1F5F9', color: d.active ? '#065F46' : '#94A3B8' }}>
                      {d.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:'6px' }}>
                      <button className="admin-action-btn" onClick={() => toggleDiscount(d.id)}>
                        {d.active ? 'Disable' : 'Enable'}
                      </button>
                      <button className="admin-action-btn admin-action-btn-danger" onClick={() => deleteDiscount(d.id)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ════════════ ANNOUNCEMENTS ════════════ */}
      <div className="admin-card">
        <div className="admin-card-header">
          <span>System Announcements</span>
          <button onClick={() => { setAnnForm({ message:'', type:'info', active:true }); setShowAnnModal(true) }}
            style={{ padding:'7px 16px', background:'#0F172A', color:'#fff', border:'none',
              borderRadius:'7px', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            + New Announcement
          </button>
        </div>
        <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:'10px' }}>
          {announcements.map(a => {
            const cfg = TYPE_COLORS[a.type] || TYPE_COLORS.info
            return (
              <div key={a.id} style={{ display:'flex', alignItems:'center', gap:'12px',
                padding:'12px 16px', border:`1.5px solid ${cfg.bg}`, borderRadius:'10px',
                background: a.active ? cfg.bg : '#F8FAFC', opacity: a.active ? 1 : .6 }}>
                <span style={{ fontSize:'20px', flexShrink:0 }}>{cfg.label.split(' ')[0]}</span>
                <div style={{ flex:1, fontSize:'13px', fontWeight:500, color: a.active ? cfg.color : '#94A3B8' }}>
                  {a.message}
                </div>
                <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
                  <button className="admin-action-btn" onClick={() => toggleAnn(a.id)}>
                    {a.active ? 'Hide' : 'Show'}
                  </button>
                  <button className="admin-action-btn admin-action-btn-danger" onClick={() => deleteAnn(a.id)}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Banner Modal ── */}
      <Modal show={showBannerModal} onHide={() => setShowBannerModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom:'1px solid #E2E8F0', padding:'16px 24px' }}>
          <Modal.Title style={{ fontSize:'15px', fontWeight:700 }}>{editBanner ? 'Edit Banner' : 'Add Banner'}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding:'20px 24px' }}>
          {[['title','Headline'],['subtitle','Subtitle'],['cta','CTA Button Text']].map(([k,l]) => (
            <div key={k} style={{ marginBottom:'14px' }}>
              <label className="admin-field-label">{l}</label>
              <input className="admin-field-input" value={bannerForm[k]||''}
                onChange={e => setBannerForm(f => ({ ...f, [k]: e.target.value }))} />
            </div>
          ))}
          <div style={{ marginBottom:'14px' }}>
            <label className="admin-field-label">Background Gradient CSS</label>
            <input className="admin-field-input" value={bannerForm.bg||''}
              onChange={e => setBannerForm(f => ({ ...f, bg: e.target.value }))}
              placeholder="linear-gradient(135deg,#10B981,#059669)" />
          </div>
          {bannerForm.bg && (
            <div style={{ height:48, borderRadius:'8px', background:bannerForm.bg, marginBottom:'14px',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ color:'#fff', fontSize:'12px', fontWeight:700 }}>{bannerForm.cta || 'Preview'}</span>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop:'1px solid #E2E8F0', padding:'12px 24px' }}>
          <button onClick={() => setShowBannerModal(false)}
            style={{ padding:'8px 18px', border:'1.5px solid #E2E8F0', borderRadius:'8px',
              background:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            Cancel
          </button>
          <button onClick={saveBanner}
            style={{ padding:'8px 18px', border:'none', borderRadius:'8px', fontSize:'13px',
              fontWeight:700, cursor:'pointer', fontFamily:'inherit', background:'#0F172A', color:'#fff' }}>
            Save Banner
          </button>
        </Modal.Footer>
      </Modal>

      {/* ── Discount Code Modal ── */}
      <Modal show={showDiscModal} onHide={() => setShowDiscModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom:'1px solid #E2E8F0', padding:'16px 24px' }}>
          <Modal.Title style={{ fontSize:'15px', fontWeight:700 }}>New Discount Code</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding:'20px 24px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label className="admin-field-label">Code</label>
              <div style={{ display:'flex', gap:'8px' }}>
                <input className="admin-field-input" style={{ flex:1, fontFamily:'monospace', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase' }}
                  value={discForm.code} onChange={e => setDiscForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
                <button onClick={() => setDiscForm(f => ({ ...f, code: genCode() }))}
                  style={{ padding:'0 14px', border:'1.5px solid #E2E8F0', borderRadius:'8px',
                    background:'#F8FAFC', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                  Regenerate
                </button>
              </div>
            </div>
            <div>
              <label className="admin-field-label">Discount Type</label>
              <select className="admin-field-input" value={discForm.type}
                onChange={e => setDiscForm(f => ({ ...f, type: e.target.value }))}>
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label className="admin-field-label">Value</label>
              <input className="admin-field-input" type="number" min="0" value={discForm.value}
                onChange={e => setDiscForm(f => ({ ...f, value: e.target.value }))}
                placeholder={discForm.type === 'percent' ? '20' : '15'} />
            </div>
            <div>
              <label className="admin-field-label">Min. Order ($)</label>
              <input className="admin-field-input" type="number" min="0" value={discForm.minOrder}
                onChange={e => setDiscForm(f => ({ ...f, minOrder: e.target.value }))} />
            </div>
            <div>
              <label className="admin-field-label">Expiry Date</label>
              <input className="admin-field-input" type="date" value={discForm.expires}
                onChange={e => setDiscForm(f => ({ ...f, expires: e.target.value }))} />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ borderTop:'1px solid #E2E8F0', padding:'12px 24px' }}>
          <button onClick={() => setShowDiscModal(false)}
            style={{ padding:'8px 18px', border:'1.5px solid #E2E8F0', borderRadius:'8px',
              background:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            Cancel
          </button>
          <button onClick={saveDiscount}
            style={{ padding:'8px 18px', border:'none', borderRadius:'8px', fontSize:'13px',
              fontWeight:700, cursor:'pointer', fontFamily:'inherit', background:'#0F172A', color:'#fff' }}>
            Create Code
          </button>
        </Modal.Footer>
      </Modal>

      {/* ── Announcement Modal ── */}
      <Modal show={showAnnModal} onHide={() => setShowAnnModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom:'1px solid #E2E8F0', padding:'16px 24px' }}>
          <Modal.Title style={{ fontSize:'15px', fontWeight:700 }}>New Announcement</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding:'20px 24px' }}>
          <div style={{ marginBottom:'14px' }}>
            <label className="admin-field-label">Message</label>
            <textarea className="admin-field-input" rows={3} value={annForm.message}
              onChange={e => setAnnForm(f => ({ ...f, message: e.target.value }))}
              placeholder="e.g. Scheduled maintenance on Oct 10 at 2am UTC." />
          </div>
          <div>
            <label className="admin-field-label">Type</label>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              {Object.entries(TYPE_COLORS).map(([k,cfg]) => (
                <button key={k} onClick={() => setAnnForm(f => ({ ...f, type: k }))}
                  style={{ padding:'7px 16px', borderRadius:'20px', fontSize:'12px', fontWeight:600,
                    cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
                    border: annForm.type === k ? `2px solid ${cfg.color}` : '2px solid #E2E8F0',
                    background: annForm.type === k ? cfg.bg : '#fff',
                    color: annForm.type === k ? cfg.color : '#64748B' }}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ borderTop:'1px solid #E2E8F0', padding:'12px 24px' }}>
          <button onClick={() => setShowAnnModal(false)}
            style={{ padding:'8px 18px', border:'1.5px solid #E2E8F0', borderRadius:'8px',
              background:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            Cancel
          </button>
          <button onClick={saveAnn}
            style={{ padding:'8px 18px', border:'none', borderRadius:'8px', fontSize:'13px',
              fontWeight:700, cursor:'pointer', fontFamily:'inherit', background:'#0F172A', color:'#fff' }}>
            Publish
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default AdminContent
