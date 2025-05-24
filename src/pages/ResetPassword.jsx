import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import authService from '../services/authService'
import '../styles/ResetPasswordPage.css'

const eyeOpen = 'https://cdn-icons-png.flaticon.com/512/2767/2767194.png'
const eyeClosed = 'https://cdn-icons-png.flaticon.com/512/2767/2767146.png'

const ResetPassword = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email || ''
  const otp = location.state?.otp || ''
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (!email || !otp) {
      navigate('/forgot-password')
    }
  }, [email, otp, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      toast.error('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน')
      return
    }
    setIsSubmitting(true)
    try {
      await authService.resetPassword(email, otp, newPassword)
      toast.success('เปลี่ยนรหัสผ่านสำเร็จ!')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="reset-container">
      <div className="reset-card">
        <div className="reset-form">
          <form onSubmit={handleSubmit} autoComplete="on">
            <h2 className="reset-title">Reset Password</h2>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  style={{ width: '100%' }}
                />
                <img
                  src={showNewPassword ? eyeOpen : eyeClosed}
                  alt={showNewPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowNewPassword(v => !v)}
                  className="password-toggle-icon"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  style={{ width: '100%' }}
                />
                <img
                  src={showConfirmPassword ? eyeOpen : eyeClosed}
                  alt={showConfirmPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirmPassword(v => !v)}
                  className="password-toggle-icon"
                />
              </div>
            </div>
            <button type="submit" className="forgot-button" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Reset Password'}
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

export default ResetPassword 