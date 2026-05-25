import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Bookmark, Play, Pause, SkipForward,
  Music2, ChevronLeft, ChevronRight, Sparkles, Star, Infinity,
} from 'lucide-react'
import { useAppState } from '../../store/appState.jsx'
import HeartEmitter from '../memory/HeartEmitter.jsx'

const LS_TITLE_KEY    = 'hazar_cover_title'
const LS_MESSAGES_KEY = 'hazar_love_messages'

const TRACKS = [
  { src: '/audio/music1.mp3', title: 'Seninle' },
  { src: '/audio/music2.mp3', title: 'Her Zaman' },
  { src: '/audio/music3.mp3', title: 'Sonsuzluk' },
]
const DEFAULT_MESSAGES = [
  { id: 'm1', text: 'Seninle her an güzel', sub: 'her zaman, her yerde' },
  { id: 'm2', text: 'Dünyanın en tatlı insanısın', sub: 'sadece sen biliyorsun' },
  { id: 'm3', text: 'Seni çok seviyorum', sub: 'kalbimin derinliklerinden' },
  { id: 'm4', text: 'Yanında olmak yeter', sub: 'başka hiçbir şeye gerek yok' },
  { id: 'm5', text: 'Bir ömür yetmez', sub: 'hep daha fazlasını isterim' },
]
function loadMessages() {
  try {
    const s = localStorage.getItem(LS_MESSAGES_KEY)
    const a = s ? JSON.parse(s) : null
    return Array.isArray(a) && a.length > 0 ? a : DEFAULT_MESSAGES
  } catch { return DEFAULT_MESSAGES }
}
function getPhotoSrc(p) { return p?.src || p?.url || p?.dataUrl || '' }

const CSS = `
@keyframes eqBar {
  0%,100% { height: 30%; }
  50%      { height: 100%; }
}
@keyframes tickerScroll {
  0%   { transform: translateX(-110%); }
  100% { transform: translateX(110vw); }
}
@keyframes floatUp {
  0%   { opacity: 0.6; transform: translateY(0) scale(1); }
  100% { opacity: 0;   transform: translateY(-60px) scale(1.2); }
}
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
* { -webkit-tap-highlight-color: transparent; }
`

const TICKER_WORDS = [
  'her zaman böyle mutlu olalım', '✦', 'seninle her an güzel',
  '✦', 'bir ömrü yeter', '✦', 'dünya senin için döner', '✦',
]

// ─── Avatar ring ──────────────────────────────────────────────────────────────
function AvatarRing() {
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
      style={{ border: '2px solid rgba(212,160,122,0.5)', padding: 1 }}>
      <img src="/assets/couple.jpg" alt="" className="w-full h-full object-cover rounded-full" />
    </div>
  )
}

