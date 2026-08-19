import { useState, useRef } from "react";
import { useBookmarks } from "../hooks/useBookmarks.js";
import { ModalExamPrepSection } from "./ExamResources.jsx";
import SocialShareCover from "./SocialShareCover.jsx";
import html2canvas from "html2canvas";

const CATEGORY_MAP = {
  ข้าราชการ:    { badge: "badge-civil",      icon: "🏛️" },
  พนักงานราชการ: { badge: "badge-government", icon: "📋" },
  รัฐวิสาหกิจ:  { badge: "badge-state",      icon: "🏢" },
  ลูกจ้างชั่วคราว: { badge: "badge-temp",       icon: "📝" },
  พนักงานหน่วยงานของรัฐ: { badge: "badge-agency", icon: "🏫" },
};

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}
function daysLeft(deadline) {
  const d1 = new Date();
  d1.setHours(0, 0, 0, 0);
  const d2 = new Date(deadline);
  d2.setHours(0, 0, 0, 0);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}
function getProvinces(job) {
  let list = [];
  if (Array.isArray(job.provinces)) list = job.provinces;
  else if (job.province) list = [job.province];
  return list.filter(p => p !== "ไม่ระบุ");
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

export default function JobDetailModal({ job, books = [], onClose, inline = false, isAdmin = false, onEdit }) {
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [selectedPdfIndex, setSelectedPdfIndex] = useState(0);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(job?.id);
  const bannerRef = useRef(null);

  const handleDownloadBanner = async () => {
    if (!bannerRef.current) return;
    try {
      setIsGeneratingBanner(true);
      const canvas = await html2canvas(bannerRef.current, {
        scale: 2, // High resolution
        useCORS: true, // Allow cross-origin images
        backgroundColor: null,
      });
      
      const image = canvas.toDataURL("image/png");
      const fileName = `readytogov-${job.department.replace(/\s+/g, "-")}-banner.png`;

      // Check if it's a mobile device. If it is, use Web Share API, otherwise skip to download.
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      if (isMobile) {
        try {
          const response = await fetch(image);
          const blob = await response.blob();
          const file = new File([blob], fileName, { type: "image/png" });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: job.department,
            });
            return;
          }
        } catch (err) {
          if (err.name === 'AbortError') return; // User cancelled the share sheet
          console.warn("Share failed, falling back to download:", err);
        }
      }

      // Fallback for Desktop / browsers that don't support file sharing
      const link = document.createElement("a");
      link.href = image;
      link.download = fileName;
      link.click();
    } catch (err) {
      console.error("Error generating banner:", err);
      alert("เกิดข้อผิดพลาดในการสร้างรูปแบนเนอร์");
    } finally {
      setIsGeneratingBanner(false);
    }
  };

  const pdfUrls = job.announcementUrl 
    ? job.announcementUrl.split(/[\s,]+/).filter(url => url.trim().length > 0)
    : [];

  if (!job) return null;
  const categories = job.categories && job.categories.length > 0 ? job.categories : (job.category ? [job.category] : []);
  const mainMeta   = CATEGORY_MAP[categories[0]] || { badge: "badge-civil", icon: "📄" };
  const days       = daysLeft(job.deadline);
  const totalCount = job.positionList?.reduce((s, p) => s + (Number(p.count) || 0), 0) ?? 0;
  const provinces  = getProvinces(job);

  const today = new Date().toISOString().split("T")[0];
  const displayStartDate = job.startDate || job.postedDate;
  const isNotOpenYet = displayStartDate && displayStartDate > today;

  const content = (
    <div className={`modal animate-fade-up ${inline ? 'inline-mode' : ''}`} style={inline ? { maxWidth: '100%', margin: 0, boxShadow: 'none', maxHeight: 'none', overflow: 'visible' } : { maxWidth: 660 }} role={inline ? "region" : "dialog"} aria-modal={!inline}>

      {/* ── Header ── */}
        <div style={{ position: "relative" }}>
          {/* Dark gradient banner */}
          <div style={{
            background: "linear-gradient(135deg, var(--navy-900) 0%, var(--navy-700) 100%)",
            padding: "clamp(16px, 5vw, 24px) clamp(16px, 5vw, 28px)",
            position: "relative", overflow: "hidden",
            borderTopLeftRadius: "var(--radius-2xl)",
            borderTopRightRadius: "var(--radius-2xl)",
            display: "flex", flexDirection: "column", alignItems: "stretch", gap: 16,
          }}>
            {/* Glow accents */}
            <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 65%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -20, left: -20, width: 150, height: 150, background: "radial-gradient(circle, rgba(37,99,176,0.2) 0%, transparent 65%)", pointerEvents: "none" }} />

            {/* Top Right Actions */}
            <div style={{ position: "absolute", top: "clamp(16px, 5vw, 24px)", right: "clamp(16px, 5vw, 28px)", display: "flex", gap: 8, zIndex: 50, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {/* Edit Button */}
              {isAdmin && onEdit && (
                <button onClick={() => onEdit(job)} title="แก้ไขประกาศ"
                  style={{
                    background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", 
                    border: "1px solid rgba(255,255,255,0.2)", borderRadius: "var(--radius-sm)",
                    padding: "4px 10px", fontSize: "0.8rem", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s",
                    whiteSpace: "nowrap"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}>
                  ✏️ แก้ไข
                </button>
              )}

              {/* Generate Banner Button */}
              {isAdmin && (
                <button onClick={handleDownloadBanner} disabled={isGeneratingBanner} title="บันทึกรูปแบนเนอร์สำหรับแชร์"
                  style={{
                    background: "linear-gradient(135deg, #ea580c, #c2410c)", color: "white", 
                    border: "none", borderRadius: "var(--radius-sm)",
                    padding: "4px 10px", fontSize: "0.8rem", cursor: isGeneratingBanner ? "wait" : "pointer",
                    display: "flex", alignItems: "center", gap: 4, transition: "all 0.2s",
                    boxShadow: "0 2px 4px rgba(234,88,12,0.3)"
                  }}
                  onMouseEnter={e => { if (!isGeneratingBanner) e.currentTarget.style.transform = "scale(1.05)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
                  {isGeneratingBanner ? "⏳ กำลังสร้าง..." : "📷 เซฟรูปแบนเนอร์"}
                </button>
              )}

              {/* Share Button */}
              <button onClick={async () => {
                const url = `${window.location.origin}/?jobId=${job.id}`;
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
              title="แชร์ลิงก์งานนี้"
              style={{
                background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)", 
                border: "1px solid rgba(255,255,255,0.15)", borderRadius: "var(--radius-sm)",
                padding: "4px 10px", fontSize: "0.8rem", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4, transition: "all 0.2s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}>
                {isCopied ? "✅ คัดลอกแล้ว" : "🔗 แชร์"}
              </button>
              
              {/* Bookmark Button */}
              <button onClick={() => toggleBookmark(job.id)} title={bookmarked ? "ยกเลิกบันทึก" : "บันทึกงานนี้"}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 28, height: 28,
                  background: bookmarked ? "rgba(255, 255, 255, 0.2)" : "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "50%",
                  color: bookmarked ? "#f87171" : "rgba(255,255,255,0.8)",
                  fontSize: "1rem", cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
                {bookmarked ? "❤️" : "🤍"}
              </button>

              {/* Close button */}
              {!inline && (
                <button className="modal-close" onClick={onClose} aria-label="ปิด"
                  style={{ 
                    background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", 
                    border: "1px solid rgba(255,255,255,0.15)",
                    width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: "50%", cursor: "pointer"
                  }}>
                  ✕
                </button>
              )}
            </div>

            {/* Main Header Content */}
            <div style={{ display: "flex", alignItems: "center", gap: "clamp(12px, 4vw, 20px)", zIndex: 10 }}>
              {/* Logo */}
              <div style={{
                width: "clamp(64px, 18vw, 90px)", height: "clamp(64px, 18vw, 90px)",
                borderRadius: "var(--radius-xl)",
                background: job.logoUrl ? "white" : "linear-gradient(135deg, #1e3a8a, #3b82f6)",
                border: "3px solid rgba(255,255,255,0.2)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", flexShrink: 0,
              }}>
                {job.logoUrl
                  ? <img src={job.logoUrl} alt={job.department} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 2 }} />
                  : <span style={{ fontSize: "clamp(1.5rem, 5vw, 2.2rem)" }}>{mainMeta.icon}</span>}
              </div>

              {/* Text details */}
              <div style={{ flex: 1, minWidth: 0, paddingRight: isAdmin ? 160 : 90 }}>
              {/* Category badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
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
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "white", lineHeight: 1.3, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {job.department}
              </h2>
            </div>
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
            background: days <= 7 && days >= 0 ? "var(--orange-50)" : days < 0 ? "#fef2f2" : "var(--navy-50)",
            border: `1px solid ${days <= 7 && days >= 0 ? "var(--orange-200)" : days < 0 ? "#fecaca" : "var(--navy-100)"}`,
            borderRadius: "var(--radius-md)", marginBottom: 20, fontSize: "0.875rem",
            color: days <= 7 && days >= 0 ? "var(--orange-700)" : days < 0 ? "#dc2626" : "var(--navy-700)",
            lineHeight: 1.5
          }}>
            <span style={{ flexShrink: 0, fontSize: "1rem" }}>{days >= 0 ? "📅" : "❌"}</span>
            <div style={{ flex: 1, wordBreak: "break-word" }}>
              {days >= 0
                ? <>
                    {displayStartDate ? `เปิดรับ ${formatDate(displayStartDate)} - ` : "ปิดรับสมัคร "} 
                    <strong>{formatDate(job.deadline)}</strong>
                    <span style={{ 
                      color: (days <= 7 && days >= 0) ? "var(--orange-700)" : "var(--gray-500)", 
                      fontWeight: (days <= 7 && days >= 0) ? 700 : 500, 
                      display: "inline-block",
                      marginLeft: 4 
                    }}>
                      {days === 0 ? "(ปิดรับวันนี้!)" : `(เหลือ ${days} วัน)`}
                    </span>
                  </>
                : <>หมดเขตรับสมัครแล้ว ({displayStartDate ? `${formatDate(displayStartDate)} - ` : ""}{formatDate(job.deadline)})</>}
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
              const posEdus = Array.isArray(pos.education) ? pos.education : (pos.education ? [pos.education] : []);
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
                            const unitEdus = Array.isArray(unit.education) ? unit.education : (unit.education ? [unit.education] : []);
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
                                    {unitEdus.map((edu, eIdx) => {
                                      const eduStyle = EDU_COLORS[edu] || { bg: "var(--gray-100)", border: "var(--gray-300)", color: "var(--gray-700)" };
                                      return (
                                        <span key={eIdx} style={{
                                          padding: "2px 10px",
                                          background: eduStyle.bg, border: `1px solid ${eduStyle.border}`,
                                          borderRadius: "999px",
                                          fontSize: "0.75rem", fontWeight: 700, color: eduStyle.color,
                                        }}>
                                          {edu}
                                        </span>
                                      );
                                    })}
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
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.72rem", color: "var(--gray-400)", fontWeight: 600 }}>🎓 วุฒิ</span>
                            {posEdus.map((edu, eIdx) => {
                              const style = EDU_COLORS[edu] || { bg: "var(--gray-100)", border: "var(--gray-300)", color: "var(--gray-700)" };
                              return (
                                <span key={eIdx} style={{
                                  padding: "3px 12px",
                                  background: style.bg, border: `1px solid ${style.border}`,
                                  borderRadius: "999px",
                                  fontSize: "0.78rem", fontWeight: 700, color: style.color,
                                }}>
                                  {edu}
                                </span>
                              );
                            })}
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
        <div className="modal-footer">
          <div className="modal-footer-actions">
            {pdfUrls.length > 0 && (
              <button
                onClick={() => {
                  setSelectedPdfIndex(0);
                  setShowPdf(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="btn btn-outline modal-btn-action"
              >
                📄 อ่านประกาศ<span className="hide-on-mobile">ฉบับเต็ม</span>
                {pdfUrls.length > 1 && ` (${pdfUrls.length})`}
              </button>
            )}
            {isNotOpenYet ? (
              job.applyUrl ? (
                <a 
                  href={job.applyUrl} 
                  target={job.applyUrl.startsWith("mailto:") ? undefined : "_blank"} 
                  rel="noopener noreferrer" 
                  className="btn modal-btn-action" 
                  style={{ background: "var(--gray-400)", color: "white", border: "none" }}
                >
                  ⏳ ยังไม่เปิด<span className="hide-on-mobile">รับสมัคร</span>
                </a>
              ) : (
                <button className="btn modal-btn-action" style={{ background: "var(--gray-400)", color: "white", border: "none" }}>
                  ⏳ ยังไม่เปิด<span className="hide-on-mobile">รับสมัคร</span>
                </button>
              )
            ) : job.applyUrl ? (
              <a 
                href={job.applyUrl} 
                target={job.applyUrl.startsWith("mailto:") ? undefined : "_blank"} 
                rel="noopener noreferrer" 
                className="btn btn-primary modal-btn-action" 
              >
                {job.applyUrl.startsWith("mailto:") ? "ส่งอีเมล ✉️" : "สมัครออนไลน์ →"}
              </a>
            ) : (
              <button 
                className="btn modal-btn-action" 
                style={{ background: "var(--navy-50)", color: "var(--navy-700)", border: "1px solid var(--navy-200)", cursor: "default", opacity: 0.9 }}
              >
                📍 สมัครด้วยตนเอง
              </button>
            )}
          </div>
        </div>
      </div>
  );

  if (showPdf) {
    const currentPdfUrl = pdfUrls[selectedPdfIndex] || "";
    const embedUrl = currentPdfUrl.includes("drive.google.com/file/d/") 
      ? currentPdfUrl.replace(/\/view.*$/, "/preview") 
      : `${currentPdfUrl}${currentPdfUrl.includes('#') ? '&' : '#'}view=FitH`;

    const pdfContent = (
      <div className={`modal animate-fade-up ${inline ? 'inline-mode' : ''}`} style={inline ? { maxWidth: 850, width: "100%", margin: "0 auto", boxShadow: "0 12px 48px rgba(0,0,0,0.15)", height: "100vh", display: 'flex', flexDirection: 'column', borderLeft: "1px solid var(--gray-200)", borderRight: "1px solid var(--gray-200)" } : { maxWidth: 1000, height: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--gray-200)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(8px)", borderRadius: inline ? 0 : "var(--radius-2xl) var(--radius-2xl) 0 0", position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={() => setShowPdf(false)} 
            style={{ 
              background: "transparent", border: "1px solid var(--gray-200)", display: "flex", alignItems: "center", gap: 6,
              color: "var(--navy-700)", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
              padding: "6px 14px", borderRadius: "999px", transition: "all 0.2s",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--gray-50)"; e.currentTarget.style.borderColor = "var(--gray-300)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--gray-200)"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            ปิดเอกสาร
          </button>
          
          <h2 style={{ fontSize: "1.05rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, textAlign: "center", color: "var(--navy-900)", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ fontSize: "1.2rem", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}>📄</span> เอกสารประกาศรับสมัคร
          </h2>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
            <a href={currentPdfUrl} target="_blank" rel="noopener noreferrer" title="เปิดในแท็บใหม่" 
              style={{ 
                padding: "8px 16px", color: "white", textDecoration: "none", 
                display: "flex", alignItems: "center", 
                background: "linear-gradient(135deg, var(--navy-600), var(--navy-800))", 
                borderRadius: "999px", fontSize: "0.85rem", fontWeight: 700, gap: 6,
                boxShadow: "0 4px 12px rgba(30, 58, 138, 0.2)", transition: "all 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              เปิดดูไฟล์เต็ม 
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
            {!inline ? (
              <button onClick={onClose} style={{ background: "var(--gray-100)", border: "none", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--gray-600)", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--gray-200)"; e.currentTarget.style.color = "var(--gray-800)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--gray-100)"; e.currentTarget.style.color = "var(--gray-600)"; }}
              >
                ✕
              </button>
            ) : <div style={{ width: 32 }} />}
          </div>
        </div>
        {pdfUrls.length > 1 && (
          <div style={{ padding: "8px 16px", background: "white", borderBottom: "1px solid var(--gray-200)", display: "flex", gap: 8, overflowX: "auto" }}>
            {pdfUrls.map((url, idx) => (
              <button 
                key={idx}
                onClick={() => setSelectedPdfIndex(idx)}
                style={{
                  padding: "4px 12px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 600, border: "none",
                  background: selectedPdfIndex === idx ? "var(--navy-600)" : "var(--gray-100)",
                  color: selectedPdfIndex === idx ? "white" : "var(--gray-700)",
                  cursor: "pointer", whiteSpace: "nowrap"
                }}
              >
                ไฟล์ประกาศที่ {idx + 1}
              </button>
            ))}
          </div>
        )}
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", position: "relative", backgroundColor: "#f3f4f6", borderRadius: inline ? 0 : "0 0 var(--radius-2xl) var(--radius-2xl)" }}>
          {/* Support scrolling on some mobile browsers using a wrapper, and fallback to direct link if it still stucks */}
          <iframe 
            src={embedUrl} 
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} 
            title={`ประกาศรับสมัครไฟล์ที่ ${selectedPdfIndex + 1}`} 
          />
        </div>
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
    return (
      <>
        {content}
        {/* Off-screen Banner Container for html2canvas */}
        <div style={{ position: "fixed", top: -9999, left: -9999, pointerEvents: "none" }}>
          <SocialShareCover job={job} ref={bannerRef} />
        </div>
      </>
    );
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {content}
      {/* Off-screen Banner Container for html2canvas */}
      <div style={{ position: "fixed", top: -9999, left: -9999, pointerEvents: "none" }}>
        <SocialShareCover job={job} ref={bannerRef} />
      </div>
    </div>
  );
}
