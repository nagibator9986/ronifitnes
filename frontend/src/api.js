import axios from 'axios'

export const TOKEN_KEY = 'rf_token'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem(TOKEN_KEY)
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      if (!location.pathname.startsWith('/login') && location.pathname !== '/') {
        location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export const apiUrl = (path) => path?.startsWith('http') ? path : path

export default api
