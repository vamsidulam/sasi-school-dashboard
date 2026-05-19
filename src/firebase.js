import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const missing = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k)
if (missing.length) {
  console.warn(
    `[firebase] Missing environment variables: ${missing.join(
      ', ',
    )}. Copy .env.example to .env and fill in the values.`,
  )
}

const app = initializeApp(firebaseConfig)

// Named Firestore database for the SASI dashboard. The project's default
// Firestore database holds Anveshana data; SASI dashboard data lives in its
// own database. Override via VITE_FIREBASE_DATABASE_ID for emulator/local runs.
const DATABASE_ID = import.meta.env.VITE_FIREBASE_DATABASE_ID || 'sasi-dashboards'

export const auth = getAuth(app)
export const db = getFirestore(app, DATABASE_ID)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()

export default app
