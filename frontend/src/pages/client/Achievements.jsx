import { useEffect, useState } from 'react'
import api from '../../api'
import { Spinner } from '../../components/common'

export default function ClientAchievements() {
  const [data, setData] = useState(null)
  useEffect(() => { api.get('/client/achievements').then((r) => setData(r.data)) }, [])
  if (!data) return <div className="container"><Spinner /></div>

  const s = data.stats
  const earned = data.achievements.filter((a) => a.earned).length

  return (
    <div className="container">
      <span className="chip brand">{earned} / {data.achievements.length} получено</span>
      <h1 className="mt-8 mb-24">Достижения</h1>

      <div className="grid grid-4 mb-24">
        <div className="stat"><div className="label">Тренировок</div><div className="value">{s.workouts}</div></div>
        <div className="stat"><div className="label">Общий объём</div><div className="value">{s.total_volume_kg >= 1000 ? `${(s.total_volume_kg/1000).toFixed(1)} т` : `${s.total_volume_kg} кг`}</div></div>
        <div className="stat"><div className="label">Серия</div><div className="value">🔥 {s.streak}</div></div>
        <div className="stat"><div className="label">Δ Вес</div><div className="value">{s.weight_change_kg != null ? `${s.weight_change_kg > 0 ? '+' : ''}${s.weight_change_kg} кг` : '—'}</div></div>
      </div>

      <h3 className="mb-16">Бейджи</h3>
      <div className="badge-grid">
        {data.achievements.map((a) => (
          <div key={a.key} className={`badge-tile ${a.earned ? 'earned' : ''}`}>
            <div className="emoji">{a.icon}</div>
            <div className="title">{a.title}</div>
            <div className="bar"><div style={{ width: `${Math.min(100, (a.progress || 0) * 100)}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}
