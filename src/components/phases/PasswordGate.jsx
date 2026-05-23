import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion'
import { Eye, EyeOff, Heart, Lock, Scan } from 'lucide-react'
import { useAppState } from '../../store/appState.jsx'
import { useProximity } from '../../hooks/useProximity.js'
import CharSplitText from '../ui/CharSplitText.jsx'

// ─── Canvas background ────────────────────────────────────────────────────────
function GradientCanvas() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const onMove = (e) => {
      mouseRef.current = {
        x: (e.clientX || e.touches?.[0]?.clientX || 0) / window.innerWidth,
        y: (e.clientY || e.touches?.[0]?.clientY || 0) / window.innerHeight,
      }
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })

    const blobs = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: 200 + Math.random() * 200,
      hue: [12, 280, 330, 220, 40][i],
      sat: 40 + Math.random() * 30,
      lit: 20 + Math.random() * 15,
    }))

    let t = 0
    function draw() {
      t += 0.005
      const w = canvas.width
      const h = canvas.height
      ctx.fillStyle = '#0a0a0f'
      ctx.fillRect(0, 0, w, h)

      const mx = mouseRef.current.x * w
      const my = mouseRef.current.y * h

      blobs.forEach((b, i) => {
        b.x += b.vx + (mx - w / 2) * 0.0003
        b.y += b.vy + (my - h / 2) * 0.0003
        if (b.x < -b.r) b.x = w + b.r
        if (b.x > w + b.r) b.x = -b.r
        if (b.y < -b.r) b.y = h + b.r
        if (b.y > h + b.r) b.y = -b.r

        const pulse = 1 + Math.sin(t + i * 1.2) * 0.15
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * pulse)
        grad.addColorStop(0, `hsla(${b.hue}, ${b.sat}%, ${b.lit}%, 0.25)`)
        grad.addColorStop(1, `hsla(${b.hue}, ${b.sat}%, ${b.lit}%, 0)`)
        ctx.globalCompositeOperation = 'screen'
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r * pulse, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalCompositeOperation = 'source-over'
      })

      // Mouse-reactive shimmer
      const shimmer = ctx.createRadialGradient(mx, my, 0, mx, my, 120)
      shimmer.addColorStop(0, 'rgba(212,160,122,0.06)')
      shimmer.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = shimmer
      ctx.fillRect(0, 0, w, h)

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />
}

