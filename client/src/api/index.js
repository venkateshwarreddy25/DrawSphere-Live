import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || '',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wb_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || ''
      // Only auto-logout for pure auth failures (not AI/board routes)
      // AI routes failing with 401 should just show an error, not log the user out
      const isAuthRoute = url.includes('/auth/me') || url.includes('/auth/login') || url.includes('/auth/register')
      if (isAuthRoute) {
        localStorage.removeItem('wb_token')
        localStorage.removeItem('wb_user')
        window.location.href = '/login'
      }
      // For all other 401s (AI, boards, etc.) — just reject the promise
      // The calling component handles the error and shows a toast
    }
    return Promise.reject(err)
  }
)

export default api
