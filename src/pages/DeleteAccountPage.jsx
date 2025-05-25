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
      if (!confirmText) toast.error('กรุณากรอกข้อมูลทั้งหมด')
      return
    }
    if (currentPassword.length < 6) {
      setPasswordError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }
    if (confirmText !== 'CONFIRM') {
      toast.error('โปรดพิมพ์คำว่า "CONFIRM" ให้ถูกต้อง')
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
      console.error('ลบบัญชีผู้ใช้ผิดพลาด:', error)
      toast.error(error.message || 'ไม่สามารถลบบัญชีผู้ใช้ได้')
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
    <div className="container-fluid p-0">
      <div className="delete-container">
        <div className="delete-card">
          <div className="delete-form">
            <div className="delete-image-container">
              <img src="https://cdn-icons-png.flaticon.com/512/16312/16312186.png" alt="Delete Account" className="delete-image" />
            </div>
            <h2>ลบบัญชีผู้ใช้</h2>
            <p className="warning-text">คำเตือน : การดำเนินการนี้ไม่สามารถย้อนกลับได้ ข้อมูลทั้งหมด<br /> ของคุณจะถูกลบออกอย่างถาวร</p>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label className="form-label">พิมพ์คำว่า "CONFIRM" เพื่อดำเนินการต่อ</label>
                <div className="input-with-icon">
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="พิมพ์คำว่า CONFIRM"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">รหัสผ่านปัจจุบัน</label>
                <div className="input-with-icon">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => {
                      setCurrentPassword(e.target.value)
                      if (e.target.value.length >= 6) setPasswordError('')
                    }}
                    placeholder="พิมพ์รหัสผ่านปัจจุบัน"
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
                  {loading ? 'กำลังทำการลบบัญชี...' : 'ลบบัญชีผู้ใช้'}
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteAccountPage 