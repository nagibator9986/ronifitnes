import Reveal from '../Reveal'
import SectionHead from './SectionHead'

/** Фирменный знак-«осколки» — заглушка, пока не загружено фото команды. */
function TeamMark() {
  return (
    <svg className="team-mark" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="3" y="3" width="58" height="58" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <polygon points="30,12 41,19 33,27 25,21" fill="currentColor" />
      <polygon points="23,30 35,28 38,38 26,41" fill="currentColor" />
      <polygon points="41,30 47,36 42,44 38,40" fill="currentColor" opacity=".85" />
      <polygon points="21,45 31,44 28,53 19,50" fill="currentColor" opacity=".9" />
      <polygon points="44,14 50,16 47,23" fill="currentColor" opacity=".7" />
      <polygon points="15,23 21,25 18,32 14,29" fill="currentColor" opacity=".65" />
    </svg>
  )
}

export default function Team({ settings }) {
  const s = settings
  const skills = (s.team_skills || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

  return (
    <section className="section sec-paper" id="about">
      <div className="container">
        <SectionHead
          num="05"
          kicker="Команда"
          title={
            <>
              Команда, на которую <em>можно опереться</em>
            </>
          }
        />
        <div className="team-wrap">
          <Reveal>
            <div className="team-photo">
              {s.team_photo ? <img src={s.team_photo} alt={s.team_name} /> : <TeamMark />}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="team-info">
              <h3>{s.team_name}</h3>
              <p className="team-role">{s.team_role}</p>
              <p className="team-bio">{s.team_bio}</p>
              {s.team_quote && (
                <blockquote className="team-quote">
                  <p>«{s.team_quote}»</p>
                </blockquote>
              )}
              {skills.length > 0 && (
                <div className="team-skills">
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
