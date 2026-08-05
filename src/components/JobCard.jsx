import { Link } from "react-router-dom";


const CATEGORY_MAP = {
  ข้าราชการ: { badge: "badge-civil", icon: "🏛️" },
  พนักงานราชการ: { badge: "badge-government", icon: "📋" },
  รัฐวิสาหกิจ:  { badge: "badge-state",      icon: "🏢" },
  ลูกจ้างชั่วคราว: { badge: "badge-temp",       icon: "📝" },
};

// Helper: normalize province field
function getProvinces(job) {
  if (Array.isArray(job.provinces)) return job.provinces;
  if (job.province) return [job.province];
  return [];
}

const EDU_ORDER = ["ม.3", "ม.6", "ปวช.", "ปวส.", "ปริญญาตรี", "ปริญญาโท", "ปริญญาเอก"];

function getEduMatchStatus(positionList, userEdu) {
  if (!userEdu || !positionList?.length) return null;
  const matchCount = positionList.filter((p) => {
    if (p.education === "ไม่จำกัดวุฒิ") return true;
    return p.education === userEdu;           // exact match เท่านั้น
  }).length;
  if (matchCount === positionList.length) return "all";
  if (matchCount > 0) return "some";
  return "none";
}

function daysLeft(deadline) {
  return Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
}
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export default function JobCard({ job, books = [], style, isAdmin, onEdit, userEducation }) {


  const categories = job.categories && job.categories.length > 0 ? job.categories : (job.category ? [job.category] : []);
  const mainMeta = CATEGORY_MAP[categories[0]] || { badge: "badge-civil", icon: "📄" };
  const days = daysLeft(job.deadline);
  const urgent = days <= 7 && days > 0;
  const expired = days <= 0;
  const eduStatus = getEduMatchStatus(job.positionList, userEducation);
  const totalCount = job.positionList?.reduce((s, p) => s + (Number(p.count) || 0), 0) ?? 0;

  const dateText = job.startDate 
    ? `เปิดรับ ${formatDate(job.startDate)} - ${formatDate(job.deadline)}`
    : `ปิดรับ ${formatDate(job.deadline)}`;
  const dateTextExpired = job.startDate 
    ? `${formatDate(job.startDate)} - ${formatDate(job.deadline)}`
    : `ปิดรับ ${formatDate(job.deadline)}`;

  return (
    <>
      <div className="job-card" style={style}>
        {/* ── Card Header ── */}
        <div className="job-card-header" style={{ padding: 0 }}>

          {/* Top banner: logo + dept info */}
          <div style={{
            display: "flex", alignItems: "stretch", gap: 0,
            background: "linear-gradient(135deg, var(--navy-800) 0%, var(--navy-700) 100%)",
            padding: "18px 20px 14px",
            position: "relative", overflow: "hidden",
            minHeight: 148, // Changed from fixed height to minHeight to prevent overlap
          }}>
            {/* BG glow accent */}
            <div style={{
              position: "absolute", top: -30, right: -30,
              width: 120, height: 120,
              background: "radial-gradient(circle, rgba(234,88,12,0.2) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            {/* Logo — prominent */}
            <div style={{
              width: 96, height: 96, flexShrink: 0,
              borderRadius: "var(--radius-xl)",
              background: job.logoUrl
                ? "white"
                : "linear-gradient(135deg, #1e40af, #3b82f6)",
              border: job.logoUrl
                ? "3px solid rgba(255,255,255,0.9)"
                : "3px solid rgba(255,255,255,0.25)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
              marginRight: 16,
            }}>
              {job.logoUrl
                ? <img src={job.logoUrl} alt={job.department} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 2 }} />
                : <span style={{ fontSize: "1.8rem" }}>{mainMeta.icon}</span>}
            </div>

            {/* Right: dept name + badges */}
            <div style={{ 
              flex: 1, minWidth: 0, paddingTop: 2,
              display: "flex", flexDirection: "column", justifyContent: "space-between" 
            }}>
              <div style={{
                fontSize: "0.98rem", fontWeight: 700,
                color: "white", lineHeight: 1.35,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                paddingRight: isAdmin ? 65 : 0, // prevent overlap with absolute Edit button
                flexShrink: 0,
              }}>
                {job.department}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: "auto", flexShrink: 0 }}>
                {categories.map((cat, idx) => {
                  const catMeta = CATEGORY_MAP[cat] || { badge: "badge-civil" };
                  return <span key={idx} className={`badge ${catMeta.badge}`}>{cat}</span>;
                })}
                {job.isNoOCSC && (
                  <span style={{
                    padding: "2px 8px", background: "rgba(234,88,12,0.15)",
                    border: "1px solid rgba(234,88,12,0.3)", borderRadius: "999px",
                    fontSize: "0.68rem", fontWeight: 700, color: "#fed7aa",
                    whiteSpace: "nowrap"
                  }}>
                    ✨ ไม่ต้องผ่าน ภาค ก
                  </span>
                )}
                {job.isOCSC && (
                  <span style={{
                    padding: "2px 8px", background: "rgba(59,130,212,0.2)",
                    border: "1px solid rgba(59,130,212,0.4)", borderRadius: "999px",
                    fontSize: "0.68rem", fontWeight: 700, color: "#bfdbfe",
                    whiteSpace: "nowrap"
                  }}>
                    📝 ต้องผ่าน ภาค ก
                  </span>
                )}
                {getProvinces(job).length === 1 ? (
                  <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 3 }}>
                    📍 {getProvinces(job)[0]}
                  </span>
                ) : getProvinces(job).length > 1 ? (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "2px 8px",
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "999px",
                    fontSize: "0.68rem", fontWeight: 700,
                    color: "rgba(255,255,255,0.85)",
                    whiteSpace: "nowrap",
                  }}>
                    📍 {getProvinces(job)[0]}
                    <span style={{
                      background: "rgba(255,255,255,0.25)", color: "white",
                      borderRadius: "999px", padding: "0px 5px",
                      fontSize: "0.6rem", fontWeight: 700,
                    }}>+{getProvinces(job).length - 1}</span>
                  </span>
                ) : null}
              </div>
            </div>

            {/* Edit button */}
            {isAdmin && (
              <button id={`btn-edit-${job.id}`} onClick={() => onEdit(job)} title="แก้ไขประกาศ"
                style={{
                  position: "absolute", top: 18, right: 20,
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "4px 10px",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "var(--radius-sm)",
                  color: "rgba(255,255,255,0.85)",
                  fontSize: "0.72rem", fontWeight: 600,
                  cursor: "pointer", fontFamily: "var(--font-sans)",
                  transition: "all 0.15s", whiteSpace: "nowrap", zIndex: 10,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}>
                ✏️ แก้ไข
              </button>
            )}
          </div>

          {/* Deadline strip */}
          <div className="job-deadline" style={{
            margin: "0", borderRadius: 0,
            background: urgent ? "#fff7ed" : expired ? "#fef2f2" : "var(--gray-50)",
            border: "none",
            borderBottom: `1px solid ${urgent ? "#fed7aa" : expired ? "#fecaca" : "var(--gray-100)"}`,
            padding: "7px 20px",
          }}>
            <span className="icon">{urgent ? "🔥" : expired ? "⚠️" : "📅"}</span>
            <span>
              {expired 
                ? <span style={{ color: "#9ca3af" }}>{dateTextExpired} (หมดเขตแล้ว)</span>
                : days === 0 
                  ? <span>{job.postedDate ? `เปิดรับ ${formatDate(job.postedDate)} - วันนี้!` : `ปิดรับวันนี้!`} <span style={{ color: "#dc2626", fontWeight: 700, marginLeft: 4 }}>(รีบเลย!)</span></span>
                  : <span>
                      {dateText} 
                      <span style={{ 
                        color: urgent ? "var(--orange-600)" : "var(--gray-500)", 
                        fontWeight: urgent ? 700 : 500, 
                        marginLeft: 6 
                      }}>
                        (เหลือ {days} วัน)
                      </span>
                    </span>
              }
            </span>
          </div>
        </div>

        {/* ── Position List ── */}
        <div style={{ padding: "12px 20px 0", flex: 1 }}>
          {/* Section header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              ตำแหน่งที่เปิดรับ
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Education match badge */}
              {eduStatus === "all" && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", background: "#dcfce7", border: "1px solid #86efac", borderRadius: "999px", fontSize: "0.68rem", fontWeight: 700, color: "#15803d" }}>
                  ✓ วุฒิตรงทุกตำแหน่ง
                </span>
              )}
              {eduStatus === "some" && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", background: "#fef9c3", border: "1px solid #fde047", borderRadius: "999px", fontSize: "0.68rem", fontWeight: 700, color: "#854d0e" }}>
                  ◑ วุฒิตรงบางตำแหน่ง
                </span>
              )}
              {eduStatus === "none" && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "999px", fontSize: "0.68rem", fontWeight: 700, color: "#b91c1c" }}>
                  ✗ วุฒิไม่ตรง
                </span>
              )}
              <span style={{ fontSize: "0.72rem", color: "var(--gray-400)", fontWeight: 600 }}>
                รวม {totalCount} อัตรา
              </span>
            </div>
          </div>

          {/* Rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 1, borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--gray-200)" }}>
            {job.positionList?.slice(0, 3).map((pos, i) => {
              // per-position edu match
              let rowMatch = null;
              if (userEducation) {
                if (pos.education === "ไม่จำกัดวุฒิ") rowMatch = true;
                else {
                  const req = EDU_ORDER.indexOf(pos.education);
                  const have = EDU_ORDER.indexOf(userEducation);
                  rowMatch = req !== -1 && have !== -1 && have >= req;
                }
              }

              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center",
                  padding: "8px 12px",
                  background: i % 2 === 0 ? "var(--white)" : "var(--gray-50)",
                  gap: 8,
                  minHeight: 38,
                }}>
                  {/* Match dot */}
                  {rowMatch !== null && (
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: rowMatch ? "#22c55e" : "#ef4444", flexShrink: 0 }} title={rowMatch ? "วุฒิตรง" : "วุฒิไม่ตรง"} />
                  )}
                  {/* Title */}
                  <span style={{ flex: 1, fontSize: "0.82rem", fontWeight: 600, color: "var(--navy-800)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {pos.title}
                  </span>
                  {/* Salary */}
                  <span style={{ fontSize: "0.75rem", color: "var(--navy-600)", fontWeight: 600, whiteSpace: "nowrap" }}>
                    {pos.salary}
                  </span>
                  {/* Count */}
                  <span style={{ fontSize: "0.72rem", color: "var(--gray-500)", whiteSpace: "nowrap", minWidth: 36, textAlign: "right" }}>
                    {pos.count} อัตรา
                  </span>
                </div>
              );
            })}
            
            {/* If more than 3 positions */}
            {job.positionList?.length > 3 && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "8px 12px", background: "var(--gray-50)",
                fontSize: "0.75rem", fontWeight: 600, color: "var(--navy-500)",
                borderTop: "1px dashed var(--gray-200)"
              }}>
                และอีก {job.positionList.length - 3} ตำแหน่ง... (กดดูรายละเอียด)
              </div>
            )}
          </div>
        </div>

        {/* ── Card Footer ── */}
        <div className="job-card-footer" style={{ marginTop: 12 }}>
          <div className="job-positions">
            🎓 {[...new Set(job.positionList?.map((p) => p.education))].join(", ")}
          </div>
          <Link id={`btn-detail-${job.id}`} className="btn-apply" to={`/job/${job.id}`} style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none' }}>
            รายละเอียด ▸
          </Link>
        </div>
      </div>


    </>
  );
}
