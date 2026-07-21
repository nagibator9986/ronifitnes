import { useState } from 'react'

import { api, apiError } from '../../api'
import Icon from '../Icon'
import Reveal from '../Reveal'
import SectionHead from './SectionHead'

const EMPTY = { name: '', email: '', phone: '', company: '', message: '' }

export default function Contact({ settings }) {
  const s = settings
  const [form, setForm] = useState(EMPTY)
  const [status, setStatus] = useState({ state: 'idle', text: '' })

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setStatus({ state: 'loading', text: '' })
    try {
      const res = await api.post('/public/contact', form)
      setStatus({ state: 'success', text: res.data.message })
      setForm(EMPTY)
    } catch (err) {
      setStatus({ state: 'error', text: apiError(err) })
    }
  }

  const items = [
    s.contact_email && { icon: 'mail', label: s.contact_email, href: `mailto:${s.contact_email}` },
    s.contact_phone && {
      icon: 'phone',
      label: s.contact_phone,
      href: `tel:${s.contact_phone.replace(/[^+\d]/g, '')}`,
    },
    s.contact_telegram && { icon: 'telegram', label: 'Telegram', href: s.contact_telegram },
    s.contact_whatsapp && { icon: 'whatsapp', label: 'WhatsApp', href: s.contact_whatsapp },
    s.contact_address && { icon: 'pin', label: s.contact_address },
  ].filter(Boolean)

  return (
    <section className="section sec-paper" id="contact">
      <div className="container">
        <SectionHead
          num="07"
          kicker="Контакты"
          title={
            <>
              Свяжитесь <em>с нами</em>
            </>
          }
          sub="Ответим в течение рабочего дня. Можно коротко: чем занимаетесь и какую задачу хотите решить — остальное выясним на созвоне."
        />

        <div className="contact-wrap" id="contact-form">
          <Reveal>
            <div className="contact-info">
              <div className="contact-list" style={{ marginTop: 4 }}>
                {items.map((it) =>
                  it.href ? (
                    <a
                      className="contact-item"
                      key={it.label}
                      href={it.href}
                      target={it.href.startsWith('http') ? '_blank' : undefined}
                      rel="noreferrer"
                    >
                      <span className="ico">
                        <Icon name={it.icon} size={18} />
                      </span>
                      {it.label}
                    </a>
                  ) : (
                    <div className="contact-item" key={it.label}>
                      <span className="ico">
                        <Icon name={it.icon} size={18} />
                      </span>
                      {it.label}
                    </div>
                  ),
                )}
              </div>
              <Reveal delay={150}>
                <div className="cta-banner" style={{ marginTop: 44, textAlign: 'left', padding: '34px 32px' }}>
                  <h2 style={{ fontSize: '1.35rem', marginBottom: 10 }}>
                    Первая консультация — <em>бесплатно</em>
                  </h2>
                  <p style={{ margin: 0, maxWidth: 'none' }}>
                    Покажем похожие кейсы, оценим сроки и честно скажем, если AI вам
                    пока не нужен.
                  </p>
                </div>
              </Reveal>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <form className="card contact-form form-lined" onSubmit={submit}>
              <div className="row">
                <div className="field">
                  <label htmlFor="cf-name">Ваше имя *</label>
                  <input id="cf-name" value={form.name} onChange={set('name')} required placeholder="Азамат" />
                </div>
                <div className="field">
                  <label htmlFor="cf-company">Компания</label>
                  <input id="cf-company" value={form.company} onChange={set('company')} placeholder="ТОО «Компания»" />
                </div>
              </div>
              <div className="row">
                <div className="field">
                  <label htmlFor="cf-email">Email</label>
                  <input id="cf-email" type="email" value={form.email} onChange={set('email')} placeholder="you@company.kz" />
                </div>
                <div className="field">
                  <label htmlFor="cf-phone">Телефон</label>
                  <input id="cf-phone" value={form.phone} onChange={set('phone')} placeholder="+7 700 000 00 00" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="cf-message">Опишите задачу *</label>
                <textarea
                  id="cf-message"
                  value={form.message}
                  onChange={set('message')}
                  required
                  placeholder="Например: хотим чат-бота, который отвечает клиентам по нашей базе знаний…"
                />
              </div>
              {status.state === 'error' && <p className="form-error">{status.text}</p>}
              {status.state === 'success' && <p className="form-success">{status.text}</p>}
              <button className="btn btn-primary" disabled={status.state === 'loading'}>
                {status.state === 'loading' ? 'Отправляем…' : 'Отправить заявку'}
                <Icon name="send" size={15} />
              </button>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
