import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFaceRecognition } from '../../hooks/useFaceRecognition'

export default function FaceEnrollment() {
  const { modelsLoaded, hasEnrolled, enrollFaces, clearEnrollment } = useFaceRecognition()
  const [status, setStatus] = useState(null) // null | 'processing' | 'success' | 'fail'
  const [count, setCount] = useState(0)
  const inputRef = useRef(null)

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setStatus('processing')
    const n = await enrollFaces(files)
    if (n > 0) {
      setCount(n)
      setStatus('success')
    } else {
      setStatus('fail')
    }
    e.target.value = ''
  }

  const handleClear = () => {
    clearEnrollment()
    setStatus(null)
    setCount(0)
  }

  return (
    <motion.div
      className="rounded-2xl p-6"
      style={{ background: 'rgba(212,160,122,0.05)', border: '1px solid rgba(212,160,122,0.15)' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🌹</span>
        <div>
          <h3 className="text-white/80 font-display text-base tracking-wide">Yüz Tanıma — Eda</h3>
          <p className="text-white/30 text-xs font-mono mt-0.5">
            {hasEnrolled ? '✓ Yüz kaydedildi — tanıma aktif' : 'Henüz yüz kaydedilmedi'}
          </p>
        </div>
      </div>

      {!modelsLoaded && (
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            className="w-3 h-3 rounded-full border border-rose-gold/50 border-t-rose-gold"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
          />
          <span className="text-white/30 text-xs font-mono">Modeller yükleniyor...</span>
        </div>
      )}

      <p className="text-white/40 text-xs font-sans leading-relaxed mb-4">
        Eda'nın <strong className="text-white/60">2–5 farklı açıdan</strong> fotoğrafını yükle.
        Net, iyi aydınlatılmış, yüz görünür olsun.
      </p>

      <div className="flex flex-wrap gap-3">
        <motion.button
          className="px-4 py-2 rounded-xl text-sm font-mono tracking-wide transition-all disabled:opacity-30"
          style={{
            background: 'rgba(212,160,122,0.12)',
            border: '1px solid rgba(212,160,122,0.25)',
            color: 'rgba(245,240,235,0.8)',
          }}
          onClick={() => inputRef.current?.click()}
          disabled={!modelsLoaded || status === 'processing'}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          {status === 'processing' ? (
            <span className="flex items-center gap-2">
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                ⏳
              </motion.span>
              İşleniyor...
            </span>
          ) : hasEnrolled ? '🔄 Fotoğrafları Güncelle' : '📷 Fotoğraf Yükle'}
        </motion.button>

        {hasEnrolled && (
          <motion.button
            className="px-4 py-2 rounded-xl text-sm font-mono tracking-wide transition-all"
            style={{
              background: 'rgba(200,60,60,0.08)',
              border: '1px solid rgba(200,60,60,0.2)',
              color: 'rgba(220,120,120,0.8)',
            }}
            onClick={handleClear}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            🗑 Kaydı Sil
          </motion.button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleFiles}
      />

      <AnimatePresence>
        {status === 'success' && (
          <motion.p
            className="mt-3 text-green-400/70 text-xs font-mono"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            ✓ {count} yüz kaydedildi — tanıma hazır
          </motion.p>
        )}
        {status === 'fail' && (
          <motion.p
            className="mt-3 text-red-400/60 text-xs font-mono"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            ✗ Yüz bulunamadı — daha net, daha aydınlık fotoğraf dene
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
