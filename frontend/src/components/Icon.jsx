// Единый набор stroke-иконок (стиль lucide). Использование: <Icon name="bot" size={22} />
const PATHS = {
  bot: (
    <>
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <path d="M12 8V4m0 0h3M9 13v1m6-1v1M9 17h6" />
    </>
  ),
  agent: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4m0 12v4M2 12h4m12 0h4M5.6 5.6l2.8 2.8m7.2 7.2 2.8 2.8m0-12.8-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </>
  ),
  brain: (
    <>
      <path d="M9.5 3A3.5 3.5 0 0 0 6 6.5c-1.8.4-3 1.9-3 3.8 0 1.1.4 2 1.1 2.7A4 4 0 0 0 6 20a4 4 0 0 0 6 -1.5V6.5A3.5 3.5 0 0 0 9.5 3Z" />
      <path d="M14.5 3A3.5 3.5 0 0 1 18 6.5c1.8.4 3 1.9 3 3.8 0 1.1-.4 2-1.1 2.7A4 4 0 0 1 18 20a4 4 0 0 1-6-1.5" />
    </>
  ),
  vision: (
    <>
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  automation: (
    <>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </>
  ),
  consult: (
    <>
      <path d="M8 10h8m-8 4h5" />
      <path d="M21 12a9 9 0 1 1-4.4-7.7L21 3l-1 4.5A8.9 8.9 0 0 1 21 12Z" />
    </>
  ),
  integration: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
      <path d="M10 6.5h5.5V12M14 17.5H8.5V12" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3v4m0 10v4M5.6 5.6l2.9 2.9m7 7 2.9 2.9M3 12h4m10 0h4M5.6 18.4l2.9-2.9m7-7 2.9-2.9" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 15l4-5 3 3 5-7" />
    </>
  ),
  doc: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5M9 13h6m-6 4h4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  rocket: (
    <>
      <path d="M5 15c-1.5 1.2-2 5-2 5s3.8-.5 5-2" />
      <path d="M15 12a20 20 0 0 0 5-8.5A20 20 0 0 0 11.5 8L7 12.5 11 16l4-4Z" />
      <path d="M7 12.5 5.5 11m7.5 6.5L14.5 19" />
    </>
  ),
  check: <path d="m5 12 5 5L20 7" />,
  'arrow-right': <path d="M5 12h14m-6-6 6 6-6 6" />,
  star: <path d="m12 3 2.7 5.8 6.3.8-4.6 4.3 1.2 6.1L12 17l-5.6 3 1.2-6.1L3 9.6l6.3-.8L12 3Z" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  phone: (
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  ),
  send: <path d="m22 2-7 20-4-9-9-4 20-7Zm0 0L11 13" />,
  pin: (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: (
    <>
      <path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
      <path d="M18.4 2.6a2 2 0 0 1 2.8 2.8L13 13.6 9 14.5l.9-4L18.4 2.6Z" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18m-2 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6m4-6v6" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5m5 5H9" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  inbox: (
    <>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.2 3H9.8l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2l.4 2.6h4.4l.4-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.06-.4.1-.8.1-1.2Z" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 5a3.5 3.5 0 0 1 0 7m5.5 8a6.5 6.5 0 0 0-4.5-6.2" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-13 5h18" />
    </>
  ),
  telegram: <path d="m21.5 3.5-19 7.5 5.5 2.2m13.5-9.7L18 20l-6.5-5.3m10-11.2-10 11.2m0 0L9 20l1.2-4.4" />,
  whatsapp: (
    <>
      <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z" />
      <path d="M8.8 9.2c.3 2.7 3.2 5.6 5.9 5.9l1.5-1.5-2.2-1.1-1 .7a5.4 5.4 0 0 1-2.2-2.2l.7-1-1.2-2.3-1.5 1.5Z" />
    </>
  ),
  github: (
    <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.4-1.1-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.7s.9-.3 2.8 1a9.5 9.5 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.3.2 2.4.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" />
  ),
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 10v7m0-10v.1M12 17v-4a2 2 0 0 1 4 0v4m0-7v.1" />
    </>
  ),
}

export default function Icon({ name, size = 20, strokeWidth = 1.8, className = '' }) {
  const path = PATHS[name] || PATHS.spark
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {path}
    </svg>
  )
}

export const SERVICE_ICONS = [
  'bot', 'agent', 'brain', 'vision', 'automation', 'consult',
  'integration', 'spark', 'chart', 'doc', 'shield', 'rocket',
]
