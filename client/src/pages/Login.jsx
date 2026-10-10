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
