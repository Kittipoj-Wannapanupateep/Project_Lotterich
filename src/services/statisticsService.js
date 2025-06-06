import { API_URL } from '../config/constants'
import axios from 'axios'

const getAuthHeader = () => {
    const token = localStorage.getItem('token')
    if (!token) {
        throw new Error('No authentication token found')
    }
    return { Authorization: `Bearer ${token}` }
}

export const getLatestStatistics = async () => {
    try {
        const res = await axios.get(`${API_URL}/statistics/latest`, {
            headers: getAuthHeader()
        })
        return res.data
    } catch (error) {
        console.error('Error fetching latest statistics:', error)
        throw error
    }
}

export const getAllStatistics = async () => {
    try {
        const res = await axios.get(`${API_URL}/statistics/all`)
        return res.data
    } catch (error) {
        console.error('Error fetching statistics:', error)
        throw error
    }
}

export const addStatistics = async (data) => {
    try {
        const res = await axios.post(`${API_URL}/admin/statistics`, data, {
            headers: getAuthHeader()
        })
        
        // Check if notification was sent successfully
        if (res.data.notificationError) {
            console.warn('Statistics added but notification failed:', res.data.notificationError)
        }
        
        return res.data
    } catch (error) {
        console.error('Error adding statistics:', error)
        throw error
    }
}

export const updateStatistics = async (id, data) => {
    try {
        const res = await axios.put(`${API_URL}/admin/statistics/${id}`, data, {
            headers: getAuthHeader()
        })
        return res.data
    } catch (error) {
        console.error('Error updating statistics:', error)
        throw error
    }
}

export const deleteStatistics = async (id) => {
    try {
        const res = await axios.delete(`${API_URL}/admin/statistics/${id}`, {
            headers: getAuthHeader()
        })
        return res.data
    } catch (error) {
        console.error('Error deleting statistics:', error)
        throw error
    }
} 