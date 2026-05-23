import React, { useEffect, useRef, useState, useCallback } from 'react' // useState kept for phase/showSign/ballPos/spotlightPos/particlesActive/progress
import { motion } from 'framer-motion'
import ParticleCanvas from './ParticleCanvas.jsx'
import SpotlightOverlay from './SpotlightOverlay.jsx'
import { useScreenShake } from '../../hooks/useScreenShake.js'

const PARALLAX_WORDS = [
  'BOMBASTIC LOVE', 'THE JOURNEY', 'LOVETRAIN', 'BENİM TOPUM',
  'FOREVER ROLLING', 'QUEEN OF BEETLES', 'UNSTOPPABLE', 'HAZAR',
]

export default function BeetleScene({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [spotlightPos, setSpotlightPos] = useState({ x: -300, y: 300 })
  const [ballPos, setBallPos] = useState({ x: -300, y: 0 })
  const [particlesActive, setParticlesActive] = useState(false)
  const [phase, setPhase] = useState('idle') // idle | entering | center | exiting | done
  const [showSign, setShowSign] = useState(false)

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

    const ballSize = Math.min(w * 0.28, 220)
    const beetleSize = Math.min(w * 0.22, 180)
    const groundY = h * 0.62
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
        setShowSign(true)
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

    // Beetle position: behind (right of center) pushing
    const beetleOffset = ballSize * 0.65
    const beetleFinalX = ballX + beetleOffset
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
  const ballSize = Math.min(vw * 0.28, 220)
  const beetleSize = Math.min(vw * 0.22, 180)
  const groundY = vh * 0.62

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
        style={{ top: `${groundY + ballSize * 0.85}px` }}
      >
        <div className="w-full h-px bg-gradient-to-r from-transparent via-rose-gold/20 to-transparent" />
        <div className="w-full h-8 bg-gradient-to-b from-[rgba(212,160,122,0.03)] to-transparent" />
      </div>

      {/* Kinetic parallax background typography */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {PARALLAX_WORDS.map((word, i) => {
          const parallaxX = -(progress * 0.2) * vw
          const yPos = 8 + i * 12
          const fontSize = 60 + (i % 3) * 40
          return (
            <div
              key={word}
              className="absolute whitespace-nowrap font-display font-bold text-white/[0.035] uppercase tracking-widest"
              style={{
                top: `${yPos}%`,
                left: `${-20 + i * 15}%`,
                fontSize: `${fontSize}px`,
                transform: `translateX(${parallaxX * (0.8 + i * 0.1)}px)`,
                transition: 'transform 0.016s linear',
                letterSpacing: '0.15em',
              }}
            >
              {word}
            </div>
          )
        })}
      </div>

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
        x={ballPos.x + ballSize * 0.65}
        y={ballPos.y + 10}
        size={beetleSize}
        progress={progress}
      />

      {/* "BENİM TOPUM" sign on the ball */}
      {showSign && (
        <motion.div
          className="absolute z-30 pointer-events-none"
          style={{
            left: ballPos.x + ballSize * 0.2,
            top: ballPos.y - 55,
          }}
          initial={{ opacity: 0, scale: 0.5, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          <div className="glass rounded-lg px-3 py-1.5 border border-rose-gold/40 shadow-lg">
            <span className="text-rose-gold font-display font-bold text-sm tracking-widest uppercase">
              BENİM TOPUM
            </span>
          </div>
          {/* Little stick */}
          <div className="w-px h-4 bg-rose-gold/50 mx-auto" />
        </motion.div>
      )}

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

      {/* Title */}
      <motion.div
        className="absolute top-10 left-1/2 -translate-x-1/2 z-40 text-center pointer-events-none"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <p className="text-white/20 text-xs tracking-[0.4em] uppercase font-sans mb-2">Sana özel bir deneyim</p>
        <h1 className="text-shimmer font-display text-2xl md:text-4xl font-bold tracking-wide">
          Hazar İçin
        </h1>
      </motion.div>
    </div>
  )
}

function AnimatedBall({ x, y, size, progress }) {
  const rotationDeg = progress * 1080

  return (
    <div
      className="absolute z-20 pointer-events-none"
      style={{ left: x, top: y, width: size, height: size }}
    >
      <motion.img
        src="/assets/ball.png"
        alt="dung ball"
        className="w-full h-full object-contain"
        style={{
          rotate: rotationDeg,
          filter: 'drop-shadow(0 10px 24px rgba(100,70,30,0.55)) drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
        }}
      />
    </div>
  )
}

function AnimatedBeetle({ x, y, size }) {
  return (
    <div
      className="absolute z-20 pointer-events-none"
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
          filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.65))',
        }}
      >
        <img
          src="/assets/beetle.png"
          alt="beetle"
          className="w-full h-full object-contain"
          style={{ transform: 'scaleX(-1)' }}
        />
      </motion.div>
    </div>
  )
}
