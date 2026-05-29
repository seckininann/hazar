import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { subscribePhotos } from '../lib/photoService.js'
import { isFirebaseConfigured } from '../lib/firebase.js'

export const PHASES = {
  CINEMATIC_INTRO: 'CINEMATIC_INTRO',
  PREMIUM_GATE: 'PREMIUM_GATE',
  MEMORY_UNIVERSE: 'MEMORY_UNIVERSE',
  CREATIVE_STUDIO: 'CREATIVE_STUDIO',
}

const MAIN_PASSWORD = 'hazar'
const ADMIN_PASSWORD = 'kral2024'
const MAX_ADMIN_ATTEMPTS = 3
const LS_KEY_PHASE = 'hazar_app_phase'
const LS_KEY_PHOTOS = 'hazar_app_photos' // used only when Firebase is NOT configured
const LS_KEY_REACTIONS = 'hazar_app_reactions'
const LS_KEY_LOCKED = 'hazar_app_locked'

const initialState = {
  phase: PHASES.CINEMATIC_INTRO,
  isAuthenticated: false,
  isAdminAuthenticated: false,
  adminAttempts: 0,
  isAdminLocked: false,
  photos: [],
  heartBurstCount: 0,
  smileCount: 0,
  shakeCount: 0,
  audioPlaying: false,
  audioTime: 0,
  cursorVariant: 'default',
}

function loadFromLS() {
  try {
    const savedPhotos = isFirebaseConfigured ? [] : JSON.parse(localStorage.getItem(LS_KEY_PHOTOS) || '[]')
    const savedReactions = JSON.parse(localStorage.getItem(LS_KEY_REACTIONS) || '{}')
    const isLocked = localStorage.getItem(LS_KEY_LOCKED) === 'true'
    return {
      // Phase always resets to intro on every page load
      phase: PHASES.CINEMATIC_INTRO,
      photos: Array.isArray(savedPhotos) ? savedPhotos : [],
      heartBurstCount: savedReactions.heartBurstCount || 0,
      smileCount: savedReactions.smileCount || 0,
      shakeCount: savedReactions.shakeCount || 0,
      isAdminLocked: isLocked,
    }
  } catch {
    return {}
  }
}

function saveToLS(state) {
  try {
    if(!isFirebaseConfigured){
      localStorage.setItem(LS_KEY_PHOTOS, JSON.stringify(state.photos))
    }
    localStorage.setItem(LS_KEY_REACTIONS, JSON.stringify({
      heartBurstCount: state.heartBurstCount,
      smileCount: state.smileCount,
      shakeCount: state.shakeCount,
    }))
    localStorage.setItem(LS_KEY_LOCKED, String(state.isAdminLocked))
  } catch {}
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, phase: action.payload }

    case 'COMPLETE_INTRO':
      return { ...state, phase: PHASES.PREMIUM_GATE }

    case 'ATTEMPT_AUTH': {
      const customPw = localStorage.getItem('hazar_custom_password')
      const validPw = customPw || MAIN_PASSWORD
      if (action.payload === validPw) {
        if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 100])
        return { ...state, isAuthenticated: true, phase: PHASES.MEMORY_UNIVERSE }
      }
      if (navigator.vibrate) navigator.vibrate([200])
      return state
    }

    case 'ATTEMPT_ADMIN_AUTH': {
      if (state.isAdminLocked) return state
      if (action.payload === ADMIN_PASSWORD) {
        if (navigator.vibrate) navigator.vibrate([30, 20, 30, 20, 80])
        return {
          ...state,
          isAdminAuthenticated: true,
          adminAttempts: 0,
          phase: PHASES.CREATIVE_STUDIO,
        }
      }
      const newAttempts = state.adminAttempts + 1
      const locked = newAttempts >= MAX_ADMIN_ATTEMPTS
      if (navigator.vibrate) navigator.vibrate(locked ? [300, 100, 300, 100, 300] : [150])
      return {
        ...state,
        adminAttempts: newAttempts,
        isAdminLocked: locked,
      }
    }

    case 'UNLOCK_ADMIN':
      return { ...state, isAdminLocked: false, adminAttempts: 0 }

    case 'EXIT_ADMIN':
      return { ...state, isAdminAuthenticated: false, phase: PHASES.MEMORY_UNIVERSE }

    case 'ADD_PHOTO': {
      const newPhotos = [...state.photos, action.payload]
      return { ...state, photos: newPhotos }
    }

    case 'SYNC_PHOTOS':
      return { ...state, photos: action.payload }

    case 'DELETE_PHOTO': {
      const newPhotos = state.photos.filter(p => p.id !== action.payload)
      return { ...state, photos: newPhotos }
    }

    case 'UPDATE_PHOTO_CAPTION': {
      const newPhotos = state.photos.map(p =>
        p.id === action.payload.id ? { ...p, caption: action.payload.caption } : p
      )
      return { ...state, photos: newPhotos }
    }

    case 'INCREMENT_HEARTS':
      return { ...state, heartBurstCount: state.heartBurstCount + (action.payload || 1) }

    case 'INCREMENT_SMILES':
      return { ...state, smileCount: state.smileCount + 1 }

    case 'INCREMENT_SHAKES':
      return { ...state, shakeCount: state.shakeCount + 1 }

    case 'SET_AUDIO_PLAYING':
      return { ...state, audioPlaying: action.payload }

    case 'SET_AUDIO_TIME':
      return { ...state, audioTime: action.payload }

    case 'SET_CURSOR_VARIANT':
      return { ...state, cursorVariant: action.payload }

    case 'RESET_TO_INTRO':
      return { ...initialState, photos: state.photos }

    default:
      return state
  }
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const lsData = loadFromLS()
  const merged = { ...initialState, ...lsData }

  const [state, dispatch] = useReducer(reducer, merged)

  useEffect(() => {
    saveToLS(state)
  }, [state.phase, state.photos, state.heartBurstCount, state.smileCount, state.shakeCount, state.isAdminLocked])

  useEffect(() => {
    if (!isFirebaseConfigured) return
    const unsub = subscribePhotos(photos => {
      dispatch({ type: 'SYNC_PHOTOS', payload: photos })
    })
    return unsub
  }, [])

  return (
    <AppContext.Provider value={{ state, dispatch, PHASES, MAIN_PASSWORD, ADMIN_PASSWORD }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState must be used inside AppProvider')
  return ctx
}
