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
      setError('You must agree to the Terms & Conditions')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      const success = await registerUser(data)
      if (success) {
        navigate('/login')
      } else {
        setError('Sorry, something went wrong. Please try again.')
      }
    } catch (err) {
      // Check for duplicate email error from backend
      const msg = err?.response?.data?.error || ''
      if (msg.toLowerCase().includes('email already exists')) {
        setError('This email is already in use.')
      } else {
        setError('Sorry, something went wrong. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="create-account-form">
      <h2>Create Account</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            {...register('name', {
              required: 'Username is required',
              minLength: { value: 2, message: 'Username must be at least 2 characters' }
            })}
          />
          {errors.name && <p className="error-text">{errors.name.message}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Please enter a valid email' }
            })}
          />
          {errors.email && <p className="error-text">{errors.email.message}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <div className="input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' }
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
          <label className="form-label">Confirm Password</label>
          <div className="input-wrapper">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Enter your confirm password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: value => value === password || 'Passwords do not match'
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
            <span className="terms-text">I agree to the Terms & Conditions</span>
          </div>
        </div>
        <button type="submit" className="create-account-button" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Create Account'}
        </button>
      </Form>
    </div>
  )
}

export default RegisterForm