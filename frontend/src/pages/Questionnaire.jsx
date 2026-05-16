import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../auth'
import { DOW_KEYS, DOW_RU_FULL, Spinner } from '../components/common'

const INITIAL = {
  birth_year: '', gender: 'male', height_cm: '', weight_kg: '', target_weight_kg: '',
  experience: 'beginner', goals: '', injuries: '', diseases: '', allergies: '',
  diet_preferences: '', available_days: '', available_time: '', equipment: 'gym',
  sleep_hours: '', water_l: '', motivation: '', notes: '',
}

export default function Questionnaire() {
  const [form, setForm] = useState(INITIAL)
  const [days, setDays] = useState(new Set())
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const { refresh } = useAuth()
  const nav = useNavigate()

  useEffect(() => {
    api.get('/client/questionnaire').then((r) => {
      if (r.data) {
        setForm({ ...INITIAL, ...r.data })
        setDays(new Set((r.data.available_days || '').split(',').filter(Boolean)))
      }
    }).finally(() => setLoading(false))
  }, [])

  const toggleDay = (d) => {
    const ns = new Set(days)
    ns.has(d) ? ns.delete(d) : ns.add(d)
    setDays(ns)
  }

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      const payload = { ...form, available_days: Array.from(days).join(',') }
      for (const k of ['birth_year', 'height_cm', 'weight_kg', 'target_weight_kg', 'sleep_hours', 'water_l']) {
        payload[k] = payload[k] === '' || payload[k] === null ? null : Number(payload[k])
      }
      await api.post('/client/questionnaire', payload)
      await refresh()
      nav('/app')
    } catch (e) {
      setErr(e.response?.data?.error || 'Не удалось сохранить')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="container"><Spinner /></div>

  return (
    <div className="container" style={{ maxWidth: 800 }}>
      <span className="chip brand">первый шаг</span>
      <h1 className="mt-8">Анкета клиента</h1>
      <p className="text-muted mb-24">Заполните, пожалуйста, эту анкету — это поможет тренеру составить индивидуальную программу.</p>

      {err && <div className="error">{err}</div>}

      <form onSubmit={submit}>
        <div className="card card-lg mb-16">
          <h3>Базовое</h3>
          <div className="row-fields">
            <div className="field">
              <label>Год рождения</label>
              <input className="input" type="number" value={form.birth_year ?? ''} onChange={(e) => upd('birth_year', e.target.value)} placeholder="1995" />
            </div>
            <div className="field">
              <label>Пол</label>
              <select className="select" value={form.gender || ''} onChange={(e) => upd('gender', e.target.value)}>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
                <option value="other">Другое</option>
              </select>
            </div>
          </div>
          <div className="row-fields">
            <div className="field">
              <label>Рост, см</label>
              <input className="input" type="number" value={form.height_cm ?? ''} onChange={(e) => upd('height_cm', e.target.value)} />
            </div>
            <div className="field">
              <label>Текущий вес, кг</label>
              <input className="input" type="number" step="0.1" value={form.weight_kg ?? ''} onChange={(e) => upd('weight_kg', e.target.value)} />
            </div>
            <div className="field">
              <label>Желаемый вес, кг</label>
              <input className="input" type="number" step="0.1" value={form.target_weight_kg ?? ''} onChange={(e) => upd('target_weight_kg', e.target.value)} />
            </div>
            <div className="field">
              <label>Опыт</label>
              <select className="select" value={form.experience || ''} onChange={(e) => upd('experience', e.target.value)}>
                <option value="beginner">Новичок</option>
                <option value="intermediate">Средний</option>
                <option value="advanced">Продвинутый</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card card-lg mb-16">
          <h3>Цели и мотивация</h3>
          <div className="field">
            <label>Цели</label>
            <textarea className="textarea" value={form.goals || ''} onChange={(e) => upd('goals', e.target.value)} placeholder="Что вы хотите получить от тренировок?" />
          </div>
          <div className="field">
            <label>Что вас мотивирует</label>
            <textarea className="textarea" value={form.motivation || ''} onChange={(e) => upd('motivation', e.target.value)} />
          </div>
        </div>

        <div className="card card-lg mb-16">
          <h3>Здоровье</h3>
          <div className="field">
            <label>Травмы</label>
            <textarea className="textarea" value={form.injuries || ''} onChange={(e) => upd('injuries', e.target.value)} placeholder="Что болит, что нельзя делать" />
          </div>
          <div className="field">
            <label>Заболевания</label>
            <textarea className="textarea" value={form.diseases || ''} onChange={(e) => upd('diseases', e.target.value)} />
          </div>
          <div className="field">
            <label>Аллергии</label>
            <input className="input" value={form.allergies || ''} onChange={(e) => upd('allergies', e.target.value)} />
          </div>
        </div>

        <div className="card card-lg mb-16">
          <h3>Питание и режим</h3>
          <div className="field">
            <label>Особенности питания / что не едите</label>
            <textarea className="textarea" value={form.diet_preferences || ''} onChange={(e) => upd('diet_preferences', e.target.value)} />
          </div>
          <div className="row-fields">
            <div className="field">
              <label>Сон, часов / сутки</label>
              <input className="input" type="number" step="0.5" value={form.sleep_hours ?? ''} onChange={(e) => upd('sleep_hours', e.target.value)} />
            </div>
            <div className="field">
              <label>Воды, литров / день</label>
              <input className="input" type="number" step="0.1" value={form.water_l ?? ''} onChange={(e) => upd('water_l', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card card-lg mb-16">
          <h3>Тренировочные параметры</h3>
          <div className="field">
            <label>В какие дни вам удобно</label>
            <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
              {DOW_KEYS.map((d, i) => (
                <button type="button" key={d}
                  className={`chip ${days.has(d) ? 'brand' : ''}`}
                  style={{ cursor: 'pointer', padding: '8px 14px' }}
                  onClick={() => toggleDay(d)}>
                  {DOW_RU_FULL[i]}
                </button>
              ))}
            </div>
          </div>
          <div className="row-fields">
            <div className="field">
              <label>Удобное время</label>
              <input className="input" value={form.available_time || ''} onChange={(e) => upd('available_time', e.target.value)} placeholder="например, 19:00" />
            </div>
            <div className="field">
              <label>Где тренируетесь</label>
              <select className="select" value={form.equipment || ''} onChange={(e) => upd('equipment', e.target.value)}>
                <option value="gym">Тренажёрный зал</option>
                <option value="home">Дома</option>
                <option value="minimal">Минимум оборудования</option>
                <option value="outdoor">На улице</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card card-lg mb-16">
          <h3>Дополнительно</h3>
          <div className="field">
            <label>Комментарий тренеру</label>
            <textarea className="textarea" value={form.notes || ''} onChange={(e) => upd('notes', e.target.value)} />
          </div>
        </div>

        <button className="btn btn-block" disabled={busy}>{busy ? 'Сохраняем…' : 'Отправить тренеру'}</button>
      </form>
    </div>
  )
}
