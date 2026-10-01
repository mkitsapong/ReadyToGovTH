import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore/lite";

// Default Production Firebase config (Firebase client API keys are public client identifiers)
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyD1nVRVmbSSl2z2GAuJ6yEDnKa67BrjgT8",
  authDomain: "readytogovth-app.firebaseapp.com",
  projectId: "readytogovth-app",
  storageBucket: "readytogovth-app.firebasestorage.app",
  messagingSenderId: "898699648817",
  appId: "1:898699648817:web:69d42ba1f98f09ca065a10",
  measurementId: "G-XPWZC3MKCL",
};

// Firebase config — reads from .env (VITE_FIREBASE_*) if provided, otherwise uses production defaults
const env = (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env : {};
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes("your_") &&
  !firebaseConfig.projectId.includes("your_")
);

if (!isFirebaseConfigured) {
  console.warn(
    "⚠️ Firebase config is missing or unconfigured. The app will run in local demo preview mode with sample data."
  );
}

// Initialize Firebase Core & Firestore Lite safely
const safeConfig = isFirebaseConfigured
  ? firebaseConfig
  : { apiKey: "demo-dummy-key", projectId: "demo-readytogov" };

export const app = getApps().length > 0 ? getApps()[0] : initializeApp(safeConfig);
export const db = getFirestore(app);
