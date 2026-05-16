import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import { Spinner, EmptyState, formatDate } from '../../components/common'
import { useToast } from '../../components/Toast'
import Modal from '../../components/Modal'

export default function TrainerClients() {
  const [clients, setClients] = useState(null)
  const [open, setOpen] = useState(false)
  const [created, setCreated] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [search, setSearch] = useState('')
  const toast = useToast()

  const load = () => api.get('/trainer/clients').then((r) => setClients(r.data))
  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    const fd = Object.fromEntries(new FormData(e.target).entries())
    setBusy(true); setErr('')
    try {
      const { data } = await api.post('/trainer/clients', {
        full_name: fd.full_name,
        email: fd.email || null,
        phone: fd.phone || null,
        needs_questionnaire: fd.needs_q === 'on',
      })
      setCreated(data)
      toast.success('Клиент создан', `${data.username} / ${data.password}`)
      await load()
      e.target.reset()
    } catch (e) {
      const msg = e.response?.data?.error || 'Ошибка'
      setErr(msg)
      toast.error('Ошибка', msg)
    } finally { setBusy(false) }
  }

  const filtered = useMemo(() => (clients || []).filter((c) =>
    !search || `${c.full_name} ${c.username}`.toLowerCase().includes(search.toLowerCase())
  ), [clients, search])

  if (!clients) return <div className="container"><Spinner /></div>

  return (
    <div className="container">
      <div className="section-title">
        <div>
          <span className="chip brand">{clients.length} {clients.length === 1 ? 'клиент' : 'клиентов'}</span>
          <h1 className="mt-8">Мои клиенты</h1>
        </div>
        <button className="btn" onClick={() => { setOpen(true); setCreated(null) }}>+ Новый клиент</button>
      </div>

      <input className="input mb-16" placeholder="🔍 Поиск по клиентам..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 400 }} />

      {clients.length === 0 ? (
        <EmptyState icon="👥" title="Пока нет клиентов" hint="Нажмите «Новый клиент», чтобы добавить" />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="Ничего не найдено" />
      ) : (
        <div className="grid grid-3">
          {filtered.map((c) => (
            <Link to={`/trainer/clients/${c.id}`} key={c.id} className="card card-hover">
              <div className="flex gap-12 items-center mb-16">
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'white' }}>
                  {(c.full_name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>{c.full_name}</h3>
                  <div className="text-muted" style={{ fontSize: 13 }}>{c.username}</div>
                </div>
              </div>
              <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
                {c.needs_questionnaire && <span className="chip" style={{ color: 'var(--warn)', borderColor: 'var(--warn)' }}>анкета ждёт</span>}
                {!c.is_active && <span className="chip" style={{ color: 'var(--muted)' }}>деактивирован</span>}
                <span className="chip">с {formatDate(c.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => { setOpen(false); setCreated(null) }} title={created ? 'Клиент создан' : 'Новый клиент'}>
        {created ? (
          <div>
            <div className="success">Клиент <strong>{created.full_name}</strong> создан. Передайте ему доступы:</div>
            <div className="credentials-box mt-16">
              <div className="row">
                <span>Логин:</span><strong>{created.username}</strong>
              </div>
              <div className="row">
                <span>Пароль:</span><strong>{created.password}</strong>
              </div>
            </div>
            <button className="btn btn-block mt-16" onClick={() => { setCreated(null) }}>Создать ещё одного</button>
            <button className="btn btn-ghost btn-block mt-8" onClick={() => { setOpen(false); setCreated(null) }}>Закрыть</button>
          </div>
        ) : (
          <form onSubmit={create}>
            {err && <div className="error">{err}</div>}
            <div className="field">
              <label>ФИО клиента *</label>
              <input className="input" name="full_name" required placeholder="Иван Иванов" />
            </div>
            <div className="field">
              <label>Email (опционально)</label>
              <input className="input" type="email" name="email" />
            </div>
            <div className="field">
              <label>Телефон (опционально)</label>
              <input className="input" name="phone" />
            </div>
            <label className="flex items-center gap-8 mb-16" style={{ cursor: 'pointer' }}>
              <input type="checkbox" name="needs_q" defaultChecked /> Новый клиент — показать анкету при первом входе
            </label>
            <p className="text-muted" style={{ fontSize: 13 }}>Логин и пароль сгенерируются автоматически — они показаны на следующем шаге.</p>
            <button className="btn btn-block" disabled={busy}>{busy ? 'Создаём…' : 'Создать клиента'}</button>
          </form>
        )}
      </Modal>
    </div>
  )
}
