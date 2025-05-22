import axios from 'axios'
import { API_URL } from '../config/constants'

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  timeout: 5000
})

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Connection timeout. Please check if the backend server is running.')
    }
    if (!error.response) {
      throw new Error('Network error. Please check your internet connection and if the backend server is running.')
    }
    throw error
  }
)

const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials)
    return response.data
  } catch (error) {
    console.error('Login error:', error)
    if (error.response) {
      throw new Error(error.response.data.error || 'Login failed. Please check your credentials.')
    }
    throw error
  }
}

const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData)
    return {
      success: true,
      message: response.data.message
    }
  } catch (error) {
    console.error('Registration error:', error)
    if (error.response) {
      throw new Error(error.response.data.error || 'Registration failed. Please try again.')
    }
    throw error
  }
}

const getProfile = async () => {
  try {
    const response = await api.get('/users/me')
    return response.data
  } catch (error) {
    console.error('Get profile error:', error)
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch profile.')
    }
    throw error
  }
}

const updateProfile = async (data) => {
  try {
    const response = await api.patch('/users/me', data)
    return response.data
  } catch (error) {
    console.error('Update profile error:', error)
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to update profile.')
    }
    throw error
  }
}

const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.post('/users/change-password', {
      currentPassword,
      newPassword
    })
    return response.data
  } catch (error) {
    console.error('Change password error:', error)
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to change password.')
    }
    throw error
  }
}

const deleteAccount = async (currentPassword) => {
  try {
    const response = await api.delete('/users/me', {
      data: { currentPassword }
    })
    return response.data
  } catch (error) {
    console.error('Delete account error:', error)
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to delete account.')
    }
    throw error
  }
}

// Add token to axios requests
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

export default {
  login,
  register,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount
}