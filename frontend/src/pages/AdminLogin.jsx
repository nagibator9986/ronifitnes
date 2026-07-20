import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { apiError } from '../api'
import { useAuth } from '../auth'
import Logo from '../components/Logo'

export default function AdminLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/admin')
    } catch (err) {
      setError(apiError(err, 'Не удалось войти'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={submit}>
        <Logo />
        <h1>Вход в панель управления</h1>
        <div className="field">
          <label htmlFor="login-user">Логин</label>
          <input
            id="login-user"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="login-pass">Пароль</label>
          <input
            id="login-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary" disabled={loading}>
          {loading ? 'Входим…' : 'Войти'}
        </button>
        <p className="login-hint">Доступ только для администраторов IlluminartAI</p>
      </form>
    </div>
  )
}
