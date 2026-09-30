import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore/lite";

// Firebase config — all values MUST be provided via .env (VITE_FIREBASE_*)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes("your_") &&
  !firebaseConfig.projectId.includes("your_")
);

if (!isFirebaseConfigured) {
  console.warn(
    "⚠️ Firebase config is missing or unconfigured in .env. The app will run in local demo preview mode with sample data. See .env.example to connect your real Firebase project."
  );
}

// Initialize Firebase Core & Firestore Lite safely
const safeConfig = isFirebaseConfigured
  ? firebaseConfig
  : { apiKey: "demo-dummy-key", projectId: "demo-readytogov" };

export const app = getApps().length > 0 ? getApps()[0] : initializeApp(safeConfig);
export const db = getFirestore(app);
