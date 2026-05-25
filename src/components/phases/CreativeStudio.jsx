import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Upload, Image, BarChart2, Shield, Eye, EyeOff, Lock, AlertTriangle, Scan, Settings, CheckCircle2, XCircle, KeyRound, Type, MessageSquareHeart, RefreshCw, Cloud, Database } from 'lucide-react'
import { useAppState } from '../../store/appState.jsx'
import { isFirebaseConfigured } from '../../lib/firebase.js'
import DropZone from '../admin/DropZone.jsx'
import PhotoTable from '../admin/PhotoTable.jsx'
import TelemetryCharts from '../admin/TelemetryCharts.jsx'
import FaceEnrollment from '../admin/FaceEnrollment.jsx'
import CharSplitText from '../ui/CharSplitText.jsx'

// ─── Shared helpers ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, accent = '#d4a07a', count }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `rgba(${accent === '#d4a07a' ? '212,160,122' : '200,180,232'},0.1)`, border: `1px solid rgba(${accent === '#d4a07a' ? '212,160,122' : '200,180,232'},0.18)` }}>
          <Icon size={16} style={{ color: accent, opacity: 0.8 }} />
        </div>
        <div>
          <h2 className="font-display text-base font-semibold text-white/80">{title}</h2>
        </div>
      </div>
      {count !== undefined && (
        <span className="px-2.5 py-1 rounded-lg text-xs font-mono"
          style={{ background: 'rgba(212,160,122,0.08)', border: '1px solid rgba(212,160,122,0.15)', color: 'rgba(212,160,122,0.7)' }}>
          {count}
        </span>
      )}
    </div>
  )
}

function Toast({ msg }) {
  if (!msg) return null
  const isErr = msg.err
  return (
    <motion.div
      className="flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-mono"
      style={{
        background: isErr ? 'rgba(239,68,68,0.08)' : 'rgba(74,222,128,0.08)',
        border: `1px solid ${isErr ? 'rgba(239,68,68,0.2)' : 'rgba(74,222,128,0.2)'}`,
        color: isErr ? 'rgba(239,68,68,0.8)' : 'rgba(74,222,128,0.8)',
      }}
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6 }}
    >
      {isErr ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
      {msg.msg}
    </motion.div>
  )
}

// ─── Lockdown screen ──────────────────────────────────────────────────────────
function LockdownScreen() {
  const { dispatch } = useAppState()
  const [code, setCode] = useState('')
  const [shake, setShake] = useState(false)
  const UNLOCK_CODE = 'HAZAR2024'

  const tryUnlock = () => {
    if (code.toUpperCase() === UNLOCK_CODE) {
      dispatch({ type: 'UNLOCK_ADMIN' })
    } else {
      setShake(true)
      setCode('')
      setTimeout(() => setShake(false), 600)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center px-6"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(239,68,68,0.04) 0%, transparent 70%), #050508' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      <motion.div
        className="text-7xl mb-8 select-none"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
      >🔒</motion.div>

      <div className="text-center mb-8">
        <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'rgba(239,68,68,0.75)' }}>
          Güvenlik Kilidi
        </h2>
        <p className="text-white/25 text-sm font-mono tracking-wider">3 hatalı giriş · erişim engellendi</p>
      </div>

      <motion.div
        className="w-full max-w-xs rounded-3xl p-6"
        style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)', backdropFilter: 'blur(20px)' }}
        animate={shake ? { x: [-8, 8, -6, 6, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={13} className="text-red-400/50" />
          <span className="text-red-400/50 text-xs font-mono tracking-widest uppercase">Kilit Kodu</span>
        </div>
        <input
          type="text"
          placeholder="HAZAR + Yıl"
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && tryUnlock()}
          className="luxury-input w-full px-4 py-3 rounded-2xl text-sm mb-4 text-center tracking-[0.3em] font-mono"
        />
        <motion.button
          onClick={tryUnlock}
          className="w-full py-3 rounded-2xl text-xs font-mono tracking-widest uppercase transition-all"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.18)', color: 'rgba(239,68,68,0.7)' }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        >
          Kilidi Aç
        </motion.button>
        <p className="text-center text-white/15 text-xs font-mono mt-3 tracking-widest">İPUCU: HAZAR + YIL</p>
      </motion.div>
    </motion.div>
  )
}