// ─── Heart particle burst ─────────────────────────────────────────────────────
function HeartBurst({ trigger }) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animRef = useRef(null)

  useEffect(() => {
    if (!trigger) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2

    for (let i = 0; i < 80; i++) {
      const angle = (Math.PI * 2 * i) / 80 + Math.random() * 0.3
      const speed = 3 + Math.random() * 8
      particlesRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        alpha: 1,
        size: 10 + Math.random() * 20,
        decay: 0.012 + Math.random() * 0.01,
        hue: Math.random() > 0.5 ? 350 : 330,
      })
    }

    function drawHeart(ctx, x, y, size) {
      ctx.save()
      ctx.translate(x, y)
      ctx.beginPath()
      ctx.moveTo(0, -size * 0.3)
      ctx.bezierCurveTo(size * 0.5, -size, size, -size * 0.3, size * 0.5, size * 0.2)
      ctx.bezierCurveTo(size * 0.3, size * 0.5, 0, size * 0.8, 0, size * 0.8)
      ctx.bezierCurveTo(0, size * 0.8, -size * 0.3, size * 0.5, -size * 0.5, size * 0.2)
      ctx.bezierCurveTo(-size, -size * 0.3, -size * 0.5, -size, 0, -size * 0.3)
      ctx.closePath()
      ctx.restore()
    }

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particlesRef.current = particlesRef.current.filter(p => p.alpha > 0)
      particlesRef.current.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.15
        p.alpha -= p.decay
        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.alpha})`
        ctx.shadowColor = `hsla(${p.hue}, 80%, 70%, 0.8)`
        ctx.shadowBlur = 8
        drawHeart(ctx, p.x, p.y, p.size / 2)
        ctx.fill()
        ctx.restore()
      })
      if (particlesRef.current.length > 0) {
        animRef.current = requestAnimationFrame(loop)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [trigger])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
    />
  )
}

// ─── FaceID scanner ───────────────────────────────────────────────────────────
function FaceIDScanner({ onComplete }) {
  const [scanProgress, setScanProgress] = useState(0)
  const [scanLine, setScanLine] = useState(0)
  const [statusText, setStatusText] = useState('Initializing scan...')

  useEffect(() => {
    const statuses = [
      { p: 0.15, t: 'Detecting facial geometry...' },
      { p: 0.35, t: 'Mapping depth signature...' },
      { p: 0.55, t: 'Analyzing Queen face alignment...' },
      { p: 0.75, t: 'Verifying divine radiance...' },
      { p: 0.90, t: 'Match confidence: 100%' },
      { p: 1.0, t: 'Queen identified ✓' },
    ]

    let current = 0
    const interval = setInterval(() => {
      setScanProgress(p => {
        const next = Math.min(p + 0.012, 1)
        const status = statuses.find(s => s.p >= next && s.p >= p)
        if (status) setStatusText(status.t)
        if (next >= 1) {
          clearInterval(interval)
          setTimeout(onComplete, 800)
        }
        return next
      })
      setScanLine(l => (l + 3) % 100)
    }, 40)

    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <motion.div
      className="flex flex-col items-center gap-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative w-40 h-40 md:w-52 md:h-52">
        {/* Corner brackets */}
        {[
          'top-0 left-0 border-t-2 border-l-2',
          'top-0 right-0 border-t-2 border-r-2',
          'bottom-0 left-0 border-b-2 border-l-2',
          'bottom-0 right-0 border-b-2 border-r-2',
        ].map((cls, i) => (
          <div
            key={i}
            className={`absolute w-6 h-6 border-rose-gold/70 ${cls}`}
          />
        ))}

        {/* Beetle face inside scanner */}
        <div className="absolute inset-3 rounded-lg overflow-hidden bg-void/40 flex items-center justify-center">
          <img
            src="/assets/beetle.png"
            alt="scan"
            className="w-full h-full object-contain opacity-60"
          />
          {/* Scan line */}
          <div
            className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-rose-gold/80 to-transparent pointer-events-none"
            style={{ top: `${scanLine}%` }}
          />
        </div>

        {/* Progress ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(212,160,122,0.1)" strokeWidth="1.5" />
          <circle
            cx="50" cy="50" r="48"
            fill="none"
            stroke="rgba(212,160,122,0.8)"
            strokeWidth="1.5"
            strokeDasharray={`${scanProgress * 301.6} 301.6`}
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="text-center">
        <p className="text-rose-gold/80 text-xs tracking-[0.3em] uppercase font-mono">{statusText}</p>
        <div className="mt-3 w-48 h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-rose-gold-dark to-rose-gold-light rounded-full"
            style={{ width: `${scanProgress * 100}%` }}
          />
        </div>
        <p className="text-white/20 text-xs mt-2 tracking-widest font-mono">
          {Math.round(scanProgress * 100)}%
        </p>
      </div>

      <div className="flex items-center gap-2 text-white/20">
        <Scan size={12} />
        <span className="text-xs tracking-[0.3em] uppercase font-mono">FACE-ID</span>
        <Scan size={12} />
      </div>
    </motion.div>
  )
}

// ─── Main PasswordGate ────────────────────────────────────────────────────────
export default function PasswordGate() {
  const { dispatch } = useAppState()
  const [stage, setStage] = useState('scanning') // scanning | form
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState(false)
  const [heartBurst, setHeartBurst] = useState(false)
  const inputRef = useRef(null)
  const { ref: btnRef, glowStyle } = useProximity(120)

  const handleScanComplete = useCallback(() => {
    setStage('form')
    setTimeout(() => inputRef.current?.focus(), 400)
  }, [])

  const handleSubmit = useCallback((e) => {
    e?.preventDefault()
    if (password === 'hazar') {
      setHeartBurst(true)
      if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 100])
      setTimeout(() => {
        dispatch({ type: 'ATTEMPT_AUTH', payload: password })
      }, 1400)
    } else {
      setError(true)
      if (navigator.vibrate) navigator.vibrate([200])
      setTimeout(() => setError(false), 800)
    }
  }, [password, dispatch])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') handleSubmit()
  }, [handleSubmit])

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <GradientCanvas />
      <HeartBurst trigger={heartBurst} />

      <div className="relative z-10 w-full max-w-sm mx-4">
        <AnimatePresence mode="wait">
          {stage === 'scanning' ? (
            <motion.div
              key="scanner"
              className="glass-strong rounded-3xl p-8 md:p-10 flex flex-col items-center gap-6"
              style={{ border: '1px solid rgba(212,160,122,0.15)' }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <CharSplitText
                text="Tanımlama"
                className="text-white/40 text-xs tracking-[0.4em] uppercase font-sans"
                staggerDelay={0.04}
              />
              <FaceIDScanner onComplete={handleScanComplete} />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              className="glass-strong rounded-3xl p-8 md:p-10"
              style={{ border: '1px solid rgba(212,160,122,0.2)' }}
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 20 }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
                  style={{ background: 'rgba(212,160,122,0.08)', border: '1px solid rgba(212,160,122,0.2)' }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                >
                  <Lock size={22} className="text-rose-gold" />
                </motion.div>
                <CharSplitText
                  text="Sadece Sen Girebilirsin"
                  className="text-white/70 text-sm font-display italic tracking-wide"
                  staggerDelay={0.03}
                />
                <p className="text-white/20 text-xs tracking-[0.2em] uppercase mt-2 font-mono">
                  Şifreni gir sevgilim
                </p>
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit}>
                <div className="relative mb-4">
                  <motion.input
                    ref={inputRef}
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="••••••••"
                    className="luxury-input w-full px-4 py-3.5 rounded-xl pr-12 text-center text-base"
                    animate={error ? {
                      x: [-8, 8, -6, 6, -4, 4, 0],
                      borderColor: ['rgba(239,68,68,0.8)', 'rgba(212,160,122,0.2)'],
                    } : {}}
                    transition={{ duration: 0.4 }}
                    data-cursor="input"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    onClick={() => setShowPass(v => !v)}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      className="text-center text-red-400/70 text-xs tracking-widest mb-3 font-mono"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      Yanlış şifre, bir daha dene 🖤
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  ref={btnRef}
                  type="submit"
                  className="luxury-btn w-full py-3.5 rounded-xl text-sm tracking-[0.2em] uppercase font-sans font-medium transition-all"
                  style={{
                    background: 'linear-gradient(135deg, rgba(212,160,122,0.3), rgba(200,180,232,0.2))',
                    border: '1px solid rgba(212,160,122,0.3)',
                    color: 'rgba(245,240,235,0.85)',
                    ...glowStyle,
                  }}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  data-cursor="heart"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Heart size={14} />
                    Giriş
                    <Heart size={14} />
                  </span>
                </motion.button>
              </form>

              <p className="text-center text-white/10 text-xs tracking-widest mt-6 font-mono uppercase">
                Sadece sana özel
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
