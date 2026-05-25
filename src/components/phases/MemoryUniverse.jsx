import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppState } from '../../store/appState.jsx'
import AudioPlayer from '../audio/AudioPlayer.jsx'
import HeartEmitter from '../memory/HeartEmitter.jsx'

const LS_TITLE_KEY = 'hazar_cover_title'
const LS_MESSAGES_KEY = 'hazar_love_messages'

const DEFAULT_MESSAGES = [
  { id: 'm1', text: 'Seninle her an güzel 🖤', sub: 'her zaman, her yerde' },
  { id: 'm2', text: 'Dünyanın en tatlı insanısın', sub: 'sadece sen biliyorsun' },
  { id: 'm3', text: 'Seni çok seviyorum, Eda', sub: '— kalbimin derinliklerinden' },
]

function loadMessages() {
  try {
    const saved = localStorage.getItem(LS_MESSAGES_KEY)
    const arr = saved ? JSON.parse(saved) : null
    return Array.isArray(arr) && arr.length > 0 ? arr : DEFAULT_MESSAGES
  } catch { return DEFAULT_MESSAGES }
}

function FeedPost({ photo, index }) {
  const [liked, setLiked] = useState(false)
  const [hearts, setHearts] = useState([])
  const lastTap = useRef(0)

  const handleDoubleTap = useCallback((e) => {
    const now = Date.now()
    if (now - lastTap.current < 350) {
      setLiked(true)
      const rect = e.currentTarget.getBoundingClientRect()
      const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left
      const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top
      const id = now
      setHearts(h => [...h, { id, x, y }])
      setTimeout(() => setHearts(h => h.filter(hh => hh.id !== id)), 1200)
    }
    lastTap.current = now
  }, [])

  return (
    <motion.div
      className="relative w-full max-w-lg mx-auto mb-8"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: 'easeOut', delay: index * 0.08 }}
    >
      {/* Photo */}
      <div
        className="relative w-full rounded-2xl overflow-hidden cursor-pointer select-none"
        style={{ aspectRatio: '4/5' }}
        onClick={handleDoubleTap}
        onTouchEnd={handleDoubleTap}
        data-cursor="media"
      >
        <img
          src={photo.url || photo.dataUrl}
          alt={photo.caption || 'anı'}
          className="w-full h-full object-cover"
          draggable={false}
        />
        {/* Subtle gradient bottom overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Double-tap hearts */}
        <AnimatePresence>
          {hearts.map(h => (
            <motion.div
              key={h.id}
              className="absolute pointer-events-none text-4xl select-none"
              style={{ left: h.x - 24, top: h.y - 24 }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 1.4, 1.2], opacity: [1, 1, 0], y: -60 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1 }}
            >
              🖤
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Like icon overlay on like */}
        <AnimatePresence>
          {liked && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.3, 1.2, 0.8] }}
              transition={{ duration: 0.8, times: [0, 0.2, 0.6, 1] }}
            >
              <span className="text-7xl drop-shadow-2xl">🖤</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Caption overlay */}
        {photo.caption && (
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-white/90 font-display italic text-sm leading-relaxed">
              {photo.caption}
            </p>
          </div>
        )}
      </div>

      {/* Bottom row */}
      <div className="flex items-center gap-3 px-1 mt-2.5">
        <motion.button
          className="text-xl select-none"
          onClick={() => setLiked(l => !l)}
          whileTap={{ scale: 1.4 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
          {liked ? '🖤' : '🤍'}
        </motion.button>
        <p className="text-white/20 text-xs font-mono tracking-widest flex-1">
          {photo.caption ? '' : ''}
        </p>
        <span className="text-white/15 text-xs font-mono">
          {photo.date ? new Date(photo.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : ''}
        </span>
      </div>
    </motion.div>
  )
}

function LoveCard({ msg, index }) {
  return (
    <motion.div
      className="relative w-full max-w-lg mx-auto mb-8 px-2"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
    >
      <div
        className="rounded-2xl p-7 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(212,160,122,0.06) 0%, rgba(200,180,232,0.06) 100%)',
          border: '1px solid rgba(212,160,122,0.12)',
        }}
        data-cursor="heart"
      >
        <motion.div
          className="text-2xl mb-3 select-none"
          animate={{ y: [0, -4, 0], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2.5, delay: index * 0.4 }}
        >
          🌹
        </motion.div>
        <p className="font-display italic text-white/80 text-lg md:text-xl leading-relaxed mb-3">
          "{msg.text}"
        </p>
        <p className="text-rose-gold/40 text-xs font-mono tracking-[0.3em] uppercase">
          {msg.sub}
        </p>
      </div>
    </motion.div>
  )
}

export default function MemoryUniverse() {
  const { state, dispatch } = useAppState()
  const photos = state.photos || []
  const feedRef = useRef(null)
  const coverTitle = localStorage.getItem(LS_TITLE_KEY) || 'Özelimiz'
  const LOVE_MESSAGES = loadMessages()

  const handleLogout = useCallback(() => {
    dispatch({ type: 'RESET_TO_INTRO' })
  }, [dispatch])

  // Interleave photos and love messages
  const feed = []
  photos.forEach((photo, i) => {
    feed.push({ type: 'photo', data: photo, key: photo.id })
    if ((i + 1) % 3 === 0 && LOVE_MESSAGES[(i + 1) / 3 - 1]) {
      const msg = LOVE_MESSAGES[Math.floor((i + 1) / 3) - 1]
      feed.push({ type: 'love', data: msg, key: msg.id })
    }
  })
  if (photos.length === 0) {
    LOVE_MESSAGES.forEach(msg => feed.push({ type: 'love', data: msg, key: msg.id }))
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-void">
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full opacity-8 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #d4a07a 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-6 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #c8b4e8 0%, transparent 70%)' }} />
      </div>

      {/* Scrollable feed */}
      <div ref={feedRef} className="h-full overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="px-4 md:px-8 pt-10 pb-32 max-w-lg mx-auto">

          {/* Cover */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-shimmer font-display text-3xl font-bold tracking-wide mb-1">{coverTitle}</h1>
            <p className="text-white/20 text-xs font-mono tracking-[0.4em] uppercase">anılar & sevgi</p>
          </motion.div>

          {/* Feed items */}
          {feed.map((item, i) =>
            item.type === 'photo'
              ? <FeedPost key={item.key} photo={item.data} index={i} />
              : <LoveCard key={item.key} msg={item.data} index={i} />
          )}

          {/* Audio card */}
          <motion.div
            className="w-full max-w-lg mx-auto mt-4 mb-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div
              className="rounded-2xl p-6"
              style={{ background: 'rgba(212,160,122,0.05)', border: '1px solid rgba(212,160,122,0.12)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl select-none">🎵</span>
                <div>
                  <p className="text-white/70 font-display text-sm">Sesimiz</p>
                  <p className="text-white/20 text-xs font-mono tracking-widest">bizim şarkımız</p>
                </div>
              </div>
              <AudioPlayer />
            </div>
          </motion.div>

          {/* End of feed */}
          <motion.div
            className="text-center py-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <motion.p
              className="text-white/15 text-xs font-mono tracking-[0.4em] uppercase"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              seni seviyorum 🖤
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Logout button */}
      <motion.button
        className="absolute top-4 right-4 z-30 text-white/35 text-xs font-mono tracking-widest hover:text-rose-gold/70 transition-colors px-3 py-1.5 rounded-lg"
        style={{ border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}
        onClick={handleLogout}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Çıkış"
      >
        çıkış ×
      </motion.button>

      {/* Heart emitter button */}
      <HeartEmitter />
    </div>
  )
}
