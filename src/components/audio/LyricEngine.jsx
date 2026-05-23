import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LYRICS = [
  { time: 0, text: '', effect: 'fade' },
  { time: 2.5, text: 'Seni ilk gördüğüm an...', effect: 'glow-pulse' },
  { time: 6.0, text: 'Kalbim bir bok böceği gibi yuvarlandı 🖤', effect: 'bounce' },
  { time: 10.5, text: 'Sensiz geçen her an boştur', effect: 'smoky' },
  { time: 15.0, text: 'Ama seninle her şey mükemmel', effect: 'shimmer' },
  { time: 20.0, text: 'BENİM TOPUM 🌍', effect: 'glow-pulse' },
  { time: 25.5, text: 'Hazar, seni seviyorum', effect: 'float' },
  { time: 30.0, text: 'Sonsuza kadar... 💫', effect: 'shimmer' },
  { time: 36.0, text: '', effect: 'fade' },
]

const effectStyles = {
  'glow-pulse': {
    className: 'text-glow-blush',
    animate: { scale: [1, 1.04, 1], opacity: [0.8, 1, 0.8] },
    transition: { repeat: Infinity, duration: 1.8 },
  },
  'bounce': {
    className: 'text-glow-rose',
    animate: { y: [0, -6, 0] },
    transition: { repeat: Infinity, duration: 1.2, ease: 'easeInOut' },
  },
  'smoky': {
    className: 'text-lavender',
    animate: { opacity: [1, 0.6, 1], filter: ['blur(0px)', 'blur(1px)', 'blur(0px)'] },
    transition: { repeat: Infinity, duration: 3 },
  },
  'shimmer': {
    className: 'text-shimmer',
    animate: {},
    transition: {},
  },
  'float': {
    className: 'text-glow-lavender',
    animate: { y: [0, -8, 0], rotate: [-1, 1, -1] },
    transition: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
  },
  'fade': {
    className: 'text-white/60',
    animate: {},
    transition: {},
  },
}

export default function LyricEngine({ audioTime }) {
  const [currentLyric, setCurrentLyric] = useState(LYRICS[0])

  useEffect(() => {
    let active = LYRICS[0]
    for (let i = LYRICS.length - 1; i >= 0; i--) {
      if (audioTime >= LYRICS[i].time) {
        active = LYRICS[i]
        break
      }
    }
    if (active.time !== currentLyric.time) {
      setCurrentLyric(active)
    }
  }, [audioTime])

  const style = effectStyles[currentLyric.effect] || effectStyles.fade

  return (
    <div className="flex items-center justify-center min-h-[60px] px-4">
      <AnimatePresence mode="wait">
        {currentLyric.text ? (
          <motion.p
            key={currentLyric.time}
            className={`text-center font-display text-base md:text-xl tracking-wide ${style.className}`}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1, ...style.animate }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.5, ...style.transition }}
          >
            {currentLyric.text}
          </motion.p>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
