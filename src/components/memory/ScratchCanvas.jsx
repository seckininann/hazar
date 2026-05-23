import React, { useRef, useEffect, useState, useCallback } from 'react'

export default function ScratchCanvas({ src, width = 300, height = 200, onRevealed }) {
  const canvasRef = useRef(null)
  const isDrawing = useRef(false)
  const [revealed, setRevealed] = useState(false)
  const [percent, setPercent] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = width
    canvas.height = height

    // Fill scratch-off layer with gradient
    const grad = ctx.createLinearGradient(0, 0, width, height)
    grad.addColorStop(0, '#1a1a26')
    grad.addColorStop(0.5, '#2a1f3d')
    grad.addColorStop(1, '#1a1526')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    // Draw hint text
    ctx.save()
    ctx.globalAlpha = 0.4
    ctx.fillStyle = 'rgba(212,160,122,0.5)'
    ctx.font = `bold 14px Inter, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Kazı Kazı ✨', width / 2, height / 2 - 10)
    ctx.fillText('Anıyı bul', width / 2, height / 2 + 12)
    ctx.restore()
  }, [width, height])

  const scratch = useCallback((x, y) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, 24, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'

    // Check reveal percentage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let transparent = 0
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparent++
    }
    const pct = (transparent / (canvas.width * canvas.height)) * 100
    setPercent(pct)
    if (pct > 60 && !revealed) {
      setRevealed(true)
      onRevealed?.()
      // Clear everything
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [revealed, onRevealed])

  const getPos = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const onMouseDown = (e) => { isDrawing.current = true; const p = getPos(e); scratch(p.x, p.y) }
  const onMouseMove = (e) => { if (isDrawing.current) { const p = getPos(e); scratch(p.x, p.y) } }
  const onMouseUp = () => { isDrawing.current = false }

  return (
    <div className="relative" style={{ width, height }}>
      {/* Revealed image below */}
      <img
        src={src}
        alt="memory"
        className="absolute inset-0 w-full h-full object-cover rounded-xl"
      />
      {/* Scratch layer on top */}
      {!revealed && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 rounded-xl cursor-crosshair touch-none"
          style={{ width: '100%', height: '100%' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onMouseDown}
          onTouchMove={onMouseMove}
          onTouchEnd={onMouseUp}
        />
      )}
      {!revealed && (
        <div className="absolute bottom-2 right-2 text-xs text-white/30 font-mono">
          {Math.round(percent)}%
        </div>
      )}
    </div>
  )
}
