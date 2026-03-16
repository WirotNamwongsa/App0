import axios from 'axios'
import toast from 'react-hot-toast'
 
const isProd = window.location.hostname !== 'localhost'
const BASE = isProd ? 'https://baby-tiger.onrender.com' : ''
 
const api = axios.create({ 
  baseURL: BASE + '/api'
})
 
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
 
api.interceptors.response.use(
  r => r.data,
  err => {
    const msg = err.response?.data?.error || 'เกิดข้อผิดพลาด'
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    toast.error(msg)
    return Promise.reject(err)
  }
)


export default api