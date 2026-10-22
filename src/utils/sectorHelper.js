/**
 * sectorHelper.js
 * Intelligent Workplace Sector Classifier for ReadyToGovTH
 * 
 * Separates "Contract Type" (ข้าราชการ, พนักงานราชการ, etc.)
 * from "Workplace Sector" (โรงพยาบาล, สถานศึกษา, ท้องถิ่น, etc.)
 */

export const SECTOR_MAP = {
  hospital: {
    id: "hospital",
    label: "โรงพยาบาล & สาธารณสุข",
    shortLabel: "โรงพยาบาล/สธ.",
    icon: "🏥",
    badgeClass: "badge-sector-hospital",
    color: "#059669",
    bgSoft: "rgba(5, 150, 105, 0.12)",
    border: "rgba(5, 150, 105, 0.3)",
    desc: "โรงพยาบาลศูนย์ โรงพยาบาลชุมชน รพ.สต. สำนักงานสาธารณสุขจังหวัด (สสจ.) และหน่วยงานในสังกัดกระทรวงสาธารณสุข",
    keywords: [
      "โรงพยาบาล", "รพ.", "สาธารณสุข", "สสจ.", "สสอ.", "รพ.สต.",
      "กรมการแพทย์", "การแพทย์", "ควบคุมโรค", "กรมอนามัย", "สุขภาพจิต",
      "วิทยาศาสตร์การแพทย์", "ทันตแพทย์", "ทันตกรรม", "เภสัช", "พยาบาล", "แพทย์",
      "ศูนย์การแพทย์", "เวชศาสตร์", "สป.สธ", "กระทรวงสาธารณสุข", "รพ.ตำรวจ",
      "สปสช", "สวรส", "แพทยสภา", "สภาการพยาบาล"
    ],
  },
  teacher: {
    id: "teacher",
    label: "ครู & อาจารย์",
    shortLabel: "ครู/อาจารย์",
    icon: "🧑‍🏫",
    badgeClass: "badge-sector-teacher",
    color: "#7c3aed",
    bgSoft: "rgba(124, 58, 237, 0.12)",
    border: "rgba(124, 58, 237, 0.3)",
    desc: "ครูผู้ช่วย ครูอัตราจ้าง อาจารย์ผู้สอน บุคลากรทางการศึกษา และตำแหน่งสายงานการสอน",
    keywords: [
      "ครูผู้ช่วย", "ครูอัตราจ้าง", "ครูผู้สอน", "ครูพี่เลี้ยง", "ครู",
      "อาจารย์", "ผู้ช่วยสอน", "ก.ค.ศ.", "กคศ."
    ],
  },
  education: {
    id: "education",
    label: "งานในสถานศึกษา & มหาวิทยาลัย",
    shortLabel: "สถานศึกษา",
    icon: "🏫",
    badgeClass: "badge-sector-education",
    color: "#4f46e5",
    bgSoft: "rgba(79, 70, 229, 0.12)",
    border: "rgba(79, 70, 229, 0.3)",
    desc: "โรงเรียน มหาวิทยาลัย วิทยาลัย อาชีวศึกษา สพฐ. กศน./สกร. และกระทรวงศึกษาธิการ (สายงานสนับสนุนและบริหาร)",
    keywords: [
      "มหาวิทยาลัย", "มรภ.", "มทร.", "วิทยาลัย", "โรงเรียน",
      "สพฐ.", "สพม.", "สพป.", "กศน.", "สกร.", "ศึกษาธิการ", "คุรุสภา",
      "การศึกษาขั้นพื้นฐาน", "อาชีวศึกษา", "สอศ.", "การอุดมศึกษา", "อว.",
      "กระทรวงศึกษาธิการ", "สถาบันการอาชีวศึกษา", "โรงเรียนสาธิต"
    ],
  },
  security: {
    id: "security",
    label: "ตำรวจ ทหาร & ความมั่นคง",
    shortLabel: "ตำรวจ/ทหาร",
    icon: "🛡️",
    badgeClass: "badge-sector-security",
    color: "#0f766e",
    bgSoft: "rgba(15, 118, 110, 0.12)",
    border: "rgba(15, 118, 110, 0.3)",
    desc: "สำนักงานตำรวจแห่งชาติ กองทัพบก กองทัพเรือ กองทัพอากาศ กระทรวงกลาโหม และหน่วยงานความมั่นคง",
    keywords: [
      "ตำรวจ", "สตช.", "สตช ", "สตช", "บช.ก.", "บชน.", "ตชด.", "ตม.",
      "ทหาร", "กองทัพ", "กองทัพบก", "ทบ.", "ทบ ", "กองทัพเรือ", "ทร.", "ทร ",
      "กองทัพอากาศ", "ทอ.", "ทอ ", "กลาโหม", "กอ.รมน.", "บก.ทท.",
      "กองบัญชาการกองทัพไทย", "นายร้อย", "นายสิบ", "พลอาสา", "ทหารพราน", "สารวัตรทหาร"
    ],
  },
  local: {
    id: "local",
    label: "ท้องถิ่น (อปท.)",
    shortLabel: "ท้องถิ่น อปท.",
    icon: "🏡",
    badgeClass: "badge-sector-local",
    color: "#d97706",
    bgSoft: "rgba(217, 119, 6, 0.12)",
    border: "rgba(217, 119, 6, 0.3)",
    desc: "องค์การบริหารส่วนจังหวัด (อบจ.) เทศบาล องค์การบริหารส่วนตำบล (อบต.) และเมืองพัทยา",
    keywords: [
      "องค์การบริหารส่วนจังหวัด", "อบจ.", "อบจ ", "เทศบาล", "องค์การบริหารส่วนตำบล",
      "อบต.", "อบต ", "เมืองพัทยา", "อปท.", "อปท "
    ],
  },
  state: {
    id: "state",
    label: "รัฐวิสาหกิจ",
    shortLabel: "รัฐวิสาหกิจ",
    icon: "🏢",
    badgeClass: "badge-sector-state",
    color: "#0284c7",
    bgSoft: "rgba(2, 132, 199, 0.12)",
    border: "rgba(2, 132, 199, 0.3)",
    desc: "องค์กรรัฐวิสาหกิจ การไฟฟ้า การประปา ธนาคารรัฐ และการคมนาคมขนส่ง",
    keywords: [
      "การไฟฟ้า", "กฟผ.", "กฟภ.", "กฟน.", "กฟผ", "กฟภ", "กฟน", "pea", "egat", "mea",
      "การประปา", "กปภ.", "กปน.", "กปภ", "กปน", "ปตท.", "ปตท", "ptt",
      "ธ.ก.ส.", "ธกส.", "baac", "ธอส.", "ธนาคารออมสิน", "การท่าเรือ",
      "การทางพิเศษ", "ขสมก.", "ขสมก", "รฟท.", "รฟท", "รฟม.", "รฟม",
      "ไปรษณีย์ไทย", "ทอท.", "aerothai", "การบินไทย", "ยาสูบ"
    ],
  },
  judicial: {
    id: "judicial",
    label: "ศาล & องค์กรอิสระ",
    shortLabel: "ศาล/องค์กรอิสระ",
    icon: "⚖️",
    badgeClass: "badge-sector-judicial",
    color: "#b91c1c",
    bgSoft: "rgba(185, 28, 28, 0.12)",
    border: "rgba(185, 28, 28, 0.3)",
    desc: "ศาลยุติธรรม ศาลปกครอง สำนักงานอัยการสูงสุด ป.ป.ช. สตง. และรัฐสภา",
    keywords: [
      "ศาลยุติธรรม", "ศาลปกครอง", "ศาลรัฐธรรมนูญ", "สำนักงานศาล", "อัยการ",
      "ป.ป.ช.", "ปปช.", "สตง.", "การตรวจเงินแผ่นดิน", "ผู้ตรวจการแผ่นดิน",
      "กกต.", "กสม.", "รัฐสภา", "สภาผู้แทนราษฎร", "วุฒิสภา"
    ],
  },
  central: {
    id: "central",
    label: "กระทรวง & กรมทั่วไป",
    shortLabel: "กระทรวง/กรม",
    icon: "🏛️",
    badgeClass: "badge-sector-central",
    color: "#2563eb",
    bgSoft: "rgba(37, 99, 235, 0.12)",
    border: "rgba(37, 99, 235, 0.3)",
    desc: "กระทรวง ทบวง กรม ข้าราชการพลเรือนส่วนกลางและส่วนภูมิภาค",
    keywords: [],
  },
};

