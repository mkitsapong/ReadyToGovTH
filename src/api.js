import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase.js";
import { mockJobs } from "./data/mockJobs.js";
import { mockBooks } from "./data/mockBooks.js";

// Helper function to seed mock data if database is empty
const seedDatabaseIfEmpty = async (colName, mockData) => {
  const colRef = collection(db, colName);
  const snapshot = await getDocs(colRef);
  
  if (snapshot.empty) {
    console.log(`Seeding ${colName}...`);
    for (const item of mockData) {
      // Avoid uploading the hardcoded ID since Firestore generates its own,
      // but if we want to keep references, we can add it as a field.
      const { id, ...dataToUpload } = item;
      await addDoc(colRef, dataToUpload);
    }
    console.log(`${colName} seeded successfully!`);
    // Re-fetch after seeding
    const newSnapshot = await getDocs(colRef);
    return newSnapshot;
  }
  return snapshot;
};

// --- JOBS API ---
export const fetchJobs = async () => {
  let snapshot = await getDocs(collection(db, "jobs"));
  
  // Seed with mockJobs if the jobs collection is empty (for demo purposes)
  if (snapshot.empty) {
    snapshot = await seedDatabaseIfEmpty("jobs", mockJobs);
  }

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
        await deleteDoc(doc(db, "jobs", job.id));
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
  const docRef = await addDoc(collection(db, "jobs"), jobData);
  return { id: docRef.id, ...jobData };
};

export const updateJob = async (updatedJob) => {
  const { id, ...jobData } = updatedJob;
  const jobRef = doc(db, "jobs", id);
  await updateDoc(jobRef, jobData);
  return updatedJob;
};

export const deleteJob = async (jobId) => {
  await deleteDoc(doc(db, "jobs", jobId));
  return jobId;
};

// --- BOOKS API ---
export const fetchBooks = async () => {
  let snapshot = await getDocs(collection(db, "books"));
  
  // Seed with mockBooks if the books collection is empty
  if (snapshot.empty) {
    snapshot = await seedDatabaseIfEmpty("books", mockBooks);
  }

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addBook = async (newBook) => {
  const { id, ...bookData } = newBook;
  const docRef = await addDoc(collection(db, "books"), bookData);
  return { id: docRef.id, ...bookData };
};

export const updateBook = async (updatedBook) => {
  const { id, ...bookData } = updatedBook;
  const bookRef = doc(db, "books", id);
  await updateDoc(bookRef, bookData);
  return updatedBook;
};

export const deleteBook = async (bookId) => {
  await deleteDoc(doc(db, "books", bookId));
  return bookId;
};
