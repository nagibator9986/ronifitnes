import { useEffect, useState } from 'react'
import api from '../../api'
import { Spinner, EmptyState } from '../../components/common'

const ICON = { workout: '🏋️', photo: '📸', questionnaire: '📝' }
const LABEL_COLOR = { workout: 'var(--success)', photo: 'var(--info)', questionnaire: 'var(--warn)' }

export default function AdminActivity() {
  const [items, setItems] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    Promise.all([api.get('/admin/activity'), api.get('/admin/stats')]).then(([a, s]) => {
      setItems(a.data); setStats(s.data)
    })
  }, [])

  if (!items || !stats) return <div className="container"><Spinner /></div>

  return (
    <div className="container">
      <h1 className="mb-16">Активность платформы</h1>

      <div className="grid grid-4 mb-24">
        <div className="stat"><div className="label">Тренеры</div><div className="value">{stats.trainers}</div></div>
        <div className="stat"><div className="label">Клиенты</div><div className="value">{stats.clients}</div></div>
        <div className="stat"><div className="label">Тренировок за неделю</div><div className="value">{stats.workouts_week}</div></div>
        <div className="stat"><div className="label">Всего фото</div><div className="value">{stats.photos_total}</div></div>
      </div>

      <h3 className="mb-16">Лента событий</h3>
      {items.length === 0 ? <EmptyState icon="🌙" title="Пусто" /> : (
        <div className="flex flex-col gap-8">
          {items.map((a, i) => (
            <div key={i} className="card" style={{ padding: 12 }}>
              <div className="flex gap-12 items-center">
                <div style={{ fontSize: 22 }}>{ICON[a.type] || '•'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14 }}><strong>{a.user}</strong> — <span style={{ color: LABEL_COLOR[a.type] }}>{a.label}</span></div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{new Date(a.at).toLocaleString('ru-RU')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
