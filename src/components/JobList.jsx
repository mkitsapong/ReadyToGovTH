import { useState, useMemo, useEffect } from "react";
import JobCard from "./JobCard.jsx";
import { ExamPrepBanner } from "./ExamResources.jsx";

const CATEGORY_FILTER = {
  home:       null,
  civil:      "ข้าราชการ",
  government: "พนักงานราชการ",
  state:      "รัฐวิสาหกิจ",
};

const PAGE_HERO_MAP = {
  home:       { title: "งานราชการทุกประเภท",    subtitle: "รวบรวมประกาศรับสมัครงานภาครัฐไทยในที่เดียว อัปเดตล่าสุด" },
  civil:      { title: "ข้าราชการ",               subtitle: "ตำแหน่งข้าราชการพลเรือนและข้าราชการพิเศษ" },
  government: { title: "พนักงานราชการ",           subtitle: "ตำแหน่งพนักงานราชการทั่วไปและพนักงานราชการพิเศษ" },
  state:      { title: "รัฐวิสาหกิจ",             subtitle: "ตำแหน่งในองค์กรรัฐวิสาหกิจและหน่วยงานของรัฐ" },
};

// Helper: normalize province field — รองรับทั้ง string เก่าและ array ใหม่
function getProvinces(job) {
  if (Array.isArray(job.provinces)) return job.provinces;
  if (job.province) return [job.province];
  return [];
}

