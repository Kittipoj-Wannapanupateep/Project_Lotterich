import axios from 'axios'
import { API_URL } from '../config/constants'

const api = axios.create({
  baseURL: API_URL,
  timeout: 5000
})

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

export const getCollection = async () => {
  const res = await api.get('/collection')
  return res.data.collection
}

export const addCollection = async (data) => {
  // Format data to match backend model
  const formattedData = {
    ticketNumber: data.ticketNumber,
    ticketQuantity: parseInt(data.ticketQuantity),
    ticketAmount: parseInt(data.ticketAmount),
    date: new Date(data.date).toISOString(), // Format date to ISO string
    prizeResult: data.prizeResult,
    prizeType: data.prizeResult === 'yes' ? data.prizeType : '',
    prizeAmount: parseInt(data.prizeAmount) || 0,
    ticketWinning: data.ticketWinning && data.ticketWinning.trim() !== '' ? data.ticketWinning : ''
  }
  const res = await api.post('/collection', formattedData)
  return res.data
}

export const updateCollection = async (id, data) => {
  // Format data to match backend model
  const formattedData = {
    ticketNumber: data.ticketNumber,
    ticketQuantity: parseInt(data.ticketQuantity),
    ticketAmount: parseInt(data.ticketAmount),
    date: new Date(data.date).toISOString(), // Format date to ISO string
    prizeResult: data.prizeResult,
    prizeType: data.prizeResult === 'yes' ? data.prizeType : '',
    prizeAmount: parseInt(data.prizeAmount) || 0,
    ticketWinning: data.ticketWinning && data.ticketWinning.trim() !== '' ? data.ticketWinning : ''
  }
  const res = await api.put(`/collection/${id}`, formattedData)
  return res.data
}

export const deleteCollection = async (id) => {
  const res = await api.delete(`/collection/${id}`)
  return res.data
} 