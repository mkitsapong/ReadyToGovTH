import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useBookmarks } from "../hooks/useBookmarks.js";
import { ModalExamPrepSection } from "./ExamResources.jsx";
import SocialShareCover from "./SocialShareCover.jsx";
import { CATEGORY_MAP, EDU_COLORS } from "../utils/constants.js";
import { formatDate, daysLeft, getDisplayProvinces, getTotalJobPositions } from "../utils/helpers.js";
import {
  buildCalendarEventData,
  openNativeMobileCalendar,
  getDevicePlatform,
} from "../utils/calendarHelper.js";
import JobPrintSummaryModal from "./JobPrintSummaryModal.jsx";
import AddToCalendarModal from "./AddToCalendarModal.jsx";
import SocialPosterModal from "./SocialPosterModal.jsx";

export default function JobDetailModal({ job, books = [], onClose, inline = false, isAdmin = false, onEdit, onToast }) {
  const [isCopied, setIsCopied] = useState(false);
  const [isEmailCopied, setIsEmailCopied] = useState(false);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [selectedPdfIndex, setSelectedPdfIndex] = useState(0);
  const [isPdfFullscreen, setIsPdfFullscreen] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(true);
  const [useGoogleDocsViewer, setUseGoogleDocsViewer] = useState(false);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(job?.id);
  const bannerFeedRef = useRef(null);
  const bannerStoryRef = useRef(null);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [generatingRatio, setGeneratingRatio] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showPosterModal, setShowPosterModal] = useState(false);

  const handleQuickCalendarClick = (e) => {
    e.stopPropagation();
    const { isMobile } = getDevicePlatform();
    if (isMobile) {
      // 1-Tap: Directly trigger the native Calendar app on the mobile phone!
      const eventData = buildCalendarEventData(job, {
        eventType: "deadline",
        reminderDays: [1, 3],
      });
      openNativeMobileCalendar(eventData, onToast);
    } else {
      setShowCalendarModal(true);
    }
  };

  // Keyboard listener for Escape key to close document viewer or exit fullscreen
  useEffect(() => {
    if (!showPdf) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isPdfFullscreen) {
          setIsPdfFullscreen(false);
        } else {
          setShowPdf(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPdf, isPdfFullscreen]);

  // Reset loading state when switching document index or viewer engine
  useEffect(() => {
    if (showPdf) {
      setIsPdfLoading(true);
    }
  }, [showPdf, selectedPdfIndex, useGoogleDocsViewer]);

  // Lock body scroll when in fullscreen reading mode
  useEffect(() => {
    if (isPdfFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPdfFullscreen]);

  // Guard clause: must be before any job property access
  if (!job) return null;

  const handleDownloadBanner = async (ratio = "4:5") => {
    const targetRef = ratio === "9:16" ? bannerStoryRef.current : bannerFeedRef.current;
    if (!targetRef) return;
    try {
      setIsGeneratingBanner(true);
      setGeneratingRatio(ratio);
      // Dynamic Lazy Loading: html2canvas is loaded only when user clicks to generate/download banner
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(targetRef, {
        scale: 2, // High resolution
        useCORS: true, // Allow cross-origin images
        backgroundColor: null,
      });

      const image = canvas.toDataURL("image/png");
      const ratioSuffix = ratio === "9:16" ? "story-9x16" : "feed-4x5";
      const fileName = `readytogov-${job.department.replace(/\s+/g, "-")}-${ratioSuffix}.png`;

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
              title: `${job.department} (${ratio})`,
            });
            setShowBannerModal(false);
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
      setShowBannerModal(false);
    } catch (err) {
      console.error("Error generating banner:", err);
      alert("เกิดข้อผิดพลาดในการสร้างรูปแบนเนอร์");
    } finally {
      setIsGeneratingBanner(false);
      setGeneratingRatio(null);
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

      {/* Closed Notice Banner */}
      {days < 0 && (
        <div className="job-closed-notice-banner">
          <div className="closed-banner-left">
            <span className="closed-banner-icon">⚠️</span>
            <div className="closed-banner-text">
              <strong>ประกาศนี้ปิดรับสมัครแล้ว</strong> (หมดเขตเมื่อ {formatDate(job.deadline)})
              <p className="closed-banner-sub">
                ท่านยังสามารถเปิดอ่านเอกสารประกาศฉบับเต็มด้านล่าง เพื่อดูหลักสูตรและขอบเขตวิชาสอบได้
              </p>
            </div>
          </div>
          <Link to="/" className="btn-closed-view-active">
            🔍 ดูงานที่เปิดรับอยู่
          </Link>
        </div>
      )}

      {/* ── 1. Modern Executive Header ── */}
      <div className="detail-header-card">
        {/* Ambient Glows */}
        <div className="detail-header-glow detail-glow-tr" />
        <div className="detail-header-glow detail-glow-bl" />

        {/* Modal Close Button (Top-Right) */}
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
              {days < 0 ? (
                <span className="pill-badge pill-expired detail-badge-expired">
                  ⚠️ ปิดรับสมัครแล้ว
                </span>
              ) : days >= 0 && days <= 5 ? (
                <span className="detail-badge-urgent">
                  🔥 {days === 0 ? "ปิดรับวันนี้!" : `ด่วน! เหลืออีก ${days} วัน`}
                </span>
              ) : null}
            </div>

            <div className="detail-header-actions">
              <button
                type="button"
                onClick={() => setShowCalendarModal(true)}
                title="บันทึกเตือนวันลงปฏิทิน (Google Calendar / Apple / Outlook)"
                className="btn-header-action btn-header-calendar"
              >
                📅 เตือนลงปฏิทิน
              </button>

              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                title="พิมพ์หรือบันทึกเป็น PDF สรุป 1 หน้า (A4)"
                className="btn-header-action btn-header-print"
              >
                🖨️ สรุป 1 หน้า
              </button>

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
                  onClick={() => setShowPosterModal(true)}
                  title="สร้างข้อความแคปชั่นสำหรับโพสต์ลง Facebook / X / Threads และแบนเนอร์ (1 คลิก)"
                  className="btn-header-action btn-header-banner"
                  style={{
                    background: "linear-gradient(135deg, #f97316, #ea580c)",
                    color: "white",
                    border: "none",
                    fontWeight: 700,
                    boxShadow: "0 2px 8px rgba(249, 115, 22, 0.35)",
                  }}
                >
                  📢 โพสต์โซเชียล (1 คลิก)
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
                id={`btn-modal-bookmark-${job.id}`}
                onClick={() => {
                  const isNowBookmarked = toggleBookmark(job.id, job);
                  if (onToast) {
                    onToast(
                      isNowBookmarked
                        ? `บันทึกงาน "${job.department}" แล้ว ❤️`
                        : `ยกเลิกการบันทึก "${job.department}" แล้ว`,
                      isNowBookmarked ? "success" : "info"
                    );
                  }
                }}
                title={bookmarked ? "ยกเลิกบันทึก" : "บันทึกงานนี้"}
                aria-label={bookmarked ? "ยกเลิกบันทึก" : "บันทึกงานนี้"}
                className={`btn-header-bookmark ${bookmarked ? "bookmarked" : ""}`}
              >
                {bookmarked ? "❤️" : "🤍"}
              </button>
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
                  <div className="stat-date-text">
                    {displayStartDate ? `${formatDate(displayStartDate)} – ` : ""}
                    <strong>{formatDate(job.deadline)}</strong>
                  </div>
                  <div className="stat-deadline-actions">
                    <span className={`stat-pill-days ${days === 0 ? "today" : days <= 5 ? "urgent" : "normal"}`}>
                      <span className="stat-pill-icon">{days === 0 ? "🚨" : days <= 5 ? "🔥" : "⏳"}</span>
                      <span>{days === 0 ? "ปิดรับวันนี้!" : `เหลือ ${days} วัน`}</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleQuickCalendarClick}
                      className="btn-stat-calendar-quick"
                      title="บันทึกเตือนวันปิดรับสมัครลงปฏิทินในมือถือ / คอมพิวเตอร์"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      <span>เตือนปฏิทิน</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="stat-deadline-actions">
                  <span className="stat-pill-days closed">
                    <span>⚠️</span>
                    <span>หมดเขตรับสมัครแล้ว</span>
                  </span>
                </div>
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
          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="btn btn-outline modal-btn-action btn-print-summary"
            title="พิมพ์หรือบันทึกเป็น PDF สรุป 1 หน้า (A4)"
          >
            🖨️ สรุป 1 หน้า (PDF)
          </button>
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
          {days < 0 ? (
            <button
              type="button"
              disabled
              className="btn modal-btn-action btn-closed"
              style={{
                background: "rgba(100, 116, 139, 0.15)",
                color: "var(--text-muted)",
                border: "1px solid rgba(148, 163, 184, 0.3)",
                cursor: "not-allowed",
                fontWeight: 600,
              }}
            >
              ⚠️ ปิดรับสมัครแล้ว
            </button>
          ) : isNotOpenYet ? (
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
    let embedUrl = "";
    if (useGoogleDocsViewer) {
      embedUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(currentPdfUrl)}&embedded=true`;
    } else if (currentPdfUrl.includes("drive.google.com/file/d/")) {
      embedUrl = currentPdfUrl.replace(/\/view.*$/, "/preview");
    } else {
      embedUrl = `${currentPdfUrl}${currentPdfUrl.includes("#") ? "&" : "#"}view=FitH`;
    }

    const pdfContent = (
      <div className={`doc-viewer-wrapper ${inline ? "inline-mode" : "modal-mode"} ${isPdfFullscreen ? "fullscreen-mode" : ""}`}>
        {/* Top Header / Control Bar */}
        <div className="doc-viewer-header">
          {/* Left: Back button & Department Context */}
          <div className="doc-viewer-left">
            <button
              type="button"
              onClick={() => {
                if (isPdfFullscreen) {
                  setIsPdfFullscreen(false);
                } else {
                  setShowPdf(false);
                }
              }}
              className="doc-viewer-back-btn"
              title={isPdfFullscreen ? "ออกจากโหมดเต็มจอ (Esc)" : "ปิดเอกสารกลับสู่หน้ารายละเอียด (Esc)"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>{isPdfFullscreen ? "ย่อหน้าจอ" : "ปิดเอกสาร"}</span>
            </button>

            <div className="doc-viewer-divider" />

            <div className="doc-viewer-title-group">
              <div className="doc-viewer-dept" title={job.department}>
                {job.department}
              </div>
              <div className="doc-viewer-subtitle">
                <span className="doc-viewer-badge">
                  {mainMeta.icon || "📄"} {categories[0] || "งานราชการ"}
                </span>
                <span>• ประกาศรับสมัครงานฉบับเต็ม</span>
              </div>
            </div>
          </div>

          {/* Center: File Switcher Tabs (if multiple attachments) */}
          {pdfUrls.length > 1 && (
            <div className="doc-viewer-center">
              {pdfUrls.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedPdfIndex(idx);
                    setIsPdfLoading(true);
                  }}
                  className={`doc-file-pill ${selectedPdfIndex === idx ? "active" : ""}`}
                  title={`สลับดูไฟล์ที่ ${idx + 1}`}
                >
                  <span>📄</span>
                  <span>ฉบับที่ {idx + 1}</span>
                </button>
              ))}
            </div>
          )}

          {/* Right: Action tools */}
          <div className="doc-viewer-right">
            {/* Toggle Fullscreen Theater Mode */}
            <button
              type="button"
              onClick={() => setIsPdfFullscreen(prev => !prev)}
              className="doc-tool-btn accent"
              title={isPdfFullscreen ? "ย่อขนาดจอ (Esc)" : "ขยายโหมดอ่านเต็มหน้าจอ (Fullscreen)"}
            >
              {isPdfFullscreen ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
                  </svg>
                  <span className="btn-label">ย่อหน้าจอ</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                  </svg>
                  <span className="btn-label">ขยายเต็มจอ</span>
                </>
              )}
            </button>

            {/* Close Cross Button for Modal or Fullscreen */}
            {(!inline || isPdfFullscreen) && (
              <button
                type="button"
                onClick={() => {
                  if (isPdfFullscreen) {
                    setIsPdfFullscreen(false);
                  } else {
                    onClose ? onClose() : setShowPdf(false);
                  }
                }}
                className="doc-tool-icon-btn"
                title="ปิด (Esc)"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Informative Sub-toolbar / Troubleshooting helper */}
        <div className="doc-viewer-infobar">
          <div className="doc-viewer-infobar-left">
            <span>
              📄 เอกสารฉบับที่ {selectedPdfIndex + 1} จาก {pdfUrls.length}
            </span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span>
              💡 แนะนำ: กดปุ่ม <strong>"ขยายเต็มจอ"</strong> เพื่ออ่านเอกสาร A4 และตารางคะแนนได้ชัดเจนที่สุด
            </span>
          </div>
          <div className="doc-viewer-infobar-right">
            <span>เอกสารไม่ขึ้นหรือโหลดช้า?</span>
            <button
              type="button"
              onClick={() => setUseGoogleDocsViewer(prev => !prev)}
              className="inline-link"
              title="สลับโหมดการแสดงผลกรณีหน่วยงานตั้งค่าบล็อก Iframe"
            >
              🔄 {useGoogleDocsViewer ? "สลับกลับมุมมองปกติ" : "เปิดผ่าน Google Viewer"}
            </button>
          </div>
        </div>

        {/* Viewer Canvas */}
        <div className="doc-viewer-body">
          {isPdfLoading && (
            <div className="doc-viewer-loader">
              <div className="doc-viewer-spinner" />
              <div style={{ fontSize: "0.85rem", fontWeight: 500, color: "#94a3b8" }}>
                กำลังเชื่อมต่อและโหลดเอกสารประกาศ...
              </div>
            </div>
          )}

          <iframe
            src={embedUrl}
            className="doc-viewer-iframe"
            title={`เอกสารประกาศรับสมัคร - ${job.department}`}
            onLoad={() => setIsPdfLoading(false)}
          />
        </div>
      </div>
    );

    if (inline && !isPdfFullscreen) return pdfContent;

    return (
      <div
        className="modal-overlay"
        onClick={(e) => e.target === e.currentTarget && !isPdfFullscreen && setShowPdf(false)}
        style={{ zIndex: isPdfFullscreen ? 99999 : 1100, padding: isPdfFullscreen ? 0 : "20px 16px" }}
      >
        {pdfContent}
      </div>
    );
  }

  const bannerModalContent = showBannerModal && (
    <div
      className="modal-overlay"
      style={{ zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={() => !isGeneratingBanner && setShowBannerModal(false)}
    >
      <div
        className="modal animate-fade-up"
        style={{ maxWidth: 450, width: "100%", padding: 0, overflow: "hidden", borderRadius: "24px", boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color, #e2e8f0)", background: "linear-gradient(135deg, var(--gray-50, #f8fafc), var(--white, #ffffff))", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.4rem" }}>📷</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "var(--navy-800, #0f172a)" }}>
                สร้างรูปแบนเนอร์สำหรับแชร์
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "var(--navy-400, #64748b)" }}>
                เลือกขนาดรูปภาพความละเอียดสูง (2x) เพื่อโพสต์ลงโซเชียล
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={() => setShowBannerModal(false)}
            disabled={isGeneratingBanner}
            style={{ position: "static", background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Option 1: 4:5 Feed */}
          <div
            onClick={() => !isGeneratingBanner && handleDownloadBanner("4:5")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "16px",
              borderRadius: 16,
              border: "1.5px solid var(--border-color, #e2e8f0)",
              background: "var(--card-bg, #ffffff)",
              cursor: isGeneratingBanner ? "wait" : "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent, #ea580c)";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(234, 88, 12, 0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-color, #e2e8f0)";
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.03)";
            }}
          >
            <div style={{ width: 50, height: 62, borderRadius: 8, background: "#fff7ed", border: "1.5px solid #ffedd5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>
              🖼️
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--navy-800, #0f172a)" }}>
                  ขนาด 4:5 (Feed โพสต์)
                </span>
                <span style={{ fontSize: "0.72rem", background: "#fff7ed", color: "#ea580c", padding: "2px 8px", borderRadius: 100, fontWeight: 700 }}>
                  1080 × 1350 px
                </span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "var(--navy-400, #64748b)", lineHeight: 1.4 }}>
                เหมาะสำหรับโพสต์บน Facebook, Instagram Feed, Twitter / X, LINE
              </p>
            </div>
          </div>

          {/* Option 2: 9:16 Story */}
          <div
            onClick={() => !isGeneratingBanner && handleDownloadBanner("9:16")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "16px",
              borderRadius: 16,
              border: "1.5px solid var(--border-color, #e2e8f0)",
              background: "var(--card-bg, #ffffff)",
              cursor: isGeneratingBanner ? "wait" : "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#15803d";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(21, 128, 61, 0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-color, #e2e8f0)";
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.03)";
            }}
          >
            <div style={{ width: 50, height: 76, borderRadius: 8, background: "#f0fdf4", border: "1.5px solid #dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>
              📱
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--navy-800, #0f172a)" }}>
                  ขนาด 9:16 (Story / TikTok)
                </span>
                <span style={{ fontSize: "0.72rem", background: "#f0fdf4", color: "#15803d", padding: "2px 8px", borderRadius: 100, fontWeight: 700 }}>
                  1080 × 1920 px
                </span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "var(--navy-400, #64748b)", lineHeight: 1.4 }}>
                สัดส่วนแนวตั้งเต็มจอ สำหรับ Instagram Story, Facebook Story, TikTok, Reels
              </p>
            </div>
          </div>

          {isGeneratingBanner && (
            <div style={{ textAlign: "center", padding: "12px", background: "var(--gray-50, #f8fafc)", borderRadius: 12, color: "var(--accent, #ea580c)", fontSize: "0.88rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <span className="spinner" style={{ width: 18, height: 18, border: "2px solid #ea580c", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
              <span>กำลังสร้างรูปภาพความละเอียดสูง ({generatingRatio})...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (inline) {
    return (
      <>
        {content}
        {bannerModalContent}
        {showPrintModal && (
          <JobPrintSummaryModal job={job} onClose={() => setShowPrintModal(false)} />
        )}
        {showCalendarModal && (
          <AddToCalendarModal job={job} onClose={() => setShowCalendarModal(false)} onToast={onToast} />
        )}
        {showPosterModal && (
          <SocialPosterModal job={job} onClose={() => setShowPosterModal(false)} onToast={onToast} />
        )}
        {/* Off-screen Banner Containers for html2canvas */}
        <div style={{ position: "fixed", top: -9999, left: -9999, pointerEvents: "none" }}>
          <SocialShareCover job={job} aspectRatio="4:5" ref={bannerFeedRef} />
          <SocialShareCover job={job} aspectRatio="9:16" ref={bannerStoryRef} />
        </div>
      </>
    );
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {content}
      {bannerModalContent}
      {showPrintModal && (
        <JobPrintSummaryModal job={job} onClose={() => setShowPrintModal(false)} />
      )}
      {showCalendarModal && (
        <AddToCalendarModal job={job} onClose={() => setShowCalendarModal(false)} onToast={onToast} />
      )}
      {showPosterModal && (
        <SocialPosterModal job={job} onClose={() => setShowPosterModal(false)} onToast={onToast} />
      )}
      {/* Off-screen Banner Containers for html2canvas */}
      <div style={{ position: "fixed", top: -9999, left: -9999, pointerEvents: "none" }}>
        <SocialShareCover job={job} aspectRatio="4:5" ref={bannerFeedRef} />
        <SocialShareCover job={job} aspectRatio="9:16" ref={bannerStoryRef} />
      </div>
    </div>
  );
}
