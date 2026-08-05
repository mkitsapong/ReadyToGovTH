import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD1nVRVmbSSl2z2GAuJ6yEDnKa67BrjgT8",
  authDomain: "readytogovth-app.firebaseapp.com",
  projectId: "readytogovth-app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const newJob = {
  department: "สำนักงานคณะกรรมการส่งเสริมการลงทุน (BOI)",
  category: "พนักงานราชการ",
  postedDate: "2026-07-22",
  deadline: "2026-08-10",
  positions: 10,
  salary: "13,800 - 18,000",
  announcementUrl: "https://boi.thaijobjob.com",
  applyUrl: "https://boi.thaijobjob.com",
  description: "เปิดรับสมัครสอบทางอินเทอร์เน็ตตั้งแต่วันที่ 3-10 สิงหาคม 2569 ตลอด 24 ชั่วโมง ไม่เว้นวันหยุดราชการ",
  provinces: ["ส่วนกลาง"],
  positionList: [
    { title: "พนักงานสนับสนุนการลงทุน (หน่วยที่ 1-3)", salary: "13,800", count: 3, education: "ปวส." },
    { title: "พนักงานส่งเสริมการลงทุน (หน่วยที่ 4-8)", salary: "18,000", count: 7, education: "ปริญญาตรี" }
  ]
};

addDoc(collection(db, "jobs_live"), newJob)
  .then(() => {
    console.log("Success!");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
