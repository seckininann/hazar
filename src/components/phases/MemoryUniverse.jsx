import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Bookmark, Play, Pause, SkipForward,
  Music2, ChevronLeft, ChevronRight, Star, X,
} from 'lucide-react'
import { useAppState } from '../../store/appState.jsx'
import HeartEmitter from '../memory/HeartEmitter.jsx'

const LS_TITLE_KEY    = 'hazar_cover_title'
const LS_MESSAGES_KEY = 'hazar_love_messages'
const LS_HERO_KEY     = 'hazar_hero_bg'

const TRACKS = [
  { src: '/audio/music1.mp3', title: 'Seninle' },
  { src: '/audio/music2.mp3', title: 'Her Zaman' },
  { src: '/audio/music3.mp3', title: 'Sonsuzluk' },
]
const DEFAULT_MESSAGES = [
  { id: 'm1', text: 'Seninle her an güzel',    sub: 'her zaman, her yerde' },
  { id: 'm2', text: 'Dünyanın en tatlı insanısın', sub: 'sadece sen biliyorsun' },
  { id: 'm3', text: 'Seni çok seviyorum',       sub: 'kalbimin derinliklerinden' },
]
function loadMessages() {
  try {
    const s = localStorage.getItem(LS_MESSAGES_KEY)
    const a = s ? JSON.parse(s) : null
    return Array.isArray(a) && a.length > 0 ? a : DEFAULT_MESSAGES
  } catch { return DEFAULT_MESSAGES }
}
function getPhotoSrc(p) { return p.src || p.url || p.dataUrl || '' }

const CSS = `
@keyframes eqBar {
  0%,100% { height: 30%; }
  50%      { height: 100%; }
}
@keyframes hintPulse {
  0%,100% { opacity: 0.5; transform: translateX(0); }
  50%     { opacity: 1;   transform: translateX(6px); }
}
`

// ─── Scroll hint ──────────────────────────────────────────────────────────────
function ScrollHint() {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-end justify-center pb-28 pointer-events-none select-none"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0 }} transition={{ delay: 0.8, duration: 0.5 }}
    >
      <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl"
        style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
        <ChevronRight size={14} className="text-white/60" style={{ animation: 'hintPulse 1.2s ease-in-out infinite' }} />
        <ChevronRight size={14} className="text-white/40" style={{ animation: 'hintPulse 1.2s 0.15s ease-in-out infinite' }} />
        <span className="text-white/55 text-xs font-sans font-medium ml-1">Sola kaydır</span>
      </div>
    </motion.div>
  )
}

// ─── Avatar ring (small couple thumbnail in header) ──────────────────────────
function AvatarRing() {
  const src = localStorage.getItem(LS_HERO_KEY) || '/assets/couple.jpg'
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
      style={{ border: '2px solid rgba(212,160,122,0.5)', padding: 1 }}>
      <img src={src} alt="" className="w-full h-full object-cover rounded-full" />
    </div>
  )
}

// ─── Hero slide ───────────────────────────────────────────────────────────────
function HeroSlide({ coverTitle }) {
  const heroBg = localStorage.getItem(LS_HERO_KEY) || '/assets/couple.jpg'
  return (
    <div className="relative flex-shrink-0 h-full snap-start overflow-hidden" style={{ width: '100vw' }}>
      <img src={heroBg} alt="kapak"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.55) saturate(1.1)' }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/25 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 text-center">
        <motion.p
          className="text-white/45 text-xs font-sans font-medium tracking-widest uppercase mb-5"
          initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          {coverTitle}
        </motion.p>

        <motion.h1
          className="font-display text-4xl md:text-5xl font-bold text-white leading-snug mb-3"
          style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
          initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.75 }}>
          Dünya yıkılsa da
          <br />
          <span style={{
            background: 'linear-gradient(135deg,#f5d0a8 0%,#f0bcd0 55%,#ceb8f5 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            biz yıkılmayız
          </span>
        </motion.h1>

        <motion.div className="w-14 h-px mb-4"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)' }}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.1 }} />

        <motion.p
          className="text-white/28 text-sm font-display italic"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>
          seninle her şey anlamlı
        </motion.p>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
    </div>
  )
}

