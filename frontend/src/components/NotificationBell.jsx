import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function NotificationBell() {
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const nav = useNavigate()

  const load = () => api.get('/notifications').then((r) => {
    setItems(r.data.items)
    setUnread(r.data.unread)
  }).catch(() => {})

  useEffect(() => {
    load()
    const id = setInterval(load, 20000)
    const click = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('click', click)
    return () => { clearInterval(id); document.removeEventListener('click', click) }
  }, [])

  const click = async (n) => {
    if (!n.is_read) {
      await api.post(`/notifications/${n.id}/read`)
    }
    if (n.link) {
      nav(n.link)
    }
    setOpen(false)
    load()
  }

  const readAll = async () => {
    await api.post('/notifications/read-all')
    load()
  }

  return (
    <div ref={ref} className="notif-wrap">
      <button className="notif-btn" onClick={() => setOpen((o) => !o)} aria-label="notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>
        {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-head">
            <strong>Уведомления</strong>
            {unread > 0 && <button className="btn btn-ghost btn-sm" onClick={readAll}>Прочитать все</button>}
          </div>
          <div className="notif-list">
            {items.length === 0 ? (
              <div className="text-muted text-center" style={{ padding: 30 }}>Пока пусто</div>
            ) : items.map((n) => (
              <button key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`} onClick={() => click(n)}>
                <div className="notif-dot" />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: n.is_read ? 500 : 700, fontSize: 14 }}>{n.title}</div>
                  {n.body && <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>{n.body}</div>}
                  <div className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>{new Date(n.created_at).toLocaleString('ru-RU')}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
