import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Music2, ChevronRight } from 'lucide-react'
import { useAppState } from '../../store/appState.jsx'
import HeartEmitter from '../memory/HeartEmitter.jsx'

const LS_TITLE_KEY    = 'hazar_cover_title'
const LS_MESSAGES_KEY = 'hazar_love_messages'
const LS_HERO_KEY     = 'hazar_hero_bg'

const TRACKS = [
  { src: '/audio/music1.mp3', title: 'Şarkı I',   label: 'Dünya Yıkılsa' },
  { src: '/audio/music2.mp3', title: 'Şarkı II',  label: 'Seninleyim' },
  { src: '/audio/music3.mp3', title: 'Şarkı III', label: 'Sonsuzluk' },
]
const DEFAULT_MESSAGES = [
  { id: 'm1', text: 'Seninle her an güzel 🖤',        sub: 'her zaman, her yerde' },
  { id: 'm2', text: 'Dünyanın en tatlı insanısın',    sub: 'sadece sen biliyorsun' },
  { id: 'm3', text: 'Seni çok seviyorum',             sub: '— kalbimin derinliklerinden' },
]
function loadMessages() {
  try {
    const s = localStorage.getItem(LS_MESSAGES_KEY)
    const a = s ? JSON.parse(s) : null
    return Array.isArray(a) && a.length > 0 ? a : DEFAULT_MESSAGES
  } catch { return DEFAULT_MESSAGES }
}

// ─── Scroll hint ──────────────────────────────────────────────────────────────
function ScrollHint() {
  return (
    <motion.div
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none select-none"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: 0.8, duration: 0.5 }}
    >
      <motion.div
        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white/50 text-xs font-mono tracking-widest"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }}
        animate={{ x: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 1.3, ease: 'easeInOut' }}
      >
        <span>kaydır</span>
        <ChevronRight size={12} />
      </motion.div>
    </motion.div>
  )
}

// ─── Hero slide ───────────────────────────────────────────────────────────────
function HeroSlide({ coverTitle, musicPlaying, onMusicToggle }) {
  const heroBg = localStorage.getItem(LS_HERO_KEY) || '/assets/couple.jpg'
  return (
    <div className="relative flex-shrink-0 w-full h-full snap-start overflow-hidden"
      style={{ minWidth: '100%' }}>
      <div className="absolute inset-0">
        <img src={heroBg} alt="hero" className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.52) saturate(1.15)' }} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/45 pointer-events-none" />

      {/* Stars */}
      {[...Array(7)].map((_, i) => (
        <motion.div key={i}
          className="absolute text-base select-none pointer-events-none opacity-60"
          style={{ left: `${10 + i * 13}%`, top: `${18 + (i % 4) * 15}%` }}
          animate={{ y: [0, -14, 0], opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ repeat: Infinity, duration: 3.2 + i * 0.6, delay: i * 0.4 }}>
          {['✨','🌟','💫','⭐','✨','💫','🌟'][i]}
        </motion.div>
      ))}

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 text-center">
        <motion.p className="text-white/45 text-xs font-mono tracking-[0.45em] uppercase mb-5"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          {coverTitle}
        </motion.p>

        <motion.h1 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight mb-4"
          style={{ textShadow: '0 4px 30px rgba(0,0,0,0.6)' }}
          initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.9 }}>
          Dünya yıkılsa da
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #f5d0a8 0%, #f0bcd0 50%, #ceb8f5 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            biz yıkılmayız
          </span>
        </motion.h1>

        <motion.div className="w-20 h-px mb-5"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)' }}
          initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1.1 }} />

        <motion.p className="text-white/30 text-sm font-display italic mb-12"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>
          — seninle her şey anlamlı
        </motion.p>

        {/* Music button */}
        <motion.button
          className="flex items-center gap-3 px-7 py-3.5 rounded-full"
          style={{
            background: musicPlaying ? 'rgba(212,160,122,0.22)' : 'rgba(255,255,255,0.09)',
            border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(20px)',
          }}
          onClick={onMusicToggle}
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>
          {musicPlaying ? (
            <>
              <div className="flex items-end gap-0.5 h-4">
                {[1,2,3,4].map(j => (
                  <motion.div key={j} className="w-1 rounded-full bg-rose-gold/90"
                    animate={{ height: ['35%','100%','55%','100%','35%'] }}
                    transition={{ repeat: Infinity, duration: 0.75, delay: j * 0.12 }} />
                ))}
              </div>
              <span className="text-white/65 text-xs font-mono tracking-wider">Duraklat</span>
            </>
          ) : (
            <>
              <Play size={14} className="text-white/65 ml-0.5" />
              <span className="text-white/65 text-xs font-mono tracking-wider">Müzik Başlat</span>
            </>
          )}
        </motion.button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />
    </div>
  )
}

