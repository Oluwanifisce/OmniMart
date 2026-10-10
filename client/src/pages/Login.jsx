// Login page — Formik + Yup + axios.post (instructor's Formikk.jsx pattern)
// Bug 2 Fix: uses useAuth().login() instead of raw localStorage + window.location.reload()

import { useFormik } from 'formik'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import * as yup from 'yup'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const { login }      = useAuth()

  const redirectTarget = searchParams.get('redirect')

  const syncGuestCartToBackend = async () => {
    try {
      const guestItems = JSON.parse(localStorage.getItem('cartItems') || '[]')
      if (guestItems.length > 0) {
        for (const item of guestItems) {
          const productId = item.product?._id || item.product || item.productId
          const quantity = item.quantity || 1
          if (productId) {
            await api.post('/cart', { productId, quantity }).catch(() => {})
          }
        }
        localStorage.removeItem('cartItems')
      }
      const res = await api.get('/cart').catch(() => null)
      if (res?.data) {
        const items = res.data.cart?.items || res.data.data?.items || []
        const totalQty = items.reduce((sum, i) => sum + i.quantity, 0)
        localStorage.setItem('cartCount', totalQty.toString())
      }
    } catch { /* silent */ }
  }

  const formik = useFormik({
    initialValues: { email: '', password: '' },

    validationSchema: yup.object({
      email:    yup.string().email('Invalid email').required('Email is required'),
      password: yup.string().required('Password is required').min(6, 'Min. 6 characters'),
    }),

    onSubmit: async (values, { setStatus, setSubmitting }) => {
      try {
        const response = await api.post('/login', values)
        const tokenData = response.data.token || response.data.data?.token
        const userData  = response.data.user  || response.data.data

        // Save token and user in context & localStorage
        login(userData, tokenData)

        // Sync guest cart if exists
        await syncGuestCartToBackend()

        // Handle redirect wall
        if (redirectTarget) {
          return navigate(redirectTarget)
        }

        const role = userData?.role
        if (role === 'admin')  return navigate('/admin')
        if (role === 'vendor') return navigate('/vendor')
        navigate('/')

      } catch (error) {
        setStatus(error.response?.data?.message || 'Login failed. Please try again.')
      } finally {
        setSubmitting(false)
      }
    },
  })

  // ── Google Sign-In ──
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await api.post('/auth/google', {
          access_token: tokenResponse.access_token,
          role: 'customer',
        })
        const tokenData = response.data.token || response.data.data?.token
        const userData  = response.data.user  || response.data.data
        login(userData, tokenData)

        await syncGuestCartToBackend()

        if (redirectTarget) {
          return navigate(redirectTarget)
        }

        const role = userData?.role
        if (role === 'admin')  return navigate('/admin')
        if (role === 'vendor') return navigate('/vendor')
        navigate('/')

      } catch (error) {
        formik.setStatus(error.response?.data?.message || 'Google sign-in failed.')
      }
    },
    onError: () => formik.setStatus('Google sign-in was cancelled.'),
  })

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#F8F9FA', padding: '24px',
    }}>
      <div className="card shadow-sm" style={{ maxWidth: '420px', width: '100%' }}>
        <div className="card-body p-5">

          <div className="text-center mb-4">
            <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-.03em' }}>
              Omni<span style={{ color: '#10B981' }}>Mart</span>
            </h1>
            <p className="text-muted mt-1" style={{ fontSize: '13px' }}>Sign in to your account</p>
          </div>

          {(redirectTarget === 'checkout' || redirectTarget === '/checkout' || redirectTarget?.includes('checkout')) && (
            <div className="alert alert-info py-2 rounded-3 text-center mb-3 shadow-sm" style={{ fontSize: '0.9rem' }}>
              <i className="bi bi-info-circle-fill me-2"></i> Please sign up or log in to secure your checkout portal!
            </div>
          )}

          {formik.status && (
            <div className="alert" style={{
              background: '#FEE2E2', border: '1px solid #FCA5A5',
              color: '#991B1B', borderRadius: '4px', fontSize: '13px', padding: '10px 14px',
            }}>
              {formik.status}
            </div>
          )}

          <form onSubmit={formik.handleSubmit}>
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: '11px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B' }}>
                Email Address
              </label>
              <input
                type="email" name="email" placeholder="you@example.com"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                className={`form-control ${
                  formik.touched.email && formik.errors.email ? 'is-invalid'
                  : formik.touched.email && !formik.errors.email ? 'is-valid' : ''
                }`}
              />
              {formik.touched.email && formik.errors.email && (
                <div className="invalid-feedback">{formik.errors.email}</div>
              )}
            </div>

            <div className="mb-4">
              <label className="form-label" style={{ fontSize: '11px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B' }}>
                Password
              </label>
              <input
                type="password" name="password" placeholder="••••••••"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
                className={`form-control ${
                  formik.touched.password && formik.errors.password ? 'is-invalid'
                  : formik.touched.password && !formik.errors.password ? 'is-valid' : ''
                }`}
              />
              {formik.touched.password && formik.errors.password && (
                <div className="invalid-feedback">{formik.errors.password}</div>
              )}
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="d-flex align-items-center my-4">
            <hr style={{ flex: 1, borderColor: '#E2E8F0' }} />
            <span style={{ padding: '0 12px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>OR</span>
            <hr style={{ flex: 1, borderColor: '#E2E8F0' }} />
          </div>

          {/* Google Sign-In button */}
          <button
            type="button"
            className="btn w-100 d-flex align-items-center justify-content-center gap-2"
            style={{
              border: '1px solid #E2E8F0', background: '#fff', color: '#0F172A',
              fontWeight: 600, fontSize: '13px', padding: '10px', borderRadius: '4px',
            }}
            onClick={() => handleGoogleLogin()}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
              <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.4 6.3 14.7z"/>
              <path fill="#FBBC05" d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.7-5.5C29.8 36.8 27 38 24 38c-6 0-10.6-4-12.3-9.5l-7 5.4C8.1 41.3 15.5 46 24 46z"/>
              <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.8 2.3-2.3 4.3-4.3 5.7l6.7 5.5C42 36.5 46 31 46 24c0-1.3-.2-2.7-.5-4z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center mt-4" style={{ fontSize: '13px', color: '#64748B' }}>
            No account?{' '}
            <Link to="/register" style={{ color: '#0F172A', fontWeight: 600 }}>Create one →</Link>
          </p>

        </div>
      </div>
    </div>
  )
}

export default Login
