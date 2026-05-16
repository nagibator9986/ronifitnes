import { useEffect, useState } from 'react'
import api from '../../api'
import { Spinner, EmptyState } from '../../components/common'
import Modal from '../../components/Modal'

export default function AdminGallery() {
  const [photos, setPhotos] = useState(null)
  const [settings, setSettings] = useState(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    const [g, s] = await Promise.all([api.get('/admin/gallery'), api.get('/admin/settings')])
    setPhotos(g.data); setSettings(s.data)
  }
  useEffect(() => { load() }, [])

  const upload = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    if (!fd.get('file')) return
    setBusy(true)
    await api.post('/admin/gallery', fd)
    await load()
    setOpen(false)
    e.target.reset()
    setBusy(false)
  }

  const remove = async (id) => {
    if (!confirm('Удалить фото?')) return
    await api.delete(`/admin/gallery/${id}`)
    await load()
  }

  const saveSettings = async (e) => {
    e.preventDefault()
    const fd = Object.fromEntries(new FormData(e.target).entries())
    await api.put('/admin/settings', fd)
    await load()
    alert('Сохранено')
  }

  if (!photos || !settings) return <div className="container"><Spinner /></div>

  return (
    <div className="container">
      <h1 className="mb-16">Главная страница</h1>

      <div className="card card-lg mb-24">
        <h3>Тексты сайта</h3>
        <form onSubmit={saveSettings}>
          <div className="row-fields">
            <div className="field"><label>Заголовок (hero)</label><input className="input" name="hero_title" defaultValue={settings.hero_title || ''} /></div>
            <div className="field"><label>Подзаголовок</label><input className="input" name="hero_subtitle" defaultValue={settings.hero_subtitle || ''} /></div>
          </div>
          <div className="row-fields">
            <div className="field"><label>Имя тренера</label><input className="input" name="trainer_name" defaultValue={settings.trainer_name || ''} /></div>
            <div className="field"><label>Тэглайн</label><input className="input" name="trainer_tagline" defaultValue={settings.trainer_tagline || ''} /></div>
          </div>
          <div className="field"><label>Биография</label><textarea className="textarea" name="trainer_bio" defaultValue={settings.trainer_bio || ''} rows={4} /></div>
          <div className="field"><label>Достижения (по строке на пункт)</label><textarea className="textarea" name="achievements" defaultValue={settings.achievements || ''} rows={5} /></div>
          <div className="row-fields">
            <div className="field"><label>Телефон</label><input className="input" name="trainer_phone" defaultValue={settings.trainer_phone || ''} /></div>
            <div className="field"><label>Email</label><input className="input" name="trainer_email" defaultValue={settings.trainer_email || ''} /></div>
            <div className="field"><label>Instagram</label><input className="input" name="trainer_instagram" defaultValue={settings.trainer_instagram || ''} /></div>
          </div>
          <button className="btn">💾 Сохранить настройки</button>
        </form>
      </div>

      <div className="section-title">
        <h3 style={{ margin: 0 }}>Галерея ({photos.length})</h3>
        <button className="btn btn-soft" onClick={() => setOpen(true)}>+ Загрузить фото</button>
      </div>

      {photos.length === 0 ? <EmptyState icon="🖼️" title="Фотографий нет" /> : (
        <div className="gallery">
          {photos.map((p) => (
            <div key={p.id} className="gallery-item" style={{ aspectRatio: 1, position: 'relative' }}>
              <img src={p.file_url} alt="" loading="lazy" />
              <button className="btn btn-danger btn-icon" onClick={() => remove(p.id)} style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>×</button>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Загрузить фото в галерею">
        <form onSubmit={upload}>
          <div className="field"><label>Файл</label><input className="input" type="file" name="file" accept="image/*" required /></div>
          <div className="field"><label>Подпись (опционально)</label><input className="input" name="caption" /></div>
          <button className="btn btn-block" disabled={busy}>{busy ? 'Загружаем…' : 'Загрузить'}</button>
        </form>
      </Modal>
    </div>
  )
}
