import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD1nVRVmbSSl2z2GAuJ6yEDnKa67BrjgT8",
  authDomain: "readytogovth-app.firebaseapp.com",
  projectId: "readytogovth-app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function countJobs() {
  const snapshot = await getDocs(collection(db, "jobs_live"));
  console.log("Total docs in jobs_live:", snapshot.size);
  process.exit(0);
}

countJobs().catch(console.error);
