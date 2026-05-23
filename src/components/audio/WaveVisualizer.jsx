import React, { useEffect, useRef } from 'react'

export default function WaveVisualizer({ playing, audioTime }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const phaseRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()

    const BARS = 64
    const freqData = new Array(BARS).fill(0)

    function animate(timestamp) {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)

      if (playing) {
        phaseRef.current += 0.08
        freqData.forEach((_, i) => {
          const baseFreq = Math.sin(phaseRef.current + i * 0.3) * 0.5 + 0.5
          const harmonic = Math.sin(phaseRef.current * 2 + i * 0.5) * 0.3
          const lowBoost = i < 8 ? Math.sin(phaseRef.current * 0.7) * 0.4 : 0
          freqData[i] = Math.max(0.02, (baseFreq + harmonic + lowBoost) * 0.8)
        })
      } else {
        phaseRef.current += 0.01
        freqData.forEach((_, i) => {
          freqData[i] = 0.04 + Math.sin(phaseRef.current + i * 0.4) * 0.03
        })
      }

      const barW = w / BARS
      const centerY = h / 2

      for (let i = 0; i < BARS; i++) {
        const barH = freqData[i] * h * 0.85
        const x = i * barW
        const hue = 12 + (i / BARS) * 60
        const alpha = 0.4 + freqData[i] * 0.6

        const grad = ctx.createLinearGradient(x, centerY - barH / 2, x, centerY + barH / 2)
        grad.addColorStop(0, `hsla(${hue}, 60%, 65%, ${alpha * 0.5})`)
        grad.addColorStop(0.5, `hsla(${hue}, 70%, 70%, ${alpha})`)
        grad.addColorStop(1, `hsla(${hue}, 60%, 65%, ${alpha * 0.5})`)

        ctx.fillStyle = grad
        ctx.beginPath()
        if (ctx.roundRect) {
          ctx.roundRect(x + 1, centerY - barH / 2, barW - 2, barH, 1)
        } else {
          ctx.rect(x + 1, centerY - barH / 2, barW - 2, barH)
        }
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [playing])

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: '60px' }}
    />
  )
}
