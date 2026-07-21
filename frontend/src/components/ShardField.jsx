import { useEffect, useRef } from 'react'

/**
 * Монохромное поле «осколков»: белые многоугольники медленно дрейфуют
 * и вращаются на чёрном фоне — отсылка к кубистическому логотипу.
 * Без внешних зависимостей.
 */
export default function ShardField({ className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = canvas.getContext('2d')
    let raf = 0
    let shards = []
    let width = 0
    let height = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const makeShard = () => {
      const sides = 3 + Math.floor(Math.random() * 2) // треугольники и четырёхугольники
      const r = 8 + Math.random() * 26
      const points = []
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2 + Math.random() * 0.9
        points.push([Math.cos(a) * r * (0.55 + Math.random() * 0.6), Math.sin(a) * r * (0.55 + Math.random() * 0.6)])
      }
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.004,
        points,
        filled: Math.random() > 0.55,
        alpha: 0.05 + Math.random() * 0.16,
      }
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(46, Math.floor((width * height) / 34000))
      shards = Array.from({ length: count }, makeShard)
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      for (const s of shards) {
        s.x += s.vx
        s.y += s.vy
        s.rot += s.vr
        if (s.x < -60) s.x = width + 60
        if (s.x > width + 60) s.x = -60
        if (s.y < -60) s.y = height + 60
        if (s.y > height + 60) s.y = -60

        ctx.save()
        ctx.translate(s.x, s.y)
        ctx.rotate(s.rot)
        ctx.beginPath()
        ctx.moveTo(s.points[0][0], s.points[0][1])
        for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i][0], s.points[i][1])
        ctx.closePath()
        if (s.filled) {
          ctx.fillStyle = `rgba(246, 243, 236, ${s.alpha})`
          ctx.fill()
        } else {
          ctx.strokeStyle = `rgba(246, 243, 236, ${s.alpha + 0.06})`
          ctx.lineWidth = 1
          ctx.stroke()
        }
        ctx.restore()
      }
      raf = requestAnimationFrame(draw)
    }

    const onVisibility = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden && !reduced) raf = requestAnimationFrame(draw)
    }

    resize()
    if (reduced) {
      draw() // один статичный кадр
      cancelAnimationFrame(raf)
    } else {
      raf = requestAnimationFrame(draw)
    }

    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} />
}
