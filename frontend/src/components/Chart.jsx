/** Lightweight SVG line chart for time-series data. No deps. */
export function LineChart({ data, height = 200, valueKey = 'value', dateKey = 'date', label, formatY = (v) => v }) {
  const w = 600
  const padL = 36, padR = 12, padT = 12, padB = 24

  if (!data || data.length === 0) {
    return <div className="text-muted" style={{ padding: 40, textAlign: 'center' }}>Нет данных</div>
  }

  const values = data.map((d) => Number(d[valueKey] ?? 0))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const innerH = height - padT - padB
  const innerW = w - padL - padR

  const xAt = (i) => padL + (data.length === 1 ? innerW / 2 : (i * innerW) / (data.length - 1))
  const yAt = (v) => padT + innerH - ((v - min) / range) * innerH

  const pts = data.map((d, i) => [xAt(i), yAt(Number(d[valueKey] ?? 0))])
  const line = pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ')
  const area = `${line} L${pts[pts.length - 1][0]},${padT + innerH} L${pts[0][0]},${padT + innerH} Z`

  // y ticks
  const ticks = [min, (min + max) / 2, max]

  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lc-stroke" x1="0" x2="1">
          <stop offset="0%" stopColor="#ff7a18" />
          <stop offset="100%" stopColor="#ff1744" />
        </linearGradient>
        <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff4d2e" stopOpacity=".35" />
          <stop offset="100%" stopColor="#ff4d2e" stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={w - padR} y1={yAt(t)} y2={yAt(t)} stroke="#262631" strokeDasharray="2,4" />
          <text x={padL - 6} y={yAt(t) + 4} textAnchor="end" fontSize="10" fill="#6b6b78">{formatY(t)}</text>
        </g>
      ))}

      <path d={area} fill="url(#lc-fill)" />
      <path d={line} fill="none" stroke="url(#lc-stroke)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill="#ff4d2e" stroke="#0b0b0e" strokeWidth="1.5">
          <title>{formatY(values[i])}</title>
        </circle>
      ))}
    </svg>
  )
}

export function Sparkline({ values, height = 50 }) {
  if (!values || values.length < 2) return null
  const data = values.map((v, i) => ({ i, value: Number(v) }))
  return <LineChart data={data} valueKey="value" height={height} />
}

export function RingProgress({ value = 0, max = 1, size = 60, stroke = 6, label }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value / max))
  const dash = pct * c
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="ring-grad" x1="0" x2="1">
          <stop offset="0%" stopColor="#ff7a18" />
          <stop offset="100%" stopColor="#ff1744" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#262631" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ring-grad)" strokeWidth={stroke}
        strokeDasharray={`${dash} ${c - dash}`}
        strokeDashoffset={c / 4}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={size * 0.28} fontWeight="800" fill="#f5f5f7">{label ?? `${Math.round(pct * 100)}%`}</text>
    </svg>
  )
}
