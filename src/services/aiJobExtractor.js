/**
 * AI Job Extractor Service using Google Gemini API
 * Supports extracting structured Thai government job data from PDF, images, or raw text.
 */

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const SYSTEM_INSTRUCTION = `
คุณเป็นผู้เชี่ยวชาญด้านการวิเคราะห์เอกสารประกาศรับสมัครงานราชการไทย (ข้าราชการ, พนักงานราชการ, รัฐวิสาหกิจ, ลูกจ้างชั่วคราว, พนักงานหน่วยงานของรัฐ)
หน้าที่ของคุณคืออ่านเอกสารประกาศรับสมัครงาน (PDF, รูปภาพ หรือข้อความ) แล้วดึงข้อมูลออกมาเป็น JSON ตามโครงสร้างที่กำหนดอย่างแม่นยำ

กฎการวิเคราะห์ข้อมูล:
1. department: ชื่อหน่วยงานต้นสังกัด เช่น "กรมสรรพากร", "การไฟฟ้าส่วนภูมิภาค", "สำนักงานปลัดกระทรวงสาธารณสุข"
2. categories: array ของหมวดหมู่ที่ตรงกับประกาศ (เลือกจาก: "ข้าราชการ", "พนักงานราชการ", "รัฐวิสาหกิจ", "ลูกจ้างชั่วคราว", "พนักงานหน่วยงานของรัฐ")
3. startDate: วันที่เริ่มเปิดรับสมัครในรูปแบบ ค.ศ. YYYY-MM-DD (เช่น 1 ก.ย. 2569 -> 2026-09-01 หากปี พ.ศ. ให้ลบ 543 เพื่อเป็น ค.ศ.)
4. deadline: วันที่ปิดรับสมัครในรูปแบบ ค.ศ. YYYY-MM-DD
5. postedDate: วันที่ลงประกาศ หรือวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
6. isNoOCSC: true หากระบุว่า "ไม่ต้องผ่าน ภาค ก" หรือ "ไม่ต้องมีหนังสือรับรองผลการสอบภาค ก ของ ก.พ."
7. isOCSC: true หากระบุว่า "ต้องผ่าน ภาค ก" หรือ "ต้องมีหนังสือรับรองผลการสอบภาค ก ของ ก.พ."
8. applyUrl: ลิงก์สำหรับสมัครออนไลน์ (ถ้ามีในเอกสาร) หรือ ""
9. announcementUrl: ลิงก์เอกสารประกาศ (ถ้ามี) หรือ ""
10. description: สรุปวิธีการรับสมัครและรายละเอียดสำคัญสั้นๆ 1-3 ย่อหน้า
11. provinces: array ของชื่อจังหวัดที่ปฏิบัติงาน เช่น ["กรุงเทพมหานคร"] หากทั่วประเทศให้ใส่ ["ทุกจังหวัด"]
12. positionList: array ของตำแหน่งทั้งหมดที่เปิดรับ โดยแต่ละตำแหน่งมีฟิลด์:
    - title: ชื่อตำแหน่ง เช่น "นักวิชาการคอมพิวเตอร์ปฏิบัติการ"
    - salary: อัตราเงินเดือน เช่น "15,000 - 16,500 บาท"
    - count: จำนวนอัตราว่าง (ตัวเลข integer หากระบุหลายอัตราโดยไม่ระบุจำนวนชัดเจนให้ใส่ 1)
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

  const response = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.error?.message || `HTTP ${response.status} ${response.statusText}`;
    throw new Error(`เกิดข้อผิดพลาดจาก Gemini API: ${message}`);
  }

  const result = await response.json();
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("ไม่ได้รับข้อมูลการตอบกลับจาก AI");
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
      name: u.name || "",
      count: Number(u.count) || 1,
      education: Array.isArray(u.education) ? u.education.filter(e => validEdus.includes(e)) : ["ปริญญาตรี"],
      major: u.major || "",
      details: u.details || ""
    })) : [];

    return {
      title: p.title || "",
      salary: p.salary || "",
      count: Number(p.count) || 1,
      education: edus,
      details: p.details || "",
      units
    };
  });

  return {
    department: data.department || "",
    categories,
    provinces: Array.isArray(data.provinces) ? data.provinces : [],
    startDate: data.startDate || "",
    deadline: data.deadline || "",
    postedDate: data.postedDate || new Date().toISOString().split("T")[0],
    isNoOCSC: Boolean(data.isNoOCSC),
    isOCSC: Boolean(data.isOCSC),
    applyUrl: data.applyUrl || "",
    announcementUrl: data.announcementUrl || "",
    description: data.description || "",
    positionList
  };
}
