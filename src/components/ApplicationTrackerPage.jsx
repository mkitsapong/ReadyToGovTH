import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import SEO from "./SEO.jsx";
import { useApplicationTracker } from "../hooks/useApplicationTracker.js";
import { STATUS_LIST, STATUS_CONFIG } from "../utils/constants.js";
import { formatDate } from "../utils/helpers.js";
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

  return (
    <div className="tracker-page">
      <SEO
        title="ติดตามการสมัครงานราชการ (Application Tracker) | ReadyToGovTH"
        description="ระบบติดตามสถานะการสมัครงานราชการ บันทึกขั้นตอน ยื่นใบสมัคร รอสอบ ประกาศผล และนับถอยหลังวันสอบ"
        url="https://readytogov.th/tracker"
      />

      {/* Hero Section */}
      <section className="page-hero tracker-hero">
        <div className="container">
          <div className="tracker-hero-inner">
            <div className="tracker-hero-text">
              <span className="hero-badge-pill">📋 Personal Career Tracker</span>
              <h1 className="hero-title">
                ติดตามการสมัคร<span>งานราชการ</span>
              </h1>
              <p className="hero-subtitle">
                บันทึกขั้นตอนการสอบ ตั้งแต่วางแผนสมัคร รอสอบ จนถึงประกาศผล
                พร้อมระบบนับถอยหลังวันสอบและเตือนในปฏิทิน
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="tracker-hero-actions">
              <Link to="/" className="btn-hero-explore">
                <span>🔍</span> ค้นหาประกาศงานเพิ่ม
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container tracker-body">
        {/* Next Exam Highlight Card */}
        {nextExam && (
          <div className={`tracker-next-exam-banner ${nextExam.daysLeft <= 5 ? "urgent" : ""}`}>
            <div className="next-exam-badge">
              <span>🎯 การสอบถัดไปของคุณ</span>
            </div>
            <div className="next-exam-content">
              <div className="next-exam-info">
                <h3 className="next-exam-dept">{nextExam.job.department}</h3>
                <p className="next-exam-meta">
                  <span>📅 วันสอบ: <strong>{formatDate(nextExam.examDate)}</strong></span>
                  {nextExam.job._tracking?.examTime && (
                    <span>⏰ เวลา: {nextExam.job._tracking.examTime}</span>
                  )}
                  {nextExam.job._tracking?.examLocation && (
                    <span>📍 สถานที่: {nextExam.job._tracking.examLocation}</span>
                  )}
                  {nextExam.job._tracking?.seatNumber && (
                    <span>🎫 เลขประจำตัวสอบ: {nextExam.job._tracking.seatNumber}</span>
                  )}
                </p>
              </div>

              <div className="next-exam-countdown-box">
                <span className="countdown-number">
                  {nextExam.daysLeft === 0 ? "วันนี้" : nextExam.daysLeft === 1 ? "1 วัน" : `${nextExam.daysLeft} วัน`}
                </span>
                <span className="countdown-label">
                  {nextExam.daysLeft === 0 ? "ถึงวันสอบแล้ว!" : "จะถึงวันสอบ"}
                </span>
              </div>
            </div>

            <div className="next-exam-actions">
              <button
                type="button"
                className="btn-next-exam-view"
                onClick={() => navigate(`/job/${nextExam.job.id}`)}
              >
                ดูรายละเอียดประกาศ ➔
              </button>
              <button
                type="button"
                className="btn-next-exam-edit"
                onClick={() => setEditingJob(nextExam.job)}
              >
                แก้ไขข้อมูลสอบ ⚙️
              </button>
            </div>
          </div>
        )}

        {/* Overview KPI Cards */}
        <div className="tracker-kpi-grid">
          <div
            className={`tracker-kpi-card ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <div className="kpi-icon">📁</div>
            <div className="kpi-val">{stats.total}</div>
            <div className="kpi-lbl">งานที่บันทึกทั้งหมด</div>
          </div>

          <div
            className={`tracker-kpi-card ${activeTab === "interested" ? "active" : ""}`}
            onClick={() => setActiveTab("interested")}
          >
            <div className="kpi-icon">📌</div>
            <div className="kpi-val">{stats.interested}</div>
            <div className="kpi-lbl">สนใจ / เล็งไว้</div>
          </div>

          <div
            className={`tracker-kpi-card ${activeTab === "applied" ? "active" : ""}`}
            onClick={() => setActiveTab("applied")}
          >
            <div className="kpi-icon">📝</div>
            <div className="kpi-val">{stats.applied}</div>
            <div className="kpi-lbl">ยื่นสมัครแล้ว</div>
          </div>

          <div
            className={`tracker-kpi-card ${activeTab === "exam" ? "active" : ""}`}
            onClick={() => setActiveTab("exam")}
          >
            <div className="kpi-icon">⏳</div>
            <div className="kpi-val">{stats.exam}</div>
            <div className="kpi-lbl">มีสิทธิ์ / รอสอบ</div>
          </div>

          <div
            className={`tracker-kpi-card ${activeTab === "result" ? "active" : ""}`}
            onClick={() => setActiveTab("result")}
          >
            <div className="kpi-icon">📢</div>
            <div className="kpi-val">{stats.result}</div>
            <div className="kpi-lbl">รอประกาศผล</div>
          </div>

          <div
            className={`tracker-kpi-card ${activeTab === "passed" ? "active" : ""}`}
            onClick={() => setActiveTab("passed")}
          >
            <div className="kpi-icon">🎉</div>
            <div className="kpi-val">{stats.passed}</div>
            <div className="kpi-lbl">ผ่านการคัดเลือก</div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="tracker-filter-row">
          {/* Status Tabs */}
          <div className="tracker-tabs-scroll">
            <button
              type="button"
              className={`tracker-tab-pill ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              ทั้งหมด ({stats.total})
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
                >
                  <span>{st.icon}</span> {st.shortLabel} ({count})
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
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Applications List */}
        {filteredList.length === 0 ? (
          <div className="tracker-empty-state">
            <span className="empty-icon">📭</span>
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
              🚀 ค้นหาตำแหน่งงานราชการที่เปิดรับ
            </Link>
          </div>
        ) : (
          <div className="tracker-cards-grid">
            {filteredList.map((job) => {
              const tracking = job._tracking || {};
              const countdown = tracking.countdown;

              return (
                <div key={job.id} className="tracker-job-card">
                  {/* Card Header */}
                  <div className="card-top-row">
                    <span className="card-category-badge">
                      {job.category || (job.categories && job.categories[0]) || "งานราชการ"}
                    </span>
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

                  {/* Title & Department */}
                  <div className="card-main-content">
                    <h3 className="card-department-name">
                      <Link to={`/job/${job.id}`}>{job.department}</Link>
                    </h3>

                    {job.positionList && job.positionList.length > 0 ? (
                      <p className="card-position-summary">
                        💼 {job.positionList.slice(0, 2).map((p) => p.title).join(", ")}
                        {job.positionList.length > 2 ? ` และอีก ${job.positionList.length - 2} ตำแหน่ง` : ""}
                      </p>
                    ) : (
                      <p className="card-position-summary">
                        👥 อัตราว่าง: {job.positions || 1} อัตรา
                      </p>
                    )}
                  </div>

                  {/* Exam Countdown or Key Dates */}
                  <div className="card-dates-box">
                    {tracking.examDate ? (
                      <div className={`card-exam-indicator ${countdown?.isUrgent ? "urgent" : ""}`}>
                        <span className="exam-icon">⏳</span>
                        <div className="exam-details">
                          <span className="exam-date-text">
                            วันสอบ: {formatDate(tracking.examDate)}
                          </span>
                          <span className="exam-countdown-pill">
                            {countdown?.text || "มีกำหนดสอบ"}
                          </span>
                        </div>
                      </div>
                    ) : job.deadline ? (
                      <div className="card-deadline-indicator">
                        <span className="deadline-icon">📅</span>
                        <span>ปิดรับสมัคร: {formatDate(job.deadline)}</span>
                      </div>
                    ) : null}

                    {tracking.seatNumber && (
                      <div className="card-meta-pill">
                        🎫 เลขที่นั่งสอบ: {tracking.seatNumber}
                      </div>
                    )}
                  </div>

                  {/* Personal Notes Snippet */}
                  {tracking.notes && (
                    <div className="card-notes-preview">
                      <span className="notes-icon">📝</span>
                      <span className="notes-text">{tracking.notes}</span>
                    </div>
                  )}

                  {/* Card Actions */}
                  <div className="card-footer-actions">
                    <Link to={`/job/${job.id}`} className="btn-card-action view">
                      ดูประกาศ
                    </Link>
                    <button
                      type="button"
                      className="btn-card-action edit"
                      onClick={() => setEditingJob(job)}
                    >
                      ✏️ ตั้งค่าสอบ/โน้ต
                    </button>
                    <button
                      type="button"
                      className="btn-card-action delete"
                      onClick={() => {
                        if (window.confirm(`ต้องการลบ "${job.department}" ออกจากรายการติดตามหรือไม่?`)) {
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

      {/* Edit Modal */}
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
                  // Refresh active editingJob
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
