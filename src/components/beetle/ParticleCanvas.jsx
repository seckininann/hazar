import React, { useRef, useEffect } from 'react'

export default function ParticleCanvas({ ballX, ballY, active }) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animFrameRef = useRef(null)
  const ballXRef = useRef(ballX)
  const ballYRef = useRef(ballY)
  const activeRef = useRef(active)

  useEffect(() => { ballXRef.current = ballX }, [ballX])
  useEffect(() => { ballYRef.current = ballY }, [ballY])
  useEffect(() => { activeRef.current = active }, [active])

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

    class Particle {
      constructor(x, y) {
        this.x = x
        this.y = y
        this.vx = (Math.random() - 0.8) * 3
        this.vy = -(Math.random() * 2 + 1)
        this.alpha = Math.random() * 0.6 + 0.3
        this.radius = Math.random() * 3 + 1
        this.decay = Math.random() * 0.015 + 0.01
        this.color = Math.random() > 0.5
          ? `rgba(${139 + Math.random() * 30}, ${100 + Math.random() * 20}, ${60 + Math.random() * 20},`
          : `rgba(${200 + Math.random() * 30}, ${180 + Math.random() * 20}, ${140 + Math.random() * 20},`
      }
      update() {
        this.x += this.vx
        this.y += this.vy
        this.vy += 0.08
        this.alpha -= this.decay
        this.radius *= 0.97
      }
      draw(ctx) {
        if (this.alpha <= 0) return
        ctx.save()
        ctx.globalAlpha = this.alpha
        ctx.fillStyle = this.color + this.alpha + ')'
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      isDead() {
        return this.alpha <= 0 || this.radius < 0.1
      }
    }

    let lastEmit = 0
    function animate(timestamp) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (activeRef.current && timestamp - lastEmit > 30) {
        for (let i = 0; i < 4; i++) {
          const contactX = ballXRef.current + (Math.random() - 0.5) * 20
          const contactY = ballYRef.current + (Math.random() * 10)
          particlesRef.current.push(new Particle(contactX, contactY))
        }
        lastEmit = timestamp
      }

      particlesRef.current = particlesRef.current.filter(p => !p.isDead())
      particlesRef.current.forEach(p => {
        p.update()
        p.draw(ctx)
      })

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-10"
    />
  )
}
