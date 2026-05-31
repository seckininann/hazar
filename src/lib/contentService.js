import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase.js'

const SETTINGS_DOC = 'settings/content'
const AUTH_DOC = 'settings/auth'

export function subscribeAuth(callback) {
  if (!isFirebaseConfigured || !db) return () => {}
  return onSnapshot(doc(db, AUTH_DOC), snap => {
    if (snap.exists()) {
      callback(snap.data())
    }
  })
}

// Simple fetch helpers with safe fallbacks
export async function fetchLoveMessages(){
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, SETTINGS_DOC))
      if (snap.exists() && Array.isArray(snap.data().messages)) {
        return snap.data().messages
      }
    } catch {}
  }
  try{
    const res = await fetch('/api/love-messages')
    if(!res.ok) throw new Error('bad')
    const data = await res.json()
    return Array.isArray(data)?data:[]
  }catch{ return [] }
}

export async function fetchCoverTitle(){
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, SETTINGS_DOC))
      if (snap.exists() && typeof snap.data().coverTitle === 'string') {
        return snap.data().coverTitle
      }
    } catch {}
  }
  try{
    const res = await fetch('/api/cover-title')
    if(!res.ok) throw new Error('bad')
    const data = await res.json()
    return typeof data?.title==='string'?data.title:''
  }catch{ return '' }
}

export async function saveLoveMessages(messages) {
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, SETTINGS_DOC), { messages }, { merge: true })
  }
}

export async function saveCoverTitle(coverTitle) {
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, SETTINGS_DOC), { coverTitle }, { merge: true })
  }
}

export async function saveCustomPassword(pw) {
  localStorage.setItem('hazar_custom_password', pw)
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, AUTH_DOC), { customPassword: pw }, { merge: true })
  }
}

export async function saveFaceDescriptors(descriptors) {
  localStorage.setItem('hazar_face_descriptors', JSON.stringify(descriptors))
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, AUTH_DOC), { faceDescriptors: descriptors }, { merge: true })
  }
}

export async function clearFaceDescriptors() {
  localStorage.removeItem('hazar_face_descriptors')
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, AUTH_DOC), { faceDescriptors: null }, { merge: true })
  }
}
