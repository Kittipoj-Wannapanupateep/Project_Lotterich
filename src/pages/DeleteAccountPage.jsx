import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import authService from '../services/authService'
import { toast } from 'react-toastify'
import '../styles/DeleteAccountPage.css'

const DeleteAccountPage = () => {
  const [confirmText, setConfirmText] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleDeleteAccount = async () => {
    setPasswordError('')
    if (!confirmText || !currentPassword) {
      if (!currentPassword) setPasswordError('กรุณากรอกรหัสผ่าน')
      if (!confirmText) toast.error('Please fill in all fields')
      return
    }
    if (currentPassword.length < 6) {
      setPasswordError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }
    if (confirmText !== 'CONFIRM') {
      toast.error('Please type "CONFIRM" exactly as shown to proceed')
      return
    }
    try {
      setLoading(true)
      const response = await authService.deleteAccount(currentPassword)
      if (response.message) {
        toast.success(response.message)
        await logout()
        navigate('/')
      }
    } catch (error) {
      console.error('Delete account error:', error)
      toast.error(error.message || 'Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/profile')
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <main className="container-fluid p-0">
      <div className="delete-container">
        <div className="delete-card">
          <div className="delete-form">
            <div className="delete-image-container">
              <img src="https://cdn-icons-png.flaticon.com/512/16312/16312186.png" alt="Delete Account" className="delete-image" />
            </div>
            <h2>Delete Account</h2>
            <p className="warning-text">Warning: This action cannot be undone. All your data will be permanently deleted.</p>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label className="form-label">Type "CONFIRM" to proceed</label>
                <div className="input-with-icon">
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type CONFIRM"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div className="input-with-icon">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => {
                      setCurrentPassword(e.target.value)
                      if (e.target.value.length >= 6) setPasswordError('')
                    }}
                    placeholder="Enter your current password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={togglePasswordVisibility}
                    disabled={loading}
                  >
                    <img
                      src={showPassword ? 'https://cdn-icons-png.flaticon.com/512/2767/2767194.png' : 'https://cdn-icons-png.flaticon.com/512/2767/2767146.png'}
                      alt="Toggle Password"
                      className="toggle-icon"
                    />
                  </button>
                </div>
                {passwordError && (
                  <div className="password-error-message">{passwordError}</div>
                )}
              </div>
              <div className="delete-actions">
                <button
                  type="button"
                  className="delete-account-button"
                  onClick={handleDeleteAccount}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete Account'}
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}

export default DeleteAccountPage 