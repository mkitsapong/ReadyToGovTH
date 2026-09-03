import { findOfficialGovLogo } from "../utils/logoHelper.js";
import { resolveExtractedDates, convertThaiNumeralsToArab } from "../utils/thaiDateParser.js";

const SYSTEM_INSTRUCTION = `
คุณเป็นผู้เชี่ยวชาญระดับสูงด้านการวิเคราะห์เอกสารประกาศรับสมัครงานราชการไทย (ข้าราชการ, พนักงานราชการ, รัฐวิสาหกิจ, ลูกจ้างชั่วคราว, พนักงานหน่วยงานของรัฐ)
หน้าที่ของคุณคืออ่านเอกสารประกาศรับสมัครงาน (PDF, รูปภาพ หรือข้อความ) แล้วดึงข้อมูลออกมาเป็น JSON ตามโครงสร้างที่กำหนดอย่างแม่นยำ 100%

⚠️ กฎสำคัญมากในการอ่านตัวเลขและเลขไทย (Thai Numerals & OCR Disambiguation):
1. ตารางแปลงเลขไทยเป็นเลขอารบิก:
   - ๐ = 0, ๑ = 1, ๒ = 2, ๓ = 3, ๔ = 4, ๕ = 5, ๖ = 6, ๗ = 7, ๘ = 8, ๙ = 9
2. การแยกแยะเลขไทยที่มักอ่านผิดในเอกสารสแกน PDF (CRITICAL):
   - เลข ๕ (ห้า) ในฟอนต์ราชการ (TH Sarabun) จะมีห่วงม้วนกลมที่หางบนขวา ในเอกสารสแกน/ภาพย่อส่วน ห่วงม้วนนี้มักเบลอจนดูคล้ายเลข ๙ (เก้า)
   - ⚠️ ตัวอย่างที่ผิดบ่อยที่สุด: "๒๕" (25) มักถูกอ่านผิดเป็น "๒๙" (29)
   - กฎการตรวจสอบระยะเวลารับสมัครงานราชการ: ตามระเบียบสำนักนายกรัฐมนตรี ประกาศรับสมัครงานราชการ/พนักงานราชการจะต้องเปิดรับสมัครไม่น้อยกว่า 5 วันทำการ (7 วันปฏิทิน) ดังนั้น หากเห็นช่วงวันที่สิ้นเดือนเป็น "๒... - ๓๑ สิงหาคม" วันเปิดรับสมัครคือวันที่ "๒๕" (25 สิงหาคม) แน่นอน 100% ห้ามอ่านเป็น 29 เด็ดขาด!
   - เช่นเดียวกัน "๑๕ - ... " ห้ามอ่านเป็น 19
3. ปี พ.ศ.:
   - สังเกตปี พ.ศ. ให้แม่นยำ (เช่น ๒๕๖๙ = 2026) หากเห็นเลขท้ายม้วนโค้งขึ้นคือ ๙ (2569 -> 2026)
4. ยึดข้อความตัวสะกดภาษาไทยในวงเล็บเสมอเพื่อตรวจทานความถูกต้อง เช่น "(สองหมื่นหนึ่งพันเจ็ดร้อยแปดสิบบาทถ้วน)"

กฎการวิเคราะห์ข้อมูลฟิลด์ต่างๆ:
1. department: ชื่อหน่วยงานต้นสังกัด เช่น "สำนักงานส่งเสริมการเรียนรู้ประจำจังหวัดลพบุรี", "กรมสรรพากร", "การไฟฟ้าส่วนภูมิภาค"
2. categories: array ของหมวดหมู่ที่ตรงกับประกาศ (เลือกจาก: "ข้าราชการ", "พนักงานราชการ", "รัฐวิสาหกิจ", "ลูกจ้างชั่วคราว", "พนักงานหน่วยงานของรัฐ")
3. dateSnippet: คัดลอกข้อความท่อนที่ระบุวันเวลาเปิดรับสมัครจากเอกสารมาเป๊ะๆ ทุกตัวอักษรและเลขไทย เช่น "ตั้งแต่วันที่ ๒๕ - ๓๑ สิงหาคม ๒๕๖๙ (เว้นวันหยุดราชการ)"
4. startDay: เลขวันที่เริ่มต้นเป็นเลขอารบิก เช่น 25
5. endDay: เลขวันที่สิ้นสุดเป็นเลขอารบิก เช่น 31
6. month: เลขเดือน 1-12 เช่น สิงหาคม -> 8
7. yearBE: ปี พ.ศ. เช่น 2569
8. startDate: วันที่เริ่มเปิดรับสมัครในรูปแบบ ค.ศ. YYYY-MM-DD เช่น "2026-08-25" (พ.ศ. ๒๕๖๙ - 543 = 2026)
9. deadline: วันที่ปิดรับสมัครในรูปแบบ ค.ศ. YYYY-MM-DD เช่น "2026-08-31" (พ.ศ. ๒๕๖๙ - 543 = 2026)
10. postedDate: วันที่ลงประกาศ หรือวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
11. isNoOCSC: true หากระบุว่า "ไม่ต้องผ่าน ภาค ก" หรือ "ไม่ต้องมีหนังสือรับรองผลการสอบภาค ก ของ ก.พ."
12. isOCSC: true หากระบุว่า "ต้องผ่าน ภาค ก" หรือ "ต้องมีหนังสือรับรองผลการสอบภาค ก ของ ก.พ."
13. applyUrl: ลิงก์สำหรับสมัครออนไลน์ (เช่น https://...) หรือหากระบุให้ส่งใบสมัครทางอีเมล ให้ใส่ในรูปแบบ "mailto:อีเมล" (เช่น mailto:qas.pcd2025@gmail.com) หรือถ้าไม่มีให้ใส่ ""
14. announcementUrl: ลิงก์เอกสารประกาศ (ถ้ามี) หรือ ""
15. description: สรุปวิธีการรับสมัครและสถานที่รับสมัครสั้นๆ 1-3 ย่อหน้า
16. provinces: array ของชื่อจังหวัดที่ปฏิบัติงาน เช่น ["ลพบุรี"] หากทั่วประเทศให้ใส่ ["ทุกจังหวัด"]
17. positionList: array ของตำแหน่งทั้งหมดที่เปิดรับ โดยแต่ละตำแหน่งมีฟิลด์:
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
 * Candidate models prioritized by quality, latency, and availability
 */
const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
];

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
      text: "กรุณาวิเคราะห์เอกสารไฟล์ประกาศรับสมัครงานที่แนบมานี้อย่างละเอียด ตรวจสอบเลขไทย วันที่รับสมัคร และตำแหน่ง แล้วดึงข้อมูลตามคำสั่งและโครงสร้าง JSON"
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
        console.warn(`Model ${model} failed (${response.status}): ${message}. Trying next fallback model...`);
        // If high demand (503), rate limit (429), or 404, try next candidate model
        continue;
      }

      const result = await response.json();
      const responseParts = result.candidates?.[0]?.content?.parts || [];
      const textPart = responseParts.find(p => typeof p.text === "string" && p.text.trim().length > 0);
      rawText = textPart?.text || responseParts.map(p => p.text || "").join("").trim();
      
      if (rawText) {
        break; // Successfully got response
      }
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} error: ${err.message}. Trying next fallback model...`);
      continue;
    }
  }

  if (!rawText) {
    throw lastError || new Error("ไม่ได้รับการตอบกลับจาก AI กรุณาตรวจสอบ API Key หรือลองใหม่อีกครั้ง");
  }

  try {
    // Strip markdown code block wrappers if any
    let cleanedJson = rawText.trim();
    if (cleanedJson.startsWith("```json")) {
      cleanedJson = cleanedJson.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    } else if (cleanedJson.startsWith("```")) {
      cleanedJson = cleanedJson.replace(/^```\s*/, "").replace(/```$/, "").trim();
    }

    const parsed = JSON.parse(cleanedJson);
    let dataObj = parsed;
    if (Array.isArray(parsed)) {
      dataObj = parsed[0] || {};
    } else if (parsed && typeof parsed === "object") {
      if (Array.isArray(parsed.jobs) && parsed.jobs.length > 0) {
        dataObj = parsed.jobs[0];
      } else if (parsed.result && typeof parsed.result === "object") {
        dataObj = parsed.result;
      }
    }

    return sanitizeExtractedData(dataObj, text);
  } catch (err) {
    console.error("JSON parse error from Gemini output:", rawText, err);
    throw new Error("รูปแบบข้อมูลที่ AI ส่งกลับมาไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง", { cause: err });
  }
}

