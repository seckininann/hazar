import React, { useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react'
import WaveVisualizer from './WaveVisualizer.jsx'
import LyricEngine from './LyricEngine.jsx'
import { useAppState } from '../../store/appState.jsx'

export default function AudioPlayer() {
  const { dispatch } = useAppState()
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [audioError, setAudioError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onLoaded = () => {
      setLoaded(true)
      setDuration(audio.duration || 0)
    }
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      dispatch({ type: 'SET_AUDIO_TIME', payload: audio.currentTime })
    }
    const onEnded = () => {
      setPlaying(false)
      dispatch({ type: 'SET_AUDIO_PLAYING', payload: false })
    }
    const onError = () => setAudioError(true)

    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('canplaythrough', onLoaded)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    audio.volume = volume

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('canplaythrough', onLoaded)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio || audioError) return
    if (playing) {
      audio.pause()
      setPlaying(false)
      dispatch({ type: 'SET_AUDIO_PLAYING', payload: false })
    } else {
      audio.play().then(() => {
        setPlaying(true)
        dispatch({ type: 'SET_AUDIO_PLAYING', payload: true })
      }).catch(() => setAudioError(true))
    }
  }, [playing, audioError, dispatch])

  const toggleMute = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = !muted
    setMuted(v => !v)
  }, [muted])

  const handleSeek = useCallback((e) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audio.currentTime = ratio * duration
    setCurrentTime(ratio * duration)
  }, [duration])

  const handleVolumeChange = useCallback((e) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
  }, [])

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progressRatio = duration > 0 ? currentTime / duration : 0

  return (
    <div className="w-full">
      <audio ref={audioRef} src="/assets/our-voice.mp3" preload="metadata" />

      {/* Lyric display */}
      <LyricEngine audioTime={currentTime} />

      {/* Waveform */}
      <div className="my-3 opacity-80">
        <WaveVisualizer playing={playing} audioTime={currentTime} />
      </div>

      {/* Progress bar */}
      <div
        className="relative h-1.5 bg-white/5 rounded-full cursor-pointer overflow-hidden mb-3 group"
        onClick={handleSeek}
      >
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: `${progressRatio * 100}%`,
            background: 'linear-gradient(90deg, #d4a07a, #c8b4e8)',
          }}
        />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-transparent to-white/5" />
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-white/30 text-xs font-mono tabular-nums w-10">
          {formatTime(currentTime)}
        </span>

        {/* Play/Pause */}
        <motion.button
          className="relative flex items-center justify-center w-11 h-11 rounded-full"
          style={{
            background: 'linear-gradient(135deg, rgba(212,160,122,0.25), rgba(200,180,232,0.15))',
            border: '1px solid rgba(212,160,122,0.3)',
          }}
          onClick={togglePlay}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          data-cursor="heart"
        >
          {audioError ? (
            <Music size={16} className="text-white/30" />
          ) : playing ? (
            <Pause size={16} className="text-rose-gold" />
          ) : (
            <Play size={16} className="text-rose-gold ml-0.5" />
          )}
          {playing && (
            <motion.div
              className="absolute inset-0 rounded-full border border-rose-gold/30"
              animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          )}
        </motion.button>

        {/* Volume */}
        <div className="flex items-center gap-2 flex-1">
          <button onClick={toggleMute} className="text-white/30 hover:text-white/60 transition-colors">
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <input
            type="range"
            min="0" max="1" step="0.02"
            value={muted ? 0 : volume}
            onChange={handleVolumeChange}
            className="flex-1 h-1 accent-rose-gold appearance-none bg-white/10 rounded-full cursor-pointer"
          />
        </div>

        <span className="text-white/20 text-xs font-mono tabular-nums w-10 text-right">
          {formatTime(duration)}
        </span>
      </div>

      {audioError && (
        <p className="text-center text-white/20 text-xs mt-2 font-mono tracking-widest">
          /assets/our-voice.mp3 dosyasını ekle
        </p>
      )}
    </div>
  )
}
