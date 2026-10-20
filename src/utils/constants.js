// ─── Shared Category Map ────────────────────────────────────────────────────
// Used by: JobCard, JobDetailModal
export const CATEGORY_MAP = {
  ข้าราชการ:              { badge: "badge-civil",      icon: "🏛️" },
  พนักงานราชการ:           { badge: "badge-government", icon: "📋" },
  รัฐวิสาหกิจ:             { badge: "badge-state",      icon: "🏢" },
  ลูกจ้างชั่วคราว:          { badge: "badge-temp",       icon: "📝" },
  พนักงานหน่วยงานของรัฐ:    { badge: "badge-agency",     icon: "🏫" },
};


// Education badge color map (used by JobDetailModal)
export const EDU_COLORS = {
  "ม.3":        { bg: "#f3f4f6", border: "#d1d5db", color: "#374151" },
  "ม.6":        { bg: "#e0f2fe", border: "#bae6fd", color: "#0369a1" },
  "ปวช.":       { bg: "#fef9c3", border: "#fde047", color: "#713f12" },
  "ปวส.":       { bg: "#ffedd5", border: "#fdba74", color: "#7c2d12" },
  "ปริญญาตรี":  { bg: "#dbeafe", border: "#93c5fd", color: "#1e3a8a" },
  "ปริญญาโท":   { bg: "#ede9fe", border: "#a78bfa", color: "#4c1d95" },
  "ปริญญาเอก":  { bg: "#fce7f3", border: "#f9a8d4", color: "#831843" },
  "ไม่จำกัดวุฒิ": { bg: "#dcfce7", border: "#86efac", color: "#14532d" },
};

// Education levels selectable in the job filter (order matters for UI)
// Used by: App (URL ?edu= validation), JobList (hero pills + mobile select)
export const EDUCATION_LEVELS = ["ม.3", "ม.6", "ปวช.", "ปวส.", "ปริญญาตรี", "ปริญญาโท", "ปริญญาเอก"];

// ─── Application Tracker Statuses ──────────────────────────────────────────
export const APPLICATION_STATUS = {
  INTERESTED: "interested", // สนใจ / บันทึกไว้
  APPLIED:    "applied",    // สมัครแล้ว
  EXAM:       "exam",       // รอสอบ
  RESULT:     "result",     // รอประกาศผล
  PASSED:     "passed",     // ผ่านการคัดเลือก
  FAILED:     "failed",     // ไม่ผ่าน
};

export const STATUS_CONFIG = {
  interested: {
    id: "interested",
    label: "สนใจ / เล็งไว้",
    shortLabel: "สนใจ",
    badgeClass: "status-badge-interested",
    icon: "📌",
    color: "#4f46e5",
    bg: "#eef2ff",
    border: "#c7d2fe",
    desc: "บันทึกงานไว้พิจารณา ยังไม่ได้ยื่นใบสมัคร",
    nextPrompt: "ยื่นใบสมัครแล้วหรือยัง?",
    nextStatus: "applied",
    nextLabel: "เปลี่ยนเป็น 'สมัครแล้ว'",
  },
  applied: {
    id: "applied",
    label: "สมัครแล้ว",
    shortLabel: "สมัครแล้ว",
    badgeClass: "status-badge-applied",
    icon: "📝",
    color: "#0284c7",
    bg: "#e0f2fe",
    border: "#bae6fd",
    desc: "ส่งใบสมัครแล้ว รอประกาศรายชื่อผู้มีสิทธิ์สอบ",
    nextPrompt: "มีสิทธิ์สอบแล้วหรือยัง?",
    nextStatus: "exam",
    nextLabel: "เปลี่ยนเป็น 'รอสอบ'",
  },
  exam: {
    id: "exam",
    label: "รอสอบ",
    shortLabel: "รอสอบ",
    badgeClass: "status-badge-exam",
    icon: "⏳",
    color: "#d97706",
    bg: "#fef3c7",
    border: "#fde68a",
    desc: "มีสิทธิ์สอบแล้ว รอถึงวันสอบ / เตรียมตัวสอบ",
    nextPrompt: "สอบเสร็จแล้วหรือยัง?",
    nextStatus: "result",
    nextLabel: "เปลี่ยนเป็น 'รอผล'",
  },
  result: {
    id: "result",
    label: "รอประกาศผล",
    shortLabel: "รอผล",
    badgeClass: "status-badge-result",
    icon: "📢",
    color: "#7c3aed",
    bg: "#f3e8ff",
    border: "#ddd6fe",
    desc: "สอบเสร็จแล้ว รอประกาศผลสอบหรือขึ้นบัญชี",
    nextPrompt: "ผลการสอบเป็นอย่างไร?",
    nextStatus: "passed",
    nextLabel: "เปลี่ยนเป็น 'ผ่าน 🎉'",
  },
  passed: {
    id: "passed",
    label: "ผ่านการคัดเลือก 🎉",
    shortLabel: "ผ่าน 🎉",
    badgeClass: "status-badge-passed",
    icon: "🎉",
    color: "#16a34a",
    bg: "#dcfce7",
    border: "#86efac",
    desc: "ผ่านการคัดเลือก / ได้รับการบรรจุ / ขึ้นบัญชี",
    nextPrompt: null,
    nextStatus: null,
    nextLabel: null,
  },
  failed: {
    id: "failed",
    label: "ไม่ผ่านในรอบนี้",
    shortLabel: "ไม่ผ่าน",
    badgeClass: "status-badge-failed",
    icon: "❌",
    color: "#6b7280",
    bg: "#f3f4f6",
    border: "#e5e7eb",
    desc: "ไม่ผ่านการคัดเลือก หรือไม่ติดอันดับในรอบนี้",
    nextPrompt: null,
    nextStatus: null,
    nextLabel: null,
  },
};

export const STATUS_LIST = [
  STATUS_CONFIG.interested,
  STATUS_CONFIG.applied,
  STATUS_CONFIG.exam,
  STATUS_CONFIG.result,
  STATUS_CONFIG.passed,
  STATUS_CONFIG.failed,
];

