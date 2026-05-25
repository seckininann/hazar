import React, { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, ImagePlus, X, Check, Cloud, HardDrive } from 'lucide-react'
import { useAppState } from '../../store/appState.jsx'
import { uploadPhotoFile, uploadPhotoBase64, isCloudinaryConfigured } from '../../lib/photoService.js'
import { isFirebaseConfigured } from '../../lib/firebase.js'

function generateId() {
  return `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export default function DropZone() {
  const { dispatch } = useAppState()
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [previews, setPreviews] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')

  const processFiles = useCallback((files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!imageFiles.length) return

    setUploading(true)
    let done = 0

    imageFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target.result
        setPreviews(prev => [...prev, { id: generateId(), src: base64, file, name: file.name, caption: '' }])
        done++
        if (done === imageFiles.length) setUploading(false)
      }
      reader.readAsDataURL(file)
    })
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    processFiles(e.dataTransfer.files)
  }, [processFiles])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setDragging(false), [])

  const handleFileInput = useCallback((e) => {
    processFiles(e.target.files)
    e.target.value = ''
  }, [processFiles])

  const updateCaption = useCallback((id, caption) => {
    setPreviews(prev => prev.map(p => p.id === id ? { ...p, caption } : p))
  }, [])

  const removePreview = useCallback((id) => {
    setPreviews(prev => prev.filter(p => p.id !== id))
  }, [])

  const toggleScratch = useCallback((id) => {
    setPreviews(prev => prev.map(p => p.id === id ? { ...p, scratch: !p.scratch } : p))
  }, [])

  const commitAll = useCallback(async () => {
    if (!previews.length) return
    setUploading(true)
    setUploadProgress('')

    for (let i = 0; i < previews.length; i++) {
      const p = previews[i]
      setUploadProgress(`${i + 1} / ${previews.length} yükleniyor...`)
      const metadata = {
        id:      p.id,
        src:     p.src,
        caption: p.caption || 'Bir anı...',
        scratch: p.scratch || false,
        date:    new Date().toLocaleDateString('tr-TR'),
      }

      if (isFirebaseConfigured && p.file) {
        const url = await uploadPhotoFile(p.file, metadata).catch(() => null)
        if (url) {
          dispatch({ type: 'ADD_PHOTO', payload: { ...metadata, src: url, url } })
          continue
        }
      }

      // Fallback: save base64 to Firestore (or just localStorage if no Firebase)
      if (isFirebaseConfigured) {
        await uploadPhotoBase64(metadata).catch(() => {})
      }
      dispatch({ type: 'ADD_PHOTO', payload: metadata })
    }

    setPreviews([])
    setUploading(false)
    setUploadProgress('')
    setUploaded(true)
    if (navigator.vibrate) navigator.vibrate([30, 20, 60])
    setTimeout(() => setUploaded(false), 2500)
  }, [previews, dispatch])

  return (
    <div className="space-y-4">
      {/* Sync status */}
      <div className="flex items-center gap-2 text-xs font-sans px-1">
        {isCloudinaryConfigured && isFirebaseConfigured
          ? <><Cloud size={11} className="text-green-400/60" /><span className="text-green-400/50">Cloudinary + Firestore aktif — tüm cihazlarda görünür</span></>
          : isFirebaseConfigured
            ? <><Cloud size={11} className="text-amber-400/60" /><span className="text-amber-400/50">Sadece Firestore (Cloudinary kurulmadı)</span></>
          : <><HardDrive size={11} className="text-white/20" /><span className="text-white/20">Sadece bu cihazda (bulut kurulmadı)</span></>}
      </div>
      {/* Drop zone */}
      <motion.div
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          dragging
            ? 'border-rose-gold/70 bg-rose-gold/5'
            : 'border-white/10 hover:border-rose-gold/30 hover:bg-white/[0.02]'
        }`}
        animate={dragging ? { scale: 1.01 } : { scale: 1 }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
        <AnimatePresence mode="wait">
          {uploading ? (
            <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div
                className="w-10 h-10 rounded-full border-2 border-rose-gold/50 border-t-rose-gold mx-auto mb-3"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              />
              <p className="text-white/40 text-sm font-mono">{uploadProgress || 'İşleniyor...'}</p>
              {isFirebaseConfigured && <p className="text-rose-gold/40 text-xs font-mono mt-1">☁ buluta yükleniyor</p>}
            </motion.div>
          ) : uploaded ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-3">
                <Check size={20} className="text-green-400" />
              </div>
              <p className="text-green-400/70 text-sm font-mono">Kaydedildi!</p>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(212,160,122,0.08)', border: '1px solid rgba(212,160,122,0.15)' }}>
                <ImagePlus size={22} className="text-rose-gold/60" />
              </div>
              <p className="text-white/50 text-sm font-sans mb-1">Fotoğraf sürükle veya tıkla</p>
              <p className="text-white/20 text-xs font-mono tracking-widest uppercase">PNG · JPG · WEBP · GIF</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Previews */}
      <AnimatePresence>
        {previews.length > 0 && (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-white/30 text-xs font-mono tracking-widest uppercase">
              Önizleme ({previews.length} fotoğraf)
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {previews.map(p => (
                <motion.div
                  key={p.id}
                  className="relative rounded-xl overflow-hidden glass"
                  style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                >
                  <img src={p.src} alt={p.name} className="w-full aspect-square object-cover" />
                  <div className="p-2 space-y-1.5">
                    <input
                      type="text"
                      placeholder="Açıklama..."
                      value={p.caption}
                      onChange={e => updateCaption(p.id, e.target.value)}
                      className="luxury-input w-full px-2 py-1.5 rounded-lg text-xs"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={p.scratch || false}
                          onChange={() => toggleScratch(p.id)}
                          className="w-3 h-3 accent-rose-gold"
                        />
                        <span className="text-white/30 text-xs font-mono">Kazı-Kazı</span>
                      </label>
                      <button
                        onClick={() => removePreview(p.id)}
                        className="text-white/20 hover:text-red-400/60 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              className="luxury-btn w-full py-3 rounded-xl text-sm tracking-[0.2em] uppercase font-sans transition-all flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, rgba(212,160,122,0.25), rgba(200,180,232,0.15))',
                border: '1px solid rgba(212,160,122,0.3)',
                color: 'rgba(245,240,235,0.85)',
              }}
              onClick={commitAll}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <Upload size={14} />
              {previews.length} Fotoğrafı Kaydet
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
