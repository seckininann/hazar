import React, { useEffect, useRef, useState, useCallback } from 'react' // useState kept for phase/showSign/ballPos/spotlightPos/particlesActive/progress
import { motion } from 'framer-motion'
import ParticleCanvas from './ParticleCanvas.jsx'
import SpotlightOverlay from './SpotlightOverlay.jsx'
import { useScreenShake } from '../../hooks/useScreenShake.js'


export default function BeetleScene({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [spotlightPos, setSpotlightPos] = useState({ x: -300, y: 300 })
  const [ballPos, setBallPos] = useState({ x: -300, y: 0 })
  const [particlesActive, setParticlesActive] = useState(false)
  const [phase, setPhase] = useState('idle') // idle | entering | center | exiting | done


  const { shaking, shake } = useScreenShake()
  const animFrameRef = useRef(null)
  const startTimeRef = useRef(null)
  const hasShownCenter = useRef(false)
  const containerRef = useRef(null)

  // Duration constants (ms)
  const ENTER_DURATION = 2800
  const CENTER_PAUSE = 2200
  const EXIT_DURATION = 3500
  const TOTAL_DURATION = ENTER_DURATION + CENTER_PAUSE + EXIT_DURATION

  const getViewport = () => ({
    w: window.innerWidth,
    h: window.innerHeight,
  })

  const animate = useCallback((timestamp) => {
    if (!startTimeRef.current) startTimeRef.current = timestamp
    const elapsed = timestamp - startTimeRef.current
    const { w, h } = getViewport()

    const ballSize = Math.min(w * 0.38, h * 0.42)
    const beetleSize = Math.min(w * 0.35, h * 0.40)
    const groundY = h * 0.62 - ballSize * 0.5
    const startX = -ballSize
    const centerX = w / 2 - ballSize / 2
    const endX = w + ballSize

    let ballX, normalizedProgress

    if (elapsed < ENTER_DURATION) {
      // Fast entry with easeOut
      const t = elapsed / ENTER_DURATION
      const eased = 1 - Math.pow(1 - t, 3)
      ballX = startX + (centerX - startX) * eased
      normalizedProgress = t * 0.5
      setPhase('entering')
      setParticlesActive(true)
    } else if (elapsed < ENTER_DURATION + CENTER_PAUSE) {
      // Center pause + screen shake
      ballX = centerX
      normalizedProgress = 0.5
      setPhase('center')
      if (!hasShownCenter.current) {
        hasShownCenter.current = true
        shake()
      }
    } else if (elapsed < TOTAL_DURATION) {
      // Exit with acceleration
      const t = (elapsed - ENTER_DURATION - CENTER_PAUSE) / EXIT_DURATION
      const eased = t * t * (3 - 2 * t)
      ballX = centerX + (endX - centerX) * eased
      normalizedProgress = 0.5 + t * 0.5
      setPhase('exiting')
    } else {
      setPhase('done')
      setParticlesActive(false)
      onComplete?.()
      return
    }

    const time = elapsed / 1000
    const sineY = Math.sin(time * 4) * 6
    const sineY2 = Math.sin(time * 4 + 1) * 6

    // Ball position: slightly ahead (left) of beetle
    const ballFinalX = ballX
    const ballFinalY = groundY + sineY

    // Beetle position: behind (left of) ball — pushing from rear
    const beetleFinalX = ballX - beetleSize * 0.55
    const beetleFinalY = groundY + sineY2

    setBallPos({ x: ballFinalX, y: ballFinalY })
    setSpotlightPos({ x: ballFinalX + ballSize / 2, y: ballFinalY })
    setProgress(normalizedProgress)

    animFrameRef.current = requestAnimationFrame(animate)
  }, [onComplete, shake])

  useEffect(() => {
    const timer = setTimeout(() => {
      animFrameRef.current = requestAnimationFrame(animate)
    }, 500)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [animate])

  const { w: vw = 800, h: vh = 600 } = typeof window !== 'undefined' ? { w: window.innerWidth, h: window.innerHeight } : {}
  const ballSize = Math.min(vw * 0.38, vh * 0.42)
  const beetleSize = Math.min(vw * 0.35, vh * 0.40)
  const groundY = vh * 0.62 - ballSize * 0.5

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-void ${shaking ? 'shake' : ''}`}
    >
      {/* Deep background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0f0d18] to-[#12101f]" />

      {/* Ground line */}
      <div
        className="absolute w-full"
        style={{ top: `${groundY + ballSize * 0.95}px` }}
      >
        <div className="w-full h-px bg-gradient-to-r from-transparent via-rose-gold/20 to-transparent" />
        <div className="w-full h-8 bg-gradient-to-b from-[rgba(212,160,122,0.03)] to-transparent" />
      </div>

      {/* Soft ambient glow blob */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: ballPos.x - 60,
          top: ballPos.y - 40,
          width: ballSize + 120,
          height: ballSize + 120,
          background: 'radial-gradient(ellipse, rgba(212,160,122,0.08) 0%, transparent 70%)',
          transition: 'left 0.016s linear, top 0.016s linear',
        }}
      />

      {/* Particle Canvas */}
      <ParticleCanvas
        ballX={ballPos.x + ballSize / 2}
        ballY={ballPos.y + ballSize * 0.88}
        active={particlesActive}
      />

      {/* Ball image */}
      <AnimatedBall
        x={ballPos.x}
        y={ballPos.y}
        size={ballSize}
        progress={progress}
      />

      {/* Beetle image */}
      <AnimatedBeetle
        x={ballPos.x - beetleSize * 0.55}
        y={ballPos.y + 8}
        size={beetleSize}
      />


      {/* Spotlight overlay */}
      <SpotlightOverlay x={spotlightPos.x} y={spotlightPos.y} />

      {/* Skip button */}
      <motion.button
        className="absolute bottom-8 right-8 z-50 luxury-btn glass px-5 py-2.5 rounded-full text-warm-white/50 text-xs tracking-[0.2em] uppercase border border-white/10 hover:border-rose-gold/30 hover:text-rose-gold/70 transition-all"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onComplete}
      >
        Skip Experience
      </motion.button>

      {/* Title — zorluklardan yıldızlara */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40 text-center pointer-events-none w-full">
        <motion.p
          className="text-white/25 text-xs tracking-[0.55em] uppercase font-mono mb-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 1.2 }}
        >
          zorluklardan
        </motion.p>

        {/* Star row */}
        <div className="flex justify-center gap-2 my-1.5">
          {['✨', '⭐', '✨'].map((s, i) => (
            <motion.span
              key={i}
              className="text-xs select-none"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1 + i * 0.15, duration: 0.5, type: 'spring' }}
              style={{ display: 'inline-block' }}
            >
              {s}
            </motion.span>
          ))}
        </div>

        <motion.h1
          className="text-shimmer font-display text-3xl md:text-5xl font-bold tracking-wide"
          initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 1.4, duration: 1.4, ease: 'easeOut' }}
        >
          yıldızlara
        </motion.h1>

        {/* Trailing stars */}
        <motion.div
          className="flex justify-center gap-3 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 1 }}
        >
          {['⭐', '✨', '⭐', '✨', '⭐'].map((s, i) => (
            <motion.span
              key={i}
              className="text-xs select-none"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 1.8 + i * 0.2, delay: i * 0.25 }}
            >
              {s}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

function AnimatedBall({ x, y, size, progress }) {
  const rotationDeg = progress * 1080

  return (
    <div
      className="absolute z-30 pointer-events-none"
      style={{ left: x, top: y, width: size, height: size }}
    >
      <motion.img
        src="/assets/ball.png"
        alt="dung ball"
        className="w-full h-full object-contain"
        style={{
          rotate: rotationDeg,
          filter: 'drop-shadow(0 12px 28px rgba(100,70,30,0.6)) brightness(1.15)',
        }}
      />
    </div>
  )
}

function AnimatedBeetle({ x, y, size }) {
  return (
    <div
      className="absolute z-30 pointer-events-none"
      style={{ left: x, top: y, width: size, height: size }}
    >
      {/* Outer div for position; inner motion.div for physics animations */}
      <motion.div
        className="w-full h-full"
        animate={{
          y: [0, -5, 0, -7, 0, -4, 0],
          rotate: [-3, 3, -2, 4, -3, 2, -3],
          scaleX: [1, 1.016, 1, 0.985, 1, 1.012, 1],
          scaleY: [1, 0.985, 1, 1.014, 1, 0.988, 1],
        }}
        transition={{
          duration: 0.75,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.15, 0.3, 0.45, 0.6, 0.78, 1],
        }}
        style={{
          filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.6)) brightness(1.2)',
        }}
      >
        <img
          src="/assets/beetle.png"
          alt="beetle"
          className="w-full h-full object-contain"
        />
      </motion.div>
    </div>
  )
}
