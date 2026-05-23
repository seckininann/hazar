import React, { useRef, useCallback } from 'react'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { Trash2, Edit3 } from 'lucide-react'
import ScratchCanvas from './ScratchCanvas.jsx'

export default function MemoryCard({
  photo,
  index,
  onDelete,
  onEditCaption,
  isScratch = false,
}) {
  const cardRef = useRef(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [6, -6])
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-6, 6])
  const glowX = useTransform(mouseX, [-0.5, 0.5], [0, 100])
  const glowY = useTransform(mouseY, [-0.5, 0.5], [0, 100])
  const glowBg = useTransform(
    [glowX, glowY],
    ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(212,160,122,0.15), transparent 70%)`
  )

  const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 30 })
  const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 30 })

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }, [])

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0)
    mouseY.set(0)
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!cardRef.current) return
    const touch = e.touches[0]
    const rect = cardRef.current.getBoundingClientRect()
    const x = (touch.clientX - rect.left) / rect.width - 0.5
    const y = (touch.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x * 0.5)
    mouseY.set(y * 0.5)
  }, [])

  return (
    <motion.div
      ref={cardRef}
      className="relative group"
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseLeave}
      initial={{ opacity: 0, scale: 0.85, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 200, damping: 20 }}
      data-cursor="media"
    >
      <motion.div
        style={{
          rotateX: springRotateX,
          rotateY: springRotateY,
          transformStyle: 'preserve-3d',
        }}
        className="rounded-2xl overflow-hidden"
      >
        {/* Glow highlight */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: glowBg }}
        />

        {/* Image */}
        {isScratch ? (
          <ScratchCanvas
            src={photo.src}
            width={280}
            height={200}
          />
        ) : (
          <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
            <img
              src={photo.src}
              alt={photo.caption || 'Memory'}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        )}

        {/* Caption */}
        <div className="p-3" style={{ background: 'rgba(18,18,26,0.9)' }}>
          <p className="text-warm-white/80 text-sm font-display italic truncate">
            {photo.caption || 'Bir anı...'}
          </p>
          <p className="text-white/20 text-xs mt-1 font-mono">
            {photo.date || ''}
          </p>
        </div>

        {/* Admin controls */}
        {(onDelete || onEditCaption) && (
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            {onEditCaption && (
              <button
                className="p-1.5 rounded-lg glass hover:bg-white/10 text-white/50 hover:text-white/80 transition-all"
                onClick={() => onEditCaption(photo)}
              >
                <Edit3 size={12} />
              </button>
            )}
            {onDelete && (
              <button
                className="p-1.5 rounded-lg glass hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-all"
                onClick={() => onDelete(photo.id)}
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
