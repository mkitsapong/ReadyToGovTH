import { ModalExamPrepSection } from "./ExamResources.jsx";

const CATEGORY_MAP = {
  ข้าราชการ:    { badge: "badge-civil",      icon: "🏛️" },
  พนักงานราชการ: { badge: "badge-government", icon: "📋" },
  รัฐวิสาหกิจ:  { badge: "badge-state",      icon: "🏢" },
};

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
}
function daysLeft(deadline) {
  return Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
}
function getProvinces(job) {
  if (Array.isArray(job.provinces)) return job.provinces;
  if (job.province) return [job.province];
  return [];
}

// Education badge color map
const EDU_COLORS = {
  "ม.3":        { bg: "#f3f4f6", border: "#d1d5db", color: "#374151" },
  "ม.6":        { bg: "#e0f2fe", border: "#bae6fd", color: "#0369a1" },
  "ปวช.":       { bg: "#fef9c3", border: "#fde047", color: "#713f12" },
  "ปวส.":       { bg: "#ffedd5", border: "#fdba74", color: "#7c2d12" },
  "ปริญญาตรี":  { bg: "#dbeafe", border: "#93c5fd", color: "#1e3a8a" },
  "ปริญญาโท":   { bg: "#ede9fe", border: "#a78bfa", color: "#4c1d95" },
  "ปริญญาเอก":  { bg: "#fce7f3", border: "#f9a8d4", color: "#831843" },
  "ไม่จำกัดวุฒิ": { bg: "#dcfce7", border: "#86efac", color: "#14532d" },
};

