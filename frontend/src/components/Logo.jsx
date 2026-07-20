export default function Logo({ size = 30 }) {
  return (
    <span className="logo">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" />
        <circle cx="32" cy="20" r="5" fill="url(#logo-g)" />
        <circle cx="16" cy="40" r="4" fill="url(#logo-g)" opacity=".85" />
        <circle cx="48" cy="40" r="4" fill="url(#logo-g)" opacity=".85" />
        <circle cx="32" cy="50" r="3" fill="url(#logo-g)" opacity=".7" />
        <path
          d="M32 20 16 40M32 20l16 20M16 40l16 10 16-10"
          stroke="url(#logo-g)"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      Illuminart<span className="ai">AI</span>
    </span>
  )
}
