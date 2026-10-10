// VendorDashboard — Vendor portal using useState + useEffect + axios pattern
import { useState, useEffect, useRef } from 'react'
import { useFormik } from 'formik'
import { Link } from 'react-router-dom' // eslint-disable-line no-unused-vars
import { Modal } from 'react-bootstrap'
import * as yup from 'yup'
import api from '../api/axios'
import ProductCard from '../components/ProductCard'

// Base URL for uploaded images served from backend
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

const VendorDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // State — instructor's useState pattern
  const [section, setSection]     = useState('dashboard')
  const [profile, setProfile]     = useState(null)
  const [products, setProducts]   = useState([])
  const [orders, setOrders]       = useState([])
  const [stats, setStats]         = useState({ products: 0, orders: 0, revenue: 0 })
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId]       = useState(null)
  const [deleteId, setDeleteId]   = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Image upload state
  const [imageFile, setImageFile]     = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [uploadingImg, setUploadingImg] = useState(false)
  const fileInputRef = useRef(null)

  // Profile edit state
  const [profileLogoFile, setProfileLogoFile] = useState(null)
  const [profileLogoPreview, setProfileLogoPreview] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const profileLogoInputRef = useRef(null)

  // Toast notification state
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState({ text: '', type: 'success' })

  const triggerToast = (text, type = 'success') => {
    setToastMsg({ text, type })
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }

  const formatPrice = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const resolveImgUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `${BASE_URL}${url}`
  }

  // Load profile — re-fetch on section change so approval status is always fresh
  useEffect(() => {
    const makeRequest = async () => {
      try {
        const res = await api.get('/vendor/profile')
        const vendorData = res.data.vendor || res.data.data || res.data
        setProfile(vendorData)
        if (vendorData.logo) setProfileLogoPreview(resolveImgUrl(vendorData.logo))
      } catch (err) { console.log(err) }
    }
    makeRequest()
  }, [section])

  // Load products
  const loadProducts = async () => {
    try {
      setLoading(true)
      const res = await api.get('/vendor/products')
      const prods = res.data.products || res.data.data || []
      setProducts(prods)
      setStats(s => ({ ...s, products: res.data.total || prods.length }))
    } catch (err) { console.log(err) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const run = async () => {
      if (section === 'products' || section === 'dashboard' || section === 'preview') {
        await loadProducts()
      }
    }
    run()
  }, [section])

  // Load orders
  useEffect(() => {
    const makeRequest = async () => {
      try {
        const res = await api.get('/orders/vendor/list')
        const ords = res.data.orders || res.data.data || []
        setOrders(ords)
        setStats(s => ({ ...s, orders: ords.length }))
      } catch (err) { console.log(err) }
    }
    if (section === 'orders' || section === 'dashboard') makeRequest()
  }, [section])

  // ── Handle image file selection ──
  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  // ── Upload image to backend and return URL ──
  const uploadImageFile = async (file) => {
    const formData = new FormData()
    formData.append('image', file)
    setUploadingImg(true)
    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data.url || ''
    } finally {
      setUploadingImg(false)
    }
  }

  // ── Product Form (Formik — same pattern as instructor's Formikk.jsx) ──
  const productFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: '', price: '', stock: '', category: '', description: '',
    },
    validationSchema: yup.object({
      name:  yup.string().required('Product name is required'),
      price: yup.number().required('Price is required').min(0),
      stock: yup.number().required('Stock is required').min(0),
    }),
    onSubmit: async (values, { setStatus, resetForm }) => {
      // Require image on new products
      if (!editId && !imageFile && !imagePreview) {
        setStatus('Please upload a product image before saving.')
        return
      }

      try {
        let imageUrl = imagePreview // existing URL when editing

        // Upload new file if selected
        if (imageFile) {
          imageUrl = await uploadImageFile(imageFile)
          if (!imageUrl) {
            setStatus('Image upload failed. Please try again.')
            return
          }
          imageUrl = resolveImgUrl(imageUrl)
        }

        const payload = {
          title: values.name,
          description: values.description || values.name,
          price: +values.price,
          stock: +values.stock,
          categories: values.category ? [values.category] : ['General'],
          images: imageUrl ? [imageUrl] : [],
        }
        if (editId) {
          await api.put(`/vendor/products/${editId}`, payload)
        } else {
          await api.post('/vendor/products', payload)
        }

        // ── Fix: always close modal & fully reset before reloading ──
        setShowModal(false)
        resetForm()
        setEditId(null)
        setImageFile(null)
        setImagePreview('')
        if (fileInputRef.current) fileInputRef.current.value = ''

        // Reload products list
        await loadProducts()
      } catch (err) {
        const msg = err.response?.data?.error
          || err.response?.data?.message
          || (err.response?.data?.errors && err.response?.data?.errors[0]?.msg)
          || 'Could not save product'
        setStatus(msg)
      }
    }
  })

  const openAddModal = () => {
    setEditId(null)
    productFormik.resetForm()
    setImageFile(null)
    setImagePreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    setShowModal(true)
  }

  const openEditModal = (p) => {
    setEditId(p._id)
    productFormik.setValues({
      name: p.title || p.name || '',
      price: p.price,
      stock: p.stock,
      category: Array.isArray(p.categories) ? p.categories[0] || '' : p.category || '',
      description: p.description || '',
    })
    // Show existing image
    const existingImg = p.images?.[0] ? resolveImgUrl(p.images[0]) : ''
    setImagePreview(existingImg)
    setImageFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setShowModal(true)
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/vendor/products/${deleteId}`)
      setProducts(prods => prods.filter(p => p._id !== deleteId))
      setShowDeleteModal(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete product')
    }
  }

  // ── Profile logo upload ──
  const handleProfileLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProfileLogoFile(file)
    setProfileLogoPreview(URL.createObjectURL(file))
  }

  // ── Save profile ──
  const handleSaveProfile = async () => {
    setProfileSaving(true)
    try {
      let logoUrl = profile?.logo || ''
      if (profileLogoFile) {
        const formData = new FormData()
        formData.append('image', profileLogoFile)
        const res = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        logoUrl = resolveImgUrl(res.data.url || '')
        setProfileLogoFile(null)
      }

      await api.put('/vendor/profile', {
        storeName: document.getElementById('storeName').value,
        storeDescription: document.getElementById('storeDesc').value,
        phone: document.getElementById('vendorPhone').value,
        businessAddress: document.getElementById('vendorAddress').value,
        logo: logoUrl,
      })
      // Refresh profile
      const res = await api.get('/vendor/profile')
      setProfile(res.data.vendor || res.data.data || res.data)
      triggerToast('Store profile updated successfully!')
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Update failed', 'danger')
    } finally {
      setProfileSaving(false)
    }
  }

  const status = profile?.verificationStatus || 'pending'
  const statusColors = {
    approved:  { bg: '#DCFCE7', color: '#166534' },
    pending:   { bg: '#FEF3C7', color: '#92400E' },
    rejected:  { bg: '#FEE2E2', color: '#991B1B' },
    suspended: { bg: '#FEE2E2', color: '#991B1B' },
  }

  return (
    <div className="dash-wrapper d-flex">

      {/* ── Toast Notification Banner ── */}
      {showToast && (
        <div
          className={`alert alert-${toastMsg.type} position-fixed top-0 start-50 translate-middle-x m-3 shadow d-flex align-items-center gap-2`}
          style={{ zIndex: 9999, minWidth: '280px', fontWeight: 600 }}
        >
          <i className={`bi bi-${toastMsg.type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'}`}></i>
          {toastMsg.text}
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className="dash-sidebar">
        <div style={{ padding: '20px', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '-.03em' }}>
            Omni<span style={{ color: '#10B981' }}>Mart</span>
          </div>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.07em',
            textTransform: 'uppercase', color: '#94A3B8', marginTop: '2px' }}>
            Vendor Portal
          </div>
        </div>

        <nav style={{ padding: '12px 0', flex: 1 }}>
          {[
            { id: 'dashboard', label: '▣  Dashboard' },
            { id: 'products',  label: '◫  Products'  },
            { id: 'orders',    label: '◈  Orders'    },
            { id: 'preview',   label: '🏪  View Store' },
            { id: 'profile',   label: '◎  Profile'   },
          ].map(item => (
            <a key={item.id} href="#"
              className={`dash-nav-link ${section === item.id ? 'active' : ''}`}
              onClick={e => { e.preventDefault(); setSection(item.id) }}>
              {item.label}
            </a>
          ))}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid #E2E8F0' }}>
          {profileLogoPreview ? (
            <img src={profileLogoPreview} alt="Store logo"
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover',
                border: '2px solid #E2E8F0', marginBottom: '8px' }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F1F5F9',
              border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '14px', marginBottom: '8px' }}>🏪</div>
          )}
          <div style={{ fontSize: '12.5px', fontWeight: 600 }}>
            {user.firstname} {user.lastname}
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8' }}>
            {profile?.storeName || 'My Store'}
          </div>
          <span style={{ ...statusColors[status], fontSize: '11px', fontWeight: 700,
            padding: '2px 8px', borderRadius: '3px', display: 'inline-block', marginTop: '6px' }}>
            {status}
          </span>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="dash-main flex-grow-1" style={{ background: '#F8F9FA' }}>

        {/* Topbar */}
        <div style={{ height: '60px', background: '#fff', borderBottom: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px' }}>
          <div style={{ fontWeight: 700, fontSize: '16px' }}>
            {{ dashboard:'Dashboard', products:'My Products', orders:'Orders', profile:'Profile', preview:'Store Preview' }[section]}
          </div>
          {section === 'products' && (
            <button className="btn btn-primary btn-sm" onClick={openAddModal}>+ Add Product</button>
          )}
        </div>

        <div style={{ padding: '28px' }}>

          {/* ── DASHBOARD ── */}
          {section === 'dashboard' && (
            <>
              <div className="row g-3 mb-4">
                {[
                  { label: 'Total Products', value: stats.products },
                  { label: 'Active Orders',  value: stats.orders   },
                  { label: 'Store Status',   value: status, accent: true },
                ].map(s => (
                  <div key={s.label} className="col-md-4">
                    <div className="stat-card">
                      <div className="stat-label">{s.label}</div>
                      <div className="stat-value">{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {status !== 'approved' && (
                <div className="alert" style={{
                  background: '#FEF3C7', border: '1px solid #FDE68A',
                  color: '#92400E', borderRadius: '4px', fontSize: '13px' }}>
                  <strong>Store Pending Review</strong> — Your store is awaiting admin approval.
                  You can add products now, but shoppers will only see them once approved.
                </div>
              )}

              <div className="card">
                <div className="card-header">Recent Products</div>
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead><tr>
                      <th>Product</th><th>Price</th><th>Stock</th>
                    </tr></thead>
                    <tbody>
                      {products.slice(0, 5).map(p => (
                        <tr key={p._id}>
                          <td style={{ fontSize: '13px', fontWeight: 500 }}>{p.title || p.name}</td>
                          <td style={{ fontWeight: 600, color: '#10B981' }}>{formatPrice(p.price)}</td>
                          <td style={{ fontSize: '12px', color: p.stock === 0 ? '#EF4444' : '#64748B' }}>
                            {p.stock === 0 ? 'Out of stock' : `${p.stock} units`}
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 && (
                        <tr><td colSpan={3} className="text-center py-4 text-muted" style={{ fontSize: '13px' }}>
                          No products yet.{' '}
                          <button className="btn btn-link btn-sm p-0" onClick={() => setSection('products')}>
                            Add your first →
                          </button>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── PRODUCTS ── */}
          {section === 'products' && (
            <div className="card">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead><tr>
                    <th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="text-center py-4 text-muted">Loading…</td></tr>
                    ) : products.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-5">
                        <div style={{ fontSize: '32px', opacity: .3 }}>📦</div>
                        <p style={{ fontSize: '14px', fontWeight: 600, marginTop: '8px' }}>No products yet</p>
                        <button className="btn btn-primary btn-sm" onClick={openAddModal}>+ Add First Product</button>
                      </td></tr>
                    ) : products.map(p => (
                      <tr key={p._id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {p.images?.[0]
                              ? <img src={resolveImgUrl(p.images[0])}
                                  style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: '4px', border: '1px solid #E2E8F0' }}
                                  alt={p.title} />
                              : <div style={{ width: 36, height: 36, background: '#F8F9FA', borderRadius: '4px',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>📦</div>
                            }
                            <span style={{ fontWeight: 500, fontSize: '13px' }}>{p.title || p.name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '12px', color: '#64748B' }}>
                          {Array.isArray(p.categories) && p.categories.length > 0 ? p.categories.join(', ') : (p.category || 'General')}
                        </td>
                        <td style={{ fontWeight: 600, color: '#10B981' }}>{formatPrice(p.price)}</td>
                        <td style={{ fontSize: '12px', color: p.stock === 0 ? '#EF4444' : '#64748B' }}>
                          {p.stock === 0 ? 'Out of stock' : `${p.stock} units`}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button className="btn btn-outline-dark btn-sm" onClick={() => openEditModal(p)}>Edit</button>
                            <button className="btn btn-sm"
                              style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: '4px' }}
                              onClick={() => { setDeleteId(p._id); setShowDeleteModal(true) }}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── STORE PREVIEW ── */}
          {section === 'preview' && (
            <>
              <div className="alert mb-4" style={{
                background: '#EFF6FF', border: '1px solid #BFDBFE',
                color: '#1D4ED8', borderRadius: '6px', fontSize: '13px', fontWeight: 500 }}>
                👁️ <strong>Store Preview</strong> — This is how your products appear to buyers. The "Add to Cart" button is hidden in this view.
              </div>
              {loading ? (
                <div className="row g-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="col-6 col-md-4 col-lg-3">
                      <div className="skeleton" style={{ height: '280px', borderRadius: '6px' }} />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-5">
                  <div style={{ fontSize: '48px', opacity: .25 }}>🏪</div>
                  <h4 style={{ fontSize: '16px', fontWeight: 600, marginTop: '12px' }}>No products yet</h4>
                  <p style={{ fontSize: '13px', color: '#64748B' }}>Add products to see how they look in your store.</p>
                  <button className="btn btn-primary btn-sm" onClick={() => setSection('products')}>+ Add Products</button>
                </div>
              ) : (
                <div className="row g-3">
                  {products.map(p => {
                    // Resolve image URLs for preview
                    const previewProduct = {
                      ...p,
                      images: (p.images || []).map(resolveImgUrl),
                    }
                    return (
                      <div key={p._id} className="col-6 col-md-4 col-lg-3">
                        <ProductCard product={previewProduct} isPreview={true} />
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* ── ORDERS ── */}
          {section === 'orders' && (
            <div className="card">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead><tr>
                    <th>Order ID</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th>
                  </tr></thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-5 text-muted" style={{ fontSize: '13px' }}>
                        No orders yet.
                      </td></tr>
                    ) : orders.map(o => (
                      <tr key={o._id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#94A3B8' }}>
                          #{o._id.slice(-8).toUpperCase()}
                        </td>
                        <td style={{ fontSize: '13px' }}>
                          {o.customer?.firstname || o.user?.firstname || 'Customer'}{' '}
                          {o.customer?.lastname || o.user?.lastname || ''}
                        </td>
                        <td style={{ fontSize: '12px', color: '#64748B' }}>
                          {new Date(o.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ fontWeight: 600, color: '#10B981' }}>
                          {formatPrice(o.totalAmount || o.totalPrice || 0)}
                        </td>
                        <td>
                          <span style={{ ...statusColors[o.status] || { bg: '#F1F5F9', color: '#64748B' },
                            fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '3px' }}>
                            {o.status || 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PROFILE ── */}
          {section === 'profile' && profile && (
            <div className="row g-4">
              {/* Store Logo */}
              <div className="col-md-4">
                <div className="card h-100">
                  <div className="card-header">Store Logo</div>
                  <div className="card-body p-4 text-center">
                    <div style={{ width: 100, height: 100, borderRadius: '50%', margin: '0 auto 16px',
                      overflow: 'hidden', border: '3px solid #E2E8F0', background: '#F8FAFC',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
                      {profileLogoPreview
                        ? <img src={profileLogoPreview} alt="Logo"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : '🏪'}
                    </div>
                    <button className="btn btn-outline-dark btn-sm"
                      onClick={() => profileLogoInputRef.current?.click()}>
                      {profileLogoFile ? '📷 Change Photo' : '📷 Upload Logo'}
                    </button>
                    <input
                      ref={profileLogoInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleProfileLogoChange}
                    />
                    {profileLogoFile && (
                      <p style={{ fontSize: '11px', color: '#10B981', marginTop: '8px', marginBottom: 0 }}>
                        ✓ {profileLogoFile.name}
                      </p>
                    )}
                    {/* Store Status */}
                    <div className="mt-4">
                      <span style={{ ...statusColors[status], fontSize: '13px', fontWeight: 700,
                        padding: '5px 14px', borderRadius: '4px', display: 'inline-block' }}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                      <p style={{ fontSize: '12px', color: '#64748B', marginTop: '8px', marginBottom: 0 }}>
                        {status === 'approved' ? 'Your store is live and visible to shoppers.' :
                         status === 'pending'  ? 'Awaiting admin review. Usually 24-48 hrs.' :
                         'Contact support for more information.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Details */}
              <div className="col-md-8">
                <div className="card">
                  <div className="card-header">Store Details</div>
                  <div className="card-body p-4">
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label" style={{ fontSize: '11px', fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B' }}>Store Name</label>
                        <input className="form-control" defaultValue={profile.storeName} id="storeName" />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" style={{ fontSize: '11px', fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B' }}>Phone Number</label>
                        <input className="form-control" defaultValue={profile.phone || ''} id="vendorPhone" placeholder="+1 (555) 000-0000" />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" style={{ fontSize: '11px', fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B' }}>Business Address</label>
                        <input className="form-control" defaultValue={profile.businessAddress || ''} id="vendorAddress" placeholder="Street, City, Country" />
                      </div>
                      <div className="col-12">
                        <label className="form-label" style={{ fontSize: '11px', fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B' }}>Store Description</label>
                        <textarea className="form-control" rows={3}
                          defaultValue={profile.description || profile.storeDescription || ''} id="storeDesc" />
                      </div>
                    </div>
                    <button className="btn btn-primary mt-3" onClick={handleSaveProfile} disabled={profileSaving}>
                      {profileSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Add/Edit Product Modal ── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton style={{ borderBottom: '1px solid #E2E8F0' }}>
          <Modal.Title style={{ fontSize: '16px', fontWeight: 700 }}>
            {editId ? 'Edit Product' : 'Add New Product'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {productFormik.status && (
            <div className="alert" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5',
              color: '#991B1B', borderRadius: '4px', fontSize: '13px' }}>
              {productFormik.status}
            </div>
          )}
          <form onSubmit={productFormik.handleSubmit}>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label" style={{ fontSize: '11px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B' }}>
                  Product Name *
                </label>
                <input name="name"
                  className={`form-control ${productFormik.touched.name && productFormik.errors.name ? 'is-invalid' : ''}`}
                  placeholder="e.g. Leather Weekend Bag" {...productFormik.getFieldProps('name')} />
                <div className="invalid-feedback">{productFormik.errors.name}</div>
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontSize: '11px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B' }}>
                  Price (USD) *
                </label>
                <input name="price" type="number" step="0.01" min="0"
                  className={`form-control ${productFormik.touched.price && productFormik.errors.price ? 'is-invalid' : ''}`}
                  placeholder="0.00" {...productFormik.getFieldProps('price')} />
                <div className="invalid-feedback">{productFormik.errors.price}</div>
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontSize: '11px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B' }}>
                  Stock *
                </label>
                <input name="stock" type="number" min="0"
                  className={`form-control ${productFormik.touched.stock && productFormik.errors.stock ? 'is-invalid' : ''}`}
                  placeholder="0" {...productFormik.getFieldProps('stock')} />
                <div className="invalid-feedback">{productFormik.errors.stock}</div>
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontSize: '11px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B' }}>
                  Category
                </label>
                <input name="category" className="form-control" placeholder="e.g. Apparel"
                  {...productFormik.getFieldProps('category')} />
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontSize: '11px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B' }}>
                  Product Image {!editId && <span style={{ color: '#EF4444' }}>*</span>}
                </label>
                {/* File picker — replaces URL input */}
                <div style={{ border: '2px dashed #E2E8F0', borderRadius: '6px', padding: '12px',
                  textAlign: 'center', cursor: 'pointer', background: '#F8FAFC' }}
                  onClick={() => fileInputRef.current?.click()}>
                  {imagePreview ? (
                    <div>
                      <img src={imagePreview} alt="Preview"
                        style={{ maxHeight: '90px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                      <p style={{ fontSize: '11px', color: '#64748B', marginTop: '6px', marginBottom: 0 }}>
                        Click to change image
                      </p>
                    </div>
                  ) : (
                    <div style={{ color: '#94A3B8', fontSize: '13px' }}>
                      <div style={{ fontSize: '28px', marginBottom: '4px' }}>📷</div>
                      Click to upload image
                      <div style={{ fontSize: '11px', marginTop: '2px' }}>JPG, PNG, WEBP — max 5MB</div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
                {uploadingImg && (
                  <p style={{ fontSize: '11px', color: '#10B981', marginTop: '4px' }}>Uploading…</p>
                )}
                {imageFile && !uploadingImg && (
                  <p style={{ fontSize: '11px', color: '#10B981', marginTop: '4px' }}>
                    ✓ {imageFile.name}
                  </p>
                )}
              </div>
              <div className="col-12">
                <label className="form-label" style={{ fontSize: '11px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B' }}>
                  Description
                </label>
                <textarea name="description" className="form-control" rows={3}
                  {...productFormik.getFieldProps('description')} />
              </div>
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #E2E8F0' }}>
          <button className="btn btn-outline-dark" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={productFormik.handleSubmit}
            disabled={productFormik.isSubmitting || uploadingImg}>
            {productFormik.isSubmitting ? 'Saving…' : uploadingImg ? 'Uploading image…' : 'Save Product'}
          </button>
        </Modal.Footer>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered size="sm">
        <Modal.Header closeButton><Modal.Title style={{ fontSize: '15px' }}>Delete Product</Modal.Title></Modal.Header>
        <Modal.Body style={{ fontSize: '13.5px' }}>Are you sure? This cannot be undone.</Modal.Body>
        <Modal.Footer>
          <button className="btn btn-outline-dark btn-sm" onClick={() => setShowDeleteModal(false)}>Cancel</button>
          <button className="btn btn-sm"
            style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: '4px' }}
            onClick={handleDelete}>Delete</button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default VendorDashboard
