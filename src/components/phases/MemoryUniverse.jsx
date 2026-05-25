import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Music2, SkipForward } from 'lucide-react'
import { useAppState } from '../../store/appState.jsx'
import HeartEmitter from '../memory/HeartEmitter.jsx'

const LS_TITLE_KEY    = 'hazar_cover_title'
const LS_MESSAGES_KEY = 'hazar_love_messages'
const LS_HERO_KEY     = 'hazar_hero_bg'

const TRACKS = [
  { src: '/audio/music1.mp3', title: 'Seninle',      label: 'ilk melodi' },
  { src: '/audio/music2.mp3', title: 'Her Zaman',    label: 'ikinci melodi' },
  { src: '/audio/music3.mp3', title: 'Sonsuzluk',    label: 'üçüncü melodi' },
]
const DEFAULT_MESSAGES = [
  { id: 'm1', text: 'Seninle her an güzel 🖤',     sub: 'her zaman, her yerde' },
  { id: 'm2', text: 'Dünyanın en tatlı insanısın', sub: 'sadece sen biliyorsun' },
  { id: 'm3', text: 'Seni çok seviyorum',          sub: '— kalbimin derinliklerinden' },
]
function loadMessages() {
  try {
    const s = localStorage.getItem(LS_MESSAGES_KEY)
    const a = s ? JSON.parse(s) : null
    return Array.isArray(a) && a.length > 0 ? a : DEFAULT_MESSAGES
  } catch { return DEFAULT_MESSAGES }
}
function getPhotoSrc(p) { return p.src || p.url || p.dataUrl || '' }

// ─── CSS keyframe for swipe hint (no framer-motion loop needed) ────────────────
const swipeHintStyle = `
@keyframes swipeRight {
  0%   { transform: translateX(0);    opacity: 0.7; }
  40%  { transform: translateX(16px); opacity: 1;   }
  70%  { transform: translateX(16px); opacity: 0.5; }
  100% { transform: translateX(0);    opacity: 0.7; }
}
@keyframes eqBar {
  0%,100% { height: 30%; }
  50%      { height: 100%; }
}
`

