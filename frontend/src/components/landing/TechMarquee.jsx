const TECH = [
  'Python', 'PyTorch', 'TensorFlow', 'LLM & RAG', 'LangChain', 'OpenAI API',
  'Claude API', 'Computer Vision', 'Flask', 'FastAPI', 'React', 'PostgreSQL',
  'Docker', 'Kubernetes', 'MLOps', 'Whisper', 'Airflow', 'ClickHouse',
]

export default function TechMarquee() {
  // чередуем моно и курсивный сериф — типографский ритм
  const row = (key) => TECH.map((t, i) => (
    <span className={`marquee-item ${i % 2 ? 'serif' : ''}`} key={`${key}-${t}`}>
      {t}
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
