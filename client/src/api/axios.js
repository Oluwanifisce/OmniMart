import axios from 'axios'

axios.defaults.withCredentials = true

// ── API Base URL ──────────────────────────────────────────────────────────────
// Development:  Vite proxy intercepts '/api/v1' and forwards to localhost:5000
// Production:   VITE_API_URL must be set in Vercel/hosting env vars
//               e.g. https://omnimart-api.onrender.com/api/v1
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://omni-mart-f6k9.vercel.app/api/v1',
  timeout: 15000,
  withCredentials: true,
})

// ── Request interceptor — auto-attach JWT token and carry cross-origin cookies
api.interceptors.request.use((config) => {
  config.withCredentials = true
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // For file uploads (FormData), let browser set Content-Type automatically
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

// ── Response interceptor — auto-logout on 401 (token expired)
api.interceptors.response.use(
  (response) => response,   // success: pass through as-is
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
