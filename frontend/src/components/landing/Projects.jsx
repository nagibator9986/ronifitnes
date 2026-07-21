import { useMemo, useState } from 'react'

import Icon from '../Icon'
import Modal from '../Modal'
import Reveal from '../Reveal'
import SectionHead from './SectionHead'

export const CATEGORY_LABELS = {
  chatbot: 'Чат-боты',
  agent: 'AI-агенты',
  ml: 'ML-модели',
  vision: 'Компьютерное зрение',
  automation: 'Автоматизация',
  analytics: 'Аналитика',
}

const CATEGORY_CODES = {
  chatbot: 'BOT',
  agent: 'AGT',
  ml: 'ML',
  vision: 'CV',
  automation: 'AUT',
  analytics: 'BI',
}

/** Детерминированный ГПСЧ, чтобы обложка проекта не менялась между рендерами. */
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Генеративная обложка: белые «осколки» на чёрном — мотив логотипа. */
export function ShardCover({ seed, index, category }) {
  const art = useMemo(() => {
    const rnd = mulberry32(seed * 7919 + 17)
    const shards = []
    const n = 9 + Math.floor(rnd() * 5)
    for (let i = 0; i < n; i++) {
      const cx = 30 + rnd() * 260
      const cy = 20 + rnd() * 160
      const r = 8 + rnd() * 26
      const sides = 3 + Math.floor(rnd() * 2)
      const pts = []
      for (let k = 0; k < sides; k++) {
        const a = (k / sides) * Math.PI * 2 + rnd() * 1.1
        const rr = r * (0.5 + rnd() * 0.7)
        pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`)
      }
      shards.push({
        points: pts.join(' '),
        filled: rnd() > 0.4,
        opacity: 0.55 + rnd() * 0.45,
      })
    }
    // две диагональные волосяные линии для глубины композиции
    const lines = [0, 1].map(() => ({
      x1: rnd() * 320,
      y1: -10,
      x2: rnd() * 320,
      y2: 210,
      opacity: 0.14 + rnd() * 0.12,
    }))
    return { shards, lines }
  }, [seed])

  return (
    <div className="project-cover-gen" aria-hidden="true">
      <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice">
        <rect width="320" height="200" fill="#000" />
        <rect x="12" y="12" width="296" height="176" fill="none" stroke="#f6f3ec" strokeOpacity="0.5" strokeWidth="1" />
        {art.lines.map((l, i) => (
          <line key={`l${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#f6f3ec" strokeOpacity={l.opacity} />
        ))}
        {art.shards.map((sh, i) =>
          sh.filled ? (
            <polygon key={i} points={sh.points} fill="#f6f3ec" fillOpacity={sh.opacity} />
          ) : (
            <polygon key={i} points={sh.points} fill="none" stroke="#f6f3ec" strokeOpacity={sh.opacity} />
          ),
        )}
        <text
          x="26"
          y="176"
          fill="#f6f3ec"
          fontFamily="Playfair Display, Georgia, serif"
          fontStyle="italic"
          fontSize="44"
        >
          {String(index + 1).padStart(2, '0')}
        </text>
        <text
          x="294"
          y="36"
          textAnchor="end"
          fill="#f6f3ec"
          fillOpacity="0.72"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          letterSpacing="3"
        >
          {CATEGORY_CODES[category] || 'AI'}
        </text>
      </svg>
    </div>
  )
}

function Cover({ project, index }) {
  return (
    <div className="project-cover">
      {project.image_url ? (
        <img src={project.image_url} alt={project.title} loading="lazy" />
      ) : (
        <ShardCover seed={project.id} index={index} category={project.category} />
      )}
      {project.is_featured && (
        <span className="project-featured">
          <Icon name="star" size={11} /> Флагман
        </span>
      )}
      <span className="project-cta">
        Смотреть кейс <Icon name="arrow-right" size={13} />
      </span>
    </div>
  )
}

export default function Projects({ projects }) {
  const [filter, setFilter] = useState('all')
  const [activeIdx, setActiveIdx] = useState(-1)

  const categories = useMemo(() => {
    const present = [...new Set(projects.map((p) => p.category))]
    return present.filter((c) => CATEGORY_LABELS[c])
  }, [projects])

  const shown = filter === 'all' ? projects : projects.filter((p) => p.category === filter)
  const active = activeIdx >= 0 ? shown[activeIdx] : null

  const step = (delta) => {
    setActiveIdx((i) => (i + delta + shown.length) % shown.length)
  }

  if (!projects.length) return null

  return (
    <section className="section sec-paper" id="projects">
      <div className="container">
        <SectionHead
          num="03"
          kicker="Портфолио"
          title={
            <>
              Кейсы с <em>измеримым результатом</em>
            </>
          }
          sub="Каждый проект — это конкретные цифры: сэкономленные часы, выросшая конверсия, снижение издержек."
        />

        <div className="projects-filters">
          <button
            className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => {
              setFilter('all')
              setActiveIdx(-1)
            }}
          >
            Все проекты
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={`filter-chip ${filter === c ? 'active' : ''}`}
              onClick={() => {
                setFilter(c)
                setActiveIdx(-1)
              }}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        <div className="projects-grid">
          {shown.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 90}>
              <article
                className="card project-card"
                onClick={() => setActiveIdx(i)}
                onKeyDown={(e) => e.key === 'Enter' && setActiveIdx(i)}
                tabIndex={0}
                role="button"
                aria-label={`Подробнее о проекте ${p.title}`}
              >
                <Cover project={p} index={projects.indexOf(p)} />
                <div className="project-body">
                  <span className="project-cat">{CATEGORY_LABELS[p.category] || p.category}</span>
                  <h3>{p.title}</h3>
                  <p className="tagline">{p.tagline}</p>
                  {p.metrics.length > 0 && (
                    <div className="project-metrics">
                      {p.metrics.slice(0, 3).map((m) => (
                        <div className="project-metric" key={m.label}>
                          <b>{m.value}</b>
                          <span>{m.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>

      {active && (
        <Modal onClose={() => setActiveIdx(-1)} wide>
          <div className="modal-cover">
            {active.image_url ? (
              <img src={active.image_url} alt={active.title} />
            ) : (
              <ShardCover
                seed={active.id}
                index={projects.indexOf(active)}
                category={active.category}
              />
            )}
          </div>
          <span className="project-cat">{CATEGORY_LABELS[active.category] || active.category}</span>
          <h3>{active.title}</h3>
          {active.client && <p className="project-client">Клиент: {active.client}</p>}
          {active.metrics.length > 0 && (
            <div className="project-metrics" style={{ borderTop: 'none', paddingTop: 0 }}>
              {active.metrics.map((m) => (
                <div className="project-metric" key={m.label}>
                  <b>{m.value}</b>
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          )}
          <p className="description">{active.description || active.tagline}</p>
          {active.tech_stack.length > 0 && (
            <div className="project-tech">
              {active.tech_stack.map((t) => (
                <span className="chip" key={t}>
                  {t}
                </span>
              ))}
            </div>
          )}
          {active.link && (
            <p style={{ marginTop: 24 }}>
              <a
                href={active.link}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost btn-sm"
              >
                Открыть проект <Icon name="arrow-right" size={15} />
              </a>
            </p>
          )}
          {shown.length > 1 && (
            <div className="modal-nav">
              <button onClick={() => step(-1)}>← Пред. проект</button>
              <span className="counter">
                {String(activeIdx + 1).padStart(2, '0')} / {String(shown.length).padStart(2, '0')}
              </span>
              <button onClick={() => step(1)}>След. проект →</button>
            </div>
          )}
        </Modal>
      )}
    </section>
  )
}
