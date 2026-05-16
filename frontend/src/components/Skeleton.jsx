export function Skeleton({ w = '100%', h = 16, r = 8, className = '', style = {} }) {
  return <div className={`skel ${className}`} style={{ width: w, height: h, borderRadius: r, ...style }} />
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card card-lg">
      <Skeleton w="40%" h={22} style={{ marginBottom: 12 }} />
      {Array.from({ length: lines }).map((_, i) => <Skeleton key={i} w={i === lines - 1 ? '60%' : '100%'} style={{ marginBottom: 8 }} />)}
    </div>
  )
}