/**
 * Filter list items for UI selection
 */
export const SECTOR_ITEMS = [
  { id: "all", label: "แวดวงทั้งหมด", shortLabel: "ทุกแวดวง", icon: "🌐" },
  { id: "hospital", label: "โรงพยาบาล & สาธารณสุข", shortLabel: "สาธารณสุข", icon: "🏥" },
  { id: "teacher", label: "ครู & อาจารย์", shortLabel: "ครู/อาจารย์", icon: "🧑‍🏫" },
  { id: "education", label: "งานในสถานศึกษา & มหาวิทยาลัย", shortLabel: "สถานศึกษา", icon: "🏫" },
  { id: "security", label: "ตำรวจ ทหาร & ความมั่นคง", shortLabel: "ตำรวจ/ทหาร", icon: "🛡️" },
  { id: "local", label: "ท้องถิ่น (อปท.)", shortLabel: "ท้องถิ่น", icon: "🏡" },
  { id: "judicial", label: "ศาล & องค์กรอิสระ", shortLabel: "ศาล/อิสระ", icon: "⚖️" },
  { id: "central", label: "กระทรวง & กรมทั่วไป", shortLabel: "กระทรวง/กรม", icon: "🏛️" },
];

/**
 * Determine the sector for a given job announcement.
 * 1. Checks explicit job.sector
 * 2. Checks category (e.g. รัฐวิสาหกิจ)
 * 3. Checks department, title, and description keywords
 * 4. Defaults to "central"
 */
