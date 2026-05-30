import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase.js'

const SETTINGS_DOC = 'settings/content'

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
