import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFaceRecognition } from '../../hooks/useFaceRecognition'

const STORAGE_KEY = 'hazar_face_descriptors'

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

  const handleDownload = () => {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'face-descriptors.json'
    a.click()
    URL.revokeObjectURL(url)
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
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>⏳</motion.span>
              İşleniyor...
            </span>
          ) : hasEnrolled ? '🔄 Fotoğrafları Güncelle' : '📷 Fotoğraf Yükle'}
        </motion.button>

        {hasEnrolled && (
          <motion.button
            className="px-4 py-2 rounded-xl text-sm font-mono tracking-wide transition-all"
            style={{
              background: 'rgba(100,180,100,0.08)',
              border: '1px solid rgba(100,180,100,0.2)',
              color: 'rgba(140,220,140,0.8)',
            }}
            onClick={handleDownload}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            📥 JSON İndir
          </motion.button>
        )}

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

      {/* Deploy instructions */}
      {hasEnrolled && (
        <motion.div
          className="mt-5 rounded-xl p-4 text-xs font-mono leading-relaxed"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-white/50 mb-2 font-sans text-xs">
            📌 <strong className="text-white/70">Her cihazda çalışması için:</strong>
          </p>
          <ol className="text-white/35 space-y-1 list-none">
            <li>1. <span className="text-green-400/70">📥 JSON İndir</span> butonuna bas</li>
            <li>2. İndirilen <code className="text-rose-gold/60">face-descriptors.json</code> dosyasını</li>
            <li className="pl-3">projenin <code className="text-rose-gold/60">public/</code> klasörüne koy</li>
            <li>3. GitHub'a push et → Vercel otomatik deploy eder</li>
            <li>4. Artık incognito dahil her cihazda çalışır ✓</li>
          </ol>
        </motion.div>
      )}

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
