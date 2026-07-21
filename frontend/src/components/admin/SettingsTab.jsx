import { useEffect, useState } from 'react'

import { api, apiError } from '../../api'
import FormField from './FormField'

const GROUPS = [
  {
    title: 'Главный экран',
    fields: [
      { key: 'hero_badge', label: 'Бейдж над заголовком' },
      { key: 'hero_title', label: 'Заголовок', type: 'textarea', rows: 2, full: true },
      { key: 'hero_subtitle', label: 'Подзаголовок', type: 'textarea', rows: 3, full: true },
    ],
  },
  {
    title: 'Статистика в hero',
    fields: [
      { key: 'stat_projects', label: 'Цифра 1' },
      { key: 'stat_projects_label', label: 'Подпись 1' },
      { key: 'stat_clients', label: 'Цифра 2' },
      { key: 'stat_clients_label', label: 'Подпись 2' },
      { key: 'stat_years', label: 'Цифра 3' },
      { key: 'stat_years_label', label: 'Подпись 3' },
      { key: 'stat_uptime', label: 'Цифра 4' },
      { key: 'stat_uptime_label', label: 'Подпись 4' },
    ],
  },
  {
    title: 'Основатель',
    fields: [
      { key: 'founder_name', label: 'Имя' },
      { key: 'founder_role', label: 'Роль / должность' },
      { key: 'founder_photo', label: 'Фото', type: 'image', uploadKind: 'founder', full: true },
      { key: 'founder_bio', label: 'Биография', type: 'textarea', rows: 5, full: true },
      { key: 'founder_quote', label: 'Цитата (выделенная)', type: 'textarea', rows: 2, full: true },
      {
        key: 'founder_skills',
        label: 'Навыки (через запятую)',
        type: 'textarea',
        rows: 2,
        full: true,
      },
    ],
  },
  {
    title: 'Контакты и соцсети',
    fields: [
      { key: 'contact_email', label: 'Email' },
      { key: 'contact_phone', label: 'Телефон' },
      { key: 'contact_telegram', label: 'Ссылка Telegram' },
      { key: 'contact_whatsapp', label: 'Ссылка WhatsApp' },
      { key: 'contact_address', label: 'Адрес / география', full: true },
      { key: 'social_github', label: 'GitHub' },
      { key: 'social_linkedin', label: 'LinkedIn' },
    ],
  },
]

export default function SettingsTab() {
  const [settings, setSettings] = useState(null)
  const [status, setStatus] = useState({ state: 'idle', text: '' })
  const [pass, setPass] = useState({ current: '', new: '' })
  const [passStatus, setPassStatus] = useState({ state: 'idle', text: '' })

  useEffect(() => {
    api.get('/admin/settings').then((res) => setSettings(res.data.settings))
  }, [])

  const save = async (e) => {
    e.preventDefault()
    setStatus({ state: 'loading', text: '' })
    try {
      await api.put('/admin/settings', settings)
      setStatus({ state: 'success', text: 'Сохранено — изменения уже на сайте' })
    } catch (err) {
      setStatus({ state: 'error', text: apiError(err) })
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setPassStatus({ state: 'loading', text: '' })
    try {
      await api.put('/admin/password', pass)
      setPassStatus({ state: 'success', text: 'Пароль изменён' })
      setPass({ current: '', new: '' })
    } catch (err) {
      setPassStatus({ state: 'error', text: apiError(err) })
    }
  }

  if (!settings) return <div className="spinner" />

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Настройки сайта</h1>
          <p>Тексты лендинга, контакты и данные основателя</p>
        </div>
      </div>

      <form onSubmit={save}>
        {GROUPS.map((g) => (
          <section className="card settings-block" key={g.title}>
            <h2>{g.title}</h2>
            <div className="settings-grid">
              {g.fields.map((f) => (
                <FormField
                  key={f.key}
                  field={f}
                  value={settings[f.key]}
                  onChange={(v) => setSettings((prev) => ({ ...prev, [f.key]: v }))}
                />
              ))}
            </div>
          </section>
        ))}
        {status.state === 'error' && <p className="form-error">{status.text}</p>}
        {status.state === 'success' && <p className="form-success">{status.text}</p>}
        <button className="btn btn-primary" disabled={status.state === 'loading'} style={{ marginTop: 8 }}>
          {status.state === 'loading' ? 'Сохраняем…' : 'Сохранить настройки'}
        </button>
      </form>

      <section className="card settings-block" style={{ marginTop: 34 }}>
        <h2>Смена пароля</h2>
        <form onSubmit={changePassword}>
          <div className="settings-grid">
            <div className="field">
              <label htmlFor="pass-cur">Текущий пароль</label>
              <input
                id="pass-cur"
                type="password"
                value={pass.current}
                onChange={(e) => setPass({ ...pass, current: e.target.value })}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="pass-new">Новый пароль (мин. 6 символов)</label>
              <input
                id="pass-new"
                type="password"
                value={pass.new}
                onChange={(e) => setPass({ ...pass, new: e.target.value })}
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>
          </div>
          {passStatus.state === 'error' && <p className="form-error" style={{ marginTop: 12 }}>{passStatus.text}</p>}
          {passStatus.state === 'success' && (
            <p className="form-success" style={{ marginTop: 12 }}>{passStatus.text}</p>
          )}
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 16 }} disabled={passStatus.state === 'loading'}>
            Сменить пароль
          </button>
        </form>
      </section>
    </>
  )
}
