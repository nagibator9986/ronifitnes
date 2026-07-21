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
          <span className="section-kicker">02 / Процесс</span>
          <h2 className="section-title">
            Прозрачный путь <em>от идеи до результата</em>
          </h2>
        </Reveal>
        <Reveal>
          <div className="process-grid">
            {STEPS.map((s, i) => (
              <div className="process-step" key={s.title}>
                <div className="process-num">{String(i + 1).padStart(2, '0')}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