/**
 * Sanitize and validate extracted data to match AdminPanel form structure
 */
function sanitizeExtractedData(data, originalRawText = "") {
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

  // Validate and resolve exact dates using OCR disambiguation and regex verification
  const resolvedDates = resolveExtractedDates({
    startDate: data.startDate,
    deadline: data.deadline,
    rawDateSnippet: data.dateSnippet || data.rawDateSnippet || data.rawDate || data.applicationPeriod,
    rawText: originalRawText,
    description: data.description,
  });

    // Resolve and format applyUrl (detect email and add mailto: if appropriate)
    let finalApplyUrl = (data.applyUrl || "").trim();
    if (finalApplyUrl && !finalApplyUrl.startsWith("http://") && !finalApplyUrl.startsWith("https://") && !finalApplyUrl.startsWith("mailto:")) {
      if (finalApplyUrl.includes("@")) {
        finalApplyUrl = `mailto:${finalApplyUrl}`;
      }
    }
    if (!finalApplyUrl && (data.description || originalRawText)) {
      const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
      const match = (data.description || "").match(emailRegex) || (originalRawText || "").match(emailRegex);
      if (match) {
        finalApplyUrl = `mailto:${match[1]}`;
      }
    }

    return {
      department: dept,
      logoUrl,
      categories,
      provinces: Array.isArray(data.provinces) ? data.provinces : [],
      startDate: resolvedDates.startDate || "",
      deadline: resolvedDates.deadline || "",
      postedDate: convertThaiNumeralsToArab(data.postedDate || new Date().toISOString().split("T")[0]),
      isNoOCSC: Boolean(data.isNoOCSC),
      isOCSC: Boolean(data.isOCSC),
      applyUrl: finalApplyUrl,
      announcementUrl: data.announcementUrl || "",
      description: data.description || "",
      positionList
    };
}
