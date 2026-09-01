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
