import { createContext, useContext, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { api, TOKEN_KEY } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false))
  }, [])

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password })
    localStorage.setItem(TOKEN_KEY, res.data.access_token)
    setUser(res.data.user)
    return res.data.user
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

export function RequireAdmin({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    )
  }
  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" replace />
  return children
}
