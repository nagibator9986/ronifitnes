import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api'
import { Spinner, EmptyState, DOW_KEYS, DOW_RU_FULL, DOW_RU, MEAL_TYPES, formatDate, formatTime } from '../../components/common'
import { useToast } from '../../components/Toast'
import Modal from '../../components/Modal'

export default function TrainerClientDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('overview')
  const [exercises, setExercises] = useState([])

  const load = () => api.get(`/trainer/clients/${id}`).then((r) => setData(r.data))
  useEffect(() => { load(); api.get('/trainer/exercises').then((r) => setExercises(r.data)) }, [id])

  if (!data) return <div className="container"><Spinner /></div>

  const { client, questionnaire, workout_plan, nutrition_plan, progress_photos, measurements, logs } = data

  return (
    <div className="container">
      <Link to="/trainer/clients" className="chip mb-16" style={{ background: 'transparent', display: 'inline-flex' }}>← К клиентам</Link>
      <div className="section-title">
        <div className="flex gap-16 items-center">
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: 'white' }}>
            {client.full_name[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{ margin: 0 }}>{client.full_name}</h1>
            <div className="text-muted">@{client.username} · {client.email || 'без email'}</div>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>👤 Обзор</button>
        <button className={`tab ${tab === 'workout' ? 'active' : ''}`} onClick={() => setTab('workout')}>🏋️ Тренировки</button>
        <button className={`tab ${tab === 'nutrition' ? 'active' : ''}`} onClick={() => setTab('nutrition')}>🥗 Питание</button>
        <button className={`tab ${tab === 'progress' ? 'active' : ''}`} onClick={() => setTab('progress')}>📈 Прогресс</button>
        <button className={`tab ${tab === 'notes' ? 'active' : ''}`} onClick={() => setTab('notes')}>📝 Заметки</button>
      </div>

      {tab === 'overview' && <Overview client={client} q={questionnaire} reload={load} />}
      {tab === 'workout' && <WorkoutEditor clientId={client.id} plan={workout_plan} exercises={exercises} reload={load} />}
      {tab === 'nutrition' && <NutritionEditor clientId={client.id} plan={nutrition_plan} reload={load} />}
      {tab === 'progress' && <Progress photos={progress_photos} meas={measurements} logs={logs} />}
      {tab === 'notes' && <Notes clientId={client.id} />}
    </div>
  )
}

