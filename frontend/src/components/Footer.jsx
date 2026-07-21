import { Link } from 'react-router-dom'

import Icon from './Icon'
import Logo from './Logo'

const NAV = [
  { href: '#services', label: 'Услуги' },
  { href: '#process', label: 'Процесс' },
  { href: '#projects', label: 'Проекты' },
  { href: '#partners', label: 'Партнёры' },
  { href: '#faq', label: 'FAQ' },
]

export default function Footer({ settings = {} }) {
  const socials = [
    settings.social_github && { icon: 'github', href: settings.social_github, label: 'GitHub' },
    settings.social_linkedin && { icon: 'linkedin', href: settings.social_linkedin, label: 'LinkedIn' },
    settings.contact_telegram && { icon: 'telegram', href: settings.contact_telegram, label: 'Telegram' },
  ].filter(Boolean)

  return (
    <footer className="footer">
      <div className="container footer-cta">
        <h2>
          Есть задача для AI? <em>Обсудим.</em>
        </h2>
        <a href="#contact-form" className="btn btn-primary">
          Оставить заявку <Icon name="arrow-right" size={16} />
        </a>
      </div>

      <div className="container footer-mid">
        <Logo />
        <nav className="footer-nav" aria-label="Навигация в подвале">
          {NAV.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="footer-links">
          {socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}>
              <Icon name={s.icon} size={17} />
            </a>
          ))}
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} IlluminartAI — AI-решения для бизнеса</p>
        <div className="footer-links">
          <Link to="/admin">Админка</Link>
          <button
            className="to-top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Наверх"
          >
            Наверх ↑
          </button>
        </div>
      </div>
    </footer>
  )
}
