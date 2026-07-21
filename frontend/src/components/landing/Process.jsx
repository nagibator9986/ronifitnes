import Reveal from '../Reveal'
import SectionHead from './SectionHead'

const STEPS = [
  {
    title: 'Discovery и AI-аудит',
    text: 'Погружаемся в процессы, находим точки, где AI даст максимальный эффект, считаем экономику решения.',
    dur: '1 неделя',
  },
  {
    title: 'Прототип на ваших данных',
    text: 'Быстро собираем работающий Proof-of-Concept — вы видите результат до больших инвестиций.',
    dur: '2–4 недели',
  },
  {
    title: 'Разработка и внедрение',
    text: 'Доводим решение до продакшена: интеграции, безопасность, нагрузочное тестирование, обучение команды.',
    dur: 'от 4 недель',
  },
  {
    title: 'Поддержка и развитие',
    text: 'Мониторим качество моделей, дообучаем их на новых данных и развиваем продукт вместе с вашим бизнесом.',
    dur: 'непрерывно',
  },
]

export default function Process() {
  return (
    <section className="section" id="process">
      <div className="container">
        <SectionHead
          num="02"
          kicker="Процесс"
          title={
            <>
              Прозрачный путь <em>от идеи до результата</em>
            </>
          }
        />
        <Reveal>
          <div className="process-grid">
            {STEPS.map((s, i) => (
              <div className="process-step" key={s.title}>
                <div className="process-num">{String(i + 1).padStart(2, '0')}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <span className="process-dur">{s.dur}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
