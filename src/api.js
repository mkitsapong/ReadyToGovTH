import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore/lite";
import { db } from "./firebase.js";

const OFFLINE_JOBS_KEY = "readytogov_offline_jobs";
const OFFLINE_BOOKS_KEY = "readytogov_offline_books";

// --- JOBS API ---
export const fetchJobs = async () => {
  try {
    const snapshot = await getDocs(collection(db, "jobs_live"));
    const jobs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter out jobs that have passed their deadline
    const activeJobs = jobs.filter(job => {
      if (!job.deadline) return true;
      const deadlineDate = new Date(job.deadline);
      return deadlineDate >= today;
    });

    // Cache latest snapshot to LocalStorage for Offline Reading
    try {
      localStorage.setItem(OFFLINE_JOBS_KEY, JSON.stringify(activeJobs));
    } catch (e) {
      console.debug("Failed to cache jobs offline:", e);
    }

    return activeJobs;
  } catch (error) {
    console.warn("Firestore fetchJobs failed (possibly offline). Attempting offline cache fallback...", error);
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
    throw error;
  }
};

export const addJob = async (newJob) => {
  const jobData = { ...newJob };
  delete jobData.id; // Don't save mock/temporary ID to Firestore
  const docRef = await addDoc(collection(db, "jobs_live"), jobData);
  return { id: docRef.id, ...jobData };
};

export const updateJob = async (updatedJob) => {
  const { id, ...jobData } = updatedJob;
  const jobRef = doc(db, "jobs_live", id);
  await updateDoc(jobRef, jobData);
  return updatedJob;
};

export const deleteJob = async (jobId) => {
  await deleteDoc(doc(db, "jobs_live", jobId));
  return jobId;
};

// --- BOOKS API ---
export const fetchBooks = async () => {
  try {
    const snapshot = await getDocs(collection(db, "books_live"));
    const books = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

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
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (cacheErr) {
      console.error("Failed to read cached books:", cacheErr);
    }
    throw error;
  }
};

export const addBook = async (newBook) => {
  const bookData = { ...newBook };
  delete bookData.id;
  const docRef = await addDoc(collection(db, "books_live"), bookData);
  return { id: docRef.id, ...bookData };
};

export const updateBook = async (updatedBook) => {
  const { id, ...bookData } = updatedBook;
  const bookRef = doc(db, "books_live", id);
  await updateDoc(bookRef, bookData);
  return updatedBook;
};

export const deleteBook = async (bookId) => {
  await deleteDoc(doc(db, "books_live", bookId));
  return bookId;
};
