import React, { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function CustomCursor() {
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  const trailX = useMotionValue(-100)
  const trailY = useMotionValue(-100)

  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 }
  const trailConfig = { damping: 35, stiffness: 150, mass: 0.8 }

  const springX = useSpring(cursorX, springConfig)
  const springY = useSpring(cursorY, springConfig)
  const trailSpringX = useSpring(trailX, trailConfig)
  const trailSpringY = useSpring(trailY, trailConfig)

  const [variant, setVariant] = useState('default')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const isMobile = window.matchMedia('(pointer: coarse)').matches
    if (isMobile) return

    setVisible(true)

    const moveCursor = (e) => {
      cursorX.set(e.clientX - 10)
      cursorY.set(e.clientY - 10)
      trailX.set(e.clientX - 20)
      trailY.set(e.clientY - 20)
    }

    const handleMouseEnter = () => setVisible(true)
    const handleMouseLeave = () => setVisible(false)

    const handleHover = (e) => {
      const target = e.target
      if (target.closest('button') || target.closest('[data-cursor="heart"]')) {
        setVariant('heart')
      } else if (target.closest('input') || target.closest('textarea')) {
        setVariant('input')
      } else if (target.closest('img') || target.closest('[data-cursor="media"]')) {
        setVariant('media')
      } else {
        setVariant('default')
      }
    }

    window.addEventListener('mousemove', moveCursor, { passive: true })
    window.addEventListener('mousemove', handleHover, { passive: true })
    document.addEventListener('mouseenter', handleMouseEnter)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', moveCursor)
      window.removeEventListener('mousemove', handleHover)
      document.removeEventListener('mouseenter', handleMouseEnter)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  if (!visible) return null

  const variantStyles = {
    default: {
      width: 20,
      height: 20,
      backgroundColor: 'rgba(212,160,122,0.8)',
      borderRadius: '50%',
      mixBlendMode: 'difference',
    },
    heart: {
      width: 36,
      height: 36,
      backgroundColor: 'rgba(232,180,184,0.9)',
      borderRadius: '50%',
      scale: 1.4,
    },
    input: {
      width: 28,
      height: 28,
      backgroundColor: 'transparent',
      border: '2px solid rgba(200,180,232,0.8)',
      borderRadius: '50%',
      scale: 1.2,
    },
    media: {
      width: 50,
      height: 50,
      backgroundColor: 'rgba(212,160,122,0.15)',
      border: '1.5px solid rgba(212,160,122,0.5)',
      borderRadius: '50%',
    },
  }

  return (
    <>
      {/* Trail ring */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full border border-rose-gold/30"
        style={{
          x: trailSpringX,
          y: trailSpringY,
          width: 40,
          height: 40,
        }}
        animate={{ opacity: visible ? 1 : 0 }}
      />

      {/* Main cursor dot */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[10000]"
        style={{
          x: springX,
          y: springY,
        }}
        animate={{
          ...variantStyles[variant],
          opacity: visible ? 1 : 0,
        }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        {variant === 'heart' && (
          <motion.span
            className="absolute inset-0 flex items-center justify-center text-xs"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          >
            🖤
          </motion.span>
        )}
        {variant === 'media' && (
          <motion.span className="absolute inset-0 flex items-center justify-center text-xs opacity-70">
            🔍
          </motion.span>
        )}
      </motion.div>
    </>
  )
}
