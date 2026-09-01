import { useEffect, useState } from 'react'

import { api } from '../api'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import Contact from '../components/landing/Contact'
import Faq from '../components/landing/Faq'
import Team from '../components/landing/Team'
import Hero from '../components/landing/Hero'
import Partners from '../components/landing/Partners'
import Process from '../components/landing/Process'
import Projects from '../components/landing/Projects'
import Services from '../components/landing/Services'
import TechMarquee from '../components/landing/TechMarquee'

export default function Landing() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    api
      .get('/public/landing')
      .then((res) => setData(res.data))
      .catch(() => setError(true))
  }, [])

  if (error) {
    return (
      <div className="page-loader">
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: 16, color: 'var(--s-muted)' }}>
            Не удалось загрузить данные. Проверьте, что backend запущен.
          </p>
          <button className="btn btn-ghost btn-sm" onClick={() => window.location.reload()}>
            Повторить
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <>
      <a href="#main" className="skip-link">
        К содержанию
      </a>
      <div className="grain" aria-hidden="true" />
      <Navbar />
      <main id="main">
        <Hero settings={data.settings} />
        <TechMarquee />
        <Services services={data.services} />
        <Process />
        <Projects projects={data.projects} />
        <Partners partners={data.partners} />
        <Team settings={data.settings} />
        <Faq />
        <Contact settings={data.settings} />
      </main>
      <Footer settings={data.settings} />
    </>
  )
}
