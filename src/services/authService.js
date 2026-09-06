import { app } from "../firebase.js";

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
 * Dynamically load Firebase Auth and sign in
 */
export async function loginAdmin(email, password) {
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
 * Dynamically load Firebase Auth and sign out
 */
export async function logoutAdmin() {
  const { getAuth, signOut } = await import("firebase/auth");
  const auth = getAuth(app);
  await signOut(auth);
  try {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  } catch (e) {
    console.debug("localStorage remove ignored:", e);
  }
}
