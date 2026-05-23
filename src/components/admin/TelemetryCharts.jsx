import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAppState } from '../../store/appState.jsx'

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 2
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-white/40 text-xs font-mono">{label}</span>
        <span className="font-display text-sm" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
    </div>
  )
}

function SparkLine({ data, color }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    if (!data.length) return
    const max = Math.max(...data, 1)
    const step = w / (data.length - 1)

    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    data.forEach((v, i) => {
      const x = i * step
      const y = h - (v / max) * (h - 8) - 4
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Fill under line
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.closePath()
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, color.replace(')', ', 0.2)').replace('rgb', 'rgba'))
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fill()
  }, [data, color])

  return <canvas ref={canvasRef} width={200} height={40} className="w-full" />
}

export default function TelemetryCharts() {
  const { state } = useAppState()

  const heartData = Array.from({ length: 12 }, (_, i) =>
    Math.max(0, state.heartBurstCount - 12 + i + Math.round(Math.random() * 3))
  )

  const smileData = Array.from({ length: 12 }, (_, i) =>
    Math.max(0, Math.round(Math.sin(i * 0.5) * 5 + 5 + Math.random() * 3))
  )

  const metrics = [
    { label: 'Toplam Kalp Patlatma', value: state.heartBurstCount, max: Math.max(100, state.heartBurstCount), color: '#e8b4b8' },
    { label: 'Ekran Sarsıntısı', value: state.shakeCount, max: Math.max(20, state.shakeCount), color: '#d4a07a' },
    { label: 'Toplam Anı', value: (state.photos || []).length, max: Math.max(20, (state.photos || []).length), color: '#c8b4e8' },
  ]

  const mockMetrics = [
    { label: 'Queen Smile Count Ratio', value: '∞', sub: 'Ölçülemez sevimlilik' },
    { label: 'Loveliness Index', value: '10/10', sub: 'Maksimum değer' },
    { label: 'Bok Böceği Sürücüsü Rating', value: 'S+', sub: 'En üst kademe' },
    { label: 'Kalbim Eridi Sayacı', value: `${state.heartBurstCount + 42}×`, sub: 'Ve artmaya devam ediyor' },
  ]

  return (
    <div className="space-y-6">
      {/* Real metrics */}
      <div>
        <p className="text-white/20 text-xs font-mono tracking-widest uppercase mb-3">Gerçek Veriler</p>
        <div className="glass rounded-2xl p-4 space-y-4" style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
          {metrics.map(m => (
            <MiniBar key={m.label} {...m} />
          ))}
        </div>
      </div>

      {/* Spark lines */}
      <div>
        <p className="text-white/20 text-xs font-mono tracking-widest uppercase mb-3">Aktivite Grafiği</p>
        <div className="glass rounded-2xl p-4 space-y-4" style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
          <div>
            <p className="text-white/30 text-xs font-mono mb-2">Kalp Patlatma Trendi</p>
            <SparkLine data={heartData} color="rgb(232,180,184)" />
          </div>
          <div>
            <p className="text-white/30 text-xs font-mono mb-2">Gülümseme Frekansı</p>
            <SparkLine data={smileData} color="rgb(212,160,122)" />
          </div>
        </div>
      </div>

      {/* Humorous mock metrics */}
      <div>
        <p className="text-white/20 text-xs font-mono tracking-widest uppercase mb-3">Komik Telemetri</p>
        <div className="grid grid-cols-2 gap-3">
          {mockMetrics.map(m => (
            <motion.div
              key={m.label}
              className="glass rounded-xl p-3"
              style={{ border: '1px solid rgba(255,255,255,0.04)' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-rose-gold font-display text-lg font-bold mb-0.5">{m.value}</div>
              <div className="text-white/40 text-xs font-sans leading-tight">{m.label}</div>
              <div className="text-white/20 text-xs font-mono mt-1 leading-tight">{m.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
