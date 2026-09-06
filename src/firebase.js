import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore/lite";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD1nVRVmbSSl2z2GAuJ6yEDnKa67BrjgT8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "readytogovth-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "readytogovth-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "readytogovth-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "898699648817",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:898699648817:web:69d42ba1f98f09ca065a10",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XPWZC3MKCL",
};

// Initialize Firebase Core & Firestore Lite (ultra-lightweight, no heavy realtime/offline engine)
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