// ─── Admin auth gate ──────────────────────────────────────────────────────────
function AdminAuthGate({ onSuccess }) {
  const { state, dispatch } = useAppState()
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState(false)
  const attemptsLeft = 3 - state.adminAttempts

  const handleSubmit = useCallback((e) => {
    e?.preventDefault()
    if (pass === 'kral2024') {
      dispatch({ type: 'ATTEMPT_ADMIN_AUTH', payload: pass })
      onSuccess?.()
    } else {
      dispatch({ type: 'ATTEMPT_ADMIN_AUTH', payload: pass })
      setError(true); setPass('')
      setTimeout(() => setError(false), 1000)
    }
  }, [pass, dispatch, onSuccess])

  if (state.isAdminLocked) return <LockdownScreen />

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(212,160,122,0.04) 0%, transparent 60%), #050508', backdropFilter: 'blur(4px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      {/* Aurora blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div className="absolute w-96 h-96 rounded-full blur-[120px] opacity-10"
          style={{ background: 'radial-gradient(circle, #d4a07a, transparent)', top: '20%', left: '30%' }}
          animate={{ scale: [1, 1.15, 1], x: [0, 20, 0] }}
          transition={{ repeat: Infinity, duration: 6 }} />
        <motion.div className="absolute w-80 h-80 rounded-full blur-[100px] opacity-8"
          style={{ background: 'radial-gradient(circle, #c8b4e8, transparent)', bottom: '25%', right: '25%' }}
          animate={{ scale: [1, 1.2, 1], y: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 8, delay: 1 }} />
      </div>

      <motion.div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(12,12,18,0.85)',
          border: '1px solid rgba(212,160,122,0.14)',
          backdropFilter: 'blur(40px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
        }}
        initial={{ scale: 0.92, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      >
        {/* Top gradient bar */}
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,160,122,0.4), transparent)' }} />

        <div className="p-8">
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
              style={{ background: 'rgba(212,160,122,0.07)', border: '1px solid rgba(212,160,122,0.14)' }}
              animate={{ boxShadow: ['0 0 0 0 rgba(212,160,122,0)', '0 0 20px 4px rgba(212,160,122,0.08)', '0 0 0 0 rgba(212,160,122,0)'] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            >
              <Shield size={22} style={{ color: 'rgba(212,160,122,0.7)' }} />
            </motion.div>
            <CharSplitText
              text="Admin Girişi"
              className="block font-display text-xl font-bold text-white/75 mb-1.5"
              staggerDelay={0.04}
            />
            <p className="text-white/25 text-xs font-mono tracking-[0.25em]">YÖNETİCİ PANELİ</p>
          </div>

          <AnimatePresence>
            {attemptsLeft < 3 && (
              <motion.div
                className="mb-5 px-4 py-2.5 rounded-2xl flex items-center gap-2"
                style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.14)' }}
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0 }}
              >
                <AlertTriangle size={12} className="text-red-400/60 shrink-0" />
                <p className="text-red-400/60 text-xs font-mono">{attemptsLeft} deneme hakkı kaldı</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <motion.input
                type={showPass ? 'text' : 'password'}
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="Şifre"
                className="luxury-input w-full px-5 py-3.5 rounded-2xl pr-12 text-sm text-center tracking-[0.25em] font-mono"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                animate={error ? { x: [-7, 7, -5, 5, 0], borderColor: ['rgba(239,68,68,0.4)', 'rgba(239,68,68,0.4)', 'rgba(255,255,255,0.07)'] } : {}}
                transition={{ duration: 0.35 }}
                autoFocus
              />
              <button type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                onClick={() => setShowPass(v => !v)}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div className="flex items-center justify-center gap-1.5"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <XCircle size={11} className="text-red-400/60" />
                  <p className="text-red-400/60 text-xs font-mono">Hatalı şifre</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button type="submit"
              className="w-full py-3.5 rounded-2xl text-sm tracking-[0.2em] uppercase font-mono transition-all flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, rgba(212,160,122,0.14), rgba(200,180,232,0.1))', border: '1px solid rgba(212,160,122,0.22)', color: 'rgba(245,240,235,0.75)' }}
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(212,160,122,0.12)' }}
              whileTap={{ scale: 0.97 }}
            >
              <Lock size={12} />
              Giriş
            </motion.button>
          </form>
        </div>

        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,180,232,0.2), transparent)' }} />
      </motion.div>
    </motion.div>
  )
}