// ─── Photo slide ──────────────────────────────────────────────────────────────
function PhotoSlide({ photo }) {
  const [liked, setLiked] = useState(false)
  const [tapHearts, setTapHearts] = useState([])
  const [setBgFlash, setSetBgFlash] = useState(false)
  const lastTap = useRef(0)

  const handleTap = (e) => {
    const now = Date.now()
    if (now - lastTap.current < 360) {
      setLiked(true)
      const rect = e.currentTarget.getBoundingClientRect()
      const cx = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left
      const cy = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top
      const id = now
      setTapHearts(h => [...h, { id, cx, cy }])
      setTimeout(() => setTapHearts(h => h.filter(hh => hh.id !== id)), 1400)
    }
    lastTap.current = now
  }

  const setAsHero = (e) => {
    e.stopPropagation()
    localStorage.setItem(LS_HERO_KEY, photo.url || photo.dataUrl)
    setSetBgFlash(true)
    setTimeout(() => setSetBgFlash(false), 1600)
  }

  return (
    <div className="relative flex-shrink-0 w-full h-full snap-start overflow-hidden"
      style={{ minWidth: '100%' }}>
      <div className="absolute inset-0 cursor-pointer select-none"
        onClick={handleTap} onTouchEnd={handleTap}>
        <img src={photo.url || photo.dataUrl} alt={photo.caption || 'anı'}
          className="w-full h-full object-cover" draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25 pointer-events-none" />

        <AnimatePresence>
          {tapHearts.map(h => (
            <motion.div key={h.id}
              className="absolute pointer-events-none text-5xl select-none"
              style={{ left: h.cx - 28, top: h.cy - 28 }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 1.5, 1.1], opacity: [1, 1, 0], y: -80 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}>
              ❤️
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {liked && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.4, 1.1, 0.8] }}
              transition={{ duration: 0.85 }}>
              <span className="text-8xl drop-shadow-2xl">❤️</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {photo.caption && (
        <div className="absolute bottom-20 left-0 right-0 px-7 pointer-events-none">
          <p className="text-white/88 font-display italic text-xl leading-relaxed text-center"
            style={{ textShadow: '0 2px 16px rgba(0,0,0,0.85)' }}>
            {photo.caption}
          </p>
        </div>
      )}

      <div className="absolute bottom-5 left-0 right-0 flex items-center justify-between px-6 z-10">
        <motion.button className="text-2xl select-none"
          onClick={() => setLiked(l => !l)}
          whileTap={{ scale: 1.45 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
          {liked ? '❤️' : '🤍'}
        </motion.button>

        <AnimatePresence>
          {setBgFlash && (
            <motion.span className="text-xs font-mono text-rose-gold/80"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              ✦ Kapak olarak ayarlandı
            </motion.span>
          )}
        </AnimatePresence>

        <motion.button
          className="px-3.5 py-1.5 rounded-full text-xs font-mono text-white/40 hover:text-white/70 transition-colors"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(14px)' }}
          onClick={setAsHero} whileTap={{ scale: 0.93 }}>
          ✦ kapak yap
        </motion.button>
      </div>

      {photo.date && (
        <div className="absolute top-5 right-5 z-10">
          <span className="text-white/30 text-xs font-mono">
            {new Date(photo.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Love slide ───────────────────────────────────────────────────────────────
function LoveSlide({ msg }) {
  return (
    <div className="relative flex-shrink-0 w-full h-full snap-start overflow-hidden flex items-center justify-center"
      style={{ minWidth: '100%', background: '#050508' }}>
      <motion.div className="absolute w-96 h-96 rounded-full blur-[140px]"
        style={{ background: 'radial-gradient(circle, rgba(212,160,122,0.18), transparent)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ repeat: Infinity, duration: 5 }} />
      <motion.div className="absolute w-72 h-72 rounded-full blur-[110px]"
        style={{ background: 'radial-gradient(circle, rgba(200,180,232,0.14), transparent)', right: '5%', bottom: '15%' }}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ repeat: Infinity, duration: 7, delay: 1.5 }} />

      <div className="relative z-10 px-10 text-center max-w-sm">
        <motion.div className="text-4xl mb-7 select-none"
          animate={{ y: [0, -10, 0], scale: [1, 1.12, 1] }}
          transition={{ repeat: Infinity, duration: 2.8 }}>
          🌹
        </motion.div>
        <motion.p
          className="font-display italic text-white/88 text-2xl md:text-3xl leading-relaxed mb-6"
          style={{ textShadow: '0 0 50px rgba(212,160,122,0.18)' }}
          initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}>
          "{msg.text}"
        </motion.p>
        <motion.div className="w-14 h-px mx-auto mb-4"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(212,160,122,0.5), transparent)' }}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5 }} />
        <p className="text-rose-gold/40 text-xs font-mono tracking-[0.4em] uppercase">{msg.sub}</p>
      </div>
    </div>
  )
}

// ─── Music slide ──────────────────────────────────────────────────────────────
function MusicSlide({ audioRef, playing, onToggle, currentTrack, onSelectTrack }) {
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => {
      if (audio.duration) {
        setCurrentTime(audio.currentTime)
        setProgress(audio.currentTime / audio.duration)
      }
    }
    const onMeta = () => setDuration(audio.duration || 0)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('durationchange', onMeta)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('durationchange', onMeta)
    }
  }, [audioRef])

  const fmt = (s) => { const m = Math.floor(s / 60); return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}` }

  const handleSeek = (e) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    audio.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration
  }

  const selectTrack = (i) => {
    const audio = audioRef.current
    if (!audio) return
    onSelectTrack(i)
    audio.src = TRACKS[i].src
    audio.load()
    if (playing) audio.play().catch(() => {})
  }

  return (
    <div className="relative flex-shrink-0 w-full h-full snap-start overflow-hidden flex items-center justify-center"
      style={{ minWidth: '100%', background: '#050508' }}>
      <motion.div className="absolute inset-0 opacity-25"
        style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(200,180,232,0.2), transparent 65%)' }} />

      <div className="relative z-10 w-full max-w-xs px-6">
        <div className="text-center mb-8">
          <motion.div className="text-5xl mb-4 select-none"
            animate={{ rotate: [0, 6, -6, 0], scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 3.5 }}>🎵</motion.div>
          <h2 className="font-display text-2xl text-white/75 mb-1">Müziklerimiz</h2>
          <p className="text-white/22 text-xs font-mono tracking-[0.3em]">3 parça</p>
        </div>

        <div className="space-y-2.5 mb-7">
          {TRACKS.map((t, i) => (
            <motion.button key={i}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
              style={currentTrack === i ? {
                background: 'linear-gradient(135deg,rgba(212,160,122,0.15),rgba(200,180,232,0.1))',
                border: '1px solid rgba(212,160,122,0.28)',
              } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              onClick={() => selectTrack(i)}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={currentTrack === i
                  ? { background: 'rgba(212,160,122,0.18)', border: '1px solid rgba(212,160,122,0.3)' }
                  : { background: 'rgba(255,255,255,0.04)' }}>
                {currentTrack === i && playing ? (
                  <div className="flex items-end gap-0.5 h-3.5">
                    {[1,2,3].map(j => (
                      <motion.div key={j} className="w-0.5 rounded-full bg-rose-gold/90"
                        animate={{ height: ['25%','100%','50%','100%','25%'] }}
                        transition={{ repeat: Infinity, duration: 0.7, delay: j * 0.15 }} />
                    ))}
                  </div>
                ) : (
                  <Music2 size={13} style={{ color: currentTrack === i ? 'rgba(212,160,122,0.8)' : 'rgba(255,255,255,0.28)' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-mono truncate ${currentTrack === i ? 'text-white/80' : 'text-white/35'}`}>{t.title}</p>
                <p className="text-[11px] font-mono text-white/20 truncate">{t.label}</p>
              </div>
              {currentTrack === i && (
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: playing ? 'rgba(212,160,122,0.85)' : 'rgba(255,255,255,0.2)' }} />
              )}
            </motion.button>
          ))}
        </div>

        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="h-1.5 bg-white/5 rounded-full cursor-pointer overflow-hidden mb-2.5" onClick={handleSeek}>
            <motion.div className="h-full rounded-full"
              style={{ width: `${progress * 100}%`, background: 'linear-gradient(90deg,#d4a07a,#c8b4e8)' }} />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-white/22 mb-3.5">
            <span>{fmt(currentTime)}</span><span>{fmt(duration)}</span>
          </div>
          <div className="flex justify-center">
            <motion.button
              className="w-13 h-13 w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,rgba(212,160,122,0.22),rgba(200,180,232,0.15))', border: '1px solid rgba(212,160,122,0.32)' }}
              onClick={onToggle} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              {playing
                ? <Pause size={18} style={{ color: 'rgba(212,160,122,0.9)' }} />
                : <Play size={18} style={{ color: 'rgba(212,160,122,0.9)', marginLeft: 2 }} />}
              {playing && (
                <motion.div className="absolute inset-0 rounded-full border border-rose-gold/25"
                  animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.4 }} />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Slide dots ───────────────────────────────────────────────────────────────
