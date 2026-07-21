import Reveal from '../Reveal'

/**
 * Единая шапка секции: моно-киккер с номером, серифный заголовок,
 * подзаголовок и огромный контурный номер-декор справа.
 */
export default function SectionHead({ num, kicker, title, sub }) {
  return (
    <>
      <span className="ghost-num" aria-hidden="true">
        {num}
      </span>
      <Reveal className="section-head">
        <span className="section-kicker">
          {num} / {kicker}
        </span>
        <h2 className="section-title">{title}</h2>
        {sub && <p className="section-sub">{sub}</p>}
      </Reveal>
    </>
  )
}
