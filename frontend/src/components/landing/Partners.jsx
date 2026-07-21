import Reveal from '../Reveal'
import SectionHead from './SectionHead'

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
        <SectionHead
          num="04"
          kicker="Партнёры"
          title={
            <>
              Компании, с которыми <em>мы сотрудничаем</em>
            </>
          }
          sub="Нам доверяют команды из финтеха, ритейла, логистики, медицины и образования."
        />
        <Reveal>
          <div className="partners-grid">
            {partners.map((p, i) => {
              const body = (
                <>
                  <span className="partner-num">{String(i + 1).padStart(2, '0')}</span>
                  <div className="partner-logo">
                    {p.logo_url ? <img src={p.logo_url} alt={p.name} loading="lazy" /> : initials(p.name)}
                  </div>
                  <div>
                    <h3>{p.name}</h3>
                    {p.description && <p>{p.description}</p>}
                  </div>
                </>
              )
              return p.website ? (
                <a className="partner-card" key={p.id} href={p.website} target="_blank" rel="noreferrer">
                  {body}
                </a>
              ) : (
                <div className="partner-card" key={p.id}>
                  {body}
                </div>
              )
            })}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
