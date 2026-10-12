import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'

const ForgotPassword = () => {
  const navigate = useNavigate()

  // Multi-step workflow: 1 = Request Code, 2 = Verify Code & Reset
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // UI state
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) // { type: 'success' | 'danger', message: string }

  // Step 1: Submit email to request 6-digit recovery OTP code
  const handleRequestCode = async (e) => {
    e.preventDefault()
    setStatus(null)

    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail) {
      setStatus({ type: 'danger', message: 'Please enter your registered email address.' })
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/auth/forgot-password', { email: trimmedEmail })
      setStatus({
        type: 'success',
        message: response.data?.message || 'Recovery code sent! Please check your email inbox.',
      })
      // Instantly transition to Step 2
      setStep(2)
    } catch (err) {
      setStatus({
        type: 'danger',
        message: err.response?.data?.message || 'Could not send recovery code. Please check the email and try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP code and save new password
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setStatus(null)

    const trimmedOtp = otpCode.trim()
    if (!trimmedOtp || trimmedOtp.length < 6) {
      setStatus({ type: 'danger', message: 'Please enter the 6-digit verification code.' })
      return
    }

    if (!newPassword) {
      setStatus({ type: 'danger', message: 'Please enter your new password.' })
      return
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/
    if (!passwordRegex.test(newPassword)) {
      setStatus({
        type: 'danger',
        message: 'Password must be at least 8 characters and include uppercase, lowercase, and a special character.',
      })
      return
    }

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'danger', message: 'New password and confirmation password do not match.' })
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otpCode: trimmedOtp,
        otp: trimmedOtp,
        newPassword,
      })

      setStatus({
        type: 'success',
        message: 'Password reset successful! Redirecting you to sign in...',
      })

      // Clean redirect back to /login on success
      setTimeout(() => {
        navigate('/login', {
          state: { resetSuccess: true, message: 'Password reset successful! Please sign in with your new password.' },
        })
      }, 1200)
    } catch (err) {
      setStatus({
        type: 'danger',
        message: err.response?.data?.message || 'Invalid or expired verification code. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  // Resend code handler for Step 2
  const handleResendCode = async () => {
    if (loading) return
    setStatus(null)
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() })
      setStatus({ type: 'success', message: 'A fresh recovery code has been sent to your email.' })
    } catch (err) {
      setStatus({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to resend code. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8F9FA',
        padding: '24px',
      }}
    >
      <div className="card shadow-sm border-0" style={{ maxWidth: '440px', width: '100%', borderRadius: '12px' }}>
        <div className="card-body p-4 p-md-5">
          {/* Header Branding */}
          <div className="text-center mb-4">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-.03em', color: '#0F172A', margin: 0 }}>
                Omni<span style={{ color: '#10B981' }}>Mart</span>
              </h1>
            </Link>
            <p className="text-muted mt-2" style={{ fontSize: '13px' }}>
              {step === 1 ? 'Account Password Recovery' : 'Create New Password'}
            </p>
          </div>

          {/* Stepper Progress Indicator */}
          <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
            <span
              style={{
                width: '32px',
                height: '6px',
                borderRadius: '3px',
                background: '#10B981',
                transition: 'all 0.3s ease',
              }}
            />
            <span
              style={{
                width: '32px',
                height: '6px',
                borderRadius: '3px',
                background: step === 2 ? '#10B981' : '#E2E8F0',
                transition: 'all 0.3s ease',
              }}
            />
          </div>

          {/* Status Alert Notification */}
          {status && (
            <div
              className={`alert alert-${status.type} py-2.5 px-3 mb-4`}
              style={{
                fontSize: '13px',
                borderRadius: '8px',
                border: status.type === 'danger' ? '1px solid #FCA5A5' : '1px solid #86EFAC',
                background: status.type === 'danger' ? '#FEF2F2' : '#F0FDF4',
                color: status.type === 'danger' ? '#991B1B' : '#166534',
              }}
            >
              {status.message}
            </div>
          )}

          {/* STEP 1: REQUEST RECOVERY CODE */}
          {step === 1 && (
            <form onSubmit={handleRequestCode}>
              <div className="mb-4">
                <label
                  className="form-label"
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '.05em',
                    color: '#64748B',
                  }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your registered email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control"
                  style={{ borderRadius: '8px', padding: '11px 14px', fontSize: '14px' }}
                  required
                />
                <div className="form-text mt-1.5" style={{ fontSize: '12px', color: '#64748B' }}>
                  We will send a 6-digit verification pin to this email address.
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100"
                style={{
                  padding: '11px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  letterSpacing: '0.02em',
                }}
                disabled={loading}
              >
                {loading ? 'Sending Code...' : 'Send Recovery Code'}
              </button>
            </form>
          )}

          {/* STEP 2: VERIFY CODE & RESET PASSWORD */}
          {step === 2 && (
            <form onSubmit={handleResetPassword}>
              <div className="p-2.5 mb-3 rounded bg-light border d-flex align-items-center justify-content-between" style={{ fontSize: '12px' }}>
                <span className="text-truncate me-2" style={{ color: '#475569' }}>
                  Sending to: <strong>{email}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setStatus(null)
                  }}
                  className="btn btn-link p-0 text-decoration-none"
                  style={{ fontSize: '11px', fontWeight: 600, color: '#10B981' }}
                >
                  Change
                </button>
              </div>

              {/* 1. Verification Code Input */}
              <div className="mb-3">
                <label
                  className="form-label"
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '.05em',
                    color: '#64748B',
                  }}
                >
                  Verification Code (OTP) *
                </label>
                <input
                  type="text"
                  name="otpCode"
                  maxLength={6}
                  placeholder="6-digit code (e.g. 123456)"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="form-control text-center fw-bold"
                  style={{
                    borderRadius: '8px',
                    padding: '11px 14px',
                    fontSize: '18px',
                    letterSpacing: '0.25em',
                  }}
                  required
                />
              </div>

              {/* 2. New Password Input */}
              <div className="mb-3" style={{ position: 'relative' }}>
                <label
                  className="form-label"
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '.05em',
                    color: '#64748B',
                  }}
                >
                  New Password *
                </label>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  name="newPassword"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-control"
                  style={{ borderRadius: '8px', padding: '11px 44px 11px 14px', fontSize: '14px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass((p) => !p)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '32px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    padding: 0,
                    fontSize: '16px',
                  }}
                  tabIndex={-1}
                  aria-label={showNewPass ? 'Hide password' : 'Show password'}
                >
                  {showNewPass ? '🙈' : '👁️'}
                </button>
              </div>

              {/* 3. Confirm New Password Input */}
              <div className="mb-4" style={{ position: 'relative' }}>
                <label
                  className="form-label"
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '.05em',
                    color: '#64748B',
                  }}
                >
                  Confirm New Password *
                </label>
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-control"
                  style={{ borderRadius: '8px', padding: '11px 44px 11px 14px', fontSize: '14px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass((p) => !p)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '32px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    padding: 0,
                    fontSize: '16px',
                  }}
                  tabIndex={-1}
                  aria-label={showConfirmPass ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPass ? '🙈' : '👁️'}
                </button>
              </div>

              {/* 4. Action Button */}
              <button
                type="submit"
                className="btn btn-primary w-100 mb-3"
                style={{
                  padding: '11px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  letterSpacing: '0.02em',
                }}
                disabled={loading}
              >
                {loading ? 'Updating Password...' : 'Reset Password & Log In'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="btn btn-link p-0 text-decoration-none"
                  style={{ fontSize: '12px', color: '#64748B' }}
                >
                  Didn't receive the code? Resend
                </button>
              </div>
            </form>
          )}

          {/* Back to Sign In Link */}
          <div className="text-center mt-4 pt-2 border-top">
            <Link
              to="/login"
              style={{
                fontSize: '13px',
                color: '#0F172A',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
