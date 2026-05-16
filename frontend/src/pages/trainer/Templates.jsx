import { useEffect, useState } from 'react'
import api from '../../api'
import { Spinner, EmptyState, DOW_RU_FULL, formatDate } from '../../components/common'
import { useToast } from '../../components/Toast'
import Modal from '../../components/Modal'

export default function TrainerTemplates() {
  const [items, setItems] = useState(null)
  const [view, setView] = useState(null)
  const toast = useToast()

  const load = () => api.get('/trainer/templates').then((r) => setItems(r.data))
  useEffect(() => { load() }, [])

  const remove = async (t) => {
    if (!confirm(`Удалить шаблон «${t.name}»?`)) return
    await api.delete(`/trainer/templates/${t.id}`)
    toast.success('Шаблон удалён')
    load()
  }

  if (!items) return <div className="container"><Spinner /></div>

  return (
    <div className="container">
      <div className="section-title">
        <div>
          <span className="chip brand">{items.length} шаблонов</span>
          <h1 className="mt-8">Шаблоны планов</h1>
          <p className="text-muted" style={{ margin: 0 }}>
            Сохраняйте программы как шаблоны и применяйте их к новым клиентам в один клик.
            Создать шаблон можно из любой активной программы — кнопка «Сохранить как шаблон» в карточке клиента.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState icon="🧱" title="Шаблонов пока нет" hint="Откройте клиента → программа → «Сохранить как шаблон»" />
      ) : (
        <div className="grid grid-3">
          {items.map((t) => {
            let data = {}
            try { data = JSON.parse(t.data_json) } catch {}
            return (
              <div key={t.id} className="card card-lg">
                <div className="flex justify-between items-start mb-16">
                  <div>
                    <h3 style={{ margin: 0 }}>{t.name}</h3>
                    <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>{t.kind === 'workout' ? '🏋️ Тренировки' : '🥗 Питание'} · {formatDate(t.created_at)}</div>
                  </div>
                </div>
                {data.days && (
                  <div className="flex gap-8 mb-16" style={{ flexWrap: 'wrap' }}>
                    {data.days.map((d, i) => (
                      <span key={i} className="chip">{DOW_RU_FULL[d.day_of_week]?.slice(0, 2)} · {d.items?.length || 0}</span>
                    ))}
                  </div>
                )}
                {t.description && <p className="text-muted" style={{ marginTop: 0, fontSize: 13 }}>{t.description}</p>}
                <div className="flex gap-8">
                  <button className="btn btn-soft btn-sm" onClick={() => setView({ ...t, data })}>Просмотр</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(t)}>×</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={!!view} onClose={() => setView(null)} title={view?.name} size="lg">
        {view && view.data?.days && (
          <div className="flex flex-col gap-16">
            {view.data.description && <p className="text-muted">{view.data.description}</p>}
            {view.data.days.map((d, i) => (
              <div className="day-card" key={i}>
                <div className="day-head"><h3>{DOW_RU_FULL[d.day_of_week]}</h3>{d.time_of_day && <span className="chip">{d.time_of_day}</span>}</div>
                <div className="day-body">
                  {d.items?.length === 0 ? <span className="text-muted">пусто</span> : d.items?.map((it, j) => (
                    <div key={j} className="ex-row">
                      <div className="ex-info"><div className="name">Упражнение #{it.exercise_id}</div></div>
                      <div className="ex-sets">{it.sets}×{it.reps}<small>{it.weight_kg ? `${it.weight_kg} кг` : `${it.rest_sec}с`}</small></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
