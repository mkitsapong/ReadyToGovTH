import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase.js";

// --- JOBS API ---
export const fetchJobs = async () => {
  let snapshot = await getDocs(collection(db, "jobs_live"));
  const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Auto-delete jobs that have passed their deadline
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const validJobs = [];
  for (const job of jobs) {
    let isValid = true;
    if (job.deadline) {
      const deadlineDate = new Date(job.deadline);
      if (deadlineDate < today) {
        isValid = false;
        // Delete expired job from Firestore
        await deleteDoc(doc(db, "jobs_live", job.id));
      }
    }
    if (isValid) {
      validJobs.push(job);
    }
  }

  // Sort by postedDate (newest first) or leave as is
  return validJobs;
};

export const addJob = async (newJob) => {
  const { id, ...jobData } = newJob; // Don't save mock ID
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
  let snapshot = await getDocs(collection(db, "books_live"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addBook = async (newBook) => {
  const { id, ...bookData } = newBook;
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
