import Reveal from '../Reveal'

function initials(name) {
  return (name || 'A')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export default function Founder({ settings }) {
  const s = settings
  const skills = (s.founder_skills || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

  return (
    <section className="section" id="about">
      <div className="container">
        <Reveal className="section-head">
          <span className="section-kicker">О нас</span>
          <h2 className="section-title">
            Экспертиза, на которую <span className="grad-text">можно опереться</span>
          </h2>
        </Reveal>
        <div className="founder-wrap">
          <Reveal>
            <div className="founder-photo">
              {s.founder_photo ? (
                <img src={s.founder_photo} alt={s.founder_name} />
              ) : (
                <span className="founder-monogram">{initials(s.founder_name)}</span>
              )}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="founder-info">
              <h3>{s.founder_name}</h3>
              <p className="founder-role">{s.founder_role}</p>
              <p className="founder-bio">{s.founder_bio}</p>
              {skills.length > 0 && (
                <div className="founder-skills">
                  {skills.map((skill) => (
                    <span className="chip" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
