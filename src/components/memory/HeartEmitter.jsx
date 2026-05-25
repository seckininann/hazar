import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppState } from '../../store/appState.jsx'

const HEARTS = [
  '❤️','�','�','�','💝','💕','�','💞','🩷','�',
  '❤️‍🔥','�','💌','�','�',
]
const SIZES = [22, 26, 30, 24, 20, 28, 34, 26, 22, 32]

function FloatingHeart({ x, emoji, onDone }) {
  const dur = 2.4 + Math.random() * 1.8
  const size = SIZES[Math.floor(Math.random() * SIZES.length)]
  const drift = (Math.random() - 0.5) * 80
  const spin  = (Math.random() - 0.5) * 40
  const wobble = [0, drift * 0.4, drift]

  useEffect(() => {
    const t = setTimeout(onDone, (dur + 0.4) * 1000)
    return () => clearTimeout(t)
  }, [dur, onDone])

  return (
    <motion.div
      className="fixed pointer-events-none z-50 select-none leading-none"
      style={{ left: x, bottom: 90, fontSize: size }}
      initial={{ opacity: 0, y: 0, scale: 0.2, rotate: 0 }}
      animate={{
        opacity: [0, 1, 1, 1, 0],
        y:       [0, -90, -210, -340, -440],
        x:       wobble,
        scale:   [0.2, 1.15, 1.0, 0.85, 0.6],
        rotate:  [0, spin * 0.3, spin * 0.7, spin, spin * 1.2],
      }}
      transition={{ duration: dur, ease: 'easeOut', times: [0, 0.08, 0.4, 0.75, 1] }}
    >
      {emoji}
    </motion.div>
  )
}

export default function HeartEmitter() {
  const { dispatch } = useAppState()
  const [hearts, setHearts] = useState([])
  const nextId = useRef(0)
  const holdRef = useRef(null)
  const [holding, setHolding] = useState(false)

  const spawnOne = useCallback((clientX) => {
    const x = (clientX ?? window.innerWidth / 2) + (Math.random() - 0.5) * 30 - 12
    const emoji = HEARTS[Math.floor(Math.random() * HEARTS.length)]
    const id = nextId.current++
    setHearts(prev => [...prev, { id, x, emoji }])
    dispatch({ type: 'INCREMENT_HEARTS', payload: 1 })
  }, [dispatch])

  const startHold = useCallback((e) => {
    e.preventDefault()
    if (holdRef.current) return           // guard: already running
    const cx = e.clientX ?? window.innerWidth / 2
    spawnOne(cx)                          // immediate spawn on press
    if (navigator.vibrate) navigator.vibrate(20)
    setHolding(true)
    let delay = 200
    const burst = () => {
      spawnOne(cx + (Math.random() - 0.5) * 24)
      if (navigator.vibrate) navigator.vibrate(6)
      delay = Math.max(65, delay - 10)
      holdRef.current = setTimeout(burst, delay)
    }
    holdRef.current = setTimeout(burst, 280)
  }, [spawnOne])

  const stopHold = useCallback(() => {
    setHolding(false)
    clearTimeout(holdRef.current)
    holdRef.current = null
  }, [])

  const removeHeart = useCallback((id) => {
    setHearts(prev => prev.filter(h => h.id !== id))
  }, [])

  useEffect(() => () => clearTimeout(holdRef.current), [])

  return (
    <>
      <AnimatePresence>
        {hearts.map(h => (
          <FloatingHeart
            key={h.id}
            x={h.x}
            emoji={h.emoji}
            onDone={() => removeHeart(h.id)}
          />
        ))}
      </AnimatePresence>

      {/* Pulse rings */}
      <div className="fixed bottom-6 right-6 z-[39] pointer-events-none">
        {holding && [1, 2, 3].map(i => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full"
            style={{ border: '1.5px solid rgba(232,100,140,0.35)' }}
            initial={{ scale: 1, opacity: 0.7 }}
            animate={{ scale: 2.5 + i * 0.5, opacity: 0 }}
            transition={{ duration: 0.85, delay: i * 0.2, repeat: Infinity }}
          />
        ))}
      </div>

      {/* Button — pointer events only (no Touch/Click overlap) */}
      <motion.button
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center select-none"
        style={{
          background: holding
            ? 'linear-gradient(135deg, rgba(220,80,120,0.55), rgba(170,110,210,0.5))'
            : 'linear-gradient(135deg, rgba(232,140,170,0.22), rgba(200,180,232,0.18))',
          border: '1.5px solid rgba(232,140,170,0.45)',
          backdropFilter: 'blur(24px)',
          boxShadow: holding
            ? '0 0 28px rgba(220,80,120,0.45), 0 0 10px rgba(180,100,200,0.3)'
            : '0 0 14px rgba(232,140,170,0.12)',
          touchAction: 'none',
        }}
        onPointerDown={startHold}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.88 }}
        animate={holding ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={holding ? { repeat: Infinity, duration: 0.28 } : {}}
        data-cursor="heart"
      >
        <motion.span
          className="text-2xl leading-none"
          animate={holding
            ? { rotate: [-8, 8, -8], scale: [1, 1.25, 1] }
            : { rotate: 0, scale: 1 }
          }
          transition={holding ? { repeat: Infinity, duration: 0.38 } : {}}
        >
          ❤️
        </motion.span>
      </motion.button>
    </>
  )
}
