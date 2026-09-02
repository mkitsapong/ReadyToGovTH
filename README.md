# 🏛️ ReadyToGovTH - เว็บบอร์ดรวบรวมประกาศรับสมัครงานราชการไทย

<div align="center">

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%26%20Auth-FFCA28?logo=firebase&logoColor=black)
![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%20Flash-4285F4?logo=googlegemini&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack%20Query-v5-FF4154?logo=reactquery&logoColor=white)
![License](https://img.shields.io/badge/License-Private-slate)

**แพลตฟอร์มศูนย์รวมประกาศรับสมัครงานราชการ พนักงานราชการ รัฐวิสาหกิจ ลูกจ้างชั่วคราว และหน่วยงานของรัฐ อัปเดตล่าสุด**

[🚀 เริ่มต้นใช้งาน](#-การติดตั้งและเริ่มต้นใช้งาน) • [✨ ฟีเจอร์เด่น](#-ฟีเจอร์เด่น) • [🛠️ Tech Stack](#-เทคโนโลยีที่ใช้) • [📁 โครงสร้างโปรเจกต์](#-โครงสร้างโปรเจกต์)

</div>

---

## 📖 เกี่ยวกับโปรเจกต์ (Overview)

**ReadyToGovTH** เป็นเว็บแอปพลิเคชันที่พัฒนาขึ้นเพื่ออำนวยความสะดวกให้แก่ผู้ที่กำลังมองหางานในหน่วยงานภาครัฐของไทย โดยรวบรวมประกาศรับสมัครงานจากทุกกระทรวง กรม และรัฐวิสาหกิจ พร้อมระบบคัดกรองข้อมูลละเอียดตามวุฒิการศึกษาและพื้นที่ปฏิบัติงาน รวมถึงมีระบบ AI สำหรับผู้ดูแลระบบในการวิเคราะห์เอกสาร PDF เพื่อนำเข้าข้อมูลประกาศงานได้ภายในไม่กี่วินาที

---

## ✨ ฟีเจอร์เด่น (Key Features)

### 🎯 สำหรับผู้หางาน (Job Seekers)
* 🔍 **ค้นหาและกรองงานละเอียด:**
  * ค้นหาตามคำค้น (ชื่อหน่วยงาน, ตำแหน่ง, สาขาวิชา)
  * กรองตามประเภทงาน: ข้าราชการ, พนักงานราชการ, รัฐวิสาหกิจ, ลูกจ้างชั่วคราว, พนักงานหน่วยงานของรัฐ
  * กรองตามวุฒิการศึกษา: ม.3, ม.6, ปวช., ปวส., ปริญญาตรี, ปริญญาโท, ปริญญาเอก
  * กรองตามจังหวัดและภูมิภาคทั่วประเทศ
  * กรองเฉพาะตำแหน่งที่ **ไม่ต้องผ่าน ภาค ก** หรือ **ต้องผ่าน ภาค ก**
* 📍 **ระบบแสดงผลตำแหน่งและหน่วยงานย่อย (Multi-Unit/Branch):** แสดงรายชื่อตำแหน่งย่อย อัตราว่าง และคุณสมบัติเฉพาะอย่างชัดเจน
* 📄 **พรีวิวเอกสารประกาศฉบับเต็ม:** รองรับการเปิดอ่านไฟล์ PDF ประกาศทางการได้โดยตรงภายในเว็บไซต์
* ❤️ **ระบบบันทึกงานที่สนใจ (Bookmarks):** บันทึกรายการงานโปรดเก็บไว้ดูย้อนหลังผ่าน Local Storage
* 📚 **แนะนำหนังสือและคอร์สติวสอบ:** แสดงคู่มือเตรียมสอบ ก.พ. ภาค ก / ภาค ข และแนวข้อสอบที่ตรงกับแต่ละสายงาน
* 🌐 **รองรับ SEO และ Social Sharing:** ติดตั้ง Structured Data (Schema.org `JobPosting`) และ Open Graph Meta Tags เต็มรูปแบบ

### 👑 สำหรับผู้ดูแลระบบ (Admin Management & AI Tools)
* 🤖 **AI Job Extractor (Google Gemini Vision AI):**
  * อัปโหลดไฟล์ PDF หรือรูปภาพประกาศรับสมัครงาน ให้ AI แกะข้อมูล กรอกฟอร์มอัตโนมัติใน 3 วินาที
  * ระบบ OCR Disambiguation แก้ปัญหาเลขไทยที่มักอ่านผิดในเอกสารสแกน (เช่น ๒๕ กับ ๒๙)
  * ตรวจสอบเงื่อนไขระยะเวลารับสมัครงานตามระเบียบสำนักนายกรัฐมนตรีโดยอัตโนมัติ
* 🏛️ **Smart Logo Helper:** จับคู่ตราสัญลักษณ์และโลโก้ทางการของกระทรวง/กรม/จังหวัดให้อัตโนมัติ
* 📷 **Social Share Cover Generator:** สร้างรูปภาพแบนเนอร์สรุปประกาศรับสมัครงานขนาด 4:5 ความละเอียดสูงด้วย HTML2Canvas สำหรับโพสต์ลง Facebook / Instagram / Twitter ได้ทันทีในคลิกเดียว
* 🔐 **ระบบจัดการข้อมูลหลังบ้าน (Firebase Firestore & Auth):** จัดการประกาศงานและหนังสือติวสอบแบบ Real-time พร้อมระบบยืนยันตัวตน Admin ที่ปลอดภัย

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

| ส่วนประกอบ | เทคโนโลยี | รายละเอียด |
| :--- | :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) | React เวอร์ชันล่าสุด พร้อมความเร็วในการ Build และ Hot Module Replacement |
| **Routing** | [React Router DOM v7](https://reactrouter.com/) | Client-side Routing รองรับ Dynamic Job Detail และ Policy Routes |
| **State & Data Fetching**| [@tanstack/react-query v5](https://tanstack.com/query) | จัดการ Cache, Refetch และ Mutation ข้อมูลแบบ Asynchronous |
| **Backend & Database** | [Firebase](https://firebase.google.com/) (Firestore & Auth) | ฐานข้อมูล NoSQL แบบ Real-time และระบบยืนยันตัวตน Admin |
| **Artificial Intelligence** | [Google Gemini API](https://ai.google.dev/) | โมเดล Multimodal AI สำหรับอ่านและจัดโครงสร้างข้อมูลจากไฟล์ PDF/รูปภาพ |
| **SEO Management** | [react-helmet-async](https://github.com/staylor/react-helmet-async) | จัดการ Dynamic Meta Tags, Open Graph และ JSON-LD Schema |
| **Canvas Export** | [html2canvas](https://html2canvas.hertzen.com/) | แปลง React Component เป็นภาพแบนเนอร์ความละเอียดสูง |
| **Design System** | Vanilla CSS ("The Calm Assessor") | ดีไซน์สะอาดตา เน้นความชัดเจนของข้อมูล (Data-driven UI) ผสาน Dark Navy และ Neon Orange |

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
Jobs/
├── public/
│   └── favicon.svg             # ไอคอนของเว็บไซต์
├── src/
│   ├── assets/                 # รูปภาพและ Asset ประกอบ
│   ├── components/             # React Components หลัก
│   │   ├── AdminAIExtractor.jsx    # คอมโพเนนต์ดึงข้อมูลด้วย AI
│   │   ├── AdminPanel.jsx          # หน้าต่างจัดการประกาศงาน (Admin)
│   │   ├── AdminResourceModal.jsx  # หน้าต่างจัดการหนังสือ/คอร์สสอบ
│   │   ├── AuthModal.jsx           # หน้าต่างเข้าสู่ระบบ Admin
│   │   ├── CookieBanner.jsx        # แถบแจ้งเตือนนโยบายคุกกี้
│   │   ├── ExamResources.jsx       # กล่องแนะนำหนังสือเตรียมสอบ
│   │   ├── Footer.jsx              # ส่วนท้ายของเว็บไซต์
│   │   ├── Header.jsx              # แถบนำทางด้านบนและเมนูมือถือ
│   │   ├── JobCard.jsx             # การ์ดแสดงข้อมูลประกาศรับสมัครงาน
│   │   ├── JobDetailModal.jsx      # หน้าต่างแสดงรายละเอียดงานฉบับเต็ม & พรีวิว PDF
│   │   ├── JobDetailPage.jsx       # หน้ารายละเอียดงานแบบ Standalone (SEO URL)
│   │   ├── JobList.jsx             # หน้าหลักรวมรายการงานและตัวกรอง
│   │   ├── PolicyPage.jsx          # หน้านโยบายความเป็นส่วนตัวและเงื่อนไข
│   │   ├── SEO.jsx                 # ตัวจัดการ Meta Tags & Head
│   │   └── SocialShareCover.jsx    # เทมเพลตแบนเนอร์สำหรับแชร์ลงโซเชียล
│   ├── data/                   # ข้อมูล Static เช่น รายชื่อจังหวัดและภูมิภาค
│   ├── hooks/                  # Custom Hooks (useBookmarks ฯลฯ)
│   ├── services/               # บริการภายนอก (aiJobExtractor ฯลฯ)
│   ├── utils/                  # ฟังก์ชันตัวช่วย (helpers, thaiDateParser, logoHelper)
│   ├── api.js                  # ฟังก์ชันเชื่อมต่อกับ Firestore API
│   ├── App.css                 # สไตล์ชีทหลักของแอปพลิเคชัน
│   ├── App.jsx                 # Component หลักและ Routing
│   ├── firebase.js             # การตั้งค่า Firebase Client SDK
│   ├── index.css               # สไตล์พื้นฐานและ Design Tokens
│   └── main.jsx                # จุดเริ่มต้นของ React Application
├── firestore.rules             # กฎความปลอดภัยของ Firebase Firestore
├── vercel.json                 # การตั้งค่า Headers, CSP และ Routing สำหรับ Vercel
├── vite.config.js              # การตั้งค่า Vite
└── package.json                # ข้อมูล Dependencies และ Scripts
```

---

## 🚀 การติดตั้งและเริ่มต้นใช้งาน (Getting Started)

### 1. ความต้องการของระบบ (Prerequisites)
* [Node.js](https://nodejs.org/) (เวอร์ชัน 18.0.0 หรือใหม่กว่า)
* [npm](https://www.npmjs.com/) หรือ [yarn](https://yarnpkg.com/)

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. ตั้งค่า Environment Variables
สร้างไฟล์ `.env` ในโฟลเดอร์ root ของโปรเจกต์ และระบุค่า Config ดังนี้:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google Gemini API Key (สำหรับระบบ AI Extractor)
VITE_GEMINI_API_KEY=your_gemini_api_key
```

> 💡 **หมายเหตุ:** คุณสามารถรับ Gemini API Key ฟรีได้จาก [Google AI Studio](https://aistudio.google.com/)

### 4. รัน Development Server
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่ `http://localhost:5173` เพื่อเข้าใช้งาน

### 5. ตรวจสอบโค้ดและทดสอบ Build
```bash
# ตรวจสอบ Linting
npm run lint

# Build สำหรับ Production
npm run build

# ทดสอบรัน Production Bundle บนเครื่อง
npm run preview
```

---

## 🔒 ความปลอดภัยและการ Deploy (Deployment)

* **Vercel Deployment:** มีการตั้งค่า `vercel.json` เพื่อจัดการ Single Page Application (SPA) Rewrites และกำหนด **Content-Security-Policy (CSP)** ที่เข้มงวดเพื่อป้องกัน XSS, Clickjacking และการแทรกแซงภายนอก
* **Firestore Security Rules:** ข้อมูลประกาศงาน (`jobs_live`) และหนังสือ (`books_live`) เปิดให้อ่านสาธารณะ แต่สงวนสิทธิ์การสร้าง แก้ไข และลบไว้สำหรับผู้ใช้ที่ผ่านการยืนยันตัวตน Admin เท่านั้น

---

## 📄 ใบอนุญาตและการติดต่อ (License & Contact)

* **ผู้พัฒนา:** ทีมงาน ReadyToGovTH
* **อีเมลติดต่อ:** [readytogovth@gmail.com](mailto:readytogovth@gmail.com)
* **สงวนลิขสิทธิ์:** © 2026 ReadyToGovTH. All rights reserved.
