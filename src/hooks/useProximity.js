import { useState, useEffect, useRef, useCallback } from 'react'

export function useProximity(threshold = 150) {
  const ref = useRef(null)
  const [proximity, setProximity] = useState(0)
  const [glowIntensity, setGlowIntensity] = useState(0)

  const handleMouseMove = useCallback((e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const dx = e.clientX - centerX
    const dy = e.clientY - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const normalizedProximity = Math.max(0, 1 - distance / threshold)
    setProximity(normalizedProximity)
    setGlowIntensity(normalizedProximity)
  }, [threshold])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  const glowStyle = {
    boxShadow: glowIntensity > 0
      ? `0 0 ${glowIntensity * 30}px rgba(212,160,122,${glowIntensity * 0.6}), 0 0 ${glowIntensity * 60}px rgba(212,160,122,${glowIntensity * 0.2})`
      : 'none',
    transition: 'box-shadow 0.1s ease',
  }

  return { ref, proximity, glowIntensity, glowStyle }
}
