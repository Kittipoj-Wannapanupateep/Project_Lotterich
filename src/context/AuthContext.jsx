import { createContext, useState, useEffect, useContext } from 'react'
import { jwtDecode } from 'jwt-decode'
import authService from '../services/authService'
import { toast } from 'react-toastify'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async () => {
    try {
      const res = await authService.getProfile()
      if (res && res.user) {
        setUser(res.user)
      }
    } catch (e) {
      console.error('Error fetching profile:', e)
      toast.error('Failed to fetch profile')
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    
    if (token) {
      try {
        const decoded = jwtDecode(token)
        
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token')
          setUser(null)
          toast.error('Session expired. Please login again.')
        } else {
          setUser(decoded)
          fetchProfile()
        }
      } catch (error) {
        console.error('Invalid token', error)
        localStorage.removeItem('token')
        setUser(null)
        toast.error('Invalid session. Please login again.')
      }
    }
    
    setLoading(false)
  }, [])

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials)
      if (response.token) {
        localStorage.setItem('token', response.token)
        setUser({ ...response.user, role: response.user.role })
        await fetchProfile()
        toast.success('Login successful')
        return response.user
      }
      return false
    } catch (error) {
      toast.error(error.message || 'Login failed')
      return false
    }
  }

  const register = async (userData) => {
    try {
      const response = await authService.register(userData)
      
      if (response.success) {
        toast.success('Registration successful')
        return true
      }
      
      return false
    } catch (error) {
      toast.error(error.message || 'Registration failed')
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    toast.success('Logged out successfully')
  }

  const value = {
    user,
    setUser,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    fetchProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}