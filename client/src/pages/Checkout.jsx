// Checkout.jsx — Multi-Vendor Paystack Gateway Checkout Flow
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useFormik } from 'formik'
import * as yup from 'yup'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function Checkout({ cart: propCart, user: propUser, totalAmount: propTotalAmount }) {
  const { user: authUser } = useAuth()
  const effectiveUser = propUser || authUser || JSON.parse(localStorage.getItem('user') || '{}')

  const [cartItems, setCartItems] = useState(propCart || [])
  const [loadingCart, setLoadingCart] = useState(!propCart)
  const [loading, setLoading] = useState(false)
  const [shippingOption, setShippingOption] = useState('standard') // standard | expedited
  const [orderComplete, setOrderComplete] = useState(null)

  const formatPrice = (n) =>
    `₦${Number(n || 0).toLocaleString('en-NG')}`

  // ── Load cart on mount if not passed as prop ──
  useEffect(() => {
    if (propCart && propCart.length > 0) {
      setCartItems(propCart)
      setLoadingCart(false)
      return
    }

    const fetchCart = async () => {
      try {
        setLoadingCart(true)
        const res = await api.get('/cart')
        const items = res.data.cart?.items || res.data.data?.items || []
        setCartItems(items)
      } catch (err) {
        console.warn('Error loading backend cart, reading local cart:', err.message)
        const local = JSON.parse(localStorage.getItem('cartItems') || '[]')
        setCartItems(local)
      } finally {
        setLoadingCart(false)
      }
    }
    fetchCart()
  }, [propCart])

  // ── Pricing calculations ──
  const effectiveCart = propCart || cartItems
  const itemsSubtotal = effectiveCart.reduce(
    (sum, i) => sum + (i.product?.price || i.price || 0) * (i.quantity || 1),
    0
  )
  const shippingFee = shippingOption === 'expedited' ? 2500 : 0
  const estimatedTax = itemsSubtotal * 0.075 // Standard 7.5% Nigerian VAT
  const grandTotal = itemsSubtotal + shippingFee + estimatedTax

  const effectiveTotal = propTotalAmount !== undefined ? propTotalAmount : grandTotal

  // ── Paystack Checkout Action (Core Requirement) ──
  const handleCheckout = async (formAddress = null) => {
    setLoading(true)
    try {
      const activeUser = effectiveUser
      if (!activeUser || (!activeUser.email && !activeUser._id && !activeUser.id)) {
        alert('Please sign in to proceed with secure Paystack checkout.')
        setLoading(false)
        return
      }

      // Format items ensuring _id, price, and vendorId are strictly provided
      const formattedItems = (effectiveCart || []).map((item) => {
        const prod = item.product || item
        const resolvedVendorId =
          item.vendorId ||
          prod.vendorId ||
          prod.vendor?._id ||
          prod.vendor ||
          prod.user ||
          activeUser.id ||
          activeUser._id

        return {
          _id: prod._id || item._id || item.productId,
          price: Number(prod.price || item.price || 0),
          quantity: Number(item.quantity || 1),
          title: prod.title || prod.name || item.title || '',
          vendorId: resolvedVendorId,
        }
      })

      const payload = {
        email: formAddress?.email || activeUser.email,
        userId: activeUser.id || activeUser._id,
        amount: effectiveTotal,
        cartItems: formattedItems,
        callback_url: `${window.location.origin}/checkout/success`,
      }

      let data = null
      try {
        // Prioritize configured API client with full baseURL & credential headers
        const res = await api.post('/checkout/initialize', payload)
        data = res.data
      } catch (apiErr) {
        console.warn('API client post error, trying direct fetch:', apiErr.response?.data || apiErr.message)
        try {
          const response = await fetch('/api/checkout/initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          if (response.ok) {
            data = await response.json()
          } else {
            const errData = await response.json().catch(() => null)
            throw new Error(errData?.error || errData?.message || apiErr.response?.data?.error || apiErr.response?.data?.message || apiErr.message)
          }
        } catch (fetchErr) {
          throw new Error(apiErr.response?.data?.error || apiErr.response?.data?.message || fetchErr.message || 'Payment initialization failed')
        }
      }

      if (data && data.authorization_url) {
        // Safe redirect to Paystack payment gateway page
        window.location.href = data.authorization_url
      } else {
        alert(data?.error || data?.message || 'Could not initialize transaction session.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Checkout error:', err)
      alert(err.message || 'Could not initialize transaction session. Please try again.')
      setLoading(false)
    }
  }

  // If component is mounted strictly with prop parameters, render standalone presentation wrapper
  if (propCart && propUser && propTotalAmount !== undefined) {
    return (
      <div className="p-6 bg-white rounded shadow-md max-w-md mx-auto mt-10 text-center" style={{ maxWidth: '480px', margin: '40px auto', padding: '24px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h2 className="text-xl font-bold mb-4" style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: '#0F172A' }}>
          Secure Gateway Checkout
        </h2>
        <p className="text-gray-600 mb-6" style={{ color: '#475569', marginBottom: '24px', fontSize: '15px' }}>
          Total Payable: <b>₦{Number(propTotalAmount).toLocaleString('en-NG')}</b>
        </p>
        <button
          onClick={() => handleCheckout()}
          disabled={loading}
          className="w-full py-3 bg-green-600 text-white font-semibold rounded hover:bg-green-700 disabled:opacity-50 transition-all btn btn-success"
          style={{ width: '100%', padding: '12px', background: '#16a34a', color: '#fff', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer' }}
        >
          {loading ? 'Opening Secure Portal...' : 'Pay with Paystack'}
        </button>
      </div>
    )
  }

  // ── Formik Checkout Form for Full Flow ──
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      fullname: effectiveUser ? `${effectiveUser.firstname || ''} ${effectiveUser.lastname || ''}`.trim() : '',
      email: effectiveUser?.email || '',
      phone: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Nigeria',
      paymentMethod: 'paystack', // paystack | opay | cod
    },
    validationSchema: yup.object({
      fullname: yup.string().required('Please enter your full name'),
      email: yup.string().email('Enter a valid email address').required('Email is required'),
      phone: yup.string().required('Please enter a valid phone number for delivery updates').min(7, 'Phone number is too short'),
      street: yup.string().required('Please enter your street address'),
      city: yup.string().required('Please enter your city'),
      state: yup.string().required('Please enter your state/province'),
      postalCode: yup.string().optional(),
      country: yup.string().required('Country is required'),
      paymentMethod: yup.string().required(),
    }),
    onSubmit: async (values) => {
      if (effectiveCart.length === 0) {
        formik.setStatus('Your shopping cart is empty.')
        return
      }

      if (values.paymentMethod === 'paystack') {
        await handleCheckout(values)
        return
      }

      // Fallback for Cash on Delivery or OPay
      try {
        const payload = {
          shippingAddress: {
            street: values.street,
            city: values.city,
            state: values.state,
            postalCode: values.postalCode || '100001',
            country: values.country,
            phone: values.phone,
          },
          paymentMethod: values.paymentMethod === 'opay' ? 'OPay' : 'Cash on Delivery',
          shippingOption,
        }

        const res = await api.post('/orders', payload)
        const newOrder = res.data.order || res.data.data

        localStorage.setItem('cartCount', '0')
        setOrderComplete(newOrder)
      } catch (err) {
        const errorMsg =
          err.response?.data?.error ||
          err.response?.data?.message ||
          'Could not process order. Please try again.'
        formik.setStatus(errorMsg)
      }
    },
  })

  // ── Order Confirmation View (For Non-Redirect Flow) ──
  if (orderComplete) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card shadow-sm border-0 p-4 p-md-5 mx-auto" style={{ maxWidth: '500px', borderRadius: '12px' }}>
          <div className="text-success mb-3" style={{ fontSize: '56px' }}>✓</div>
          <h2 className="fw-bold mb-2">Order Confirmed!</h2>
          <p className="text-muted mb-4" style={{ fontSize: '14px' }}>
            Thank you for shopping on OmniMart. Your order has been placed with verified vendors.
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <Link to="/shop" className="btn btn-dark px-4 py-2">Continue Shopping</Link>
            <Link to="/profile" className="btn btn-outline-secondary px-4 py-2">View Orders</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '32px 0 64px' }}>
      <div className="container" style={{ maxWidth: '1100px' }}>
        {/* Navigation Breadcrumb */}
        <div className="mb-4">
          <Link to="/shop" style={{ textDecoration: 'none', color: '#64748B', fontSize: '13px', fontWeight: 600 }}>
            ← Return to Marketplace
          </Link>
        </div>

        <div className="row g-4">
          {/* ── Left Column: Linear Checkout Steps ── */}
          <div className="col-lg-8">
            <form onSubmit={formik.handleSubmit}>
              {formik.status && (
                <div className="alert alert-danger py-2.5 px-3 mb-4 rounded-3" style={{ fontSize: '13px' }}>
                  {formik.status}
                </div>
              )}

              {/* SECTION 1: SHIPPING ADDRESS */}
              <div className="card shadow-sm border-0 mb-4 bg-white" style={{ borderRadius: '12px' }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <span className="badge rounded-circle bg-dark" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>1</span>
                    <h5 className="mb-0 fw-bold" style={{ fontSize: '16px' }}>Delivery Address</h5>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>Full Name *</label>
                      <input
                        type="text"
                        name="fullname"
                        placeholder="John Doe"
                        value={formik.values.fullname}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`form-control ${formik.touched.fullname && formik.errors.fullname ? 'is-invalid' : ''}`}
                      />
                      {formik.touched.fullname && formik.errors.fullname && (
                        <div className="invalid-feedback">{formik.errors.fullname}</div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`form-control ${formik.touched.email && formik.errors.email ? 'is-invalid' : ''}`}
                      />
                      {formik.touched.email && formik.errors.email && (
                        <div className="invalid-feedback">{formik.errors.email}</div>
                      )}
                    </div>

                    <div className="col-12">
                      <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>Street Address *</label>
                      <input
                        type="text"
                        name="street"
                        placeholder="e.g., 24 Adeola Odeku St, Victoria Island"
                        value={formik.values.street}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`form-control ${formik.touched.street && formik.errors.street ? 'is-invalid' : ''}`}
                      />
                      {formik.touched.street && formik.errors.street && (
                        <div className="invalid-feedback">{formik.errors.street}</div>
                      )}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>City *</label>
                      <input
                        type="text"
                        name="city"
                        placeholder="e.g., Ikeja"
                        value={formik.values.city}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`form-control ${formik.touched.city && formik.errors.city ? 'is-invalid' : ''}`}
                      />
                      {formik.touched.city && formik.errors.city && (
                        <div className="invalid-feedback">{formik.errors.city}</div>
                      )}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>State / Region *</label>
                      <input
                        type="text"
                        name="state"
                        placeholder="e.g., Lagos, Abuja, Rivers"
                        value={formik.values.state}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`form-control ${formik.touched.state && formik.errors.state ? 'is-invalid' : ''}`}
                      />
                      {formik.touched.state && formik.errors.state && (
                        <div className="invalid-feedback">{formik.errors.state}</div>
                      )}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>Postal Code (Optional)</label>
                      <input
                        type="text"
                        name="postalCode"
                        placeholder="e.g., 100001 (Optional)"
                        value={formik.values.postalCode}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`form-control ${formik.touched.postalCode && formik.errors.postalCode ? 'is-invalid' : ''}`}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>Country *</label>
                      <input
                        type="text"
                        name="country"
                        value={formik.values.country}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="form-control"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>Phone Number (For Delivery Updates) *</label>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="e.g., 0803 123 4567"
                        value={formik.values.phone}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`form-control ${formik.touched.phone && formik.errors.phone ? 'is-invalid' : ''}`}
                      />
                      {formik.touched.phone && formik.errors.phone && (
                        <div className="invalid-feedback">{formik.errors.phone}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PAYMENT METHOD (PAYSTACK MULTI-VENDOR CORE) */}
              <div className="card shadow-sm border-0 mb-4 bg-white" style={{ borderRadius: '12px' }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <span className="badge rounded-circle bg-dark" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>2</span>
                    <h5 className="mb-0 fw-bold" style={{ fontSize: '16px' }}>Payment Method</h5>
                  </div>

                  <div className="d-flex flex-column gap-2 mb-3">
                    {[
                      {
                        id: 'paystack',
                        label: 'Pay with Paystack (Debit/Credit Card, Bank Transfer, USSD)',
                        badge: 'PAYSTACK TEST MODE',
                        badgeColor: '#00C26D',
                      },
                      {
                        id: 'opay',
                        label: 'Pay with OPay (Bank Transfer / Wallet)',
                        badge: 'OPay',
                        badgeColor: '#00C26D',
                      },
                      {
                        id: 'cod',
                        label: '💵 Cash on Delivery',
                        badge: null,
                      },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className="d-flex align-items-center gap-3 p-3 border rounded"
                        style={{
                          cursor: 'pointer',
                          background: formik.values.paymentMethod === opt.id ? '#F0FDF4' : '#fff',
                          borderColor: formik.values.paymentMethod === opt.id ? '#00C26D' : '#E2E8F0',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={opt.id}
                          checked={formik.values.paymentMethod === opt.id}
                          onChange={formik.handleChange}
                        />
                        <span style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {opt.badge && (
                            <span
                              style={{
                                background: opt.badgeColor,
                                color: '#ffffff',
                                fontWeight: 800,
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                letterSpacing: '0.05em',
                              }}
                            >
                              {opt.badge}
                            </span>
                          )}
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Paystack Interactive Panel */}
                  {formik.values.paymentMethod === 'paystack' && (
                    <div className="p-3 rounded border mb-3 text-start" style={{ background: '#F0FDF4', borderColor: '#86EFAC', borderLeft: '4px solid #00C26D' }}>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ background: '#00C26D', color: '#fff', fontWeight: 900, fontSize: '12px', padding: '2px 8px', borderRadius: '4px' }}>
                            PAYSTACK
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#065F46' }}>
                            Official Multi-Vendor Payment Gateway
                          </span>
                        </div>
                        <span className="badge bg-success" style={{ fontSize: '11px' }}>Active</span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#166534', marginBottom: '12px', lineHeight: 1.5 }}>
                        Clicking <strong>&ldquo;Pay with Paystack&rdquo;</strong> will redirect you to Paystack&apos;s PCI-DSS certified gateway. Once paid, vendor balances and order metrics update instantly.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCheckout(formik.values)}
                        disabled={loading || effectiveTotal <= 0}
                        className="btn btn-success w-100 py-2.5 fw-bold text-white shadow-sm"
                        style={{ background: '#00C26D', borderColor: '#00C26D', borderRadius: '8px' }}
                      >
                        {loading ? 'Opening Secure Portal...' : `Pay ₦${effectiveTotal.toLocaleString('en-NG')} with Paystack`}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: ORDER ITEMS & DELIVERY SPEED */}
              <div className="card shadow-sm border-0 mb-4 bg-white" style={{ borderRadius: '12px' }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <span className="badge rounded-circle bg-dark" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>3</span>
                    <h5 className="mb-0 fw-bold" style={{ fontSize: '16px' }}>Review Items & Delivery Speed</h5>
                  </div>

                  <div className="p-3 mb-4 rounded border" style={{ background: '#F8FAFC' }}>
                    <div className="fw-semibold mb-2" style={{ fontSize: '13px' }}>Choose a delivery option:</div>
                    <div className="d-flex flex-column gap-2">
                      <label className="d-flex justify-content-between align-items-center p-2 border rounded bg-white" style={{ cursor: 'pointer' }}>
                        <div className="d-flex align-items-center gap-2">
                          <input
                            type="radio"
                            name="shippingSpeed"
                            value="standard"
                            checked={shippingOption === 'standard'}
                            onChange={() => setShippingOption('standard')}
                          />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600 }}>Standard Delivery (3-5 Days)</div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>Direct vendor dispatch</div>
                          </div>
                        </div>
                        <strong style={{ color: '#10B981', fontSize: '13px' }}>FREE</strong>
                      </label>

                      <label className="d-flex justify-content-between align-items-center p-2 border rounded bg-white" style={{ cursor: 'pointer' }}>
                        <div className="d-flex align-items-center gap-2">
                          <input
                            type="radio"
                            name="shippingSpeed"
                            value="expedited"
                            checked={shippingOption === 'expedited'}
                            onChange={() => setShippingOption('expedited')}
                          />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600 }}>⚡ Expedited Priority (1-2 Days)</div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>Priority courier handling</div>
                          </div>
                        </div>
                        <strong style={{ fontSize: '13px' }}>₦2,500</strong>
                      </label>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="d-flex flex-column gap-3">
                    {effectiveCart.map((item, idx) => {
                      const prod = item.product || item
                      return (
                        <div key={idx} className="d-flex gap-3 align-items-center pb-3 border-bottom">
                          {prod.images?.[0] ? (
                            <img src={prod.images[0]} alt={prod.title || prod.name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: '6px', border: '1px solid #E2E8F0' }} />
                          ) : (
                            <div style={{ width: 56, height: 56, background: '#F8FAFC', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📦</div>
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>
                              {prod.title || prod.name || 'Product Item'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748B' }}>
                              Qty: {item.quantity || 1}
                            </div>
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#10B981' }}>
                            {formatPrice((prod.price || item.price || 0) * (item.quantity || 1))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* ── Right Column: Order Summary Buy Box ── */}
          <div className="col-lg-4">
            <div className="card shadow-sm border-0 bg-white sticky-top" style={{ top: '80px', borderRadius: '12px' }}>
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3" style={{ fontSize: '16px' }}>Order Summary</h5>

                <div className="d-flex justify-content-between mb-2" style={{ fontSize: '13px' }}>
                  <span className="text-muted">Items Subtotal:</span>
                  <span>{formatPrice(itemsSubtotal)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2" style={{ fontSize: '13px' }}>
                  <span className="text-muted">Shipping:</span>
                  <span>{shippingFee === 0 ? <strong className="text-success">FREE</strong> : formatPrice(shippingFee)}</span>
                </div>
                <div className="d-flex justify-content-between mb-3" style={{ fontSize: '13px' }}>
                  <span className="text-muted">Estimated VAT (7.5%):</span>
                  <span>{formatPrice(estimatedTax)}</span>
                </div>

                <hr className="my-3" />

                <div className="d-flex justify-content-between mb-4">
                  <span className="fw-bold" style={{ fontSize: '16px' }}>Total Payable:</span>
                  <span className="fw-bold text-success" style={{ fontSize: '18px' }}>
                    {formatPrice(effectiveTotal)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCheckout(formik.values)}
                  disabled={loading || effectiveTotal <= 0}
                  className="btn btn-success w-full py-3 fw-bold rounded-3 shadow-sm text-white"
                  style={{ width: '100%', background: '#00C26D', borderColor: '#00C26D', fontSize: '15px' }}
                >
                  {loading ? 'Opening Secure Portal...' : 'Pay with Paystack'}
                </button>

                <p className="text-muted text-center mt-3 mb-0" style={{ fontSize: '11px', lineHeight: 1.4 }}>
                  🔒 Secure Paystack Multi-Vendor Gateway · Verified Settlements
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
