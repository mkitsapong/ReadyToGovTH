import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD1nVRVmbSSl2z2GAuJ6yEDnKa67BrjgT8",
  authDomain: "readytogovth-app.firebaseapp.com",
  projectId: "readytogovth-app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkJobs() {
  const snapshot = await getDocs(collection(db, "jobs_live"));
  const jobs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  console.log("Departments:");
  jobs.forEach(j => console.log(j.department));
  process.exit(0);
}

checkJobs().catch(console.error);
