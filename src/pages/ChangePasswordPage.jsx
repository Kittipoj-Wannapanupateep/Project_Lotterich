import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import authService from '../services/authService'
import { toast } from 'react-toastify'
import '../styles/ChangePasswordPage.css'

const ChangePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('กรุณากรอกข้อมูลทั้งหมด')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('รหัสผ่านไม่ตรงกัน')
      return
    }

    try {
      setLoading(true)
      await authService.changePassword(currentPassword, newPassword)
      toast.success('เปลี่ยนรหัสผ่านสำเร็จ')
      navigate('/profile')
    } catch (error) {
      toast.error(error.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้')
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = (inputId) => {
    const input = document.getElementById(inputId)
    const icon = document.getElementById(`toggle${inputId}`)
    
    if (input.type === 'password') {
      input.type = 'text'
      icon.src = 'https://cdn-icons-png.flaticon.com/512/2767/2767194.png'
    } else {
      input.type = 'password'
      icon.src = 'https://cdn-icons-png.flaticon.com/512/2767/2767146.png'
    }
  }

  return (
    <div className="container-fluid p-0">
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-form">
            <div className="profile-image-container">
              <img src="https://cdn-icons-png.flaticon.com/512/6195/6195699.png" alt="Profile Image" className="profile-image" />
            </div>
            <h2>เปลี่ยนรหัสผ่าน</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">รหัสผ่านปัจจุบัน</label>
                <div className="input-with-icon">
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="พิมพ์รหัสผ่านปัจจุบัน"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => togglePasswordVisibility('currentPassword')}
                    disabled={loading}
                  >
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/2767/2767146.png"
                      alt="Show Password"
                      id="togglecurrentPassword"
                      className="toggle-icon"
                    />
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">รหัสผ่านใหม่</label>
                <div className="input-with-icon">
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="พิมพ์รหัสผ่านใหม่"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => togglePasswordVisibility('newPassword')}
                    disabled={loading}
                  >
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/2767/2767146.png"
                      alt="Show Password"
                      id="togglenewPassword"
                      className="toggle-icon"
                    />
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">ยืนยันรหัสผ่านใหม่</label>
                <div className="input-with-icon">
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="ยืนยันรหัสผ่านใหม่"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    disabled={loading}
                  >
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/2767/2767146.png"
                      alt="Show Password"
                      id="toggleconfirmPassword"
                      className="toggle-icon"
                    />
                  </button>
                </div>
              </div>
              <div className="profile-actions">
                <button type="submit" className="save-password-button" disabled={loading}>
                  บันทึกการเปลี่ยนรหัสผ่าน
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => navigate('/profile')}
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

export default ChangePasswordPage 