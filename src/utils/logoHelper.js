/**
 * Smart Thai Government Logo Helper
 * Provides high-resolution official crests, seals, and emblems for Thai ministries,
 * departments, state enterprises, and provinces with auto-matching.
 */

// Default Official Garuda Emblem (ตราครุฑ)
export const DEFAULT_GARUDA_LOGO = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Emblem_of_Thailand.svg/240px-Emblem_of_Thailand.svg.png";

// Curated official logos for Thai Ministries, Departments, Independent Agencies, and Provinces
const OFFICIAL_LOGOS = [
  // ── กระทรวงอุตสาหกรรม (สมอ., กพร., ดีพร้อม, กรมโรงงาน) ──
  {
    keywords: ["อุตสาหกรรม", "สมอ", "กพร", "ดีพร้อม", "diprom", "โรงงานอุตสาหกรรม", "ส่งเสริมอุตสาหกรรม"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Seal_of_the_Ministry_of_Industry_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Industry_of_Thailand.svg.png"
  },
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
    keywords: ["มหาดไทย", "การปกครอง", "ที่ดิน", "พัฒนาชุมชน", "ป้องกันและบรรเทาสาธารณภัย", "ปภ", "โยธาธิการและผังเมือง", "ส่งเสริมการปกครองท้องถิ่น", "สถ", "เทศบาล", "อบต", "อบจ"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Seal_of_the_Ministry_of_Interior_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Interior_of_Thailand.svg.png"
  },
  // ── กระทรวงการคลัง (สรรพากร, ศุลกากร, บัญชีกลาง, ธนารักษ์) ──
  {
    keywords: ["การคลัง", "สรรพากร", "ศุลกากร", "สรรพสามิต", "บัญชีกลาง", "ธนารักษ์", "หนี้สาธารณะ", "เศรษฐกิจการคลัง"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Seal_of_the_Ministry_of_Finance_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Finance_of_Thailand.svg.png"
  },
  // ── กระทรวงเกษตรและสหกรณ์ ──
  {
    keywords: ["เกษตรและสหกรณ์", "ชลประทาน", "ปศุสัตว์", "ประมง", "ส่งเสริมการเกษตร", "พัฒนาที่ดิน", "วิชาการเกษตร", "สหกรณ์", "ข้าว", "ฝนหลวง"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Seal_of_the_Ministry_of_Agriculture_and_Cooperatives_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Agriculture_and_Cooperatives_of_Thailand.svg.png"
  },
  // ── กระทรวงพาณิชย์ ──
  {
    keywords: ["พาณิชย์", "การค้าภายใน", "ทรัพย์สินทางปัญญา", "พัฒนาธุรกิจการค้า", "ส่งเสริมการค้าระหว่างประเทศ", "การค้าต่างประเทศ", "เจรจาการค้าระหว่างประเทศ"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Seal_of_the_Ministry_of_Commerce_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Commerce_of_Thailand.svg.png"
  },
  // ── กระทรวงดิจิทัลเพื่อเศรษฐกิจและสังคม ──
  {
    keywords: ["ดิจิทัลเพื่อเศรษฐกิจและสังคม", "สถิติแห่งชาติ", "อุตุนิยมวิทยา", "ดีอี", "depa", "nt"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Seal_of_the_Ministry_of_Digital_Economy_and_Society_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Digital_Economy_and_Society_of_Thailand.svg.png"
  },
  // ── กระทรวงคมนาคม ──
  {
    keywords: ["คมนาคม", "ทางหลวง", "ทางหลวงชนบท", "การขนส่งทางบก", "เจ้าท่า", "ท่าอากาศยาน", "ขบ"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Seal_of_the_Ministry_of_Transport_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Transport_of_Thailand.svg.png"
  },
  // ── กระทรวงการต่างประเทศ ──
  {
    keywords: ["การต่างประเทศ", "กงสุล", "ความร่วมมือระหว่างประเทศ"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Seal_of_the_Ministry_of_Foreign_Affairs_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Foreign_Affairs_of_Thailand.svg.png"
  },
  // ── กระทรวงยุติธรรม & ศาล & อัยการ ──
  {
    keywords: ["ยุติธรรม", "ราชทัณฑ์", "บังคับคดี", "คุมประพฤติ", "สอบสวนคดีพิเศษ", "ดีเอสไอ", "dsi", "พินิจและคุ้มครองเด็ก", "นิติวิทยาศาสตร์"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Seal_of_the_Ministry_of_Justice_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Justice_of_Thailand.svg.png"
  },
  // ── กระทรวงแรงงาน ──
  {
    keywords: ["แรงงาน", "การจัดหางาน", "พัฒนาฝีมือแรงงาน", "สวัสดิการและคุ้มครองแรงงาน", "ประกันสังคม"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Seal_of_the_Ministry_of_Labour_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Labour_of_Thailand.svg.png"
  },
  // ── กระทรวงพลังงาน ──
  {
    keywords: ["พลังงาน", "เชื้อเพลิงธรรมชาติ", "ธุรกิจพลังงาน", "พัฒนาพลังงานทดแทน"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Seal_of_the_Ministry_of_Energy_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Energy_of_Thailand.svg.png"
  },
  // ── กระทรวงวัฒนธรรม ──
  {
    keywords: ["วัฒนธรรม", "ศิลปากร", "ศาสนา"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Seal_of_the_Ministry_of_Culture_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Culture_of_Thailand.svg.png"
  },
  // ── กระทรวงการท่องเที่ยวและกีฬา ──
  {
    keywords: ["การท่องเที่ยวและกีฬา", "การท่องเที่ยว", "พลศึกษา", "การกีฬาแห่งประเทศไทย"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Seal_of_the_Ministry_of_Tourism_and_Sports_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Tourism_and_Sports_of_Thailand.svg.png"
  },
  // ── กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม (อว.) ──
  {
    keywords: ["อุดมศึกษา", "อว", "วิทยาศาสตร์และเทคโนโลยี", "สวทช", "วว", "มหาวิทยาลัย"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Seal_of_the_Ministry_of_Higher_Education%2C_Science%2C_Research_and_Innovation_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Higher_Education%2C_Science%2C_Research_and_Innovation_of_Thailand.svg.png"
  },
  // ── กระทรวงทรัพยากรธรรมชาติและสิ่งแวดล้อม ──
  {
    keywords: ["ทรัพยากรธรรมชาติ", "ป่าไม้", "อุทยานแห่งชาติ", "ควบคุมมลพิษ", "ทส", "ทรัพยากรทางทะเลและชายฝั่ง", "ทรัพยากรน้ำ"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Seal_of_the_Ministry_of_Natural_Resources_and_Environment_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Natural_Resources_and_Environment_of_Thailand.svg.png"
  },
  // ── กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์ (พม.) ──
  {
    keywords: ["พัฒนาสังคม", "พม", "กิจการเด็ก", "ผู้สูงอายุ", "คนพิการ", "สตรีและสถาบันครอบครัว"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Seal_of_the_Ministry_of_Social_Development_and_Human_Security_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Social_Development_and_Human_Security_of_Thailand.svg.png"
  },
  // ── กระทรวงกลาโหม & เหล่าทัพ ──
  {
    keywords: ["กลาโหม", "กองทัพบก", "กองทัพเรือ", "กองทัพอากาศ", "กองบัญชาการกองทัพไทย"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Seal_of_the_Ministry_of_Defence_of_Thailand.svg/240px-Seal_of_the_Ministry_of_Defence_of_Thailand.svg.png"
  },
  // ── สำนักนายกรัฐมนตรี & สำนักงาน ก.พ. ──
  {
    keywords: ["สำนักนายกรัฐมนตรี", "ก.พ.", "ก.พ.ร.", "สภาพัฒน์", "สภาความมั่นคง", "งบประมาณ", "คุ้มครองผู้บริโภค", "สคบ", "ประชาสัมพันธ์"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Seal_of_the_Office_of_the_Prime_Minister_of_Thailand.svg/240px-Seal_of_the_Office_of_the_Prime_Minister_of_Thailand.svg.png"
  },
  // ── สำนักงานตำรวจแห่งชาติ ──
  {
    keywords: ["ตำรวจ", "สตช", "ตร."],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Emblem_of_the_Royal_Thai_Police.svg/240px-Emblem_of_the_Royal_Thai_Police.svg.png"
  },
  // ── ศาล & อัยการ ──
  {
    keywords: ["ศาลยุติธรรม", "ศาลปกครอง", "ศาลรัฐธรรมนูญ", "สำนักงานศาล"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Seal_of_the_Courts_of_Justice_of_Thailand.svg/240px-Seal_of_the_Courts_of_Justice_of_Thailand.svg.png"
  },
  {
    keywords: ["อัยการ"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Seal_of_the_Office_of_the_Attorney_General_of_Thailand.svg/240px-Seal_of_the_Office_of_the_Attorney_General_of_Thailand.svg.png"
  },
  // ── องค์กรอิสระ ──
  {
    keywords: ["ป.ป.ช", "ปปช", "ป้องกันและปราบปรามการทุจริต"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Seal_of_the_National_Anti-Corruption_Commission_of_Thailand.svg/240px-Seal_of_the_National_Anti-Corruption_Commission_of_Thailand.svg.png"
  },
  {
    keywords: ["การตรวจเงินแผ่นดิน", "สตง"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Emblem_of_Thailand.svg/240px-Emblem_of_Thailand.svg.png"
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
  // ── จังหวัดหลักๆ ──
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
