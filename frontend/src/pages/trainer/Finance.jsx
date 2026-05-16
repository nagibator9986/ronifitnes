import { useEffect, useState } from 'react'
import api from '../../api'
import { Spinner, EmptyState } from '../../components/common'
import { useToast } from '../../components/Toast'
import { LineChart } from '../../components/Chart'
import Modal from '../../components/Modal'

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

export default function TrainerFinance() {
  const today = new Date()
  const [period, setPeriod] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 })
  const [data, setData] = useState(null)
  const [earnings, setEarnings] = useState(null)
  const [feeOpen, setFeeOpen] = useState(null) // client object
  const [payOpen, setPayOpen] = useState(null) // row
  const toast = useToast()

  const load = async () => {
    const [o, e] = await Promise.all([
      api.get(`/trainer/finance/overview?year=${period.year}&month=${period.month}`),
      api.get('/trainer/finance/earnings'),
    ])
    setData(o.data); setEarnings(e.data)
  }
  useEffect(() => { load() }, [period.year, period.month])

  const fmt = (v) => `${v.toLocaleString('ru-RU')} ${data?.currency || '₸'}`

  const setFee = async (e) => {
    e.preventDefault()
    const fd = Object.fromEntries(new FormData(e.target).entries())
    await api.post(`/trainer/finance/clients/${feeOpen.id}/fee`, {
      monthly_fee: Number(fd.monthly_fee || 0),
      currency: fd.currency || '₸',
    })
    toast.success('Цена обновлена')
    setFeeOpen(null)
    load()
  }

  const markPaid = async (e) => {
    e.preventDefault()
    const fd = Object.fromEntries(new FormData(e.target).entries())
    try {
      await api.post('/trainer/finance/payments', {
        client_id: payOpen.client.id,
        amount: Number(fd.amount),
        method: fd.method,
        note: fd.note || null,
        period_year: period.year,
        period_month: period.month,
        paid_at: fd.paid_at,
      })
      toast.success('Платёж отмечен')
      setPayOpen(null)
      load()
    } catch (err) {
      toast.error('Ошибка', err.response?.data?.error)
    }
  }

  const unpay = async (paymentId) => {
    if (!confirm('Отменить отметку оплаты?')) return
    await api.delete(`/trainer/finance/payments/${paymentId}`)
    toast.info('Отметка снята')
    load()
  }

  const prevMonth = () => {
    let m = period.month - 1, y = period.year
    if (m < 1) { m = 12; y-- }
    setPeriod({ year: y, month: m })
  }
  const nextMonth = () => {
    let m = period.month + 1, y = period.year
    if (m > 12) { m = 1; y++ }
    setPeriod({ year: y, month: m })
  }

  if (!data || !earnings) return <div className="container"><Spinner /></div>

  const progress = data.expected_total > 0 ? Math.min(100, (data.paid_total / data.expected_total) * 100) : 0
  const chartData = earnings.months.map((m) => ({ date: `${m.year}-${String(m.month).padStart(2,'0')}`, value: m.total }))

  return (
    <div className="container">
      <h1 className="mb-16">💰 Финансы</h1>

      <div className="flex justify-between items-center mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={prevMonth}>← Предыдущий</button>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '.04em' }}>
          {MONTHS[period.month - 1]} {period.year}
        </h2>
        <button className="btn btn-ghost btn-sm" onClick={nextMonth}>Следующий →</button>
      </div>

      <div className="grid grid-4 mb-24">
        <div className="stat">
          <div className="label">Ожидается</div>
          <div className="value">{fmt(data.expected_total)}</div>
          <div className="delta text-muted">с {data.rows.length} клиентов</div>
        </div>
        <div className="stat" style={{ borderColor: 'var(--success)' }}>
          <div className="label">Получено</div>
          <div className="value" style={{ color: 'var(--success)' }}>{fmt(data.paid_total)}</div>
          <div className="delta">{data.paid_count} клиентов оплатили</div>
        </div>
        <div className="stat" style={{ borderColor: data.outstanding > 0 ? 'var(--warn)' : 'var(--border-soft)' }}>
          <div className="label">Долг</div>
          <div className="value" style={{ color: data.outstanding > 0 ? 'var(--warn)' : 'var(--text)' }}>{fmt(data.outstanding)}</div>
          <div className="delta">{data.unpaid_count} ещё не оплатили</div>
        </div>
        <div className="stat">
          <div className="label">Прогресс месяца</div>
          <div className="value">{Math.round(progress)}%</div>
          <div className="bar" style={{ height: 6, background: 'var(--border)', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--brand)' }} />
          </div>
        </div>
      </div>

      {/* Chart 12 months */}
      <div className="card card-lg mb-24">
        <div className="section-title">
          <div>
            <h3 style={{ margin: 0 }}>Заработок за 12 месяцев</h3>
            <div className="text-muted">Всего: <strong style={{ color: 'var(--brand-solid)' }}>{fmt(earnings.grand_total)}</strong></div>
          </div>
        </div>
        <LineChart data={chartData} formatY={(v) => `${(v/1000).toFixed(0)}т`} height={200} />
      </div>

      {/* Clients table */}
      <h3 className="mb-16">Клиенты</h3>
      {data.rows.length === 0 ? <EmptyState icon="👥" title="Нет клиентов" /> : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Клиент</th>
                <th>Цена/мес</th>
                <th>Статус</th>
                <th>Оплачено</th>
                <th>Способ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.client.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{r.client.full_name}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>@{r.client.username}</div>
                  </td>
                  <td>
                    {r.monthly_fee > 0 ? <strong>{r.monthly_fee.toLocaleString('ru-RU')} {r.client.currency || '₸'}</strong> : <span className="text-muted">не задана</span>}
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft: 6 }} onClick={() => setFeeOpen(r.client)}>✎</button>
                  </td>
                  <td>
                    {r.payment
                      ? <span className="chip" style={{ color: 'var(--success)', borderColor: 'var(--success)' }}>✓ Оплачено</span>
                      : <span className="chip" style={{ color: 'var(--warn)', borderColor: 'var(--warn)' }}>⏳ Ожидание</span>}
                  </td>
                  <td>
                    {r.payment ? <strong>{r.payment.amount.toLocaleString('ru-RU')} {r.payment.currency}</strong> : '—'}
                  </td>
                  <td className="text-muted" style={{ fontSize: 13 }}>
                    {r.payment ? (r.payment.method || '—') : '—'}
                  </td>
                  <td>
                    {r.payment ? (
                      <button className="btn btn-danger btn-sm" onClick={() => unpay(r.payment.id)}>отменить</button>
                    ) : (
                      <button className="btn btn-soft btn-sm" onClick={() => setPayOpen(r)}>отметить оплату</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Set fee modal */}
      <Modal open={!!feeOpen} onClose={() => setFeeOpen(null)} title={`Цена · ${feeOpen?.full_name}`}>
        {feeOpen && (
          <form onSubmit={setFee}>
            <div className="row-fields">
              <div className="field">
                <label>Стоимость / месяц</label>
                <input className="input" type="number" name="monthly_fee" defaultValue={feeOpen.monthly_fee || ''} placeholder="80000" />
              </div>
              <div className="field">
                <label>Валюта</label>
                <select className="select" name="currency" defaultValue={feeOpen.currency || '₸'}>
                  <option value="₸">₸ Тенге</option>
                  <option value="₽">₽ Рубль</option>
                  <option value="$">$ Доллар</option>
                  <option value="€">€ Евро</option>
                </select>
              </div>
            </div>
            <button className="btn btn-block">Сохранить</button>
          </form>
        )}
      </Modal>

      {/* Mark paid modal */}
      <Modal open={!!payOpen} onClose={() => setPayOpen(null)} title={`Платёж · ${payOpen?.client?.full_name}`}>
        {payOpen && (
          <form onSubmit={markPaid}>
            <div className="row-fields">
              <div className="field">
                <label>Сумма</label>
                <input className="input" type="number" name="amount" defaultValue={payOpen.monthly_fee || 0} required />
              </div>
              <div className="field">
                <label>Способ</label>
                <select className="select" name="method" defaultValue="card">
                  <option value="card">Карта</option>
                  <option value="cash">Наличные</option>
                  <option value="transfer">Перевод</option>
                  <option value="other">Другое</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Дата оплаты</label>
              <input className="input" type="date" name="paid_at" defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="field">
              <label>Комментарий (опц.)</label>
              <textarea className="textarea" name="note" />
            </div>
            <button className="btn btn-block">Отметить как оплачено</button>
          </form>
        )}
      </Modal>
    </div>
  )
}
