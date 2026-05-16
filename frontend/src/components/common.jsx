export const DOW_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
export const DOW_RU_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
export const DOW_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export const MEAL_TYPES = [
  { value: 'breakfast', label: 'Завтрак', icon: '🍳' },
  { value: 'lunch', label: 'Обед', icon: '🍱' },
  { value: 'snack', label: 'Перекус', icon: '🍎' },
  { value: 'dinner', label: 'Ужин', icon: '🍽️' },
]

export const PERIOD_LABELS = [
  { value: 'before', label: 'Старт (до начала)' },
  { value: '1m', label: '1 месяц' },
  { value: '3m', label: '3 месяца' },
  { value: '6m', label: '6 месяцев' },
  { value: '1y', label: '1 год' },
  { value: 'custom', label: 'Другое' },
]

export const POSES = [
  { value: 'front', label: 'Спереди' },
  { value: 'side', label: 'Сбоку' },
  { value: 'back', label: 'Сзади' },
]

export const MUSCLE_GROUPS = [
  'Грудь', 'Спина', 'Плечи', 'Руки', 'Ноги', 'Пресс', 'Ягодицы', 'Кор', 'Кардио',
]

export function Spinner() {
  return <div className="spinner" />
}

export function EmptyState({ icon = '✨', title, hint }) {
  return (
    <div className="empty-state">
      <div className="icon">{icon}</div>
      <h3 style={{ margin: 0 }}>{title}</h3>
      {hint && <p className="text-muted mt-8" style={{ margin: 0 }}>{hint}</p>}
    </div>
  )
}

export function getYoutubeId(url) {
  if (!url) return null
  const m = url.match(/(?:v=|\/embed\/|\/v\/|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

export function MediaPreview({ exercise }) {
  if (!exercise) return <div className="placeholder">🏋️</div>
  if (exercise.media_kind === 'youtube' && exercise.media_url) {
    const id = getYoutubeId(exercise.media_url)
    if (id) {
      return <iframe src={`https://www.youtube.com/embed/${id}`} title={exercise.name} allowFullScreen />
    }
  }
  if ((exercise.media_kind === 'image' || exercise.media_kind === 'gif') && exercise.media_url) {
    return <img src={exercise.media_url} alt={exercise.name} loading="lazy" />
  }
  return <div className="placeholder">🏋️</div>
}

export function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

export function formatTime(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}