// ─── Scroll hint ──────────────────────────────────────────────────────────────
function ScrollHint() {
  return (
    <>
      <style>{swipeHintStyle}</style>
      <motion.div
        className="absolute inset-0 z-50 flex flex-col items-center justify-end pb-32 pointer-events-none select-none"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.4 } }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        {/* Dim overlay */}
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          {/* Swipe hand */}
          <div className="flex items-center gap-2"
            style={{ animation: 'swipeRight 1.4s ease-in-out infinite' }}>
            <span className="text-3xl">👆</span>
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40"
                  style={{ opacity: 1 - i * 0.3 }} />
              ))}
            </div>
          </div>
          {/* Label */}
          <div className="px-5 py-2 rounded-full text-white/65 text-xs font-mono tracking-[0.25em]"
            style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.12)' }}>
            sola kaydır →
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ─── Hero slide ───────────────────────────────────────────────────────────────
function HeroSlide({ coverTitle }) {
  const heroBg = localStorage.getItem(LS_HERO_KEY) || '/assets/couple.jpg'
  return (
    <div className="relative flex-shrink-0 h-full snap-start overflow-hidden"
      style={{ width: '100vw' }}>
      {/* BG photo */}
      <img src={heroBg} alt="hero"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.6) saturate(1.1)' }} />
      {/* Softer overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 text-center">
        <motion.p className="text-white/40 text-xs font-mono tracking-[0.45em] uppercase mb-5"
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          {coverTitle}
        </motion.p>

        <motion.h1 className="font-display text-4xl md:text-5xl font-bold text-white leading-snug mb-4"
          style={{ textShadow: '0 3px 24px rgba(0,0,0,0.5)' }}
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}>
          Dünya yıkılsa da
          <br />
          <span style={{
            background: 'linear-gradient(135deg,#f5d0a8 0%,#f0bcd0 50%,#ceb8f5 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            biz yıkılmayız
          </span>
        </motion.h1>

        <motion.div className="w-16 h-px mb-4"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)' }}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.1 }} />

        <motion.p className="text-white/28 text-sm font-display italic mb-10"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>
          — seninle her şey anlamlı
        </motion.p>

      </div>

      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
    </div>
  )
}

// ─── Photo slide ──────────────────────────────────────────────────────────────
function PhotoSlide({ photo }) {
  const [liked, setLiked] = useState(false)
  const [tapHearts, setTapHearts] = useState([])
  const [flash, setFlash] = useState(false)
  const lastTap = useRef(0)
  const src = getPhotoSrc(photo)

  const handleTap = useCallback((e) => {
    const now = Date.now()
    if (now - lastTap.current < 360) {
      setLiked(true)
      const rect = e.currentTarget.getBoundingClientRect()
      const cx = (e.changedTouches?.[0]?.clientX ?? e.clientX) - rect.left
      const cy = (e.changedTouches?.[0]?.clientY ?? e.clientY) - rect.top
      const id = now
      setTapHearts(h => [...h, { id, cx, cy }])
      setTimeout(() => setTapHearts(h => h.filter(hh => hh.id !== id)), 1300)
    }
    lastTap.current = now
  }, [])

  const setAsHero = useCallback((e) => {
    e.stopPropagation()
    if (!src) return
    localStorage.setItem(LS_HERO_KEY, src)
    setFlash(true)
    setTimeout(() => setFlash(false), 1800)
  }, [src])

  return (
    <div className="relative flex-shrink-0 h-full snap-start overflow-hidden"
      style={{ width: '100vw' }}>
      {/* Full-screen photo */}
      <div className="absolute inset-0 select-none" onClick={handleTap} onTouchEnd={handleTap}>
        {src
          ? <img src={src} alt={photo.caption || 'anı'} className="w-full h-full object-cover" draggable={false} />
          : <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/20 text-xs font-mono">fotoğraf yok</div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

        {/* Tap hearts */}
        <AnimatePresence>
          {tapHearts.map(h => (
            <motion.div key={h.id}
              className="absolute pointer-events-none text-5xl select-none"
              style={{ left: h.cx - 28, top: h.cy - 28 }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 1.5, 1], opacity: [1, 1, 0], y: -70 }}
              exit={{ opacity: 0 }} transition={{ duration: 1.1 }}>
              ❤️
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {liked && (
            <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0,1,1,0], scale: [0,1.4,1.1,0.8] }}
              transition={{ duration: 0.8 }}>
              <span className="text-8xl drop-shadow-2xl">❤️</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {photo.caption && (
        <div className="absolute bottom-20 inset-x-0 px-7 pointer-events-none">
          <p className="text-white/85 font-display italic text-xl leading-relaxed text-center"
            style={{ textShadow: '0 2px 14px rgba(0,0,0,0.9)' }}>
            {photo.caption}
          </p>
        </div>
      )}

      {/* Bottom bar */}
      <div className="absolute bottom-5 inset-x-0 flex items-center justify-between px-6 z-10">
        <motion.button className="text-2xl select-none"
          onClick={() => setLiked(l => !l)} whileTap={{ scale: 1.45 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
          {liked ? '❤️' : '🤍'}
        </motion.button>

        <AnimatePresence>
          {flash && (
            <motion.span className="text-xs font-mono text-rose-gold/75"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              ✦ Kapak olarak ayarlandı
            </motion.span>
          )}
        </AnimatePresence>

        <motion.button
          className="px-3 py-1.5 rounded-full text-xs font-mono text-white/38"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}
          onClick={setAsHero} whileTap={{ scale: 0.93 }}>
          ✦ kapak yap
        </motion.button>
      </div>

      {photo.date && (
        <div className="absolute top-5 right-5 z-10 pointer-events-none">
          <span className="text-white/28 text-xs font-mono">{photo.date}</span>
        </div>
      )}
    </div>
  )
}

// ─── Love slide ───────────────────────────────────────────────────────────────
function LoveSlide({ msg }) {
  return (
    <div className="relative flex-shrink-0 h-full snap-start flex items-center justify-center"
      style={{ width: '100vw', background: 'linear-gradient(160deg,#07060e 0%,#0d0812 100%)' }}>
      {/* Static soft blobs — no animation to prevent freezing */}
      <div className="absolute w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,rgba(212,160,122,0.09),transparent 70%)', top: '15%', left: '10%' }} />
      <div className="absolute w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,rgba(200,180,232,0.08),transparent 70%)', bottom: '15%', right: '8%' }} />

      <div className="relative z-10 px-10 text-center max-w-sm">
        <motion.div className="text-4xl mb-7 select-none"
          animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}>
          🌹
        </motion.div>
        <p className="font-display italic text-white/82 text-2xl md:text-3xl leading-relaxed mb-6"
          style={{ textShadow: '0 0 40px rgba(212,160,122,0.12)' }}>
          "{msg.text}"
        </p>
        <div className="w-12 h-px mx-auto mb-4"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(212,160,122,0.45),transparent)' }} />
        <p className="text-rose-gold/38 text-xs font-mono tracking-[0.4em] uppercase">{msg.sub}</p>
      </div>
    </div>
  )
}

