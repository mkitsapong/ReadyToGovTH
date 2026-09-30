import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore/lite";
import { db, isFirebaseConfigured } from "./firebase.js";
import { SAMPLE_JOBS, SAMPLE_BOOKS } from "./data/sampleJobs.js";

const OFFLINE_JOBS_KEY = "readytogov_offline_jobs";
const OFFLINE_BOOKS_KEY = "readytogov_offline_books";

// --- JOBS API ---
export const fetchJobs = async () => {
  // If Firebase credentials are not provided in .env, fall back to sample jobs
  if (!isFirebaseConfigured) {
    console.info("💡 Firebase config missing in .env. Serving sample jobs for local development preview.");
    return SAMPLE_JOBS;
  }

  try {
    const snapshot = await getDocs(collection(db, "jobs_live"));
    const jobs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

    // If Firestore is empty (0 docs), provide sample jobs so the UI isn't completely blank
    if (jobs.length === 0) {
      return SAMPLE_JOBS;
    }

    // Cache latest snapshot to LocalStorage for Offline Reading
    try {
      localStorage.setItem(OFFLINE_JOBS_KEY, JSON.stringify(jobs));
    } catch (e) {
      console.debug("Failed to cache jobs offline:", e);
    }

    return jobs;
  } catch (error) {
    console.warn("Firestore fetchJobs failed (possibly offline or invalid config). Attempting offline cache fallback...", error);
    try {
      const cached = localStorage.getItem(OFFLINE_JOBS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.info("Serving jobs from offline storage cache (PWA Offline Mode)");
          return parsed;
        }
      }
    } catch (cacheErr) {
      console.error("Failed to read cached jobs:", cacheErr);
    }

    // Fallback to sample data instead of hard-failing with a blank error screen
    console.info("Serving sample jobs fallback for smooth development experience.");
    return SAMPLE_JOBS;
  }
};

export const addJob = async (newJob) => {
  const jobData = { ...newJob };
  delete jobData.id; // Don't save mock/temporary ID to Firestore
  if (!isFirebaseConfigured) {
    return { id: String(Date.now()), ...jobData };
  }
  const docRef = await addDoc(collection(db, "jobs_live"), jobData);
  return { id: docRef.id, ...jobData };
};

export const updateJob = async (updatedJob) => {
  if (!isFirebaseConfigured) {
    return updatedJob;
  }
  const { id, ...jobData } = updatedJob;
  const jobRef = doc(db, "jobs_live", id);
  await updateDoc(jobRef, jobData);
  return updatedJob;
};

export const deleteJob = async (jobId) => {
  if (!isFirebaseConfigured) {
    return jobId;
  }
  await deleteDoc(doc(db, "jobs_live", jobId));
  return jobId;
};

// --- BOOKS API ---
export const fetchBooks = async () => {
  if (!isFirebaseConfigured) {
    return SAMPLE_BOOKS;
  }

  try {
    const snapshot = await getDocs(collection(db, "books_live"));
    const books = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

    if (books.length === 0) {
      return SAMPLE_BOOKS;
    }

    // Cache latest snapshot to LocalStorage for Offline Reading
    try {
      localStorage.setItem(OFFLINE_BOOKS_KEY, JSON.stringify(books));
    } catch (e) {
      console.debug("Failed to cache books offline:", e);
    }

    return books;
  } catch (error) {
    console.warn("Firestore fetchBooks failed. Attempting offline cache fallback...", error);
    try {
      const cached = localStorage.getItem(OFFLINE_BOOKS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (cacheErr) {
      console.error("Failed to read cached books:", cacheErr);
    }
    return SAMPLE_BOOKS;
  }
};

export const addBook = async (newBook) => {
  const bookData = { ...newBook };
  delete bookData.id;
  if (!isFirebaseConfigured) {
    return { id: String(Date.now()), ...bookData };
  }
  const docRef = await addDoc(collection(db, "books_live"), bookData);
  return { id: docRef.id, ...bookData };
};

export const updateBook = async (updatedBook) => {
  if (!isFirebaseConfigured) {
    return updatedBook;
  }
  const { id, ...bookData } = updatedBook;
  const bookRef = doc(db, "books_live", id);
  await updateDoc(bookRef, bookData);
  return updatedBook;
};

export const deleteBook = async (bookId) => {
  if (!isFirebaseConfigured) {
    return bookId;
  }
  await deleteDoc(doc(db, "books_live", bookId));
  return bookId;
};