// ─── Photo slide — Instagram card style ──────────────────────────────────────
function PhotoSlide({ photo }) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tapHearts, setTapHearts] = useState([])
  const [flash, setFlash] = useState(false)
  const lastTap = useRef(0)
  const src = getPhotoSrc(photo)

  const handleDoubleTap = useCallback((e) => {
    const now = Date.now()
    if (now - lastTap.current < 360) {
      setLiked(true)
      const rect = e.currentTarget.getBoundingClientRect()
      const cx = (e.changedTouches?.[0]?.clientX ?? e.clientX) - rect.left
      const cy = (e.changedTouches?.[0]?.clientY ?? e.clientY) - rect.top
      const id = now
      setTapHearts(h => [...h, { id, cx, cy }])
      setTimeout(() => setTapHearts(h => h.filter(x => x.id !== id)), 1200)
    }
    lastTap.current = now
  }, [])

  const setAsCover = useCallback((e) => {
    e.stopPropagation()
    if (!src) return
    localStorage.setItem(LS_HERO_KEY, src)
    setFlash(true)
    setTimeout(() => setFlash(false), 1800)
  }, [src])

  return (
    <div className="flex-shrink-0 h-full snap-start flex flex-col items-center justify-center px-4 pb-24"
      style={{ width: '100vw', background: '#0c0b12' }}>

      {/* Card */}
      <motion.div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ background: '#161520', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      >
        {/* Post header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <AvatarRing />
          <div className="flex-1 min-w-0">
            <p className="text-white/90 text-sm font-semibold leading-none mb-0.5">Hazar</p>
            {photo.date && <p className="text-white/35 text-xs font-sans">{photo.date}</p>}
          </div>
          <motion.button
            className="p-1.5 rounded-full text-white/25 hover:text-white/60 transition-colors"
            onClick={setAsCover} whileTap={{ scale: 0.9 }}
            title="Kapak fotoğrafı yap">
            <Star size={15} fill={flash ? 'currentColor' : 'none'}
              style={{ color: flash ? 'rgba(251,191,36,0.85)' : undefined }} />
          </motion.button>
        </div>

        {/* Photo */}
        <div
          className="relative overflow-hidden cursor-pointer select-none"
          style={{ aspectRatio: '1/1' }}
          onClick={handleDoubleTap} onTouchEnd={handleDoubleTap}
        >
          {src
            ? <img src={src} alt={photo.caption || 'anı'} className="w-full h-full object-cover" draggable={false} />
            : <div className="w-full h-full bg-white/4 flex items-center justify-center">
                <span className="text-white/20 text-sm font-sans">Fotoğraf yok</span>
              </div>
          }

          {/* Tap hearts */}
          <AnimatePresence>
            {tapHearts.map(h => (
              <motion.div key={h.id}
                className="absolute pointer-events-none select-none"
                style={{ left: h.cx - 30, top: h.cy - 30 }}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: [0, 1.6, 1.2], opacity: [1, 1, 0], y: -60 }}
                transition={{ duration: 1 }}>
                <Heart size={60} fill="#e84393" color="#e84393" />
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {liked && tapHearts.length > 0 && (
              <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0,1,1,0], scale: [0,1.3,1,0.8] }}
                transition={{ duration: 0.7 }}>
                <Heart size={90} fill="#e84393" color="#e84393" style={{ filter: 'drop-shadow(0 0 20px #e84393aa)' }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action bar + caption */}
        <div className="px-4 pt-3 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <motion.button onClick={() => setLiked(l => !l)} whileTap={{ scale: 1.3 }}
                transition={{ type: 'spring', stiffness: 400, damping: 12 }}>
                <Heart size={24}
                  fill={liked ? '#e84393' : 'none'}
                  color={liked ? '#e84393' : 'rgba(255,255,255,0.7)'} />
              </motion.button>
            </div>
            <motion.button onClick={() => setSaved(s => !s)} whileTap={{ scale: 1.2 }}>
              <Bookmark size={22}
                fill={saved ? 'rgba(212,160,122,0.9)' : 'none'}
                color={saved ? 'rgba(212,160,122,0.9)' : 'rgba(255,255,255,0.45)'} />
            </motion.button>
          </div>

          {photo.caption && (
            <p className="text-white/75 text-sm font-sans leading-relaxed">
              <span className="text-white/90 font-semibold mr-1.5">hazar</span>
              {photo.caption}
            </p>
          )}
        </div>
      </motion.div>

      {/* Set cover flash */}
      <AnimatePresence>
        {flash && (
          <motion.p className="mt-3 text-amber-400/70 text-xs font-sans"
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            Kapak fotoğrafı ayarlandı
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Love slide — clean quote card ───────────────────────────────────────────
function LoveSlide({ msg }) {
  return (
    <div className="flex-shrink-0 h-full snap-start flex flex-col items-center justify-center px-5 pb-24"
      style={{ width: '100vw', background: '#0c0b12' }}>

      <motion.div
        className="w-full max-w-sm rounded-3xl px-8 py-12 text-center"
        style={{ background: '#161520', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
      >
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'linear-gradient(135deg,rgba(212,160,122,0.18),rgba(200,180,232,0.12))', border: '1px solid rgba(212,160,122,0.2)' }}>
          <Heart size={18} fill="rgba(212,160,122,0.8)" color="rgba(212,160,122,0.8)" />
        </div>

        <p className="font-display italic text-white/85 text-2xl leading-relaxed mb-5"
          style={{ textShadow: '0 0 30px rgba(212,160,122,0.1)' }}>
          "{msg.text}"
        </p>

        <div className="w-10 h-px mx-auto mb-4"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(212,160,122,0.4),transparent)' }} />

        <p className="text-white/35 text-xs font-sans tracking-widest uppercase">{msg.sub}</p>
      </motion.div>
    </div>
  )
}

// ─── Music control — full-width bottom bar ───────────────────────────────────
function MusicControl({ playing, trackEnded, currentTrack, onToggle, onNext }) {
  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom,0px)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.8, duration: 0.4 }}
    >
      <div style={{
        background: 'rgba(6,5,14,0.92)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(28px)',
      }}>
        {/* Track tabs */}
        <div className="flex items-stretch">
          {TRACKS.map((t, i) => (
            <button key={i}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors"
              style={{ borderBottom: i === currentTrack ? '2px solid rgba(212,160,122,0.8)' : '2px solid transparent' }}
              onClick={() => onNext(i)}>
              <span className="text-[11px] font-sans font-medium whitespace-nowrap"
                style={{ color: i === currentTrack ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.28)' }}>
                {t.title}
              </span>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-5 py-3">
          <Music2 size={14} style={{ color: playing ? 'rgba(212,160,122,0.7)' : 'rgba(255,255,255,0.18)' }} />

          {/* Play / pause */}
          <motion.button
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{
              background: playing
                ? 'linear-gradient(135deg,rgba(212,160,122,0.25),rgba(200,180,232,0.18))'
                : 'rgba(255,255,255,0.08)',
              border: playing ? '1px solid rgba(212,160,122,0.3)' : '1px solid rgba(255,255,255,0.07)',
            }}
            onClick={onToggle} whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.06 }}>
            {playing
              ? <div className="flex items-end justify-center gap-0.5 w-full" style={{ height: 16 }}>
                  {[1,2,3].map(j => (
                    <div key={j} className="w-0.5 rounded-full"
                      style={{ background: 'rgba(212,160,122,0.95)', animation: `eqBar 0.65s ${j*0.15}s ease-in-out infinite` }} />
                  ))}
                </div>
              : <Play size={14} fill="rgba(255,255,255,0.75)" color="rgba(255,255,255,0.75)" style={{ marginLeft: 2 }} />}
          </motion.button>

          <motion.button
            className="text-white/30 hover:text-white/65 transition-colors"
            onClick={() => onNext((currentTrack + 1) % TRACKS.length)}
            whileTap={{ scale: 0.88 }}>
            <SkipForward size={16} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Slide dots ───────────────────────────────────────────────────────────────
function SlideDots({ total, current }) {
  if (total <= 1) return null
  const MAX = 9
  const dots = total > MAX ? MAX : total
  return (
    <div className="absolute left-1/2 -translate-x-1/2 z-30 flex gap-1.5 pointer-events-none" style={{ bottom: 100 }}>
      {Array.from({ length: dots }).map((_, i) => (
        <div key={i} className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? 16 : 4, height: 4,
            background: i === current ? 'rgba(212,160,122,0.85)' : 'rgba(255,255,255,0.2)',
          }} />
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
  const [trackEnded, setTrackEnded] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const audioRef = useRef(null)
  const scrollRef = useRef(null)
  const interacted = useRef(false)

  const coverTitle = localStorage.getItem(LS_TITLE_KEY) || 'Özelimiz'
  const LOVE_MESSAGES = loadMessages()

  const slides = []
  photos.forEach((photo, i) => {
    slides.push({ type: 'photo', data: photo, key: `p-${photo.id}` })
    if ((i + 1) % 3 === 0) {
      const msg = LOVE_MESSAGES[Math.floor((i + 1) / 3) - 1]
      if (msg) slides.push({ type: 'love', data: msg, key: `l-${msg.id}-${i}` })
    }
  })
  if (photos.length === 0)
    LOVE_MESSAGES.forEach(msg => slides.push({ type: 'love', data: msg, key: `l-${msg.id}` }))
  const totalSlides = 1 + slides.length

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 4000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handler = () => {
      setCurrentSlide(Math.round(el.scrollLeft / window.innerWidth))
      setShowHint(false)
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onEnded = () => { setMusicPlaying(false); setTrackEnded(true) }
    audio.addEventListener('ended', onEnded)
    const tryPlay = () => {
      if (interacted.current) return
      audio.play().then(() => { setMusicPlaying(true); interacted.current = true }).catch(() => {})
    }
    const t = setTimeout(tryPlay, 2500)
    const onFirst = () => {
      if (interacted.current) return
      interacted.current = true
      clearTimeout(t)
      audio.play().then(() => setMusicPlaying(true)).catch(() => {})
    }
    document.addEventListener('touchstart', onFirst, { once: true })
    document.addEventListener('click', onFirst, { once: true })
    return () => {
      audio.removeEventListener('ended', onEnded)
      clearTimeout(t)
      document.removeEventListener('touchstart', onFirst)
      document.removeEventListener('click', onFirst)
    }
  }, [])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    interacted.current = true
    if (musicPlaying) { audio.pause(); setMusicPlaying(false) }
    else {
      if (trackEnded) { audio.currentTime = 0; setTrackEnded(false) }
      audio.play().then(() => setMusicPlaying(true)).catch(() => {})
    }
  }, [musicPlaying, trackEnded])

  const selectTrack = useCallback((i) => {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTrack(i); setTrackEnded(false)
    audio.src = TRACKS[i].src; audio.load()
    if (musicPlaying) audio.play().catch(() => {})
  }, [musicPlaying])

  const handleLogout = useCallback(() => {
    const audio = audioRef.current
    if (audio) { audio.pause(); audio.currentTime = 0 }
    dispatch({ type: 'RESET_TO_INTRO' })
  }, [dispatch])

  return (
    <div className="relative w-full h-full" style={{ background: '#0c0b12' }}>
      <style>{CSS}</style>
      <audio ref={audioRef} src={TRACKS[0].src} preload="metadata" />

      {/* Snap scroll container */}
      <div ref={scrollRef} className="w-full h-full flex"
        style={{
          overflowX: 'scroll', overflowY: 'hidden',
          scrollSnapType: 'x mandatory', scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none', msOverflowStyle: 'none',
          touchAction: 'pan-x',
        }}>
        <HeroSlide coverTitle={coverTitle} />
        {slides.map(s =>
          s.type === 'photo'
            ? <PhotoSlide key={s.key} photo={s.data} />
            : <LoveSlide key={s.key} msg={s.data} />
        )}
      </div>

      <AnimatePresence>{showHint && <ScrollHint />}</AnimatePresence>

      <SlideDots total={totalSlides} current={currentSlide} />

      {/* Top-left back button */}
      <motion.button
        className="absolute top-4 left-4 z-40 flex items-center gap-1.5 px-3 py-2 rounded-2xl"
        style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}
        onClick={handleLogout}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        whileTap={{ scale: 0.92 }}>
        <ChevronLeft size={14} className="text-white/50" />
        <span className="text-white/45 text-xs font-sans font-medium">Çıkış</span>
      </motion.button>

      <MusicControl
        playing={musicPlaying} trackEnded={trackEnded}
        currentTrack={currentTrack} onToggle={toggleMusic} onNext={selectTrack} />

      <HeartEmitter />
    </div>
  )
}
