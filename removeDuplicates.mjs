import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD1nVRVmbSSl2z2GAuJ6yEDnKa67BrjgT8",
  authDomain: "readytogovth-app.firebaseapp.com",
  projectId: "readytogovth-app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function removeDuplicates() {
  console.log("Fetching jobs from Firestore...");
  const snapshot = await getDocs(collection(db, "jobs_live"));
  const jobs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log(`Found ${jobs.length} jobs total.`);

  // Group by department name to find duplicates
  const grouped = {};
  for (const job of jobs) {
    if (!grouped[job.department]) {
      grouped[job.department] = [];
    }
    grouped[job.department].push(job);
  }

  let deletedCount = 0;

  for (const [department, departmentJobs] of Object.entries(grouped)) {
    if (departmentJobs.length > 1) {
      console.log(`\nFound ${departmentJobs.length} entries for "${department}"`);
      // Keep the first one, delete the rest
      const [keep, ...duplicates] = departmentJobs;
      console.log(`Keeping document ID: ${keep.id}`);

      for (const dup of duplicates) {
        console.log(`Deleting duplicate ID: ${dup.id}...`);
        await deleteDoc(doc(db, "jobs_live", dup.id));
        deletedCount++;
      }
    }
  }

  console.log(`\nCleanup complete! Deleted ${deletedCount} duplicate jobs.`);
  process.exit(0);
}

removeDuplicates().catch(console.error);
