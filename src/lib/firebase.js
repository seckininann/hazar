import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// HARDCODED CONFIGURATION TO BYPASS ENV CACHE ISSUES
const cfg = {
  apiKey:            "AIzaSyBhr5qQUt5jvgBJt-uUf_hsXliueFYkkVE",
  authDomain:        "hazarpreset.firebaseapp.com",
  projectId:         "hazarpreset",
  storageBucket:     "hazarpreset.firebasestorage.app",
  messagingSenderId: "836953643416",
  appId:             "1:836953643416:web:7ec2010093d83544b933ed",
}

export const isFirebaseConfigured = true

let db = null
let storage = null

try {
  const app = initializeApp(cfg)
  db = getFirestore(app)
  storage = getStorage(app)
} catch (error) {
  console.error("Firebase init error:", error)
}

export { db, storage }
