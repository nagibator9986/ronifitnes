import Reveal from '../Reveal'
import SectionHead from './SectionHead'

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
    <section className="section sec-paper" id="about">
      <div className="container">
        <SectionHead
          num="05"
          kicker="Основатель"
          title={
            <>
              Экспертиза, на которую <em>можно опереться</em>
            </>
          }
        />
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
              {s.founder_quote && (
                <blockquote className="founder-quote">
                  <p>«{s.founder_quote}»</p>
                </blockquote>
              )}
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
