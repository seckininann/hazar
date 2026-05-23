import React from 'react'
import { motion } from 'framer-motion'

export default function CharSplitText({ text, className = '', staggerDelay = 0.04, initialDelay = 0 }) {
  const chars = text.split('')
  return (
    <span className={className} aria-label={text}>
      {chars.map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          className="inline-block"
          initial={{ opacity: 0, y: 12, rotateX: -30 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            delay: initialDelay + i * staggerDelay,
            duration: 0.5,
            ease: [0.2, 0, 0, 1],
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  )
}