// ─── Hero slide ───────────────────────────────────────────────────────────────
function HeroSlide({ coverTitle, visible }) {
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={false}
      animate={{ x: visible ? 0 : '-100%', opacity: visible ? 1 : 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
    >
      <img src="/assets/couple.jpg" alt="kapak"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.5) saturate(1.2)' }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/35 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 text-center"
        style={{ paddingBottom: 'calc(88px + env(safe-area-inset-bottom,0px))' }}>
        <motion.p
          className="text-white/38 text-[11px] font-sans font-medium tracking-[0.22em] uppercase mb-6"
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -12 }}
          transition={{ delay: 0.4 }}>
          {coverTitle}
        </motion.p>

        <motion.h1
          className="font-display font-bold text-white leading-tight mb-5"
          style={{ fontSize: 'clamp(1.9rem,7.5vw,2.8rem)', textShadow: '0 4px 36px rgba(0,0,0,0.75)' }}
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 30 }}
          transition={{ delay: 0.6, duration: 0.8 }}>
          Dünya yıkılsa da<br />
          <span style={{
            background: 'linear-gradient(135deg,#f9d4a8 0%,#f4b8cc 50%,#d4b4f5 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            biz ayrılamayız
          </span>
        </motion.h1>

        <motion.div className="w-16 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)' }}
          initial={{ scaleX: 0 }} animate={{ scaleX: visible ? 1 : 0 }} transition={{ delay: 1.2 }} />
      </div>

      {/* Romantic ticker */}
      <div className="absolute z-20 overflow-hidden pointer-events-none w-full"
        style={{ bottom: 'calc(92px + env(safe-area-inset-bottom,0px))' }}>
        {[0, 1].map(i => (
          <div key={i} className="absolute top-0 flex items-center whitespace-nowrap"
            style={{ gap: 28, animation: `tickerScroll ${20 + i * 10}s ${i * 10}s linear infinite` }}>
            {TICKER_WORDS.map((w, j) => (
              <span key={j} className="font-display italic select-none"
                style={{
                  fontSize: 12, letterSpacing: '0.06em',
                  color: w === '✦' ? 'rgba(244,184,204,0.55)' : 'rgba(255,255,255,0.3)',
                }}>{w}</span>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Photo slide ──────────────────────────────────────────────────────────────
function PhotoSlide({ photo, visible, direction }) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tapHearts, setTapHearts] = useState([])
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

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-4"
      style={{ background: '#0c0b12', paddingBottom: 'calc(88px + env(safe-area-inset-bottom,0px))' }}
      initial={{ x: direction > 0 ? '100%' : '-100%', opacity: 0 }}
      animate={{ x: visible ? 0 : direction > 0 ? '-100%' : '100%', opacity: visible ? 1 : 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
    >
      <motion.div
        className="w-full rounded-3xl overflow-hidden"
        style={{
          maxWidth: 'min(calc(100vw - 32px), 380px)',
          background: '#161520',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <AvatarRing />
          <div className="flex-1 min-w-0">
            <p className="text-white/90 text-sm font-semibold leading-none mb-0.5">Hazar &amp; Eda</p>
            {photo.date && <p className="text-white/35 text-xs font-sans">{photo.date}</p>}
          </div>
        </div>

        {/* Photo */}
        <div className="relative overflow-hidden cursor-pointer select-none" style={{ aspectRatio: '1/1' }}
          onClick={handleDoubleTap} onTouchEnd={handleDoubleTap}>
          {src
            ? <img src={src} alt={photo.caption || 'anı'} className="w-full h-full object-cover" draggable={false} />
            : <div className="w-full h-full bg-white/4 flex items-center justify-center">
                <span className="text-white/20 text-sm font-sans">Fotoğraf yok</span>
              </div>}

          <AnimatePresence>
            {tapHearts.map(h => (
              <motion.div key={h.id} className="absolute pointer-events-none select-none"
                style={{ left: h.cx - 30, top: h.cy - 30 }}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: [0, 1.6, 1.2], opacity: [1, 1, 0], y: -60 }}
                transition={{ duration: 1 }}>
                <Heart size={60} fill="#e84393" color="#e84393" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="px-4 pt-3 pb-4">
          <div className="flex items-center justify-between mb-2">
            <motion.button onClick={() => setLiked(l => !l)} whileTap={{ scale: 1.3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12 }}>
              <Heart size={24} fill={liked ? '#e84393' : 'none'}
                color={liked ? '#e84393' : 'rgba(255,255,255,0.7)'} />
            </motion.button>
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
    </motion.div>
  )
}

// ─── Love slide — enters from bottom ─────────────────────────────────────────
const LOVE_DECORATIONS = ['✦', '◈', '❋', '⟡', '✧']
function LoveSlide({ msg, visible }) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-5"
      style={{
        background: 'linear-gradient(160deg,#0e0c1a 0%,#150d1e 50%,#0c0b12 100%)',
        paddingBottom: 'calc(88px + env(safe-area-inset-bottom,0px))',
      }}
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: visible ? 0 : '100%', opacity: visible ? 1 : 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 32 }}
    >
      {/* Decorative glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute rounded-full" style={{
          width: 200, height: 200, top: '15%', left: '20%',
          background: 'radial-gradient(circle,rgba(212,160,122,0.08) 0%,transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div className="absolute rounded-full" style={{
          width: 160, height: 160, bottom: '20%', right: '15%',
          background: 'radial-gradient(circle,rgba(200,150,240,0.08) 0%,transparent 70%)',
          filter: 'blur(40px)',
        }} />
      </div>

      <motion.div
        className="w-full rounded-3xl px-7 py-10 text-center relative"
        style={{
          maxWidth: 'min(calc(100vw - 40px), 360px)',
          background: 'rgba(22,21,32,0.9)',
          border: '1px solid rgba(212,160,122,0.12)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px)',
        }}
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: visible ? 1 : 0.9, opacity: visible ? 1 : 0, y: visible ? 0 : 30 }}
        transition={{ delay: 0.12, duration: 0.45, ease: 'easeOut' }}
      >
        {/* Top decoration */}
        <motion.div className="flex justify-center gap-3 mb-6"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          {LOVE_DECORATIONS.map((d, i) => (
            <span key={i} className="text-xs select-none"
              style={{
                color: i === 2 ? 'rgba(244,184,204,0.7)' : 'rgba(212,160,122,0.4)',
                fontSize: i === 2 ? 16 : 11,
                animation: `floatUp ${2.5 + i * 0.4}s ${i * 0.3}s ease-in-out infinite`,
              }}>{d}</span>
          ))}
        </motion.div>

        {/* Icon */}
        <motion.div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{
            background: 'linear-gradient(135deg,rgba(212,160,122,0.15),rgba(200,170,240,0.1))',
            border: '1px solid rgba(212,160,122,0.18)',
            boxShadow: '0 0 20px rgba(212,160,122,0.08)',
          }}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.25, type: 'spring' }}>
          <Heart size={20} fill="rgba(212,160,122,0.85)" color="rgba(212,160,122,0.85)" />
        </motion.div>

        {/* Quote */}
        <motion.p
          className="font-display italic text-white/88 leading-relaxed mb-5"
          style={{ fontSize: 'clamp(1.15rem,5vw,1.4rem)', textShadow: '0 0 40px rgba(212,160,122,0.12)' }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          &ldquo;{msg.text}&rdquo;
        </motion.p>

        <motion.div className="w-12 h-px mx-auto mb-4"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(212,160,122,0.45),transparent)' }}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5 }} />

        <motion.p className="text-white/32 text-xs font-sans tracking-[0.18em] uppercase"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          {msg.sub}
        </motion.p>

        {/* Bottom sparkle */}
        <motion.div className="flex justify-center gap-2 mt-5"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          {[Sparkles, Star, Infinity].map((Icon, i) => (
            <Icon key={i} size={12} style={{ color: 'rgba(212,160,122,0.3)', marginTop: i === 1 ? -1 : 0 }} />
          ))}
        </motion.div>
      </motion.div>

      {/* Swipe up hint */}
      <motion.div className="absolute flex flex-col items-center gap-1 pointer-events-none"
        style={{ bottom: 'calc(96px + env(safe-area-inset-bottom,0px))' }}
        animate={{ y: [0, -4, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
        <ChevronLeft size={14} className="rotate-90" style={{ color: 'rgba(255,255,255,0.18)' }} />
        <span className="text-white/15 text-[10px] font-sans tracking-widest uppercase">yukarı</span>
      </motion.div>
    </motion.div>
  )
}

// ─── Music bar ────────────────────────────────────────────────────────────────
function MusicControl({ playing, currentTrack, onToggle, onNext }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom,0px)' }}>
      <div style={{
        background: 'rgba(6,5,14,0.95)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
      }}>
        {/* Track tabs */}
        <div className="flex">
          {TRACKS.map((t, i) => (
            <button key={i}
              className="flex-1 flex items-center justify-center py-2 transition-colors"
              style={{ borderBottom: i === currentTrack ? '2px solid rgba(212,160,122,0.8)' : '2px solid transparent' }}
              onClick={() => onNext(i)}>
              <span className="text-[11px] font-sans font-medium whitespace-nowrap leading-none"
                style={{ color: i === currentTrack ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.28)' }}>
                {t.title}
              </span>
            </button>
          ))}
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-center gap-6 py-2.5">
          <Music2 size={13} style={{ color: playing ? 'rgba(212,160,122,0.7)' : 'rgba(255,255,255,0.18)' }} />

          <motion.button
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: playing
                ? 'linear-gradient(135deg,rgba(212,160,122,0.25),rgba(200,180,232,0.18))'
                : 'rgba(255,255,255,0.08)',
              border: playing ? '1px solid rgba(212,160,122,0.3)' : '1px solid rgba(255,255,255,0.07)',
            }}
            onClick={onToggle} whileTap={{ scale: 0.88 }}>
            {playing
              ? <div className="flex items-end justify-center gap-0.5" style={{ height: 14, width: 14 }}>
                  {[1,2,3].map(j => (
                    <div key={j} className="w-0.5 rounded-full"
                      style={{ background: 'rgba(212,160,122,0.95)', animation: `eqBar 0.65s ${j*0.15}s ease-in-out infinite` }} />
                  ))}
                </div>
              : <Play size={13} fill="rgba(255,255,255,0.75)" color="rgba(255,255,255,0.75)" style={{ marginLeft: 1 }} />}
          </motion.button>

          <motion.button onClick={() => onNext((currentTrack + 1) % TRACKS.length)} whileTap={{ scale: 0.88 }}>
            <SkipForward size={14} style={{ color: 'rgba(255,255,255,0.32)' }} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

// ─── Navigation indicator ─────────────────────────────────────────────────────
function NavIndicator({ total, col, row }) {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 pointer-events-none"
      style={{ bottom: 'calc(88px + env(safe-area-inset-bottom,0px) + 8px)' }}>
      {/* Horizontal dots */}
      <div className="flex gap-1.5">
        {Array.from({ length: Math.min(total, 9) }).map((_, i) => (
          <div key={i} className="rounded-full transition-all duration-300"
            style={{
              width: i === col ? 14 : 4, height: 4,
              background: i === col
                ? (row === 1 ? 'rgba(200,170,240,0.85)' : 'rgba(212,160,122,0.85)')
                : 'rgba(255,255,255,0.18)',
            }} />
        ))}
      </div>
      {/* Row indicator */}
      {total > 1 && (
        <div className="flex gap-1">
          {[0, 1].map(r => (
            <div key={r} className="rounded-full transition-all duration-300"
              style={{
                width: 4, height: r === row ? 10 : 4,
                background: r === row ? 'rgba(200,180,220,0.6)' : 'rgba(255,255,255,0.12)',
              }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Swipe hint ───────────────────────────────────────────────────────────────
function SwipeHint() {
  return (
    <motion.div className="absolute inset-0 z-50 flex items-end justify-center pointer-events-none"
      style={{ paddingBottom: 'calc(104px + env(safe-area-inset-bottom,0px))' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ delay: 0.8, duration: 0.5 }}>
      <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl"
        style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
        <ChevronRight size={13} className="text-white/60" />
        <span className="text-white/55 text-xs font-sans font-medium">Sola kaydır</span>
      </div>
    </motion.div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MemoryUniverse() {
  const { state, dispatch } = useAppState()
  const photos = state.photos || []
  const LOVE_MESSAGES = loadMessages()

  // 2D navigation: col = which photo (0=hero, 1+=photos), row = 0|1
  const [col, setCol] = useState(0)
  const [row, setRow] = useState(0)
  const [prevCol, setPrevCol] = useState(0)
  const [dir, setDir] = useState(1)          // 1=moving right, -1=moving left
  const [showHint, setShowHint] = useState(true)

  const [musicPlaying, setMusicPlaying] = useState(false)
  const [trackEnded, setTrackEnded] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const audioRef = useRef(null)
  const interacted = useRef(false)
  const touchStart = useRef(null)
  const animating = useRef(false)

  const coverTitle = localStorage.getItem(LS_TITLE_KEY) || 'Özelimiz'
  const totalCols = 1 + photos.length // hero + all photos

  // hide hint after swipe or 4s
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 4000)
    return () => clearTimeout(t)
  }, [])

  // Music autoplay
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
      interacted.current = true; clearTimeout(t)
      audio.play().then(() => setMusicPlaying(true)).catch(() => {})
    }
    document.addEventListener('touchstart', onFirst, { once: true })
    document.addEventListener('click', onFirst, { once: true })
    return () => {
      audio.removeEventListener('ended', onEnded); clearTimeout(t)
      document.removeEventListener('touchstart', onFirst)
      document.removeEventListener('click', onFirst)
    }
  }, [])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current; if (!audio) return
    interacted.current = true
    if (musicPlaying) { audio.pause(); setMusicPlaying(false) }
    else {
      if (trackEnded) { audio.currentTime = 0; setTrackEnded(false) }
      audio.play().then(() => setMusicPlaying(true)).catch(() => {})
    }
  }, [musicPlaying, trackEnded])

  const selectTrack = useCallback((i) => {
    const audio = audioRef.current; if (!audio) return
    setCurrentTrack(i); setTrackEnded(false)
    audio.src = TRACKS[i].src; audio.load()
    if (musicPlaying) audio.play().catch(() => {})
  }, [musicPlaying])

  const navigate = useCallback((dCol, dRow) => {
    if (animating.current) return
    animating.current = true
    setTimeout(() => { animating.current = false }, 380)

    if (dRow !== 0) {
      // vertical nav (only when on a photo slide, not hero)
      if (col === 0) return
      const newRow = Math.max(0, Math.min(1, row + dRow))
      if (newRow !== row) setRow(newRow)
      return
    }
    if (dCol !== 0) {
      setShowHint(false)
      const newCol = Math.max(0, Math.min(totalCols - 1, col + dCol))
      if (newCol !== col) {
        setPrevCol(col)
        setDir(dCol)
        setCol(newCol)
        // when moving cols while on love row, stay on love row
      }
    }
  }, [col, row, totalCols])

  // Touch handlers
  const onTouchStart = useCallback((e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }, [])

  const onTouchEnd = useCallback((e) => {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    touchStart.current = null
    const absDx = Math.abs(dx), absDy = Math.abs(dy)
    const threshold = 40
    if (absDx < threshold && absDy < threshold) return
    if (absDx > absDy) {
      if (dx < -threshold) navigate(1, 0)
      else if (dx > threshold) navigate(-1, 0)
    } else {
      if (dy < -threshold) navigate(0, 1)  // swipe up → love
      else if (dy > threshold) navigate(0, -1) // swipe down → photo
    }
  }, [navigate])

  const handleLogout = useCallback(() => {
    const audio = audioRef.current
    if (audio) { audio.pause(); audio.currentTime = 0 }
    dispatch({ type: 'RESET_TO_INTRO' })
  }, [dispatch])

  const currentPhoto = col > 0 ? photos[col - 1] : null
  const loveMsg = col > 0
    ? LOVE_MESSAGES[(col - 1) % LOVE_MESSAGES.length]
    : null

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#0c0b12' }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <style>{CSS}</style>
      <audio ref={audioRef} src={TRACKS[0].src} preload="metadata" />

      {/* Render all slides — hero always, current photo, current love */}
      <HeroSlide coverTitle={coverTitle} visible={col === 0 && row === 0} />

      {photos.map((photo, i) => {
        const c = i + 1
        const isVisible = col === c && row === 0
        const slideDir = dir
        return (
          <PhotoSlide key={photo.id || i} photo={photo}
            visible={isVisible} direction={slideDir} />
        )
      })}

      {loveMsg && (
        <LoveSlide msg={loveMsg} visible={row === 1} />
      )}

      {/* Top-left back */}
      <motion.button
        className="absolute top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-2 rounded-2xl"
        style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
        onClick={handleLogout}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        whileTap={{ scale: 0.92 }}>
        <ChevronLeft size={14} className="text-white/50" />
        <span className="text-white/45 text-xs font-sans font-medium">Çıkış</span>
      </motion.button>

      <AnimatePresence>{showHint && col === 0 && <SwipeHint />}</AnimatePresence>

      <NavIndicator total={totalCols} col={col} row={row} />

      <MusicControl
        playing={musicPlaying} trackEnded={trackEnded}
        currentTrack={currentTrack} onToggle={toggleMusic} onNext={selectTrack} />

      <HeartEmitter />
    </div>
  )
}
