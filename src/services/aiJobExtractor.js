import { findOfficialGovLogo } from "../utils/logoHelper.js";

const SYSTEM_INSTRUCTION = `
คุณเป็นผู้เชี่ยวชาญด้านการวิเคราะห์เอกสารประกาศรับสมัครงานราชการไทย (ข้าราชการ, พนักงานราชการ, รัฐวิสาหกิจ, ลูกจ้างชั่วคราว, พนักงานหน่วยงานของรัฐ)
หน้าที่ของคุณคืออ่านเอกสารประกาศรับสมัครงาน (PDF, รูปภาพ หรือข้อความ) แล้วดึงข้อมูลออกมาเป็น JSON ตามโครงสร้างที่กำหนดอย่างแม่นยำ 100%

⚠️ กฎสำคัญมากในการอ่านตัวเลขและเลขไทย (Thai Numerals Disambiguation):
1. ตารางแปลงเลขไทยเป็นเลขอารบิก:
   - ๐ = 0
   - ๑ = 1
   - ๒ = 2 (หัวหยัก ม้วนล่าง)
   - ๓ = 3 (หยัก 2 ตอน)
   - ๔ = 4 (หัวกลม ไม่มีหางม้วนบน)
   - ๕ = 5 (มีห่วงม้วนกลมที่หางบนขวา ⚠️ ห้ามสับสนกับ ๙ หรือ ๓ หรือ ๔ เด็ดขาด เช่น ๒๕ = 25 ไม่ใช่ 29)
   - ๖ = 6 (หัวล่าง หางชี้ขึ้น)
   - ๗ = 7 (หยักบน มีหาง)
   - ๘ = 8 (หยักล่าง คล้ายไม้ไต่คู้)
   - ๙ = 9 (หางตวัดโค้งขึ้น ไม่มีห่วงม้วนบน)
2. ตัวอย่างการอ่านวันที่และตัวเลขที่พบบ่อย:
   - "๒๕" = 25 (ยี่สิบห้า) ห้ามอ่านเป็น 29 หรือ 23
   - "๓๑" = 31 (สามสิบเอ็ด)
   - "๒๑,๗๘๐" = 21,780 (สองหมื่นหนึ่งพันเจ็ดร้อยแปดสิบ) ห้ามอ่านเป็น 18,280
3. ยึดข้อความตัวสะกดภาษาไทยในวงเล็บเสมอเพื่อตรวจทานความถูกต้อง เช่น "(สองหมื่นหนึ่งพันเจ็ดร้อยแปดสิบบาทถ้วน)"

กฎการวิเคราะห์ข้อมูลฟิลด์ต่างๆ:
1. department: ชื่อหน่วยงานต้นสังกัด เช่น "สำนักงานส่งเสริมการเรียนรู้ประจำจังหวัดลพบุรี", "กรมสรรพากร", "การไฟฟ้าส่วนภูมิภาค"
2. categories: array ของหมวดหมู่ที่ตรงกับประกาศ (เลือกจาก: "ข้าราชการ", "พนักงานราชการ", "รัฐวิสาหกิจ", "ลูกจ้างชั่วคราว", "พนักงานหน่วยงานของรัฐ")
3. startDate: วันที่เริ่มเปิดรับสมัครในรูปแบบ ค.ศ. YYYY-MM-DD เช่น "ตั้งแต่วันที่ ๒๕ - ๓๑ สิงหาคม ๒๕๖๙" -> startDate คือ "2026-08-25"
4. deadline: วันที่ปิดรับสมัครในรูปแบบ ค.ศ. YYYY-MM-DD เช่น "ตั้งแต่วันที่ ๒๕ - ๓๑ สิงหาคม ๒๕๖๙" -> deadline คือ "2026-08-31"
5. postedDate: วันที่ลงประกาศ หรือวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
6. isNoOCSC: true หากระบุว่า "ไม่ต้องผ่าน ภาค ก" หรือ "ไม่ต้องมีหนังสือรับรองผลการสอบภาค ก ของ ก.พ."
7. isOCSC: true หากระบุว่า "ต้องผ่าน ภาค ก" หรือ "ต้องมีหนังสือรับรองผลการสอบภาค ก ของ ก.พ."
8. applyUrl: ลิงก์สำหรับสมัครออนไลน์ (ถ้ามีในเอกสาร เช่น http://lopburi.dole.go.th/nfelop/) หรือ ""
9. announcementUrl: ลิงก์เอกสารประกาศ (ถ้ามี) หรือ ""
10. description: สรุปวิธีการรับสมัครและสถานที่รับสมัครสั้นๆ 1-3 ย่อหน้า
11. provinces: array ของชื่อจังหวัดที่ปฏิบัติงาน เช่น ["ลพบุรี"] หากทั่วประเทศให้ใส่ ["ทุกจังหวัด"]
12. positionList: array ของตำแหน่งทั้งหมดที่เปิดรับ โดยแต่ละตำแหน่งมีฟิลด์:
    - title: ชื่อตำแหน่ง เช่น "นักจัดการงานทั่วไป", "นักวิชาการคอมพิวเตอร์"
    - salary: อัตราเงินเดือนเป็นเลขอารบิก เช่น "21,780 บาท" (ตรวจสอบเทียบกับคำสะกดในวงเล็บให้ตรงเป๊ะ)
    - count: จำนวนอัตราว่าง (ตัวเลข integer เช่น 1)
    - education: array ของระดับวุฒิที่รับ โดยแปลงเป็นค่ามาตรฐานเท่านั้น: ["ม.3", "ม.6", "ปวช.", "ปวส.", "ปริญญาตรี", "ปริญญาโท", "ปริญญาเอก", "ไม่จำกัดวุฒิ"]
    - details: สรุปคุณสมบัติเฉพาะตำแหน่ง / วิชาเอกที่รับ / ลักษณะงาน
    - units: (ถ้ามีระบุหน่วยงานย่อย/สาขาแยกย่อย) array ของ { name, count, education, major, details } หรือ []
`;

