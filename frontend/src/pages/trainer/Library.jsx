import { useEffect, useMemo, useState } from 'react'
import api from '../../api'
import { Spinner, EmptyState, MUSCLE_GROUPS, MediaPreview } from '../../components/common'
import { useToast } from '../../components/Toast'
import Modal from '../../components/Modal'

export default function TrainerLibrary() {
  const [items, setItems] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const load = () => api.get('/trainer/exercises').then((r) => setItems(r.data))
  useEffect(() => { load() }, [])

  const save = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    setBusy(true)
    try {
      if (edit) {
        await api.patch(`/trainer/exercises/${edit.id}`, {
          name: fd.get('name'),
          muscle_group: fd.get('muscle_group') || null,
          purpose: fd.get('purpose'),
          instructions: fd.get('instructions'),
          media_kind: fd.get('media_kind'),
          media_url: fd.get('media_url') || null,
        })
        toast.success('Упражнение обновлено')
      } else {
        await api.post('/trainer/exercises', fd)
        toast.success('Упражнение добавлено')
      }
      setOpen(false); setEdit(null)
      await load()
    } catch (err) {
      toast.error('Ошибка', err.response?.data?.error)
    } finally { setBusy(false) }
  }

  const remove = async (id) => {
    if (!confirm('Удалить упражнение?')) return
    await api.delete(`/trainer/exercises/${id}`)
    toast.info('Удалено')
    await load()
  }

  const visible = useMemo(() => {
    if (!items) return []
    return items.filter((e) => {
      if (filter !== 'all' && e.muscle_group !== filter) return false
      if (search && !`${e.name} ${e.muscle_group || ''}`.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [items, filter, search])

  if (!items) return <div className="container"><Spinner /></div>

  return (
    <div className="container">
      <div className="section-title">
        <div>
          <span className="chip brand">{items.length} упражнений</span>
          <h1 className="mt-8">Библиотека упражнений</h1>
        </div>
        <button className="btn" onClick={() => { setEdit(null); setOpen(true) }}>+ Новое упражнение</button>
      </div>

      <div className="flex gap-12 mb-16" style={{ flexWrap: 'wrap' }}>
        <input className="input" placeholder="🔍 Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300, minHeight: 40 }} />
        <div className="chip-row" style={{ flex: 1 }}>
          <button className={`chip ${filter === 'all' ? 'brand' : ''}`} onClick={() => setFilter('all')} style={{ cursor: 'pointer' }}>Все</button>
          {MUSCLE_GROUPS.map((g) => (
            <button key={g} className={`chip ${filter === g ? 'brand' : ''}`} onClick={() => setFilter(g)} style={{ cursor: 'pointer' }}>{g}</button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon="📚" title={items.length === 0 ? 'Здесь пусто' : 'Ничего не найдено'} hint={items.length === 0 ? 'Добавьте первое упражнение' : 'Попробуйте другой фильтр'} />
      ) : (
        <div className="grid grid-3">
          {visible.map((e) => (
            <div className="ex-card" key={e.id}>
              <div className="media"><MediaPreview exercise={e} /></div>
              <div className="body">
                <h4>{e.name}</h4>
                {e.muscle_group && <div className="muscle">{e.muscle_group}</div>}
                {e.purpose && <p className="text-muted" style={{ fontSize: 13, marginTop: 6, marginBottom: 0 }}>{e.purpose}</p>}
              </div>
              <div className="actions">
                <button className="btn btn-soft btn-sm" onClick={() => { setEdit(e); setOpen(true) }}>✎ Изменить</button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(e.id)}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => { setOpen(false); setEdit(null) }} title={edit ? 'Редактировать упражнение' : 'Новое упражнение'} size="lg">
        <form onSubmit={save}>
          <div className="row-fields">
            <div className="field">
              <label>Название *</label>
              <input className="input" name="name" required defaultValue={edit?.name || ''} />
            </div>
            <div className="field">
              <label>Группа мышц</label>
              <select className="select" name="muscle_group" defaultValue={edit?.muscle_group || ''}>
                <option value="">—</option>
                {MUSCLE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Для чего (цель)</label>
            <textarea className="textarea" name="purpose" defaultValue={edit?.purpose || ''} placeholder="Что развивает упражнение" />
          </div>
          <div className="field">
            <label>Техника / инструкции</label>
            <textarea className="textarea" name="instructions" defaultValue={edit?.instructions || ''} placeholder="Как правильно выполнять" />
          </div>
          <div className="row-fields">
            <div className="field">
              <label>Тип медиа</label>
              <select className="select" name="media_kind" defaultValue={edit?.media_kind || 'none'}>
                <option value="none">Без медиа</option>
                <option value="youtube">YouTube ссылка</option>
                <option value="image">Изображение / GIF</option>
              </select>
            </div>
            <div className="field">
              <label>YouTube URL</label>
              <input className="input" name="media_url" defaultValue={edit?.media_url || ''} placeholder="https://youtube.com/..." />
            </div>
          </div>
          {!edit && (
            <div className="field">
              <label>Или загрузите GIF / картинку</label>
              <input className="input" type="file" name="file" accept="image/*" />
            </div>
          )}
          <button className="btn btn-block" disabled={busy}>{busy ? 'Сохраняем…' : 'Сохранить'}</button>
        </form>
      </Modal>
    </div>
  )
}
