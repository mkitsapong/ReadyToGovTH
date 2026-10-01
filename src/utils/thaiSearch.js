/**
 * thaiSearch.js
 * Smart Thai Full-Text & Fuzzy Search Utilities
 * - Thai word segmentation via Intl.Segmenter with graceful fallback
 * - Thai diacritic and tone mark normalization
 * - Damerau-Levenshtein distance & sliding-window fuzzy matching (Typo Tolerance)
 * - Thai Government / Recruitment Synonyms and Acronyms dictionary
 */

// 1. Thai Word Segmentation & Stop Words
export const THAI_STOP_WORDS = new Set([
  "การ", "ความ", "และ", "ใน", "ของ", "ที่", "เป็น", "ให้", "มี", "ได้", "จาก", 
  "กับ", "โดย", "เพื่อ", "ว่า", "แห่ง", "ตาม", "ซึ่ง", "หรือ", "อัน", "นี้", 
  "นั้น", "จะ", "ก็", "แต่", "ถ้า", "จึง", "อยู่", "ไป", "มา", "กัน", "ทั้ง"
]);

let thaiSegmenter = null;
try {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    thaiSegmenter = new Intl.Segmenter("th", { granularity: "word" });
  }
} catch (e) {
  console.debug("Intl.Segmenter initialization skipped:", e);
}

/**
 * Segment a Thai search query into primary tokens.
 * Distinguishes between explicit space-separated terms and compound sub-tokens.
 */
export function tokenizeThai(text) {
  if (!text) return [];
  const clean = String(text).trim().toLowerCase();
  if (!clean) return [];

  // Check if user explicitly used space-separated words
  const spaceParts = clean.split(/[\s,+/\\_:]+/).filter((p) => p.trim().length > 0);
  
  const tokens = new Set();
  // Always include the full query phrase
  tokens.add(clean);

  // If user typed multiple space-separated words (e.g. "ครู กทม", "นิติกร ศาล")
  if (spaceParts.length > 1) {
    spaceParts.forEach((p) => {
      if (p.length >= 2 && !THAI_STOP_WORDS.has(p)) {
        tokens.add(p);
      }
    });
  } else if (clean.length >= 6 && thaiSegmenter) {
    // For single long compound terms (e.g. "นักวิชาการคอมพิวเตอร์"), segment into sub-words
    try {
      const segments = thaiSegmenter.segment(clean);
      for (const seg of segments) {
        if (seg.isWordLike) {
          const w = seg.segment.trim();
          // Keep only meaningful sub-tokens (length >= 3 and not a common stopword)
          if (w.length >= 3 && !THAI_STOP_WORDS.has(w)) {
            tokens.add(w);
          }
        }
      }
    } catch {
      // Ignore segmenter error
    }
  }

  return Array.from(tokens);
}

// 2. Normalization (Strip Thai tone marks / vowels for phonetic skeletons)
const THAI_TONES_AND_VOWELS = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g; // ั ิ ี ึ ื ุ ู ฺ ็ ่ ้ ๊ ๋ ์ ํ ๎

export function normalizeThai(text) {
  if (!text) return "";
  return String(text)
    .toLowerCase()
    .replace(/[.\-_]/g, "") // remove dots/dashes like ก.พ. -> กพ
    .trim();
}

export function getThaiSkeleton(text) {
  if (!text) return "";
  return normalizeThai(text).replace(THAI_TONES_AND_VOWELS, "");
}