export default function JobDetailModal({ job, books = [], onClose, inline = false }) {
  if (!job) return null;
  const meta       = CATEGORY_MAP[job.category] || { badge: "badge-civil", icon: "📄" };
  const days       = daysLeft(job.deadline);
  const totalCount = job.positionList?.reduce((s, p) => s + (Number(p.count) || 0), 0) ?? 0;
  const provinces  = getProvinces(job);

  const content = (
    <div className={`modal animate-fade-up ${inline ? 'inline-mode' : ''}`} style={inline ? { maxWidth: '100%', margin: 0, boxShadow: 'none', maxHeight: 'none', overflow: 'visible' } : { maxWidth: 660 }} role={inline ? "region" : "dialog"} aria-modal={!inline}>

      {/* ── Header ── */}
        <div style={{ position: "relative" }}>
          {/* Dark gradient banner */}
          <div style={{
            background: "linear-gradient(135deg, var(--navy-900) 0%, var(--navy-700) 100%)",
            padding: "24px 28px",
            position: "relative", overflow: "hidden",
            borderTopLeftRadius: "var(--radius-2xl)",
            borderTopRightRadius: "var(--radius-2xl)",
            display: "flex", alignItems: "center", gap: 20
          }}>
            {/* Glow accents */}
            <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: "radial-gradient(circle, rgba(234,88,12,0.18) 0%, transparent 65%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -20, left: -20, width: 150, height: 150, background: "radial-gradient(circle, rgba(37,99,176,0.2) 0%, transparent 65%)", pointerEvents: "none" }} />

            {/* Close button */}
            {!inline && (
              <button className="modal-close" onClick={onClose} aria-label="ปิด"
                style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}>
                ✕
              </button>
            )}

            {/* Logo */}
            <div style={{
              width: 80, height: 80,
              borderRadius: "var(--radius-xl)",
              background: job.logoUrl ? "white" : "linear-gradient(135deg, #1e3a8a, #3b82f6)",
              border: "3px solid rgba(255,255,255,0.2)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", flexShrink: 0,
              zIndex: 10,
            }}>
              {job.logoUrl
                ? <img src={job.logoUrl} alt={job.department} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }} />
                : <span style={{ fontSize: "2.2rem" }}>{meta.icon}</span>}
            </div>

            {/* Text details */}
            <div style={{ flex: 1, zIndex: 10 }}>
              {/* Category badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span className={`badge ${meta.badge}`}>{job.category}</span>
                {job.isNoOCSC && (
                  <span style={{
                    padding: "2px 8px", background: "rgba(234,88,12,0.2)",
                    border: "1px solid rgba(234,88,12,0.4)", borderRadius: "999px",
                    fontSize: "0.72rem", fontWeight: 700, color: "#fed7aa",
                    whiteSpace: "nowrap"
                  }}>
                    ✨ ไม่ต้องผ่าน ภาค ก
                  </span>
                )}
              </div>

              {/* Dept name */}
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "white", lineHeight: 1.3, margin: 0 }}>
                {job.department}
              </h2>
            </div>
          </div>
        </div>

        {/* Province tags */}
        <div style={{
          padding: "16px 28px",
          borderBottom: "1px solid var(--gray-100)",
          background: "var(--white)",
        }}>
          {provinces.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.68rem", color: "var(--navy-500)", flexShrink: 0 }}>📍</span>
              {provinces.map((prov) => (
                <span key={prov} style={{
                  padding: "2px 10px",
                  background: "linear-gradient(135deg, var(--navy-50), #eff6ff)",
                  border: "1px solid var(--navy-100)",
                  borderRadius: "999px",
                  fontSize: "0.72rem", fontWeight: 600,
                  color: "var(--navy-700)", whiteSpace: "nowrap",
                }}>
                  {prov}
                </span>
              ))}
              {provinces.length > 1 && (
                <span style={{ fontSize: "0.68rem", color: "var(--gray-400)", fontWeight: 600 }}>
                  รวม {provinces.length} จังหวัด
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="modal-body">

          {/* Deadline banner */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
            background: days <= 7 && days > 0 ? "var(--orange-50)" : days <= 0 ? "#fef2f2" : "var(--navy-50)",
            border: `1px solid ${days <= 7 && days > 0 ? "var(--orange-200)" : days <= 0 ? "#fecaca" : "var(--navy-100)"}`,
            borderRadius: "var(--radius-md)", marginBottom: 20, fontSize: "0.875rem",
            color: days <= 7 && days > 0 ? "var(--orange-700)" : days <= 0 ? "#dc2626" : "var(--navy-700)",
          }}>
            {days > 0
              ? <>📅 ปิดรับสมัคร <strong>{formatDate(job.deadline)}</strong>
                  {days <= 30 && <span style={{ marginLeft: 8, fontWeight: 700 }}>· เหลือ {days} วัน</span>}
                </>
              : <>❌ หมดเขตรับสมัครแล้ว</>}
          </div>

          {/* ── Position section header ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 12,
          }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--navy-800)", margin: 0 }}>
              📋 ตำแหน่งที่เปิดรับสมัคร
            </h3>
            <span style={{
              padding: "3px 12px",
              background: "var(--navy-700)", color: "white",
              borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700,
            }}>
              รวม {totalCount} อัตรา
            </span>
          </div>

          {/* ── Position cards (document style) ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            {job.positionList?.map((pos, i) => {
              const eduStyle = EDU_COLORS[pos.education] || { bg: "var(--gray-100)", border: "var(--gray-300)", color: "var(--gray-700)" };
              return (
                <div key={i} style={{
                  border: "1.5px solid var(--gray-200)",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  boxShadow: "0 1px 4px rgba(18,39,84,0.06)",
                }}>
                  {/* Position header bar */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 16px",
                    background: "linear-gradient(135deg, var(--navy-800), var(--navy-700))",
                  }}>
                    {/* Number badge */}
                    <span style={{
                      width: 24, height: 24, flexShrink: 0,
                      background: "rgba(255,255,255,0.18)",
                      borderRadius: "50%",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.72rem", fontWeight: 800, color: "white",
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: "0.92rem", fontWeight: 700, color: "white" }}>
                      {pos.title}
                    </span>
                    {/* Count badge */}
                    <span style={{
                      padding: "2px 10px",
                      background: "rgba(255,255,255,0.15)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      borderRadius: "999px",
                      fontSize: "0.72rem", fontWeight: 700, color: "white",
                      whiteSpace: "nowrap", flexShrink: 0,
                    }}>
                      {pos.count} อัตรา
                    </span>
                  </div>

                  {/* Position details body */}
                  <div style={{ padding: "12px 16px", background: "var(--white)" }}>
                    {/* Salary + Education row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: pos.details ? 12 : 0 }}>
                      {/* Salary */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: "0.72rem", color: "var(--gray-400)", fontWeight: 600 }}>💰 เงินเดือน</span>
                        <span style={{
                          padding: "3px 12px",
                          background: "#f0fdf4", border: "1px solid #86efac",
                          borderRadius: "999px",
                          fontSize: "0.8rem", fontWeight: 700, color: "#15803d",
                        }}>
                          {pos.salary}
                        </span>
                      </div>
                      {/* Education */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: "0.72rem", color: "var(--gray-400)", fontWeight: 600 }}>🎓 วุฒิ</span>
                        <span style={{
                          padding: "3px 12px",
                          background: eduStyle.bg, border: `1px solid ${eduStyle.border}`,
                          borderRadius: "999px",
                          fontSize: "0.78rem", fontWeight: 700, color: eduStyle.color,
                        }}>
                          {pos.education}
                        </span>
                      </div>
                    </div>

                    {/* Qualifications (details) */}
                    {pos.details && (
                      <div style={{
                        padding: "10px 14px",
                        background: "var(--navy-50)",
                        border: "1px solid var(--navy-100)",
                        borderRadius: "var(--radius-md)",
                        fontSize: "0.82rem",
                        color: "var(--gray-700)",
                        lineHeight: 1.85,
                        whiteSpace: "pre-wrap",
                      }}>
                        <div style={{
                          fontSize: "0.7rem", fontWeight: 700,
                          color: "var(--navy-600)", textTransform: "uppercase",
                          letterSpacing: "0.05em", marginBottom: 6,
                        }}>
                          คุณสมบัติเฉพาะตำแหน่ง
                        </div>
                        {pos.details}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* แนะนำหนังสือ & คอร์สติวสอบ */}
          <ModalExamPrepSection
            books={books}
            showBooks={job.showBooks !== false}
            customBookTitle={job.customBookTitle}
            customBookUrl={job.customBookUrl}
          />

          {/* Description / Application info */}
          {job.description && (
            <div style={{
              marginBottom: 20,
              padding: "14px 16px",
              background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
              border: "1px solid #bae6fd",
              borderRadius: "var(--radius-lg)",
            }}>
              <h3 style={{
                fontSize: "0.82rem", fontWeight: 700,
                color: "#0369a1", marginBottom: 8,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                📝 การรับสมัคร
              </h3>
              <p style={{ fontSize: "0.855rem", color: "#0c4a6e", lineHeight: 1.85, margin: 0 }}>
                {job.description}
              </p>
            </div>
          )}

          <p style={{ fontSize: "0.75rem", color: "var(--gray-400)", borderTop: "1px solid var(--gray-100)", paddingTop: 12 }}>
            ลงประกาศเมื่อ {formatDate(job.postedDate)}
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="modal-footer">
          {job.announcementUrl && (
            <a
              href={job.announcementUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              📄 ประกาศรับสมัคร
            </a>
          )}
          <a href={job.applyUrl || "#"} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ textDecoration: "none" }}>
            สมัครงาน →
          </a>
        </div>
      </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {content}
    </div>
  );
}
