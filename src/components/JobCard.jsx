import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CATEGORY_MAP } from "../utils/constants.js";
import { getJobSectorMeta } from "../utils/sectorHelper.js";
import { getDisplayProvinces, daysLeft, formatDate, getTotalJobPositions, getPositionCount } from "../utils/helpers.js";
import ApplicationTrackerBadge from "./ApplicationTrackerBadge.jsx";

export default function JobCard({
  job,
  style,
  layout = "grid",
  isAdmin,
  onEdit,
  userEducation,
  isBookmarked,
  onToggleBookmark,
  onOpenPoster,
  onOpenShare,
  tracking,
  onUpdateTracking,
  onOpenTrackerDetails,
}) {
  const navigate = useNavigate();
  const [logoFailed, setLogoFailed] = useState(false);

  // Whole card is clickable — except interactive children and while selecting text
  const handleCardClick = (e) => {
    if (e.defaultPrevented) return;
    if (e.target.closest("a, button, input, select, textarea, label")) return;
    if (window.getSelection?.()?.toString()) return;
    if (e.metaKey || e.ctrlKey) {
      window.open(`/job/${job.id}`, "_blank", "noopener");
      return;
    }
    navigate(`/job/${job.id}`);
  };

  const rawCategories = job.categories && job.categories.length > 0 ? job.categories : (job.category ? [job.category] : []);
  const categories = rawCategories.filter(cat => cat !== "พนักงานหน่วยงานของรัฐ");
  const sectorMeta = getJobSectorMeta(job);
  const provinces = getDisplayProvinces(job);
  const mainMeta = CATEGORY_MAP[categories[0]] || { badge: "badge-civil", icon: "📄" };
  // daysLeft() returns 0 for missing/invalid dates — guard so such jobs aren't shown as "closing today"
  const hasDeadline = Boolean(job.deadline) && !isNaN(new Date(job.deadline).getTime());
  const days = hasDeadline ? daysLeft(job.deadline) : null;
  const urgent = hasDeadline && days <= 7 && days >= 0;
  const expired = hasDeadline && days < 0;
  const totalCount = getTotalJobPositions(job);

  const displayStartDate = job.startDate || job.postedDate;
  const dateText = !hasDeadline
    ? (displayStartDate ? `เปิดรับ ${formatDate(displayStartDate)} – ไม่ระบุวันปิดรับ` : "ไม่ระบุวันปิดรับ")
    : displayStartDate
    ? `เปิดรับ ${formatDate(displayStartDate)} – ${formatDate(job.deadline)}`
    : `ปิดรับ ${formatDate(job.deadline)}`;
  const dateTextExpired = displayStartDate 
    ? `${formatDate(displayStartDate)} – ${formatDate(job.deadline)}`
    : `ปิดรับ ${formatDate(job.deadline)}`;

  const uniqueEdus = [...new Set(job.positionList?.flatMap((p) => Array.isArray(p.education) ? p.education : (p.education ? [p.education] : [])))];

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

  // ── 1. Horizontal List Layout (Ultra-Clean Frameless Editorial Style) ──
  if (layout === "list") {
    return (
      <div
        className={`job-card job-card-clickable job-card-horizontal ${urgent ? 'card-urgent' : expired ? 'card-expired' : ''}`}
        style={style}
        onClick={handleCardClick}
      >
        <div className="job-horizontal-wrapper">
          {/* 1. Full-Height Natural Logo (No bounding box) */}
          <div className="job-horizontal-logo-column">
            {job.logoUrl && !logoFailed ? (
              <img
                src={job.logoUrl}
                alt={job.department}
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={() => setLogoFailed(true)}
                className="job-horizontal-logo-img"
              />
            ) : (
              <span className="job-horizontal-logo-fallback">{mainMeta.icon}</span>
            )}
          </div>

          {/* 2. Main Content Body */}
          <div className="job-horizontal-main-body">
            {/* Top Half: Department Header, Position & Location Subline, Clean Salary */}
            <div className="job-horizontal-top-section">
              <div className="job-horizontal-heading-group">
                {/* Department Name Hero Headline */}
                <h3 className="job-horizontal-dept-title" title={job.department}>
                  <Link to={`/job/${job.id}`} onClick={(e) => e.stopPropagation()}>
                    {job.department}
                  </Link>
                </h3>

                {/* Position Title & Location Subline (Natural Editorial Meta) */}
                <div className="job-horizontal-meta-subline">
                  <div className="job-horizontal-pos-names">
                    {job.positionList && job.positionList.length > 0 ? (
                      <>
                        {job.positionList.slice(0, 2).map((pos, pIdx) => (
                          <span key={pIdx} className="job-pos-entry">
                            <span className="job-pos-title">{pos.title}</span>
                            {pos.count && (
                              <span className="job-pos-count-text"> ({pos.count} อัตรา)</span>
                            )}
                            {pIdx === 0 && job.positionList.length > 1 && (
                              <span className="job-pos-bullet">, </span>
                            )}
                          </span>
                        ))}
                        {job.positionList.length > 2 && (
                          <span className="job-pos-more-tag">+{job.positionList.length - 2} ตำแหน่ง</span>
                        )}
                      </>
                    ) : (
                      <span className="job-pos-entry">
                        <span className="job-pos-title">{job.title || "เปิดรับสมัครบุคคลเข้าทำงาน"}</span>
                      </span>
                    )}
                  </div>

                  {provinces.length > 0 && (
                    <span className="job-horizontal-loc-text">
                      <span className="meta-sep">·</span>
                      <span className="meta-loc-text">📍 {provinces[0]}{provinces.length > 1 ? ` (+${provinces.length - 1})` : ""}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Top Right: Clean Unboxed Salary & Quick Actions */}
              <div className="job-horizontal-top-right">
                <div className="job-horizontal-salary-clean">
                  <div className="salary-amount-text">{displaySalary || "ตามระเบียบกำหนด"}</div>
                  <div className="salary-quota-sub">รวม {totalCount} อัตรา</div>
                </div>

                <div className="job-horizontal-quick-actions">
                  {isBookmarked && (
                    <ApplicationTrackerBadge
                      tracking={tracking || { status: "interested" }}
                      onStatusChange={(newStatus) => onUpdateTracking?.({ status: newStatus })}
                      onOpenDetails={onOpenTrackerDetails}
                      compact
                    />
                  )}
                  <button
                    type="button"
                    id={`btn-share-${job.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onOpenShare?.(job);
                    }}
                    title="แชร์ประกาศนี้"
                    aria-label="แชร์ประกาศนี้"
                    className="job-btn-circle"
                  >
                    🔗
                  </button>
                  <button
                    type="button"
                    id={`btn-bookmark-${job.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleBookmark?.();
                    }}
                    title={isBookmarked ? "ยกเลิกบันทึก" : "บันทึกงานนี้"}
                    aria-label={isBookmarked ? "ยกเลิกบันทึก" : "บันทึกงานนี้"}
                    className={`job-btn-circle ${isBookmarked ? 'bookmarked' : ''}`}
                  >
                    {isBookmarked ? "❤️" : "🤍"}
                  </button>
                </div>
              </div>
            </div>

            {/* Subtle Divider Line */}
            <div className="job-horizontal-divider" />

            {/* Bottom Half: Clean Inline Meta on Left + Deadline & CTA on Right */}
            <div className="job-horizontal-bottom-section">
              <div className="job-horizontal-tags-row">
                {/* Official Exam Requirement */}
                {job.isNoOCSC ? (
                  <span className="clean-meta-item tag-amber-text">
                    ✨ ไม่ต้องผ่าน ภาค ก
                  </span>
                ) : job.isOCSC ? (
                  <span className="clean-meta-item tag-blue-text">
                    📝 ต้องผ่าน ภาค ก
                  </span>
                ) : null}

                {/* Sector / Workplace */}
                {sectorMeta && sectorMeta.id !== "central" && (
                  <span className="clean-meta-item tag-slate-text" title={`แวดวง: ${sectorMeta.label}`}>
                    <span className="clean-dot">·</span>
                    <span>{sectorMeta.shortLabel}</span>
                  </span>
                )}

                {/* Personnel Categories */}
                {categories.map((cat, idx) => (
                  <span key={idx} className="clean-meta-item tag-slate-text">
                    <span className="clean-dot">·</span>
                    <span>{cat}</span>
                  </span>
                ))}

                {/* Education */}
                {uniqueEdus.length > 0 && (
                  <span className="clean-meta-item tag-slate-text" title={uniqueEdus.join(", ")}>
                    <span className="clean-dot">·</span>
                    <span>🎓 {uniqueEdus[0]}{uniqueEdus.length > 1 ? ` +${uniqueEdus.length - 1}` : ""}</span>
                  </span>
                )}

                {/* Admin Quick Tools */}
                {isAdmin && (
                  <div className="job-horizontal-admin-group">
                    <button
                      type="button"
                      id={`btn-edit-${job.id}`}
                      onClick={(e) => { e.stopPropagation(); onEdit(job); }}
                      className="btn-admin-ghost"
                    >
                      ✏️ แก้ไข
                    </button>
                    {onOpenPoster && (
                      <button
                        type="button"
                        id={`btn-poster-${job.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onOpenPoster(job);
                        }}
                        className="btn-admin-ghost"
                        style={{ color: "#ea580c" }}
                      >
                        📢 โพสต์
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Right: Clean Deadline Text & CTA Button */}
              <div className="job-horizontal-cta-group">
                <div className="job-horizontal-deadline-text">
                  {!hasDeadline ? (
                    <span className="deadline-clean muted">ดูกำหนดในประกาศ</span>
                  ) : expired ? (
                    <span className="deadline-clean expired">⚠️ ปิดรับสมัครแล้ว</span>
                  ) : days === 0 ? (
                    <span className="deadline-clean today">🔥 ปิดรับวันนี้!</span>
                  ) : urgent ? (
                    <span className="deadline-clean urgent">⚡ เหลือ ${days} วัน (${formatDate(job.deadline)})</span>
                  ) : (
                    <span className="deadline-clean normal">📅 ปิดรับ ${formatDate(job.deadline)} (เหลือ ${days} วัน)</span>
                  )}
                </div>

                <Link
                  id={`btn-detail-${job.id}`}
                  to={`/job/${job.id}`}
                  className="btn-detail-human"
                >
                  <span>ดูรายละเอียด</span>
                  <span className="btn-detail-arrow">➔</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 2. Grid Card Layout (ตารางการ์ดเดิม) ──
  return (
    <div className="job-card job-card-clickable" style={style} onClick={handleCardClick}>
      {/* ── Card Header ── */}
      <div className="job-card-header-modern">
        {/* Subtle decorative glow & ambient lights */}
        <div className="job-header-glow" />
        <div className="job-header-glow-left" />

        {/* 1. Slim Top Status Bar */}
        <div className="job-card-top-bar">
          <div className="top-bar-left">
            {job.isNoOCSC ? (
              <span className="top-bar-badge badge-no-ocsc">
                <span className="badge-icon">✨</span>
                <span>ไม่ต้องผ่าน ภาค ก</span>
              </span>
            ) : job.isOCSC ? (
              <span className="top-bar-badge badge-ocsc">
                <span className="badge-icon">📝</span>
                <span>ต้องผ่าน ภาค ก</span>
              </span>
            ) : null}
          </div>

          <div className="top-bar-right" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {isBookmarked && (
              <ApplicationTrackerBadge
                tracking={tracking || { status: "interested" }}
                onStatusChange={(newStatus) => onUpdateTracking?.({ status: newStatus })}
                onOpenDetails={onOpenTrackerDetails}
                compact
              />
            )}
            <button
              type="button"
              id={`btn-share-${job.id}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenShare?.(job);
              }}
              title="แชร์ประกาศนี้ (Deep Link & Dynamic OG Image)"
              aria-label="แชร์ประกาศนี้"
              className="job-btn-bookmark job-btn-share"
            >
              🔗
            </button>
            <button
              type="button"
              id={`btn-bookmark-${job.id}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleBookmark?.();
              }}
              title={isBookmarked ? "ยกเลิกบันทึก" : "บันทึกงานนี้"}
              aria-label={isBookmarked ? "ยกเลิกบันทึก" : "บันทึกงานนี้"}
              className={`job-btn-bookmark ${isBookmarked ? 'bookmarked' : ''}`}
            >
              {isBookmarked ? "❤️" : "🤍"}
            </button>
          </div>
        </div>

        {/* 2. Main Header Content (Logo + Dept Info + Admin Edit) */}
        <div className="job-header-main-row">
          {/* Logo */}
          <div className="job-logo-box">
            {job.logoUrl && !logoFailed ? (
              <img
                src={job.logoUrl}
                alt={job.department}
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={() => setLogoFailed(true)}
                className="job-logo-img"
              />
            ) : (
              <span className="job-logo-fallback">{mainMeta.icon}</span>
            )}
          </div>

          {/* Department Name & Badges */}
          <div className="job-dept-content">
            <h3 className="job-dept-name-title" title={job.department}>
              <Link to={`/job/${job.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                {job.department}
              </Link>
            </h3>

            {/* Badges Row (Categories + Workplace Sector + Inline Admin Edit) */}
            <div className="job-header-badges">
              {categories.map((cat, idx) => {
                const catMeta = CATEGORY_MAP[cat] || { badge: "badge-civil" };
                return (
                  <span key={idx} className={`job-badge-pill ${catMeta.badge}`}>
                    {cat}
                  </span>
                );
              })}

              {/* Sector Badge (e.g. 🏥 โรงพยาบาล/สธ., 🎓 สถานศึกษา/มหาลัย) */}
              {sectorMeta && sectorMeta.id !== "central" && (
                <span
                  className={`job-badge-pill ${sectorMeta.badgeClass}`}
                  title={`แวดวงหน่วยงาน: ${sectorMeta.label}`}
                >
                  {sectorMeta.icon} {sectorMeta.shortLabel}
                </span>
              )}

              {isAdmin && (
                <>
                  <button
                    type="button"
                    id={`btn-edit-${job.id}`}
                    onClick={() => onEdit(job)}
                    title="แก้ไขประกาศ"
                    className="job-btn-edit-inline"
                  >
                    ✏️ แก้ไข
                  </button>
                  {onOpenPoster && (
                    <button
                      type="button"
                      id={`btn-poster-${job.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onOpenPoster(job);
                      }}
                      title="สร้างข้อความโพสต์โซเชียล & แบนเนอร์ (1 คลิก)"
                      className="job-btn-edit-inline"
                      style={{
                        background: "var(--orange-50)",
                        borderColor: "var(--orange-300)",
                        color: "var(--orange-700)",
                        fontWeight: 700,
                      }}
                    >
                      📢 โพสต์
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Deadline & Countdown Ribbon ── */}
      <div className={`job-countdown-strip ${urgent ? 'status-urgent' : expired ? 'status-expired' : 'status-normal'}`}>
        <div className="job-countdown-date">
          <span className="countdown-icon">{urgent ? "🔥" : expired ? "⚠️" : "📅"}</span>
          <span className="countdown-date-text">
            {expired ? dateTextExpired : dateText}
          </span>
        </div>

        <div className="job-countdown-pill-wrap">
          {!hasDeadline ? (
            <span className="pill-badge pill-normal">ดูกำหนดในประกาศ</span>
          ) : expired ? (
            <span className="pill-badge pill-expired">หมดเขต</span>
          ) : days === 0 ? (
            <span className="pill-badge pill-today">ปิดรับวันนี้!</span>
          ) : urgent ? (
            <span className="pill-badge pill-urgent">เหลือ {days} วัน</span>
          ) : (
            <span className="pill-badge pill-normal">เหลือ {days} วัน</span>
          )}
        </div>
      </div>

      {/* ── Positions Body (Clean Minimalist) ── */}
      <div className="job-card-body-modern">
        {/* Salary & Quota Summary Highlight Bar */}
        <div className="job-salary-summary-bar">
          <div className="salary-highlight">
            <span className="salary-icon">💰</span>
            <span className="salary-amount">{displaySalary || "ตามระเบียบกำหนด"}</span>
          </div>
          <div className="quota-highlight">
            รวม <strong>{totalCount}</strong> อัตรา
          </div>
        </div>

        {/* Clean Minimal Positions List */}
        <div className="job-positions-clean-list">
          {job.positionList?.slice(0, 3).map((pos, i) => {
            let rowMatch = null;
            if (userEducation) {
              const edus = Array.isArray(pos.education) ? pos.education : (pos.education ? [pos.education] : []);
              let pMatchesEdu = edus.includes("ไม่จำกัดวุฒิ") || edus.includes(userEducation);
              if (pos.units && pos.units.length > 0) {
                pMatchesEdu = pos.units.some(u => {
                  const uEdus = Array.isArray(u.education) ? u.education : (u.education ? [u.education] : []);
                  return uEdus.includes("ไม่จำกัดวุฒิ") || uEdus.includes(userEducation);
                });
              }
              rowMatch = pMatchesEdu;
            }

            return (
              <div key={i} className="clean-position-item">
                <div className="clean-position-left">
                  {rowMatch !== null ? (
                    <span
                      className={`match-indicator-dot ${rowMatch ? 'matched' : 'unmatched'}`}
                      title={rowMatch ? "วุฒิตรงกับคุณ" : "วุฒิไม่ตรง"}
                    />
                  ) : (
                    <span className="clean-position-bullet">•</span>
                  )}
                  <span className="clean-position-name" title={pos.title}>
                    {pos.title}
                  </span>
                </div>
                <div className="clean-position-right">
                  <span className="clean-position-count">
                    {getPositionCount(pos)} อัตรา
                  </span>
                </div>
              </div>
            );
          })}

        </div>

        {/* More positions indicator */}
        {job.positionList?.length > 3 && (
          <div className="job-more-positions">
            +{job.positionList.length - 3} ตำแหน่งเพิ่มเติม → ดูรายละเอียด
          </div>
        )}

      </div>

      {/* ── Card Footer ── */}
      <div className="job-card-footer-modern">
        <div className="footer-meta-summary">
          {provinces.length > 0 && (
            <div className="footer-meta-item footer-meta-location" title={provinces.join(", ")}>
              <span className="footer-meta-icon">📍</span>
              <span className="footer-meta-text">
                {provinces[0]}
                {provinces.length > 1 && (
                  <span className="footer-more-count">+{provinces.length - 1}</span>
                )}
              </span>
            </div>
          )}

          <div className="footer-meta-item footer-meta-edu" title={uniqueEdus.join(", ")}>
            <span className="footer-meta-icon">🎓</span>
            <span className="footer-meta-text">
              {uniqueEdus.length > 0 ? uniqueEdus.join(", ") : "ไม่ระบุวุฒิ"}
            </span>
          </div>
        </div>

        <Link
          id={`btn-detail-${job.id}`}
          to={`/job/${job.id}`}
          className="btn-detail-modern"
        >
          <span>รายละเอียด</span>
          <span className="btn-detail-arrow">▸</span>
        </Link>
      </div>
    </div>
  );
}
