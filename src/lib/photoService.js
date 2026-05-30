import {
  collection, doc, setDoc, deleteDoc, updateDoc,
  query, orderBy, onSnapshot,
} from 'firebase/firestore'
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage, isFirebaseConfigured } from './firebase.js'

const COL = 'photos'

const CLD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
export const isCloudinaryConfigured = Boolean(CLD_NAME && CLD_PRESET)

/** Upload a File to Cloudinary (if configured) or Firebase Storage, then save metadata to Firestore. Returns the URL. */
export async function uploadPhotoFile(file, metadata) {
  // Prefer Cloudinary to avoid dependency on Firebase Storage bucket availability
  if (isCloudinaryConfigured) {
    // Use XHR for wider iOS/Safari compatibility
    const uploadToCloudinary = () => new Promise((resolve, reject) => {
      try{
        const form = new FormData()
        form.append('file', file)
        form.append('upload_preset', CLD_PRESET)
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLD_NAME}/upload`)
        xhr.timeout = 25000
        xhr.onload = () => {
          let data=null
          try{ data = JSON.parse(xhr.responseText) }catch{ /* ignore */ }
          if (xhr.status >= 200 && xhr.status < 300 && data) resolve(data)
          else reject(new Error(data?.error?.message || `Cloudinary upload failed (${xhr.status})`))
        }
        xhr.onerror = () => reject(new Error('Cloudinary network error'))
        xhr.ontimeout = () => reject(new Error('Cloudinary timeout'))
        xhr.send(form)
      }catch(err){ reject(err) }
    })

    const data = await uploadToCloudinary()
    const url = data.secure_url || data.url

    await setDoc(doc(db, COL, metadata.id), {
      id:        metadata.id,
      url,
      src:       url,
      caption:   metadata.caption || '',
      date:      metadata.date || '',
      scratch:   metadata.scratch || false,
      createdAt: Date.now(),
      storagePath: data.public_id || '',
    })

    return url
  }

  // Fallback: Firebase Storage
  if (!isFirebaseConfigured || !storage) throw new Error('Firebase not configured')
  const path = `photos/${metadata.id}_${file.name}`
  const ref  = sRef(storage, path)
  await uploadBytes(ref, file)
  const url = await getDownloadURL(ref)

  await setDoc(doc(db, COL, metadata.id), {
    id:        metadata.id,
    url,
    src:       url,
    caption:   metadata.caption || '',
    date:      metadata.date || '',
    scratch:   metadata.scratch || false,
    createdAt: Date.now(),
    storagePath: path,
  })

  return url
}

/** Save base64 metadata to Firestore (fallback when no Cloudinary). */
export async function uploadPhotoBase64(metadata) {
  if (!isFirebaseConfigured) return null
  await setDoc(doc(db, COL, metadata.id), {
    id:        metadata.id,
    url:       metadata.src,
    src:       metadata.src,
    caption:   metadata.caption || '',
    date:      metadata.date || '',
    scratch:   metadata.scratch || false,
    createdAt: Date.now(),
  })
  return metadata.src
}

export async function deletePhoto(photoId) {
  if (isFirebaseConfigured) {
    await deleteDoc(doc(db, COL, photoId))
  }
}

export async function updateCaption(photoId, caption) {
  if (!isFirebaseConfigured) return
  await updateDoc(doc(db, COL, photoId), { caption })
}

/** Subscribe to the photos collection. Returns an unsubscribe function. */
export function subscribePhotos(callback) {
  if (!isFirebaseConfigured) return () => {}
  const q = query(collection(db, COL), orderBy('createdAt'))
  return onSnapshot(q, snap => callback(snap.docs.map(d => d.data())))
}