function Overview({ client, q, reload }) {
  const [busy, setBusy] = useState(false)
  const [pwd, setPwd] = useState(null)
  const toast = useToast()

  const reset = async () => {
    if (!confirm('Сбросить пароль клиента?')) return
    setBusy(true)
    const { data } = await api.post(`/trainer/clients/${client.id}/reset-password`)
    setPwd(data.password)
    toast.success('Пароль сброшен', `Новый: ${data.password}`)
    setBusy(false)
  }
  const toggleQ = async () => {
    await api.patch(`/trainer/clients/${client.id}`, { needs_questionnaire: !client.needs_questionnaire })
    toast.info(client.needs_questionnaire ? 'Анкета снята' : 'Анкета запрошена')
    reload()
  }

  return (
    <div className="grid grid-2">
      <div className="card card-lg">
        <h3>👋 Контакты</h3>
        <div className="text-muted" style={{ lineHeight: 1.9 }}>
          <div>Логин: <strong style={{ color: 'var(--text)' }}>@{client.username}</strong></div>
          {client.email && <div>Email: <strong style={{ color: 'var(--text)' }}>{client.email}</strong></div>}
          {client.phone && <div>Телефон: <strong style={{ color: 'var(--text)' }}>{client.phone}</strong></div>}
          <div>Регистрация: <strong style={{ color: 'var(--text)' }}>{formatDate(client.created_at)}</strong></div>
        </div>
        <div className="flex gap-8 mt-16" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-soft btn-sm" onClick={reset} disabled={busy}>🔑 Сбросить пароль</button>
          <button className="btn btn-ghost btn-sm" onClick={toggleQ}>
            {client.needs_questionnaire ? '⏸ Анкета отправлена' : '🔄 Запросить заново'}
          </button>
        </div>
        {pwd && (
          <div className="credentials-box mt-16">
            <div className="row"><span>Новый пароль:</span><strong>{pwd}</strong></div>
          </div>
        )}
      </div>

      <div className="card card-lg">
        <h3>📋 Анкета</h3>
        {q ? (
          <div className="text-muted" style={{ lineHeight: 1.9 }}>
            {q.gender && <div><b style={{ color: 'var(--text)' }}>Пол:</b> {q.gender}</div>}
            {q.birth_year && <div><b style={{ color: 'var(--text)' }}>Год:</b> {q.birth_year}</div>}
            {q.height_cm && <div><b style={{ color: 'var(--text)' }}>Рост / вес:</b> {q.height_cm} см / {q.weight_kg} кг (цель {q.target_weight_kg} кг)</div>}
            {q.experience && <div><b style={{ color: 'var(--text)' }}>Опыт:</b> {q.experience}</div>}
            {q.goals && <div><b style={{ color: 'var(--text)' }}>Цели:</b> {q.goals}</div>}
            {q.injuries && <div><b style={{ color: 'var(--text)' }}>Травмы:</b> {q.injuries}</div>}
            {q.diseases && <div><b style={{ color: 'var(--text)' }}>Заболевания:</b> {q.diseases}</div>}
            {q.allergies && <div><b style={{ color: 'var(--text)' }}>Аллергии:</b> {q.allergies}</div>}
            {q.diet_preferences && <div><b style={{ color: 'var(--text)' }}>Питание:</b> {q.diet_preferences}</div>}
            {q.available_days && <div><b style={{ color: 'var(--text)' }}>Дни:</b> {q.available_days}</div>}
            {q.available_time && <div><b style={{ color: 'var(--text)' }}>Время:</b> {q.available_time}</div>}
            {q.equipment && <div><b style={{ color: 'var(--text)' }}>Оборудование:</b> {q.equipment}</div>}
            {q.sleep_hours && <div><b style={{ color: 'var(--text)' }}>Сон:</b> {q.sleep_hours} ч</div>}
            {q.water_l && <div><b style={{ color: 'var(--text)' }}>Вода:</b> {q.water_l} л</div>}
            {q.motivation && <div><b style={{ color: 'var(--text)' }}>Мотивация:</b> {q.motivation}</div>}
            {q.notes && <div><b style={{ color: 'var(--text)' }}>Комментарий:</b> {q.notes}</div>}
            <div className="text-muted" style={{ fontSize: 12, marginTop: 8 }}>Заполнено: {formatDate(q.submitted_at)}</div>
          </div>
        ) : <EmptyState icon="📝" title={client.needs_questionnaire ? 'Ждём ответа клиента' : 'Анкета не заполнена'} />}
      </div>
    </div>
  )
}

