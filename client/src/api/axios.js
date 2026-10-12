import axios from 'axios'

axios.defaults.withCredentials = true

// ── API Base URL ──────────────────────────────────────────────────────────────
// Production backend is always https://omni-mart-f6k9.vercel.app/api/v1
// VITE_API_URL in Vercel dashboard overrides this if set (takes priority)
const PRODUCTION_BACKEND = 'https://omni-mart-f6k9.vercel.app/api/v1'
const resolvedBaseURL = import.meta.env.VITE_API_URL || PRODUCTION_BACKEND

// Boot log — visible in browser devtools so you can confirm which URL is active
if (import.meta.env.DEV) {
  console.log('[OmniMart API] baseURL:', resolvedBaseURL)
}

const api = axios.create({
  baseURL: resolvedBaseURL,
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
