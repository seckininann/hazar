import React, { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AppProvider, useAppState, PHASES } from './store/appState.jsx'
import CustomCursor from './components/CustomCursor.jsx'
import BeetleScene from './components/beetle/BeetleScene.jsx'
import PasswordGate from './components/phases/PasswordGate.jsx'
import MemoryUniverse from './components/phases/MemoryUniverse.jsx'
import CreativeStudio from './components/phases/CreativeStudio.jsx'
import CameraConsent from './components/CameraConsent.jsx'

const phaseVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

function AppInner() {
  const { state, dispatch } = useAppState()
  const { phase } = state
  const [cameraStream, setCameraStream] = useState(null)
  const [cameraConsented, setCameraConsented] = useState(false)

  const handleCameraConsent = useCallback((stream) => {
    setCameraStream(stream)
    setCameraConsented(true)
  }, [])

  const handleIntroComplete = useCallback(() => {
    dispatch({ type: 'COMPLETE_INTRO' })
  }, [dispatch])

  // Secret admin route: /#admin in the URL
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        dispatch({ type: 'SET_PHASE', payload: PHASES.CREATIVE_STUDIO })
        history.replaceState(null, '', window.location.pathname)
      }
    }
    checkHash()
    window.addEventListener('hashchange', checkHash)
    return () => window.removeEventListener('hashchange', checkHash)
  }, [dispatch])

  return (
    <div className="w-screen h-screen overflow-hidden bg-void relative">
      <CustomCursor />

      {/* Camera consent — shown FIRST, blocks everything underneath */}
      <AnimatePresence>
        {!cameraConsented && (
          <CameraConsent onConsent={handleCameraConsent} />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {phase === PHASES.CINEMATIC_INTRO && cameraConsented && (
          <motion.div
            key="intro"
            className="absolute inset-0"
            variants={phaseVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.6 }}
          >
            <BeetleScene onComplete={handleIntroComplete} />
          </motion.div>
        )}

        {phase === PHASES.PREMIUM_GATE && (
          <motion.div
            key="gate"
            className="absolute inset-0"
            variants={phaseVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.8 }}
          >
            <PasswordGate cameraStream={cameraStream} />
          </motion.div>
        )}

        {phase === PHASES.MEMORY_UNIVERSE && (
          <motion.div
            key="universe"
            className="absolute inset-0"
            variants={phaseVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.6 }}
          >
            <MemoryUniverse />
          </motion.div>
        )}

        {phase === PHASES.CREATIVE_STUDIO && (
          <motion.div
            key="studio"
            className="absolute inset-0"
            variants={phaseVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5 }}
          >
            <CreativeStudio />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
