import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'

const LoginForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    setError('')
    try {
      const user = await login({ ...data, rememberMe })
      if (user) {
        if (user.role === 'admin') {
          navigate('/admin/manage')
        } else {
          navigate('/home')
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} autoComplete="on">
      <h2 style={{ color: '#ffd700', marginBottom: '2rem', textAlign: 'center', fontWeight: 600 }}>เข้าสู่ระบบ</h2>
      {error && <div className="error-text" style={{marginBottom: '1rem'}}>{error}</div>}
      <div className="form-group">
        <label className="form-label">อีเมล</label>
        <input
          type="email"
          placeholder="กรุณากรอกอีเมล"
          autoComplete="username"
          {...register('email', {
            required: 'กรุณากรอกอีเมล',
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: 'กรุณากรอกอีเมลที่ถูกต้อง'
            }
          })}
        />
        <p className="error-text">{errors.email?.message || ''}</p>
      </div>
      <div className="form-group">
        <label className="form-label">รหัสผ่าน</label>
        <div className="input-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="กรุณากรอกรหัสผ่าน"
            autoComplete="current-password"
            {...register('password', {
              required: 'กรุณากรอกรหัสผ่าน',
              minLength: {
                value: 6,
                message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
              }
            })}
          />
          <button
            type="button"
            className="password-toggle"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
          >
            <img
              src={showPassword
                ? 'https://cdn-icons-png.flaticon.com/512/2767/2767194.png'
                : 'https://cdn-icons-png.flaticon.com/512/2767/2767146.png'}
              alt="Toggle password"
            />
          </button>
        </div>
        <p className="error-text">{errors.password?.message || ''}</p>
      </div>
      <div className="form-options">
        <div className="remember-me">
          <label className="switch">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
            />
            <span className="slider round"></span>
          </label>
          <span className="remember-text">จดจำการเข้าสู่ระบบ</span>
        </div>
        <a href="/forgot-password" className="forgot-password">ลืมรหัสผ่าน?</a>
      </div>
      <button type="submit" className="login-button" disabled={isSubmitting}>
        {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
      </button>
    </form>
  )
}

export default LoginForm