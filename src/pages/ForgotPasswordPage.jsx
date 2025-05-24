import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import authService from '../services/authService'
import '../styles/ForgotPasswordPage.css'

// OTPInput component
function OTPInput({ value, onChange, length = 6 }) {
  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, length)
    onChange(val)
  }
  return (
    <div style={{ position: 'relative', width: `${length * 2.5}rem`, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        {[...Array(length)].map((_, i) => (
          <div
            key={i}
            style={{
              borderBottom: '2px solid #ffd700',
              width: '2rem',
              height: '2.5rem',
              textAlign: 'center',
              fontSize: '1.5rem',
              color: '#ffd700',
              background: 'transparent',
              position: 'relative',
              transition: 'border-color 0.2s',
            }}
          >
            {value[i] || ''}
          </div>
        ))}
      </div>
      <input
        type="text"
        inputMode="numeric"
        autoFocus
        value={value}
        onChange={handleChange}
        maxLength={length}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '2.5rem',
          opacity: 0,
          pointerEvents: 'auto',
        }}
        tabIndex={0}
      />
    </div>
  )
}

const ForgotPasswordPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm()

  const handleSendOtp = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Please enter a valid email')
      return
    }
    setError('')
    setIsSubmitting(true)
    try {
      await authService.requestPasswordReset(email)
      setOtpSent(true)
      toast.success('OTP has been sent to your email')
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    setError('')
    try {
      await authService.verifyOtp(email, otp)
      toast.success('OTP verified! Please set your new password.')
      navigate('/reset-password', { state: { email, otp } })
    } catch (err) {
      toast.error(err.message || 'OTP ไม่ถูกต้อง')
      setError('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <div className="forgot-form">
          <form onSubmit={handleSubmit(onSubmit)} autoComplete="on">
            <h2 className="forgot-title">Forgot Password</h2>
            {!otpSent && (
              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="forgot-email-otp-row">
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button type="button" className="forgot-button" style={{ width: 'auto', padding: '0 1.2rem' }} onClick={handleSendOtp} disabled={isSubmitting}>
                      Send OTP
                    </button>
                  </div>
                </div>
              </div>
            )}
            {otpSent && (
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label className="form-label" style={{ marginBottom: 0, minWidth: 40 }}>OTP</label>
                <OTPInput value={otp} onChange={setOtp} length={6} />
              </div>
            )}
            <button
              type="submit"
              className="forgot-button"
              disabled={isSubmitting || !otpSent || otp.length !== 6}
            >
              {isSubmitting ? 'Processing...' : 'Verify OTP'}
            </button>
            <div className="text-center mt-3">
              <a href="/login" className="forgot-link">Back to Login</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage 