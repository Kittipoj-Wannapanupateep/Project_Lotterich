import { useEffect, useState } from 'react'
import '../styles/ProfilePage.css'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import authService from '../services/authService'
import { toast } from 'react-toastify'

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  // ตัวอย่าง: 1 January 2024
  return date.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

const ProfilePage = () => {
  const { user, setUser, fetchProfile } = useAuth()
  const [username, setUsername] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [editing, setEditing] = useState(false)
  const [originalUsername, setOriginalUsername] = useState(username)
  const [loading, setLoading] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const navigate = useNavigate()

  // ดึงวันที่สร้างบัญชีจาก user.createdAt
  const memberSince = user?.createdAt ? formatDate(user.createdAt) : ''

  useEffect(() => {
    if (user) {
      setUsername(user.name || '')
      setEmail(user.email || '')
      setOriginalUsername(user.name || '')
    }
  }, [user])

  const validateUsername = () => {
    const trimmedUsername = username.trim()
    if (!trimmedUsername) {
      setUsernameError('กรุณากรอกชื่อผู้ใช้')
      return false
    }
    if (trimmedUsername.length < 2) {
      setUsernameError('ชื่อผู้ใช้ต้องมีอย่างน้อย 2 ตัวอักษร')
      return false
    }
    setUsernameError('')
    return true
  }

  const handleSave = async () => {
    if (!validateUsername()) {
      return
    }

    try {
      setLoading(true)
      await authService.updateProfile({ name: username })
      setEditing(false)
      setOriginalUsername(username)
      if (fetchProfile) await fetchProfile()
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error(err.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }
  const handleCancel = () => {
    setUsername(originalUsername)
    setEditing(false)
    setUsernameError('')
  }
  const handleEdit = () => {
    setEditing(true)
    setUsernameError('')
  }
  const handleChangePassword = () => {
    navigate('/change-password')
  }
  const handleDeleteAccount = () => {
    navigate('/delete-account')
  }

  const handleUsernameChange = (e) => {
    const newUsername = e.target.value
    setUsername(newUsername)
    if (editing) {
      const trimmedUsername = newUsername.trim()
      if (!trimmedUsername) {
        setUsernameError('กรุณากรอกชื่อผู้ใช้')
      } else if (trimmedUsername.length < 2) {
        setUsernameError('ชื่อผู้ใช้ต้องมีอย่างน้อย 2 ตัวอักษร')
      } else {
        setUsernameError('')
      }
    }
  }

  return (
    <main className="container-fluid p-0">
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-form">
            <div className="profile-image-container">
              <img src="https://cdn-icons-png.flaticon.com/512/3135/3135768.png" alt="Profile Image" className="profile-image" />
            </div>
            <h2>Profile</h2>
            <form onSubmit={e => e.preventDefault()}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <div className="input-with-icon">
                  <input
                    type="text"
                    value={username}
                    readOnly={!editing}
                    onChange={handleUsernameChange}
                    className={`${editing ? '' : 'readonly'} ${usernameError ? 'is-invalid' : ''}`}
                    disabled={loading}
                  />
                  {!editing && (
                    <button type="button" className="edit-icon" onClick={handleEdit} disabled={loading}>
                      <img src="https://cdn-icons-png.flaticon.com/512/2985/2985043.png" alt="Edit" className="edit-icon-img" />
                    </button>
                  )}
                  {editing && (
                    <>
                      <button type="button" className="save-icon" onClick={handleSave} disabled={loading}>
                        <img src="https://cdn-icons-png.flaticon.com/512/447/447147.png" alt="Save" className="save-icon-img" />
                      </button>
                      <button type="button" className="cancel-icon" onClick={handleCancel} disabled={loading}>
                        <img src="https://cdn-icons-png.flaticon.com/512/3641/3641192.png" alt="Cancel" className="cancel-icon-img" />
                      </button>
                    </>
                  )}
                </div>
                {usernameError && <div className="error-message" style={{ color: 'red', fontSize: '0.875rem', marginTop: '0.25rem' }}>{usernameError}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="text" value={email} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">Member Since</label>
                <input type="text" value={memberSince} readOnly />
              </div>
              <div className="profile-actions">
                <button type="button" className="change-password-button" onClick={handleChangePassword} disabled={loading}>
                  Change Password
                </button>
                <button type="button" className="delete-account-button" onClick={handleDeleteAccount} disabled={loading}>
                  Delete Account
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}

export default ProfilePage 