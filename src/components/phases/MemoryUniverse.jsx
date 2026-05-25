import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Bookmark, Play, SkipForward,
  Music2, ChevronLeft, Sparkles, Star,
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
const DEFAULT_MSGS = [
  { id: 'm1', text: 'Seninle her an güzel', sub: 'her zaman, her yerde' },
  { id: 'm2', text: 'Dünyanın en tatlı insanısın', sub: 'sadece sen biliyorsun' },
  { id: 'm3', text: 'Seni çok seviyorum', sub: 'kalbimin derinliklerinden' },
  { id: 'm4', text: 'Yanında olmak yeter', sub: 'başka hiçbir şeye gerek yok' },
  { id: 'm5', text: 'Bir ömür yetmez', sub: 'hep daha fazlasını isterim' },
]
function loadMsgs() {
  try {
    const s = localStorage.getItem(LS_MESSAGES_KEY)
    const a = s ? JSON.parse(s) : null
    return Array.isArray(a) && a.length > 0 ? a : DEFAULT_MSGS
  } catch { return DEFAULT_MSGS }
}
function getSrc(p) { return p?.src || p?.url || p?.dataUrl || '' }

// ─────────────────────────────────────────────────────────────────────────────
// CSS injected once
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
* { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
@keyframes eq { 0%,100%{height:30%} 50%{height:100%} }
@keyframes ticker {
  0%   { transform: translateX(-120%); }
  100% { transform: translateX(120vw); }
}
@keyframes twinkle {
  0%,100%{ opacity:0.15; transform: scale(1); }
  50%    { opacity:0.6;  transform: scale(1.3); }
}
@keyframes drift {
  0%   { transform: translateY(0) translateX(0); }
  33%  { transform: translateY(-8px) translateX(4px); }
  66%  { transform: translateY(4px) translateX(-5px); }
  100% { transform: translateY(0) translateX(0); }
}
@keyframes pulseGlow {
  0%,100%{ box-shadow: 0 0 20px rgba(212,160,122,0.08); }
  50%    { box-shadow: 0 0 50px rgba(212,160,122,0.18), 0 0 80px rgba(200,160,240,0.1); }
}
@keyframes shimmerText {
  0%  { background-position: -200% center; }
  100%{ background-position: 200% center; }
}
@keyframes floatHeart {
  0%  { opacity:0.7; transform: translateY(0) scale(1) rotate(-5deg); }
  100%{ opacity:0;   transform: translateY(-45px) scale(1.15) rotate(5deg); }
}
`

// ─── Star background (CSS only, zero JS overhead) ────────────────────────────
const STARS = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  size: 1 + Math.random() * 2,
  top: Math.random() * 100,
  left: Math.random() * 100,
  dur: 2.5 + Math.random() * 3,
  del: Math.random() * 4,
}))
function StarBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {STARS.map(s => (
        <div key={s.id} className="absolute rounded-full"
          style={{
            width: s.size, height: s.size,
            top: `${s.top}%`, left: `${s.left}%`,
            background: '#fff',
            animation: `twinkle ${s.dur}s ${s.del}s ease-in-out infinite`,
          }} />
      ))}
    </div>
  )
}

const TICKER_WORDS = [
  'her zaman böyle mutlu olalım', '✦', 'seninle her an güzel',
  '✦', 'bir ömrü yeter', '✦', 'dünya senin için döner', '✦',
]

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSlide({ title }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <img src="/assets/couple.jpg" alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.48) saturate(1.2)' }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/10 to-black/32 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 text-center"
        style={{ paddingBottom: 'calc(86px + env(safe-area-inset-bottom,0px))' }}>

        <motion.p className="text-white/35 text-[11px] font-sans font-medium tracking-[0.24em] uppercase mb-6"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          {title}
        </motion.p>

        <motion.h1 className="font-display font-bold text-white leading-tight mb-5"
          style={{ fontSize: 'clamp(1.85rem,7vw,2.75rem)', textShadow: '0 4px 40px rgba(0,0,0,0.8)' }}
          initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.22,1,0.36,1] }}>
          Dünya yıkılsa da<br />
          <span style={{
            background: 'linear-gradient(120deg,#f9d4a8,#f4b8cc,#c8b4f5,#f4b8cc,#f9d4a8)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'shimmerText 4s linear infinite',
          }}>biz ayrılamayız</span>
        </motion.h1>

        <motion.div className="w-16 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)' }}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.1 }} />
      </div>

      {/* Ticker */}
      <div className="absolute overflow-hidden pointer-events-none w-full"
        style={{ bottom: 'calc(90px + env(safe-area-inset-bottom,0px))' }}>
        {[0, 1].map(i => (
          <div key={i} className="absolute top-0 whitespace-nowrap flex items-center"
            style={{ gap: 28, animation: `ticker ${22 + i * 11}s ${i * 11}s linear infinite` }}>
            {TICKER_WORDS.map((w, j) => (
              <span key={j} className="font-display italic select-none"
                style={{
                  fontSize: 12, letterSpacing: '0.05em',
                  color: w === '✦' ? 'rgba(244,184,204,0.5)' : 'rgba(255,255,255,0.28)',
                }}>{w}</span>
            ))}
          </div>
        ))}
      </div>

      {/* swipe hint */}
      <motion.div className="absolute right-5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 pointer-events-none"
        animate={{ x: [0, 6, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>
        <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom,transparent,rgba(255,255,255,0.3),transparent)' }} />
        <span className="text-white/25 text-[9px] font-sans tracking-widest uppercase" style={{ writingMode: 'vertical-rl' }}>kaydır</span>
      </motion.div>
    </div>
  )
}

// ─── Photo card ───────────────────────────────────────────────────────────────
function PhotoCard({ photo }) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tapH, setTapH] = useState([])
  const lastTap = useRef(0)
  const src = getSrc(photo)

  const doubleTap = useCallback((e) => {
    const now = Date.now()
    if (now - lastTap.current < 350) {
      setLiked(true)
      const rect = e.currentTarget.getBoundingClientRect()
      const cx = (e.changedTouches?.[0]?.clientX ?? e.clientX) - rect.left
      const cy = (e.changedTouches?.[0]?.clientY ?? e.clientY) - rect.top
      const id = now
      setTapH(h => [...h, { id, cx, cy }])
      setTimeout(() => setTapH(h => h.filter(x => x.id !== id)), 1100)
    }
    lastTap.current = now
  }, [])

  return (
    <motion.div className="w-full rounded-3xl overflow-hidden"
      style={{
        maxWidth: 'min(calc(100vw - 32px), 380px)',
        background: 'rgba(22,21,32,0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
        animation: 'pulseGlow 4s ease-in-out infinite',
      }}
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.38, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
          style={{ border: '2px solid rgba(212,160,122,0.45)', padding: 1 }}>
          <img src="/assets/couple.jpg" alt="" className="w-full h-full object-cover rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/88 text-sm font-semibold leading-none mb-0.5">Hazar &amp; Eda</p>
          {photo.date && <p className="text-white/30 text-xs font-sans">{photo.date}</p>}
        </div>
        <Sparkles size={13} style={{ color: 'rgba(212,160,122,0.4)' }} />
      </div>

      {/* Image */}
      <div className="relative overflow-hidden select-none cursor-pointer"
        style={{ aspectRatio: '1/1' }}
        onClick={doubleTap} onTouchEnd={doubleTap}>
        {src
          ? <img src={src} alt={photo.caption || 'anı'} className="w-full h-full object-cover" draggable={false} />
          : <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-white/20 text-sm">Fotoğraf yok</span>
            </div>}

        {/* Double-tap hearts */}
        <AnimatePresence>
          {tapH.map(h => (
            <motion.div key={h.id} className="absolute pointer-events-none"
              style={{ left: h.cx - 28, top: h.cy - 28 }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0,1.5,1.1], opacity: [1,1,0], y: -55 }}
              transition={{ duration: 0.95 }}>
              <Heart size={56} fill="#e84393" color="#e84393"
                style={{ filter: 'drop-shadow(0 0 12px #e84393aa)' }} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Actions + caption */}
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-3">
            <motion.button onClick={() => setLiked(l => !l)} whileTap={{ scale: 1.35 }}
              transition={{ type: 'spring', stiffness: 380, damping: 14 }}>
              <Heart size={23} fill={liked ? '#e84393' : 'none'}
                color={liked ? '#e84393' : 'rgba(255,255,255,0.65)'}
                style={liked ? { filter: 'drop-shadow(0 0 8px #e84393aa)' } : {}} />
            </motion.button>
          </div>
          <motion.button onClick={() => setSaved(s => !s)} whileTap={{ scale: 1.2 }}>
            <Bookmark size={21}
              fill={saved ? 'rgba(212,160,122,0.9)' : 'none'}
              color={saved ? 'rgba(212,160,122,0.9)' : 'rgba(255,255,255,0.4)'} />
          </motion.button>
        </div>
        {photo.caption && (
          <p className="text-white/72 text-sm font-sans leading-relaxed">
            <span className="text-white/88 font-semibold mr-1.5">hazar</span>
            {photo.caption}
          </p>
        )}
      </div>
    </motion.div>
  )
}

// ─── Photo slide wrapper ──────────────────────────────────────────────────────
function PhotoSlide({ photo, xOff }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-4"
      style={{
        background: '#0c0b12',
        paddingBottom: 'calc(86px + env(safe-area-inset-bottom,0px))',
        transform: `translateX(${xOff * 100}%)`,
        transition: 'transform 0.38s cubic-bezier(0.22,1,0.36,1)',
        willChange: 'transform',
      }}>
      <PhotoCard photo={photo} />
    </div>
  )
}

// ─── Love slide ───────────────────────────────────────────────────────────────
const LOVE_ICONS = ['✦', '◈', '❋', '✧', '⟡']
function LoveSlide({ msgs, idx, visible }) {
  const msg = msgs[idx % msgs.length]
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center px-5"
      style={{
        background: 'linear-gradient(155deg,#0f0c1e 0%,#160d22 45%,#0c0b14 100%)',
        paddingBottom: 'calc(86px + env(safe-area-inset-bottom,0px))',
        zIndex: 10,
      }}
      initial={{ y: '100%' }}
      animate={{ y: visible ? '0%' : '100%' }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}>

      <StarBg />

      {/* Glow orbs */}
      <div className="absolute pointer-events-none" style={{ inset: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: 220, height: 220,
          top: '10%', left: '8%',
          background: 'radial-gradient(circle,rgba(212,160,122,0.07) 0%,transparent 70%)',
          filter: 'blur(45px)',
          animation: 'drift 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 180, height: 180,
          bottom: '15%', right: '5%',
          background: 'radial-gradient(circle,rgba(180,140,240,0.07) 0%,transparent 70%)',
          filter: 'blur(40px)',
          animation: 'drift 10s 2s ease-in-out infinite',
        }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={msg.id}
          className="w-full rounded-3xl px-7 py-10 text-center relative"
          style={{
            maxWidth: 'min(calc(100vw - 40px), 360px)',
            background: 'rgba(20,18,30,0.92)',
            border: '1px solid rgba(212,160,122,0.1)',
            boxShadow: '0 28px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.035)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            animation: 'pulseGlow 5s ease-in-out infinite',
          }}
          initial={{ opacity: 0, y: 22, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, scale: 0.96 }}
          transition={{ duration: 0.4, ease: [0.22,1,0.36,1] }}>

          {/* Floating decorations */}
          <div className="flex justify-center gap-3 mb-5">
            {LOVE_ICONS.map((d, i) => (
              <span key={i} className="select-none"
                style={{
                  fontSize: i === 2 ? 17 : 11,
                  color: i === 2 ? 'rgba(244,184,204,0.65)' : 'rgba(212,160,122,0.35)',
                  animation: `drift ${3 + i * 0.6}s ${i * 0.4}s ease-in-out infinite`,
                  display: 'inline-block',
                }}>{d}</span>
            ))}
          </div>

          {/* Heart icon */}
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{
              background: 'linear-gradient(135deg,rgba(212,160,122,0.14),rgba(200,160,240,0.09))',
              border: '1px solid rgba(212,160,122,0.16)',
            }}>
            <Heart size={19} fill="rgba(212,160,122,0.82)" color="rgba(212,160,122,0.82)" />
          </div>

          {/* Quote */}
          <p className="font-display italic text-white/86 leading-relaxed mb-5"
            style={{
              fontSize: 'clamp(1.1rem,4.8vw,1.35rem)',
              textShadow: '0 0 40px rgba(212,160,122,0.1)',
            }}>
            &ldquo;{msg.text}&rdquo;
          </p>

          <div className="w-12 h-px mx-auto mb-4"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(212,160,122,0.4),transparent)' }} />

          <p className="text-white/28 text-[11px] font-sans tracking-[0.2em] uppercase">{msg.sub}</p>

          {/* Shimmer bar */}
          <div className="w-full h-px mt-6 rounded-full" style={{
            background: 'linear-gradient(90deg,transparent,rgba(212,160,122,0.2),rgba(200,160,240,0.18),rgba(212,160,122,0.2),transparent)',
            backgroundSize: '200% auto',
            animation: 'shimmerText 3s linear infinite',
          }} />
        </motion.div>
      </AnimatePresence>

      {/* msg counter */}
      {msgs.length > 1 && (
        <div className="absolute flex gap-1.5 pointer-events-none"
          style={{ bottom: 'calc(92px + env(safe-area-inset-bottom,0px))' }}>
          {msgs.map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-300"
              style={{
                width: i === idx % msgs.length ? 14 : 4, height: 4,
                background: i === idx % msgs.length ? 'rgba(200,170,240,0.8)' : 'rgba(255,255,255,0.15)',
              }} />
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ─── Music bar ────────────────────────────────────────────────────────────────
function MusicBar({ playing, track, onToggle, onNext }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom,0px)' }}>
      <div style={{
        background: 'rgba(5,4,12,0.96)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
      }}>
        <div className="flex">
          {TRACKS.map((t, i) => (
            <button key={i} onClick={() => onNext(i)}
              className="flex-1 flex items-center justify-center transition-colors"
              style={{
                paddingTop: 8, paddingBottom: 6,
                borderBottom: i === track ? '2px solid rgba(212,160,122,0.75)' : '2px solid transparent',
              }}>
              <span className="text-[11px] font-sans font-medium whitespace-nowrap"
                style={{ color: i === track ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.25)' }}>
                {t.title}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-center gap-6" style={{ paddingTop: 8, paddingBottom: 10 }}>
          <Music2 size={13} style={{ color: playing ? 'rgba(212,160,122,0.65)' : 'rgba(255,255,255,0.16)' }} />
          <motion.button
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{
              width: 36, height: 36,
              background: playing ? 'linear-gradient(135deg,rgba(212,160,122,0.22),rgba(200,165,240,0.15))' : 'rgba(255,255,255,0.07)',
              border: playing ? '1px solid rgba(212,160,122,0.28)' : '1px solid rgba(255,255,255,0.06)',
            }}
            onClick={onToggle} whileTap={{ scale: 0.86 }}>
            {playing
              ? <div className="flex items-end justify-center gap-0.5" style={{ width: 13, height: 13 }}>
                  {[0,1,2].map(j => (
                    <div key={j} className="w-0.5 rounded-full"
                      style={{ background: 'rgba(212,160,122,0.9)', animation: `eq 0.62s ${j*0.14}s ease-in-out infinite` }} />
                  ))}
                </div>
              : <Play size={12} fill="rgba(255,255,255,0.72)" color="rgba(255,255,255,0.72)" style={{ marginLeft: 1 }} />}
          </motion.button>
          <motion.button onClick={() => onNext((track + 1) % TRACKS.length)} whileTap={{ scale: 0.86 }}>
            <SkipForward size={14} style={{ color: 'rgba(255,255,255,0.28)' }} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

// ─── Dots ─────────────────────────────────────────────────────────────────────
function Dots({ total, col, row }) {
  const n = Math.min(total, 9)
  return (
    <div className="absolute left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 pointer-events-none"
      style={{ bottom: 'calc(86px + env(safe-area-inset-bottom,0px) + 6px)' }}>
      <div className="flex gap-1.5">
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className="rounded-full transition-all duration-250"
            style={{
              width: i === col ? 13 : 4, height: 4,
              background: i === col
                ? (row === 1 ? 'rgba(200,168,242,0.85)' : 'rgba(212,160,122,0.85)')
                : 'rgba(255,255,255,0.16)',
            }} />
        ))}
      </div>
      <div className="flex gap-1">
        {[0, 1].map(r => (
          <div key={r} className="rounded-full transition-all duration-250"
            style={{ width: 4, height: r === row ? 11 : 4, background: r === row ? 'rgba(190,165,235,0.55)' : 'rgba(255,255,255,0.1)' }} />
        ))}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MemoryUniverse() {
  const { state, dispatch } = useAppState()
  const photos = state.photos || []
  const MSGS = useMemo(loadMsgs, [])

  const [col, setCol] = useState(0)   // 0=hero, 1..N = photos
  const [row, setRow] = useState(0)   // 0=photo/hero, 1=love
  const [loveIdx, setLoveIdx] = useState(0) // which love message in row 1
  const [dir, setDir] = useState(1)

  const [hint, setHint] = useState(true)
  const [music, setMusic] = useState(false)
  const [ended, setEnded] = useState(false)
  const [track, setTrack] = useState(0)

  const audioRef = useRef(null)
  const touched = useRef(false)
  const ts = useRef(null)  // touch start
  const busy = useRef(false)

  const coverTitle = localStorage.getItem(LS_TITLE_KEY) || 'Özelimiz'
  const totalCols = 1 + photos.length

  useEffect(() => {
    const t = setTimeout(() => setHint(false), 4200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const audio = audioRef.current; if (!audio) return
    const onEnd = () => { setMusic(false); setEnded(true) }
    audio.addEventListener('ended', onEnd)
    const autoPlay = setTimeout(() => {
      if (touched.current) return
      audio.play().then(() => { setMusic(true); touched.current = true }).catch(() => {})
    }, 2600)
    const first = () => {
      if (touched.current) return
      touched.current = true; clearTimeout(autoPlay)
      audio.play().then(() => setMusic(true)).catch(() => {})
    }
    document.addEventListener('touchstart', first, { once: true })
    document.addEventListener('click', first, { once: true })
    return () => {
      audio.removeEventListener('ended', onEnd); clearTimeout(autoPlay)
      document.removeEventListener('touchstart', first)
      document.removeEventListener('click', first)
    }
  }, [])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current; if (!audio) return
    touched.current = true
    if (music) { audio.pause(); setMusic(false) }
    else {
      if (ended) { audio.currentTime = 0; setEnded(false) }
      audio.play().then(() => setMusic(true)).catch(() => {})
    }
  }, [music, ended])

  const pickTrack = useCallback((i) => {
    const audio = audioRef.current; if (!audio) return
    setTrack(i); setEnded(false)
    audio.src = TRACKS[i].src; audio.load()
    if (music) audio.play().catch(() => {})
  }, [music])

  const go = useCallback((dc, dr) => {
    if (busy.current) return
    busy.current = true
    setTimeout(() => { busy.current = false }, 340)

    if (dr !== 0) {
      if (col === 0) return  // hero has no love row
      const nr = Math.max(0, Math.min(1, row + dr))
      if (nr !== row) {
        if (nr === 1) setLoveIdx(col - 1)  // tie love message to current photo index
        setRow(nr)
      }
      return
    }
    if (dc !== 0) {
      setHint(false)
      const nc = Math.max(0, Math.min(totalCols - 1, col + dc))
      if (nc !== col) { setDir(dc); setCol(nc) }
    }
  }, [col, row, totalCols])

  const onTouchStart = useCallback((e) => {
    ts.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }, [])

  const onTouchEnd = useCallback((e) => {
    if (!ts.current) return
    const dx = e.changedTouches[0].clientX - ts.current.x
    const dy = e.changedTouches[0].clientY - ts.current.y
    ts.current = null
    const ax = Math.abs(dx), ay = Math.abs(dy), thr = 42
    if (ax < thr && ay < thr) return
    if (ax > ay) { dx < 0 ? go(1, 0) : go(-1, 0) }
    else { dy < 0 ? go(0, 1) : go(0, -1) }
  }, [go])

  const logout = useCallback(() => {
    const audio = audioRef.current
    if (audio) { audio.pause(); audio.currentTime = 0 }
    dispatch({ type: 'RESET_TO_INTRO' })
  }, [dispatch])

  // Only render current + immediate neighbours for performance
  const visibleCols = useMemo(() => {
    const s = new Set()
    s.add(0)  // hero always
    for (let c = Math.max(1, col - 1); c <= Math.min(totalCols - 1, col + 1); c++) s.add(c)
    return s
  }, [col, totalCols])

  return (
    <div className="relative w-full h-full overflow-hidden touch-none"
      style={{ background: '#0c0b12' }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <style>{CSS}</style>
      <audio ref={audioRef} src={TRACKS[0].src} preload="metadata" />

      {/* ── Slides ── */}
      {/* Hero */}
      <div className="absolute inset-0 overflow-hidden"
        style={{
          transform: col === 0 ? 'translateX(0)' : `translateX(${-col * 100}%)`,
          transition: 'transform 0.38s cubic-bezier(0.22,1,0.36,1)',
          willChange: 'transform',
        }}>
        <HeroSlide title={coverTitle} />
      </div>

      {/* Photos */}
      {photos.map((photo, i) => {
        const c = i + 1
        if (!visibleCols.has(c)) return null
        return (
          <div key={photo.id || i} className="absolute inset-0 flex flex-col items-center justify-center px-4"
            style={{
              background: '#0c0b12',
              paddingBottom: 'calc(86px + env(safe-area-inset-bottom,0px))',
              transform: `translateX(${(c - col) * 100}%)`,
              transition: 'transform 0.38s cubic-bezier(0.22,1,0.36,1)',
              willChange: 'transform',
            }}>
            <PhotoCard photo={photo} />
          </div>
        )
      })}

      {/* Love row */}
      <LoveSlide msgs={MSGS} idx={loveIdx} visible={row === 1} />

      {/* Back btn */}
      <motion.button
        className="absolute top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-2 rounded-2xl"
        style={{ background: 'rgba(0,0,0,0.52)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
        onClick={logout}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
        whileTap={{ scale: 0.91 }}>
        <ChevronLeft size={14} className="text-white/48" />
        <span className="text-white/42 text-xs font-sans font-medium">Çıkış</span>
      </motion.button>

      {/* Swipe hint */}
      <AnimatePresence>
        {hint && col === 0 && (
          <motion.div className="absolute z-30 pointer-events-none flex items-center gap-2 px-4 py-2.5 rounded-2xl"
            style={{
              bottom: 'calc(100px + env(safe-area-inset-bottom,0px))',
              left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.58)', border: '1px solid rgba(255,255,255,0.09)',
              backdropFilter: 'blur(18px)',
            }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ delay: 0.9 }}>
            <Star size={11} style={{ color: 'rgba(212,160,122,0.6)' }} />
            <span className="text-white/52 text-xs font-sans">Fotoğraflar için sola kaydır</span>
            <ChevronLeft size={11} className="rotate-180" style={{ color: 'rgba(255,255,255,0.35)' }} />
          </motion.div>
        )}
      </AnimatePresence>

      <Dots total={totalCols} col={col} row={row} />

      <MusicBar playing={music} track={track} onToggle={toggleMusic} onNext={pickTrack} />

      <HeartEmitter />
    </div>
  )
}
