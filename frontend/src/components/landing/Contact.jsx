import { useState } from 'react'

import { api, apiError } from '../../api'
import Icon from '../Icon'
import Reveal from '../Reveal'

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
    <section className="section" id="contact">
      <div className="container">
        <Reveal>
          <div className="cta-banner" style={{ marginBottom: 72 }}>
            <h2>
              Готовы внедрить <span className="grad-text">AI в свой бизнес?</span>
            </h2>
            <p>
              Расскажите о своей задаче — предложим решение, оценим сроки и покажем, какой
              эффект даст внедрение. Первая консультация бесплатна.
            </p>
            <a href="#contact-form" className="btn btn-primary">
              Оставить заявку <Icon name="arrow-right" size={18} />
            </a>
          </div>
        </Reveal>

        <div className="contact-wrap" id="contact-form">
          <Reveal>
            <div className="contact-info">
              <h2>
                Свяжитесь <span className="grad-text">с нами</span>
              </h2>
              <p>
                Ответим в течение рабочего дня. Можно коротко: чем занимаетесь и какую
                задачу хотите решить — остальное выясним на созвоне.
              </p>
              <div className="contact-list">
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
                        <Icon name={it.icon} size={20} />
                      </span>
                      {it.label}
                    </a>
                  ) : (
                    <div className="contact-item" key={it.label}>
                      <span className="ico">
                        <Icon name={it.icon} size={20} />
                      </span>
                      {it.label}
                    </div>
                  ),
                )}
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <form className="card contact-form" onSubmit={submit}>
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
                <Icon name="send" size={17} />
              </button>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
