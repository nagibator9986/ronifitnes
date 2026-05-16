import { useEffect, useMemo, useState } from 'react'
import api from '../../api'
import { Spinner, PERIOD_LABELS, POSES, formatDate, EmptyState } from '../../components/common'
import { LineChart } from '../../components/Chart'
import { useToast } from '../../components/Toast'
import Modal from '../../components/Modal'

export default function ClientProgress() {
  const [photos, setPhotos] = useState([])
  const [meas, setMeas] = useState([])
  const [tab, setTab] = useState('photos')
  const [uploadFor, setUploadFor] = useState(null)
  const [addMeasOpen, setAddMeasOpen] = useState(false)
  const [view, setView] = useState(null)
  const [compareOpen, setCompareOpen] = useState(false)
  const [cmpA, setCmpA] = useState(null)
  const [cmpB, setCmpB] = useState(null)
  const toast = useToast()

  const refresh = async () => {
    const [p, m] = await Promise.all([api.get('/client/photos'), api.get('/client/measurements')])
    setPhotos(p.data); setMeas(m.data)
  }
  useEffect(() => { refresh() }, [])

  const grouped = useMemo(() => {
    const map = {}
    for (const p of PERIOD_LABELS) map[p.value] = { front: null, side: null, back: null }
    for (const ph of photos) {
      const bucket = map[ph.period_label] || map.custom
      if (bucket && !bucket[ph.pose]) bucket[ph.pose] = ph
    }
    return map
  }, [photos])

  const handleUpload = async (file, period, pose, custom) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('period_label', period)
    fd.append('pose', pose)
    if (custom) fd.append('custom_label', custom)
    try {
      await api.post('/client/photos', fd)
      toast.success('Фото загружено')
      await refresh()
      setUploadFor(null)
    } catch (e) {
      toast.error('Ошибка загрузки')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить фото?')) return
    await api.delete(`/client/photos/${id}`)
    toast.info('Фото удалено')
    await refresh()
  }

  const addMeasurement = async (e) => {
    e.preventDefault()
    const fd = Object.fromEntries(new FormData(e.target).entries())
    const payload = {}
    for (const k of ['weight_kg', 'body_fat_pct', 'chest', 'waist', 'hips', 'biceps', 'thighs', 'calves']) {
      payload[k] = fd[k] === '' ? null : Number(fd[k])
    }
    payload.notes = fd.notes || null
    await api.post('/client/measurements', payload)
    toast.success('Замер добавлен')
    await refresh()
    setAddMeasOpen(false)
  }

  const last = meas[meas.length - 1]
  const first = meas[0]

  const wChart = meas.filter((m) => m.weight_kg != null).map((m) => ({ date: m.taken_at, value: m.weight_kg }))
  const bfChart = meas.filter((m) => m.body_fat_pct != null).map((m) => ({ date: m.taken_at, value: m.body_fat_pct }))
  const waistChart = meas.filter((m) => m.waist != null).map((m) => ({ date: m.taken_at, value: m.waist }))

  return (
    <div className="container">
      <h1 className="mb-16">Прогресс</h1>
      <div className="tabs">
        <button className={`tab ${tab === 'photos' ? 'active' : ''}`} onClick={() => setTab('photos')}>📸 Фотографии</button>
        <button className={`tab ${tab === 'measurements' ? 'active' : ''}`} onClick={() => setTab('measurements')}>📏 Замеры</button>
      </div>

      {tab === 'photos' && (
        <>
          <div className="flex justify-between items-center mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
            <p className="text-muted" style={{ margin: 0 }}>Снимайтесь по периодам — старт / 1м / 3м / 6м / 1г. Спереди, сбоку, сзади.</p>
            {photos.length >= 2 && <button className="btn btn-soft" onClick={() => setCompareOpen(true)}>⚖️ Сравнить фото</button>}
          </div>
          {PERIOD_LABELS.map((p) => {
            const b = grouped[p.value]
            const filled = Object.values(b).filter(Boolean).length
            return (
              <div className="period-row" key={p.value}>
                <div className="head">
                  <h3 style={{ margin: 0 }}>{p.label}</h3>
                  <span className="chip" style={{ color: filled === 3 ? 'var(--success)' : 'var(--muted)' }}>{filled} / 3</span>
                </div>
                <div className="poses">
                  {POSES.map((pose) => {
                    const ph = b[pose.value]
                    return (
                      <div className="pose-tile" key={pose.value}
                        onClick={() => ph ? setView(ph) : setUploadFor({ period: p.value, pose: pose.value })}>
                        {ph ? <img src={ph.file_url} alt="" /> : <span>+ {pose.label}</span>}
                        {ph && <div className="label">{pose.label}</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </>
      )}

      {tab === 'measurements' && (
        <>
          <div className="grid grid-4 mb-24">
            <div className="stat">
              <div className="label">Вес сейчас</div>
              <div className="value">{last?.weight_kg ? `${last.weight_kg} кг` : '—'}</div>
              {first && last && first.weight_kg && last.weight_kg && first.id !== last.id && (
                <div className="delta" style={{ color: last.weight_kg < first.weight_kg ? 'var(--success)' : 'var(--warn)' }}>
                  {(last.weight_kg - first.weight_kg) > 0 ? '+' : ''}{(last.weight_kg - first.weight_kg).toFixed(1)} кг с начала
                </div>
              )}
            </div>
            <div className="stat">
              <div className="label">% жира</div>
              <div className="value">{last?.body_fat_pct ? `${last.body_fat_pct}%` : '—'}</div>
            </div>
            <div className="stat">
              <div className="label">Талия</div>
              <div className="value">{last?.waist ? `${last.waist} см` : '—'}</div>
            </div>
            <div className="stat">
              <div className="label">Замеров</div>
              <div className="value">{meas.length}</div>
            </div>
          </div>

          {wChart.length >= 2 && (
            <div className="card card-lg mb-16">
              <div className="section-title"><h3 style={{ margin: 0 }}>Динамика веса</h3><span className="chip">{wChart.length} точек</span></div>
              <LineChart data={wChart} formatY={(v) => `${v.toFixed(1)}`} height={220} />
            </div>
          )}

          <div className="grid grid-2 mb-16">
            {bfChart.length >= 2 && (
              <div className="card card-lg">
                <h3 style={{ margin: 0 }}>% жира</h3>
                <LineChart data={bfChart} formatY={(v) => `${v.toFixed(1)}%`} height={160} />
              </div>
            )}
            {waistChart.length >= 2 && (
              <div className="card card-lg">
                <h3 style={{ margin: 0 }}>Талия, см</h3>
                <LineChart data={waistChart} formatY={(v) => `${v.toFixed(1)}`} height={160} />
              </div>
            )}
          </div>

          <button className="btn mb-16" onClick={() => setAddMeasOpen(true)}>+ Новый замер</button>

          <div className="flex flex-col gap-12">
            {[...meas].reverse().map((m) => (
              <div className="card" key={m.id}>
                <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{formatDate(m.taken_at)}</div>
                    <div className="text-muted" style={{ fontSize: 13 }}>
                      {m.weight_kg && `${m.weight_kg} кг`}
                      {m.body_fat_pct ? ` · ${m.body_fat_pct}%` : ''}
                    </div>
                  </div>
                  <div className="flex gap-8" style={{ flexWrap: 'wrap', fontSize: 12 }}>
                    {m.chest && <span className="chip">грудь {m.chest}</span>}
                    {m.waist && <span className="chip">талия {m.waist}</span>}
                    {m.hips && <span className="chip">бёдра {m.hips}</span>}
                    {m.biceps && <span className="chip">бицепс {m.biceps}</span>}
                    {m.thighs && <span className="chip">бедро {m.thighs}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={!!uploadFor} onClose={() => setUploadFor(null)} title="Загрузить фото">
        {uploadFor && (
          <form onSubmit={(e) => {
            e.preventDefault()
            const file = e.target.file.files[0]
            const custom = e.target.custom?.value
            if (file) handleUpload(file, uploadFor.period, uploadFor.pose, custom)
          }}>
            <div className="field">
              <label>Период</label>
              <div className="chip brand" style={{ width: 'fit-content' }}>
                {PERIOD_LABELS.find((p) => p.value === uploadFor.period)?.label}
              </div>
            </div>
            <div className="field">
              <label>Ракурс</label>
              <div className="chip brand" style={{ width: 'fit-content' }}>
                {POSES.find((p) => p.value === uploadFor.pose)?.label}
              </div>
            </div>
            {uploadFor.period === 'custom' && (
              <div className="field"><label>Своё название</label><input className="input" name="custom" /></div>
            )}
            <div className="field"><label>Файл</label><input className="input" type="file" name="file" accept="image/*" required /></div>
            <button className="btn btn-block">Загрузить</button>
          </form>
        )}
      </Modal>

      <Modal open={!!view} onClose={() => setView(null)} size="lg" title={PERIOD_LABELS.find((p) => p.value === view?.period_label)?.label}>
        {view && (
          <>
            <img src={view.file_url} alt="" style={{ borderRadius: 12, margin: '0 auto', maxHeight: '60vh' }} />
            <div className="flex justify-between items-center mt-16">
              <div className="text-muted">{formatDate(view.taken_at)} · {POSES.find((p) => p.value === view.pose)?.label}</div>
              <button className="btn btn-danger btn-sm" onClick={() => { handleDelete(view.id); setView(null) }}>Удалить</button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={compareOpen} onClose={() => setCompareOpen(false)} size="lg" title="Сравнение фото">
        <p className="text-muted">Выберите две фотографии — слева «До», справа «После».</p>
        <div className="compare-grid">
          <ComparePick photos={photos} current={cmpA} onPick={setCmpA} label="ДО" />
          <ComparePick photos={photos} current={cmpB} onPick={setCmpB} label="ПОСЛЕ" />
        </div>
        {cmpA && cmpB && (
          <>
            <div className="text-muted text-center mt-16" style={{ fontSize: 13 }}>
              {formatDate(cmpA.taken_at)} → {formatDate(cmpB.taken_at)} ·
              разница {Math.round((new Date(cmpB.taken_at) - new Date(cmpA.taken_at)) / (1000 * 60 * 60 * 24))} дн.
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

function ComparePick({ photos, current, onPick, label }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  return (
    <>
      <div className="compare-tile" onClick={() => setPickerOpen(true)}>
        {current ? <img src={current.file_url} alt="" /> : <span className="text-muted">{label}</span>}
        {current && <div className="compare-label">{label} · {formatDate(current.taken_at)}</div>}
      </div>
      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Выбрать фото" size="lg">
        {photos.length === 0 ? <EmptyState icon="📷" title="Нет фото" /> : (
          <div className="gallery">
            {photos.map((p) => (
              <div key={p.id} className="gallery-item" onClick={() => { onPick(p); setPickerOpen(false) }}>
                <img src={p.file_url} alt="" />
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  )
}