// ─── Floating music control ───────────────────────────────────────────────────
function MusicControl({ audioRef, playing, trackEnded, currentTrack, onToggle, onNext }) {
  const [expanded, setExpanded] = useState(false)
  const track = TRACKS[currentTrack]

  return (
    <div className="absolute bottom-16 right-4 z-40 flex flex-col items-end gap-2">
      {/* Track list popup */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="flex flex-col gap-1.5 items-end"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
          >
            {TRACKS.map((t, i) => (
              <button key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono transition-all"
                style={currentTrack === i ? {
                  background: 'rgba(212,160,122,0.18)',
                  border: '1px solid rgba(212,160,122,0.3)',
                  color: 'rgba(212,160,122,0.9)',
                } : {
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.45)',
                  backdropFilter: 'blur(12px)',
                }}
                onClick={() => { onNext(i); setExpanded(false) }}>
                {currentTrack === i && playing
                  ? <div className="flex items-end gap-0.5 h-3 mr-0.5">
                      {[1,2,3].map(j => (
                        <div key={j} className="w-0.5 rounded-full bg-rose-gold/85"
                          style={{ animation: `eqBar 0.7s ${j*0.15}s ease-in-out infinite` }} />
                      ))}
                    </div>
                  : <Music2 size={10} />}
                {t.title}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main pill */}
      <div className="flex items-center gap-1.5 rounded-full px-2 py-1.5"
        style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }}>
        {/* Play/pause */}
        <motion.button
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: playing ? 'rgba(212,160,122,0.2)' : 'rgba(255,255,255,0.07)' }}
          onClick={onToggle} whileTap={{ scale: 0.88 }}>
          {playing
            ? <div className="flex items-end gap-0.5 h-3">
                {[1,2,3].map(j => (
                  <div key={j} className="w-0.5 rounded-full bg-rose-gold/85"
                    style={{ animation: `eqBar 0.65s ${j*0.15}s ease-in-out infinite` }} />
                ))}
              </div>
            : <Play size={10} style={{ color: 'rgba(255,255,255,0.55)', marginLeft: 1 }} />}
        </motion.button>

        {/* Track name — tap to expand */}
        <button className="text-[10px] font-mono text-white/38 max-w-[72px] truncate"
          onClick={() => setExpanded(e => !e)}>
          {trackEnded ? '♪ bitti' : track.title}
        </button>

        {/* Next */}
        <button className="text-white/22 hover:text-white/55 transition-colors"
          onClick={() => onNext((currentTrack + 1) % TRACKS.length)}>
          <SkipForward size={10} />
        </button>
      </div>
    </div>
  )
}

