import { Link } from 'react-router-dom'

import Icon from './Icon'
import Logo from './Logo'

export default function Footer({ settings = {} }) {
  const socials = [
    settings.social_github && { icon: 'github', href: settings.social_github, label: 'GitHub' },
    settings.social_linkedin && { icon: 'linkedin', href: settings.social_linkedin, label: 'LinkedIn' },
    settings.contact_telegram && { icon: 'telegram', href: settings.contact_telegram, label: 'Telegram' },
  ].filter(Boolean)

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <Logo />
        <p>© {new Date().getFullYear()} IlluminartAI — AI-решения для бизнеса</p>
        <div className="footer-links">
          {socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}>
              <Icon name={s.icon} size={17} />
            </a>
          ))}
          <Link to="/admin">Админка</Link>
        </div>
      </div>
    </footer>
  )
}
