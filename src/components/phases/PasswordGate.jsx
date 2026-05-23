import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Heart, Lock, CameraOff } from 'lucide-react'
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

// ─── Romantic rose scanner ────────────────────────────────────────────────────
const ROSE_POSITIONS = [
  { angle: 0,   flower: '🌹' },
  { angle: 60,  flower: '🌸' },
  { angle: 120, flower: '🌺' },
  { angle: 180, flower: '🥀' },
  { angle: 240, flower: '🌷' },
  { angle: 300, flower: '🌸' },
]

function FaceIDScanner({ onComplete, cameraStream }) {
  const videoRef = useRef(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanLine, setScanLine] = useState(0)
  const [statusText, setStatusText] = useState('Eda...')

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream
      videoRef.current.play().catch(() => {})
    }
    return () => {
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop())
    }
  }, [cameraStream])

  useEffect(() => {
    const statuses = [
      { p: 0.14, t: 'Kalbim seni hissediyor...' },
      { p: 0.30, t: 'Gülüşün eşleşti 🌹' },
      { p: 0.48, t: 'Gözlerin dünyanın en güzeli...' },
      { p: 0.65, t: 'Seni çok seviyorum, Eda' },
      { p: 0.82, t: 'Hoş geldin kraliçem 🌸' },
      { p: 0.95, t: 'Her zaman seninle...' },
      { p: 1.0,  t: '✨ Tanındın, Eda ✨' },
    ]

    const interval = setInterval(() => {
      setScanProgress(p => {
        const next = Math.min(p + 0.004, 1)
        const status = statuses.find(s => s.p >= next && s.p > p)
        if (status) setStatusText(status.t)
        if (next >= 1) {
          clearInterval(interval)
          setTimeout(onComplete, 1200)
        }
        return next
      })
      setScanLine(l => (l + 1.5) % 100)
    }, 40)

    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <motion.div
      className="flex flex-col items-center gap-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.6 }}
    >
      {/* Rose-framed circular camera */}
      <div className="relative w-52 h-52 md:w-60 md:h-60">

        {/* Orbiting roses */}
        {ROSE_POSITIONS.map(({ angle, flower }, i) => {
          const rad = (angle * Math.PI) / 180
          const r = 47
          return (
            <motion.div
              key={i}
              className="absolute text-xl md:text-2xl pointer-events-none"
              style={{
                left: `${50 + r * Math.cos(rad)}%`,
                top: `${50 + r * Math.sin(rad)}%`,
                transform: 'translate(-50%, -50%)',
              }}
              animate={{
                scale: [0.85, 1.15, 0.85],
                opacity: [0.55, 1, 0.55],
                rotate: [0, 12, -8, 0],
              }}
              transition={{ repeat: Infinity, duration: 2.8 + i * 0.3, delay: i * 0.35 }}
            >
              {flower}
            </motion.div>
          )
        })}

        {/* Circular camera frame */}
        <div
          className="absolute inset-7 rounded-full overflow-hidden"
          style={{ border: '1.5px solid rgba(212,160,122,0.35)', boxShadow: '0 0 24px rgba(212,160,122,0.12), inset 0 0 16px rgba(200,180,232,0.06)' }}
        >
          {cameraStream ? (
            <video
              ref={videoRef}
              className="w-full h-full object-cover scale-x-[-1]"
              muted playsInline autoPlay
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: 'radial-gradient(ellipse, rgba(120,40,60,0.25) 0%, rgba(10,8,20,0.8) 100%)' }}
            >
              <span className="text-5xl select-none">🌹</span>
            </div>
          )}

          {/* Soft scan shimmer */}
          <motion.div
            className="absolute w-full pointer-events-none"
            style={{ top: `${scanLine}%` }}
          >
            <div className="w-full h-px bg-gradient-to-r from-transparent via-rose-gold/70 to-transparent" />
            <div className="w-full h-4 bg-gradient-to-b from-rose-gold/8 to-transparent" />
          </motion.div>

          {/* Bottom vignette */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-[rgba(40,8,16,0.4)] via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Progress ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(212,160,122,0.06)" strokeWidth="1" />
          <circle
            cx="50" cy="50" r="46"
            fill="none"
            stroke="url(#roseGrad)"
            strokeWidth="1.5"
            strokeDasharray={`${scanProgress * 289} 289`}
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="roseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d4a07a" />
              <stop offset="50%" stopColor="#e8a0b0" />
              <stop offset="100%" stopColor="#c8b4e8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Status text */}
      <div className="text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={statusText}
            className="text-white/80 text-base font-display italic tracking-wide"
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
            transition={{ duration: 0.7 }}
          >
            {statusText}
          </motion.p>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="mt-4 w-40 mx-auto h-px bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ width: `${scanProgress * 100}%`, background: 'linear-gradient(90deg, #d4a07a, #e8a0b0, #c8b4e8)' }}
          />
        </div>

        {/* Floating roses */}
        <div className="flex justify-center gap-4 mt-3">
          {['🌹', '🌸', '🌺'].map((r, i) => (
            <motion.span
              key={i}
              className="text-base select-none"
              animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
              transition={{ repeat: Infinity, duration: 2.2, delay: i * 0.5 }}
            >
              {r}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main PasswordGate ────────────────────────────────────────────────────────
export default function PasswordGate({ cameraStream = null }) {
  const { dispatch } = useAppState()
  const [stage, setStage] = useState('scanning')
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

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <GradientCanvas />
      <HeartBurst trigger={heartBurst} />

      <div className="relative z-10 w-full max-w-sm mx-4">
        <AnimatePresence mode="wait">

            {stage === 'scanning' && (
            <motion.div
              key="scanner"
              className="glass-strong rounded-3xl p-8 md:p-10 flex flex-col items-center gap-5"
              style={{ border: '1px solid rgba(212,160,122,0.15)' }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center">
                <motion.p
                  className="text-white/30 text-xs tracking-[0.5em] uppercase font-mono"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                >
                  🌹 eda için 🌹
                </motion.p>
              </div>
              <FaceIDScanner onComplete={handleScanComplete} cameraStream={cameraStream} />
            </motion.div>
          )}

          {stage === 'form' && (
            <motion.div
              key="form"
              className="glass-strong rounded-3xl p-8 md:p-10"
              style={{ border: '1px solid rgba(212,160,122,0.2)' }}
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 20 }}
            >
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

              <form onSubmit={handleSubmit}>
                <div className="relative mb-4">
                  <motion.input
                    ref={inputRef}
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder="••••••••"
                    className="luxury-input w-full px-4 py-3.5 rounded-xl pr-12 text-center text-base"
                    animate={error ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    data-cursor="input"
                    autoFocus
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
