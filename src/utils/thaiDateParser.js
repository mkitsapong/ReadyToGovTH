/**
 * Thai Date Parsing & Normalization Utility
 * Extracts start date and deadline from Thai government job posting texts.
 */

const THAI_NUMERALS_MAP = {
  "๐": "0", "๑": "1", "๒": "2", "๓": "3", "๔": "4",
  "๕": "5", "๖": "6", "๗": "7", "๘": "8", "๙": "9"
};

/**
 * Convert all Thai numerals (๐-๙) in a string to Arabic numerals (0-9)
 */
export function convertThaiNumeralsToArab(str) {
  if (!str || typeof str !== "string") return str || "";
  return str.replace(/[๐-๙]/g, (ch) => THAI_NUMERALS_MAP[ch] !== undefined ? THAI_NUMERALS_MAP[ch] : ch);
}

const THAI_MONTHS_MAP = {
  "มกราคม": 1, "ม.ค.": 1, "ม.ค": 1,
  "กุมภาพันธ์": 2, "ก.พ.": 2, "ก.พ": 2,
  "มีนาคม": 3, "มี.ค.": 3, "มี.ค": 3,
  "เมษายน": 4, "เม.ย.": 4, "เม.ย": 4,
  "พฤษภาคม": 5, "พ.ค.": 5, "พ.ค": 5,
  "มิถุนายน": 6, "มิ.ย.": 6, "มิ.ย": 6,
  "กรกฎาคม": 7, "ก.ค.": 7, "ก.ค": 7,
  "สิงหาคม": 8, "ส.ค.": 8, "ส.ค": 8,
  "กันยายน": 9, "ก.ย.": 9, "ก.ย": 9,
  "ตุลาคม": 10, "ต.ค.": 10, "ต.ค": 10,
  "พฤศจิกายน": 11, "พ.ย.": 11, "พ.ย": 11,
  "ธันวาคม": 12, "ธ.ค.": 12, "ธ.ค": 12,
};

const MONTH_NAMES_REGEX = "มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม|ม\\.ค\\.?|ก\\.พ\\.?|มี\\.ค\\.?|เม\\.ย\\.?|พ\\.ค\\.?|มิ\\.ย\\.?|ก\\.ค\\.?|ส\\.ค\\.?|ก\\.ย\\.?|ต\\.ค\\.?|พ\\.ย\\.?|ธ\\.ค\\.?";

/**
 * Convert Buddhist year (พ.ศ.) or short 2-digit year to Gregorian year (ค.ศ.)
 */
export function parseBuddhistYear(yearStr) {
  if (!yearStr) return new Date().getFullYear();
  const y = parseInt(yearStr, 10);
  if (isNaN(y)) return new Date().getFullYear();

  // e.g. 2569 -> 2026
  if (y >= 2400) {
    return y - 543;
  }
  // e.g. 69 (BE 2569) -> 2026
  if (y >= 50 && y <= 99) {
    return (2500 + y) - 543;
  }
  // e.g. 26 (AD 2026) -> 2026
  if (y < 50) {
    return 2000 + y;
  }
  // e.g. 2026
  if (y >= 2000 && y < 2400) {
    return y;
  }
  return y;
}

/**
 * Format year, month, day to YYYY-MM-DD
 */
