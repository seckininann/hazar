import { useState, useEffect, useCallback } from 'react'

export function useMousePosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isTouch, setIsTouch] = useState(false)

  const handleMouseMove = useCallback((e) => {
    setPosition({ x: e.clientX, y: e.clientY })
  }, [])

  const handleTouchMove = useCallback((e) => {
    const touch = e.touches[0]
    if (touch) {
      setIsTouch(true)
      setPosition({ x: touch.clientX, y: touch.clientY })
    }
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [handleMouseMove, handleTouchMove])

  return { ...position, isTouch }
}
