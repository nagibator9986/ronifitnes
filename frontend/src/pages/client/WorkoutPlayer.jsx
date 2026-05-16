import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api'
import { Spinner, MediaPreview } from '../../components/common'
import { useToast } from '../../components/Toast'

export default function WorkoutPlayer() {
  const { dayId } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [exIdx, setExIdx] = useState(0)
  const [setIdx, setSetIdx] = useState(0)
  const [doneSets, setDoneSets] = useState({}) // {exIdx: [{reps, weight}, ...]}
  const [restLeft, setRestLeft] = useState(0)
  const [startedAt] = useState(Date.now())
  const restRef = useRef(null)

  useEffect(() => {
    api.get(`/client/workout-player/${dayId}`).then((r) => setData(r.data))
  }, [dayId])

  // rest timer tick
  useEffect(() => {
    if (restLeft <= 0) return
    const id = setInterval(() => setRestLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [restLeft])

  if (!data) return <div className="container"><Spinner /></div>

  const items = data.items || []
  const total = items.length
  const ex = items[exIdx]?.item
  const exercise = items[exIdx]?.item?.exercise
  const prev = items[exIdx]?.previous_best
  const totalSets = ex?.sets || 0
  const elapsedMin = Math.floor((Date.now() - startedAt) / 60000)

  const doneForEx = doneSets[exIdx] || []

  const finishSet = () => {
    const repsInput = document.getElementById('reps-input')?.value
    const wInput = document.getElementById('weight-input')?.value
    const entry = {
      exercise_id: ex.exercise_id,
      set_index: setIdx,
      reps: repsInput ? Number(repsInput) : Number(ex.reps) || 0,
      weight_kg: wInput ? Number(wInput) : (ex.weight_kg || 0),
    }
    const next = { ...doneSets, [exIdx]: [...doneForEx, entry] }
    setDoneSets(next)

    if (setIdx + 1 < totalSets) {
      setSetIdx(setIdx + 1)
      setRestLeft(ex.rest_sec || 60)
    } else if (exIdx + 1 < total) {
      setExIdx(exIdx + 1)
      setSetIdx(0)
      setRestLeft(0)
    } else {
      finishSession(next)
    }
  }

  const finishSession = async (sets) => {
    const allSets = []
    items.forEach((_, i) => {
      (sets[i] || []).forEach((s) => allSets.push(s))
    })
    try {
      await api.post('/client/logs', {
        day_id: Number(dayId),
        duration_min: Math.max(1, elapsedMin),
        mood: 5,
        set_logs: allSets,
        notes: 'Тренировка из плеера',
      })
      toast.success('Тренировка засчитана 💪', `Сетов: ${allSets.length}`)
      nav('/app')
    } catch (e) {
      toast.error('Не удалось сохранить')
    }
  }

  const skipRest = () => setRestLeft(0)
  const addRest = (sec) => setRestLeft((s) => s + sec)

  const exit = () => {
    if (Object.keys(doneSets).length === 0 || confirm('Выйти без сохранения?')) {
      nav(-1)
    }
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const progress = total === 0 ? 0 : ((exIdx * totalSets + setIdx) / (total * (totalSets || 1))) * 100

  return (
    <div className="player-overlay">
      <div className="player-progress" style={{ width: `${progress}%` }} />
      <div className="player-head">
        <button className="btn btn-ghost btn-sm" onClick={exit}>✕ Выйти</button>
        <div className="text-muted" style={{ fontSize: 13 }}>
          Упр. <strong style={{ color: 'var(--text)' }}>{exIdx + 1}/{total}</strong> · Сет <strong style={{ color: 'var(--text)' }}>{setIdx + 1}/{totalSets}</strong> · {elapsedMin} мин
        </div>
        <span className="chip">{data.day.title}</span>
      </div>

      <div className="player-body">
        {ex && (
          <>
            <div className="media"><MediaPreview exercise={exercise} /></div>
            <h2>{exercise?.name}</h2>
            <div className="player-meta">
              {exercise?.muscle_group} · {ex.sets} × {ex.reps}
              {prev?.weight_kg && <> · Прошлый рекорд: <strong style={{ color: 'var(--brand-solid)' }}>{prev.weight_kg} кг × {prev.reps}</strong></>}
            </div>

            {restLeft > 0 ? (
              <>
                <div className="text-muted mb-8">Отдых</div>
                <div className="timer-pill">⏱ {fmt(restLeft)}</div>
                <div className="flex gap-8 mt-16" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => addRest(15)}>+15 сек</button>
                  <button className="btn btn-soft btn-sm" onClick={skipRest}>Пропустить</button>
                </div>
              </>
            ) : (
              <>
                <div className="set-grid">
                  {Array.from({ length: totalSets }).map((_, i) => {
                    const log = doneForEx[i]
                    return (
                      <div key={i} className={`set-tile ${log ? 'done' : ''} ${i === setIdx ? '' : ''}`} style={{ outline: i === setIdx ? '2px solid var(--brand-solid)' : 'none' }}>
                        <div className="num">Сет {i + 1}</div>
                        <div className="reps">{log ? log.reps : ex.reps}</div>
                        {log?.weight_kg ? <div className="w">{log.weight_kg} кг</div> : ex.weight_kg && <div className="w">{ex.weight_kg} кг</div>}
                      </div>
                    )
                  })}
                </div>

                <div className="card" style={{ maxWidth: 380, width: '100%' }}>
                  <div className="row-fields">
                    <div className="field">
                      <label>Повторы</label>
                      <input id="reps-input" className="input" type="number" defaultValue={Number(ex.reps) || ''} placeholder={ex.reps} />
                    </div>
                    <div className="field">
                      <label>Вес, кг</label>
                      <input id="weight-input" className="input" type="number" step="0.5" defaultValue={ex.weight_kg ?? prev?.weight_kg ?? ''} placeholder={ex.weight_kg || prev?.weight_kg || ''} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="player-footer">
        <button className="btn btn-ghost btn-sm" onClick={() => {
          if (setIdx > 0) setSetIdx(setIdx - 1)
          else if (exIdx > 0) { setExIdx(exIdx - 1); setSetIdx((items[exIdx - 1]?.item?.sets || 1) - 1) }
        }}>← Назад</button>
        {restLeft > 0 ? (
          <button className="btn" onClick={skipRest}>Готов к сету →</button>
        ) : (
          <button className="btn" onClick={finishSet}>Сет выполнен ✓</button>
        )}
        <button className="btn btn-ghost btn-sm" onClick={() => finishSession(doneSets)}>Завершить</button>
      </div>
    </div>
  )
}
