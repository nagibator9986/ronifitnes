import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth'
import api from '../api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [heroImg, setHeroImg] = useState(null)
  const nav = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    api.get('/public/landing').then((r) => {
      if (r.data.gallery?.[0]) setHeroImg(r.data.gallery[0].file_url)
    }).catch(() => {})
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      const u = await login(username.trim(), password)
      if (u.role === 'admin') nav('/admin')
      else if (u.role === 'trainer') nav('/trainer')
      else if (u.needs_questionnaire) nav('/onboarding')
      else nav('/app')
    } catch (e) {
      setErr(e.response?.data?.error || 'Не удалось войти')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-side">
        {heroImg && <img src={heroImg} alt="" />}
        <div className="auth-quote">
          ДИСЦИПЛИНА.<br />СИЛА.<br /><span style={{ color: '#fff', WebkitTextStroke: '1px #fff', WebkitTextFillColor: 'transparent' }}>RONI.</span>
        </div>
      </div>
      <div className="auth-form">
        <div className="auth-card">
          <Link to="/" className="brand-logo">
            <span className="dot" />
            <span className="accent">RONI</span>
            <span>FITNESS</span>
          </Link>
          <h2>Вход в кабинет</h2>
          <p className="text-muted mb-24">Используйте логин и пароль, выданные тренером.</p>

          {err && <div className="error">{err}</div>}

          <form onSubmit={submit}>
            <div className="field">
              <label>Логин</label>
              <input className="input" autoFocus value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="field">
              <label>Пароль</label>
              <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-block" disabled={busy}>{busy ? 'Входим…' : 'Войти'}</button>
          </form>

          <div className="card mt-24" style={{ background: 'transparent', borderStyle: 'dashed' }}>
            <div className="text-muted" style={{ fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>Демо доступы</div>
            <div style={{ fontSize: 13, lineHeight: 1.7 }}>
              <div><strong>admin</strong> / admin123 — администратор</div>
              <div><strong>ruslan</strong> / ruslan123 — тренер</div>
              <div><strong>demo</strong> / demo123 — клиент с планом</div>
              <div><strong>newclient</strong> / new123 — новый клиент (анкета)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
