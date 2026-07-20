import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { api } from '../api'
import { useAuth } from '../auth'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import CollectionTab from '../components/admin/CollectionTab'
import MessagesTab from '../components/admin/MessagesTab'
import OverviewTab from '../components/admin/OverviewTab'
import SettingsTab from '../components/admin/SettingsTab'
import { CATEGORY_LABELS } from '../components/landing/Projects'

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))

const PROJECTS_CONFIG = {
  endpoint: 'projects',
  title: 'Проекты',
  subtitle: 'Кейсы в секции «Наши проекты»',
  addLabel: 'Добавить проект',
  titleField: 'title',
  defaults: {
    title: '',
    category: 'chatbot',
    client: '',
    tagline: '',
    description: '',
    tech_stack_raw: '',
    metrics_raw: '',
    image_url: '',
    link: '',
    is_featured: false,
    order_index: 0,
  },
  fields: [
    { key: 'title', label: 'Название *' },
    { key: 'category', label: 'Категория', type: 'select', options: CATEGORY_OPTIONS },
    { key: 'client', label: 'Клиент / отрасль' },
    { key: 'order_index', label: 'Порядок сортировки', type: 'number' },
    { key: 'tagline', label: 'Короткое описание (карточка)', type: 'textarea', rows: 2, full: true },
    { key: 'description', label: 'Полное описание (модалка)', type: 'textarea', rows: 6, full: true },
    {
      key: 'tech_stack_raw',
      label: 'Технологии (через запятую)',
      type: 'textarea',
      rows: 2,
      full: true,
      hint: 'Например: Python, LLM, RAG, PostgreSQL',
    },
    {
      key: 'metrics_raw',
      label: 'Метрики результата',
      type: 'textarea',
      rows: 3,
      full: true,
      hint: 'По одной в строке в формате «значение|подпись», напр.: −68%|нагрузка на операторов',
    },
    { key: 'image_url', label: 'Обложка', type: 'image', uploadKind: 'projects', full: true },
    { key: 'link', label: 'Ссылка на проект (необязательно)', full: true },
    { key: 'is_featured', label: 'Флагманский проект (бейдж «Флагман»)', type: 'checkbox', full: true },
  ],
  columns: [
    {
      key: 'image_url',
      label: '',
      render: (p) =>
        p.image_url ? (
          <img src={p.image_url} alt="" className="thumb" />
        ) : (
          <div className="thumb-empty">авто</div>
        ),
    },
    { key: 'title', label: 'Название' },
    { key: 'category', label: 'Категория', render: (p) => CATEGORY_LABELS[p.category] || p.category },
    { key: 'client', label: 'Клиент' },
    { key: 'is_featured', label: 'Флагман', render: (p) => (p.is_featured ? '★' : '—') },
    { key: 'order_index', label: 'Порядок' },
  ],
}

const PARTNERS_CONFIG = {
  endpoint: 'partners',
  title: 'Партнёры',
  subtitle: 'Компании в секции «С кем мы сотрудничаем»',
  addLabel: 'Добавить компанию',
  titleField: 'name',
  defaults: { name: '', logo_url: '', website: '', description: '', order_index: 0 },
  fields: [
    { key: 'name', label: 'Название *' },
    { key: 'order_index', label: 'Порядок сортировки', type: 'number' },
    { key: 'website', label: 'Сайт (https://…)', full: true },
    { key: 'description', label: 'Чем помогаем / суть сотрудничества', type: 'textarea', rows: 2, full: true },
    { key: 'logo_url', label: 'Логотип', type: 'image', uploadKind: 'partners', full: true },
  ],
  columns: [
    {
      key: 'logo_url',
      label: '',
      render: (p) =>
        p.logo_url ? (
          <img src={p.logo_url} alt="" className="thumb" style={{ objectFit: 'contain', background: '#fff' }} />
        ) : (
          <div className="thumb-empty">авто</div>
        ),
    },
    { key: 'name', label: 'Компания' },
    { key: 'description', label: 'Описание' },
    { key: 'order_index', label: 'Порядок' },
  ],
}

const SERVICES_CONFIG = {
  endpoint: 'services',
  title: 'Услуги',
  subtitle: 'Карточки в секции «Что мы делаем»',
  addLabel: 'Добавить услугу',
  titleField: 'title',
  defaults: {
    title: '',
    icon: 'spark',
    description: '',
    features_raw: '',
    order_index: 0,
    is_active: true,
  },
  fields: [
    { key: 'title', label: 'Название *' },
    { key: 'order_index', label: 'Порядок сортировки', type: 'number' },
    { key: 'icon', label: 'Иконка', type: 'icon', full: true },
    { key: 'description', label: 'Описание', type: 'textarea', rows: 3, full: true },
    {
      key: 'features_raw',
      label: 'Пункты-фичи (по одному в строке)',
      type: 'textarea',
      rows: 4,
      full: true,
    },
    { key: 'is_active', label: 'Показывать на сайте', type: 'checkbox', full: true },
  ],
  columns: [
    { key: 'icon', label: '', render: (s) => <Icon name={s.icon} size={18} /> },
    { key: 'title', label: 'Услуга' },
    { key: 'is_active', label: 'Активна', render: (s) => (s.is_active ? 'да' : 'скрыта') },
    { key: 'order_index', label: 'Порядок' },
  ],
}

const TABS = [
  { id: 'overview', label: 'Обзор', icon: 'grid' },
  { id: 'projects', label: 'Проекты', icon: 'briefcase' },
  { id: 'partners', label: 'Партнёры', icon: 'users' },
  { id: 'services', label: 'Услуги', icon: 'spark' },
  { id: 'messages', label: 'Заявки', icon: 'inbox' },
  { id: 'settings', label: 'Настройки', icon: 'settings' },
]

export default function Admin() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('overview')
  const [unread, setUnread] = useState(0)

  const refreshUnread = () => {
    api
      .get('/admin/overview')
      .then((res) => setUnread(res.data.unread_messages))
      .catch(() => {})
  }

  useEffect(refreshUnread, [])

  return (
    <div className="admin">
      <aside className="admin-side">
        <Link to="/" title="Открыть сайт">
          <Logo size={26} />
        </Link>
        <nav className="admin-nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? 'active' : ''}
              onClick={() => setTab(t.id)}
            >
              <Icon name={t.icon} size={17} />
              {t.label}
              {t.id === 'messages' && unread > 0 && <span className="unread">{unread}</span>}
            </button>
          ))}
        </nav>
        <div className="admin-user">
          <span>
            <b>{user?.full_name || user?.username}</b>
            администратор
          </span>
          <button className="icon-btn" onClick={logout} aria-label="Выйти" title="Выйти">
            <Icon name="logout" size={16} />
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {tab === 'overview' && <OverviewTab onOpenMessages={() => setTab('messages')} />}
        {tab === 'projects' && <CollectionTab config={PROJECTS_CONFIG} />}
        {tab === 'partners' && <CollectionTab config={PARTNERS_CONFIG} />}
        {tab === 'services' && <CollectionTab config={SERVICES_CONFIG} />}
        {tab === 'messages' && <MessagesTab onChanged={refreshUnread} />}
        {tab === 'settings' && <SettingsTab />}
      </main>
    </div>
  )
}
