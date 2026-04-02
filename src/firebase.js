import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
}

// Only initialize when config is filled in
const isConfigured = Object.values(firebaseConfig).every(v => v !== "")
const app = isConfigured ? initializeApp(firebaseConfig) : null
export const db = isConfigured ? getDatabase(app) : null
