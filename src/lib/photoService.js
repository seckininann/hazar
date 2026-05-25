import {
  collection, doc, setDoc, deleteDoc, updateDoc,
  query, orderBy, onSnapshot,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase.js'

const COL = 'photos'

const CLD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
export const isCloudinaryConfigured = Boolean(CLD_NAME && CLD_PRESET)

/** Upload a File to Cloudinary, save metadata to Firestore. Returns the download URL. */
export async function uploadPhotoFile(file, metadata) {
  let url = null

  if (isCloudinaryConfigured) {
    const form = new FormData()
    form.append('file', file)
    form.append('upload_preset', CLD_PRESET)
    form.append('public_id', metadata.id)
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLD_NAME}/image/upload`, {
      method: 'POST', body: form,
    })
    const json = await res.json()
    url = json.secure_url
  }

  if (isFirebaseConfigured) {
    await setDoc(doc(db, COL, metadata.id), {
      id:        metadata.id,
      url:       url || metadata.src,
      src:       url || metadata.src,
      caption:   metadata.caption || '',
      date:      metadata.date || '',
      scratch:   metadata.scratch || false,
      createdAt: Date.now(),
    })
  }

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
  if (isCloudinaryConfigured) {
    await fetch(`https://api.cloudinary.com/v1_1/${CLD_NAME}/image/destroy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_id: photoId, upload_preset: CLD_PRESET }),
    }).catch(() => {})
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
