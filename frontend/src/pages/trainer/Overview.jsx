import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import { useAuth } from '../../auth'
import { Spinner, EmptyState, formatDate } from '../../components/common'
import { RingProgress } from '../../components/Chart'

const ACT_ICON = { workout: '🏋️', photo: '📸', questionnaire: '📝' }

export default function TrainerOverview() {
  const { user } = useAuth()
  const [data, setData] = useState(null)

  useEffect(() => { api.get('/trainer/overview').then((r) => setData(r.data)) }, [])

  if (!data) return <div className="container"><Spinner /></div>

  const t = data.totals
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер'

  return (
    <div className="container">
      <div className="mb-24">
        <div className="text-muted" style={{ fontSize: 13 }}>{new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <h1 style={{ marginTop: 4 }}>{greet}, <span className="text-brand">{user?.full_name?.split(' ')[0]}</span></h1>
        <p className="text-muted">Ваш центр управления — все клиенты, задачи и активность.</p>
      </div>

      <div className="grid grid-4 mb-24">
        <div className="stat">
          <div className="label">Клиентов</div>
          <div className="value">{t.clients}</div>
          <div className="delta">{t.active} активных</div>
        </div>
        <div className="stat">
          <div className="label">Анкеты ждут</div>
          <div className="value">{t.pending_questionnaire}</div>
          {t.pending_questionnaire > 0 && <div className="delta" style={{ color: 'var(--warn)' }}>требуется внимание</div>}
        </div>
        <div className="stat">
          <div className="label">Без программы</div>
          <div className="value">{t.no_plan}</div>
        </div>
        <div className="stat">
          <div className="label">Молчат неделю</div>
          <div className="value">{t.inactive_week}</div>
        </div>
      </div>

      <div className="grid grid-2 mb-24">
        {/* Pending actions */}
        <div className="card card-lg">
          <h3>🔥 Требует внимания</h3>
          {data.no_plan.length === 0 && data.pending_questionnaire.length === 0 && data.inactive.length === 0 ? (
            <EmptyState icon="🎉" title="Всё под контролем" hint="Срочных задач нет" />
          ) : (
            <div className="flex flex-col gap-8 mt-16">
              {data.no_plan.map((x) => (
                <Link key={`np-${x.client.id}`} to={`/trainer/clients/${x.client.id}`} className="card" style={{ background: 'var(--bg-elev)', padding: 12, display: 'block' }}>
                  <div className="flex justify-between items-center" style={{ gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{x.client.full_name}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>Анкета заполнена · нужна программа</div>
                    </div>
                    <span className="chip brand">создать план</span>
                  </div>
                </Link>
              ))}
              {data.pending_questionnaire.map((c) => (
                <Link key={`pq-${c.id}`} to={`/trainer/clients/${c.id}`} className="card" style={{ background: 'var(--bg-elev)', padding: 12, display: 'block' }}>
                  <div className="flex justify-between items-center" style={{ gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{c.full_name}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>Ждёт первого входа и анкеты</div>
                    </div>
                    <span className="chip" style={{ color: 'var(--warn)' }}>анкета</span>
                  </div>
                </Link>
              ))}
              {data.inactive.slice(0, 5).map((x) => (
                <Link key={`in-${x.client.id}`} to={`/trainer/clients/${x.client.id}`} className="card" style={{ background: 'var(--bg-elev)', padding: 12, display: 'block' }}>
                  <div className="flex justify-between items-center" style={{ gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{x.client.full_name}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{x.last_log ? `Последняя тренировка: ${formatDate(x.last_log)}` : 'Ещё ни одной тренировки'}</div>
                    </div>
                    <span className="chip" style={{ color: 'var(--muted)' }}>напомнить</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Activity */}
        <div className="card card-lg">
          <div className="section-title" style={{ marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>📰 Активность</h3>
            <Link to="/trainer/clients" className="btn btn-soft btn-sm">Все клиенты →</Link>
          </div>
          {data.activity.length === 0 ? (
            <EmptyState icon="🌙" title="Тихо" hint="Активность клиентов появится здесь" />
          ) : (
            <div className="flex flex-col gap-8 mt-8">
              {data.activity.map((a, i) => (
                <div key={i} className="flex gap-12 items-center" style={{ padding: '10px 12px', background: 'var(--bg-elev)', borderRadius: 10 }}>
                  <div style={{ fontSize: 22 }}>{ACT_ICON[a.type] || '•'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14 }}><strong>{a.client_name}</strong> {a.label}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>{new Date(a.at).toLocaleString('ru-RU')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-3">
        <Link to="/trainer/clients" className="card card-lg card-hover">
          <div style={{ fontSize: 32 }}>👥</div>
          <h3 className="mt-8">Клиенты</h3>
          <p className="text-muted" style={{ margin: 0 }}>Управление, программы, питание</p>
        </Link>
        <Link to="/trainer/schedule" className="card card-lg card-hover">
          <div style={{ fontSize: 32 }}>🗓</div>
          <h3 className="mt-8">Расписание</h3>
          <p className="text-muted" style={{ margin: 0 }}>Сегодня и неделя — все занятия и слоты</p>
        </Link>
        <Link to="/trainer/finance" className="card card-lg card-hover">
          <div style={{ fontSize: 32 }}>💰</div>
          <h3 className="mt-8">Финансы</h3>
          <p className="text-muted" style={{ margin: 0 }}>Платежи клиентов и месячный заработок</p>
        </Link>
        <Link to="/trainer/library" className="card card-lg card-hover">
          <div style={{ fontSize: 32 }}>📚</div>
          <h3 className="mt-8">Библиотека</h3>
          <p className="text-muted" style={{ margin: 0 }}>{t.exercises} упражнений · YouTube / GIF / картинки</p>
        </Link>
        <Link to="/trainer/templates" className="card card-lg card-hover">
          <div style={{ fontSize: 32 }}>🧱</div>
          <h3 className="mt-8">Шаблоны</h3>
          <p className="text-muted" style={{ margin: 0 }}>Готовые программы для новых клиентов</p>
        </Link>
        <Link to="/app/chat" className="card card-lg card-hover">
          <div style={{ fontSize: 32 }}>💬</div>
          <h3 className="mt-8">Чат с клиентами</h3>
          <p className="text-muted" style={{ margin: 0 }}>Сообщения и быстрая связь</p>
        </Link>
      </div>
    </div>
  )
}