// 3. Thai Government Synonyms & Common Acronyms Dictionary
export const THAI_GOV_SYNONYMS = {
  // IT & Computer
  "it": ["คอมพิวเตอร์", "สารสนเทศ", "เทคโนโลยีสารสนเทศ", "โปรแกรมเมอร์", "นักวิชาการคอมพิวเตอร์"],
  "ไอที": ["คอมพิวเตอร์", "สารสนเทศ", "เทคโนโลยีสารสนเทศ", "โปรแกรมเมอร์", "นักวิชาการคอมพิวเตอร์"],
  "โปรแกรมเมอร์": ["คอมพิวเตอร์", "สารสนเทศ", "นักวิชาการคอมพิวเตอร์"],
  "programmer": ["คอมพิวเตอร์", "สารสนเทศ", "นักวิชาการคอมพิวเตอร์"],
  "developer": ["คอมพิวเตอร์", "สารสนเทศ", "นักวิชาการคอมพิวเตอร์"],
  "ซอฟต์แวร์": ["คอมพิวเตอร์", "สารสนเทศ", "นักวิชาการคอมพิวเตอร์"],
  "software": ["คอมพิวเตอร์", "สารสนเทศ", "นักวิชาการคอมพิวเตอร์"],

  // Finance & Accounting
  "บัญชี": ["การเงิน", "การเงินและบัญชี", "นักวิชาการเงินและบัญชี", "เจ้าพนักงานการเงินและบัญชี", "พาณิชยการ"],
  "การเงิน": ["การเงินและบัญชี", "นักวิชาการเงินและบัญชี", "เจ้าพนักงานการเงินและบัญชี", "บัญชี"],
  "finance": ["การเงินและบัญชี", "นักวิชาการเงินและบัญชี", "บัญชี"],
  "accounting": ["การเงินและบัญชี", "นักวิชาการเงินและบัญชี", "บัญชี"],

  // Law & Legal
  "นิติ": ["นิติกร", "นิติการ", "กฎหมาย", "นิติศาสตร์"],
  "กฎหมาย": ["นิติกร", "นิติการ", "นิติศาสตร์"],
  "law": ["นิติกร", "นิติการ", "กฎหมาย", "นิติศาสตร์"],

  // Administration & General Office
  "ธุรการ": ["เจ้าพนักงานธุรการ", "เจ้าหน้าที่ธุรการ", "นักจัดการงานทั่วไป", "ธุรการ"],
  "ทุรการ": ["ธุรการ", "เจ้าพนักงานธุรการ", "เจ้าหน้าที่ธุรการ"], // Common typo
  "admin": ["เจ้าพนักงานธุรการ", "เจ้าหน้าที่ธุรการ", "นักจัดการงานทั่วไป"],
  "จัดการงานทั่วไป": ["นักจัดการงานทั่วไป", "เจ้าพนักงานธุรการ"],

  // Procurement & Logistics
  "พัสดุ": ["นักวิชาการพัสดุ", "เจ้าพนักงานพัสดุ", "จัดซื้อจัดจ้าง"],
  "จัดซื้อ": ["นักวิชาการพัสดุ", "เจ้าพนักงานพัสดุ"],

  // Engineering & Technical
  "ช่าง": ["นายช่าง", "นายช่างโยธา", "นายช่างไฟฟ้า", "นายช่างสำรวจ", "นายช่างเครื่องกล", "วิศวกร"],
  "โยธา": ["นายช่างโยธา", "วิศวกรโยธา", "ช่างโยธา"],
  "ไฟฟ้า": ["นายช่างไฟฟ้า", "วิศวกรไฟฟ้า", "ช่างไฟฟ้า"],
  "วิศวกร": ["วิศวกรโยธา", "วิศวกรไฟฟ้า", "วิศวกรเครื่องกล", "นายช่าง"],

  // Healthcare
  "สธ": ["สาธารณสุข", "กระทรวงสาธารณสุข", "โรงพยาบาล", "นักวิชาการสาธารณสุข"],
  "สป.สธ": ["สาธารณสุข", "กระทรวงสาธารณสุข", "โรงพยาบาล", "สำนักงานปลัดกระทรวงสาธารณสุข"],
  "สาธารณสุข": ["นักวิชาการสาธารณสุข", "กระทรวงสาธารณสุข", "โรงพยาบาล"],
  "หมอ": ["แพทย์", "นายแพทย์", "แพทย์แผนไทย"],
  "พยาบาล": ["พยาบาลวิชาชีพ", "พยาบาลเทคนิค"],
  "รพ": ["โรงพยาบาล"],
  "รพ.": ["โรงพยาบาล"],

  // Education
  "ครู": ["ครูผู้ช่วย", "อาจารย์", "การศึกษา", "ศึกษาธิการ", "สพฐ"],
  "สพฐ": ["สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน", "ครู", "ครูผู้ช่วย"],
  "อาจารย์": ["ครู", "มหาวิทยาลัย", "วิทยาลัย"],

  // Driver
  "ขับรถ": ["พนักงานขับรถยนต์", "พนักงานขับเครื่องจักรกลขนาดเบา", "พนักงานขับรถ"],
  "คนขับรถ": ["พนักงานขับรถยนต์", "พนักงานขับเครื่องจักรกลขนาดเบา"],
  "พลขับ": ["พนักงานขับรถยนต์"],

  // Agriculture
  "เกษตร": ["นักวิชาการเกษตร", "เจ้าพนักงานการเกษตร", "กรมวิชาการเกษตร", "กรมส่งเสริมการเกษตร"],

  // Planning & Policy
  "นโยบาย": ["นักวิเคราะห์นโยบายและแผน"],
  "แผน": ["นักวิเคราะห์นโยบายและแผน"],

  // Public Relations & HR
  "ประชาสัมพันธ์": ["นักประชาสัมพันธ์", "เจ้าหน้าที่ประชาสัมพันธ์"],
  "บุคคล": ["นักทรัพยากรบุคคล", "เจ้าหน้าที่บริหารงานบุคคล", "hr"],
  "hr": ["นักทรัพยากรบุคคล", "เจ้าหน้าที่บริหารงานบุคคล"],

  // OCSC & Government exams
  "กพ": ["ก.พ.", "สำนักงาน ก.พ.", "ภาค ก", "ocsc"],
  "ก.พ.": ["กพ", "สำนักงาน ก.พ.", "ภาค ก", "ocsc"],
  "ocsc": ["ก.พ.", "กพ", "สำนักงาน ก.พ."],

  // Common Local Government / Org abbreviations
  "กทม": ["กรุงเทพมหานคร", "กรุงเทพ"],
  "กรุงเทพ": ["กรุงเทพมหานคร", "กทม"],
  "อบต": ["องค์การบริหารส่วนตำบล", "ท้องถิ่น"],
  "อบจ": ["องค์การบริหารส่วนจังหวัด", "ท้องถิ่น"],
  "เทศบาล": ["เทศบาลนคร", "เทศบาลเมือง", "เทศบาลตำบล", "ท้องถิ่น"],
  "สตง": ["สำนักงานการตรวจเงินแผ่นดิน"],
  "สตง.": ["สำนักงานการตรวจเงินแผ่นดิน"],
  "dsi": ["กรมสอบสวนคดีพิเศษ", "ดีเอสไอ"],
};