// ─── Admin Settings ────────────────────────────────────────────────────────────
function AdminSettings() {
  const [title, setTitle] = useState(() => localStorage.getItem('hazar_cover_title') || 'Özelimiz')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [messages, setMessages] = useState(() => {
    try {
      const s = localStorage.getItem('hazar_love_messages')
      return s ? JSON.parse(s) : [
        { id: '1', text: 'Seninle her an güzel 🖤', sub: 'her zaman, her yerde' },
        { id: '2', text: 'Dünyanın en tatlı insanısın', sub: 'sadece sen biliyorsun' },
        { id: '3', text: 'Seni çok seviyorum, Eda', sub: '— kalbimin derinliklerinden' },
      ]
    } catch { return [] }
  })
  const [toast, setToast] = useState(null)

  const flash = (msg, err = false) => {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 2800)
  }

  const saveTitle = () => {
    localStorage.setItem('hazar_cover_title', title.trim() || 'Özelimiz')
    flash('Başlık kaydedildi')
  }
  const savePw = () => {
    if (!pw || pw !== pw2) { flash('Şifreler eşleşmiyor', true); return }
    if (pw.length < 3) { flash('En az 3 karakter olmalı', true); return }
    localStorage.setItem('hazar_custom_password', pw)
    setPw(''); setPw2('')
    flash('Şifre güncellendi')
  }
  const resetPw = () => {
    localStorage.removeItem('hazar_custom_password')
    flash('Varsayılan şifreye döndü')
  }
  const saveMessages = () => {
    localStorage.setItem('hazar_love_messages', JSON.stringify(messages))
    flash('Mesajlar kaydedildi')
  }
  const updateMsg = (id, field, val) => setMessages(ms => ms.map(m => m.id === id ? { ...m, [field]: val } : m))
  const addMsg = () => setMessages(ms => [...ms, { id: Date.now().toString(), text: '', sub: '' }])
  const removeMsg = (id) => setMessages(ms => ms.filter(m => m.id !== id))

  const Card = ({ children, accent }) => (
    <div className="rounded-2xl p-5" style={{
      background: 'rgba(255,255,255,0.02)',
      border: `1px solid rgba(${accent || '255,255,255'},0.07)`,
      backdropFilter: 'blur(10px)',
    }}>{children}</div>
  )

  return (
    <div className="space-y-4">
      {/* Firebase status */}
      <Card accent={isFirebaseConfigured ? '52,211,153' : '212,160,122'}>
        <div className="flex items-center gap-2.5 mb-3">
          <Cloud size={14} style={{ color: isFirebaseConfigured ? 'rgba(52,211,153,0.7)' : 'rgba(212,160,122,0.6)' }} />
          <span className="text-white/50 text-xs font-sans font-semibold tracking-widest uppercase">Firebase</span>
          <span className="ml-auto text-[10px] font-sans px-2 py-0.5 rounded-full"
            style={isFirebaseConfigured
              ? { background: 'rgba(52,211,153,0.1)', color: 'rgba(52,211,153,0.8)', border: '1px solid rgba(52,211,153,0.2)' }
              : { background: 'rgba(251,146,60,0.1)', color: 'rgba(251,146,60,0.8)', border: '1px solid rgba(251,146,60,0.2)' }}>
            {isFirebaseConfigured ? 'Bağlı' : 'Kurulmadı'}
          </span>
        </div>
        {isFirebaseConfigured
          ? <p className="text-white/35 text-xs font-sans leading-relaxed">Tüm fotoğraflar buluta senkronize ediliyor. Her cihazdan görünür.</p>
          : <div className="space-y-2.5">
              <p className="text-white/40 text-xs font-sans leading-relaxed">Fotoğrafları tüm cihazlarda görmek için Firebase kur:</p>
              <ol className="text-white/30 text-xs font-sans space-y-1.5 list-decimal list-inside">
                <li><a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-amber-400/60 underline">console.firebase.google.com</a> → Yeni proje</li>
                <li>Firestore Database → Test mode ile başlat</li>
                <li>Storage → Test mode ile başlat</li>
                <li>Proje Ayarları (&gt;) → Web uygulaması ekle → Config al</li>
                <li>Vercel Dashboard → Environment Variables ekle:</li>
              </ol>
              <div className="rounded-xl p-3 mt-2 font-mono text-[10px] text-white/30 space-y-0.5 leading-relaxed"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>VITE_FB_API_KEY=AIza...</div>
                <div>VITE_FB_AUTH_DOMAIN=proje.firebaseapp.com</div>
                <div>VITE_FB_PROJECT_ID=proje-adi</div>
                <div>VITE_FB_STORAGE_BUCKET=proje.appspot.com</div>
                <div>VITE_FB_MESSAGING_SENDER_ID=123...</div>
                <div>VITE_FB_APP_ID=1:123...</div>
              </div>
            </div>}
      </Card>

      {/* Cover title */}
      <Card>
        <div className="flex items-center gap-2.5 mb-4">
          <Type size={14} className="text-rose-gold/60" />
          <span className="text-white/50 text-xs font-mono tracking-widest uppercase">Kapak Başlığı</span>
        </div>
        <div className="flex gap-2">
          <input className="luxury-input flex-1 px-4 py-2.5 rounded-xl text-sm font-display"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            value={title} onChange={e => setTitle(e.target.value)} placeholder="Özelimiz" />
          <motion.button className="px-5 py-2.5 rounded-xl text-xs font-mono tracking-wide"
            style={{ background: 'rgba(212,160,122,0.1)', border: '1px solid rgba(212,160,122,0.2)', color: 'rgba(212,160,122,0.85)' }}
            onClick={saveTitle} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
            Kaydet
          </motion.button>
        </div>
        <p className="text-white/15 text-xs font-mono mt-2">Feed'in üstünde görünür</p>
      </Card>

      {/* Password */}
      <Card>
        <div className="flex items-center gap-2.5 mb-4">
          <KeyRound size={14} className="text-lavender/60" />
          <span className="text-white/50 text-xs font-mono tracking-widest uppercase">Giriş Şifresi</span>
        </div>
        <div className="space-y-2">
          <div className="relative">
            <input className="luxury-input w-full px-4 py-2.5 rounded-xl text-sm pr-11"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="Yeni şifre" />
            <button type="button" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/45 transition-colors"
              onClick={() => setShowPw(v => !v)}>
              {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <input className="luxury-input w-full px-4 py-2.5 rounded-xl text-sm"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Tekrar yaz" />
          <div className="flex gap-2 pt-1">
            <motion.button className="flex-1 py-2.5 rounded-xl text-xs font-mono tracking-wide flex items-center justify-center gap-1.5"
              style={{ background: 'linear-gradient(135deg,rgba(200,180,232,0.1),rgba(212,160,122,0.08))', border: '1px solid rgba(200,180,232,0.15)', color: 'rgba(220,200,245,0.75)' }}
              onClick={savePw} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>
              <Lock size={10} /> Güncelle
            </motion.button>
            <motion.button className="px-4 py-2.5 rounded-xl text-xs font-mono tracking-wide flex items-center gap-1.5"
              style={{ background: 'rgba(200,60,60,0.06)', border: '1px solid rgba(200,60,60,0.15)', color: 'rgba(220,120,120,0.65)' }}
              onClick={resetPw} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} title="Varsayılan: hazar">
              <RefreshCw size={10} /> Sıfırla
            </motion.button>
          </div>
          <p className="text-white/15 text-xs font-mono">Varsayılan: <span style={{ color: 'rgba(212,160,122,0.45)' }}>hazar</span></p>
        </div>
      </Card>

      {/* Messages */}
      <Card>
        <div className="flex items-center gap-2.5 mb-4">
          <MessageSquareHeart size={14} className="text-rose-gold/60" />
          <span className="text-white/50 text-xs font-mono tracking-widest uppercase">Sevgi Mesajları</span>
        </div>
        <div className="space-y-3">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div key={m.id}
                className="rounded-xl p-3 space-y-2"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-white/20 text-xs font-mono w-4">{i + 1}</span>
                  <input className="luxury-input flex-1 px-3 py-2 rounded-lg text-sm"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    value={m.text} onChange={e => updateMsg(m.id, 'text', e.target.value)} placeholder="Mesaj metni..." />
                  <button className="text-red-400/30 hover:text-red-400/65 transition-colors text-base leading-none flex-shrink-0"
                    onClick={() => removeMsg(m.id)}>×</button>
                </div>
                <input className="luxury-input w-full px-3 py-1.5 rounded-lg text-xs ml-6"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                  value={m.sub} onChange={e => updateMsg(m.id, 'sub', e.target.value)} placeholder="Alt yazı (küçük)..." />
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="flex gap-2 pt-1">
            <motion.button className="px-4 py-2.5 rounded-xl text-xs font-mono tracking-wide"
              style={{ background: 'rgba(200,180,232,0.07)', border: '1px solid rgba(200,180,232,0.12)', color: 'rgba(200,180,232,0.65)' }}
              onClick={addMsg} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
              + Mesaj Ekle
            </motion.button>
            <motion.button className="flex-1 py-2.5 rounded-xl text-xs font-mono tracking-wide"
              style={{ background: 'rgba(212,160,122,0.1)', border: '1px solid rgba(212,160,122,0.2)', color: 'rgba(212,160,122,0.85)' }}
              onClick={saveMessages} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>
              Kaydet
            </motion.button>
          </div>
        </div>
      </Card>

      <AnimatePresence>{toast && <Toast msg={toast} />}</AnimatePresence>
    </div>
  )
}

