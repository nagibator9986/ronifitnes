import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../auth'
import NotificationBell from './NotificationBell'

const ICONS = {
  home: '🏠',
  plan: '🏋️',
  progress: '📈',
  chat: '💬',
  profile: '👤',
  clients: '👥',
  library: '📚',
  admin: '⚙️',
  gallery: '🖼️',
  trainer: '🔥',
  cal: '📅',
  trophy: '🏆',
  layers: '🧱',
  money: '💰',
  schedule: '🗓',
}

function BottomNav({ items }) {
  return (
    <nav className="bottom-nav">
      <div className="row" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((it) => (
          <NavLink key={it.to} to={it.to} end={it.end}>
            {({ isActive }) => (
              <div className={isActive ? 'active' : ''} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                <span className="icon">{ICONS[it.icon]}</span>
                <span>{it.label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()

  let topNav = []
  let bottomNav = []
  if (user?.role === 'client') {
    topNav = [
      { to: '/app', label: 'Сегодня', icon: 'home', end: true },
      { to: '/app/plan', label: 'Программа', icon: 'plan' },
      { to: '/app/calendar', label: 'Календарь', icon: 'cal' },
      { to: '/app/progress', label: 'Прогресс', icon: 'progress' },
      { to: '/app/achievements', label: 'Награды', icon: 'trophy' },
      { to: '/app/chat', label: 'Чат', icon: 'chat' },
    ]
    bottomNav = [
      { to: '/app', label: 'Дом', icon: 'home', end: true },
      { to: '/app/plan', label: 'План', icon: 'plan' },
      { to: '/app/calendar', label: 'Кал.', icon: 'cal' },
      { to: '/app/progress', label: 'Прогресс', icon: 'progress' },
      { to: '/app/chat', label: 'Чат', icon: 'chat' },
    ]
  } else if (user?.role === 'trainer') {
    topNav = [
      { to: '/trainer', label: 'Обзор', icon: 'home', end: true },
      { to: '/trainer/clients', label: 'Клиенты', icon: 'clients' },
      { to: '/trainer/schedule', label: 'Расписание', icon: 'schedule' },
      { to: '/trainer/finance', label: 'Финансы', icon: 'money' },
      { to: '/trainer/library', label: 'Библиотека', icon: 'library' },
      { to: '/trainer/templates', label: 'Шаблоны', icon: 'layers' },
    ]
    bottomNav = [
      { to: '/trainer', label: 'Обзор', icon: 'home', end: true },
      { to: '/trainer/clients', label: 'Клиенты', icon: 'clients' },
      { to: '/trainer/schedule', label: 'Расп.', icon: 'schedule' },
      { to: '/trainer/finance', label: 'Деньги', icon: 'money' },
      { to: '/app/profile', label: 'Я', icon: 'profile' },
    ]
  } else if (user?.role === 'admin') {
    topNav = [
      { to: '/admin', label: 'Пользователи', icon: 'admin', end: true },
      { to: '/admin/trainers', label: 'Тренеры', icon: 'trainer' },
      { to: '/admin/activity', label: 'Активность', icon: 'progress' },
      { to: '/admin/gallery', label: 'Сайт', icon: 'gallery' },
      { to: '/trainer/schedule', label: 'Расписание', icon: 'schedule' },
      { to: '/trainer/finance', label: 'Финансы', icon: 'money' },
    ]
    bottomNav = [
      { to: '/admin', label: 'Польз.', icon: 'admin', end: true },
      { to: '/admin/trainers', label: 'Тренеры', icon: 'trainer' },
      { to: '/trainer/finance', label: 'Деньги', icon: 'money' },
      { to: '/admin/gallery', label: 'Сайт', icon: 'gallery' },
      { to: '/app/profile', label: 'Я', icon: 'profile' },
    ]
  }

  const initial = (user?.full_name || '?')[0]?.toUpperCase()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="container">
          <NavLink to="/" className="brand-logo always">
            <span className="dot" />
            <span className="accent">RONI</span>
            <span>FITNESS</span>
          </NavLink>
          <nav>
            {topNav.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.end} className={({isActive}) => isActive ? 'active' : ''}>
                {it.label}
              </NavLink>
            ))}
            {user && <NotificationBell />}
            {user && (
              <button className="user-chip" onClick={() => location.assign('/app/profile')} style={{ marginLeft: 8 }}>
                <span className="avatar">{initial}</span>
                <span className="full">{user.full_name}</span>
              </button>
            )}
            {user && (
              <button className="btn btn-ghost btn-sm" onClick={logout} style={{ marginLeft: 6 }}>
                Выход
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="page">{children}</main>
      {user && <BottomNav items={bottomNav} />}
    </div>
  )
}
