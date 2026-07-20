import { useCallback, useEffect, useState } from 'react'

import { api, apiError } from '../../api'
import Icon from '../Icon'
import Modal from '../Modal'
import FormField from './FormField'

/**
 * Универсальная CRUD-вкладка админки (проекты / партнёры / услуги).
 * Конфиг: { endpoint, titleField, fields[], columns[], defaults{} }
 */
export default function CollectionTab({ config }) {
  const { endpoint, title, subtitle, addLabel, fields, columns, defaults, titleField } = config
  const [items, setItems] = useState(null)
  const [editing, setEditing] = useState(null) // null | {} (новый) | item
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    api
      .get(`/admin/${endpoint}`)
      .then((res) => setItems(res.data.items))
      .catch((err) => setError(apiError(err)))
  }, [endpoint])

  useEffect(load, [load])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing.id) await api.put(`/admin/${endpoint}/${editing.id}`, editing)
      else await api.post(`/admin/${endpoint}`, editing)
      setEditing(null)
      load()
    } catch (err) {
      setError(apiError(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item) => {
    const name = item[titleField] || `#${item.id}`
    if (!window.confirm(`Удалить «${name}»? Действие необратимо.`)) return
    try {
      await api.delete(`/admin/${endpoint}/${item.id}`)
      load()
    } catch (err) {
      setError(apiError(err))
    }
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing({ ...defaults })}>
          <Icon name="plus" size={16} /> {addLabel}
        </button>
      </div>

      {error && !editing && <p className="form-error" style={{ marginBottom: 16 }}>{error}</p>}

      {items === null ? (
        <div className="spinner" />
      ) : items.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>Пока пусто — добавьте первую запись.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  {columns.map((c) => (
                    <td key={c.key}>{c.render ? c.render(item) : item[c.key]}</td>
                  ))}
                  <td>
                    <div className="actions">
                      <button
                        className="icon-btn"
                        onClick={() => setEditing({ ...defaults, ...item })}
                        aria-label="Редактировать"
                      >
                        <Icon name="edit" size={15} />
                      </button>
                      <button
                        className="icon-btn danger"
                        onClick={() => remove(item)}
                        aria-label="Удалить"
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)} wide>
          <h3>{editing.id ? 'Редактирование' : addLabel}</h3>
          <form onSubmit={save} style={{ marginTop: 18 }}>
            <div className="settings-grid">
              {fields.map((f) => (
                <FormField
                  key={f.key}
                  field={f}
                  value={editing[f.key]}
                  onChange={(v) => setEditing((prev) => ({ ...prev, [f.key]: v }))}
                />
              ))}
            </div>
            {error && <p className="form-error" style={{ marginTop: 14 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
              <button className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Сохраняем…' : 'Сохранить'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>
                Отмена
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
