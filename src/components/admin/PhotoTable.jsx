import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Edit3, Check, X, Eye, Star } from 'lucide-react'
import { useAppState } from '../../store/appState.jsx'

export default function PhotoTable() {
  const { state, dispatch } = useAppState()
  const photos = state.photos || []
  const [editingId, setEditingId] = useState(null)
  const [editCaption, setEditCaption] = useState('')
  const [previewId, setPreviewId] = useState(null)
  const [coverId, setCoverId] = useState(() => localStorage.getItem('hazar_hero_bg'))

  const setAsCover = useCallback((photo) => {
    const src = photo.src || photo.url || photo.dataUrl
    if (!src) return
    localStorage.setItem('hazar_hero_bg', src)
    setCoverId(src)
    if (navigator.vibrate) navigator.vibrate([20, 10, 40])
  }, [])

  const startEdit = useCallback((photo) => {
    setEditingId(photo.id)
    setEditCaption(photo.caption || '')
  }, [])

  const commitEdit = useCallback(() => {
    if (!editingId) return
    dispatch({ type: 'UPDATE_PHOTO_CAPTION', payload: { id: editingId, caption: editCaption } })
    setEditingId(null)
  }, [editingId, editCaption, dispatch])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditCaption('')
  }, [])

  const handleDelete = useCallback((id) => {
    dispatch({ type: 'DELETE_PHOTO', payload: id })
    if (navigator.vibrate) navigator.vibrate(30)
  }, [dispatch])

  if (!photos.length) {
    return (
      <div className="text-center py-10 text-white/20 text-sm font-mono tracking-widest">
        Henüz fotoğraf yok
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Preview lightbox */}
      <AnimatePresence>
        {previewId && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewId(null)}
          >
            <motion.img
              src={photos.find(p => p.id === previewId)?.src}
              alt="preview"
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={e => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 glass p-2 rounded-full text-white/60 hover:text-white"
              onClick={() => setPreviewId(null)}
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {photos.map((photo, i) => (
        <motion.div
          key={photo.id}
          className="flex items-center gap-3 glass rounded-xl p-3"
          style={{ border: '1px solid rgba(255,255,255,0.04)' }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          layout
        >
          {/* Thumbnail */}
          <div
            className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
            onClick={() => setPreviewId(photo.id)}
          >
            <img src={photo.src} alt="" className="w-full h-full object-cover" />
          </div>

          {/* Caption */}
          <div className="flex-1 min-w-0">
            {editingId === photo.id ? (
              <input
                type="text"
                value={editCaption}
                onChange={e => setEditCaption(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
                className="luxury-input w-full px-2 py-1 rounded-lg text-xs"
                autoFocus
              />
            ) : (
              <>
                <p className="text-warm-white/70 text-sm font-display italic truncate">
                  {photo.caption || 'Açıklama yok'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-white/20 text-xs font-mono">{photo.date || ''}</span>
                  {photo.scratch && (
                    <span className="text-rose-gold/40 text-xs font-mono">· kazı-kazı</span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {editingId === photo.id ? (
              <>
                <button onClick={commitEdit} className="p-1.5 rounded-lg hover:bg-green-500/10 text-green-400/60 hover:text-green-400 transition-all">
                  <Check size={13} />
                </button>
                <button onClick={cancelEdit} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-all">
                  <X size={13} />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setPreviewId(photo.id)} className="p-1.5 rounded-lg glass hover:bg-white/5 text-white/30 hover:text-white/60 transition-all">
                  <Eye size={13} />
                </button>
                <button
                  onClick={() => setAsCover(photo)}
                  className="p-1.5 rounded-lg glass hover:bg-yellow-500/10 transition-all"
                  style={{ color: coverId === (photo.src || photo.url || photo.dataUrl) ? 'rgba(251,191,36,0.8)' : 'rgba(255,255,255,0.25)' }}
                  title="Kapak fotoğrafı yap">
                  <Star size={13} fill={coverId === (photo.src || photo.url || photo.dataUrl) ? 'currentColor' : 'none'} />
                </button>
                <button onClick={() => startEdit(photo)} className="p-1.5 rounded-lg glass hover:bg-white/5 text-white/30 hover:text-white/60 transition-all">
                  <Edit3 size={13} />
                </button>
                <button onClick={() => handleDelete(photo.id)} className="p-1.5 rounded-lg glass hover:bg-red-500/10 text-white/30 hover:text-red-400/60 transition-all">
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
