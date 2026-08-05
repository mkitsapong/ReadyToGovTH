import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD1nVRVmbSSl2z2GAuJ6yEDnKa67BrjgT8",
  authDomain: "readytogovth-app.firebaseapp.com",
  projectId: "readytogovth-app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkOldJobs() {
  const snapshot = await getDocs(collection(db, "jobs"));
  console.log("Total docs in 'jobs' collection:", snapshot.size);
  process.exit(0);
}

checkOldJobs().catch(console.error);
