import { useRef, useState } from 'react'

import { api, apiError } from '../../api'
import Icon, { SERVICE_ICONS } from '../Icon'

/** Универсальное поле формы админки. Тип задаётся в конфиге вкладки. */
export default function FormField({ field, value, onChange }) {
  const { key, label, type = 'text', options = [], placeholder = '', hint, uploadKind } = field

  if (type === 'checkbox') {
    return (
      <div className="field field-check">
        <input
          id={`f-${key}`}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        <label htmlFor={`f-${key}`}>{label}</label>
      </div>
    )
  }

  return (
    <div className={`field ${field.full ? 'full' : ''}`}>
      <label htmlFor={`f-${key}`}>{label}</label>
      {type === 'textarea' && (
        <textarea
          id={`f-${key}`}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={field.rows || 4}
        />
      )}
      {type === 'select' && (
        <select id={`f-${key}`} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
      {type === 'icon' && <IconPicker value={value} onChange={onChange} />}
      {type === 'image' && (
        <ImageInput value={value} onChange={onChange} uploadKind={uploadKind || 'misc'} />
      )}
      {(type === 'text' || type === 'number') && (
        <input
          id={`f-${key}`}
          type={type}
          value={value ?? ''}
          onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={placeholder}
        />
      )}
      {hint && <span style={{ fontSize: '0.78rem', color: 'var(--muted-2)' }}>{hint}</span>}
    </div>
  )
}

function IconPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {SERVICE_ICONS.map((name) => (
        <button
          type="button"
          key={name}
          className="icon-btn"
          onClick={() => onChange(name)}
          title={name}
          style={
            value === name
              ? { borderColor: 'var(--brand-solid)', color: 'var(--text)', background: 'var(--brand-soft)' }
              : undefined
          }
        >
          <Icon name={name} size={17} />
        </button>
      ))}
    </div>
  )
}

function ImageInput({ value, onChange, uploadKind }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const upload = async (file) => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('kind', uploadKind)
      const res = await api.post('/admin/upload', fd)
      onChange(res.data.url)
    } catch (err) {
      setError(apiError(err, 'Не удалось загрузить файл'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="upload-row">
        {value ? (
          <img src={value} alt="" className="upload-preview" />
        ) : (
          <div className="thumb-empty" style={{ width: 74, height: 52 }}>
            нет
          </div>
        )}
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? 'Загрузка…' : 'Загрузить'}
        </button>
        {value && (
          <button type="button" className="btn btn-danger btn-sm" onClick={() => onChange('')}>
            Убрать
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => upload(e.target.files?.[0])}
        />
      </div>
      <input
        style={{ marginTop: 10 }}
        className="input"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…или вставьте URL картинки"
      />
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}
