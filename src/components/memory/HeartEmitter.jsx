import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppState } from '../../store/appState.jsx'

const EMOJIS = [
  '🖤','💜','💕','🌹','✨','💫','🌙','💝','🌸','🦋',
  '💗','🌟','�','🥀','🌺','💞','🌷','⭐','🫧','💓',
  '🌸','💋','🫀','🩷','🌠','💐','🫦','🌻','💛','🤍',
]

const SIZES = [18, 22, 26, 20, 16, 24, 28, 18, 22]

function FloatingHeart({ x, emoji, onDone }) {
  const dur = 2.2 + Math.random() * 1.8
  const size = SIZES[Math.floor(Math.random() * SIZES.length)]
  const drift = (Math.random() - 0.5) * 80
  const spin  = (Math.random() - 0.5) * 40
  const wobble = Math.random() > 0.5 ? [0, drift * 0.4, drift] : [0, drift * 0.6, drift * 0.3]

  useEffect(() => {
    const t = setTimeout(onDone, (dur + 0.4) * 1000)
    return () => clearTimeout(t)
  }, [dur, onDone])

  return (
    <motion.div
      className="fixed pointer-events-none z-50 select-none leading-none"
      style={{ left: x, bottom: 90, fontSize: size }}
      initial={{ opacity: 0, y: 0, scale: 0.3, rotate: 0 }}
      animate={{
        opacity: [0, 1, 1, 1, 0],
        y:       [0, -80, -200, -320, -420],
        x:       wobble,
        scale:   [0.3, 1.1, 1.0, 0.9, 0.7],
        rotate:  [0, spin * 0.3, spin * 0.7, spin, spin * 1.2],
      }}
      transition={{ duration: dur, ease: 'easeOut', times: [0, 0.1, 0.4, 0.75, 1] }}
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
  const btnRef = useRef(null)
  const [holding, setHolding] = useState(false)

  const spawnOne = useCallback((clientX) => {
    const x = (clientX ?? window.innerWidth / 2) + (Math.random() - 0.5) * 32 - 12
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
    const id = nextId.current++
    setHearts(prev => [...prev, { id, x, emoji }])
    dispatch({ type: 'INCREMENT_HEARTS', payload: 1 })
  }, [dispatch])

  const handleClick = useCallback((e) => {
    if (navigator.vibrate) navigator.vibrate(15)
    spawnOne(e.clientX)
  }, [spawnOne])

  const startHold = useCallback((e) => {
    e.preventDefault()
    const cx = e.touches?.[0]?.clientX ?? e.clientX
    setHolding(true)
    if (navigator.vibrate) navigator.vibrate(20)
    let delay = 160
    const burst = () => {
      spawnOne(cx + (Math.random() - 0.5) * 20)
      if (navigator.vibrate) navigator.vibrate(8)
      delay = Math.max(60, delay - 8)
      holdRef.current = setTimeout(burst, delay)
    }
    holdRef.current = setTimeout(burst, 120)
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
      <div className="fixed bottom-6 right-6 z-39 pointer-events-none">
        {holding && [1,2,3].map(i => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full"
            style={{ border: '1.5px solid rgba(232,160,180,0.4)' }}
            initial={{ scale: 1, opacity: 0.7 }}
            animate={{ scale: 2.5 + i * 0.5, opacity: 0 }}
            transition={{ duration: 0.8, delay: i * 0.18, repeat: Infinity }}
          />
        ))}
      </div>

      {/* Button */}
      <motion.button
        ref={btnRef}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center select-none"
        style={{
          background: holding
            ? 'linear-gradient(135deg, rgba(232,100,140,0.5), rgba(180,130,220,0.45))'
            : 'linear-gradient(135deg, rgba(232,160,180,0.22), rgba(200,180,232,0.18))',
          border: '1.5px solid rgba(232,160,180,0.4)',
          backdropFilter: 'blur(24px)',
          boxShadow: holding
            ? '0 0 24px rgba(232,100,140,0.4), 0 0 8px rgba(200,140,200,0.3)'
            : '0 0 12px rgba(232,160,180,0.15)',
        }}
        onClick={handleClick}
        onPointerDown={startHold}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onTouchStart={startHold}
        onTouchEnd={stopHold}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.88 }}
        animate={holding ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={holding ? { repeat: Infinity, duration: 0.3 } : {}}
        data-cursor="heart"
      >
        <motion.span
          className="text-2xl leading-none"
          animate={holding
            ? { rotate: [-10, 10, -10], scale: [1, 1.3, 1] }
            : { rotate: 0, scale: 1 }
          }
          transition={holding ? { repeat: Infinity, duration: 0.4 } : {}}
        >
          🖤
        </motion.span>
      </motion.button>
    </>
  )
}
