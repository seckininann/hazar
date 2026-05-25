import * as faceapi from 'face-api.js'
import { useState, useEffect, useCallback, useRef } from 'react'

const MODEL_URL = '/models'
const STORAGE_KEY = 'hazar_face_descriptors'

// Singleton — models only load once across all component instances
let _loaded = false
let _loadPromise = null

async function ensureModels() {
  if (_loaded) return
  if (_loadPromise) return _loadPromise
  _loadPromise = Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]).then(() => { _loaded = true })
  return _loadPromise
}

export function useFaceRecognition() {
  const [modelsLoaded, setModelsLoaded] = useState(_loaded)
  const [hasEnrolled, setHasEnrolled] = useState(
    () => !!localStorage.getItem(STORAGE_KEY)
  )

  useEffect(() => {
    if (_loaded) { setModelsLoaded(true); return }
    ensureModels().then(() => setModelsLoaded(true)).catch(console.error)
  }, [])

  // Enroll: extract descriptors from uploaded image files and save to localStorage
  const enrollFaces = useCallback(async (imageFiles) => {
    if (!_loaded) return 0
    const descriptors = []
    for (const file of imageFiles) {
      try {
        const img = await faceapi.bufferToImage(file)
        const det = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 }))
          .withFaceLandmarks(true)
          .withFaceDescriptor()
        if (det) descriptors.push(Array.from(det.descriptor))
      } catch (e) {
        console.warn('Could not process image:', e)
      }
    }
    if (descriptors.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(descriptors))
      setHasEnrolled(true)
    }
    return descriptors.length
  }, [])

  const clearEnrollment = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setHasEnrolled(false)
  }, [])

  // Recognize: compare a single video frame against saved descriptors
  // Returns: 'matched' | 'no_face' | 'no_match' | 'no_reference'
  const recognizeFrame = useCallback(async (videoEl) => {
    if (!_loaded || !videoEl) return 'loading'

    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return 'no_reference'

    const storedDescriptors = JSON.parse(stored).map(d => new Float32Array(d))
    const labeled = [new faceapi.LabeledFaceDescriptors('eda', storedDescriptors)]
    const matcher = new faceapi.FaceMatcher(labeled, 0.52)

    try {
      const det = await faceapi
        .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.45 }))
        .withFaceLandmarks(true)
        .withFaceDescriptor()

      if (!det) return 'no_face'

      const best = matcher.findBestMatch(det.descriptor)
      return best.label === 'eda' ? 'matched' : 'no_match'
    } catch {
      return 'error'
    }
  }, [])

  return { modelsLoaded, hasEnrolled, enrollFaces, clearEnrollment, recognizeFrame }
}
