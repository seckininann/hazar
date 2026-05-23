import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Image, Music2, ChevronLeft, ChevronRight, LayoutGrid, Move } from 'lucide-react'
import { useAppState } from '../../store/appState.jsx'
import MemoryCard from '../memory/MemoryCard.jsx'
import AudioPlayer from '../audio/AudioPlayer.jsx'
import HeartEmitter from '../memory/HeartEmitter.jsx'
import DragCanvas from '../memory/DragCanvas.jsx'

const SAMPLE_MESSAGES = [
  { id: 'sample-1', text: 'Seninle her an güzel 🖤', author: 'Sevgilinden' },
  { id: 'sample-2', text: 'Dünyanın en tatlı böceği sensin', author: 'Senden' },
  { id: 'sample-3', text: 'Seni çok seviyorum Hazar', author: 'Kalbinden' },
]

export default function MemoryUniverse() {
  const { state, dispatch } = useAppState()
  const [activeTab, setActiveTab] = useState('memories') // memories | audio | love
  const [viewMode, setViewMode] = useState('grid') // grid | canvas
  const [photoPage, setPhotoPage] = useState(0)
  const PHOTOS_PER_PAGE = 6
  const photos = state.photos || []
  const totalPages = Math.max(1, Math.ceil(photos.length / PHOTOS_PER_PAGE))
  const currentPhotos = photos.slice(photoPage * PHOTOS_PER_PAGE, (photoPage + 1) * PHOTOS_PER_PAGE)

  const handleAdminClick = useCallback(() => {
    dispatch({ type: 'SET_PHASE', payload: 'CREATIVE_STUDIO' })
  }, [dispatch])

  return (
    <div className="relative w-full h-full overflow-hidden bg-void">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #d4a07a 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-8 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #c8b4e8 0%, transparent 70%)' }} />
      </div>

      {/* Header */}
      <motion.header
        className="relative z-30 flex items-center justify-between px-4 md:px-8 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-3">
          <motion.img
            src="/assets/beetle.png"
            alt="logo"
            className="w-8 h-8 object-contain"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
          />
          <div>
            <h1 className="text-shimmer font-display font-bold text-lg tracking-wide">Hazar İçin</h1>
            <p className="text-white/20 text-xs tracking-[0.2em] font-mono uppercase">Memory Universe</p>
          </div>
        </div>

        <motion.button
          className="glass p-2 rounded-xl text-white/30 hover:text-rose-gold/70 transition-colors"
          onClick={handleAdminClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Admin Panel"
        >
          <Settings size={16} />
        </motion.button>
      </motion.header>

      {/* Tab navigation */}
      <div className="relative z-20 flex items-center gap-1 px-4 md:px-8 py-3">
        {[
          { key: 'memories', label: 'Anılar', icon: Image },
          { key: 'audio', label: 'Sesimiz', icon: Music2 },
          { key: 'love', label: 'Sevgi', icon: () => <span className="text-sm">🖤</span> },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs tracking-widest uppercase font-sans transition-all ${
              activeTab === key
                ? 'text-rose-gold bg-rose-gold/10 border border-rose-gold/20'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="phase-scroll relative z-10" style={{ height: 'calc(100% - 130px)' }}>
        <AnimatePresence mode="wait">

          {/* MEMORIES TAB */}
          {activeTab === 'memories' && (
            <motion.div
              key="memories"
              className="px-4 md:px-8 py-4 pb-24"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.35 }}
            >
              {/* View mode toggle */}
              {photos.length > 0 && (
                <div className="flex items-center gap-1.5 mb-4">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono tracking-widest transition-all ${
                      viewMode === 'grid' ? 'bg-rose-gold/10 text-rose-gold border border-rose-gold/20' : 'text-white/25 hover:text-white/50'
                    }`}
                  >
                    <LayoutGrid size={11} /> Grid
                  </button>
                  <button
                    onClick={() => setViewMode('canvas')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono tracking-widest transition-all ${
                      viewMode === 'canvas' ? 'bg-lavender/10 text-lavender border border-lavender/20' : 'text-white/25 hover:text-white/50'
                    }`}
                  >
                    <Move size={11} /> Canvas
                  </button>
                </div>
              )}

              {viewMode === 'canvas' && photos.length > 0 ? (
                <DragCanvas photos={photos} />
              ) : photos.length === 0 ? (
                <motion.div
                  className="flex flex-col items-center justify-center py-20 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <motion.div
                    className="text-6xl mb-6"
                    animate={{ rotate: [0, 10, -10, 0], y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                  >
                    📸
                  </motion.div>
                  <h2 className="font-display text-xl text-white/40 mb-3">Henüz anı yok</h2>
                  <p className="text-white/20 text-sm font-sans max-w-xs leading-relaxed">
                    Admin panelinden fotoğraf ekle ve bu evren canlanmaya başlasın ✨
                  </p>
                  <motion.button
                    className="mt-6 px-5 py-2.5 rounded-xl text-xs tracking-widest uppercase border border-rose-gold/20 text-rose-gold/60 hover:bg-rose-gold/10 transition-all"
                    onClick={handleAdminClick}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Admin Paneline Git →
                  </motion.button>
                </motion.div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentPhotos.map((photo, i) => (
                      <MemoryCard
                        key={photo.id}
                        photo={photo}
                        index={i}
                        isScratch={photo.scratch}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-8">
                      <button
                        className="glass p-2 rounded-lg text-white/40 hover:text-white/80 disabled:opacity-20 transition-all"
                        onClick={() => setPhotoPage(p => Math.max(0, p - 1))}
                        disabled={photoPage === 0}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-white/30 text-xs font-mono">
                        {photoPage + 1} / {totalPages}
                      </span>
                      <button
                        className="glass p-2 rounded-lg text-white/40 hover:text-white/80 disabled:opacity-20 transition-all"
                        onClick={() => setPhotoPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={photoPage >= totalPages - 1}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* AUDIO TAB */}
          {activeTab === 'audio' && (
            <motion.div
              key="audio"
              className="px-4 md:px-8 py-6 pb-24 flex flex-col gap-6 items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.35 }}
            >
              <motion.div
                className="text-center mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="font-display text-2xl text-shimmer mb-2">Sesimiz</h2>
                <p className="text-white/30 text-sm font-sans">Bizim şarkımız, bizim anımız</p>
              </motion.div>

              {/* Audio player card */}
              <motion.div
                className="glass-strong w-full max-w-lg rounded-3xl p-6"
                style={{ border: '1px solid rgba(212,160,122,0.12)' }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <motion.img
                    src="/assets/beetle.png"
                    alt="now playing"
                    className="w-12 h-12 object-contain rounded-xl"
                    style={{ background: 'rgba(212,160,122,0.08)' }}
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  />
                  <div>
                    <p className="text-warm-white/80 text-sm font-display">Sesimiz</p>
                    <p className="text-white/30 text-xs font-mono tracking-widest">HAZAR & SEN</p>
                  </div>
                </div>
                <AudioPlayer />
              </motion.div>
            </motion.div>
          )}

          {/* LOVE TAB */}
          {activeTab === 'love' && (
            <motion.div
              key="love"
              className="px-4 md:px-8 py-6 pb-24 flex flex-col gap-4 max-w-lg mx-auto"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.35 }}
            >
              <motion.h2
                className="font-display text-2xl text-center text-shimmer mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Sana yazılanlar
              </motion.h2>

              {SAMPLE_MESSAGES.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  className="glass-strong rounded-2xl p-5"
                  style={{ border: '1px solid rgba(212,160,122,0.08)' }}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.12, type: 'spring', stiffness: 200, damping: 20 }}
                  data-cursor="heart"
                >
                  <p className="font-display italic text-warm-white/80 text-base leading-relaxed mb-2">
                    "{msg.text}"
                  </p>
                  <p className="text-rose-gold/50 text-xs font-mono tracking-widest">
                    — {msg.author}
                  </p>
                </motion.div>
              ))}

              {/* Stats */}
              <motion.div
                className="glass rounded-2xl p-4 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-center text-white/20 text-xs font-mono tracking-widest mb-3">İSTATİSTİKLER</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Kalpler', value: state.heartBurstCount },
                    { label: 'Sarsıntı', value: state.shakeCount },
                    { label: 'Anılar', value: photos.length },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <div className="text-rose-gold font-display text-xl font-bold">{value}</div>
                      <div className="text-white/20 text-xs font-mono">{label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Heart emitter button */}
      <HeartEmitter />
    </div>
  )
}
