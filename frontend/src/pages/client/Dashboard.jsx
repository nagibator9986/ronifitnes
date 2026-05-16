import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api'
import { useAuth } from '../../auth'
import { Spinner, EmptyState, MEAL_TYPES, DOW_RU_FULL } from '../../components/common'
import { RingProgress } from '../../components/Chart'

export default function ClientDashboard() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!user) return
    if (user.role !== 'client') {
      nav(user.role === 'admin' ? '/admin' : '/trainer', { replace: true })
      return
    }
    if (user.needs_questionnaire) {
      nav('/onboarding', { replace: true })
      return
    }
    api.get('/client/dashboard').then((r) => setData(r.data))
  }, [user])

  if (!data) return <div className="container"><Spinner /></div>

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Доброе утро' : today.getHours() < 18 ? 'Добрый день' : 'Добрый вечер'

  const tw = data.today_workout
  const meals = data.today_meals || []
  const totalKcal = meals.reduce((s, m) => s + (m.kcal || 0), 0)
  const targetKcal = data.nutrition_plan?.target_kcal || 0
  const dowIdx = today.getDay() === 0 ? 6 : today.getDay() - 1

  return (
    <div className="container">
      <div className="mb-24">
        <div className="text-muted" style={{ fontSize: 13 }}>{DOW_RU_FULL[dowIdx]}, {today.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</div>
        <h1 style={{ marginTop: 4 }}>{greeting}, <span className="text-brand">{user.full_name.split(' ')[0]}</span></h1>
      </div>

      <div className="grid grid-4 mb-24">
        <div className="stat">
          <div className="label">Тренировок</div>
          <div className="value">{data.logs_count}</div>
        </div>
        <div className="stat">
          <div className="label">Фото прогресса</div>
          <div className="value">{data.photos_count}</div>
        </div>
        <div className="stat">
          <div className="label">Текущий вес</div>
          <div className="value">{data.last_measurement?.weight_kg ? `${data.last_measurement.weight_kg} кг` : '—'}</div>
        </div>
        <div className="stat">
          <div className="label">Тренер</div>
          <div className="value" style={{ fontSize: 16 }}>{data.trainer?.full_name || '—'}</div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Today's workout */}
        <div className="card card-lg">
          <div className="section-title" style={{ marginBottom: 12 }}>
            <h3>🏋️ Тренировка сегодня</h3>
            <Link to="/app/plan" className="btn btn-soft btn-sm">Вся программа →</Link>
          </div>
          {tw ? (
            <>
              <div className="mb-16">
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '.04em' }}>{tw.title || 'Тренировка'}</div>
                <div className="text-muted">{tw.time_of_day ? `⏰ ${tw.time_of_day}` : ''} · {tw.items.length} упражнений</div>
              </div>
              <div>
                {tw.items.slice(0, 4).map((it) => (
                  <div key={it.id} className="ex-row">
                    <div className="ex-thumb">
                      {it.exercise?.media_kind === 'image' || it.exercise?.media_kind === 'gif'
                        ? <img src={it.exercise.media_url} alt="" />
                        : <span>{it.exercise?.muscle_group?.[0] || '🏋️'}</span>}
                    </div>
                    <div className="ex-info">
                      <div className="name">{it.exercise?.name}</div>
                      <div className="meta">{it.exercise?.muscle_group}</div>
                    </div>
                    <div className="ex-sets">
                      {it.sets}×{it.reps}
                      <small>{it.weight_kg ? `${it.weight_kg} кг` : `${it.rest_sec}с`}</small>
                    </div>
                  </div>
                ))}
                {tw.items.length > 4 && <div className="text-muted mt-8" style={{ fontSize: 13, textAlign: 'center' }}>+ ещё {tw.items.length - 4}</div>}
              </div>
              <Link to={`/app/player/${tw.id}`} className="btn btn-block mt-16">🚀 Начать тренировку</Link>
            </>
          ) : (
            <EmptyState icon="🧘" title="Сегодня отдых" hint="Не забывайте про восстановление и хороший сон." />
          )}
        </div>

        {/* Today's meals */}
        <div className="card card-lg">
          <div className="section-title" style={{ marginBottom: 12 }}>
            <h3>🥗 Питание сегодня</h3>
            {data.nutrition_plan && targetKcal > 0 && (
              <RingProgress value={totalKcal} max={targetKcal} size={50} stroke={5} label={`${Math.round((totalKcal / targetKcal) * 100)}%`} />
            )}
          </div>
          {meals.length > 0 ? (
            <>
              {targetKcal > 0 && (
                <div className="text-muted mb-16" style={{ fontSize: 13 }}>
                  {totalKcal} / {targetKcal} ккал · Б {data.nutrition_plan.protein_g} · У {data.nutrition_plan.carbs_g} · Ж {data.nutrition_plan.fat_g}
                </div>
              )}
              <div className="flex flex-col gap-12">
                {meals.map((m) => {
                  const mt = MEAL_TYPES.find((x) => x.value === m.meal_type)
                  return (
                    <div key={m.id} className="meal-card">
                      <div className="icon-circle">{mt?.icon || '🍴'}</div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{m.name}</div>
                        <div className="text-muted" style={{ fontSize: 13 }}>{m.time_of_day} · {mt?.label}</div>
                      </div>
                      <div className="kcal">{m.kcal}<small>ккал</small></div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <EmptyState icon="🥗" title="План питания не назначен" hint="Тренер скоро добавит план." />
          )}
        </div>
      </div>

      <div className="grid grid-3 mt-24">
        <Link to="/app/calendar" className="card card-lg card-hover">
          <div style={{ fontSize: 30 }}>📅</div>
          <h3 className="mt-8">Календарь</h3>
          <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>Тренировки на 4 недели вперёд</p>
        </Link>
        <Link to="/app/progress" className="card card-lg card-hover">
          <div style={{ fontSize: 30 }}>📈</div>
          <h3 className="mt-8">Прогресс</h3>
          <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>Фото и замеры тела</p>
        </Link>
        <Link to="/app/achievements" className="card card-lg card-hover">
          <div style={{ fontSize: 30 }}>🏆</div>
          <h3 className="mt-8">Достижения</h3>
          <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>Бейджи и личные рекорды</p>
        </Link>
      </div>

      {data.trainer && (
        <div className="card card-lg mt-24">
          <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="text-muted" style={{ fontSize: 13 }}>Связь с тренером</div>
              <h3 style={{ margin: '4px 0 0' }}>{data.trainer.full_name}</h3>
            </div>
            <Link to="/app/chat" className="btn">Написать в чат 💬</Link>
          </div>
        </div>
      )}
    </div>
  )
}
