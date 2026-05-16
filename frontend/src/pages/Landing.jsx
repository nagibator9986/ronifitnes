import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { Spinner } from '../components/common'
import Modal from '../components/Modal'

export default function Landing() {
  const [data, setData] = useState(null)
  const [active, setActive] = useState(null)

  useEffect(() => {
    api.get('/public/landing').then((r) => setData(r.data))
  }, [])

  if (!data) return <div className="container"><Spinner /></div>

  const s = data.settings || {}
  const featured = (data.gallery || []).slice(0, 1)
  const heroPhoto = featured[0]?.file_url || data.gallery?.[0]?.file_url

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="chip brand mb-16">{s.trainer_tagline || 'Персональный тренер'}</span>
            <h1>
              <span className="accent">{(s.hero_title || 'RONI').split(' ')[0]}</span>
              <br />
              {(s.hero_title || 'FITNESS').split(' ').slice(1).join(' ') || 'FITNESS'}
            </h1>
            <p className="hero-sub">{s.hero_subtitle || 'Индивидуальные программы тренировок и питания. Только результат.'}</p>
            <div className="hero-actions">
              <Link to="/login" className="btn">Войти в кабинет</Link>
              <a href={`tel:${s.trainer_phone || ''}`} className="btn btn-ghost">{s.trainer_phone || 'Связаться'}</a>
            </div>
            <div className="grid grid-3 mt-24">
              <div className="stat">
                <div className="label">Опыт</div>
                <div className="value">8+ лет</div>
              </div>
              <div className="stat">
                <div className="label">Клиентов</div>
                <div className="value">200+</div>
              </div>
              <div className="stat">
                <div className="label">Программы</div>
                <div className="value">Авто</div>
              </div>
            </div>
          </div>
          <div className="hero-photo">
            {heroPhoto && <img src={heroPhoto} alt={s.trainer_name} />}
            <div className="hero-badge">
              <div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)' }}>Ваш тренер</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '.06em' }}>{s.trainer_name || 'Ruslan'}</div>
              </div>
              <span className="chip brand">{s.trainer_instagram || ''}</span>
            </div>
          </div>
        </div>
      </section>

      {/* BIO */}
      <section className="bio-section">
        <div className="container">
          <div className="section-title">
            <div>
              <span className="chip brand">обо мне</span>
              <h2 className="mt-8">Тренировки, которые меняют</h2>
            </div>
          </div>
          <div className="grid grid-2">
            <div className="card card-lg">
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: 'var(--muted)' }}>{s.trainer_bio}</p>
            </div>
            <div className="card card-lg">
              <h3>Достижения и направления</h3>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--muted)', lineHeight: 1.9 }}>
                {(s.achievements || '').split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="gallery-section">
        <div className="container">
          <div className="section-title">
            <div>
              <span className="chip brand">галерея</span>
              <h2 className="mt-8">В работе и в форме</h2>
            </div>
            <span className="text-muted">{data.gallery.length} фото</span>
          </div>
          <div className="gallery">
            {data.gallery.map((p) => (
              <div key={p.id} className="gallery-item" onClick={() => setActive(p)}>
                <img src={p.file_url} alt="" loading="lazy" />
              </div>
            ))}
          </div>

          <div className="cta-band">
            <div>
              <span className="chip" style={{ background: 'rgba(255,255,255,.15)', color: 'white', border: 0 }}>Готов начать?</span>
              <h2>Запишись на бесплатную консультацию</h2>
            </div>
            <Link to="/login" className="btn btn-ghost" style={{ background: 'white', color: 'var(--brand-solid)' }}>
              Войти в кабинет
            </Link>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container">
          <div>© {new Date().getFullYear()} RONI FITNESS · все права защищены</div>
          <div className="flex gap-16">
            <a href={`mailto:${s.trainer_email || ''}`}>{s.trainer_email}</a>
            <a href={`tel:${s.trainer_phone || ''}`}>{s.trainer_phone}</a>
            <span>{s.trainer_instagram}</span>
          </div>
        </div>
      </footer>

      <Modal open={!!active} onClose={() => setActive(null)} size="lg">
        {active && <img src={active.file_url} alt="" style={{ borderRadius: 12, maxHeight: '80vh', margin: '0 auto' }} />}
      </Modal>
    </>
  )
}