export function getJobSector(job) {
  if (!job) return "central";

  // 1. Explicit sector on job object
  if (job.sector && SECTOR_MAP[job.sector]) {
    return job.sector;
  }

  // 2. State Enterprise category
  const categories = job.categories || (job.category ? [job.category] : []);
  if (categories.includes("รัฐวิสาหกิจ")) {
    return "state";
  }

  const deptRaw = job.department || "";
  const descRaw = job.description || "";
  const positionsRaw = Array.isArray(job.positionList)
    ? job.positionList.map((p) => p.title || "").join(" ")
    : "";
  const fullText = `${deptRaw} ${descRaw} ${positionsRaw}`;

  // ── Smart keyword testing supporting exact words and abbreviations with dots ──
  const testSectorMatch = (keywords, text, full) => {
    return keywords.some((kw) => {
      // If regex pattern
      if (kw instanceof RegExp) {
        return kw.test(text) || kw.test(full);
      }
      // If contains dot (abbreviation like รพ., สสจ., อบต.)
      if (kw.includes(".")) {
        const escaped = kw.replace(/\./g, "\\.");
        // Match abbreviation bounded by non-Thai letters or start/end
        const regex = new RegExp(`(^|[^\\u0E01-\\u0E2E])${escaped}`, "i");
        return regex.test(text) || regex.test(full);
      }
      // Standard word substring search (case-insensitive for English like pea, egat)
      const kwLower = kw.toLowerCase();
      return text.toLowerCase().includes(kwLower) || full.toLowerCase().includes(kwLower);
    });
  };

  // Priority check order:
  // 1. Hospital & Healthcare
  if (testSectorMatch(SECTOR_MAP.hospital.keywords, deptRaw, fullText)) {
    return "hospital";
  }

  // 2. Teachers & Teaching Staff (checked on positions title or teaching keywords)
  if (testSectorMatch(SECTOR_MAP.teacher.keywords, positionsRaw, fullText)) {
    return "teacher";
  }

  // 3. Police, Military & Security
  if (testSectorMatch(SECTOR_MAP.security.keywords, deptRaw, fullText)) {
    return "security";
  }

  // 4. Education Institutions & Universities (campus staff, administration, universities)
  if (testSectorMatch(SECTOR_MAP.education.keywords, deptRaw, fullText)) {
    return "education";
  }

  // 3. Local Government (อปท.)
  if (testSectorMatch(SECTOR_MAP.local.keywords, deptRaw, fullText)) {
    return "local";
  }

  // 4. Judicial & Autonomous
  if (testSectorMatch(SECTOR_MAP.judicial.keywords, deptRaw, fullText)) {
    return "judicial";
  }

  // 5. State Enterprise keyword in department or text
  if (testSectorMatch(SECTOR_MAP.state.keywords, deptRaw, fullText)) {
    return "state";
  }

  // Fallback: Central Government
  return "central";
}

/**
 * Get sector metadata object.
 */
export function getJobSectorMeta(sectorOrJob) {
  const sectorId = typeof sectorOrJob === "object" ? getJobSector(sectorOrJob) : sectorOrJob;
  return SECTOR_MAP[sectorId] || SECTOR_MAP.central;
}

/**
 * Check if a job matches a selected sector filter.
 */
export function matchesSector(job, sectorFilter) {
  if (!sectorFilter || sectorFilter === "all") return true;
  return getJobSector(job) === sectorFilter;
}

/**
 * Calculate sector statistics for a list of jobs.
 */
export function calculateSectorStats(jobs) {
  if (!jobs || jobs.length === 0) return [];

  const counts = {};
  Object.keys(SECTOR_MAP).forEach((key) => {
    counts[key] = {
      id: key,
      meta: SECTOR_MAP[key],
      jobCount: 0,
      positionCount: 0,
    };
  });

  jobs.forEach((job) => {
    const sectorId = getJobSector(job);
    const target = counts[sectorId] || counts.central;
    target.jobCount += 1;
    const positions = (job.positionList || []).reduce(
      (acc, p) => acc + (parseInt(p.count, 10) || 1),
      0
    );
    target.positionCount += positions;
  });

  const total = jobs.length;
  return Object.values(counts)
    .map((item) => ({
      ...item,
      percentage: total > 0 ? ((item.jobCount / total) * 100).toFixed(1) : "0.0",
    }))
    .sort((a, b) => b.jobCount - a.jobCount);
}
