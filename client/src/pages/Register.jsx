// Register page — Formik + Yup + axios.post (instructor's Formikk.jsx pattern)
//
// Bug 1 Fix: FormField is defined OUTSIDE Register so React never re-creates
//   the component type on keystroke → input keeps focus while typing.
//   (Previously: "const Field = ..." was INSIDE Register → remount on every render)
//
// Bug 2 Fix: uses useAuth().login() instead of raw localStorage + window.location.reload()

import { useFormik } from 'formik'
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import * as yup from 'yup'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

// ── BUG 1 FIX: FormField defined OUTSIDE Register ──────────────────────────
// React identifies component types by reference. When defined inside a parent,
// a new function reference is created every render → React unmounts + remounts
// the input → focus is lost after every character typed.
// Defined outside = stable reference = no remount = focus stays ✓
const FormField = ({ formik, name, label, type = 'text', placeholder }) => (
  <div className="mb-3">
    <label
      htmlFor={name}
      className="form-label"
      style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '.05em', color: '#64748B' }}>
      {label}
    </label>
    <input
      id={name}
      type={type}
      name={name}
      placeholder={placeholder}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      value={formik.values[name]}
      className={`form-control ${
        formik.touched[name] && formik.errors[name] ? 'is-invalid'
        : formik.touched[name] && !formik.errors[name] ? 'is-valid' : ''
      }`}
    />
    {formik.touched[name] && formik.errors[name] && (
      <div className="invalid-feedback">{formik.errors[name]}</div>
    )}
  </div>
)
// ────────────────────────────────────────────────────────────────────────────

