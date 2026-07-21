import Icon from '../Icon'
import Reveal from '../Reveal'

export default function Services({ services }) {
  if (!services.length) return null
  return (
    <section className="section sec-paper" id="services">
      <div className="container">
        <Reveal className="section-head">
          <span className="section-kicker">01 / Услуги</span>
          <h2 className="section-title">
            AI-решения <em>под любую задачу</em>
          </h2>
          <p className="section-sub">
            От первого прототипа до промышленной эксплуатации — берём на себя весь цикл:
            данные, модели, интеграции и поддержку.
          </p>
        </Reveal>
        <Reveal>
          <div className="services-grid">
            {services.map((s, i) => (
              <article className="service-card" key={s.id}>
                <span className="service-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="service-icon">
                  <Icon name={s.icon} size={24} />
                </div>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
                {s.features.length > 0 && (
                  <ul className="service-features">
                    {s.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
