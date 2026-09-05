import { Link } from "react-router-dom";
import { CATEGORY_MAP } from "../utils/constants.js";
import { getDisplayProvinces, daysLeft, formatDate, getTotalJobPositions } from "../utils/helpers.js";

export default function JobCard({ job, style, isAdmin, onEdit, userEducation, isBookmarked, onToggleBookmark }) {

  const categories = job.categories && job.categories.length > 0 ? job.categories : (job.category ? [job.category] : []);
  const provinces = getDisplayProvinces(job);
  const mainMeta = CATEGORY_MAP[categories[0]] || { badge: "badge-civil", icon: "📄" };
  const days = daysLeft(job.deadline);
  const urgent = days <= 7 && days >= 0;
  const expired = days < 0;
  const totalCount = getTotalJobPositions(job);

  const displayStartDate = job.startDate || job.postedDate;
  const dateText = displayStartDate 
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

  return (
    <div className="job-card" style={style}>
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

          <div className="top-bar-right">
            <button
              type="button"
              onClick={onToggleBookmark}
              title={isBookmarked ? "ยกเลิกบันทึก" : "บันทึกงานนี้"}
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
            {job.logoUrl ? (
              <img
                src={job.logoUrl}
                alt={job.department}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.style.display = 'none';
                }}
                className="job-logo-img"
              />
            ) : (
              <span className="job-logo-fallback">{mainMeta.icon}</span>
            )}
          </div>

          {/* Department Name & Badges */}
          <div className="job-dept-content">
            <h3 className="job-dept-name-title" title={job.department}>
              {job.department}
            </h3>

            {/* Badges Row (Categories only + Inline Admin Edit) */}
            <div className="job-header-badges">
              {categories.map((cat, idx) => {
                const catMeta = CATEGORY_MAP[cat] || { badge: "badge-civil" };
                return (
                  <span key={idx} className={`job-badge-pill ${catMeta.badge}`}>
                    {cat}
                  </span>
                );
              })}

              {isAdmin && (
                <button
                  type="button"
                  id={`btn-edit-${job.id}`}
                  onClick={() => onEdit(job)}
                  title="แก้ไขประกาศ"
                  className="job-btn-edit-inline"
                >
                  ✏️ แก้ไข
                </button>
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
          {expired ? (
            <span className="pill-badge pill-expired">⚠️ หมดเขต</span>
          ) : days === 0 ? (
            <span className="pill-badge pill-today">🚨 ปิดรับวันนี้!</span>
          ) : urgent ? (
            <span className="pill-badge pill-urgent">🔥 เหลือ {days} วัน</span>
          ) : (
            <span className="pill-badge pill-normal">⏳ เหลือ {days} วัน</span>
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
                    {pos.count} อัตรา
                  </span>
                </div>
              </div>
            );
          })}

        </div>

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
