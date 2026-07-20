import Reveal from '../Reveal'

const STEPS = [
  {
    title: 'Discovery и AI-аудит',
    text: 'Погружаемся в процессы, находим точки, где AI даст максимальный эффект, считаем экономику решения.',
  },
  {
    title: 'Прототип за 2–4 недели',
    text: 'Быстро собираем работающий Proof-of-Concept на ваших данных — вы видите результат до больших инвестиций.',
  },
  {
    title: 'Разработка и внедрение',
    text: 'Доводим решение до продакшена: интеграции, безопасность, нагрузочное тестирование, обучение команды.',
  },
  {
    title: 'Поддержка и развитие',
    text: 'Мониторим качество моделей, дообучаем их на новых данных и развиваем продукт вместе с вашим бизнесом.',
  },
]

export default function Process() {
  return (
    <section className="section" id="process">
      <div className="container">
        <Reveal className="section-head">
          <span className="section-kicker">Как мы работаем</span>
          <h2 className="section-title">
            Прозрачный путь <span className="grad-text">от идеи до результата</span>
          </h2>
        </Reveal>
        <div className="process-grid">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 90}>
              <div className="card process-step">
                <div className="process-num">{String(i + 1).padStart(2, '0')}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
