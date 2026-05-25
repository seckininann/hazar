import {
  collection, doc, setDoc, deleteDoc, updateDoc,
  query, orderBy, onSnapshot,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage, isFirebaseConfigured } from './firebase.js'

const COL = 'photos'

/** Upload a File to Storage, save metadata to Firestore. Returns the download URL. */
export async function uploadPhotoFile(file, metadata) {
  if (!isFirebaseConfigured) return null
  const storageRef = ref(storage, `photos/${metadata.id}`)
  await uploadBytes(storageRef, file)
  const url = await getDownloadURL(storageRef)
  await setDoc(doc(db, COL, metadata.id), {
    id:        metadata.id,
    url,
    src:       url,
    caption:   metadata.caption || '',
    date:      metadata.date || '',
    scratch:   metadata.scratch || false,
    createdAt: Date.now(),
  })
  return url
}

/** Upload a base64 data-URL (legacy / small images). */
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
  if (!isFirebaseConfigured) return
  await deleteDoc(doc(db, COL, photoId))
  try { await deleteObject(ref(storage, `photos/${photoId}`)) } catch {}
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