const Register = () => {
  const navigate  = useNavigate()
  const { login } = useAuth()
  const [isVendor, setIsVendor] = useState(false)
  
  // OTP verification stage state
  const [otpStage, setOtpStage] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)

  const formik = useFormik({
    initialValues: {
      firstname: '', lastname: '', email: '',
      password: '', role: 'customer',
      storeName: '', storeDescription: '',
    },

    validationSchema: yup.object({
      firstname: yup.string().required('First name is required').min(2),
      lastname:  yup.string().required('Last name is required'),
      email:     yup.string().email('Invalid email').required('Email is required'),
      password:  yup.string().required('Password is required').min(8, 'Min. 8 characters'),
      storeName: yup.string().when('role', {
        is: 'vendor',
        then: (s) => s.required('Store name is required for vendors'),
      }),
    }),

    onSubmit: async (values, { setStatus, setSubmitting }) => {
      try {
        const endpoint = values.role === 'vendor' ? '/vendor/register' : '/register'
        const response = await api.post(endpoint, values)

        // Vendor registration skips OTP — direct login
        if (values.role === 'vendor') {
          const tokenData = response.data.token || response.data.data?.token
          const userData  = response.data.user  || response.data.data
          login(userData, tokenData)
          return navigate('/vendor')
        }

        // Customer — OTP stage
        if (response.data.requiresOTP) {
          setPendingEmail(values.email.toLowerCase())
          setOtpStage(true)
        }

      } catch (error) {
        setStatus(error.response?.data?.message || 'Registration failed.')
      } finally {
        setSubmitting(false)
      }
    },
  })

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setOtpError('')
    setOtpLoading(true)
    try {
      const response = await api.post('/auth/verify-otp', { email: pendingEmail, otpCode })
      const tokenData = response.data.token || response.data.data?.token
      const userData  = response.data.user  || response.data.data
      login(userData, tokenData)
      navigate('/')
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid code. Please try again.')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleRoleChange = (e) => {
    const val = e.target.value
    formik.setFieldValue('role', val)
    setIsVendor(val === 'vendor')
  }

  // ── Google Sign-Up ──
  const handleGoogleRegister = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await api.post('/auth/google', {
          access_token: tokenResponse.access_token,
          role: formik.values.role,
          storeName: formik.values.storeName || undefined,
        })
        const tokenData = response.data.token || response.data.data?.token
        const userData  = response.data.user  || response.data.data
        login(userData, tokenData)

        const role = userData?.role
        if (role === 'vendor') return navigate('/vendor')
        navigate('/')

      } catch (error) {
        formik.setStatus(error.response?.data?.message || 'Google sign-up failed.')
      }
    },
    onError: () => formik.setStatus('Google sign-up was cancelled.'),
  })

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#F8F9FA', padding: '24px',
    }}>
      <div className="card shadow-sm" style={{ maxWidth: '480px', width: '100%' }}>
        <div className="card-body p-5">

          <div className="text-center mb-4">
            <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-.03em' }}>
              Omni<span style={{ color: '#10B981' }}>Mart</span>
            </h1>
            <p className="text-muted mt-1" style={{ fontSize: '13px' }}>
              {otpStage ? 'Verify your email' : 'Create your account'}
            </p>
          </div>

          {/* ── OTP Verification Stage ── */}
          {otpStage ? (
            <div>
              <div className="text-center mb-4 p-3" style={{ background: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                <span style={{ fontSize: '28px' }}>📧</span>
                <p style={{ fontSize: '14px', color: '#166534', fontWeight: 600, margin: '8px 0 4px' }}>
                  We've sent a code to your email
                </p>
                <p style={{ fontSize: '13px', color: '#15803D', margin: 0 }}>
                  Enter it below to complete registration.
                </p>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '6px 0 0' }}>
                  Sent to: <strong>{pendingEmail}</strong>
                </p>
              </div>

              {otpError && (
                <div className="alert" style={{
                  background: '#FEE2E2', border: '1px solid #FCA5A5',
                  color: '#991B1B', borderRadius: '4px', fontSize: '13px', padding: '10px 14px', marginBottom: '16px'
                }}>
                  {otpError}
                </div>
              )}

              <form onSubmit={handleOtpSubmit}>
                <div className="mb-4">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B' }}>
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg text-center"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="● ● ● ● ● ●"
                    style={{ fontSize: '24px', letterSpacing: '0.3em', fontWeight: 700 }}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={otpLoading || otpCode.length < 6}>
                  {otpLoading ? 'Verifying…' : 'Verify & Complete Registration'}
                </button>
              </form>

              <button
                type="button"
                className="btn btn-link w-100 mt-3"
                style={{ fontSize: '13px', color: '#64748B' }}
                onClick={() => { setOtpStage(false); setOtpCode(''); setOtpError(''); }}
              >
                ← Back to registration
              </button>
            </div>
          ) : (
            <>
              {/* ── Normal Registration Form ── */}
              {formik.status && (
                <div className="alert" style={{
                  background: '#FEE2E2', border: '1px solid #FCA5A5',
                  color: '#991B1B', borderRadius: '4px', fontSize: '13px', padding: '10px 14px',
                }}>
                  {formik.status}
                </div>
              )}

          {/* Role selector — ABOVE the form so vendor fields show before submit */}
          <div className="mb-4">
            <label className="form-label" style={{ fontSize: '11px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B' }}>
              I am a
            </label>
            <div className="d-flex gap-2">
              {['customer', 'vendor'].map(r => (
                <button
                  key={r} type="button"
                  className="btn btn-sm flex-fill"
                  style={{
                    border: `1px solid ${formik.values.role === r ? '#0F172A' : '#E2E8F0'}`,
                    background: formik.values.role === r ? '#0F172A' : '#fff',
                    color: formik.values.role === r ? '#fff' : '#64748B',
                    fontWeight: 600, fontSize: '12px', padding: '8px',
                    borderRadius: '4px', textTransform: 'capitalize',
                  }}
                  onClick={() => handleRoleChange({ target: { value: r } })}
                >
                  {r === 'customer' ? '🛒 Customer' : '🏪 Vendor'}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={formik.handleSubmit}>
            <div className="row g-2">
              <div className="col-6">
                {/* Bug 1 Fix: FormField is stable (defined outside) — no remount on type */}
                <FormField formik={formik} name="firstname" label="First Name" placeholder="John" />
              </div>
              <div className="col-6">
                <FormField formik={formik} name="lastname" label="Last Name" placeholder="Doe" />
              </div>
            </div>

            <FormField formik={formik} name="email" label="Email Address" type="email" placeholder="you@example.com" />
            <FormField formik={formik} name="password" label="Password" type="password" placeholder="Min. 8 characters" />

            {/* Vendor-only fields */}
            {isVendor && (
              <div className="p-3 mb-3" style={{
                background: '#F8FFFE', border: '1px solid #D1FAE5',
                borderRadius: '4px',
              }}>
                <p style={{ fontSize: '12px', color: '#064E3B', marginBottom: '12px', fontWeight: 500 }}>
                  🏪 Your store will be reviewed by an admin before going live.
                </p>
                {/* Also stable reference — defined outside Register */}
                <FormField formik={formik} name="storeName" label="Store Name" placeholder="e.g. Lagos Fashion Hub" />
                <div className="mb-0">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B' }}>
                    Store Description
                  </label>
                  <textarea
                    name="storeDescription"
                    rows={2}
                    className="form-control"
                    placeholder="What do you sell?"
                    onChange={formik.handleChange}
                    value={formik.values.storeDescription}
                  />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-100 mt-1" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="d-flex align-items-center my-4">
            <hr style={{ flex: 1, borderColor: '#E2E8F0' }} />
            <span style={{ padding: '0 12px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>OR</span>
            <hr style={{ flex: 1, borderColor: '#E2E8F0' }} />
          </div>

          {/* Google Sign-Up */}
          <button
            type="button"
            className="btn w-100 d-flex align-items-center justify-content-center gap-2"
            style={{
              border: '1px solid #E2E8F0', background: '#fff', color: '#0F172A',
              fontWeight: 600, fontSize: '13px', padding: '10px', borderRadius: '4px',
            }}
            onClick={() => handleGoogleRegister()}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
              <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.4 6.3 14.7z"/>
              <path fill="#FBBC05" d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.7-5.5C29.8 36.8 27 38 24 38c-6 0-10.6-4-12.3-9.5l-7 5.4C8.1 41.3 15.5 46 24 46z"/>
              <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.8 2.3-2.3 4.3-4.3 5.7l6.7 5.5C42 36.5 46 31 46 24c0-1.3-.2-2.7-.5-4z"/>
            </svg>
            {isVendor ? 'Register Store with Google' : 'Sign up with Google'}
          </button>

          <p className="text-center mt-4" style={{ fontSize: '13px', color: '#64748B' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#0F172A', fontWeight: 600 }}>Sign in →</Link>
          </p>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

export default Register
