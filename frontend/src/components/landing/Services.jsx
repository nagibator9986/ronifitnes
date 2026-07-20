import Icon from '../Icon'
import Reveal from '../Reveal'

export default function Services({ services }) {
  if (!services.length) return null
  return (
    <section className="section" id="services">
      <div className="container">
        <Reveal className="section-head">
          <span className="section-kicker">Что мы делаем</span>
          <h2 className="section-title">
            AI-решения <span className="grad-text">под любую задачу</span>
          </h2>
          <p className="section-sub">
            От первого прототипа до промышленной эксплуатации — берём на себя весь цикл:
            данные, модели, интеграции и поддержку.
          </p>
        </Reveal>
        <div className="services-grid">
          {services.map((s, i) => (
            <Reveal key={s.id} delay={(i % 3) * 90}>
              <article className="card service-card">
                <div className="service-icon">
                  <Icon name={s.icon} size={26} />
                </div>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
                {s.features.length > 0 && (
                  <ul className="service-features">
                    {s.features.map((f) => (
                      <li key={f}>
                        <Icon name="check" size={14} /> {f}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
