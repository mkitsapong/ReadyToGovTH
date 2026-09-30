import { app, isFirebaseConfigured } from "../firebase.js";

const ADMIN_STORAGE_KEY = "readytogov_admin_logged_in";

/**
 * Check if the browser has previously signed in as admin,
 * so we avoid loading Firebase Auth for 99.9% of regular public users.
 */
export function shouldCheckAdminAuth() {
  try {
    if (localStorage.getItem(ADMIN_STORAGE_KEY) === "1") return true;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("firebase:authUser")) return true;
    }
  } catch (e) {
    console.warn("Storage check failed:", e);
  }
  return false;
}

/**
 * Dynamically load Firebase Auth and subscribe to state changes
 */
export async function subscribeToAuthState(onUserChanged) {
  // If in local demo mode without real Firebase credentials
  if (!isFirebaseConfigured) {
    if (localStorage.getItem(ADMIN_STORAGE_KEY) === "1") {
      onUserChanged({ email: "admin@readytogov.th", displayName: "Demo Admin" });
    } else {
      onUserChanged(null);
    }
    return () => {};
  }

  try {
    const { getAuth, onAuthStateChanged } = await import("firebase/auth");
    const auth = getAuth(app);

    return onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        try {
          localStorage.setItem(ADMIN_STORAGE_KEY, "1");
        } catch (e) {
          console.debug("localStorage write ignored:", e);
        }
      } else {
        try {
          localStorage.removeItem(ADMIN_STORAGE_KEY);
        } catch (e) {
          console.debug("localStorage remove ignored:", e);
        }
      }
      onUserChanged(currentUser);
    });
  } catch (error) {
    console.error("Failed to load Firebase Auth:", error);
    onUserChanged(null);
    return () => {};
  }
}

/**
 * Sign in as Admin.
 * Supports real Firebase Auth or instant Local Dev Admin if .env is unconfigured.
 */
export async function loginAdmin(email, password) {
  // Local Demo Mode
  if (!isFirebaseConfigured) {
    const demoUser = {
      uid: "demo-admin-local",
      email: email || "admin@readytogov.th",
      displayName: "Demo Admin",
    };
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, "1");
    } catch (e) {
      console.debug("localStorage write ignored:", e);
    }
    return demoUser;
  }

  // Real Firebase Auth
  const { getAuth, signInWithEmailAndPassword } = await import("firebase/auth");
  const auth = getAuth(app);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  try {
    localStorage.setItem(ADMIN_STORAGE_KEY, "1");
  } catch (e) {
    console.debug("localStorage write ignored:", e);
  }
  return userCredential.user;
}

/**
 * Sign out Admin
 */
export async function logoutAdmin() {
  try {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  } catch (e) {
    console.debug("localStorage remove ignored:", e);
  }

  if (!isFirebaseConfigured) {
    return;
  }

  try {
    const { getAuth, signOut } = await import("firebase/auth");
    const auth = getAuth(app);
    await signOut(auth);
  } catch (e) {
    console.warn("SignOut error:", e);
  }
}