/**
 * Expand a search query with synonyms and acronym expansions.
 */
export function expandSynonyms(word) {
  if (!word) return [];
  const clean = word.toLowerCase().trim();
  const normalized = normalizeThai(clean);
  const expansions = new Set();

  // Direct lookup
  if (THAI_GOV_SYNONYMS[clean]) {
    THAI_GOV_SYNONYMS[clean].forEach((s) => expansions.add(s));
  }
  // Normalized lookup (e.g. ก.พ. -> กพ)
  if (THAI_GOV_SYNONYMS[normalized]) {
    THAI_GOV_SYNONYMS[normalized].forEach((s) => expansions.add(s));
  }

  return Array.from(expansions);
}

// 4. Levenshtein Distance & Fuzzy Matching
export function levenshteinDistance(s1, s2) {
  if (s1 === s2) return 0;
  if (!s1 || !s1.length) return s2 ? s2.length : 0;
  if (!s2 || !s2.length) return s1.length;

  const a = s1.toLowerCase();
  const b = s2.toLowerCase();

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Evaluates match quality between a search token and target text.
 * Returns { matched: boolean, score: number, isExact: boolean, isTypo: boolean, suggestion: string }
 */
export function matchToken(token, target) {
  if (!token || !target) return { matched: false, score: 0 };

  const tok = token.toLowerCase().trim();
  const tgt = target.toLowerCase().trim();

  // 1. Exact match
  if (tgt === tok) {
    return { matched: true, score: 1.0, isExact: true };
  }

  // 2. Direct Substring match
  const subIdx = tgt.indexOf(tok);
  if (subIdx !== -1) {
    // If it's at the beginning of the word, give slightly higher score
    const score = subIdx === 0 ? 0.95 : 0.85;
    return { matched: true, score, isExact: true };
  }

  // 3. Normalized match (e.g. dots or spaces removed)
  const normTok = normalizeThai(tok);
  const normTgt = normalizeThai(tgt);
  if (normTgt.includes(normTok)) {
    return { matched: true, score: 0.90, isExact: true };
  }

  // 4. Consonant skeleton match (e.g. ธรการ vs ธุรการ, บัณชี vs บัญชี)
  if (tok.length >= 3) {
    const skelTok = getThaiSkeleton(tok);
    const skelTgt = getThaiSkeleton(tgt);
    if (skelTok.length >= 3 && skelTgt.includes(skelTok)) {
      return { matched: true, score: 0.82, isTypo: true };
    }
  }

  // 5. Fuzzy / Typo tolerance via Levenshtein
  // For tokens length < 4, DO NOT do fuzzy/typo matching (avoids false positives on short syllables)
  // For tokens length 4-5, allow distance <= 1
  // For tokens length 6+, allow distance <= 2
  if (tok.length >= 4) {
    const maxAllowedDist = tok.length <= 5 ? 1 : 2;

    // Check sliding window across target if target is longer
    if (tgt.length >= tok.length) {
      const windowSize = tok.length;
      for (let i = 0; i <= tgt.length - windowSize; i++) {
        const sub = tgt.slice(i, i + windowSize);
        const dist = levenshteinDistance(tok, sub);
        if (dist <= maxAllowedDist) {
          const score = 0.85 - (dist / windowSize) * 0.3;
          return { matched: true, score, isTypo: true };
        }
      }
    } else {
      const dist = levenshteinDistance(tok, tgt);
      if (dist <= maxAllowedDist) {
        const score = 0.80 - (dist / tok.length) * 0.3;
        return { matched: true, score, isTypo: true };
      }
    }
  }

  return { matched: false, score: 0 };
}