export default function JobList({
  jobs,
  books = [],
  isLoading,
  isError,
  activePage,
  selectedProvince,
  isAdmin,
  onEditJob,
  userEducation,
  onChangeUserEducation,
  onAddBook,
  onUpdateBook,
  onDeleteBook,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(6);

  const categoryFilter = CATEGORY_FILTER[activePage];
  const hero = PAGE_HERO_MAP[activePage] || PAGE_HERO_MAP.home;

  const filtered = useMemo(() => {
    let result = [...jobs];

    // Category filter
    if (categoryFilter) {
      result = result.filter((j) => j.category === categoryFilter);
    }

    // Province filter — รองรับหลายจังหวัด
    if (selectedProvince) {
      result = result.filter((j) => getProvinces(j).includes(selectedProvince));
    }

    // Education filter — แสดงเฉพาะ job ที่มีตำแหน่งตรงวุฒิ
    if (userEducation) {
      result = result.filter((j) =>
        j.positionList?.some(
          (p) => p.education === "ไม่จำกัดวุฒิ" || p.education === userEducation
        )
      );
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (j) =>
          j.department.toLowerCase().includes(q) ||
          getProvinces(j).some((p) => p.toLowerCase().includes(q)) ||
          j.positionList?.some((p) => p.title.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
    } else if (sortBy === "deadline") {
      result.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    } else if (sortBy === "positions") {
      result.sort((a, b) => b.positions - a.positions);
    }

    return result;
  }, [jobs, categoryFilter, selectedProvince, userEducation, searchQuery, sortBy]);

  // Stats
  const totalPositions = filtered.reduce(
    (sum, j) => sum + (j.positionList?.reduce((s, p) => s + (Number(p.count) || 0), 0) ?? 0),
    0
  );

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(6);
  }, [categoryFilter, selectedProvince, userEducation, searchQuery, sortBy]);

  return (
    <>
      {/* Hero */}
      <section className="page-hero">
        <div className="container hero-content" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
          {/* Left Column: Title & Stats */}
          <div style={{ flex: "1 1 450px" }}>
            <h1 className="hero-title">
              <span>{hero.title}</span>
            </h1>
            <p className="hero-subtitle">{hero.subtitle}</p>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-number">{filtered.length}</span>
                <span className="hero-stat-label">ประกาศรับสมัคร</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-number">{totalPositions}</span>
                <span className="hero-stat-label">อัตราว่างทั้งหมด</span>
              </div>
              {selectedProvince && (
                <div className="hero-stat">
                  <span className="hero-stat-number" style={{ fontSize: "1rem" }}>
                    📍 {selectedProvince}
                  </span>
                  <span className="hero-stat-label">จังหวัดที่เลือก</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Quick Edu Filter Card */}
          <div style={{
            flex: "0 1 420px",
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "var(--radius-xl)",
            padding: "20px 22px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "white", display: "flex", alignItems: "center", gap: 6 }}>
                🎓 กรองงานตามวุฒิการศึกษา
              </span>
              {userEducation && (
                <button
                  onClick={() => onChangeUserEducation(null)}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "none",
                    color: "var(--orange-300)",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "999px",
                    cursor: "pointer",
                  }}
                >
                  ✕ ล้างวุฒิ
                </button>
              )}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["ม.3", "ม.6", "ปวช.", "ปวส.", "ปริญญาตรี", "ปริญญาโท", "ปริญญาเอก"].map((edu) => {
                const isActive = userEducation === edu;
                return (
                  <button
                    key={edu}
                    onClick={() => onChangeUserEducation(isActive ? null : edu)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "999px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "var(--font-sans)",
                      transition: "all 0.2s ease",
                      background: isActive
                        ? "linear-gradient(135deg, var(--accent), var(--orange-600))"
                        : "rgba(255,255,255,0.08)",
                      color: "white",
                      border: isActive
                        ? "1px solid var(--orange-400)"
                        : "1px solid rgba(255,255,255,0.12)",
                      boxShadow: isActive ? "0 4px 12px rgba(234,88,12,0.35)" : "none",
                    }}
                  >
                    {isActive ? "✓ " : ""}{edu}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: "0.72rem", color: "var(--navy-200)", marginTop: 10, margin: "10px 0 0 0" }}>
              💡 เลือกระดับวุฒิเพื่อกรองเฉพาะตำแหน่งที่วุฒิตรงกัน
            </p>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="container">
          <div className="filter-bar-inner">
            {/* Search */}
            <div className="filter-search">
              <span className="filter-search-icon">🔍</span>
              <input
                id="job-search-input"
                type="text"
                placeholder="ค้นหาตำแหน่ง หน่วยงาน หรือจังหวัด..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Sort */}
            <select
              id="job-sort-select"
              className="filter-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ border: "1.5px solid var(--gray-200)", borderRadius: "var(--radius-md)", padding: "9px 14px", background: "var(--gray-50)", fontSize: "0.875rem", cursor: "pointer" }}
            >
              <option value="newest">ล่าสุดก่อน</option>
              <option value="deadline">ใกล้ปิดรับก่อน</option>
              <option value="positions">อัตราว่างมากก่อน</option>
            </select>

            <span className="filter-count">
              พบ <strong>{filtered.length}</strong> ตำแหน่ง
            </span>
          </div>
        </div>
      </div>

      {/* Job Grid */}
      <section className="jobs-section">
        <div className="container">
          {/* Banner แนะนำหนังสือ & คอร์สเตรียมสอบ */}
          <ExamPrepBanner
            books={books}
            isAdmin={isAdmin}
            onAddBook={onAddBook}
            onUpdateBook={onUpdateBook}
            onDeleteBook={onDeleteBook}
          />

          <div className="jobs-grid">
            {isLoading ? (
              <>
                <style>{`
                  @keyframes skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                  .skeleton-pulse { animation: skeleton-pulse 1.5s ease-in-out infinite; }
                `}</style>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="job-card" style={{ pointerEvents: "none", opacity: 0.8 }}>
                    <div style={{ height: 28, width: "60%", background: "var(--gray-200)", borderRadius: "var(--radius-sm)", marginBottom: 16 }} className="skeleton-pulse"></div>
                    <div style={{ height: 16, width: "100%", background: "var(--gray-100)", borderRadius: "var(--radius-sm)", marginBottom: 8 }} className="skeleton-pulse"></div>
                    <div style={{ height: 16, width: "80%", background: "var(--gray-100)", borderRadius: "var(--radius-sm)", marginBottom: 24 }} className="skeleton-pulse"></div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div style={{ height: 32, width: 80, background: "var(--gray-100)", borderRadius: 999 }} className="skeleton-pulse"></div>
                      <div style={{ height: 32, width: 60, background: "var(--gray-100)", borderRadius: 999 }} className="skeleton-pulse"></div>
                    </div>
                  </div>
                ))}
              </>
            ) : isError ? (
              <div className="empty-state">
                <div className="empty-state-icon" style={{ color: "#ef4444" }}>⚠️</div>
                <h3 style={{ color: "#ef4444" }}>เกิดข้อผิดพลาดในการโหลดข้อมูล</h3>
                <p>โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่อีกครั้ง</p>
                <button 
                  className="btn-primary" 
                  onClick={() => window.location.reload()} 
                  style={{ marginTop: 16, padding: "10px 24px" }}
                >
                  โหลดใหม่
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <h3>ไม่พบรายการที่ตรงกับเงื่อนไข</h3>
                <p>ลองเปลี่ยนคำค้นหาหรือเลือกจังหวัดใหม่</p>
              </div>
            ) : (
              <>
                {filtered.slice(0, visibleCount).map((job, i) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    books={books}
                    style={{ animationDelay: `${i * 0.05}s` }}
                    isAdmin={isAdmin}
                    onEdit={onEditJob}
                    userEducation={userEducation}
                  />
                ))}
              </>
            )}
          </div>

          {!isLoading && !isError && filtered.length > visibleCount && (
            <div style={{ textAlign: "center", marginTop: "3rem" }}>
              <button
                className="btn-primary"
                style={{ padding: "12px 32px", fontSize: "1rem", borderRadius: "999px", boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}
                onClick={() => setVisibleCount((prev) => prev + 6)}
              >
                แสดงเพิ่มเติม (เหลืออีก {filtered.length - visibleCount} รายการ) ↓
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
