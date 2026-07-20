import axios from 'axios'

export const TOKEN_KEY = 'ia_token'

export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    const onAdminPage = window.location.pathname.startsWith('/admin')
    if (status === 401 && onAdminPage && !window.location.pathname.includes('/login')) {
      localStorage.removeItem(TOKEN_KEY)
      window.location.href = '/admin/login'
    }
    return Promise.reject(err)
  },
)

export function apiError(err, fallback = 'Что-то пошло не так, попробуйте ещё раз') {
  return err?.response?.data?.error || fallback
}
