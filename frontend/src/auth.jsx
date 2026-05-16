import { createContext, useContext, useEffect, useState } from 'react'
import api, { TOKEN_KEY } from './api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY)
    if (!t) {
      setLoading(false)
      return
    }
    api.get('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false))
  }, [])

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password })
    localStorage.setItem(TOKEN_KEY, data.access_token)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
    location.href = '/'
  }

  const refresh = async () => {
    const { data } = await api.get('/auth/me')
    setUser(data)
    return data
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, refresh, setUser }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
