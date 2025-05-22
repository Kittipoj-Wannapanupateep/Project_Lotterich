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
      <h2 style={{ color: '#ffd700', marginBottom: '2rem', textAlign: 'center', fontWeight: 600 }}>Login</h2>
      {error && <div className="error-text" style={{marginBottom: '1rem'}}>{error}</div>}
      <div className="form-group">
        <label className="form-label">Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          autoComplete="username"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: 'Please enter a valid email'
            }
          })}
        />
        <p className="error-text">{errors.email?.message || ''}</p>
      </div>
      <div className="form-group">
        <label className="form-label">Password</label>
        <div className="input-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            autoComplete="current-password"
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters'
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
          <span className="remember-text">Remember me</span>
        </div>
      </div>
      <button type="submit" className="login-button" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'LOGIN'}
      </button>
    </form>
  )
}

export default LoginForm