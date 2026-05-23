import React, { useState } from 'react'
import { motion } from 'framer-motion'

export default function CameraConsent({ onConsent }) {
  const [loading, setLoading] = useState(false)

  const handleConsent = async () => {
    setLoading(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      onConsent(stream)
    } catch {
      onConsent(null)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#08070f]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.8 }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(212,160,122,0.06) 0%, transparent 70%)' }}
        />
      </div>

      <motion.div
        className="relative text-center px-8 max-w-xs"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
      >
        {/* Decorative line */}
        <motion.div
          className="w-px h-12 bg-gradient-to-b from-transparent to-rose-gold/30 mx-auto mb-8"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        />

        <p className="text-white/25 text-xs tracking-[0.5em] uppercase font-mono mb-6">
          — bir an —
        </p>

        <motion.h2
          className="font-display text-xl md:text-2xl text-white/80 leading-relaxed mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 1 }}
        >
          Güzelliğini görmek istiyorum.
        </motion.h2>

        <motion.p
          className="text-white/35 text-sm font-sans leading-relaxed mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1 }}
        >
          Kameranı açmama izin verir misin?
        </motion.p>

        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.8 }}
        >
          <motion.button
            onClick={handleConsent}
            disabled={loading}
            className="text-rose-gold/70 text-sm font-sans tracking-[0.3em] uppercase border-b border-rose-gold/20 pb-0.5 hover:text-rose-gold hover:border-rose-gold/50 transition-all disabled:opacity-40"
            whileHover={{ letterSpacing: '0.4em' }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? (
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                bekleniyor...
              </motion.span>
            ) : 'onayla'}
          </motion.button>

        </motion.div>

        {/* Bottom decorative line */}
        <motion.div
          className="w-px h-12 bg-gradient-to-b from-rose-gold/20 to-transparent mx-auto mt-10"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        />
      </motion.div>
    </motion.div>
  )
}
