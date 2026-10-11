// Checkout.jsx — Amazon-style single-page distraction-free checkout flow
// Formik + Yup inline field errors, 3 linear sections, right-side buy box
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useFormik } from 'formik'
import * as yup from 'yup'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const Checkout = () => {
  const { user } = useAuth()


  const [cartItems, setCartItems]     = useState([])
  const [loadingCart, setLoadingCart] = useState(true)
  const [shippingOption, setShippingOption] = useState('standard') // standard | expedited
  const [orderComplete, setOrderComplete]   = useState(null)

  const formatPrice = (n) =>
    `₦${Number(n || 0).toLocaleString('en-NG')}`

  // ── Load cart on mount ──
  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoadingCart(true)
        const res = await api.get('/cart')
        const items = res.data.cart?.items || res.data.data?.items || []
        setCartItems(items)
      } catch (err) {
        console.log(err)
      } finally {
        setLoadingCart(false)
      }
    }
    fetchCart()
  }, [])

  // ── Pricing calculations ──
  const itemsSubtotal = cartItems.reduce(
    (sum, i) => sum + (i.product?.price || i.price || 0) * i.quantity,
    0
  )
  const shippingFee = shippingOption === 'expedited' ? 2500 : 0
  const estimatedTax = itemsSubtotal * 0.075 // Standard 7.5% Nigerian VAT
  const grandTotal   = itemsSubtotal + shippingFee + estimatedTax

  // ── Formik Checkout Form ──
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      fullname: user ? `${user.firstname || ''} ${user.lastname || ''}`.trim() : '',
      email: user?.email || '',
      phone: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States',
      paymentMethod: 'card', // card | paypal | cod
      cardNumber: '',
      cardExp: '',
      cardCvc: '',
    },
    validationSchema: yup.object({
      fullname: yup.string().required('Please enter your full name'),
      email: yup.string().email('Enter a valid email address').required('Email is required'),
      phone: yup.string().required('Please enter a valid phone number for delivery updates').min(7, 'Phone number is too short'),
      street: yup.string().required('Please enter your street address'),
      city: yup.string().required('Please enter your city'),
      state: yup.string().required('Please enter your state/province'),
      postalCode: yup.string().required('Please enter your ZIP / Postal code'),
      country: yup.string().required('Country is required'),
      paymentMethod: yup.string().required(),
      cardNumber: yup.string().when('paymentMethod', {
        is: 'card',
        then: (s) => s.required('Card number is required').matches(/^\d{13,19}$/, 'Card number must be 13-19 digits'),
      }),
      cardExp: yup.string().when('paymentMethod', {
        is: 'card',
        then: (s) => s.required('Expiry date is required').matches(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, 'Use MM/YY format'),
      }),
      cardCvc: yup.string().when('paymentMethod', {
        is: 'card',
        then: (s) => s.required('CVC is required').matches(/^\d{3,4}$/, '3 or 4 digits'),
      }),
    }),
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      try {
        if (cartItems.length === 0) {
          setStatus('Your shopping cart is empty.')
          return
        }

        const payload = {
          shippingAddress: {
            street: values.street,
            city: values.city,
            state: values.state,
            postalCode: values.postalCode,
            country: values.country,
            phone: values.phone,
          },
          paymentMethod: values.paymentMethod === 'card' ? 'Credit Card' : values.paymentMethod === 'paypal' ? 'PayPal' : 'Cash on Delivery',
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
        setStatus(errorMsg)
      } finally {
        setSubmitting(false)
      }
    },
  })

  // ── Render Order Confirmation Screen ──
  if (orderComplete) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F9FA', padding: '40px 16px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div className="card shadow-sm border-0 p-5 text-center bg-white" style={{ borderRadius: '8px' }}>
            <div style={{ fontSize: '54px', color: '#10B981', marginBottom: '16px' }}>✅</div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-.03em', color: '#0F172A' }}>
              Order Placed, Thank You!
            </h2>
            <p className="text-muted mt-2" style={{ fontSize: '14px' }}>
              We sent a confirmation email to <strong className="text-dark">{formik.values.email}</strong>.
            </p>

            <div className="p-3 my-4 text-start" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
              <div className="d-flex justify-content-between mb-2" style={{ fontSize: '13px' }}>
                <span className="text-muted">Order ID:</span>
                <strong style={{ fontFamily: 'monospace' }}>{orderComplete._id}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2" style={{ fontSize: '13px' }}>
                <span className="text-muted">Delivery Address:</span>
                <span>{formik.values.street}, {formik.values.city}</span>
              </div>
              <div className="d-flex justify-content-between mb-0" style={{ fontSize: '13px' }}>
                <span className="text-muted">Total Paid:</span>
                <strong style={{ color: '#10B981' }}>{formatPrice(grandTotal)}</strong>
              </div>
            </div>

            <div className="d-flex gap-3 justify-content-center mt-2">
              <Link to="/" className="btn btn-primary px-4">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Vendor Barrier Check ──
  if (user && user.role === 'vendor') {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F9FA', padding: '60px 16px' }}>
        <div className="text-center p-5 bg-white shadow-sm" style={{ maxWidth: '480px', margin: '0 auto', borderRadius: '8px' }}>
          <div style={{ fontSize: '48px' }}>🏪</div>
          <h4 style={{ fontSize: '18px', fontWeight: 700, marginTop: '16px' }}>Shopping Restricted</h4>
          <p className="text-muted" style={{ fontSize: '13px' }}>
            Vendor profiles are restricted to store management only. Please create a separate Buyer/Customer account to purchase items!
          </p>
          <Link to="/vendor" className="btn btn-dark mt-3 px-4">
            Go to Vendor Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // ── Render Empty Cart State ──
  if (!loadingCart && cartItems.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F9FA', padding: '60px 16px' }}>
        <div className="text-center p-5 bg-white shadow-sm" style={{ maxWidth: '480px', margin: '0 auto', borderRadius: '8px' }}>
          <div style={{ fontSize: '48px', opacity: 0.3 }}>🛒</div>
          <h4 style={{ fontSize: '18px', fontWeight: 700, marginTop: '16px' }}>Your Cart is Empty</h4>
          <p className="text-muted" style={{ fontSize: '13px' }}>Add items to your cart before proceeding to checkout.</p>
          <Link to="/" className="btn btn-primary mt-3 px-4">
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#EAEDED', padding: '24px 16px 60px 16px' }}>
      <div style={{ maxWidth: '1150px', margin: '0 auto' }}>

        {/* Top distraction-free notice */}
        <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', letterSpacing: '-.03em' }}>
            Checkout ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
          </h1>
          <Link to="/" style={{ fontSize: '13px', color: '#0F172A', textDecoration: 'none', fontWeight: 600 }}>
            ‹ Back to Cart / Shop
          </Link>
        </div>

        {formik.status && (
          <div className="alert alert-danger shadow-sm mb-4" style={{ borderRadius: '6px' }}>
            {formik.status}
          </div>
        )}

        <form onSubmit={formik.handleSubmit}>
          <div className="row g-4">

            {/* ── Left Column: 3 Sequential Linear Checkout Sections ── */}
            <div className="col-lg-8">

              {/* SECTION 1: SHIPPING ADDRESS */}
              <div className="card shadow-sm border-0 mb-4 bg-white" style={{ borderRadius: '8px' }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <span className="badge rounded-circle bg-dark" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>1</span>
                    <h5 className="mb-0 fw-bold" style={{ fontSize: '16px' }}>Shipping Address</h5>
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
                        placeholder="123 Main St, Apt 4B"
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
                        placeholder="New York"
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
                      <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>State / Province *</label>
                      <input
                        type="text"
                        name="state"
                        placeholder="NY"
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
                      <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>ZIP / Postal Code *</label>
                      <input
                        type="text"
                        name="postalCode"
                        placeholder="10001"
                        value={formik.values.postalCode}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`form-control ${formik.touched.postalCode && formik.errors.postalCode ? 'is-invalid' : ''}`}
                      />
                      {formik.touched.postalCode && formik.errors.postalCode && (
                        <div className="invalid-feedback">{formik.errors.postalCode}</div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>Country *</label>
                      <input
                        type="text"
                        name="country"
                        value={formik.values.country}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`form-control ${formik.touched.country && formik.errors.country ? 'is-invalid' : ''}`}
                      />
                      {formik.touched.country && formik.errors.country && (
                        <div className="invalid-feedback">{formik.errors.country}</div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>Phone Number (For Delivery Updates) *</label>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="+1 (555) 000-0000"
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

              {/* SECTION 2: PAYMENT METHOD */}
              <div className="card shadow-sm border-0 mb-4 bg-white" style={{ borderRadius: '8px' }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <span className="badge rounded-circle bg-dark" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>2</span>
                    <h5 className="mb-0 fw-bold" style={{ fontSize: '16px' }}>Payment Method</h5>
                  </div>

                  <div className="d-flex flex-column gap-2 mb-3">
                    {[
                      { id: 'card', label: '💳 Credit or Debit Card' },
                      { id: 'paypal', label: '🅿️ PayPal' },
                      { id: 'cod', label: '💵 Cash on Delivery' },
                    ].map((opt) => (
                      <label key={opt.id} className="d-flex align-items-center gap-3 p-3 border rounded" style={{ cursor: 'pointer', background: formik.values.paymentMethod === opt.id ? '#F8FAFC' : '#fff', borderColor: formik.values.paymentMethod === opt.id ? '#0F172A' : '#E2E8F0' }}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={opt.id}
                          checked={formik.values.paymentMethod === opt.id}
                          onChange={formik.handleChange}
                        />
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{opt.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Card input fields */}
                  {formik.values.paymentMethod === 'card' && (
                    <div className="p-3 bg-light rounded border">
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>Card Number *</label>
                          <input
                            type="text"
                            name="cardNumber"
                            placeholder="4532 0000 0000 0000"
                            value={formik.values.cardNumber}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className={`form-control ${formik.touched.cardNumber && formik.errors.cardNumber ? 'is-invalid' : ''}`}
                          />
                          {formik.touched.cardNumber && formik.errors.cardNumber && (
                            <div className="invalid-feedback">{formik.errors.cardNumber}</div>
                          )}
                        </div>

                        <div className="col-6">
                          <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>Expiration (MM/YY) *</label>
                          <input
                            type="text"
                            name="cardExp"
                            placeholder="12/28"
                            value={formik.values.cardExp}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className={`form-control ${formik.touched.cardExp && formik.errors.cardExp ? 'is-invalid' : ''}`}
                          />
                          {formik.touched.cardExp && formik.errors.cardExp && (
                            <div className="invalid-feedback">{formik.errors.cardExp}</div>
                          )}
                        </div>

                        <div className="col-6">
                          <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>CVC / CVV *</label>
                          <input
                            type="password"
                            name="cardCvc"
                            placeholder="123"
                            maxLength={4}
                            value={formik.values.cardCvc}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className={`form-control ${formik.touched.cardCvc && formik.errors.cardCvc ? 'is-invalid' : ''}`}
                          />
                          {formik.touched.cardCvc && formik.errors.cardCvc && (
                            <div className="invalid-feedback">{formik.errors.cardCvc}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: REVIEW ITEMS & DELIVERY SPEED */}
              <div className="card shadow-sm border-0 mb-4 bg-white" style={{ borderRadius: '8px' }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <span className="badge rounded-circle bg-dark" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>3</span>
                    <h5 className="mb-0 fw-bold" style={{ fontSize: '16px' }}>Review Items & Delivery Speed</h5>
                  </div>

                  {/* Delivery Speed Selection */}
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
                            <div style={{ fontSize: '13px', fontWeight: 600 }}>FREE Standard Shipping (3-5 Business Days)</div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>Delivered by UPS or FedEx</div>
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
                            <div style={{ fontSize: '13px', fontWeight: 600 }}>⚡ Expedited Priority Delivery (1-2 Days)</div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>Priority dispatch with signature required</div>
                          </div>
                        </div>
                        <strong style={{ fontSize: '13px' }}>₦2,500</strong>
                      </label>
                    </div>
                  </div>

                  {/* Order Items List */}
                  <div className="d-flex flex-column gap-3">
                    {cartItems.map((item, idx) => {
                      const prod = item.product || item
                      return (
                        <div key={idx} className="d-flex gap-3 align-items-center pb-3 border-bottom">
                          {prod.images?.[0] ? (
                            <img src={prod.images[0]} alt={prod.title || prod.name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: '6px', border: '1px solid #E2E8F0' }} />
                          ) : (
                            <div style={{ width: 56, height: 56, background: '#F8F9FA', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📦</div>
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>
                              {prod.title || prod.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748B' }}>
                              Seller: {prod.vendor?.storeName || 'OmniMart Seller'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748B' }}>
                              Qty: {item.quantity}
                            </div>
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#10B981' }}>
                            {formatPrice((prod.price || 0) * item.quantity)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right Column: Amazon-Style Sticky Order Summary Buy Box ── */}
            <div className="col-lg-4">
              <div className="card shadow-sm border-0 bg-white sticky-top" style={{ top: '80px', borderRadius: '8px' }}>
                <div className="card-body p-4">

                  {/* Prominent Place Order CTA Button */}
                  <button
                    type="submit"
                    className="btn btn-warning w-100 py-3 fw-bold shadow-sm"
                    style={{ background: '#FFD814', borderColor: '#FCD200', color: '#0F172A', fontSize: '15px', borderRadius: '8px' }}
                    disabled={formik.isSubmitting}
                  >
                    {formik.isSubmitting ? 'Processing Order…' : 'Place your order'}
                  </button>

                  <p className="text-muted text-center mt-2" style={{ fontSize: '11px', lineHeight: 1.3 }}>
                    By placing your order, you agree to OmniMart&apos;s privacy notice and conditions of use.
                  </p>

                  <hr className="my-3" />

                  <h6 className="fw-bold mb-3" style={{ fontSize: '14px' }}>Order Summary</h6>

                  <div className="d-flex justify-content-between mb-2" style={{ fontSize: '13px' }}>
                    <span className="text-muted">Items ({cartItems.length}):</span>
                    <span>{formatPrice(itemsSubtotal)}</span>
                  </div>

                  <div className="d-flex justify-content-between mb-2" style={{ fontSize: '13px' }}>
                    <span className="text-muted">Shipping & handling:</span>
                    <span>{shippingFee === 0 ? 'FREE' : formatPrice(shippingFee)}</span>
                  </div>

                  <div className="d-flex justify-content-between mb-2" style={{ fontSize: '13px' }}>
                    <span className="text-muted">Estimated Tax (8%):</span>
                    <span>{formatPrice(estimatedTax)}</span>
                  </div>

                  <hr className="my-2" />

                  <div className="d-flex justify-content-between align-items-center mt-3 pt-2" style={{ borderTop: '2px solid #0F172A' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#B12704' }}>Order Total:</span>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#B12704' }}>{formatPrice(grandTotal)}</span>
                  </div>

                  {/* Security Badge */}
                  <div className="mt-4 p-3 rounded text-center" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '11px', color: '#64748B' }}>
                    🔒 256-Bit SSL Encrypted Checkout
                  </div>
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}

export default Checkout
