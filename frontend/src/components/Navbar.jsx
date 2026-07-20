import { useEffect, useState } from 'react'

import Icon from './Icon'
import Logo from './Logo'

const LINKS = [
  { href: '#services', label: 'Услуги' },
  { href: '#projects', label: 'Проекты' },
  { href: '#partners', label: 'Партнёры' },
  { href: '#about', label: 'О нас' },
  { href: '#contact', label: 'Контакты' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`nav ${scrolled || open ? 'scrolled' : ''}`}>
      <div className="container nav-inner">
        <a href="#top" aria-label="IlluminartAI — на главную">
          <Logo />
        </a>
        <nav aria-label="Основная навигация">
          <ul className="nav-links">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <a href="#contact" className="btn btn-primary btn-sm nav-cta">
          Обсудить проект
        </a>
        <button
          className="nav-burger"
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
          onClick={() => setOpen(!open)}
        >
          <Icon name={open ? 'x' : 'menu'} size={24} />
        </button>
      </div>
      {open && (
        <div className="nav-mobile">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <a href="#contact" className="btn btn-primary" onClick={() => setOpen(false)}>
            Обсудить проект
          </a>
        </div>
      )}
    </header>
  )
}
