import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD1nVRVmbSSl2z2GAuJ6yEDnKa67BrjgT8",
  authDomain: "readytogovth-app.firebaseapp.com",
  projectId: "readytogovth-app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanCollection(colName) {
  console.log(`\n--- Cleaning up '${colName}' collection ---`);
  const snapshot = await getDocs(collection(db, colName));
  const jobs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log(`Found ${jobs.length} jobs total.`);

  // Group by department name to find duplicates
  const grouped = {};
  for (const job of jobs) {
    // Treat empty department as "Unknown" to avoid errors
    const dept = job.department || "Unknown";
    if (!grouped[dept]) {
      grouped[dept] = [];
    }
    grouped[dept].push(job);
  }

  let deletedCount = 0;

  for (const [department, departmentJobs] of Object.entries(grouped)) {
    if (departmentJobs.length > 1) {
      console.log(`Found ${departmentJobs.length} entries for "${department}"`);
      // Keep the most recent one (assuming later IDs or just the first one retrieved is fine)
      const [keep, ...duplicates] = departmentJobs;
      console.log(` -> Keeping document ID: ${keep.id}`);

      for (const dup of duplicates) {
        process.stdout.write(` -> Deleting duplicate ID: ${dup.id}... `);
        await deleteDoc(doc(db, colName, dup.id));
        console.log("Deleted.");
        deletedCount++;
      }
    }
  }

  console.log(`Cleanup complete for '${colName}'! Deleted ${deletedCount} duplicate jobs.`);
}

async function runCleanup() {
  try {
    await cleanCollection("jobs_live");
    await cleanCollection("jobs");
    console.log("\n✅ All duplicate cleanup tasks finished successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
}

runCleanup();
