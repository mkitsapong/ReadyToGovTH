import { useState } from "react";
import { ModalExamPrepSection } from "./ExamResources.jsx";

const CATEGORY_MAP = {
  ข้าราชการ:    { badge: "badge-civil",      icon: "🏛️" },
  พนักงานราชการ: { badge: "badge-government", icon: "📋" },
  รัฐวิสาหกิจ:  { badge: "badge-state",      icon: "🏢" },
  ลูกจ้างชั่วคราว: { badge: "badge-temp",       icon: "📝" },
};

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
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
  const [isCopied, setIsCopied] = useState(false);
  const [showPdf, setShowPdf] = useState(false);

  if (!job) return null;
  const categories = job.categories && job.categories.length > 0 ? job.categories : (job.category ? [job.category] : []);
  const mainMeta   = CATEGORY_MAP[categories[0]] || { badge: "badge-civil", icon: "📄" };
  const days       = daysLeft(job.deadline);
  const totalCount = job.positionList?.reduce((s, p) => s + (Number(p.count) || 0), 0) ?? 0;
  const provinces  = getProvinces(job);

  const today = new Date().toISOString().split("T")[0];
  const isNotOpenYet = job.startDate && job.startDate > today;

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
              width: 100, height: 100,
              borderRadius: "var(--radius-xl)",
              background: job.logoUrl ? "white" : "linear-gradient(135deg, #1e3a8a, #3b82f6)",
              border: "3px solid rgba(255,255,255,0.2)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", flexShrink: 0,
              zIndex: 10,
            }}>
              {job.logoUrl
                ? <img src={job.logoUrl} alt={job.department} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 2 }} />
                : <span style={{ fontSize: "2.2rem" }}>{mainMeta.icon}</span>}
            </div>

            {/* Text details */}
            <div style={{ flex: 1, zIndex: 10 }}>
              {/* Category badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                {categories.map((cat, idx) => {
                  const catMeta = CATEGORY_MAP[cat] || { badge: "badge-civil" };
                  return <span key={idx} className={`badge ${catMeta.badge}`}>{cat}</span>;
                })}
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
                {job.isOCSC && (
                  <span style={{
                    padding: "2px 8px", background: "rgba(59,130,212,0.25)",
                    border: "1px solid rgba(59,130,212,0.5)", borderRadius: "999px",
                    fontSize: "0.72rem", fontWeight: 700, color: "#bfdbfe",
                    whiteSpace: "nowrap"
                  }}>
                    📝 ต้องผ่าน ภาค ก
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
            display: "flex", alignItems: "flex-start", gap: 8, padding: "12px 14px",
            background: days <= 7 && days > 0 ? "var(--orange-50)" : days <= 0 ? "#fef2f2" : "var(--navy-50)",
            border: `1px solid ${days <= 7 && days > 0 ? "var(--orange-200)" : days <= 0 ? "#fecaca" : "var(--navy-100)"}`,
            borderRadius: "var(--radius-md)", marginBottom: 20, fontSize: "0.875rem",
            color: days <= 7 && days > 0 ? "var(--orange-700)" : days <= 0 ? "#dc2626" : "var(--navy-700)",
            lineHeight: 1.5
          }}>
            <span style={{ flexShrink: 0, fontSize: "1rem" }}>{days > 0 ? "📅" : "❌"}</span>
            <div style={{ flex: 1, wordBreak: "break-word" }}>
              {days > 0
                ? <>
                    {job.postedDate ? `เปิดรับ ${formatDate(job.postedDate)} - ` : "ปิดรับสมัคร "} 
                    <strong>{formatDate(job.deadline)}</strong>
                    <span style={{ 
                      color: (days <= 7 && days > 0) ? "var(--orange-700)" : "var(--gray-500)", 
                      fontWeight: (days <= 7 && days > 0) ? 700 : 500, 
                      display: "inline-block",
                      marginLeft: 4 
                    }}>
                      (เหลือ {days} วัน)
                    </span>
                  </>
                : <>หมดเขตรับสมัครแล้ว ({job.postedDate ? `${formatDate(job.postedDate)} - ` : ""}{formatDate(job.deadline)})</>}
            </div>
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
                  if (pos.units && pos.units.length > 0) {
                    return (
                      <div key={i} style={{
                        border: "1.5px solid var(--gray-200)",
                        borderRadius: "var(--radius-lg)",
                        overflow: "hidden",
                        boxShadow: "0 1px 4px rgba(18,39,84,0.06)",
                      }}>
                        {/* Group Header */}
                        <div style={{
                          display: "flex", alignItems: "flex-start", gap: 10,
                          padding: "12px 16px",
                          background: "linear-gradient(135deg, var(--navy-800), var(--navy-700))",
                        }}>
                          <span style={{
                            width: 24, height: 24, flexShrink: 0,
                            background: "rgba(255,255,255,0.18)",
                            borderRadius: "50%",
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.72rem", fontWeight: 800, color: "white",
                            marginTop: 2
                          }}>
                            {i + 1}
                          </span>
                          <div style={{ flex: 1, fontSize: "0.92rem", fontWeight: 700, color: "white", lineHeight: 1.4, wordBreak: "break-word" }}>
                            <span style={{ fontSize: "1rem", marginRight: 6 }}>📁</span>
                            {pos.title}
                          </div>
                          {/* Salary badge */}
                          {pos.salary && (
                            <span style={{
                              padding: "2px 10px",
                              background: "rgba(255,255,255,0.15)",
                              border: "1px solid rgba(255,255,255,0.25)",
                              borderRadius: "999px",
                              fontSize: "0.72rem", fontWeight: 700, color: "white",
                              whiteSpace: "nowrap", flexShrink: 0,
                              marginTop: 2
                            }}>
                              💰 {pos.salary}
                            </span>
                          )}
                        </div>

                        {/* Units Body */}
                        <div style={{ background: "var(--white)", padding: "8px 16px" }}>
                          {pos.units.map((unit, uIdx) => {
                            const unitEduStyle = EDU_COLORS[unit.education] || { bg: "var(--gray-100)", border: "var(--gray-300)", color: "var(--gray-700)" };
                            return (
                              <div key={uIdx} style={{
                                padding: "12px 0",
                                borderBottom: uIdx === pos.units.length - 1 ? "none" : "1px dashed var(--gray-300)"
                              }}>
                                <div style={{ fontWeight: 700, color: "var(--navy-800)", fontSize: "0.92rem", marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 6 }}>
                                  <span style={{ color: "#dc2626", marginTop: 2 }}>📍</span>
                                  <span>{unit.name} <span style={{ color: "var(--navy-600)", fontWeight: 600, fontSize: "0.85rem" }}>(จำนวน {unit.count} อัตรา)</span></span>
                                </div>
                                <div style={{ fontSize: "0.85rem", color: "var(--gray-700)", lineHeight: 1.6, marginLeft: 24 }}>
                                  <div style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                    <span style={{ fontWeight: 700, color: "var(--navy-700)" }}>🎓 วุฒิที่เปิดรับ:</span>
                                    <span style={{
                                      padding: "2px 10px",
                                      background: unitEduStyle.bg, border: `1px solid ${unitEduStyle.border}`,
                                      borderRadius: "999px",
                                      fontSize: "0.75rem", fontWeight: 700, color: unitEduStyle.color,
                                    }}>
                                      {unit.education}
                                    </span>
                                    {unit.major && (
                                      <span style={{ fontSize: "0.85rem", color: "var(--gray-700)" }}>
                                        {unit.major}
                                      </span>
                                    )}
                                  </div>
                                  {unit.details && (
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                                      <span style={{ fontWeight: 700, color: "var(--navy-700)", flexShrink: 0 }}>⚙️ ลักษณะงาน:</span> 
                                      <span style={{ marginTop: 1 }}>{unit.details}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={i} style={{
                      border: "1.5px solid var(--gray-200)",
                      borderRadius: "var(--radius-lg)",
                      overflow: "hidden",
                      boxShadow: "0 1px 4px rgba(18,39,84,0.06)",
                    }}>
                      {/* Position header bar */}
                      <div style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "12px 16px",
                        background: "linear-gradient(135deg, var(--navy-800), var(--navy-700))",
                      }}>
                        {/* Number badge */}
                        <span style={{
                          width: 24, height: 24, flexShrink: 0,
                          background: "rgba(255,255,255,0.18)",
                          borderRadius: "50%",
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.72rem", fontWeight: 800, color: "white",
                          marginTop: 2
                        }}>
                          {i + 1}
                        </span>
                        <div style={{ flex: 1, fontSize: "0.92rem", fontWeight: 700, color: "white", lineHeight: 1.4, wordBreak: "break-word" }}>
                          {pos.title}
                        </div>
                        {/* Count badge */}
                        {pos.count && (
                          <span style={{
                            padding: "2px 10px",
                            background: "rgba(255,255,255,0.15)",
                            border: "1px solid rgba(255,255,255,0.25)",
                            borderRadius: "999px",
                            fontSize: "0.72rem", fontWeight: 700, color: "white",
                            whiteSpace: "nowrap", flexShrink: 0,
                            marginTop: 2
                          }}>
                            {pos.count} อัตรา
                          </span>
                        )}
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
              <p style={{ fontSize: "0.855rem", color: "#0c4a6e", lineHeight: 1.85, margin: 0, whiteSpace: "pre-wrap" }}>
                {job.description}
              </p>
            </div>
          )}

          {/* แนะนำหนังสือ & คอร์สติวสอบ */}
          <ModalExamPrepSection
            books={books}
            showBooks={job.showBooks !== false}
            customBookTitle={job.customBookTitle}
            customBookUrl={job.customBookUrl}
          />

        </div>

        {/* ── Footer ── */}
        <div className="modal-footer" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={async () => {
              const url = `${window.location.origin}/job/${job.id}`;
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: `งานราชการ: ${job.department}`,
                    text: `ดูประกาศรับสมัครงานของ ${job.department} ได้ที่นี่`,
                    url: url,
                  });
                } catch (err) {
                  // user cancelled or error
                }
              } else {
                navigator.clipboard.writeText(url);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
              }
            }}
            className="btn btn-outline"
            style={{ padding: "10px 14px", flexShrink: 0 }}
            title="แชร์ประกาศนี้"
          >
            {isCopied ? "✅ คัดลอกลิงก์แล้ว" : "📤 แชร์"}
          </button>
          
          <div style={{ flex: 1, display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            {job.announcementUrl && (
              <button
                onClick={() => setShowPdf(true)}
                className="btn btn-outline"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                📄 อ่านประกาศฉบับเต็ม
              </button>
            )}
            {isNotOpenYet ? (
              <button className="btn" style={{ background: "var(--gray-400)", color: "white", cursor: "not-allowed", border: "none" }} disabled>
                ⏳ ยังไม่เปิดรับสมัคร
              </button>
            ) : (
              <a 
                href={job.applyUrl || "#"} 
                target={job.applyUrl?.startsWith("mailto:") ? undefined : "_blank"} 
                rel="noreferrer" 
                className="btn btn-primary" 
                style={{ textDecoration: "none" }}
              >
                {job.applyUrl?.startsWith("mailto:") ? "ส่งอีเมลสมัครงาน ✉️" : "สมัครงาน →"}
              </a>
            )}
          </div>
        </div>
      </div>
  );

  if (showPdf) {
    const pdfContent = (
      <div className={`modal animate-fade-up ${inline ? 'inline-mode' : ''}`} style={inline ? { maxWidth: '100%', margin: 0, boxShadow: 'none', height: '100vh', display: 'flex', flexDirection: 'column' } : { maxWidth: 1000, height: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: "16px", borderBottom: "1px solid var(--gray-200)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", borderRadius: inline ? 0 : "var(--radius-2xl) var(--radius-2xl) 0 0" }}>
          <button onClick={() => setShowPdf(false)} className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "0.85rem" }}>⬅ กลับ</button>
          <h2 style={{ fontSize: "1rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, textAlign: "center", color: "var(--navy-800)", fontWeight: 700 }}>ประกาศรับสมัคร</h2>
          {!inline ? (
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--gray-500)", padding: 4 }}>✕</button>
          ) : <div style={{ width: 62 }} />}
        </div>
        <iframe src={`${job.announcementUrl}${job.announcementUrl.includes('#') ? '&' : '#'}view=FitH`} style={{ flex: 1, width: "100%", border: "none", borderRadius: inline ? 0 : "0 0 var(--radius-2xl) var(--radius-2xl)" }} title="ประกาศรับสมัคร" />
      </div>
    );

    if (inline) return pdfContent;
    return (
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowPdf(false)}>
        {pdfContent}
      </div>
    );
  }

  if (inline) {
    return content;
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {content}
    </div>
  );
}
