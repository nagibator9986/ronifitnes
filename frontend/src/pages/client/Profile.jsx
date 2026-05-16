import { useState } from 'react'
import { useAuth } from '../../auth'
import api from '../../api'

export default function ClientProfile() {
  const { user, logout } = useAuth()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const change = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    setMsg(''); setErr(''); setBusy(true)
    try {
      await api.post('/auth/change-password', {
        old_password: fd.get('old'),
        new_password: fd.get('new'),
      })
      setMsg('Пароль обновлён')
      e.target.reset()
    } catch (e) {
      setErr(e.response?.data?.error || 'Ошибка')
    } finally { setBusy(false) }
  }

  return (
    <div className="container" style={{ maxWidth: 600 }}>
      <h1 className="mb-16">Профиль</h1>

      <div className="card card-lg mb-16">
        <div className="flex items-center gap-16 mb-16">
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: 'white' }}>
            {(user.full_name || '?')[0].toUpperCase()}
          </div>
          <div>
            <h3 style={{ margin: 0 }}>{user.full_name}</h3>
            <div className="text-muted">{user.username} · {user.role === 'admin' ? 'администратор' : user.role === 'trainer' ? 'тренер' : 'клиент'}</div>
          </div>
        </div>
        {user.email && <div className="text-muted">📧 {user.email}</div>}
        {user.phone && <div className="text-muted">📞 {user.phone}</div>}
      </div>

      <div className="card card-lg mb-16">
        <h3>Смена пароля</h3>
        {msg && <div className="success">{msg}</div>}
        {err && <div className="error">{err}</div>}
        <form onSubmit={change}>
          <div className="field">
            <label>Текущий пароль</label>
            <input className="input" type="password" name="old" required />
          </div>
          <div className="field">
            <label>Новый пароль</label>
            <input className="input" type="password" name="new" required minLength={4} />
          </div>
          <button className="btn" disabled={busy}>{busy ? 'Сохраняем…' : 'Обновить пароль'}</button>
        </form>
      </div>

      <button className="btn btn-ghost btn-block" onClick={logout}>Выйти из аккаунта</button>
    </div>
  )
}
