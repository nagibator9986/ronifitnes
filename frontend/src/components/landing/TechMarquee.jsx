import Icon from '../Icon'

const TECH = [
  'Python', 'PyTorch', 'TensorFlow', 'LLM & RAG', 'LangChain', 'OpenAI API',
  'Claude API', 'Computer Vision', 'Flask', 'FastAPI', 'React', 'PostgreSQL',
  'Docker', 'Kubernetes', 'MLOps', 'Whisper', 'Airflow', 'ClickHouse',
]

export default function TechMarquee() {
  const row = (key) =>
    TECH.map((t) => (
      <span className="marquee-item" key={`${key}-${t}`}>
        <Icon name="spark" size={14} /> {t}
      </span>
    ))

  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {row('a')}
        {row('b')}
      </div>
    </div>
  )
}
