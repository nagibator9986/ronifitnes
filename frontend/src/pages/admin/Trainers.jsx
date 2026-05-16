import { useEffect, useState } from 'react'
import api from '../../api'
import { Spinner, EmptyState, formatDate } from '../../components/common'
import { useToast } from '../../components/Toast'
import Modal from '../../components/Modal'

export default function AdminTrainers() {
  const [items, setItems] = useState(null)
  const [open, setOpen] = useState(false)
  const [created, setCreated] = useState(null)
  const toast = useToast()

  const load = () => api.get('/admin/trainers-detail').then((r) => setItems(r.data))
  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    const fd = Object.fromEntries(new FormData(e.target).entries())
    try {
      const { data } = await api.post('/admin/users', { role: 'trainer', full_name: fd.full_name, email: fd.email || null, phone: fd.phone || null })
      setCreated(data)
      load()
      toast.success('Тренер создан')
    } catch (e) {
      toast.error('Ошибка', e.response?.data?.error)
    }
  }

  if (!items) return <div className="container"><Spinner /></div>

  return (
    <div className="container">
      <div className="section-title">
        <div>
          <span className="chip brand">{items.length}</span>
          <h1 className="mt-8">Тренеры</h1>
        </div>
        <button className="btn" onClick={() => { setOpen(true); setCreated(null) }}>+ Тренер</button>
      </div>

      {items.length === 0 ? <EmptyState icon="🔥" title="Нет тренеров" /> : (
        <div className="grid grid-2">
          {items.map((t) => (
            <div key={t.id} className="card card-lg">
              <div className="flex gap-12 items-center mb-16">
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: 'white' }}>
                  {t.full_name[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0 }}>{t.full_name}</h3>
                  <div className="text-muted" style={{ fontSize: 13 }}>@{t.username} · с {formatDate(t.created_at)}</div>
                </div>
                <span className="chip" style={{ color: t.is_active ? 'var(--success)' : 'var(--muted)' }}>{t.is_active ? <><span className="dot-pulse" style={{ marginRight: 6 }} />активен</> : 'выключен'}</span>
              </div>
              <div className="grid grid-3">
                <div className="stat" style={{ padding: 10 }}><div className="label">Клиентов</div><div className="value" style={{ fontSize: 20 }}>{t.clients}</div></div>
                <div className="stat" style={{ padding: 10 }}><div className="label">Упр.</div><div className="value" style={{ fontSize: 20 }}>{t.exercises}</div></div>
                <div className="stat" style={{ padding: 10 }}><div className="label">Программ</div><div className="value" style={{ fontSize: 20 }}>{t.active_plans}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => { setOpen(false); setCreated(null) }} title={created ? 'Тренер создан' : 'Новый тренер'}>
        {created ? (
          <>
            <div className="success">Передайте доступы тренеру:</div>
            <div className="credentials-box mt-16">
              <div className="row"><span>Логин:</span><strong>{created.username}</strong></div>
              <div className="row"><span>Пароль:</span><strong>{created.password}</strong></div>
            </div>
            <button className="btn btn-ghost btn-block mt-16" onClick={() => { setOpen(false); setCreated(null) }}>Закрыть</button>
          </>
        ) : (
          <form onSubmit={create}>
            <div className="field"><label>ФИО *</label><input className="input" name="full_name" required /></div>
            <div className="field"><label>Email</label><input className="input" type="email" name="email" /></div>
            <div className="field"><label>Телефон</label><input className="input" name="phone" /></div>
            <button className="btn btn-block">Создать</button>
          </form>
        )}
      </Modal>
    </div>
  )
}