export function formatYMD(year, month, day) {
  const y = String(year).padStart(4, "0");
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Clean text for parsing
 */
function cleanDateSnippet(text) {
  if (!text || typeof text !== "string") return "";
  let s = convertThaiNumeralsToArab(text);
  // Normalize whitespace and remove "พ.ศ."
  s = s.replace(/พ\.ศ\.?/g, " ").replace(/\s+/g, " ");
  return s;
}

/**
 * OCR Disambiguation: Correct commonly misread Thai digits in government date ranges
 * (e.g. ๒๕ misread as ๒๙ for a period ending on 31, which would violate 5-day minimum rule)
 */
function correctOcrDateAmbiguity(startDay, endDay) {
  let sDay = startDay;
  let eDay = endDay;

  // 29 - 31 (or 29 - 30): OCR confused ๒๕ (25) as ๒๙ (29)
  if (sDay === 29 && (eDay === 30 || eDay === 31)) {
    sDay = 25;
  }
  // 19 - 30/31: OCR confused ๑๕ (15) as ๑๙ (19)
  else if (sDay === 19 && (eDay === 30 || eDay === 31)) {
    sDay = 15;
  }
  // 23 - 31: OCR confused ๒๕ (25) as ๒๓ (23)
  else if (sDay === 23 && (eDay === 30 || eDay === 31)) {
    sDay = 25;
  }

  return { startDay: sDay, endDay: eDay };
}

/**
 * Extract start date and deadline from Thai date text snippet
 * Returns { startDate: "YYYY-MM-DD"|null, deadline: "YYYY-MM-DD"|null, rawMatched: string }
 */
export function extractThaiDatesFromText(rawText) {
  if (!rawText) return { startDate: null, deadline: null };

  const text = cleanDateSnippet(rawText);

  // Pattern 1: Two dates across months (or with full month repetition)
  // e.g. "วันที่ 25 สิงหาคม 2569 ถึง วันที่ 5 กันยายน 2569" or "25 สิงหาคม ถึง 31 สิงหาคม 2569"
  const patternCrossMonth = new RegExp(
    `(?:ตั้งแต่วันที่|เปิดรับสมัครตั้งแต่วันที่|รับสมัครตั้งแต่วันที่|รับสมัครวันที่|ระหว่างวันที่|วันที่)?\\s*(\\d{1,2})\\s+(${MONTH_NAMES_REGEX})\\s*(\\d{2,4})?\\s*(?:-|–|—|ถึง\\s*วันที่|ถึง|จนถึง\\s*วันที่|จนถึง|และวันที่|และ)\\s*(\\d{1,2})\\s+(${MONTH_NAMES_REGEX})\\s*(\\d{2,4})?`,
    "i"
  );

  const matchCross = text.match(patternCrossMonth);
  if (matchCross) {
    let startDay = parseInt(matchCross[1], 10);
    const startMonth = THAI_MONTHS_MAP[matchCross[2].trim()];
    let endDay = parseInt(matchCross[4], 10);
    const endMonth = THAI_MONTHS_MAP[matchCross[5].trim()];
    const endYear = parseBuddhistYear(matchCross[6] || matchCross[3]);
    const startYear = matchCross[3] ? parseBuddhistYear(matchCross[3]) : endYear;

    if (startMonth === endMonth) {
      const corrected = correctOcrDateAmbiguity(startDay, endDay);
      startDay = corrected.startDay;
      endDay = corrected.endDay;
    }

    if (startMonth && endMonth && startDay >= 1 && startDay <= 31 && endDay >= 1 && endDay <= 31) {
      return {
        startDate: formatYMD(startYear, startMonth, startDay),
        deadline: formatYMD(endYear, endMonth, endDay),
        rawMatched: matchCross[0]
      };
    }
  }

  // Pattern 2: Same month range: "25 - 31 สิงหาคม 2569" or "25 ถึง 31 สิงหาคม 2569" or "25-31 ส.ค. 69"
  // e.g. "ตั้งแต่วันที่ 25 - 31 สิงหาคม 2569 (เว้นวันหยุดราชการ)"
  const patternSameMonth = new RegExp(
    `(?:ตั้งแต่วันที่|เปิดรับสมัครตั้งแต่วันที่|รับสมัครตั้งแต่วันที่|รับสมัครวันที่|ระหว่างวันที่|วันที่)?\\s*(\\d{1,2})\\s*(?:-|–|—|ถึง\\s*วันที่|ถึง|จนถึง\\s*วันที่|จนถึง)\\s*(\\d{1,2})\\s+(${MONTH_NAMES_REGEX})\\s*(\\d{2,4})?`,
    "i"
  );

  const matchSame = text.match(patternSameMonth);
  if (matchSame) {
    let startDay = parseInt(matchSame[1], 10);
    let endDay = parseInt(matchSame[2], 10);
    const monthKey = matchSame[3].trim();
    const month = THAI_MONTHS_MAP[monthKey];
    const year = parseBuddhistYear(matchSame[4]);

    const corrected = correctOcrDateAmbiguity(startDay, endDay);
    startDay = corrected.startDay;
    endDay = corrected.endDay;

    if (month && startDay >= 1 && startDay <= 31 && endDay >= 1 && endDay <= 31) {
      return {
        startDate: formatYMD(year, month, startDay),
        deadline: formatYMD(year, month, endDay),
        rawMatched: matchSame[0]
      };
    }
  }

  // Pattern 3: Single date (deadline only): "ถึงวันที่ 31 สิงหาคม 2569" or "ปิดรับสมัคร 31 ส.ค. 2569" or "ภายในวันที่ 31 สิงหาคม 2569"
  const patternSingle = new RegExp(
    `(?:ถึงวันที่|ภายในวันที่|ปิดรับสมัครวันที่|ปิดรับสมัคร|วันที่)\\s*(\\d{1,2})\\s+(${MONTH_NAMES_REGEX})\\s*(\\d{2,4})?`,
    "i"
  );

  const matchSingle = text.match(patternSingle);
  if (matchSingle) {
    const day = parseInt(matchSingle[1], 10);
    const month = THAI_MONTHS_MAP[matchSingle[2].trim()];
    const year = parseBuddhistYear(matchSingle[3]);

    if (month && day >= 1 && day <= 31) {
      return {
        startDate: null,
        deadline: formatYMD(year, month, day),
        rawMatched: matchSingle[0]
      };
    }
  }

  return { startDate: null, deadline: null };
}

/**
 * Validate and enhance AI-extracted dates with programmatic OCR correction
 */
export function resolveExtractedDates({ startDate, deadline, rawDateSnippet, rawText, description }) {
  // If we have explicit date snippet from document OCR, test it first
  const candidates = [rawDateSnippet, rawText, description].filter(Boolean);

  for (const text of candidates) {
    const parsed = extractThaiDatesFromText(text);
    if (parsed.startDate && parsed.deadline) {
      return {
        startDate: parsed.startDate,
        deadline: parsed.deadline,
        source: "parsed_from_text"
      };
    }
    if (parsed.deadline && !deadline) {
      deadline = parsed.deadline;
    }
  }

  // Fallback to direct values with OCR ambiguity correction
  let cleanStartDate = startDate ? convertThaiNumeralsToArab(String(startDate).trim()) : "";
  let cleanDeadline = deadline ? convertThaiNumeralsToArab(String(deadline).trim()) : "";

  if (cleanStartDate && cleanDeadline) {
    const sMatch = cleanStartDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const eMatch = cleanDeadline.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (sMatch && eMatch && sMatch[1] === eMatch[1] && sMatch[2] === eMatch[2]) {
      const sDay = parseInt(sMatch[3], 10);
      const eDay = parseInt(eMatch[3], 10);
      const corrected = correctOcrDateAmbiguity(sDay, eDay);
      if (corrected.startDay !== sDay) {
        cleanStartDate = `${sMatch[1]}-${sMatch[2]}-${String(corrected.startDay).padStart(2, "0")}`;
      }
    }
  }

  return {
    startDate: cleanStartDate || null,
    deadline: cleanDeadline || null,
    source: "ai_direct"
  };
}
