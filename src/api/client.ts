import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach Authorization header from authStore
apiClient.interceptors.request.use(
  (config) => {
    // Lazily import to avoid circular dep at module init time
    // We read directly from localStorage which is the source of truth
    const token = localStorage.getItem('erp_access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor: handle 401 – clear auth and redirect
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Dynamically import to avoid circular dependency
      const { useAuthStore } = await import('../store/authStore')
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default apiClient
