import React, { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Upload, List, BarChart2, Shield, Eye, EyeOff, Lock, AlertTriangle, Scan } from 'lucide-react'
import { useAppState } from '../../store/appState.jsx'
import DropZone from '../admin/DropZone.jsx'
import PhotoTable from '../admin/PhotoTable.jsx'
import TelemetryCharts from '../admin/TelemetryCharts.jsx'
import FaceEnrollment from '../admin/FaceEnrollment.jsx'
import CharSplitText from '../ui/CharSplitText.jsx'

// ─── Lockdown screen ──────────────────────────────────────────────────────────
function LockdownScreen() {
  const { dispatch } = useAppState()
  const [code, setCode] = useState('')
  const UNLOCK_CODE = 'HAZAR2024'

  const tryUnlock = () => {
    if (code.toUpperCase() === UNLOCK_CODE) {
      dispatch({ type: 'UNLOCK_ADMIN' })
    } else {
      setCode('')
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-void gap-6 px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="text-8xl"
        animate={{ rotate: [0, -5, 5, -3, 3, 0] }}
        transition={{ repeat: Infinity, duration: 3, delay: 1 }}
      >
        🔒
      </motion.div>
      <div className="text-center">
        <h2 className="font-display text-3xl text-red-400/80 mb-2">GÜVENLİK KİLİDİ</h2>
        <p className="text-white/30 text-sm font-mono tracking-widest mb-1">3 hatalı giriş tespit edildi</p>
        <p className="text-white/20 text-xs font-sans mt-2 max-w-xs mx-auto leading-relaxed">
          Admin panelinize yetkisiz erişim denemesi. Kilit kodu ile devam edebilirsiniz.
        </p>
      </div>

      <div className="glass-strong rounded-2xl p-6 w-full max-w-xs" style={{ border: '1px solid rgba(239,68,68,0.15)' }}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={14} className="text-red-400/60" />
          <span className="text-red-400/60 text-xs font-mono tracking-widest uppercase">Güvenlik Protokolü</span>
        </div>
        <input
          type="text"
          placeholder="Kilit kodunu gir..."
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && tryUnlock()}
          className="luxury-input w-full px-3 py-2.5 rounded-xl text-sm mb-3 text-center tracking-widest"
        />
        <button
          onClick={tryUnlock}
          className="w-full py-2.5 rounded-xl text-xs font-mono tracking-widest uppercase transition-all"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', color: 'rgba(239,68,68,0.7)' }}
        >
          Kilidi Aç
        </button>
        <p className="text-center text-white/15 text-xs font-mono mt-3">
          İpucu: HAZAR + Yıl
        </p>
      </div>
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
      setError(true)
      setPass('')
      setTimeout(() => setError(false), 1000)
    }
  }, [pass, dispatch, onSuccess])

  if (state.isAdminLocked) return <LockdownScreen />

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-void/95 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="glass-strong rounded-3xl p-8 w-full max-w-sm mx-4"
        style={{ border: '1px solid rgba(212,160,122,0.15)' }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
            style={{ background: 'rgba(212,160,122,0.08)', border: '1px solid rgba(212,160,122,0.15)' }}>
            <Shield size={20} className="text-rose-gold/70" />
          </div>
          <CharSplitText
            text="Admin Erişimi"
            className="block font-display text-xl text-white/70 mb-1"
            staggerDelay={0.04}
          />
          <p className="text-white/20 text-xs font-mono tracking-widest">
            Yönetici şifresi gerekli
          </p>
        </div>

        {attemptsLeft < 3 && (
          <motion.div
            className="mb-4 px-3 py-2 rounded-xl text-center"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-red-400/60 text-xs font-mono">
              {attemptsLeft} deneme hakkın kaldı
            </p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <motion.input
              type={showPass ? 'text' : 'password'}
              value={pass}
              onChange={e => setPass(e.target.value)}
              placeholder="Şifre"
              className="luxury-input w-full px-4 py-3 rounded-xl pr-10 text-sm text-center tracking-widest"
              animate={error ? { x: [-6, 6, -4, 4, 0] } : {}}
              transition={{ duration: 0.3 }}
              autoFocus
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
              onClick={() => setShowPass(v => !v)}
            >
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                className="text-center text-red-400/60 text-xs font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Hatalı şifre
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            className="luxury-btn w-full py-3 rounded-xl text-sm tracking-widest uppercase font-mono transition-all"
            style={{
              background: 'rgba(212,160,122,0.12)',
              border: '1px solid rgba(212,160,122,0.25)',
              color: 'rgba(245,240,235,0.7)',
            }}
          >
            <Lock size={12} className="inline mr-2" />
            Giriş
          </button>
        </form>
      </motion.div>
    </motion.div>
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
    { key: 'upload', label: 'Yükle', icon: Upload },
    { key: 'photos', label: 'Anılar', icon: List },
    { key: 'stats', label: 'İstatistik', icon: BarChart2 },
    { key: 'face', label: 'Yüz', icon: Scan },
  ]

  return (
    <div className="relative w-full h-full overflow-hidden bg-void-2">
      {/* Subtle background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-5 blur-[80px]"
          style={{ background: 'radial-gradient(circle, #c8b4e8 0%, transparent 70%)' }} />
      </div>

      {/* Header */}
      <motion.header
        className="relative z-20 flex items-center justify-between px-4 md:px-6 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <motion.button
            className="glass p-2 rounded-xl text-white/40 hover:text-white/70 transition-colors"
            onClick={handleBack}
            whileHover={{ scale: 1.08, x: -2 }}
            whileTap={{ scale: 0.92 }}
          >
            <ArrowLeft size={16} />
          </motion.button>
          <div>
            <h1 className="text-shimmer font-display font-bold tracking-wide">Creative Studio</h1>
            <p className="text-white/20 text-xs font-mono tracking-widest uppercase">Admin Panel</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400/60 animate-pulse" />
          <span className="text-white/20 text-xs font-mono">Admin</span>
        </div>
      </motion.header>

      {/* Tabs */}
      <div className="relative z-10 flex gap-1 px-4 md:px-6 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs tracking-widest uppercase font-mono transition-all ${
              activeTab === key
                ? 'text-rose-gold bg-rose-gold/10 border border-rose-gold/20'
                : 'text-white/25 hover:text-white/50'
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="phase-scroll" style={{ height: 'calc(100% - 118px)' }}>
        <div className="px-4 md:px-6 py-5 pb-16">
          <AnimatePresence mode="wait">

            {activeTab === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-white/30 text-xs font-mono tracking-widest uppercase mb-4">
                  Fotoğraf Yükle
                </p>
                <DropZone />
              </motion.div>
            )}

            {activeTab === 'photos' && (
              <motion.div
                key="photos"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-white/30 text-xs font-mono tracking-widest uppercase">
                    Anı Arşivi
                  </p>
                  <span className="text-rose-gold/50 text-xs font-mono">
                    {(state.photos || []).length} fotoğraf
                  </span>
                </div>
                <PhotoTable />
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-white/30 text-xs font-mono tracking-widest uppercase mb-4">
                  Telemetri & İstatistikler
                </p>
                <TelemetryCharts />
              </motion.div>
            )}

            {activeTab === 'face' && (
              <motion.div
                key="face"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-white/30 text-xs font-mono tracking-widest uppercase mb-4">
                  Yüz Tanıma Ayarları
                </p>
                <FaceEnrollment />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
