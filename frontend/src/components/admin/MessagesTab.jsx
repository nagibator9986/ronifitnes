import { useEffect, useState } from 'react'

import { api, apiError } from '../../api'
import Icon from '../Icon'

export default function MessagesTab({ onChanged }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  const load = () => {
    api
      .get('/admin/messages')
      .then((res) => setItems(res.data.items))
      .catch((err) => setError(apiError(err)))
  }

  useEffect(load, [])

  const toggleRead = async (m) => {
    await api.put(`/admin/messages/${m.id}/read`)
    load()
    onChanged?.()
  }

  const remove = async (m) => {
    if (!window.confirm(`Удалить заявку от «${m.name}»?`)) return
    await api.delete(`/admin/messages/${m.id}`)
    load()
    onChanged?.()
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Заявки</h1>
          <p>Обращения из формы «Обсудить проект» на лендинге</p>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
      {items === null && <div className="spinner" />}
      {items?.length === 0 && <p style={{ color: 'var(--muted)' }}>Заявок пока нет.</p>}

      {items?.map((m) => (
        <article className={`card msg-card ${m.is_read ? '' : 'unread'}`} key={m.id}>
          <div className="msg-head">
            <b>{m.name}</b>
            {m.company && <span className="chip">{m.company}</span>}
            {!m.is_read && (
              <span className="chip" style={{ color: 'var(--bone)', borderColor: 'var(--s-line-strong)' }}>
                новая
              </span>
            )}
            <time>{m.created_at ? new Date(m.created_at).toLocaleString('ru-RU') : ''}</time>
          </div>
          <div className="msg-contacts">
            {m.email && <a href={`mailto:${m.email}`}>{m.email}</a>}
            {m.phone && <a href={`tel:${m.phone.replace(/[^+\d]/g, '')}`}>{m.phone}</a>}
          </div>
          <p>{m.message}</p>
          <div className="msg-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => toggleRead(m)}>
              <Icon name="eye" size={15} /> {m.is_read ? 'Отметить непрочитанной' : 'Прочитано'}
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => remove(m)}>
              <Icon name="trash" size={15} /> Удалить
            </button>
          </div>
        </article>
      ))}
    </>
  )
}
