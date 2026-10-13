// AdminCatalog.jsx — Full catalog management: Categories + Products CRUD
import { useState, useEffect, useRef } from 'react'
import { Modal } from 'react-bootstrap'
import api from '../../api/axios'

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
const resolveImg = url => (!url ? '' : url.startsWith('http') ? url : `${BASE_URL}${url}`)

const CATEGORY_LIST = [
  'Apparel','Electronics','Computers','Audio',
  'Accessories','Home & Living','Beauty & Cosmetics','General',
]

const AdminCatalog = () => {
  const [tab, setTab]             = useState('products')   // 'products' | 'categories'
  const [products, setProducts]   = useState([])
  const [loading,  setLoading]    = useState(true)
  const [search,   setSearch]     = useState('')
  const [catFilter,setCatFilter]  = useState('')
  const [page,     setPage]       = useState(1)
  const [totalPgs, setTotalPgs]   = useState(1)

  // Product modal
  const [showModal, setShowModal] = useState(false)
  const [editProd,  setEditProd]  = useState(null)
  const [formVals,  setFormVals]  = useState({ title:'', price:'', stock:'', categories:'', description:'', sku:'' })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImgPrev] = useState('')
  const [saving,    setSaving]    = useState(false)
  const [formErr,   setFormErr]   = useState('')
  const fileRef = useRef(null)

  // Delete confirm
  const [deleteId, setDeleteId]   = useState(null)
  const [showDel,  setShowDel]    = useState(false)

  // ── Load products ──
  const loadProducts = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 15 }
      if (search)    params.search   = search
      if (catFilter) params.category = catFilter
      const res = await api.get('/products', { params })
      setProducts(res.data.products || res.data.data || [])
      setTotalPgs(res.data.totalPages || res.data.pages || 1)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { const t = setTimeout(loadProducts, 300); return () => clearTimeout(t) }, [page, catFilter, search])

  // ── Open Add modal ──
  const openAdd = () => {
    setEditProd(null)
    setFormVals({ title:'', price:'', stock:'', categories:'', description:'', sku:'' })
    setImageFile(null); setImgPrev(''); setFormErr('')
    setShowModal(true)
  }

  // ── Open Edit modal ──
  const openEdit = (p) => {
    setEditProd(p)
    setFormVals({
      title:       p.title || p.name || '',
      price:       p.price || '',
      stock:       p.stock || '',
      categories:  Array.isArray(p.categories) ? p.categories.join(', ') : (p.category || ''),
      description: p.description || '',
      sku:         p.sku || '',
    })
    const img = p.images?.[0] ? resolveImg(p.images[0]) : ''
    setImgPrev(img); setImageFile(null); setFormErr('')
    setShowModal(true)
  }

  // ── Upload helper ──
  const uploadImage = async (file) => {
    const fd = new FormData(); fd.append('image', file)
    const res = await api.post('/upload', fd, { headers: { 'Content-Type':'multipart/form-data' } })
    return resolveImg(res.data.url || '')
  }

  // ── Save product ──
  const saveProduct = async () => {
    if (!formVals.title || !formVals.price) { setFormErr('Title and price are required.'); return }
    if (!editProd && !imageFile && !imagePreview) { setFormErr('Please upload a product image.'); return }
    setSaving(true); setFormErr('')
    try {
      let imgUrl = imagePreview
      if (imageFile) imgUrl = await uploadImage(imageFile)

      const cats = formVals.categories.split(',').map(c => c.trim()).filter(Boolean)
      const payload = {
        title:       formVals.title,
        price:       +formVals.price,
        stock:       +formVals.stock || 0,
        description: formVals.description || formVals.title,
        categories:  cats.length ? cats : ['General'],
        images:      imgUrl ? [imgUrl] : [],
        sku:         formVals.sku,
      }

      if (editProd) {
        await api.put(`/vendor/products/${editProd._id}`, payload)
      } else {
        await api.post('/vendor/products', payload)
      }

      setShowModal(false)
      setImageFile(null); setImgPrev('')
      if (fileRef.current) fileRef.current.value = ''
      loadProducts()
    } catch (e) {
      setFormErr(e.response?.data?.error || e.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  // ── Delete ──
  const confirmDelete = async () => {
    try {
      await api.delete(`/vendor/products/${deleteId}`)
      setProducts(prev => prev.filter(p => p._id !== deleteId))
      setShowDel(false)
    } catch (e) { alert(e.response?.data?.message || 'Delete failed') }
  }

  const fmt = (n) => `₦${Number(n||0).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  // ── Category stats ──
  const catStats = CATEGORY_LIST.map(c => ({
    name:  c,
    count: products.filter(p => Array.isArray(p.categories) ? p.categories.includes(c) : p.category === c).length,
  }))

  return (
    <div>
      {/* Tabs */}
      <div style={{ display:'flex', gap:'4px', marginBottom:'20px', background:'#F1F5F9',
        padding:'4px', borderRadius:'10px', width:'fit-content' }}>
        {[['products','Products'],['categories','Categories']].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            style={{ padding:'7px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:600,
              cursor:'pointer', fontFamily:'inherit', border:'none', transition:'all .15s',
              background: tab === v ? '#fff' : 'transparent',
              color:      tab === v ? '#0F172A' : '#64748B',
              boxShadow:  tab === v ? '0 1px 4px rgba(0,0,0,.08)' : 'none' }}>
            {l}
          </button>
        ))}
      </div>

      {/* ════════════ PRODUCTS TAB ════════════ */}
      {tab === 'products' && (
        <>
          <div className="admin-card">
            {/* Toolbar */}
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #E2E8F0',
              display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap' }}>
              <input type="text" placeholder="Search products…" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                style={{ flex:1, minWidth:'160px', padding:'8px 14px', border:'1.5px solid #E2E8F0',
                  borderRadius:'8px', fontSize:'13px', fontFamily:'inherit', outline:'none' }} />
              <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1) }}
                style={{ padding:'8px 14px', border:'1.5px solid #E2E8F0', borderRadius:'8px',
                  fontSize:'13px', fontFamily:'inherit', outline:'none', background:'#fff' }}>
                <option value="">All Categories</option>
                {CATEGORY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={openAdd}
                style={{ padding:'8px 18px', background:'#0F172A', color:'#fff', border:'none',
                  borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                  whiteSpace:'nowrap', transition:'background .15s' }}>
                + Add Product
              </button>
            </div>

            {/* Table */}
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ textAlign:'center',padding:'40px',color:'#94A3B8' }}>
                      <div className="spinner-border spinner-border-sm" role="status" />
                    </td></tr>
                  ) : products.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign:'center',padding:'40px',color:'#94A3B8',fontSize:'13px' }}>
                      No products found.
                    </td></tr>
                  ) : products.map(p => (
                    <tr key={p._id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                          <div style={{ width:38, height:38, background:'#F8FAFC', border:'1px solid #E2E8F0',
                            borderRadius:'6px', overflow:'hidden', flexShrink:0 }}>
                            {p.images?.[0]
                              ? <img src={resolveImg(p.images[0])} alt={p.title}
                                  style={{ width:'100%', height:'100%', objectFit:'contain', padding:'3px' }} />
                              : <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                                  height:'100%', fontSize:'14px' }}>📦</div>}
                          </div>
                          <div>
                            <div style={{ fontSize:'13px', fontWeight:600, maxWidth:'200px',
                              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {p.title || p.name}
                            </div>
                            <div style={{ fontSize:'11px', color:'#94A3B8' }}>
                              {p.vendor?.storeName || '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily:'monospace', fontSize:'11px', color:'#64748B' }}>
                        {p.sku || p._id.slice(-8).toUpperCase()}
                      </td>
                      <td style={{ fontSize:'12px', color:'#64748B' }}>
                        {Array.isArray(p.categories) ? p.categories.slice(0,2).join(', ') : (p.category||'—')}
                      </td>
                      <td style={{ fontWeight:700, color:'#0F172A' }}>{fmt(p.price)}</td>
                      <td>
                        <span style={{ fontSize:'12px', fontWeight:600,
                          color: p.stock === 0 ? '#EF4444' : p.stock < 5 ? '#F59E0B' : '#10B981' }}>
                          {p.stock === 0 ? 'Out of stock' : `${p.stock} units`}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 10px',
                          borderRadius:'12px', background: p.isActive ? '#D1FAE5' : '#F1F5F9',
                          color: p.isActive ? '#065F46' : '#94A3B8' }}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:'6px' }}>
                          <button className="admin-action-btn" onClick={() => openEdit(p)}>Edit</button>
                          <button className="admin-action-btn admin-action-btn-danger"
                            onClick={() => { setDeleteId(p._id); setShowDel(true) }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPgs > 1 && (
              <div style={{ padding:'14px 20px', borderTop:'1px solid #E2E8F0',
                display:'flex', gap:'6px', justifyContent:'center' }}>
                <button className="admin-page-btn" disabled={page===1} onClick={() => setPage(p => p-1)}>‹</button>
                {[...Array(totalPgs)].map((_,i) => (
                  <button key={i} className={`admin-page-btn ${page===i+1?'active':''}`} onClick={() => setPage(i+1)}>{i+1}</button>
                ))}
                <button className="admin-page-btn" disabled={page===totalPgs} onClick={() => setPage(p => p+1)}>›</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ════════════ CATEGORIES TAB ════════════ */}
      {tab === 'categories' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'14px' }}>
          {catStats.map(c => (
            <div key={c.name} className="admin-card" style={{ padding:'20px', cursor:'pointer', transition:'all .18s' }}
              onClick={() => { setTab('products'); setCatFilter(c.name) }}>
              <div style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase',
                letterSpacing:'.07em', color:'#94A3B8', marginBottom:'8px' }}>Category</div>
              <div style={{ fontSize:'15px', fontWeight:700, color:'#0F172A', marginBottom:'6px' }}>{c.name}</div>
              <div style={{ fontSize:'24px', fontWeight:800, color:'#10B981' }}>{c.count}</div>
              <div style={{ fontSize:'11px', color:'#94A3B8', marginTop:'2px' }}>products</div>
              <div style={{ marginTop:'10px', height:'4px', background:'#F1F5F9', borderRadius:'2px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.min((c.count / (products.length||1)) * 100, 100)}%`,
                  background:'#10B981', borderRadius:'2px' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Product Add/Edit Modal ── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton style={{ borderBottom:'1px solid #E2E8F0', padding:'18px 24px' }}>
          <Modal.Title style={{ fontSize:'16px', fontWeight:700 }}>
            {editProd ? 'Edit Product' : 'Add New Product'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding:'24px' }}>
          {formErr && (
            <div style={{ background:'#FEE2E2', border:'1px solid #FCA5A5', color:'#991B1B',
              borderRadius:'8px', padding:'10px 14px', fontSize:'13px', marginBottom:'16px' }}>
              {formErr}
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label className="admin-field-label">Product Title *</label>
              <input className="admin-field-input" value={formVals.title}
                onChange={e => setFormVals(v => ({ ...v, title: e.target.value }))}
                placeholder="e.g. Wireless Noise-Cancelling Headphones" />
            </div>
            <div>
              <label className="admin-field-label">Price (USD) *</label>
              <input className="admin-field-input" type="number" step="0.01" min="0" value={formVals.price}
                onChange={e => setFormVals(v => ({ ...v, price: e.target.value }))} placeholder="0.00" />
            </div>
            <div>
              <label className="admin-field-label">Stock Quantity</label>
              <input className="admin-field-input" type="number" min="0" value={formVals.stock}
                onChange={e => setFormVals(v => ({ ...v, stock: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <label className="admin-field-label">Categories (comma-separated)</label>
              <input className="admin-field-input" value={formVals.categories}
                onChange={e => setFormVals(v => ({ ...v, categories: e.target.value }))}
                placeholder="Electronics, Audio" />
            </div>
            <div>
              <label className="admin-field-label">SKU (optional)</label>
              <input className="admin-field-input" value={formVals.sku}
                onChange={e => setFormVals(v => ({ ...v, sku: e.target.value }))} placeholder="ABC-001" />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label className="admin-field-label">Description</label>
              <textarea className="admin-field-input" rows={3} value={formVals.description}
                onChange={e => setFormVals(v => ({ ...v, description: e.target.value }))} />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label className="admin-field-label">Product Image {!editProd && <span style={{ color:'#EF4444' }}>*</span>}</label>
              <div onClick={() => fileRef.current?.click()}
                style={{ border:'2px dashed #E2E8F0', borderRadius:'10px', padding:'16px',
                  textAlign:'center', cursor:'pointer', background:'#F8FAFC', transition:'border-color .15s' }}>
                {imagePreview
                  ? <img src={imagePreview} alt="preview"
                      style={{ maxHeight:'100px', maxWidth:'100%', objectFit:'contain', borderRadius:'6px' }} />
                  : <div style={{ color:'#94A3B8', fontSize:'13px' }}>
                      <div style={{ fontSize:'28px', marginBottom:'4px' }}>📷</div>
                      Click to upload — JPG, PNG, WEBP · max 5MB
                    </div>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) { setImageFile(f); setImgPrev(URL.createObjectURL(f)) }
                }} />
              {imageFile && <p style={{ fontSize:'11px', color:'#10B981', marginTop:'4px' }}>✓ {imageFile.name}</p>}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ borderTop:'1px solid #E2E8F0', padding:'14px 24px' }}>
          <button onClick={() => setShowModal(false)}
            style={{ padding:'9px 20px', border:'1.5px solid #E2E8F0', borderRadius:'8px',
              background:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            Cancel
          </button>
          <button onClick={saveProduct} disabled={saving}
            style={{ padding:'9px 20px', border:'none', borderRadius:'8px', fontSize:'13px',
              fontWeight:700, cursor:'pointer', fontFamily:'inherit', background:'#0F172A', color:'#fff' }}>
            {saving ? 'Saving…' : editProd ? 'Save Changes' : 'Add Product'}
          </button>
        </Modal.Footer>
      </Modal>

      {/* ── Delete Confirm ── */}
      <Modal show={showDel} onHide={() => setShowDel(false)} centered size="sm">
        <Modal.Header closeButton style={{ borderBottom:'1px solid #E2E8F0' }}>
          <Modal.Title style={{ fontSize:'15px' }}>Delete Product</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ fontSize:'13.5px', padding:'20px 24px' }}>
          Are you sure? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer style={{ borderTop:'1px solid #E2E8F0', padding:'12px 24px' }}>
          <button onClick={() => setShowDel(false)}
            style={{ padding:'8px 18px', border:'1.5px solid #E2E8F0', borderRadius:'8px',
              background:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            Cancel
          </button>
          <button onClick={confirmDelete}
            style={{ padding:'8px 18px', border:'none', borderRadius:'8px', fontSize:'13px',
              fontWeight:700, cursor:'pointer', fontFamily:'inherit', background:'#EF4444', color:'#fff' }}>
            Delete
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default AdminCatalog