// ─── Main CreativeStudio ──────────────────────────────────────────────────────
export default function CreativeStudio() {
  const { state, dispatch } = useAppState()
  const [authed, setAuthed] = useState(state.isAdminAuthenticated)
  const [activeTab, setActiveTab] = useState('upload')

  const handleBack = useCallback(() => {
    dispatch({ type: 'EXIT_ADMIN' })
  }, [dispatch])

  if (state.isAdminLocked) return <LockdownScreen />
  if (!authed) return <AdminAuthGate onSuccess={() => setAuthed(true)} />

  const tabs = [
    { key: 'upload',   label: 'Yükle',       icon: Upload,              color: '#d4a07a' },
    { key: 'photos',   label: 'Anılar',       icon: Image,               color: '#d4a07a' },
    { key: 'stats',    label: 'İstatistik',   icon: BarChart2,           color: '#c8b4e8' },
    { key: 'face',     label: 'Yüz',          icon: Scan,                color: '#c8b4e8' },
    { key: 'settings', label: 'Ayarlar',      icon: Settings,            color: '#d4a07a' },
  ]

  const photoCount = (state.photos || []).length

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#070710' }}>

      {/* Aurora background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div className="absolute w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(212,160,122,0.06), transparent)', top: '-10%', right: '-5%' }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 7 }} />
        <motion.div className="absolute w-[400px] h-[400px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(200,180,232,0.05), transparent)', bottom: '10%', left: '-5%' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ repeat: Infinity, duration: 9, delay: 2 }} />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Header */}
      <motion.header
        className="relative z-20 flex items-center justify-between px-5 md:px-8 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-4">
          <motion.button
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/35 hover:text-white/70 transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            onClick={handleBack}
            whileHover={{ scale: 1.08, x: -1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft size={15} />
          </motion.button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-lg tracking-wide"
                style={{ background: 'linear-gradient(135deg, #d4a07a 0%, #f0d4b8 45%, #c8b4e8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Studio
              </h1>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.15)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400/70 animate-pulse" />
                <span className="text-green-400/60 text-[10px] font-mono tracking-wider">AKTİF</span>
              </div>
            </div>
            <p className="text-white/18 text-[10px] font-mono tracking-[0.3em] uppercase mt-0.5">Admin Panel</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {photoCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(212,160,122,0.07)', border: '1px solid rgba(212,160,122,0.12)' }}>
              <Image size={11} style={{ color: 'rgba(212,160,122,0.6)' }} />
              <span className="text-xs font-mono" style={{ color: 'rgba(212,160,122,0.6)' }}>{photoCount} fotoğraf</span>
            </div>
          )}
        </div>
      </motion.header>

      {/* Tab navigation */}
      <div className="relative z-10 px-5 md:px-8 py-3 flex gap-1.5 overflow-x-auto"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', scrollbarWidth: 'none' }}>
        {tabs.map(({ key, label, icon: Icon, color }, i) => {
          const active = activeTab === key
          return (
            <motion.button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono tracking-wide whitespace-nowrap transition-all relative overflow-hidden flex-shrink-0"
              style={active ? {
                background: `linear-gradient(135deg, rgba(${color === '#d4a07a' ? '212,160,122' : '200,180,232'},0.12), rgba(${color === '#d4a07a' ? '212,160,122' : '200,180,232'},0.06))`,
                border: `1px solid rgba(${color === '#d4a07a' ? '212,160,122' : '200,180,232'},0.22)`,
                color: color,
              } : {
                background: 'transparent',
                border: '1px solid transparent',
                color: 'rgba(255,255,255,0.25)',
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Icon size={12} />
              {label}
              {active && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
                  layoutId="tabUnderline"
                />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Content area */}
      <div className="phase-scroll" style={{ height: 'calc(100% - 120px)' }}>
        <div className="px-5 md:px-8 py-6 pb-20 max-w-3xl">
          <AnimatePresence mode="wait">

            {activeTab === 'upload' && (
              <motion.div key="upload"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}>
                <SectionHeader icon={Upload} title="Fotoğraf Yükle" />
                <DropZone />
              </motion.div>
            )}

            {activeTab === 'photos' && (
              <motion.div key="photos"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}>
                <SectionHeader icon={Image} title="Anı Arşivi" count={`${photoCount} fotoğraf`} />
                <PhotoTable />
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div key="stats"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}>
                <SectionHeader icon={BarChart2} title="İstatistikler" accent="#c8b4e8" />
                <TelemetryCharts />
              </motion.div>
            )}

            {activeTab === 'face' && (
              <motion.div key="face"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}>
                <SectionHeader icon={Scan} title="Yüz Tanıma" accent="#c8b4e8" />
                <FaceEnrollment />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}>
                <SectionHeader icon={Settings} title="Ayarlar" />
                <AdminSettings />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