// ─── Slide dots ───────────────────────────────────────────────────────────────
function SlideDots({ total, current }) {
  if (total <= 1) return null
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-1.5 pointer-events-none">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? 18 : 5, height: 5,
            background: i === current ? 'rgba(212,160,122,0.82)' : 'rgba(255,255,255,0.22)',
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

  // Build slides
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

  // Auto-hide hint
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 4000)
    return () => clearTimeout(t)
  }, [])

  // Track scroll position
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handler = () => {
      const idx = Math.round(el.scrollLeft / window.innerWidth)
      setCurrentSlide(idx)
      setShowHint(false)
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [])

  // Audio setup — auto-play after 2.5s on first user interaction
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onEnded = () => { setMusicPlaying(false); setTrackEnded(true) }
    audio.addEventListener('ended', onEnded)

    // Try auto-play after 2.5s
    const tryPlay = () => {
      if (interacted.current) return
      audio.play().then(() => { setMusicPlaying(true); interacted.current = true }).catch(() => {})
    }
    const t = setTimeout(tryPlay, 2500)

    // Also attempt on first user touch (for mobile)
    const onFirstTouch = () => {
      if (interacted.current) return
      interacted.current = true
      clearTimeout(t)
      audio.play().then(() => setMusicPlaying(true)).catch(() => {})
      document.removeEventListener('touchstart', onFirstTouch)
      document.removeEventListener('click', onFirstTouch)
    }
    document.addEventListener('touchstart', onFirstTouch, { once: true })
    document.addEventListener('click', onFirstTouch, { once: true })

    return () => {
      audio.removeEventListener('ended', onEnded)
      clearTimeout(t)
      document.removeEventListener('touchstart', onFirstTouch)
      document.removeEventListener('click', onFirstTouch)
    }
  }, [])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    interacted.current = true
    if (musicPlaying) {
      audio.pause(); setMusicPlaying(false)
    } else {
      if (trackEnded) { audio.currentTime = 0; setTrackEnded(false) }
      audio.play().then(() => setMusicPlaying(true)).catch(() => {})
    }
  }, [musicPlaying, trackEnded])

  const selectTrack = useCallback((i) => {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTrack(i)
    setTrackEnded(false)
    audio.src = TRACKS[i].src
    audio.load()
    if (musicPlaying) audio.play().catch(() => {})
  }, [musicPlaying])

  const handleLogout = useCallback(() => {
    const audio = audioRef.current
    if (audio) { audio.pause(); audio.currentTime = 0 }
    dispatch({ type: 'RESET_TO_INTRO' })
  }, [dispatch])

  return (
    <div className="relative w-full h-full" style={{ background: '#06050c' }}>
      <style>{swipeHintStyle}</style>
      <audio ref={audioRef} src={TRACKS[0].src} preload="metadata" />

      {/* Horizontal snap container */}
      <div
        ref={scrollRef}
        className="w-full h-full flex"
        style={{
          overflowX: 'scroll',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          touchAction: 'pan-x',
        }}
      >
        <HeroSlide coverTitle={coverTitle} />
        {slides.map(slide =>
          slide.type === 'photo'
            ? <PhotoSlide key={slide.key} photo={slide.data} />
            : <LoveSlide key={slide.key} msg={slide.data} />
        )}
      </div>

      {/* Scroll hint overlay */}
      <AnimatePresence>
        {showHint && <ScrollHint />}
      </AnimatePresence>

      {/* Slide dots */}
      <SlideDots total={totalSlides} current={currentSlide} />

      {/* Logout */}
      <motion.button
        className="absolute top-4 left-4 z-40 text-white/28 text-xs font-mono tracking-wider px-3 py-1.5 rounded-xl"
        style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}
        onClick={handleLogout}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
        whileTap={{ scale: 0.93 }}>
        ← çıkış
      </motion.button>

      {/* Floating music control */}
      <MusicControl
        audioRef={audioRef} playing={musicPlaying} trackEnded={trackEnded}
        currentTrack={currentTrack} onToggle={toggleMusic}
        onNext={selectTrack} />

      <HeartEmitter />
    </div>
  )
}
