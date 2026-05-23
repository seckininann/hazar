import React, { useRef, useState, useCallback } from 'react'
import { motion, useDragControls } from 'framer-motion'
import MemoryCard from './MemoryCard.jsx'

const CARD_W = 220
const CARD_H = 280

function getInitialPositions(photos, canvasW, canvasH) {
  return photos.map((_, i) => {
    const cols = Math.ceil(Math.sqrt(photos.length))
    const col = i % cols
    const row = Math.floor(i / cols)
    const jitterX = (Math.random() - 0.5) * 60
    const jitterY = (Math.random() - 0.5) * 60
    return {
      x: 80 + col * (CARD_W + 40) + jitterX,
      y: 80 + row * (CARD_H + 40) + jitterY,
    }
  })
}

function FloatingNode({ photo, index, initialX, initialY }) {
  return (
    <motion.div
      className="absolute cursor-grab active:cursor-grabbing"
      style={{ left: initialX, top: initialY, width: CARD_W }}
      drag
      dragMomentum={true}
      dragElastic={0.1}
      dragTransition={{ bounceStiffness: 120, bounceDamping: 20 }}
      whileDrag={{ scale: 1.04, zIndex: 50, boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}
      initial={{ opacity: 0, scale: 0.7, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 200, damping: 18 }}
    >
      <MemoryCard photo={photo} index={index} isScratch={photo.scratch} />
    </motion.div>
  )
}

export default function DragCanvas({ photos }) {
  const canvasW = Math.max(1200, photos.length * 280)
  const canvasH = Math.max(800, Math.ceil(photos.length / 4) * 340)

  const positions = useRef(getInitialPositions(photos, canvasW, canvasH))

  const [hint, setHint] = useState(true)

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
      {/* Hint overlay */}
      {hint && (
        <motion.div
          className="absolute top-3 left-1/2 -translate-x-1/2 z-30 glass px-4 py-2 rounded-full flex items-center gap-2 pointer-events-none"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={() => setTimeout(() => setHint(false), 2500)}
        >
          <span className="text-white/40 text-xs font-mono tracking-widest">Sürükle & Keşfet ✨</span>
        </motion.div>
      )}

      {/* Background grid dots */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(212,160,122,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Pannable canvas */}
      <motion.div
        className="absolute"
        style={{ width: canvasW, height: canvasH, cursor: 'grab' }}
        drag
        dragMomentum={true}
        dragElastic={0.05}
        dragTransition={{ bounceStiffness: 100, bounceDamping: 20 }}
        whileDrag={{ cursor: 'grabbing' }}
      >
        {photos.map((photo, i) => (
          <FloatingNode
            key={photo.id}
            photo={photo}
            index={i}
            initialX={positions.current[i]?.x ?? 80 + i * 50}
            initialY={positions.current[i]?.y ?? 80 + i * 30}
          />
        ))}

        {/* Ambient glow blobs on canvas */}
        <div
          className="absolute rounded-full pointer-events-none blur-[120px] opacity-5"
          style={{ width: 400, height: 400, background: '#d4a07a', left: '20%', top: '15%' }}
        />
        <div
          className="absolute rounded-full pointer-events-none blur-[120px] opacity-5"
          style={{ width: 350, height: 350, background: '#c8b4e8', left: '60%', top: '50%' }}
        />
      </motion.div>
    </div>
  )
}
