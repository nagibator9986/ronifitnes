import { useEffect, useState } from 'react'
import api from '../../api'
import { Spinner, EmptyState, formatDate } from '../../components/common'
import Modal from '../../components/Modal'

export default function AdminUsers() {
  const [users, setUsers] = useState(null)
  const [trainers, setTrainers] = useState([])
  const [stats, setStats] = useState(null)
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [created, setCreated] = useState(null)
  const [editing, setEditing] = useState(null)

  const load = async () => {
    const [u, t, s] = await Promise.all([
      api.get('/admin/users'),
      api.get('/admin/users?role=trainer'),
      api.get('/admin/stats'),
    ])
    setUsers(u.data); setTrainers(t.data); setStats(s.data)
  }
  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    const fd = Object.fromEntries(new FormData(e.target).entries())
    try {
      const { data } = await api.post('/admin/users', {
        full_name: fd.full_name,
        role: fd.role,
        email: fd.email || null,
        phone: fd.phone || null,
        trainer_id: fd.trainer_id ? Number(fd.trainer_id) : null,
        needs_questionnaire: fd.role === 'client',
      })
      setCreated(data)
      await load()
    } catch (e) {
      alert(e.response?.data?.error || 'Ошибка')
    }
  }

  const toggleActive = async (u) => {
    await api.patch(`/admin/users/${u.id}`, { is_active: !u.is_active })
    await load()
  }

  const remove = async (u) => {
    if (!confirm(`Удалить ${u.full_name}?`)) return
    await api.delete(`/admin/users/${u.id}`)
    await load()
  }

  if (!users) return <div className="container"><Spinner /></div>

  const visible = filter === 'all' ? users : users.filter((u) => u.role === filter)

  return (
    <div className="container">
      <div className="section-title">
        <h1>Панель администратора</h1>
        <button className="btn" onClick={() => { setOpen(true); setCreated(null) }}>+ Создать пользователя</button>
      </div>

      <div className="grid grid-3 mb-24">
        <div className="stat"><div className="label">Тренеров</div><div className="value">{stats?.trainers ?? '—'}</div></div>
        <div className="stat"><div className="label">Клиентов</div><div className="value">{stats?.clients ?? '—'}</div></div>
        <div className="stat"><div className="label">Активных</div><div className="value">{stats?.active_clients ?? '—'}</div></div>
      </div>

      <div className="flex gap-8 mb-16" style={{ flexWrap: 'wrap' }}>
        {[['all', 'Все'], ['admin', 'Админы'], ['trainer', 'Тренеры'], ['client', 'Клиенты']].map(([k, l]) => (
          <button key={k} className={`chip ${filter === k ? 'brand' : ''}`} onClick={() => setFilter(k)} style={{ cursor: 'pointer' }}>{l}</button>
        ))}
      </div>

      {visible.length === 0 ? <EmptyState icon="👥" title="Нет пользователей" /> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--bg-elev)', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>Имя</th>
                <th style={{ padding: 12 }}>Логин</th>
                <th style={{ padding: 12 }}>Роль</th>
                <th style={{ padding: 12 }}>Создан</th>
                <th style={{ padding: 12 }}>Статус</th>
                <th style={{ padding: 12 }}></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => (
                <tr key={u.id} style={{ borderTop: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: 12 }}><strong>{u.full_name}</strong></td>
                  <td style={{ padding: 12 }}>{u.username}</td>
                  <td style={{ padding: 12 }}>
                    <span className="chip" style={{ background: u.role === 'admin' ? 'rgba(239,68,68,.15)' : u.role === 'trainer' ? 'var(--brand-soft)' : 'transparent' }}>{u.role}</span>
                  </td>
                  <td style={{ padding: 12, color: 'var(--muted)' }}>{formatDate(u.created_at)}</td>
                  <td style={{ padding: 12 }}>
                    <span className="chip" style={{ color: u.is_active ? 'var(--success)' : 'var(--muted)' }}>{u.is_active ? 'активен' : 'выключен'}</span>
                  </td>
                  <td style={{ padding: 12, textAlign: 'right' }}>
                    <button className="btn btn-soft btn-sm" onClick={() => toggleActive(u)}>{u.is_active ? '⏸' : '▶'}</button>
                    {u.role !== 'admin' && <button className="btn btn-danger btn-sm" onClick={() => remove(u)} style={{ marginLeft: 6 }}>×</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => { setOpen(false); setCreated(null) }} title={created ? 'Пользователь создан' : 'Новый пользователь'}>
        {created ? (
          <div>
            <div className="success">Пользователь <strong>{created.full_name}</strong> создан.</div>
            <div className="credentials-box mt-16">
              <div className="row"><span>Логин:</span><strong>{created.username}</strong></div>
              <div className="row"><span>Пароль:</span><strong>{created.password}</strong></div>
              <div className="row"><span>Роль:</span><strong>{created.role}</strong></div>
            </div>
            <button className="btn btn-ghost btn-block mt-16" onClick={() => { setOpen(false); setCreated(null) }}>Закрыть</button>
          </div>
        ) : (
          <form onSubmit={create}>
            <div className="field"><label>ФИО *</label><input className="input" name="full_name" required /></div>
            <div className="field">
              <label>Роль</label>
              <select className="select" name="role" defaultValue="client" onChange={(e) => setEditing({ role: e.target.value })}>
                <option value="client">Клиент</option>
                <option value="trainer">Тренер</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            {(editing?.role === 'client' || !editing) && (
              <div className="field">
                <label>Тренер</label>
                <select className="select" name="trainer_id">
                  <option value="">Без тренера</option>
                  {trainers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
            )}
            <div className="field"><label>Email</label><input className="input" type="email" name="email" /></div>
            <div className="field"><label>Телефон</label><input className="input" name="phone" /></div>
            <button className="btn btn-block">Создать</button>
          </form>
        )}
      </Modal>
    </div>
  )
}
