import { useState, useRef } from "react";
import { useBookmarks } from "../hooks/useBookmarks.js";
import { ModalExamPrepSection } from "./ExamResources.jsx";
import SocialShareCover from "./SocialShareCover.jsx";
import html2canvas from "html2canvas";
import { CATEGORY_MAP, EDU_COLORS } from "../utils/constants.js";
import { formatDate, daysLeft, getDisplayProvinces, getTotalJobPositions } from "../utils/helpers.js";

export default function JobDetailModal({ job, books = [], onClose, inline = false, isAdmin = false, onEdit }) {
  const [isCopied, setIsCopied] = useState(false);
  const [isEmailCopied, setIsEmailCopied] = useState(false);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [selectedPdfIndex, setSelectedPdfIndex] = useState(0);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(job?.id);
  const bannerRef = useRef(null);

  // Guard clause: must be before any job property access
  if (!job) return null;

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
  const categories = job.categories && job.categories.length > 0 ? job.categories : (job.category ? [job.category] : []);
  const mainMeta = CATEGORY_MAP[categories[0]] || { badge: "badge-civil", icon: "📄" };
  const days = daysLeft(job.deadline);
  const totalCount = getTotalJobPositions(job);
  const provinces = getDisplayProvinces(job);

  const today = new Date().toISOString().split("T")[0];
  const displayStartDate = job.startDate || job.postedDate;
  const isNotOpenYet = displayStartDate && displayStartDate > today;

  // Smart detection for email application
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  let detectedEmail = "";
  if (job.applyUrl) {
    if (job.applyUrl.startsWith("mailto:")) {
      const match = job.applyUrl.replace(/^mailto:/i, "").match(emailRegex);
      if (match) detectedEmail = match[1];
    } else if (job.applyUrl.includes("@") && !job.applyUrl.startsWith("http")) {
      const match = job.applyUrl.match(emailRegex);
      if (match) detectedEmail = match[1];
    }
  }
  if (!detectedEmail && job.description) {
    const match = job.description.match(emailRegex);
    if (match) detectedEmail = match[1];
  }

  const isEmail = Boolean(detectedEmail);
  const positionTitle = job.positionList?.[0]?.title || "";
  const emailSubject = `สมัครงาน: ${job.department}${positionTitle ? ` - ตำแหน่ง ${positionTitle}` : ""}`;
  const effectiveApplyUrl = isEmail
    ? (job.applyUrl?.startsWith("mailto:") ? job.applyUrl : `mailto:${detectedEmail}?subject=${encodeURIComponent(emailSubject)}`)
    : job.applyUrl;

  // Derive clean unified salary text
  const rawSalaries = job.positionList?.map(p => p.salary?.trim()).filter(Boolean) || [];
  let displaySalary = null;
  if (rawSalaries.length > 0) {
    const nums = rawSalaries
      .flatMap(s => s.match(/[\d,]+/g) || [])
      .map(n => parseInt(n.replace(/,/g, ''), 10))
      .filter(n => n >= 3000);

    if (nums.length > 0) {
      const minSalary = Math.min(...nums);
      const maxSalary = Math.max(...nums);
      displaySalary = minSalary === maxSalary 
        ? `${minSalary.toLocaleString()} บาท`
        : `${minSalary.toLocaleString()} – ${maxSalary.toLocaleString()} บาท`;
    } else {
      displaySalary = rawSalaries[0];
    }
  } else if (job.salary) {
    displaySalary = job.salary;
  }

  const content = (
    <div className={`modal animate-fade-up detail-modal-wrapper ${inline ? 'inline-mode' : ''}`} style={inline ? { maxWidth: '100%', margin: 0, boxShadow: 'none', maxHeight: 'none', overflow: 'visible' } : { maxWidth: 680 }} role={inline ? "region" : "dialog"} aria-modal={!inline}>

      {/* ── 1. Modern Executive Header ── */}
      <div className="detail-header-card">
        {/* Ambient Glows */}
        <div className="detail-header-glow detail-glow-tr" />
        <div className="detail-header-glow detail-glow-bl" />

        <div className="detail-header-inner">
          {/* Main Identity Logo */}
          <div className="detail-logo-wrapper">
            {job.logoUrl ? (
              <img
                src={job.logoUrl}
                alt={job.department}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.style.display = "none";
                }}
                className="detail-logo-img"
              />
            ) : (
              <span className="detail-logo-fallback">{mainMeta.icon}</span>
            )}
          </div>

          {/* Top row: Badges on left, Action Buttons on right */}
          <div className="detail-info-top-row">
            <div className="detail-header-badges">
              {categories.map((cat, idx) => {
                const catMeta = CATEGORY_MAP[cat] || { badge: "badge-civil" };
                return (
                  <span key={idx} className={`detail-cat-badge ${catMeta.badge}`}>
                    <span>{cat}</span>
                  </span>
                );
              })}
              {job.isNoOCSC ? (
                <span className="top-bar-badge badge-no-ocsc detail-badge-ocsc">
                  <span className="badge-icon">✨</span>
                  <span>ไม่ต้องผ่าน ภาค ก</span>
                </span>
              ) : job.isOCSC ? (
                <span className="top-bar-badge badge-ocsc detail-badge-ocsc">
                  <span className="badge-icon">📝</span>
                  <span>ต้องผ่าน ภาค ก</span>
                </span>
              ) : null}
              {days >= 0 && days <= 5 && (
                <span className="detail-badge-urgent">
                  🔥 {days === 0 ? "ปิดรับวันนี้!" : `ด่วน! เหลืออีก ${days} วัน`}
                </span>
              )}
            </div>

            <div className="detail-header-actions">
              {isAdmin && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(job)}
                  title="แก้ไขประกาศนี้"
                  className="btn-header-action btn-header-edit"
                >
                  ✏️ แก้ไข
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleDownloadBanner}
                  disabled={isGeneratingBanner}
                  title="สร้างรูปแบนเนอร์สรุปสำหรับแชร์"
                  className="btn-header-action btn-header-banner"
                >
                  {isGeneratingBanner ? "⏳ กำลังสร้าง..." : "📷 เซฟรูปแบนเนอร์"}
                </button>
              )}

              <button
                type="button"
                onClick={async () => {
                  const url = `${window.location.origin}/job/${job.id}`;
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: `งานราชการ: ${job.department}`,
                        text: `ดูประกาศรับสมัครงานของ ${job.department} ได้ที่นี่`,
                        url: url,
                      });
                    } catch {
                      // user cancelled or error
                    }
                  } else {
                    navigator.clipboard.writeText(url);
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }
                }}
                title="แชร์ลิงก์งานนี้"
                className="btn-header-action btn-header-glass"
              >
                {isCopied ? "✅ คัดลอกแล้ว" : "🔗 แชร์"}
              </button>

              <button
                type="button"
                onClick={() => toggleBookmark(job.id)}
                title={bookmarked ? "ยกเลิกบันทึก" : "บันทึกงานนี้"}
                className={`btn-header-bookmark ${bookmarked ? "bookmarked" : ""}`}
              >
                {bookmarked ? "❤️" : "🤍"}
              </button>

              {!inline && (
                <button
                  type="button"
                  className="btn-header-close"
                  onClick={onClose}
                  aria-label="ปิด"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Department Title */}
          <h1 className="detail-dept-title">{job.department}</h1>

          {/* Meta Subline: Location, Headcount, Positions */}
          <div className="detail-header-pills">
            {provinces.length > 0 && (
              <span className="detail-header-pill">
                📍 {provinces.join(", ")}
              </span>
            )}
            <span className="detail-header-pill">
              👥 รวม {totalCount} อัตรา
            </span>
            {job.positionList && job.positionList.length > 0 && (
              <span className="detail-header-pill">
                💼 {job.positionList.length} ตำแหน่ง
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Executive Stats Bar ── */}
      <div className={`detail-stats-bar ${provinces.length > 0 ? "has-location" : "no-location"}`}>
        {/* Metric 1: กำหนดการรับสมัคร */}
        <div className="detail-stat-card stat-deadline">
          <div className="detail-stat-icon-wrapper">📅</div>
          <div className="detail-stat-body">
            <div className="detail-stat-label">กำหนดการรับสมัคร</div>
            <div className="detail-stat-value">
              {days >= 0 ? (
                <>
                  <span className="stat-date-text">
                    {displayStartDate ? `${formatDate(displayStartDate)} – ` : ""}
                    <strong>{formatDate(job.deadline)}</strong>
                  </span>
                  <span className={`stat-pill-days ${days === 0 ? "today" : days <= 5 ? "urgent" : "normal"}`}>
                    {days === 0 ? "ปิดรับวันนี้!" : `เหลือ ${days} วัน`}
                  </span>
                </>
              ) : (
                <span className="stat-pill-days closed">หมดเขตรับสมัครแล้ว</span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 2: อัตราเงินเดือน */}
        <div className="detail-stat-card stat-salary">
          <div className="detail-stat-icon-wrapper">💰</div>
          <div className="detail-stat-body">
            <div className="detail-stat-label">อัตราเงินเดือน</div>
            <div className="detail-stat-value">
              <span className="stat-value-highlight green">{displaySalary || "ตามระเบียบกำหนด"}</span>
            </div>
          </div>
        </div>

        {/* Metric 3: จำนวนที่เปิดรับ */}
        <div className="detail-stat-card stat-quota">
          <div className="detail-stat-icon-wrapper">👥</div>
          <div className="detail-stat-body">
            <div className="detail-stat-label">จำนวนที่เปิดรับ</div>
            <div className="detail-stat-value">
              <span className="stat-value-highlight navy">{totalCount} อัตรา</span>
              <span className="stat-sub-text">({job.positionList?.length || 1} ตำแหน่ง)</span>
            </div>
          </div>
        </div>

        {/* Metric 4: สถานที่ปฏิบัติงาน (ซ่อนเมื่อเลือก 'ไม่ระบุ') */}
        {provinces.length > 0 && (
          <div className="detail-stat-card stat-location">
            <div className="detail-stat-icon-wrapper">📍</div>
            <div className="detail-stat-body">
              <div className="detail-stat-label">สถานที่ปฏิบัติงาน</div>
              <div className="detail-stat-value">
                <span className="stat-location-name">{provinces.join(", ")}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Body Content ── */}
      <div className="modal-body detail-modal-body">

        {/* ── Position Section Header ── */}
        <div className="detail-section-header">
          <div className="detail-section-title-wrap">
            <span className="detail-section-icon">📋</span>
            <h2 className="detail-section-title">ตำแหน่งที่เปิดรับสมัคร</h2>
            <span className="detail-section-count-badge">({job.positionList?.length || 1} ตำแหน่ง)</span>
          </div>
          <div className="detail-section-total-pill">
            รวม {totalCount} อัตรา
          </div>
        </div>

        {/* ── Position Cards ── */}
        <div className="detail-position-list">
          {job.positionList?.map((pos, i) => {
            const posEdus = Array.isArray(pos.education) ? pos.education : (pos.education ? [pos.education] : []);
            if (pos.units && pos.units.length > 0) {
              return (
                <div key={i} className="detail-pos-card">
                  {/* Group Header */}
                  <div className="detail-pos-header">
                    <span className="detail-pos-index">{i + 1}</span>
                    <div className="detail-pos-title">
                      <span className="pos-folder-icon">📁</span>
                      {pos.title}
                    </div>
                    {pos.salary && (
                      <span className="detail-pos-header-salary">
                        💰 {pos.salary}
                      </span>
                    )}
                  </div>

                  {/* Units Body */}
                  <div className="detail-units-container">
                    {pos.units.map((unit, uIdx) => {
                      const unitEdus = Array.isArray(unit.education) ? unit.education : (unit.education ? [unit.education] : []);
                      return (
                        <div key={uIdx} className="detail-unit-row">
                          <div className="detail-unit-title-bar">
                            <span className="unit-pin-icon">📍</span>
                            <span className="unit-name">{unit.name}</span>
                            <span className="unit-quota-pill">(จำนวน {unit.count} อัตรา)</span>
                          </div>
                          <div className="detail-unit-specs">
                            <div className="unit-edu-row">
                              <span className="unit-spec-title">🎓 วุฒิที่เปิดรับ:</span>
                              {unitEdus.map((edu, eIdx) => {
                                const eduStyle = EDU_COLORS[edu] || { bg: "var(--gray-100)", border: "var(--gray-300)", color: "var(--gray-700)" };
                                return (
                                  <span key={eIdx} className="detail-edu-tag" style={{
                                    background: eduStyle.bg, borderColor: eduStyle.border, color: eduStyle.color
                                  }}>
                                    {edu}
                                  </span>
                                );
                              })}
                              {unit.major && (
                                <span className="unit-major-name">{unit.major}</span>
                              )}
                            </div>
                            {unit.details && (
                              <div className="unit-work-row">
                                <span className="unit-spec-title">⚙️ ลักษณะงาน:</span>
                                <span className="unit-work-text">{unit.details}</span>
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
              <div key={i} className="detail-pos-card">
                {/* Position Header Bar */}
                <div className="detail-pos-header">
                  <span className="detail-pos-index">{i + 1}</span>
                  <div className="detail-pos-title">{pos.title}</div>
                  {pos.count && (
                    <span className="detail-pos-quota-pill">
                      🎯 {pos.count} อัตรา
                    </span>
                  )}
                </div>

                {/* Position Details Body */}
                <div className="detail-pos-content">
                  {/* Salary & Education Specs */}
                  <div className="detail-pos-specs-bar">
                    {pos.salary && (
                      <div className="detail-spec-chip chip-salary">
                        <span className="spec-label">💰 เงินเดือน:</span>
                        <span className="spec-value">{pos.salary}</span>
                      </div>
                    )}
                    {posEdus.length > 0 && (
                      <div className="detail-spec-chip chip-education">
                        <span className="spec-label">🎓 วุฒิ:</span>
                        <div className="spec-edu-tags">
                          {posEdus.map((edu, eIdx) => {
                            const style = EDU_COLORS[edu] || { bg: "var(--gray-100)", border: "var(--gray-300)", color: "var(--gray-700)" };
                            return (
                              <span key={eIdx} className="detail-edu-tag" style={{
                                background: style.bg, borderColor: style.border, color: style.color
                              }}>
                                {edu}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Qualifications Note */}
                  {pos.details && (
                    <div className="detail-pos-qualifications">
                      <div className="qualifications-header">
                        <span className="qualifications-icon">📌</span>
                        <span>คุณสมบัติเฉพาะสำหรับตำแหน่ง</span>
                      </div>
                      <div className="qualifications-content">
                        {pos.details}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 4. Application Guide & Info ── */}
        {job.description && (
          <div className="detail-apply-guide-card">
            <div className="apply-guide-header">
              <div className="apply-guide-title-wrap">
                <span className="apply-guide-icon">📝</span>
                <h3 className="apply-guide-title">วิธีการรับสมัครและรายละเอียด</h3>
              </div>
              {isEmail && (
                <span className="apply-guide-mode-tag">รับสมัครทางอีเมล</span>
              )}
            </div>

            <div className="apply-guide-body">
              <p className="apply-guide-text">{job.description}</p>
            </div>

            {/* Smart Email Application Box */}
            {isEmail && detectedEmail && (
              <div className="detail-email-action-box">
                <div className="email-action-left">
                  <div className="email-action-avatar">✉️</div>
                  <div className="email-action-meta">
                    <span className="email-action-subtitle">ส่งเอกสารใบสมัครทางอีเมลได้ที่:</span>
                    <strong className="email-action-address">{detectedEmail}</strong>
                  </div>
                </div>
                <div className="email-action-buttons">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(detectedEmail);
                      setIsEmailCopied(true);
                      setTimeout(() => setIsEmailCopied(false), 2200);
                    }}
                    className="btn-copy-email-action"
                    title={`คัดลอกอีเมล ${detectedEmail}`}
                  >
                    {isEmailCopied ? "✅ คัดลอกแล้ว" : "📋 คัดลอกอีเมล"}
                  </button>
                  <a
                    href={`mailto:${detectedEmail}?subject=${encodeURIComponent(emailSubject)}`}
                    className="btn-send-email-action"
                  >
                    ✉️ ส่งเมลสมัครทันที
                  </a>
                </div>
              </div>
            )}
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
          ) : effectiveApplyUrl ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <a
                href={effectiveApplyUrl}
                target={isEmail ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="btn btn-primary modal-btn-action"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: isEmail ? "linear-gradient(135deg, #0284c7, #0369a1)" : undefined
                }}
              >
                {isEmail ? "📧 ส่งใบสมัครทางอีเมล" : "สมัครออนไลน์ →"}
              </a>
              {isEmail && detectedEmail && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(detectedEmail);
                    setIsEmailCopied(true);
                    setTimeout(() => setIsEmailCopied(false), 2200);
                  }}
                  className="btn"
                  style={{
                    background: "var(--navy-50)",
                    border: "1px solid var(--navy-200)",
                    color: isEmailCopied ? "var(--accent)" : "var(--navy-700)",
                    fontSize: "0.82rem",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    transition: "all 0.2s"
                  }}
                  title={`คัดลอกอีเมล ${detectedEmail}`}
                >
                  {isEmailCopied ? "✅ คัดลอกแล้ว" : `📋 คัดลอกอีเมล`}
                </button>
              )}
            </div>
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
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
