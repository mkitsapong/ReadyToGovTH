import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase.js";

// --- JOBS API ---
export const fetchJobs = async () => {
  const snapshot = await getDocs(collection(db, "jobs_live"));
  const jobs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter out jobs that have passed their deadline
  return jobs.filter(job => {
    if (!job.deadline) return true;
    const deadlineDate = new Date(job.deadline);
    return deadlineDate >= today;
  });
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
  const snapshot = await getDocs(collection(db, "books_live"));
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
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
