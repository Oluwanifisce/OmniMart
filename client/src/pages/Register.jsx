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
  const [showPass, setShowPass] = useState(false)
  
  // OTP verification stage state
  const [otpStage, setOtpStage] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)

  const formik = useFormik({
    initialValues: {
      firstname: '', lastname: '', email: '', phone: '',
      password: '', role: 'customer',
      storeName: '', storeDescription: '',
    },

    validationSchema: yup.object({
      firstname: yup
        .string()
        .required('First name is required')
        .matches(/^[A-Za-z]+$/, 'Names can only contain alphabetical letters!'),
      lastname: yup
        .string()
        .required('Last name is required')
        .matches(/^[A-Za-z]+$/, 'Names can only contain alphabetical letters!'),
      email: yup.string().email('Invalid email').required('Email is required'),
      phone: yup
        .string()
        .required('Phone number is required')
        .test('is-nigerian-phone', 'Please enter a valid Nigerian phone number (e.g., 0803 123 4567 or +234...)', (value) => {
          if (!value) return false;
          const clean = value.replace(/[\s-]/g, '');
          return /^(?:\+234|234|0)[789][01]\d{8}$/.test(clean);
        }),
      password: yup
        .string()
        .required('Password is required')
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/,
          'Password must be at least 8 characters and include uppercase, lowercase, and a special character!'
        ),
      storeName: yup.string().when('role', {
        is: 'vendor',
        then: (s) => s.required('Store name is required for vendors'),
      }),
    }),

    onSubmit: async (values, { setStatus, setSubmitting }) => {
      try {
        const isVendor = values.role === 'vendor'
        const registrationPayload = {
          name: `${values.firstname || ''} ${values.lastname || ''}`.trim() || values.name,
          firstname: values.firstname || values.name?.split(' ')[0] || 'User',
          lastname: values.lastname || values.name?.split(' ').slice(1).join(' ') || 'Member',
          email: values.email,
          phone: values.phone,
          password: values.password,
          role: isVendor ? 'vendor' : 'customer',
          shopName: isVendor ? (values.shopName || values.storeName) : undefined,
          storeName: isVendor ? (values.storeName || values.shopName) : undefined,
          storeDescription: values.storeDescription,
        }

        const endpoint = isVendor ? '/vendor/register' : '/register'
        const response = await api.post(endpoint, registrationPayload)

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
                <FormField formik={formik} name="firstname" label="First Name" placeholder="e.g., Obafemi" />
              </div>
              <div className="col-6">
                <FormField formik={formik} name="lastname" label="Last Name" placeholder="e.g., Awolowo" />
              </div>
            </div>

            <FormField formik={formik} name="email" label="Email Address" type="email" placeholder="you@example.com" />
            <FormField formik={formik} name="phone" label="Phone Number" placeholder="e.g., 0803 123 4567" />

            {/* Password field with visibility toggle */}
            <div className="mb-3" style={{ position: 'relative' }}>
              <label htmlFor="password" className="form-label"
                style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '.05em', color: '#64748B' }}>
                Password
              </label>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                name="password"
                placeholder="Min. 8 characters"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
                style={{ paddingRight: '44px' }}
                className={`form-control ${
                  formik.touched.password && formik.errors.password ? 'is-invalid'
                  : formik.touched.password && !formik.errors.password ? 'is-valid' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute', right: '12px', top: '32px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#94A3B8', padding: 0, fontSize: '16px',
                }}
                tabIndex={-1}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
              {formik.touched.password && formik.errors.password && (
                <div className="invalid-feedback">{formik.errors.password}</div>
              )}
            </div>

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
