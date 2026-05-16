import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'
import { Spinner, DOW_RU, EmptyState } from '../../components/common'

export default function ClientCalendar() {
  const [data, setData] = useState(null)
  const nav = useNavigate()

  useEffect(() => { api.get('/client/calendar').then((r) => setData(r.data)) }, [])

  if (!data) return <div className="container"><Spinner /></div>

  const start = (s) => new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

  return (
    <div className="container">
      <h1>Календарь тренировок</h1>
      <p className="text-muted mb-24">Жми на день со звездой — попадёшь в тренировочный плеер с таймером и счётчиком сетов.</p>

      {data.weeks.length === 0 || !data.plan_id ? (
        <EmptyState icon="🗓" title="Программа не назначена" hint="Тренер скоро добавит план тренировок" />
      ) : data.weeks.map((wk, wi) => {
        const wEnd = new Date(wk.start); wEnd.setDate(wEnd.getDate() + 6)
        return (
          <div key={wi} className="mb-24">
            <div className="text-muted mb-8" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>
              Неделя · {start(wk.start)} — {wEnd.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
            </div>
            <div className="cal-week">
              {wk.days.map((d) => {
                const date = new Date(d.date)
                const classes = ['cal-day']
                if (d.is_today) classes.push('is-today')
                if (d.is_past) classes.push('is-past')
                if (d.completed) classes.push('done')
                return (
                  <div key={d.date}
                    className={classes.join(' ')}
                    onClick={() => d.workout && !d.is_past && nav(`/app/player/${d.workout.id}`)}>
                    <div className="dow">{DOW_RU[d.day_of_week]}</div>
                    <div className="date-num">{date.getDate()}</div>
                    {d.workout ? (
                      <>
                        {d.completed
                          ? <span className="badge">✓ выполнено</span>
                          : <span className="badge">{d.workout.title || 'тренировка'}</span>}
                        <div className="ex-mini">{d.workout.items?.map((it) => it.exercise?.name).filter(Boolean).slice(0, 3).join(' · ')}</div>
                      </>
                    ) : (
                      <div className="text-muted" style={{ fontSize: 11, marginTop: 6 }}>отдых</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
