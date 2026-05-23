import React, { useEffect, useRef } from 'react'

export default function SpotlightOverlay({ x, y }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    ctx.clearRect(0, 0, w, h)

    // Dark vignette base
    ctx.fillStyle = 'rgba(5, 5, 10, 0.72)'
    ctx.fillRect(0, 0, w, h)

    // Spotlight radial gradient cutout
    const grad = ctx.createRadialGradient(x, y, 0, x, y, 320)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(0.4, 'rgba(0,0,0,0)')
    grad.addColorStop(0.8, 'rgba(5,5,10,0.3)')
    grad.addColorStop(1, 'rgba(5,5,10,0.75)')

    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'

    // Warm light halo
    const halo = ctx.createRadialGradient(x, y, 0, x, y, 250)
    halo.addColorStop(0, 'rgba(212,160,122,0.07)')
    halo.addColorStop(0.5, 'rgba(212,160,122,0.03)')
    halo.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = halo
    ctx.fillRect(0, 0, w, h)
  }, [x, y])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-20"
    />
  )
}
