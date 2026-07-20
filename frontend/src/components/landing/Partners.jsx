import Reveal from '../Reveal'

const LOGO_GRADIENTS = [
  'linear-gradient(135deg, #7c3aed, #4f46e5)',
  'linear-gradient(135deg, #0e7490, #22d3ee)',
  'linear-gradient(135deg, #be185d, #f472b6)',
  'linear-gradient(135deg, #047857, #34d399)',
  'linear-gradient(135deg, #b45309, #fbbf24)',
  'linear-gradient(135deg, #4338ca, #818cf8)',
]

function initials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export default function Partners({ partners }) {
  if (!partners.length) return null
  return (
    <section className="section" id="partners">
      <div className="container">
        <Reveal className="section-head">
          <span className="section-kicker">Партнёры</span>
          <h2 className="section-title">
            Компании, с которыми <span className="grad-text">мы сотрудничаем</span>
          </h2>
          <p className="section-sub">
            Нам доверяют команды из финтеха, ритейла, логистики, медицины и образования.
          </p>
        </Reveal>
        <div className="partners-grid">
          {partners.map((p, i) => {
            const body = (
              <>
                <div
                  className="partner-logo"
                  style={p.logo_url ? undefined : { background: LOGO_GRADIENTS[i % LOGO_GRADIENTS.length] }}
                >
                  {p.logo_url ? <img src={p.logo_url} alt={p.name} loading="lazy" /> : initials(p.name)}
                </div>
                <div>
                  <h3>{p.name}</h3>
                  {p.description && <p>{p.description}</p>}
                </div>
              </>
            )
            return (
              <Reveal key={p.id} delay={(i % 3) * 80}>
                {p.website ? (
                  <a className="card partner-card" href={p.website} target="_blank" rel="noreferrer">
                    {body}
                  </a>
                ) : (
                  <div className="card partner-card">{body}</div>
                )}
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
