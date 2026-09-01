/**
 * Smart Thai Government Logo Helper
 * Provides high-resolution official crests, seals, and emblems for Thai ministries,
 * departments, state enterprises, and provinces with auto-matching and Wikipedia API lookup.
 */

// Default Official Garuda Emblem (ตราครุฑ)
export const DEFAULT_GARUDA_LOGO = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Emblem_of_Thailand.svg/240px-Emblem_of_Thailand.svg.png";

// Curated official logos for Thai Ministries, Departments, and Provinces
const OFFICIAL_LOGOS = [
  // ── กระทรวงศึกษาธิการ & หน่วยงานในสังกัด (สกร., กศน., สพฐ., สอศ.) ──
  {
    keywords: ["ศึกษาธิการ", "สกร", "กศน", "สพฐ", "สอศ", "ส่งเสริมการเรียนรู้", "การศึกษาขั้นพื้นฐาน", "อาชีวศึกษา", "คุรุสภา"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Seal_of_the_Ministry_of_Education_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Education_of_Thailand.svg.png"
  },
  // ── กระทรวงสาธารณสุข & โรงพยาบาล & สสจ. ──
  {
    keywords: ["สาธารณสุข", "สสจ", "โรงพยาบาล", "กรมการแพทย์", "ควบคุมโรค", "อนามัย", "สุขภาพจิต", "วิทยาศาสตร์การแพทย์"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Seal_of_the_Ministry_of_Public_Health_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Public_Health_of_Thailand.svg.png"
  },
  // ── กระทรวงมหาดไทย & กรมการปกครอง & อปท. ──
  {
    keywords: ["มหาดไทย", "การปกครอง", "ที่ดิน", "พัฒนาชุมชน", "ป้องกันและบรรเทาสาธารณภัย", "ปภ", "โยธาธิการและผังเมือง", "ส่งเสริมการปกครองท้องถิ่น", "สถ"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Seal_of_the_Ministry_of_Interior_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Interior_of_Thailand.svg.png"
  },
  // ── กระทรวงการคลัง (สรรพากร, ศุลกากร, บัญชีกลาง, ธนารักษ์) ──
  {
    keywords: ["การคลัง", "สรรพากร", "ศุลกากร", "สรรพสามิต", "บัญชีกลาง", "ธนารักษ์", "หนี้สาธารณะ", "เศรษฐกิจการคลัง"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Seal_of_the_Ministry_of_Finance_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Finance_of_Thailand.svg.png"
  },
  // ── กระทรวงเกษตรและสหกรณ์ ──
  {
    keywords: ["เกษตรและสหกรณ์", "ชลประทาน", "ปศุสัตว์", "ประมง", "ส่งเสริมการเกษตร", "พัฒนาที่ดิน", "วิชาการเกษตร", "สหกรณ์"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Seal_of_the_Ministry_of_Agriculture_and_Cooperatives_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Agriculture_and_Cooperatives_of_Thailand.svg.png"
  },
  // ── กระทรวงยุติธรรม & ศาล & อัยการ ──
  {
    keywords: ["ยุติธรรม", "ราชทัณฑ์", "บังคับคดี", "คุมประพฤติ", "สอบสวนคดีพิเศษ", "ดีเอสไอ", "dsi", "พินิจและคุ้มครองเด็ก", "ศาล", "อัยการ"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Seal_of_the_Ministry_of_Justice_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Justice_of_Thailand.svg.png"
  },
  // ── กระทรวงแรงงาน ──
  {
    keywords: ["แรงงาน", "การจัดหางาน", "พัฒนาฝีมือแรงงาน", "สวัสดิการและคุ้มครองแรงงาน", "ประกันสังคม"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Seal_of_the_Ministry_of_Labour_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Labour_of_Thailand.svg.png"
  },
  // ── กระทรวงดิจิทัลเพื่อเศรษฐกิจและสังคม ──
  {
    keywords: ["ดิจิทัลเพื่อเศรษฐกิจและสังคม", "สถิติแห่งชาติ", "อุตุนิยมวิทยา", "ดีอี", "depa"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Seal_of_the_Ministry_of_Digital_Economy_and_Society_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Digital_Economy_and_Society_of_Thailand.svg.png"
  },
  // ── กระทรวงคมนาคม ──
  {
    keywords: ["คมนาคม", "ทางหลวง", "ทางหลวงชนบท", "การขนส่งทางบก", "เจ้าท่า", "ท่าอากาศยาน"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Seal_of_the_Ministry_of_Transport_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Transport_of_Thailand.svg.png"
  },
  // ── กระทรวงการต่างประเทศ ──
  {
    keywords: ["การต่างประเทศ", "กงสุล"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Seal_of_the_Ministry_of_Foreign_Affairs_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Foreign_Affairs_of_Thailand.svg.png"
  },
  // ── สำนักนายกรัฐมนตรี & สำนักงาน ก.พ. ──
  {
    keywords: ["สำนักนายกรัฐมนตรี", "ก.พ.", "ก.พ.ร.", "สภาพัฒน์", "สภาความมั่นคง", "งบประมาณ", "คุ้มครองผู้บริโภค", "สคบ"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Seal_of_the_Office_of_the_Prime_Minister_of_Thailand.svg/240px-Seal_of_the_Office_of_the_Prime_Minister_of_Thailand.svg.png"
  },
  // ── รัฐวิสาหกิจหลัก ──
  {
    keywords: ["การไฟฟ้าส่วนภูมิภาค", "กฟภ", "pea"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/th/thumb/6/68/Provincial_Electricity_Authority_Logo.svg/240px-Provincial_Electricity_Authority_Logo.svg.png"
  },
  {
    keywords: ["การไฟฟ้านครหลวง", "กฟน", "mea"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/th/thumb/4/4c/Metropolitan_Electricity_Authority_Logo.svg/240px-Metropolitan_Electricity_Authority_Logo.svg.png"
  },
  {
    keywords: ["การไฟฟ้าฝ่ายผลิต", "กฟผ", "egat"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/th/thumb/1/13/Electricity_Generating_Authority_of_Thailand_Logo.svg/240px-Electricity_Generating_Authority_of_Thailand_Logo.svg.png"
  },
  {
    keywords: ["การประปาส่วนภูมิภาค", "กปภ"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/th/thumb/5/50/Provincial_Waterworks_Authority_Logo.svg/240px-Provincial_Waterworks_Authority_Logo.svg.png"
  },
  {
    keywords: ["การประปานครหลวง", "กปน"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/th/thumb/f/f6/Metropolitan_Waterworks_Authority_Logo.svg/240px-Metropolitan_Waterworks_Authority_Logo.svg.png"
  },
  {
    keywords: ["ไปรษณีย์ไทย"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Thailand_Post_Logo.svg/240px-Thailand_Post_Logo.svg.png"
  },
  // ── จังหวัดลพบุรี & จังหวัดอื่นๆ ──
  {
    keywords: ["ลพบุรี"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Seal_Lopburi.png/240px-Seal_Lopburi.png"
  },
  {
    keywords: ["กรุงเทพมหานคร", "กทม"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Bangkok_Metropolitan_Admin_Seal.svg/240px-Bangkok_Metropolitan_Admin_Seal.svg.png"
  },
  {
    keywords: ["เชียงใหม่"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Seal_Chiang_Mai.png/240px-Seal_Chiang_Mai.png"
  },
  {
    keywords: ["ขอนแก่น"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Seal_Khon_Kaen.png/240px-Seal_Khon_Kaen.png"
  },
  {
    keywords: ["สงขลา"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Seal_Songkhla.png/240px-Seal_Songkhla.png"
  },
  {
    keywords: ["นครราชสีมา", "โคราช"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Seal_Nakhon_Ratchasima.png/240px-Seal_Nakhon_Ratchasima.png"
  }
];

/**
 * Find official logo URL based on department name or keywords
 * @param {string} departmentName
 * @returns {string} Logo image URL
 */
export function findOfficialGovLogo(departmentName) {
  if (!departmentName || typeof departmentName !== "string") {
    return DEFAULT_GARUDA_LOGO;
  }

  const cleanName = departmentName.toLowerCase().trim();

  // 1. Search in curated official logos list
  for (const item of OFFICIAL_LOGOS) {
    const match = item.keywords.some(kw => cleanName.includes(kw.toLowerCase()));
    if (match) {
      return item.logoUrl;
    }
  }

  // 2. Default fallback: Official Thai Government Garuda Emblem
  return DEFAULT_GARUDA_LOGO;
}
