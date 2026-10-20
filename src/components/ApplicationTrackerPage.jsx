import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import SEO from "./SEO.jsx";
import { useApplicationTracker } from "../hooks/useApplicationTracker.js";
import { STATUS_LIST, STATUS_CONFIG, CATEGORY_MAP } from "../utils/constants.js";
import {
  formatDate,
  daysLeft,
  getTotalJobPositions,
  getDisplayProvinces,
} from "../utils/helpers.js";
import ApplicationTrackerBadge from "./ApplicationTrackerBadge.jsx";
import ApplicationTrackerPanel from "./ApplicationTrackerPanel.jsx";
import "./ApplicationTracker.css";

export default function ApplicationTrackerPage({ jobs = [], onToast }) {
  const navigate = useNavigate();
  const {
    trackedJobsList,
    updateJobTracking,
    removeJobTracking,
    stats,
  } = useApplicationTracker(jobs);

  const [activeTab, setActiveTab] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [editingJob, setEditingJob] = useState(null);
  const [logoErrors, setLogoErrors] = useState({});

  // Filter jobs based on active tab and search query
  const filteredList = useMemo(() => {
    let list = [...trackedJobsList];

    if (activeTab !== "all") {
      list = list.filter((j) => (j._tracking?.status || "interested") === activeTab);
    }

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      list = list.filter((j) => {
        const dept = (j.department || "").toLowerCase();
        const cat = (j.category || "").toLowerCase();
        const pos = (j.positionList || []).map((p) => p.title).join(" ").toLowerCase();
        const notes = (j._tracking?.notes || "").toLowerCase();
        return dept.includes(q) || cat.includes(q) || pos.includes(q) || notes.includes(q);
      });
    }

    // Sort: items with upcoming exams first, then by deadline/updatedAt
    list.sort((a, b) => {
      const dateA = a._tracking?.examDate ? new Date(a._tracking.examDate).getTime() : Infinity;
      const dateB = b._tracking?.examDate ? new Date(b._tracking.examDate).getTime() : Infinity;
      if (dateA !== dateB) return dateA - dateB;
      const upA = a._tracking?.updatedAt ? new Date(a._tracking.updatedAt).getTime() : 0;
      const upB = b._tracking?.updatedAt ? new Date(b._tracking.updatedAt).getTime() : 0;
      return upB - upA;
    });

    return list;
  }, [trackedJobsList, activeTab, searchFilter]);

  const nextExam = stats.nextExam;

  // KPI metadata with custom gradient styling and badges
  const KPI_CARDS = [
    {
      id: "all",
      label: "งานที่บันทึกทั้งหมด",
      icon: "📁",
      count: stats.total,
      color: "#4f46e5",
      accentBg: "rgba(79, 70, 229, 0.12)",
      gradient: "linear-gradient(135deg, #4f46e5, #6366f1)",
    },
    {
      id: "interested",
      label: "สนใจ / เล็งไว้",
      icon: "📌",
      count: stats.interested,
      color: "#6366f1",
      accentBg: "rgba(99, 102, 241, 0.12)",
      gradient: "linear-gradient(135deg, #6366f1, #818cf8)",
    },
    {
      id: "applied",
      label: "ยื่นสมัครแล้ว",
      icon: "📝",
      count: stats.applied,
      color: "#0284c7",
      accentBg: "rgba(2, 132, 199, 0.12)",
      gradient: "linear-gradient(135deg, #0284c7, #38bdf8)",
    },
    {
      id: "exam",
      label: "มีสิทธิ์ / รอสอบ",
      icon: "⏳",
      count: stats.exam,
      color: "#d97706",
      accentBg: "rgba(217, 119, 6, 0.12)",
      gradient: "linear-gradient(135deg, #d97706, #fbbf24)",
    },
    {
      id: "result",
      label: "รอประกาศผล",
      icon: "📢",
      count: stats.result,
      color: "#7c3aed",
      accentBg: "rgba(124, 58, 237, 0.12)",
      gradient: "linear-gradient(135deg, #7c3aed, #a855f7)",
    },
    {
      id: "passed",
      label: "ผ่านการคัดเลือก",
      icon: "🎉",
      count: stats.passed,
      color: "#16a34a",
      accentBg: "rgba(22, 163, 74, 0.12)",
      gradient: "linear-gradient(135deg, #16a34a, #4ade80)",
    },
  ];

  return (
    <div className="tracker-page">
      <SEO
        title="ติดตามการสมัครงานราชการ (Application Tracker) | ReadyToGovTH"
        description="ระบบติดตามสถานะการสมัครงานราชการ บันทึกขั้นตอน ยื่นใบสมัคร รอสอบ ประกาศผล และนับถอยหลังวันสอบ"
        url="https://readytogov.th/tracker"
      />

      {/* Hero Section (Unified Full-Width) */}
      <section className="page-hero tracker-hero">
        <div className="hero-glow-1" />
        <div className="hero-glow-2" />
        <div className="container">
          {/* Top Breadcrumb & Private Data Chip */}
          <div className="hero-top-nav">
            <Link to="/" className="hero-back-btn" title="กลับสู่หน้ารายการประกาศงาน">
              <span className="hero-back-arrow">←</span>
              <span>กลับสู่หน้ารายการประกาศงาน</span>
            </Link>
            <div className="hero-top-badges">
              <span className="hero-micro-chip">
                <span className="hero-live-dot" />
                ระบบติดตามส่วนตัว
              </span>
              <span className="hero-micro-chip">
                🔒 ข้อมูลบันทึกในเครื่องคุณ (Local & Private)
              </span>
            </div>
          </div>

          <div className="hero-inner">
            <div className="hero-text-col">
              <div className="hero-badge-pill">
                <span className="badge-sparkle">✨</span>
                <span>Personal Career Tracker</span>
              </div>
              <h1 className="hero-title">
                ติดตามการสมัคร<span>งานราชการ</span>
              </h1>
              <p className="hero-subtitle">
                บันทึกขั้นตอนการสอบ ตั้งแต่วางแผนสมัคร รอสอบ จนถึงประกาศผล
                พร้อมระบบนับถอยหลังวันสอบและเตือนในปฏิทินส่วนตัว
              </p>

              {/* Hero Stats Mini Chips */}
              <div className="hero-stats-chips">
                <div className="hero-stats-chip">
                  <span className="chip-label">งานที่บันทึก:</span>
                  <strong className="chip-val">{stats.total} งาน</strong>
                </div>
                <div className="hero-stats-chip">
                  <span className="chip-label">รอสอบ / นัดหมาย:</span>
                  <strong className="chip-val" style={{ color: "#fbbf24" }}>{stats.exam} งาน</strong>
                </div>
                <div className="hero-stats-chip">
                  <span className="chip-label">ผ่านการคัดเลือก:</span>
                  <strong className="chip-val" style={{ color: "#4ade80" }}>{stats.passed} งาน</strong>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="hero-actions-col">
              <Link to="/" className="hero-btn-action hero-btn-primary">
                <span className="btn-icon">🔍</span>
                <span>ค้นหาประกาศงานเพิ่ม</span>
                <span className="hero-btn-arrow">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container tracker-body">
        {/* Next Exam Highlight Card */}
        {nextExam && (
          <div className={`tracker-next-exam-banner ${nextExam.daysLeft <= 5 ? "urgent" : ""}`}>
            <div className="next-exam-glow" />
            <div className="next-exam-top-row">
              <div className="next-exam-badge">
                <span className="badge-pulse-dot" />
                <span>🎯 การสอบถัดไปของคุณ</span>
              </div>
              <span className="next-exam-category-pill">
                {nextExam.job.category || "งานราชการ"}
              </span>
            </div>

            <div className="next-exam-content">
              <div className="next-exam-info">
                <h3 className="next-exam-dept">{nextExam.job.department}</h3>
                <div className="next-exam-meta-grid">
                  <div className="meta-item">
                    <span className="meta-icon">📅</span>
                    <div>
                      <div className="meta-lbl">วันสอบ</div>
                      <div className="meta-val">{formatDate(nextExam.examDate)}</div>
                    </div>
                  </div>
                  {nextExam.job._tracking?.examTime && (
                    <div className="meta-item">
                      <span className="meta-icon">⏰</span>
                      <div>
                        <div className="meta-lbl">เวลาสอบ</div>
                        <div className="meta-val">{nextExam.job._tracking.examTime}</div>
                      </div>
                    </div>
                  )}
                  {nextExam.job._tracking?.examLocation && (
                    <div className="meta-item location-meta">
                      <span className="meta-icon">📍</span>
                      <div>
                        <div className="meta-lbl">สถานที่สอบ</div>
                        <div className="meta-val">{nextExam.job._tracking.examLocation}</div>
                      </div>
                    </div>
                  )}
                  {nextExam.job._tracking?.seatNumber && (
                    <div className="meta-item">
                      <span className="meta-icon">🎫</span>
                      <div>
                        <div className="meta-lbl">เลขประจำตัวสอบ</div>
                        <div className="meta-val">{nextExam.job._tracking.seatNumber}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Countdown Dial Box */}
              <div className="next-exam-countdown-box">
                <div className="countdown-ring">
                  <span className="countdown-number">
                    {nextExam.daysLeft === 0 ? "วันนี้" : nextExam.daysLeft === 1 ? "1" : nextExam.daysLeft}
                  </span>
                  <span className="countdown-unit">
                    {nextExam.daysLeft === 0 ? "วันสอบ!" : nextExam.daysLeft === 1 ? "วันสอบ" : "วัน"}
                  </span>
                </div>
                <span className="countdown-label">
                  {nextExam.daysLeft === 0 ? "🎯 ขอให้โชคดีกับการสอบ!" : "จะถึงวันสอบ"}
                </span>
              </div>
            </div>

            <div className="next-exam-actions">
              <button
                type="button"
                className="btn-next-exam-view"
                onClick={() => navigate(`/job/${nextExam.job.id}`)}
              >
                ดูรายละเอียดประกาศ <span>➔</span>
              </button>
              <button
                type="button"
                className="btn-next-exam-edit"
                onClick={() => setEditingJob(nextExam.job)}
              >
                ⚙️ ตั้งค่าข้อมูลสอบ / โน้ต
              </button>
            </div>
          </div>
        )}

        {/* Overview KPI Cards */}
        <div className="tracker-kpi-grid">
          {KPI_CARDS.map((card) => {
            const isActive = activeTab === card.id;
            return (
              <div
                key={card.id}
                role="button"
                tabIndex={0}
                className={`tracker-kpi-card ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(card.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab(card.id);
                  }
                }}
                style={{
                  "--card-accent": card.color,
                  "--card-accent-bg": card.accentBg,
                }}
              >
                <div className="kpi-top-row">
                  <div
                    className="kpi-icon-squircle"
                    style={{ background: card.accentBg, color: card.color }}
                  >
                    <span>{card.icon}</span>
                  </div>
                  {isActive ? (
                    <span className="kpi-active-pill">
                      <span className="kpi-active-ping" />
                      เลือกอยู่
                    </span>
                  ) : (
                    <span className="kpi-hover-hint">คลิกดู</span>
                  )}
                </div>

                <div className="kpi-val" style={{ color: card.color }}>
                  {card.count}
                </div>
                <div className="kpi-lbl">{card.label}</div>
              </div>
            );
          })}
        </div>

        {/* Filter Controls Row (Glassmorphic Bar) */}
        <div className="tracker-filter-row">
          {/* Status Tabs */}
          <div className="tracker-tabs-scroll">
            <button
              type="button"
              className={`tracker-tab-pill ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              <span className="tab-icon">📁</span>
              <span>ทั้งหมด</span>
              <span className="tab-counter-badge">{stats.total}</span>
            </button>
            {STATUS_LIST.map((st) => {
              const count =
                st.id === "interested"
                  ? stats.interested
                  : st.id === "applied"
                  ? stats.applied
                  : st.id === "exam"
                  ? stats.exam
                  : st.id === "result"
                  ? stats.result
                  : st.id === "passed"
                  ? stats.passed
                  : stats.failed;

              return (
                <button
                  key={st.id}
                  type="button"
                  className={`tracker-tab-pill ${activeTab === st.id ? "active" : ""}`}
                  onClick={() => setActiveTab(st.id)}
                  style={{
                    "--tab-color": st.color,
                    "--tab-bg": st.bg,
                  }}
                >
                  <span className="tab-icon">{st.icon}</span>
                  <span>{st.shortLabel}</span>
                  <span className="tab-counter-badge">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Search within tracked jobs */}
          <div className="tracker-search-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="ค้นหาในรายการที่บันทึก..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="tracker-search-input"
            />
            {searchFilter && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchFilter("")}
                title="ล้างคำค้นหา"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Applications List */}
        {filteredList.length === 0 ? (
          <div className="tracker-empty-state">
            <div className="empty-icon-glow">
              <span className="empty-icon">📭</span>
            </div>
            <h3 className="empty-title">
              {searchFilter
                ? `ไม่พบงานที่ตรงกับคำค้นหา "${searchFilter}"`
                : activeTab !== "all"
                ? `ยังไม่มีงานในสถานะ "${STATUS_CONFIG[activeTab]?.label || activeTab}"`
                : "ยังไม่มีงานราชการที่คุณบันทึกไว้"}
            </h3>
            <p className="empty-subtitle">
              เมื่อคุณกดปุ่ม ❤️ บนประกาศงาน ระบบจะบันทึกเข้ามาในหน้านี้โดยอัตโนมัติ
              เพื่อให้คุณติดตามสถานะการสมัครและนับถอยหลังวันสอบได้สะดวก
            </p>
            <Link to="/" className="btn-empty-explore">
              <span>🚀</span> ค้นหาตำแหน่งงานราชการที่เปิดรับ
            </Link>
          </div>
        ) : (
          <div className="tracker-cards-grid">
            {filteredList.map((job) => {
              const tracking = job._tracking || {};
              const countdown = tracking.countdown;
              const categories = job.categories?.length > 0 ? job.categories : (job.category ? [job.category] : ["งานราชการ"]);
              const mainMeta = CATEGORY_MAP[categories[0]] || { badge: "badge-civil", icon: "🏛️" };
              const provinces = getDisplayProvinces(job);
              const totalCount = getTotalJobPositions(job);
              const hasDeadline = Boolean(job.deadline) && !isNaN(new Date(job.deadline).getTime());
              const deadlineDays = hasDeadline ? daysLeft(job.deadline) : null;
              const isDeadlineUrgent = hasDeadline && deadlineDays <= 5 && deadlineDays >= 0;
              const isDeadlineExpired = hasDeadline && deadlineDays < 0;

              return (
                <div key={job.id} className="tracker-job-card">
                  {/* Card Header Row: Logo + Department + Badges */}
                  <div className="card-header-row">
                    <div className="card-logo-box">
                      {job.logoUrl && !logoErrors[job.id] ? (
                        <img
                          src={job.logoUrl}
                          alt={job.department}
                          loading="lazy"
                          onError={() =>
                            setLogoErrors((prev) => ({ ...prev, [job.id]: true }))
                          }
                          className="card-logo-img"
                        />
                      ) : (
                        <span className="card-logo-fallback">{mainMeta.icon}</span>
                      )}
                    </div>

                    <div className="card-dept-wrap">
                      <div className="card-badges-subrow">
                        <span className={`card-cat-badge ${mainMeta.badge}`}>
                          {categories[0]}
                        </span>
                        {job.isNoOCSC && (
                          <span className="card-ocsc-badge">✨ ไม่ต้องผ่าน ภาค ก</span>
                        )}
                      </div>
                      <h3 className="card-department-name">
                        <Link to={`/job/${job.id}`}>{job.department}</Link>
                      </h3>
                    </div>

                    <div className="card-status-wrapper">
                      <ApplicationTrackerBadge
                        tracking={tracking}
                        onStatusChange={(newStatus) => {
                          updateJobTracking(job.id, { status: newStatus }, job);
                          if (onToast) {
                            onToast(`เปลี่ยนสถานะเป็น "${STATUS_CONFIG[newStatus]?.label}" แล้ว`, "success");
                          }
                        }}
                        onOpenDetails={() => setEditingJob(job)}
                      />
                    </div>
                  </div>

                  {/* Positions & Quota Summary */}
                  <div className="card-positions-box">
                    {job.positionList && job.positionList.length > 0 ? (
                      <div className="card-position-text">
                        <span className="pos-icon">💼</span>
                        <span className="pos-list-titles">
                          {job.positionList.slice(0, 2).map((p) => p.title).join(", ")}
                          {job.positionList.length > 2 && (
                            <span className="pos-more-count">
                              {" "}+{job.positionList.length - 2} ตำแหน่ง
                            </span>
                          )}
                        </span>
                      </div>
                    ) : (
                      <div className="card-position-text">
                        <span className="pos-icon">👥</span>
                        <span>รวม {totalCount || 1} อัตรา</span>
                      </div>
                    )}

                    <div className="card-sub-pills">
                      <span className="sub-pill quota">
                        👥 รวม {totalCount} อัตรา
                      </span>
                      {provinces.length > 0 && (
                        <span className="sub-pill location">
                          📍 {provinces[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Exam Countdown or Application Deadline Highlight */}
                  <div className="card-status-info-box">
                    {tracking.examDate ? (
                      <div className={`exam-highlight-strip ${countdown?.isUrgent ? "urgent" : ""}`}>
                        <div className="strip-left">
                          <span className="strip-icon">
                            {countdown?.isToday ? "🔥" : "⏳"}
                          </span>
                          <div>
                            <div className="strip-title">วันสอบ: {formatDate(tracking.examDate)}</div>
                            {tracking.examLocation && (
                              <div className="strip-subtext">📍 {tracking.examLocation}</div>
                            )}
                          </div>
                        </div>
                        <div className="strip-countdown-badge">
                          {countdown?.text || "มีกำหนดสอบ"}
                        </div>
                      </div>
                    ) : hasDeadline ? (
                      <div className={`deadline-strip ${isDeadlineUrgent ? "urgent" : isDeadlineExpired ? "closed" : ""}`}>
                        <span className="strip-icon">
                          {isDeadlineExpired ? "⚠️" : isDeadlineUrgent ? "🔥" : "📅"}
                        </span>
                        <div className="strip-text">
                          {isDeadlineExpired ? (
                            <span>ปิดรับสมัครแล้วเมื่อ {formatDate(job.deadline)}</span>
                          ) : (
                            <span>
                              ปิดรับสมัคร: <strong>{formatDate(job.deadline)}</strong>
                              {deadlineDays !== null && ` (${deadlineDays === 0 ? "ปิดรับวันนี้!" : `เหลืออีก ${deadlineDays} วัน`})`}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {tracking.seatNumber && (
                      <div className="seat-number-chip">
                        🎫 เลขประจำตัวสอบ: <strong>{tracking.seatNumber}</strong>
                      </div>
                    )}
                  </div>

                  {/* Personal Notes Box (If exists) */}
                  {tracking.notes && (
                    <div className="card-notes-box">
                      <span className="notes-pin">📌</span>
                      <div className="notes-content">
                        <div className="notes-label">โน้ตส่วนตัว:</div>
                        <div className="notes-body">{tracking.notes}</div>
                      </div>
                    </div>
                  )}

                  {/* Card Actions Footer */}
                  <div className="card-footer-actions">
                    <Link to={`/job/${job.id}`} className="btn-card-action view">
                      <span>ดูประกาศ</span>
                      <span className="arrow-icon">▸</span>
                    </Link>
                    <button
                      type="button"
                      className="btn-card-action edit"
                      onClick={() => setEditingJob(job)}
                      title="ตั้งค่าสถานะ, ใส่วันสอบ, หรือจดโน้ต"
                    >
                      <span>⚙️</span>
                      <span>ตั้งค่าสอบ/โน้ต</span>
                    </button>
                    <button
                      type="button"
                      className="btn-card-action delete"
                      onClick={() => {
                        if (
                          window.confirm(
                            `ต้องการนำ "${job.department}" ออกจากรายการติดตามหรือไม่?`
                          )
                        ) {
                          removeJobTracking(job.id);
                          if (onToast) onToast("ลบออกจากรายการติดตามแล้ว", "info");
                        }
                      }}
                      title="ลบออกจากรายการติดตาม"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal Dialog */}
      {editingJob && (
        <div className="tracker-modal-backdrop" onClick={() => setEditingJob(null)}>
          <div
            className="tracker-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tracker-modal-header">
              <div className="modal-title-wrap">
                <span className="modal-icon">⚙️</span>
                <div>
                  <h3 className="modal-title">ตั้งค่าการสมัคร & วันสอบ</h3>
                  <p className="modal-dept">{editingJob.department}</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setEditingJob(null)}
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>

            <div className="tracker-modal-body">
              <ApplicationTrackerPanel
                job={editingJob}
                tracking={editingJob._tracking}
                onUpdateTracking={(updates) => {
                  updateJobTracking(editingJob.id, updates, editingJob);
                  setEditingJob({
                    ...editingJob,
                    _tracking: { ...editingJob._tracking, ...updates },
                  });
                }}
                onToast={onToast}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
