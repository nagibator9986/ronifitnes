import { useEffect, useState } from 'react'
import api from '../../api'
import { Spinner, EmptyState, DOW_RU, DOW_RU_FULL, DOW_KEYS } from '../../components/common'
import { useToast } from '../../components/Toast'
import Modal from '../../components/Modal'

const KIND_LABEL = {
  training: { label: 'Тренировка', icon: '🏋️', color: 'brand' },
  group: { label: 'Группа', icon: '👥', color: 'info' },
  personal: { label: 'Личное', icon: '⭐', color: 'warn' },
  block: { label: 'Слот', icon: '⏳', color: 'muted' },
}

export default function TrainerSchedule() {
  const [tab, setTab] = useState('week')
  const [week, setWeek] = useState(null)
  const [today, setToday] = useState(null)
  const [clients, setClients] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const toast = useToast()

  const computeStart = (offset) => {
    const now = new Date()
    const day = now.getDay() === 0 ? 6 : now.getDay() - 1
    const monday = new Date(now)
    monday.setDate(now.getDate() - day + offset * 7)
    return monday.toISOString().slice(0, 10)
  }

  const load = async () => {
    const start = computeStart(weekOffset)
    const [w, t, c] = await Promise.all([
      api.get(`/trainer/schedule/week?start=${start}`),
      api.get('/trainer/schedule/today'),
      api.get('/trainer/clients'),
    ])
    setWeek(w.data); setToday(t.data); setClients(c.data)
  }
  useEffect(() => { load() }, [weekOffset])

  const save = async (e) => {
    e.preventDefault()
    const fd = Object.fromEntries(new FormData(e.target).entries())
    const payload = {
      title: fd.title,
      kind: fd.kind,
      client_id: fd.client_id ? Number(fd.client_id) : null,
      start_time: fd.start_time,
      duration_min: Number(fd.duration_min || 60),
      location: fd.location || null,
      notes: fd.notes || null,
    }
    if (fd.mode === 'recurring') {
      payload.day_of_week = Number(fd.day_of_week)
      payload.event_date = null
    } else {
      payload.event_date = fd.event_date
      payload.day_of_week = null
    }
    try {
      if (editing) await api.patch(`/trainer/schedule/${editing.id}`, payload)
      else await api.post('/trainer/schedule', payload)
      toast.success(editing ? 'Обновлено' : 'Событие добавлено')
      setModalOpen(false); setEditing(null)
      load()
    } catch (err) {
      toast.error('Ошибка', err.response?.data?.error)
    }
  }

  const remove = async (id) => {
    if (!confirm('Удалить событие?')) return
    await api.delete(`/trainer/schedule/${id}`)
    toast.info('Удалено')
    load()
  }

  if (!week || !today) return <div className="container"><Spinner /></div>

  return (
    <div className="container">
      <div className="section-title">
        <div>
          <h1 style={{ margin: 0 }}>📅 Расписание</h1>
          <p className="text-muted" style={{ margin: 0 }}>Тренировки клиентов, групповые занятия и личные блоки</p>
        </div>
        <button className="btn" onClick={() => { setEditing(null); setModalOpen(true) }}>+ Новое событие</button>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'week' ? 'active' : ''}`} onClick={() => setTab('week')}>🗓 Неделя</button>
        <button className={`tab ${tab === 'today' ? 'active' : ''}`} onClick={() => setTab('today')}>📍 Сегодня</button>
      </div>

      {tab === 'today' && (
        <div className="card card-lg">
          <div className="section-title">
            <div>
              <h3 style={{ margin: 0 }}>{new Date(today.date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
              <div className="text-muted">{today.items.length} событий</div>
            </div>
            <span className="chip brand">{today.items.length}</span>
          </div>
          {today.items.length === 0 ? (
            <EmptyState icon="🌴" title="Сегодня свободно" hint="Можете отдохнуть или добавить событие" />
          ) : (
            <div className="flex flex-col gap-12">
              {today.items.map((it, i) => <EventCard key={`${it.id}-${i}`} ev={it} onEdit={() => { setEditing(it); setModalOpen(true) }} onDelete={() => remove(it.id)} />)}
            </div>
          )}
        </div>
      )}

      {tab === 'week' && (
        <>
          <div className="flex justify-between items-center mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(weekOffset - 1)}>← Прошлая</button>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '.06em' }}>
              {new Date(week.start).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            </strong>
            <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(weekOffset + 1)}>Следующая →</button>
          </div>
          <div className="schedule-grid">
            {week.days.map((d) => (
              <div key={d.date} className={`schedule-col ${d.is_today ? 'is-today' : ''}`}>
                <div className="schedule-col-head">
                  <div className="dow">{DOW_RU[d.day_of_week]}</div>
                  <div className="date-num">{new Date(d.date).getDate()}</div>
                </div>
                <div className="schedule-col-body">
                  {d.items.length === 0 && <div className="text-muted text-center" style={{ fontSize: 11, padding: 12 }}>пусто</div>}
                  {d.items.map((it, i) => (
                    <button key={`${it.id}-${i}`}
                      className={`sched-pill kind-${it.kind}`}
                      onClick={() => { if (!it.auto) { setEditing(it); setModalOpen(true) } }}>
                      <div className="time">{it.start_time}</div>
                      <div className="title">{it.title}</div>
                      {it.client_name && <div className="who">👤 {it.client_name}</div>}
                      {it.auto && <div className="autotag">из программы</div>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? 'Редактировать событие' : 'Новое событие'}>
        <form onSubmit={save} key={editing?.id || 'new'}>
          <div className="field"><label>Название *</label><input className="input" name="title" required defaultValue={editing?.title || ''} placeholder="Тренировка / встреча / блок" /></div>
          <div className="row-fields">
            <div className="field">
              <label>Тип</label>
              <select className="select" name="kind" defaultValue={editing?.kind || 'training'}>
                <option value="training">🏋️ Тренировка</option>
                <option value="group">👥 Групповая</option>
                <option value="personal">⭐ Личное</option>
                <option value="block">⏳ Открытый слот</option>
              </select>
            </div>
            <div className="field">
              <label>Клиент (опц.)</label>
              <select className="select" name="client_id" defaultValue={editing?.client_id || ''}>
                <option value="">—</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Повторяемость</label>
            <div className="flex gap-8">
              <label className="chip" style={{ cursor: 'pointer' }}>
                <input type="radio" name="mode" value="once" defaultChecked={editing?.event_date || !editing} /> Один раз
              </label>
              <label className="chip" style={{ cursor: 'pointer' }}>
                <input type="radio" name="mode" value="recurring" defaultChecked={editing && editing.day_of_week !== null && !editing.event_date} /> Каждую неделю
              </label>
            </div>
          </div>
          <div className="row-fields">
            <div className="field">
              <label>Дата (одноразовое)</label>
              <input className="input" type="date" name="event_date" defaultValue={editing?.event_date || ''} />
            </div>
            <div className="field">
              <label>День недели (повтор)</label>
              <select className="select" name="day_of_week" defaultValue={editing?.day_of_week ?? 0}>
                {DOW_RU_FULL.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="row-fields">
            <div className="field"><label>Время начала *</label><input className="input" type="time" name="start_time" required defaultValue={editing?.start_time || '19:00'} /></div>
            <div className="field"><label>Длительность, мин</label><input className="input" type="number" name="duration_min" defaultValue={editing?.duration_min || 60} /></div>
          </div>
          <div className="field"><label>Место</label><input className="input" name="location" defaultValue={editing?.location || ''} placeholder="Зал FitArena" /></div>
          <div className="field"><label>Заметка</label><textarea className="textarea" name="notes" defaultValue={editing?.notes || ''} /></div>
          <div className="flex gap-8">
            <button className="btn btn-block">{editing ? 'Сохранить' : 'Добавить'}</button>
            {editing && <button type="button" className="btn btn-danger btn-sm" onClick={() => { remove(editing.id); setModalOpen(false); setEditing(null) }}>×</button>}
          </div>
        </form>
      </Modal>
    </div>
  )
}

function EventCard({ ev, onEdit, onDelete }) {
  const k = KIND_LABEL[ev.kind] || KIND_LABEL.training
  return (
    <div className={`event-card kind-${ev.kind}`}>
      <div className="time-block">
        <div className="time">{ev.start_time}</div>
        <div className="dur">{ev.duration_min}мин</div>
      </div>
      <div style={{ flex: 1 }}>
        <div className="flex gap-8 items-center" style={{ flexWrap: 'wrap' }}>
          <strong>{ev.title}</strong>
          <span className="chip">{k.icon} {k.label}</span>
        </div>
        <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
          {ev.client_name && <>👤 {ev.client_name}</>}
          {ev.location && <> · 📍 {ev.location}</>}
        </div>
        {ev.notes && <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>{ev.notes}</div>}
      </div>
      {!ev.auto && (
        <div className="flex gap-8">
          <button className="btn btn-ghost btn-sm" onClick={onEdit}>✎</button>
          <button className="btn btn-danger btn-sm" onClick={onDelete}>×</button>
        </div>
      )}
      {ev.auto && <span className="chip" style={{ color: 'var(--muted)' }}>из программы</span>}
    </div>
  )
}
