import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Form, Button, Alert, Spinner } from 'react-bootstrap'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'

const RegisterForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors }, watch } = useForm()
  const password = watch('password', '')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)

  const onSubmit = async (data) => {
    if (!agreeTerms) {
      setError('คุณต้องยินยอมการสร้างบัญชี')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      const success = await registerUser(data)
      if (success) {
        navigate('/login')
      } else {
        setError('ขออภัย มีข้อผิดพลาดเกิดขึ้น กรุณาลองใหม่อีกครั้ง')
      }
    } catch (err) {
      // Check for duplicate email error from backend
      const msg = err?.response?.data?.error || ''
      if (msg.toLowerCase().includes('email already exists')) {
        setError('อีเมลนี้ถูกใช้งานแล้ว')
      } else {
        setError('ขออภัย มีข้อผิดพลาดเกิดขึ้น กรุณาลองใหม่อีกครั้ง')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="create-account-form">
      <h2>สร้างบัญชี</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label className="form-label">ชื่อผู้ใช้</label>
          <input
            type="text"
            placeholder="กรุณากรอกชื่อผู้ใช้"
            {...register('name', {
              required: 'กรุณากรอกชื่อผู้ใช้',
              minLength: { value: 2, message: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 2 ตัวอักษร' }
            })}
          />
          {errors.name && <p className="error-text">{errors.name.message}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">อีเมล</label>
          <input
            type="email"
            placeholder="กรุณากรอกอีเมล"
            {...register('email', {
              required: 'กรุณากรอกอีเมล',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'กรุณากรอกอีเมลที่ถูกต้อง' }
            })}
          />
          {errors.email && <p className="error-text">{errors.email.message}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">รหัสผ่าน</label>
          <div className="input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="กรุณากรอกรหัสผ่าน"
              {...register('password', {
                required: 'กรุณากรอกรหัสผ่าน',
                minLength: { value: 6, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }
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
        <div className="form-group">
          <label className="form-label">ยืนยันรหัสผ่าน</label>
          <div className="input-wrapper">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="กรุณายืนยันรหัสผ่าน"
              {...register('confirmPassword', {
                required: 'กรุณายืนยันรหัสผ่าน',
                validate: value => value === password || 'รหัสผ่านไม่ตรงกัน'
              })}
            />
            <button
              type="button"
              className="password-toggle"
              tabIndex={-1}
              onClick={() => setShowConfirmPassword((v) => !v)}
            >
              <img
                src={showConfirmPassword
                  ? 'https://cdn-icons-png.flaticon.com/512/2767/2767194.png'
                  : 'https://cdn-icons-png.flaticon.com/512/2767/2767146.png'}
                alt="Toggle password"
              />
            </button>
          </div>
          <p className="error-text">{errors.confirmPassword?.message || ''}</p>
        </div>
        <div className="form-options">
          <div className="terms-check">
            <label className="switch">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={e => setAgreeTerms(e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
            <span className="terms-text">ยินยอมการสร้างบัญชี</span>
          </div>
        </div>
        <button type="submit" className="create-account-button" disabled={isSubmitting}>
          {isSubmitting ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชี'}
        </button>
      </Form>
    </div>
  )
}

export default RegisterForm