function Notes({ clientId }) {
  const [items, setItems] = useState([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const load = () => api.get(`/trainer/clients/${clientId}/notes`).then((r) => setItems(r.data))
  useEffect(() => { load() }, [clientId])

  const add = async () => {
    if (!text.trim()) return
    setBusy(true)
    await api.post(`/trainer/clients/${clientId}/notes`, { content: text })
    setText('')
    await load()
    toast.success('Заметка добавлена')
    setBusy(false)
  }
  const togglePin = async (n) => {
    await api.patch(`/trainer/notes/${n.id}`, { pinned: !n.pinned })
    load()
  }
  const remove = async (n) => {
    if (!confirm('Удалить заметку?')) return
    await api.delete(`/trainer/notes/${n.id}`)
    load()
  }

  return (
    <>
      <div className="card card-lg mb-16">
        <h3>Новая заметка</h3>
        <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="Только для вас — план занятий, заметки о форме, договорённости..." />
        <button className="btn mt-8" disabled={busy} onClick={add}>+ Сохранить</button>
      </div>
      {items.length === 0 ? <EmptyState icon="📝" title="Заметок ещё нет" /> : (
        <div className="flex flex-col gap-12">
          {items.map((n) => (
            <div key={n.id} className="card" style={{ borderLeft: n.pinned ? '3px solid var(--brand-solid)' : '1px solid var(--border-soft)' }}>
              <div className="flex justify-between items-start mb-8">
                <div className="text-muted" style={{ fontSize: 12 }}>{formatDate(n.created_at)} · {formatTime(n.created_at)}</div>
                <div className="flex gap-8">
                  <button className="btn btn-ghost btn-sm" onClick={() => togglePin(n)}>{n.pinned ? '📌 откр.' : '📌 закрепить'}</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(n)}>×</button>
                </div>
              </div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{n.content}</div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function WorkoutEditor({ clientId, plan, exercises, reload }) {
  const toast = useToast()
  const [name, setName] = useState(plan?.name || 'Программа тренировок')
  const [desc, setDesc] = useState(plan?.description || '')
  const [days, setDays] = useState(plan?.days?.map((d) => ({
    day_of_week: d.day_of_week, time_of_day: d.time_of_day || '',
    title: d.title || '', notes: d.notes || '',
    items: d.items.map((it) => ({
      exercise_id: it.exercise_id, sets: it.sets, reps: it.reps,
      rest_sec: it.rest_sec, weight_kg: it.weight_kg, notes: it.notes || '',
    })),
  })) || [])

  const addDay = (dow) => {
    if (days.some((d) => d.day_of_week === dow)) return
    setDays([...days, { day_of_week: dow, time_of_day: '', title: '', notes: '', items: [] }].sort((a, b) => a.day_of_week - b.day_of_week))
  }
  const removeDay = (dow) => setDays(days.filter((d) => d.day_of_week !== dow))
  const updateDay = (dow, patch) => setDays(days.map((d) => d.day_of_week === dow ? { ...d, ...patch } : d))
  const addItem = (dow) => updateDay(dow, { items: [...days.find((d) => d.day_of_week === dow).items, { exercise_id: exercises[0]?.id || 0, sets: 3, reps: '10', rest_sec: 60, weight_kg: '', notes: '' }] })
  const removeItem = (dow, idx) => {
    const d = days.find((x) => x.day_of_week === dow)
    updateDay(dow, { items: d.items.filter((_, i) => i !== idx) })
  }
  const updateItem = (dow, idx, patch) => {
    const d = days.find((x) => x.day_of_week === dow)
    updateDay(dow, { items: d.items.map((it, i) => i === idx ? { ...it, ...patch } : it) })
  }

  const save = async () => {
    if (exercises.length === 0) {
      toast.error('Сначала добавьте упражнения в библиотеку')
      return
    }
    const payload = {
      name, description: desc,
      days: days.map((d) => ({
        ...d,
        items: d.items.map((it) => ({
          ...it,
          weight_kg: it.weight_kg === '' ? null : Number(it.weight_kg),
        })),
      })),
    }
    try {
      if (plan) await api.patch(`/trainer/workout-plans/${plan.id}`, payload)
      else await api.post(`/trainer/clients/${clientId}/workout-plan`, payload)
      toast.success('Программа сохранена')
      reload()
    } catch (e) {
      toast.error('Не удалось сохранить', e.response?.data?.error)
    }
  }

  const saveAsTemplate = async () => {
    if (!plan) {
      toast.info('Сначала сохраните программу')
      return
    }
    const name = prompt('Название шаблона:', plan.name + ' (шаблон)')
    if (!name) return
    await api.post(`/trainer/templates/from-plan/${plan.id}`, { name })
    toast.success('Шаблон сохранён')
  }

  return (
    <>
      <div className="card card-lg mb-16">
        <div className="row-fields">
          <div className="field"><label>Название программы</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="field"><label>Описание</label><input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        </div>
        <div className="field">
          <label>Дни недели</label>
          <div className="chip-row">
            {DOW_KEYS.map((k, i) => {
              const active = days.some((d) => d.day_of_week === i)
              return (
                <button key={i} className={`chip ${active ? 'brand' : ''}`} onClick={() => active ? removeDay(i) : addDay(i)} style={{ cursor: 'pointer' }}>
                  {DOW_RU_FULL[i]}
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex gap-8 mt-16" style={{ flexWrap: 'wrap' }}>
          <button className="btn" onClick={save}>💾 Сохранить программу</button>
          {plan && <button className="btn btn-soft" onClick={saveAsTemplate}>🧱 Сохранить как шаблон</button>}
        </div>
      </div>

      {days.length === 0 && <EmptyState icon="🗓" title="Выберите дни недели" hint="Затем добавьте упражнения" />}

      <div className="flex flex-col gap-16">
        {days.map((d) => (
          <div key={d.day_of_week} className="day-card">
            <div className="day-head">
              <div className="flex gap-12 items-center" style={{ flexWrap: 'wrap' }}>
                <h3>{DOW_RU_FULL[d.day_of_week]}</h3>
                <input className="input" style={{ width: 100, minHeight: 36 }} placeholder="время" value={d.time_of_day} onChange={(e) => updateDay(d.day_of_week, { time_of_day: e.target.value })} />
                <input className="input" style={{ minHeight: 36 }} placeholder="название" value={d.title} onChange={(e) => updateDay(d.day_of_week, { title: e.target.value })} />
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => removeDay(d.day_of_week)}>×</button>
            </div>
            <div className="day-body">
              {d.items.map((it, idx) => (
                <div key={idx} className="flex gap-8 mb-8" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                  <select className="select" style={{ flex: '2 1 200px', minHeight: 40 }} value={it.exercise_id} onChange={(e) => updateItem(d.day_of_week, idx, { exercise_id: Number(e.target.value) })}>
                    {exercises.map((e) => <option key={e.id} value={e.id}>{e.name} {e.muscle_group ? `(${e.muscle_group})` : ''}</option>)}
                  </select>
                  <input className="input" style={{ width: 70, minHeight: 40 }} placeholder="сеты" type="number" value={it.sets} onChange={(e) => updateItem(d.day_of_week, idx, { sets: Number(e.target.value) })} />
                  <input className="input" style={{ width: 80, minHeight: 40 }} placeholder="повторы" value={it.reps} onChange={(e) => updateItem(d.day_of_week, idx, { reps: e.target.value })} />
                  <input className="input" style={{ width: 80, minHeight: 40 }} placeholder="отдых, с" type="number" value={it.rest_sec} onChange={(e) => updateItem(d.day_of_week, idx, { rest_sec: Number(e.target.value) })} />
                  <input className="input" style={{ width: 80, minHeight: 40 }} placeholder="вес, кг" value={it.weight_kg ?? ''} onChange={(e) => updateItem(d.day_of_week, idx, { weight_kg: e.target.value })} />
                  <button className="btn btn-danger btn-sm" onClick={() => removeItem(d.day_of_week, idx)}>×</button>
                </div>
              ))}
              <button className="btn btn-soft btn-sm mt-8" onClick={() => addItem(d.day_of_week)}>+ Упражнение</button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function NutritionEditor({ clientId, plan, reload }) {
  const toast = useToast()
  const [form, setForm] = useState({
    name: plan?.name || 'План питания',
    description: plan?.description || '',
    target_kcal: plan?.target_kcal || 2000,
    protein_g: plan?.protein_g || 150,
    carbs_g: plan?.carbs_g || 200,
    fat_g: plan?.fat_g || 60,
  })
  const [meals, setMeals] = useState(plan?.meals?.map((m) => ({ ...m })) || [])

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const addMeal = () => setMeals([...meals, { meal_type: 'breakfast', time_of_day: '', name: '', description: '', kcal: 0, protein: 0, carbs: 0, fat: 0, day_of_week: null }])
  const updMeal = (i, patch) => setMeals(meals.map((m, idx) => idx === i ? { ...m, ...patch } : m))
  const delMeal = (i) => setMeals(meals.filter((_, idx) => idx !== i))

  const save = async () => {
    const payload = {
      ...form,
      target_kcal: Number(form.target_kcal),
      protein_g: Number(form.protein_g),
      carbs_g: Number(form.carbs_g),
      fat_g: Number(form.fat_g),
      meals: meals.map((m) => ({
        ...m,
        kcal: m.kcal ? Number(m.kcal) : 0,
        protein: m.protein ? Number(m.protein) : 0,
        carbs: m.carbs ? Number(m.carbs) : 0,
        fat: m.fat ? Number(m.fat) : 0,
      })),
    }
    try {
      if (plan) await api.patch(`/trainer/nutrition-plans/${plan.id}`, payload)
      else await api.post(`/trainer/clients/${clientId}/nutrition-plan`, payload)
      toast.success('План питания сохранён')
      reload()
    } catch (e) {
      toast.error('Ошибка', e.response?.data?.error)
    }
  }

  return (
    <>
      <div className="card card-lg mb-16">
        <div className="row-fields">
          <div className="field"><label>Название плана</label><input className="input" value={form.name} onChange={(e) => upd('name', e.target.value)} /></div>
          <div className="field"><label>Описание</label><input className="input" value={form.description} onChange={(e) => upd('description', e.target.value)} /></div>
        </div>
        <div className="row-fields">
          <div className="field"><label>Калории / сутки</label><input className="input" type="number" value={form.target_kcal} onChange={(e) => upd('target_kcal', e.target.value)} /></div>
          <div className="field"><label>Белки, г</label><input className="input" type="number" value={form.protein_g} onChange={(e) => upd('protein_g', e.target.value)} /></div>
          <div className="field"><label>Углеводы, г</label><input className="input" type="number" value={form.carbs_g} onChange={(e) => upd('carbs_g', e.target.value)} /></div>
          <div className="field"><label>Жиры, г</label><input className="input" type="number" value={form.fat_g} onChange={(e) => upd('fat_g', e.target.value)} /></div>
        </div>
        <button className="btn" onClick={save}>💾 Сохранить план</button>
      </div>

      <div className="section-title">
        <h3 style={{ margin: 0 }}>Приёмы пищи</h3>
        <button className="btn btn-soft btn-sm" onClick={addMeal}>+ Добавить</button>
      </div>

      <div className="flex flex-col gap-12">
        {meals.map((m, i) => (
          <div className="card" key={i}>
            <div className="row-fields">
              <div className="field">
                <label>Тип</label>
                <select className="select" value={m.meal_type || ''} onChange={(e) => updMeal(i, { meal_type: e.target.value })}>
                  {MEAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </select>
              </div>
              <div className="field"><label>Время</label><input className="input" value={m.time_of_day || ''} onChange={(e) => updMeal(i, { time_of_day: e.target.value })} placeholder="08:00" /></div>
              <div className="field">
                <label>День</label>
                <select className="select" value={m.day_of_week ?? ''} onChange={(e) => updMeal(i, { day_of_week: e.target.value === '' ? null : Number(e.target.value) })}>
                  <option value="">Каждый день</option>
                  {DOW_RU.map((d, idx) => <option key={idx} value={idx}>{d}</option>)}
                </select>
              </div>
              <div className="field"><label>Название</label><input className="input" value={m.name || ''} onChange={(e) => updMeal(i, { name: e.target.value })} /></div>
            </div>
            <div className="field"><label>Описание / состав</label><textarea className="textarea" value={m.description || ''} onChange={(e) => updMeal(i, { description: e.target.value })} /></div>
            <div className="row-fields">
              <div className="field"><label>Ккал</label><input className="input" type="number" value={m.kcal || 0} onChange={(e) => updMeal(i, { kcal: e.target.value })} /></div>
              <div className="field"><label>Б, г</label><input className="input" type="number" value={m.protein || 0} onChange={(e) => updMeal(i, { protein: e.target.value })} /></div>
              <div className="field"><label>У, г</label><input className="input" type="number" value={m.carbs || 0} onChange={(e) => updMeal(i, { carbs: e.target.value })} /></div>
              <div className="field"><label>Ж, г</label><input className="input" type="number" value={m.fat || 0} onChange={(e) => updMeal(i, { fat: e.target.value })} /></div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => delMeal(i)}>Удалить</button>
          </div>
        ))}
      </div>
    </>
  )
}

function Progress({ photos, meas, logs }) {
  const [view, setView] = useState(null)
  return (
    <>
      <h3>📸 Фотографии прогресса</h3>
      {photos.length === 0 ? <EmptyState icon="📸" title="Пока нет фото" /> : (
        <div className="gallery mb-24">
          {photos.map((p) => (
            <div key={p.id} className="gallery-item" onClick={() => setView(p)}>
              <img src={p.file_url} alt="" loading="lazy" />
            </div>
          ))}
        </div>
      )}

      <h3>📏 Замеры ({meas.length})</h3>
      {meas.length === 0 ? <p className="text-muted">Замеров нет</p> : (
        <div className="flex flex-col gap-8 mb-24">
          {meas.slice(0, 8).map((m) => (
            <div className="card" key={m.id} style={{ padding: 12 }}>
              <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <strong>{formatDate(m.taken_at)}</strong>
                  <span className="text-muted" style={{ marginLeft: 8 }}>
                    {m.weight_kg && `${m.weight_kg} кг`}
                    {m.body_fat_pct ? ` · ${m.body_fat_pct}%` : ''}
                  </span>
                </div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  {m.waist && `талия ${m.waist}`} {m.hips && ` · бёдра ${m.hips}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3>🏋️ Журнал тренировок ({logs.length})</h3>
      {logs.length === 0 ? <p className="text-muted">Нет записей</p> : (
        <div className="flex flex-col gap-8">
          {logs.slice(0, 10).map((l) => (
            <div className="card" key={l.id} style={{ padding: 12 }}>
              <div className="flex justify-between" style={{ flexWrap: 'wrap', gap: 8 }}>
                <strong>{formatDate(l.completed_at)} · {formatTime(l.completed_at)}</strong>
                <span className="text-muted">
                  {l.duration_min ? `${l.duration_min} мин` : ''}
                  {l.total_volume_kg > 0 ? ` · объём ${Math.round(l.total_volume_kg)} кг` : ''}
                  {l.mood ? ` · ${l.mood}/5` : ''}
                </span>
              </div>
              {l.notes && <div className="text-muted" style={{ fontSize: 13 }}>{l.notes}</div>}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!view} onClose={() => setView(null)} size="lg">
        {view && <img src={view.file_url} alt="" style={{ borderRadius: 12, margin: '0 auto', maxHeight: '80vh' }} />}
      </Modal>
    </>
  )
}
