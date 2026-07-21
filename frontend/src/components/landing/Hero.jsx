import { useEffect, useRef, useState } from 'react'

import Icon from '../Icon'
import ShardField from '../ShardField'

/** Плавный count-up для значений вида "40+", "24/7", "×3" — анимируем только число. */
function useCountUp(raw) {
  const [text, setText] = useState(raw)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    const match = /\d+/.exec(raw || '')
    if (!el || !match) {
      setText(raw)
      return
    }
    const target = parseInt(match[0], 10)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || target === 0) {
      setText(raw)
      return
    }
    let raf
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        const start = performance.now()
        const duration = 1400
        const step = (now) => {
          const p = Math.min(1, (now - start) / duration)
          const eased = 1 - Math.pow(1 - p, 3)
          setText(raw.replace(match[0], String(Math.round(target * eased))))
          if (p < 1) raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
      },
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [raw])

  return [ref, text]
}

function Stat({ value, label }) {
  const [ref, text] = useCountUp(value)
  return (
    <div className="stat-card" ref={ref}>
      <div className="stat-value">{text}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

export default function Hero({ settings }) {
  const s = settings
  const stats = [
    { value: s.stat_projects, label: s.stat_projects_label },
    { value: s.stat_clients, label: s.stat_clients_label },
    { value: s.stat_years, label: s.stat_years_label },
    { value: s.stat_uptime, label: s.stat_uptime_label },
  ].filter((x) => x.value)

  return (
    <section className="hero" id="top">
      <ShardField className="hero-canvas" />
      <div className="container">
        <div className="hero-grid">
          <div className="hero-content">
            <span className="badge">
              <span className="dot" />
              {s.hero_badge || 'AI-решения для бизнеса'}
            </span>
            <h1 className="hero-title">
              {s.hero_title ? (
                <HighlightedTitle title={s.hero_title} />
              ) : (
                <>
                  Инженерия искусственного интеллекта <em>как искусство</em>
                </>
              )}
            </h1>
            <p className="hero-sub">{s.hero_subtitle}</p>
            <div className="hero-actions">
              <a href="#contact" className="btn btn-primary">
                Обсудить проект <Icon name="arrow-right" size={16} />
              </a>
              <a href="#projects" className="btn btn-ghost">
                Смотреть кейсы
              </a>
            </div>
          </div>

          <figure className="hero-art">
            <img src="/brand/logo.jpg" alt="IlluminartAI — фирменный знак" />
            <figcaption>
              <span>Illuminart</span>
              <span>est. AI</span>
            </figcaption>
          </figure>
        </div>
      </div>

      {stats.length > 0 && (
        <div className="hero-stats">
          <div className="container" style={{ display: 'contents' }}>
            {stats.map((st) => (
              <Stat key={st.label} value={st.value} label={st.label} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

/** Последние два слова заголовка — курсивным серифом. */
function HighlightedTitle({ title }) {
  const words = title.trim().split(/\s+/)
  if (words.length < 4) return <em>{title}</em>
  const head = words.slice(0, -2).join(' ')
  const tail = words.slice(-2).join(' ')
  return (
    <>
      {head} <em>{tail}</em>
    </>
  )
}
