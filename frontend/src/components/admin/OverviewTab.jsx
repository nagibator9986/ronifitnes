import { useEffect, useState } from 'react'

import { api } from '../../api'

const CARDS = [
  { key: 'projects', label: 'Проектов в портфолио' },
  { key: 'partners', label: 'Компаний-партнёров' },
  { key: 'services', label: 'Услуг на сайте' },
  { key: 'unread_messages', label: 'Непрочитанных заявок' },
]

export default function OverviewTab({ onOpenMessages }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/admin/overview').then((res) => setData(res.data))
  }, [])

  if (!data) return <div className="spinner" />

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Обзор</h1>
          <p>Состояние сайта IlluminartAI на текущий момент</p>
        </div>
      </div>

      <div className="admin-stats">
        {CARDS.map((c) => (
          <div className="card admin-stat" key={c.key}>
            <div className="v grad-text">{data[c.key]}</div>
            <div className="l">{c.label}</div>
          </div>
        ))}
      </div>

      <section>
        <div className="admin-head" style={{ marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.1rem' }}>Последние заявки</h1>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onOpenMessages}>
            Все заявки
          </button>
        </div>
        {data.latest_messages.length === 0 && (
          <p style={{ color: 'var(--muted)' }}>Заявок пока нет.</p>
        )}
        {data.latest_messages.map((m) => (
          <article className={`card msg-card ${m.is_read ? '' : 'unread'}`} key={m.id}>
            <div className="msg-head">
              <b>{m.name}</b>
              {m.company && <span className="chip">{m.company}</span>}
              <time>{m.created_at ? new Date(m.created_at).toLocaleString('ru-RU') : ''}</time>
            </div>
            <p>{m.message.length > 220 ? `${m.message.slice(0, 220)}…` : m.message}</p>
          </article>
        ))}
      </section>
    </>
  )
}