function SlideDots({ total, current }) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-1.5 pointer-events-none">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div key={i}
          className="rounded-full"
          animate={{
            width: i === current ? 18 : 5,
            background: i === current ? 'rgba(212,160,122,0.85)' : 'rgba(255,255,255,0.25)',
          }}
          transition={{ duration: 0.3 }}
          style={{ height: 5 }} />
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MemoryUniverse() {
  const { state, dispatch } = useAppState()
  const photos = state.photos || []
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showHint, setShowHint] = useState(true)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const audioRef = useRef(null)
  const scrollRef = useRef(null)

  const coverTitle = localStorage.getItem(LS_TITLE_KEY) || 'Özelimiz'
  const LOVE_MESSAGES = loadMessages()

  // Build slides array
  const slides = []
  photos.forEach((photo, i) => {
    slides.push({ type: 'photo', data: photo, key: `p-${photo.id}` })
    if ((i + 1) % 3 === 0) {
      const msg = LOVE_MESSAGES[Math.floor((i + 1) / 3) - 1]
      if (msg) slides.push({ type: 'love', data: msg, key: `l-${msg.id}-${i}` })
    }
  })
  if (photos.length === 0) {
    LOVE_MESSAGES.forEach(msg => slides.push({ type: 'love', data: msg, key: `l-${msg.id}` }))
  }
  const totalSlides = 1 + slides.length + 1  // hero + feed + music

  // Auto-hide hint
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 3200)
    return () => clearTimeout(t)
  }, [])

  // Track current slide
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handler = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth)
      setCurrentSlide(idx)
      setShowHint(false)
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [])

  // Audio track switch
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.src = TRACKS[currentTrack].src
    audio.load()
    if (musicPlaying) audio.play().catch(() => {})
  }, [currentTrack])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (musicPlaying) {
      audio.pause()
      setMusicPlaying(false)
    } else {
      audio.play().then(() => setMusicPlaying(true)).catch(() => {})
    }
  }, [musicPlaying])

  const handleLogout = useCallback(() => {
    const audio = audioRef.current
    if (audio) { audio.pause(); audio.currentTime = 0 }
    dispatch({ type: 'RESET_TO_INTRO' })
  }, [dispatch])

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#050508' }}>
      <audio ref={audioRef} src={TRACKS[0].src} preload="metadata" />

      {/* Horizontal snap container */}
      <div
        ref={scrollRef}
        className="w-full h-full flex overflow-x-scroll"
        style={{
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'contain',
        }}
      >
        <HeroSlide coverTitle={coverTitle} musicPlaying={musicPlaying} onMusicToggle={toggleMusic} />
        {slides.map(slide =>
          slide.type === 'photo'
            ? <PhotoSlide key={slide.key} photo={slide.data} />
            : <LoveSlide key={slide.key} msg={slide.data} />
        )}
        <MusicSlide
          audioRef={audioRef} playing={musicPlaying} onToggle={toggleMusic}
          currentTrack={currentTrack} onSelectTrack={setCurrentTrack} />
      </div>

      {/* Scroll hint */}
      <AnimatePresence>
        {showHint && <ScrollHint />}
      </AnimatePresence>

      {/* Slide dots */}
      <SlideDots total={totalSlides} current={currentSlide} />

      {/* Logout */}
      <motion.button
        className="absolute top-4 left-4 z-30 text-white/30 text-xs font-mono tracking-widest hover:text-rose-gold/70 transition-colors px-3 py-1.5 rounded-xl"
        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}
        onClick={handleLogout}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}>
        ← çıkış
      </motion.button>

      {/* Music status indicator */}
      {musicPlaying && (
        <motion.div
          className="absolute top-4 right-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-xl pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,160,122,0.2)', backdropFilter: 'blur(16px)' }}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-end gap-0.5 h-3">
            {[1,2,3].map(j => (
              <motion.div key={j} className="w-0.5 rounded-full bg-rose-gold/70"
                animate={{ height: ['25%','100%','50%','100%','25%'] }}
                transition={{ repeat: Infinity, duration: 0.65, delay: j * 0.15 }} />
            ))}
          </div>
          <span className="text-rose-gold/60 text-[10px] font-mono">♪</span>
        </motion.div>
      )}

      <HeartEmitter />
    </div>
  )
}
