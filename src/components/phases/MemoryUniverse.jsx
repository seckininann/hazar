import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Bookmark, Play, SkipForward,
  Music2, ChevronLeft, Sparkles, Star,
} from 'lucide-react'
import { useAppState } from '../../store/appState.jsx'
import HeartEmitter from '../memory/HeartEmitter.jsx'

// ─── Constants ────────────────────────────────────────────────────────────────
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

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
*, *::before, *::after { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
html, body { overscroll-behavior: none; }
@keyframes eq       { 0%,100%{ height:30% } 50%{ height:100% } }
@keyframes ticker   { from{ transform:translateX(0) } to{ transform:translateX(-50%) } }
@keyframes twinkle  { 0%,100%{ opacity:.12; transform:scale(1) } 50%{ opacity:.55; transform:scale(1.4) } }
@keyframes drift    { 0%,100%{ transform:translate(0,0) } 33%{ transform:translate(4px,-8px) } 66%{ transform:translate(-5px,4px) } }
@keyframes shimmer  { 0%{ background-position:-200% center } 100%{ background-position:200% center } }
@keyframes glow     { 0%,100%{ box-shadow:0 0 20px rgba(212,160,122,.06) } 50%{ box-shadow:0 0 50px rgba(212,160,122,.16),0 0 80px rgba(200,140,240,.08) } }
@keyframes fadeup   { from{ opacity:0; transform:translateY(16px) } to{ opacity:1; transform:translateY(0) } }
`

// ─── Star background — pure CSS, zero JS ────────────────────────────────────
const STARS = Array.from({ length: 18 }, (_, i) => ({
  id: i, size: 1 + (i % 3) * 0.8,
  top: (i * 17 + 5) % 100, left: (i * 23 + 7) % 100,
  dur: 2.4 + (i % 5) * 0.6, del: (i % 7) * 0.5,
}))
function StarBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {STARS.map(s => (
        <div key={s.id} style={{
          position: 'absolute', borderRadius: '50%', background: '#fff',
          width: s.size, height: s.size,
          top: `${s.top}%`, left: `${s.left}%`,
          animation: `twinkle ${s.dur}s ${s.del}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  )
}

