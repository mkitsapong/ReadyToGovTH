import { useState, useMemo, useEffect, useRef } from "react";
import JobCard from "./JobCard.jsx";
import { ExamPrepBanner } from "./ExamResources.jsx";
import { regions } from "../data/provinces.js";

const CATEGORY_FILTER = {
  home: null,
  civil: "ข้าราชการ",
  government: "พนักงานราชการ",
  state: "รัฐวิสาหกิจ",
  temp: "ลูกจ้างชั่วคราว",
};

const PAGE_HERO_MAP = {
  home: { title: "งานราชการทุกประเภท", subtitle: "รวบรวมประกาศรับสมัครงานภาครัฐไทยในที่เดียว อัปเดตล่าสุด" },
  civil: { title: "ข้าราชการ", subtitle: "ตำแหน่งข้าราชการพลเรือนและข้าราชการพิเศษ" },
  government: { title: "พนักงานราชการ", subtitle: "ตำแหน่งพนักงานราชการทั่วไปและพนักงานราชการพิเศษ" },
  state: { title: "รัฐวิสาหกิจ", subtitle: "ตำแหน่งในองค์กรรัฐวิสาหกิจและหน่วยงานของรัฐ" },
  temp: { title: "ลูกจ้างชั่วคราว", subtitle: "ตำแหน่งลูกจ้างชั่วคราวและพนักงานจ้างเหมาบริการ" },
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
  onSelectProvince,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("deadline");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const regionDropdownRef = useRef(null);
  const ITEMS_PER_PAGE = 9;

  useEffect(() => {
    function handleClickOutside(e) {
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(e.target)) {
        setIsRegionDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categoryFilter = CATEGORY_FILTER[activePage];
  const hero = PAGE_HERO_MAP[activePage] || PAGE_HERO_MAP.home;

  const filtered = useMemo(() => {
    let result = [...jobs];

    // Category filter
    if (categoryFilter) {
      result = result.filter((j) => {
        const cats = j.categories && j.categories.length > 0 ? j.categories : (j.category ? [j.category] : []);
        return cats.includes(categoryFilter);
      });
    }

    // Province / Region filter
    if (selectedProvince) {
      const regionMatch = regions.find((r) => r.name === selectedProvince);
      if (regionMatch) {
        result = result.filter((j) => {
          const jobProvinces = getProvinces(j);
          return jobProvinces.some((p) => regionMatch.provinces.includes(p) || p === "ทุกจังหวัด" || p === "ทั่วประเทศ");
        });
      } else {
        result = result.filter((j) => {
          const jobProvinces = getProvinces(j);
          return jobProvinces.includes(selectedProvince) || jobProvinces.includes("ทุกจังหวัด") || jobProvinces.includes("ทั่วประเทศ");
        });
      }
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, selectedProvince, userEducation, searchQuery, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentJobs = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      {/* Hero */}
      <section className="page-hero">
        <div className="container hero-content" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
          {/* Left Column: Title & Stats */}
          <div style={{ flex: "1 1 300px", minWidth: "280px" }}>
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
            flex: "1 1 320px",
            minWidth: "280px",
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
            {/* Region Dropdown */}
            <div className="custom-region-dropdown" ref={regionDropdownRef} style={{ position: "relative" }}>
              <button
                className="filter-sort"
                onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                style={{
                  border: "1.5px solid var(--gray-200)",
                  borderRadius: "var(--radius-md)",
                  padding: "9px 14px",
                  background: "var(--gray-50)",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  minWidth: "160px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: "var(--navy-900)",
                  fontWeight: 500,
                  height: "100%"
                }}
              >
                <span>{selectedProvince ? `📍 ${selectedProvince}` : "📍 ทุกภูมิภาค"}</span>
                <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>▼</span>
              </button>

              {isRegionDropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: "8px",
                  background: "var(--white)",
                  border: "1px solid var(--gray-200)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  width: "280px",
                  maxHeight: "350px",
                  overflowY: "auto",
                  zIndex: 100,
                  padding: "8px 0"
                }}>
                  <div
                    onClick={() => { onSelectProvince(null); setIsRegionDropdownOpen(false); }}
                    style={{
                      padding: "10px 16px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: !selectedProvince ? 600 : 400,
                      color: !selectedProvince ? "var(--accent)" : "var(--navy-900)",
                      background: !selectedProvince ? "var(--gray-50)" : "transparent",
                      borderBottom: "1px solid var(--gray-100)"
                    }}
                  >
                    📍 ทุกภูมิภาค
                  </div>
                  
                  {regions.map(r => (
                    <div key={r.id}>
                      <div 
                        onClick={() => { onSelectProvince(r.name); setIsRegionDropdownOpen(false); }}
                        style={{
                          padding: "10px 16px",
                          fontSize: "0.85rem",
                          fontWeight: selectedProvince === r.name ? 700 : 600,
                          color: selectedProvince === r.name ? "var(--accent)" : "var(--navy-800)",
                          background: selectedProvince === r.name ? "rgba(234, 88, 12, 0.08)" : "var(--gray-50)",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "4px",
                          borderTop: "1px solid var(--gray-100)",
                          borderBottom: "1px solid var(--gray-100)"
                        }}
                      >
                        <span>📍 {r.name} (ทั้งหมด)</span>
                        {selectedProvince === r.name && <span style={{ fontSize: "0.8rem" }}>✓</span>}
                      </div>
                      {r.provinces.map(p => {
                        const isSelected = selectedProvince === p;
                        return (
                          <div
                            key={p}
                            onClick={() => { onSelectProvince(p); setIsRegionDropdownOpen(false); }}
                            style={{
                              padding: "8px 16px 8px 24px",
                              cursor: "pointer",
                              fontSize: "0.875rem",
                              color: isSelected ? "var(--accent)" : "var(--navy-700)",
                              fontWeight: isSelected ? 600 : 400,
                              background: isSelected ? "rgba(234, 88, 12, 0.05)" : "transparent",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between"
                            }}
                          >
                            <span>{p}</span>
                            {isSelected && <span style={{ fontSize: "0.75rem" }}>✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Search */}
            <div className="filter-search" style={{ position: "relative", flex: 1 }}>
              <span className="filter-search-icon">🔍</span>
              <input
                id="job-search-input"
                type="text"
                placeholder="ค้นหาตำแหน่ง หน่วยงาน หรือจังหวัด..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", paddingRight: searchQuery ? "32px" : "16px" }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "var(--gray-400)",
                    cursor: "pointer",
                    fontSize: "1rem",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "var(--gray-600)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--gray-400)"}
                  title="ล้างคำค้นหา"
                >
                  ✕
                </button>
              )}
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
                {currentJobs.map((job, i) => (
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

          {/* Pagination Controls */}
          {!isLoading && !isError && totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: "3rem" }}>
              <button
                onClick={() => {
                  setCurrentPage(p => Math.max(1, p - 1));
                  window.scrollTo({ top: document.querySelector('.jobs-section').offsetTop - 140, behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
                style={{ padding: "8px 16px", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-md)", background: currentPage === 1 ? "var(--gray-50)" : "white", cursor: currentPage === 1 ? "not-allowed" : "pointer", color: currentPage === 1 ? "var(--gray-400)" : "var(--navy-600)", fontWeight: 600 }}
              >
                ก่อนหน้า
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                // Show first, last, current, and one adjacent
                if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        setCurrentPage(p);
                        window.scrollTo({ top: document.querySelector('.jobs-section').offsetTop - 140, behavior: 'smooth' });
                      }}
                      style={{
                        width: 40, height: 40,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: "var(--radius-md)",
                        border: p === currentPage ? "none" : "1px solid var(--gray-200)",
                        background: p === currentPage ? "linear-gradient(135deg, var(--navy-600), var(--navy-800))" : "white",
                        color: p === currentPage ? "white" : "var(--navy-600)",
                        fontWeight: p === currentPage ? 700 : 500,
                        cursor: "pointer",
                        boxShadow: p === currentPage ? "0 4px 12px rgba(13,31,60,0.2)" : "none"
                      }}
                    >
                      {p}
                    </button>
                  );
                } else if (p === currentPage - 2 || p === currentPage + 2) {
                  return <span key={`dots-${p}`} style={{ padding: "0 4px", color: "var(--gray-400)" }}>...</span>;
                }
                return null;
              })}

              <button
                onClick={() => {
                  setCurrentPage(p => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: document.querySelector('.jobs-section').offsetTop - 140, behavior: 'smooth' });
                }}
                disabled={currentPage === totalPages}
                style={{ padding: "8px 16px", border: "1px solid var(--gray-200)", borderRadius: "var(--radius-md)", background: currentPage === totalPages ? "var(--gray-50)" : "white", cursor: currentPage === totalPages ? "not-allowed" : "pointer", color: currentPage === totalPages ? "var(--gray-400)" : "var(--navy-600)", fontWeight: 600 }}
              >
                ถัดไป
              </button>
            </div>
          )}

          {/* Banner แนะนำหนังสือ & คอร์สเตรียมสอบ */}
          <div style={{ marginTop: 40 }}>
            <ExamPrepBanner
              books={books}
              isAdmin={isAdmin}
              onAddBook={onAddBook}
              onUpdateBook={onUpdateBook}
              onDeleteBook={onDeleteBook}
            />
          </div>
        </div>
      </section>
    </>
  );
}