/**
 * Convert a File object to base64 string
 */
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result.split(",")[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Extract structured job data using Gemini API
 * @param {Object} options
 * @param {File|null} options.file - Uploaded PDF or Image file
 * @param {string} options.text - Raw pasted text
 * @param {string} options.apiKey - Gemini API Key (from env or admin input)
 * @returns {Promise<Object>} Extracted job data
 */
const CANDIDATE_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
];

export async function extractJobDataWithAI({ file, text, apiKey }) {
  const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("กรุณากรอก Gemini API Key หรือตั้งค่า VITE_GEMINI_API_KEY ในระบบ");
  }

  const parts = [];

  if (text && text.trim()) {
    parts.push({
      text: `ข้อความประกาศรับสมัครงาน:\n\n${text.trim()}`
    });
  }

  if (file) {
    const mimeType = file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "image/jpeg");
    const base64Data = await fileToBase64(file);
    parts.push({
      inlineData: {
        mimeType,
        data: base64Data,
      }
    });
    parts.push({
      text: "กรุณาวิเคราะห์เอกสารไฟล์ประกาศรับสมัครงานที่แนบมานี้ และดึงข้อมูลตามคำสั่งและโครงสร้าง JSON"
    });
  }

  if (parts.length === 0) {
    throw new Error("กรุณาเลือกไฟล์ PDF/รูปภาพ หรือวางข้อความประกาศ");
  }

  const payload = {
    contents: [
      {
        role: "user",
        parts: parts
      }
    ],
    systemInstruction: {
      parts: [
        { text: SYSTEM_INSTRUCTION }
      ]
    },
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    }
  };

  let lastError = null;
  let rawText = null;

  for (const model of CANDIDATE_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = errorBody?.error?.message || `HTTP ${response.status} ${response.statusText}`;
        lastError = new Error(`Gemini API (${model}): ${message}`);
        
        // If model not found or deprecated, continue to next model
        if (response.status === 404 || message.includes("not found") || message.includes("no longer available")) {
          continue;
        }
        throw lastError;
      }

      const result = await response.json();
      rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        break; // Successfully got response
      }
    } catch (err) {
      lastError = err;
      if (err.message?.includes("not found") || err.message?.includes("no longer available")) {
        continue;
      }
      throw err;
    }
  }

  if (!rawText) {
    throw lastError || new Error("ไม่ได้รับการตอบกลับจาก AI กรุณาตรวจสอบ API Key หรือลองใหม่อีกครั้ง");
  }

  try {
    const parsed = JSON.parse(rawText);
    return sanitizeExtractedData(parsed);
  } catch (err) {
    console.error("JSON parse error from Gemini output:", rawText, err);
    throw new Error("รูปแบบข้อมูลที่ AI ส่งกลับมาไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง", { cause: err });
  }
}

