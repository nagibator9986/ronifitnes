import { useMemo, useState } from 'react'

import Icon from '../Icon'
import Modal from '../Modal'
import Reveal from '../Reveal'

export const CATEGORY_LABELS = {
  chatbot: 'Чат-боты',
  agent: 'AI-агенты',
  ml: 'ML-модели',
  vision: 'Компьютерное зрение',
  automation: 'Автоматизация',
  analytics: 'Аналитика',
}

const COVER = {
  chatbot: { from: '#7c3aed', to: '#4f46e5', icon: 'bot' },
  agent: { from: '#4f46e5', to: '#0ea5e9', icon: 'agent' },
  ml: { from: '#6d28d9', to: '#db2777', icon: 'brain' },
  vision: { from: '#0e7490', to: '#22d3ee', icon: 'vision' },
  automation: { from: '#b45309', to: '#f59e0b', icon: 'automation' },
  analytics: { from: '#047857', to: '#34d399', icon: 'chart' },
}

function Cover({ project }) {
  if (project.image_url) {
    return (
      <div className="project-cover">
        <img src={project.image_url} alt={project.title} loading="lazy" />
        {project.is_featured && <FeaturedBadge />}
      </div>
    )
  }
  const c = COVER[project.category] || COVER.chatbot
  return (
    <div className="project-cover">
      <div
        className="project-cover-gen"
        style={{ background: `linear-gradient(135deg, ${c.from} 0%, ${c.to} 100%)` }}
      >
        <div className="project-cover-grid" />
        <Icon name={c.icon} size={54} className="cover-icon" strokeWidth={1.4} />
      </div>
      {project.is_featured && <FeaturedBadge />}
    </div>
  )
}

function FeaturedBadge() {
  return (
    <span className="project-featured">
      <Icon name="star" size={12} /> Флагман
    </span>
  )
}

export default function Projects({ projects }) {
  const [filter, setFilter] = useState('all')
  const [active, setActive] = useState(null)

  const categories = useMemo(() => {
    const present = [...new Set(projects.map((p) => p.category))]
    return present.filter((c) => CATEGORY_LABELS[c])
  }, [projects])

  const shown = filter === 'all' ? projects : projects.filter((p) => p.category === filter)

  if (!projects.length) return null

  return (
    <section className="section" id="projects">
      <div className="container">
        <Reveal className="section-head">
          <span className="section-kicker">Наши проекты</span>
          <h2 className="section-title">
            Кейсы с <span className="grad-text">измеримым результатом</span>
          </h2>
          <p className="section-sub">
            Каждый проект — это конкретные цифры: сэкономленные часы, выросшая конверсия,
            снижение издержек.
          </p>
        </Reveal>

        <div className="projects-filters">
          <button
            className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Все проекты
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={`filter-chip ${filter === c ? 'active' : ''}`}
              onClick={() => setFilter(c)}
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
                onClick={() => setActive(p)}
                onKeyDown={(e) => e.key === 'Enter' && setActive(p)}
                tabIndex={0}
                role="button"
                aria-label={`Подробнее о проекте ${p.title}`}
              >
                <Cover project={p} />
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
        <Modal onClose={() => setActive(null)} wide>
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
            <p style={{ marginTop: 20 }}>
              <a
                href={active.link}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost btn-sm"
              >
                Открыть проект <Icon name="arrow-right" size={16} />
              </a>
            </p>
          )}
        </Modal>
      )}
    </section>
  )
}
