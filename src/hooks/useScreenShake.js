import { useState, useCallback } from 'react'

export function useScreenShake() {
  const [shaking, setShaking] = useState(false)

  const shake = useCallback((duration = 600) => {
    setShaking(true)
    if (navigator.vibrate) navigator.vibrate([30, 20, 30, 20, 50])
    setTimeout(() => setShaking(false), duration)
  }, [])

  return { shaking, shake }
}