/**
 * Convert Thai numerals (๐-๙) to Arabic numerals (0-9)
 */
function convertThaiNumeralsToArab(str) {
  if (typeof str !== "string") return str;
  const thaiNumerals = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];
  return str.replace(/[๐-๙]/g, (ch) => thaiNumerals.indexOf(ch).toString());
}

/**
 * Sanitize and validate extracted data to match AdminPanel form structure
 */
function sanitizeExtractedData(data) {
  const validEdus = ["ม.3", "ม.6", "ปวช.", "ปวส.", "ปริญญาตรี", "ปริญญาโท", "ปริญญาเอก", "ไม่จำกัดวุฒิ"];
  const validCategories = ["ข้าราชการ", "พนักงานราชการ", "รัฐวิสาหกิจ", "ลูกจ้างชั่วคราว", "พนักงานหน่วยงานของรัฐ"];

  const categories = Array.isArray(data.categories)
    ? data.categories.filter(c => validCategories.includes(c))
    : [];
  if (categories.length === 0) {
    categories.push("ข้าราชการ");
  }

  const rawPositions = Array.isArray(data.positionList) && data.positionList.length > 0
    ? data.positionList
    : [{ title: "", salary: "", count: 1, education: ["ปริญญาตรี"], details: "", units: [] }];

  const positionList = rawPositions.map(p => {
    let edus = Array.isArray(p.education) ? p.education : (p.education ? [p.education] : ["ปริญญาตรี"]);
    edus = edus.filter(e => validEdus.includes(e));
    if (edus.length === 0) edus = ["ปริญญาตรี"];

    const units = Array.isArray(p.units) ? p.units.map(u => ({
      name: convertThaiNumeralsToArab(u.name || ""),
      count: Number(convertThaiNumeralsToArab(String(u.count || 1))) || 1,
      education: Array.isArray(u.education) ? u.education.filter(e => validEdus.includes(e)) : ["ปริญญาตรี"],
      major: u.major || "",
      details: u.details || ""
    })) : [];

    return {
      title: convertThaiNumeralsToArab(p.title || ""),
      salary: convertThaiNumeralsToArab(p.salary || ""),
      count: Number(convertThaiNumeralsToArab(String(p.count || 1))) || 1,
      education: edus,
      details: p.details || "",
      units
    };
  });

    const dept = convertThaiNumeralsToArab(data.department || "");
    const logoUrl = data.logoUrl || findOfficialGovLogo(dept);

    return {
      department: dept,
      logoUrl,
      categories,
      provinces: Array.isArray(data.provinces) ? data.provinces : [],
      startDate: convertThaiNumeralsToArab(data.startDate || ""),
      deadline: convertThaiNumeralsToArab(data.deadline || ""),
      postedDate: convertThaiNumeralsToArab(data.postedDate || new Date().toISOString().split("T")[0]),
      isNoOCSC: Boolean(data.isNoOCSC),
      isOCSC: Boolean(data.isOCSC),
      applyUrl: data.applyUrl || "",
      announcementUrl: data.announcementUrl || "",
      description: data.description || "",
      positionList
    };
  }
