import { useEffect, useRef, useState } from 'react'
import api from '../../api'
import { useAuth } from '../../auth'
import { Spinner, EmptyState, formatTime } from '../../components/common'

export default function ClientChat() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState([])
  const [other, setOther] = useState(null)
  const [msgs, setMsgs] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const endRef = useRef(null)

  useEffect(() => {
    (async () => {
      if (user.role === 'client') {
        const r = await api.get('/auth/me')
        if (r.data.trainer_id) {
          // get trainer info via admin list… or just use trainer_id
          setOther({ id: r.data.trainer_id, full_name: 'Тренер' })
        }
      } else if (user.role === 'trainer') {
        const r = await api.get('/trainer/clients')
        setContacts(r.data)
        if (r.data[0]) setOther(r.data[0])
      } else {
        const r = await api.get('/admin/users?role=trainer')
        setContacts(r.data)
        if (r.data[0]) setOther(r.data[0])
      }
      setLoading(false)
    })()
  }, [user])

  useEffect(() => {
    if (!other) return
    api.get(`/trainer/messages/${other.id}`).then((r) => setMsgs(r.data))
    const id = setInterval(() => {
      api.get(`/trainer/messages/${other.id}`).then((r) => setMsgs(r.data))
    }, 5000)
    return () => clearInterval(id)
  }, [other])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim() || !other) return
    const t = text
    setText('')
    const { data } = await api.post(`/trainer/messages/${other.id}`, { content: t })
    setMsgs((m) => [...m, data])
  }

  if (loading) return <div className="container"><Spinner /></div>

  if (!other) return (
    <div className="container">
      <EmptyState icon="💬" title="Нет собеседника" hint="Свяжитесь с тренером другим способом." />
    </div>
  )

  return (
    <div className="container">
      <h1 className="mb-16">Чат</h1>
      <div className="grid" style={{ gridTemplateColumns: contacts.length ? '260px 1fr' : '1fr', gap: 16 }}>
        {contacts.length > 0 && (
          <div className="card" style={{ padding: 8 }}>
            {contacts.map((c) => (
              <button key={c.id}
                onClick={() => setOther(c)}
                style={{
                  width: '100%', textAlign: 'left', padding: '12px 14px',
                  background: other?.id === c.id ? 'var(--brand-soft)' : 'transparent',
                  border: 0, borderRadius: 10, color: 'inherit', cursor: 'pointer',
                  fontSize: 14, marginBottom: 4,
                }}>
                {c.full_name}
              </button>
            ))}
          </div>
        )}
        <div className="chat-shell">
          <div className="chat-body">
            {msgs.length === 0 && <div className="text-muted text-center" style={{ marginTop: 'auto', marginBottom: 'auto' }}>Здесь пока пусто — напишите первое сообщение</div>}
            {msgs.map((m) => (
              <div key={m.id} className={`chat-bubble ${m.sender_id === user.id ? 'mine' : ''}`}>
                <div>{m.content}</div>
                <span className="time">{formatTime(m.sent_at)}</span>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form className="chat-input" onSubmit={send}>
            <input className="input" placeholder="Сообщение…" value={text} onChange={(e) => setText(e.target.value)} />
            <button className="btn">Отправить</button>
          </form>
        </div>
      </div>
    </div>
  )
}
