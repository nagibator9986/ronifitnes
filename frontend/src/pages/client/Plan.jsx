import { useEffect, useState } from 'react'
import api from '../../api'
import { Spinner, EmptyState, DOW_RU, DOW_RU_FULL, MEAL_TYPES, MediaPreview } from '../../components/common'
import Modal from '../../components/Modal'

export default function ClientPlan() {
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('workout')
  const [view, setView] = useState(null)

  useEffect(() => {
    api.get('/client/plan').then((r) => setData(r.data))
  }, [])

  if (!data) return <div className="container"><Spinner /></div>

  const w = data.workout
  const n = data.nutrition

  return (
    <div className="container">
      <h1 className="mb-16">Моя программа</h1>
      <div className="tabs">
        <button className={`tab ${tab === 'workout' ? 'active' : ''}`} onClick={() => setTab('workout')}>🏋️ Тренировки</button>
        <button className={`tab ${tab === 'nutrition' ? 'active' : ''}`} onClick={() => setTab('nutrition')}>🥗 Питание</button>
      </div>

      {tab === 'workout' && (
        w ? (
          <>
            <div className="card card-lg mb-24">
              <span className="chip brand">{w.days.length} тренировок в неделю</span>
              <h2 className="mt-8">{w.name}</h2>
              {w.description && <p className="text-muted" style={{ margin: 0 }}>{w.description}</p>}
            </div>
            <div className="grid grid-2">
              {w.days.map((d) => (
                <div className="day-card" key={d.id}>
                  <div className="day-head">
                    <div>
                      <h3>{DOW_RU_FULL[d.day_of_week]}</h3>
                      {d.title && <div className="meta">{d.title}</div>}
                    </div>
                    {d.time_of_day && <span className="chip">{d.time_of_day}</span>}
                  </div>
                  <div className="day-body">
                    {d.items.length === 0 ? (
                      <div className="text-muted">Упражнений пока нет</div>
                    ) : d.items.map((it) => (
                      <div key={it.id} className="ex-row" onClick={() => setView(it.exercise)} style={{ cursor: 'pointer' }}>
                        <div className="ex-thumb">
                          {it.exercise?.media_kind === 'image' || it.exercise?.media_kind === 'gif'
                            ? <img src={it.exercise.media_url} alt="" />
                            : <span>{it.exercise?.muscle_group?.[0] || '🏋️'}</span>}
                        </div>
                        <div className="ex-info">
                          <div className="name">{it.exercise?.name}</div>
                          <div className="meta">{it.exercise?.muscle_group}{it.notes ? ` · ${it.notes}` : ''}</div>
                        </div>
                        <div className="ex-sets">
                          {it.sets}×{it.reps}
                          <small>{it.weight_kg ? `${it.weight_kg} кг` : `${it.rest_sec}с`}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : <EmptyState icon="🏋️" title="Программа не назначена" hint="Тренер составит план после анкеты" />
      )}

      {tab === 'nutrition' && (
        n ? (
          <>
            <div className="card card-lg mb-24">
              <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <span className="chip brand">{n.target_kcal} ккал / сутки</span>
                  <h2 className="mt-8">{n.name}</h2>
                  {n.description && <p className="text-muted" style={{ margin: 0 }}>{n.description}</p>}
                </div>
                <div className="flex gap-8">
                  <div className="stat"><div className="label">Белки</div><div className="value" style={{ fontSize: 20 }}>{n.protein_g} г</div></div>
                  <div className="stat"><div className="label">Углеводы</div><div className="value" style={{ fontSize: 20 }}>{n.carbs_g} г</div></div>
                  <div className="stat"><div className="label">Жиры</div><div className="value" style={{ fontSize: 20 }}>{n.fat_g} г</div></div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-12">
              {n.meals.map((m) => {
                const mt = MEAL_TYPES.find((x) => x.value === m.meal_type)
                return (
                  <div key={m.id} className="card">
                    <div className="flex gap-16 items-center" style={{ flexWrap: 'wrap' }}>
                      <div className="icon-circle" style={{ width: 56, height: 56, fontSize: 28, background: 'var(--brand-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{mt?.icon || '🍴'}</div>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div className="flex items-center gap-8 mb-8" style={{ flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0 }}>{m.name}</h3>
                          <span className="chip">{m.time_of_day || mt?.label}</span>
                          {m.day_of_week !== null && <span className="chip">{DOW_RU[m.day_of_week]}</span>}
                        </div>
                        <div className="text-muted">{m.description}</div>
                      </div>
                      <div className="flex gap-8">
                        <span className="chip">{m.kcal} ккал</span>
                        <span className="chip">Б {m.protein}</span>
                        <span className="chip">У {m.carbs}</span>
                        <span className="chip">Ж {m.fat}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : <EmptyState icon="🥗" title="План питания не назначен" />
      )}

      <Modal open={!!view} onClose={() => setView(null)} title={view?.name} size="lg">
        {view && (
          <>
            <div className="ex-card mb-16" style={{ border: 0, padding: 0 }}>
              <div className="media" style={{ borderRadius: 12 }}>
                <MediaPreview exercise={view} />
              </div>
            </div>
            <div className="flex gap-8 mb-16" style={{ flexWrap: 'wrap' }}>
              {view.muscle_group && <span className="chip brand">{view.muscle_group}</span>}
            </div>
            {view.purpose && <><h4>Для чего</h4><p className="text-muted">{view.purpose}</p></>}
            {view.instructions && <><h4>Техника выполнения</h4><p className="text-muted">{view.instructions}</p></>}
          </>
        )}
      </Modal>
    </div>
  )
}
