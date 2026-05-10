import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

import { initializeFirestore, persistentLocalCache } from 'firebase/firestore'
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyC46TP5EkB92pboCqYsdm2Px7fs66fcAuI',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'whiteboardai-93e23.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'whiteboardai-93e23',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'whiteboardai-93e23.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '10585022147',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:10585022147:web:c14b51c3d840c4c7874c76',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-B7BEC4JH19',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://whiteboardai-93e23-default-rtdb.firebaseio.com',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
auth.useDeviceLanguage()
export const db = getDatabase(app)
export const firestore = initializeFirestore(app, { localCache: persistentLocalCache() })

if (firebaseConfig.databaseURL) {
  console.log('[Firebase] Realtime Database URL:', firebaseConfig.databaseURL)
} else {
  console.error('Firebase Realtime Database URL is missing. Check VITE_FIREBASE_DATABASE_URL environment variable.')
}
