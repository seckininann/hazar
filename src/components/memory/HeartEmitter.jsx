import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppState } from '../../store/appState.jsx'

const EMOJIS = ['🖤', '💜', '🌹', '✨', '💫', '🌙', '💝', '🌸']

function FloatingHeart({ id, x, emoji, onDone }) {
  const path = useRef(Array.from({ length: 8 }, (_, i) => ({
    x: x + Math.sin(i * 0.8 + Math.random()) * 40,
    y: -(i * 60 + Math.random() * 30),
  })))

  const duration = 2.5 + Math.random() * 1.5
  const size = 16 + Math.random() * 18

  useEffect(() => {
    const t = setTimeout(onDone, (duration + 0.5) * 1000)
    return () => clearTimeout(t)
  }, [duration, onDone])

  return (
    <motion.div
      className="fixed pointer-events-none z-50 select-none"
      style={{ left: x, bottom: 80, fontSize: size }}
      initial={{ opacity: 1, y: 0, scale: 0.5 }}
      animate={{
        opacity: [1, 1, 0],
        y: [-20, -200, -350],
        x: [0, Math.sin(Math.random() * 6) * 30, Math.sin(Math.random() * 6) * 60],
        scale: [0.5, 1.2, 0.8],
        rotate: [0, Math.random() > 0.5 ? 20 : -20, 0],
      }}
      transition={{
        duration,
        ease: 'easeOut',
        times: [0, 0.6, 1],
      }}
    >
      {emoji}
    </motion.div>
  )
}

export default function HeartEmitter() {
  const { dispatch } = useAppState()
  const [hearts, setHearts] = useState([])
  const nextId = useRef(0)

  const emit = useCallback((e) => {
    const x = e?.clientX ?? window.innerWidth / 2
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
    const id = nextId.current++
    setHearts(prev => [...prev, { id, x, emoji }])
    dispatch({ type: 'INCREMENT_HEARTS', payload: 1 })
    if (navigator.vibrate) navigator.vibrate(20)
  }, [dispatch])

  const removeHeart = useCallback((id) => {
    setHearts(prev => prev.filter(h => h.id !== id))
  }, [])

  return (
    <>
      {/* Floating hearts portal */}
      <AnimatePresence>
        {hearts.map(h => (
          <FloatingHeart
            key={h.id}
            id={h.id}
            x={h.x - 12}
            emoji={h.emoji}
            onDone={() => removeHeart(h.id)}
          />
        ))}
      </AnimatePresence>

      {/* Emitter button */}
      <motion.button
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(232,180,184,0.25), rgba(200,180,232,0.2))',
          border: '1px solid rgba(232,180,184,0.3)',
          backdropFilter: 'blur(20px)',
        }}
        onClick={emit}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.85 }}
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(232,180,184,0)',
            '0 0 0 10px rgba(232,180,184,0)',
          ],
        }}
        transition={{ repeat: Infinity, duration: 2 }}
        data-cursor="heart"
      >
        🖤
      </motion.button>
    </>
  )
}