const TICKER = ['her zaman böyle mutlu olalım','✦','seninle her an güzel','✦','bir ömrü yeter','✦','dünya senin için döner','✦']

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSlide({ title }) {
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
      <img src="/assets/couple.jpg" alt=""
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'brightness(.48) saturate(1.2)' }} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,.88) 0%,rgba(0,0,0,.12) 55%,rgba(0,0,0,.32) 100%)', pointerEvents:'none' }} />

      <div style={{
        position:'relative', zIndex:1, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', height:'100%',
        paddingLeft:32, paddingRight:32, paddingBottom:90, textAlign:'center',
      }}>
        <motion.p style={{ color:'rgba(255,255,255,.34)', fontSize:11, fontFamily:'sans-serif', letterSpacing:'0.24em', textTransform:'uppercase', marginBottom:24 }}
          initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.45 }}>
          {title}
        </motion.p>

        <motion.h1 style={{ fontWeight:700, color:'#fff', lineHeight:1.2, marginBottom:20, fontSize:'clamp(1.85rem,7.5vw,2.8rem)', textShadow:'0 4px 40px rgba(0,0,0,.8)' }}
          initial={{ opacity:0, y:32 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:.6, duration:.85, ease:[.22,1,.36,1] }}>
          Dünya yıkılsa da<br />
          <span style={{
            background:'linear-gradient(120deg,#f9d4a8,#f4b8cc,#c8b4f5,#f4b8cc,#f9d4a8)',
            backgroundSize:'200% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            animation:'shimmer 4s linear infinite',
          }}>biz ayrılamayız</span>
        </motion.h1>

        <motion.div style={{ width:60, height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent)' }}
          initial={{ scaleX:0 }} animate={{ scaleX:1 }} transition={{ delay:1.1 }} />
      </div>

      {/* Ticker — single seamless row */}
      <div style={{ position:'absolute', overflow:'hidden', pointerEvents:'none', width:'100%', bottom:128, height:18 }}>
        <div style={{
          display:'flex', alignItems:'center', whiteSpace:'nowrap', gap:32,
          animation:'ticker 26s linear infinite',
          width:'max-content',
        }}>
          {[...TICKER,...TICKER].map((w,j) => (
            <span key={j} style={{
              fontStyle:'italic', fontSize:11.5, letterSpacing:'0.05em',
              color: w==='✦' ? 'rgba(244,184,204,.45)' : 'rgba(255,255,255,.24)',
            }}>{w}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Photo card (no touch handlers that conflict) ─────────────────────────────
function PhotoCard({ photo }) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [burst, setBurst] = useState([])
  const lastTap = useRef(0)
  const src = getSrc(photo)

  // double-tap heart — only on image area, won't interfere with swipe
  const handleTap = (e) => {
    const now = Date.now()
    if (now - lastTap.current < 340) {
      setLiked(true)
      const rect = e.currentTarget.getBoundingClientRect()
      const cx = (e.changedTouches?.[0]?.clientX ?? e.clientX) - rect.left
      const cy = (e.changedTouches?.[0]?.clientY ?? e.clientY) - rect.top
      const id = now
      setBurst(b => [...b, { id, cx, cy }])
      setTimeout(() => setBurst(b => b.filter(x => x.id !== id)), 950)
    }
    lastTap.current = now
  }

  return (
    <motion.div
      style={{
        width:'100%', maxWidth:'min(calc(100vw - 32px), 380px)',
        borderRadius:24, overflow:'hidden',
        background:'rgba(22,21,32,.95)', border:'1px solid rgba(255,255,255,.08)',
        boxShadow:'0 20px 60px rgba(0,0,0,.55)', animation:'glow 4.5s ease-in-out infinite',
      }}
      initial={{ opacity:0, y:20, scale:.97 }}
      animate={{ opacity:1, y:0, scale:1 }}
      transition={{ duration:.35, ease:'easeOut' }}
    >
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px' }}>
        <div style={{ width:32, height:32, borderRadius:'50%', overflow:'hidden', flexShrink:0, border:'2px solid rgba(212,160,122,.4)', padding:1 }}>
          <img src="/assets/couple.jpg" alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ color:'rgba(255,255,255,.88)', fontSize:13.5, fontWeight:600, lineHeight:1, marginBottom:3 }}>Hazar &amp; Eda</p>
          {photo.date && <p style={{ color:'rgba(255,255,255,.28)', fontSize:11 }}>{photo.date}</p>}
        </div>
        <Sparkles size={13} style={{ color:'rgba(212,160,122,.35)', flexShrink:0 }} />
      </div>

      {/* Image — only touchend here for double-tap, swipe is handled on parent */}
      <div style={{ position:'relative', aspectRatio:'1/1', overflow:'hidden', userSelect:'none' }}
        onTouchEnd={handleTap} onClick={handleTap}>
        {src
          ? <img src={src} alt={photo.caption||'anı'} draggable={false}
              style={{ width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none' }} />
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,.03)' }}>
              <span style={{ color:'rgba(255,255,255,.2)', fontSize:13 }}>Fotoğraf yok</span>
            </div>}
        <AnimatePresence>
          {burst.map(h => (
            <motion.div key={h.id} style={{ position:'absolute', left:h.cx-28, top:h.cy-28, pointerEvents:'none' }}
              initial={{ scale:0, opacity:1 }} animate={{ scale:[0,1.5,1.1], opacity:[1,1,0], y:-55 }}
              transition={{ duration:.9 }}>
              <Heart size={56} fill="#e84393" color="#e84393" style={{ filter:'drop-shadow(0 0 12px rgba(232,67,147,.7))' }} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div style={{ padding:'12px 16px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <motion.button onClick={() => setLiked(l=>!l)} whileTap={{ scale:1.35 }}
            transition={{ type:'spring', stiffness:380, damping:14 }} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
            <Heart size={23} fill={liked?'#e84393':'none'} color={liked?'#e84393':'rgba(255,255,255,.6)'}
              style={liked?{ filter:'drop-shadow(0 0 6px rgba(232,67,147,.7))' }:{}} />
          </motion.button>
          <motion.button onClick={() => setSaved(s=>!s)} whileTap={{ scale:1.2 }}
            style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
            <Bookmark size={21} fill={saved?'rgba(212,160,122,.9)':'none'}
              color={saved?'rgba(212,160,122,.9)':'rgba(255,255,255,.38)'} />
          </motion.button>
        </div>
        {photo.caption && (
          <p style={{ color:'rgba(255,255,255,.7)', fontSize:13.5, lineHeight:1.5, margin:0 }}>
            <span style={{ color:'rgba(255,255,255,.88)', fontWeight:600, marginRight:6 }}>hazar</span>
            {photo.caption}
          </p>
        )}
      </div>
    </motion.div>
  )
}

// ─── Photo slide wrapper ──────────────────────────────────────────────────────
function PhotoSlide({ photo, offset }) {
  // offset = (photoColIndex - currentCol) — how far off screen
  return (
    <div style={{
      position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
      padding:'0 16px', paddingBottom:90, background:'#0c0b12',
      transform:`translateX(${offset * 100}%)`,
      transition:'transform .38s cubic-bezier(.22,1,.36,1)',
      willChange:'transform',
    }}>
      <PhotoCard photo={photo} />
    </div>
  )
}

// ─── Love slide ───────────────────────────────────────────────────────────────
const DECOS = ['✦','◈','❋','✧','⟡']
function LoveSlide({ msgs, idx, visible }) {
  const msg = msgs[idx % msgs.length]
  return (
    <motion.div
      style={{
        position:'absolute', inset:0, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', padding:'0 20px', paddingBottom:90,
        background:'linear-gradient(155deg,#0f0c1e 0%,#160d22 45%,#0c0b14 100%)',
        zIndex:20, pointerEvents: visible ? 'auto' : 'none',
      }}
      initial={{ y:'100%' }}
      animate={{ y: visible ? '0%' : '100%' }}
      transition={{ type:'spring', stiffness:250, damping:28 }}
    >
      <StarBg />

      {/* Glow blobs */}
      <div style={{ position:'absolute', width:220, height:220, top:'10%', left:'5%', background:'radial-gradient(circle,rgba(212,160,122,.06) 0%,transparent 70%)', filter:'blur(50px)', animation:'drift 9s ease-in-out infinite', pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:180, height:180, bottom:'12%', right:'5%', background:'radial-gradient(circle,rgba(180,130,250,.06) 0%,transparent 70%)', filter:'blur(45px)', animation:'drift 11s 2.5s ease-in-out infinite', pointerEvents:'none' }} />

      <AnimatePresence mode="wait">
        <motion.div key={msg.id}
          style={{
            width:'100%', maxWidth:'min(calc(100vw - 40px),360px)',
            borderRadius:28, padding:'40px 28px', textAlign:'center', position:'relative',
            background:'rgba(18,16,28,.92)', border:'1px solid rgba(212,160,122,.09)',
            boxShadow:'0 28px 80px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.03)',
            backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
            animation:'glow 5s ease-in-out infinite',
          }}
          initial={{ opacity:0, y:24, scale:.93 }}
          animate={{ opacity:1, y:0, scale:1 }}
          exit={{ opacity:0, y:-16, scale:.96 }}
          transition={{ duration:.38, ease:[.22,1,.36,1] }}>

          {/* Floating decorations */}
          <div style={{ display:'flex', justifyContent:'center', gap:12, marginBottom:20 }}>
            {DECOS.map((d,i) => (
              <span key={i} style={{
                display:'inline-block', fontSize: i===2?17:11,
                color: i===2?'rgba(244,184,204,.62)':'rgba(212,160,122,.3)',
                animation:`drift ${3+i*.6}s ${i*.4}s ease-in-out infinite`,
              }}>{d}</span>
            ))}
          </div>

          {/* Heart icon */}
          <div style={{
            width:44, height:44, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 20px', background:'linear-gradient(135deg,rgba(212,160,122,.13),rgba(200,150,245,.09))',
            border:'1px solid rgba(212,160,122,.14)',
          }}>
            <Heart size={19} fill="rgba(212,160,122,.8)" color="rgba(212,160,122,.8)" />
          </div>

          {/* Quote */}
          <p style={{
            fontStyle:'italic', color:'rgba(255,255,255,.86)', lineHeight:1.55, marginBottom:20,
            fontSize:'clamp(1.1rem,4.8vw,1.35rem)', textShadow:'0 0 40px rgba(212,160,122,.1)',
          }}>
            &ldquo;{msg.text}&rdquo;
          </p>

          <div style={{ width:48, height:1, margin:'0 auto 16px', background:'linear-gradient(90deg,transparent,rgba(212,160,122,.38),transparent)' }} />

          <p style={{ color:'rgba(255,255,255,.26)', fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase' }}>{msg.sub}</p>

          {/* shimmer bar */}
          <div style={{
            width:'100%', height:1, marginTop:24, borderRadius:4,
            background:'linear-gradient(90deg,transparent,rgba(212,160,122,.18),rgba(200,150,245,.15),rgba(212,160,122,.18),transparent)',
            backgroundSize:'200% auto', animation:'shimmer 3.5s linear infinite',
          }} />
        </motion.div>
      </AnimatePresence>

      {/* Message dots */}
      {msgs.length > 1 && (
        <div style={{ display:'flex', gap:6, marginTop:20, position:'relative', zIndex:2 }}>
          {msgs.map((_,i) => (
            <div key={i} style={{
              height:4, borderRadius:2,
              width: i===idx%msgs.length ? 14 : 4,
              background: i===idx%msgs.length ? 'rgba(200,168,242,.8)' : 'rgba(255,255,255,.14)',
              transition:'all .25s',
            }} />
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ─── Music bar — FIXED so it never gets clipped ───────────────────────────────
function MusicBar({ playing, track, onToggle, onNext }) {
  return (
    <div style={{
      position:'fixed', bottom:0, left:0, right:0, zIndex:100,
      paddingBottom:'env(safe-area-inset-bottom,0px)',
      background:'rgba(5,4,13,.97)',
      borderTop:'1px solid rgba(255,255,255,.055)',
      backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
    }}>
      {/* Track tabs */}
      <div style={{ display:'flex' }}>
        {TRACKS.map((t,i) => (
          <button key={i} onClick={() => onNext(i)} style={{
            flex:1, display:'flex', alignItems:'center', justifyContent:'center',
            paddingTop:8, paddingBottom:6, background:'none',
            borderBottom: i===track ? '2px solid rgba(212,160,122,.75)' : '2px solid transparent',
            cursor:'pointer',
          }}>
            <span style={{
              fontSize:11, fontFamily:'sans-serif', fontWeight:500, whiteSpace:'nowrap',
              color: i===track ? 'rgba(255,255,255,.82)' : 'rgba(255,255,255,.24)',
            }}>{t.title}</span>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:24, paddingTop:8, paddingBottom:11 }}>
        <Music2 size={13} style={{ color: playing?'rgba(212,160,122,.65)':'rgba(255,255,255,.16)' }} />

        <motion.button onClick={onToggle} whileTap={{ scale:.85 }} style={{
          width:36, height:36, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center',
          background: playing ? 'linear-gradient(135deg,rgba(212,160,122,.22),rgba(200,160,245,.15))' : 'rgba(255,255,255,.07)',
          border: playing ? '1px solid rgba(212,160,122,.28)' : '1px solid rgba(255,255,255,.06)',
          cursor:'pointer', flexShrink:0,
        }}>
          {playing
            ? <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap:2, width:13, height:13 }}>
                {[0,1,2].map(j => (
                  <div key={j} style={{ width:2, borderRadius:2, background:'rgba(212,160,122,.9)', animation:`eq .62s ${j*.14}s ease-in-out infinite` }} />
                ))}
              </div>
            : <Play size={12} fill="rgba(255,255,255,.72)" color="rgba(255,255,255,.72)" style={{ marginLeft:1 }} />}
        </motion.button>

        <motion.button onClick={() => onNext((track+1)%TRACKS.length)} whileTap={{ scale:.86 }}
          style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
          <SkipForward size={14} style={{ color:'rgba(255,255,255,.28)' }} />
        </motion.button>
      </div>
    </div>
  )
}

// ─── Navigation dots — also fixed ────────────────────────────────────────────
function NavDots({ total, col, row }) {
  const n = Math.min(total, 9)
  // Height of music bar ≈ 74px + safe area
  return (
    <div style={{
      position:'fixed', bottom:'calc(74px + env(safe-area-inset-bottom,0px) + 10px)',
      left:'50%', transform:'translateX(-50%)',
      zIndex:99, display:'flex', flexDirection:'column', alignItems:'center', gap:6,
      pointerEvents:'none',
    }}>
      <div style={{ display:'flex', gap:6 }}>
        {Array.from({ length:n }).map((_,i) => (
          <div key={i} style={{
            height:4, borderRadius:2,
            width: i===col ? 13 : 4,
            background: i===col
              ? (row===1 ? 'rgba(200,168,242,.85)' : 'rgba(212,160,122,.85)')
              : 'rgba(255,255,255,.16)',
            transition:'all .25s',
          }} />
        ))}
      </div>
      {total > 1 && (
        <div style={{ display:'flex', gap:5 }}>
          {[0,1].map(r => (
            <div key={r} style={{
              width:4, borderRadius:2,
              height: r===row ? 11 : 4,
              background: r===row ? 'rgba(190,162,238,.55)' : 'rgba(255,255,255,.1)',
              transition:'all .25s',
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MemoryUniverse() {
  const { state, dispatch } = useAppState()
  const photos = state.photos || []
  const MSGS = useMemo(loadMsgs, [])

  // Use refs to avoid stale closures in touch handlers
  const colRef  = useRef(0)
  const rowRef  = useRef(0)
  const busyRef = useRef(false)
  const tsRef   = useRef(null)  // touch start coords

  const [col, setCol]         = useState(0)
  const [row, setRow]         = useState(0)
  const [loveIdx, setLoveIdx] = useState(0)
  const [hint, setHint]       = useState(true)
  const [music, setMusic]     = useState(false)
  const [ended, setEnded]     = useState(false)
  const [track, setTrack]     = useState(0)

  const audioRef = useRef(null)
  const touchedRef = useRef(false)

  const coverTitle = localStorage.getItem(LS_TITLE_KEY) || 'Özelimiz'
  const totalCols  = 1 + photos.length

  // keep refs in sync
  useEffect(() => { colRef.current = col }, [col])
  useEffect(() => { rowRef.current = row }, [row])

  // hint auto-hide
  useEffect(() => {
    const t = setTimeout(() => setHint(false), 4500)
    return () => clearTimeout(t)
  }, [])

  // Music setup
  useEffect(() => {
    const audio = audioRef.current; if (!audio) return
    const onEnd = () => { setMusic(false); setEnded(true) }
    audio.addEventListener('ended', onEnd)
    const autoT = setTimeout(() => {
      if (touchedRef.current) return
      audio.play().then(() => { setMusic(true); touchedRef.current = true }).catch(() => {})
    }, 2800)
    const onFirst = () => {
      if (touchedRef.current) return
      touchedRef.current = true; clearTimeout(autoT)
      audio.play().then(() => setMusic(true)).catch(() => {})
    }
    document.addEventListener('touchstart', onFirst, { once: true })
    document.addEventListener('click', onFirst, { once: true })
    return () => {
      audio.removeEventListener('ended', onEnd); clearTimeout(autoT)
      document.removeEventListener('touchstart', onFirst)
      document.removeEventListener('click', onFirst)
    }
  }, [])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current; if (!audio) return
    touchedRef.current = true
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

  // Navigation — uses refs, never stale
  const navigate = useCallback((dc, dr) => {
    if (busyRef.current) return
    busyRef.current = true
    setTimeout(() => { busyRef.current = false }, 420)

    const curCol = colRef.current
    const curRow = rowRef.current

    if (dr !== 0) {
      if (curCol === 0) return   // hero → no love row
      const nr = Math.max(0, Math.min(1, curRow + dr))
      if (nr === curRow) return
      rowRef.current = nr
      if (nr === 1) setLoveIdx(curCol - 1)
      setRow(nr)
      return
    }
    if (dc !== 0) {
      setHint(false)
      const nc = Math.max(0, Math.min(totalCols - 1, curCol + dc))
      if (nc === curCol) return
      colRef.current = nc
      setCol(nc)
    }
  }, [totalCols])

  // Touch handling — attach to document to catch all touches
  useEffect(() => {
    const onStart = (e) => {
      // Ignore if touching music bar (fixed, bottom ~85px)
      const y = e.touches[0].clientY
      if (y > window.innerHeight - 90) return
      tsRef.current = { x: e.touches[0].clientX, y }
    }
    const onEnd = (e) => {
      if (!tsRef.current) return
      const dx = e.changedTouches[0].clientX - tsRef.current.x
      const dy = e.changedTouches[0].clientY - tsRef.current.y
      tsRef.current = null
      const ax = Math.abs(dx), ay = Math.abs(dy), thr = 40
      if (ax < thr && ay < thr) return
      if (ax >= ay) { dx < 0 ? navigate(1, 0) : navigate(-1, 0) }
      else          { dy < 0 ? navigate(0, 1) : navigate(0, -1) }
    }
    document.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchend', onEnd,   { passive: true })
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchend', onEnd)
    }
  }, [navigate])

  const logout = useCallback(() => {
    const audio = audioRef.current
    if (audio) { audio.pause(); audio.currentTime = 0 }
    dispatch({ type: 'RESET_TO_INTRO' })
  }, [dispatch])

  // Only render visible + adjacent photo columns
  const visibleSet = useMemo(() => {
    const s = new Set([0])
    for (let c = Math.max(1, col - 1); c <= Math.min(totalCols - 1, col + 1); c++) s.add(c)
    return s
  }, [col, totalCols])

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden', background:'#0c0b12', touchAction:'none' }}>
      <style>{CSS}</style>
      <audio ref={audioRef} src={TRACKS[0].src} preload="metadata" />

      {/* ── Hero ── */}
      <div style={{
        position:'absolute', inset:0, overflow:'hidden',
        transform: `translateX(${-col * 100}%)`,
        transition:'transform .38s cubic-bezier(.22,1,.36,1)',
        willChange:'transform',
      }}>
        <HeroSlide title={coverTitle} />
      </div>

      {/* ── Photos ── */}
      {photos.map((photo, i) => {
        const c = i + 1
        if (!visibleSet.has(c)) return null
        return (
          <PhotoSlide key={photo.id || i} photo={photo} offset={c - col} />
        )
      })}

      {/* ── Love messages (full-screen, on top, slides from bottom) ── */}
      <LoveSlide msgs={MSGS} idx={loveIdx} visible={row === 1} />

      {/* ── Back button ── */}
      <motion.button
        onClick={logout}
        initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.3 }}
        whileTap={{ scale:.9 }}
        style={{
          position:'fixed', top:16, left:16, zIndex:200,
          display:'flex', alignItems:'center', gap:6,
          padding:'7px 13px', borderRadius:16,
          background:'rgba(0,0,0,.54)', border:'1px solid rgba(255,255,255,.07)',
          backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
          cursor:'pointer',
        }}>
        <ChevronLeft size={14} style={{ color:'rgba(255,255,255,.46)' }} />
        <span style={{ color:'rgba(255,255,255,.4)', fontSize:12, fontFamily:'sans-serif', fontWeight:500 }}>Çıkış</span>
      </motion.button>

      {/* ── Swipe hint ── */}
      <AnimatePresence>
        {hint && col === 0 && (
          <motion.div
            style={{
              position:'fixed', bottom:'calc(85px + env(safe-area-inset-bottom,0px) + 38px)',
              left:'50%', transform:'translateX(-50%)', zIndex:99,
              display:'flex', alignItems:'center', gap:8,
              padding:'9px 16px', borderRadius:16, pointerEvents:'none',
              background:'rgba(0,0,0,.6)', border:'1px solid rgba(255,255,255,.09)',
              backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)',
              whiteSpace:'nowrap',
            }}
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            transition={{ delay:1 }}>
            <Star size={11} style={{ color:'rgba(212,160,122,.6)', flexShrink:0 }} />
            <span style={{ color:'rgba(255,255,255,.5)', fontSize:11.5, fontFamily:'sans-serif' }}>Fotoğraflar için sola kaydır</span>
          </motion.div>
        )}
      </AnimatePresence>

      <NavDots total={totalCols} col={col} row={row} />

      <MusicBar playing={music} track={track} onToggle={toggleMusic} onNext={pickTrack} />

      <HeartEmitter />
    </div>
  )
}
