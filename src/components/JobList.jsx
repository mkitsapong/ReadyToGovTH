import { useState, useMemo, useEffect, useRef } from "react";
import JobCard from "./JobCard.jsx";
import { useBookmarks } from "../hooks/useBookmarks.js";
import { ExamPrepBanner } from "./ExamResources.jsx";
import { regions } from "../data/provinces.js";
import { getProvinces, getTotalJobPositions } from "../utils/helpers.js";
import { JobCardSkeleton } from "./LoadingSkeleton.jsx";

const CATEGORY_FILTER = {
  home: null,
  civil: "ข้าราชการ",
  government: "พนักงานราชการ",
  state: "รัฐวิสาหกิจ",
  temp: "ลูกจ้างชั่วคราว",
  agency: "พนักงานหน่วยงานของรัฐ",
};

const PAGE_HERO_MAP = {
  home: { title: "งานราชการทุกประเภท", subtitle: "รวบรวมประกาศรับสมัครงานภาครัฐไทยในที่เดียว อัปเดตล่าสุด" },
  civil: { title: "ข้าราชการ", subtitle: "ตำแหน่งข้าราชการพลเรือนและข้าราชการพิเศษ" },
  government: { title: "พนักงานราชการ", subtitle: "ตำแหน่งพนักงานราชการทั่วไปและพนักงานราชการพิเศษ" },
  state: { title: "รัฐวิสาหกิจ", subtitle: "ตำแหน่งในองค์กรรัฐวิสาหกิจ" },
  temp: { title: "ลูกจ้างชั่วคราว", subtitle: "ตำแหน่งลูกจ้างชั่วคราวและพนักงานจ้างเหมาบริการ" },
  agency: { title: "พนักงานหน่วยงานของรัฐ", subtitle: "ตำแหน่งในหน่วยงานของรัฐ กองทุน มหาวิทยาลัย และองค์การมหาชน" },
};


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
  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem("searchQuery") || "");
  const [sortBy, setSortBy] = useState(() => sessionStorage.getItem("sortBy") || "deadline");
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem("currentPage");
    return saved ? parseInt(saved, 10) : 1;
  });
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(() => sessionStorage.getItem("showBookmarksOnly") === "true");
  const [filterNoOCSC, setFilterNoOCSC] = useState(() => sessionStorage.getItem("filterNoOCSC") === "true");
  const [filterOCSC, setFilterOCSC] = useState(() => sessionStorage.getItem("filterOCSC") === "true");
  const [provinceSearchQuery, setProvinceSearchQuery] = useState("");

  useEffect(() => {
    sessionStorage.setItem("searchQuery", searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    sessionStorage.setItem("sortBy", sortBy);
  }, [sortBy]);

  useEffect(() => {
    sessionStorage.setItem("currentPage", currentPage);
  }, [currentPage]);

  useEffect(() => {
    sessionStorage.setItem("showBookmarksOnly", showBookmarksOnly);
  }, [showBookmarksOnly]);
  
  useEffect(() => {
    sessionStorage.setItem("filterNoOCSC", filterNoOCSC);
  }, [filterNoOCSC]);

  useEffect(() => {
    sessionStorage.setItem("filterOCSC", filterOCSC);
  }, [filterOCSC]);
  
  const { bookmarks = [], toggleBookmark, isBookmarked } = useBookmarks();

  // Count only bookmarks that correspond to real jobs currently available
  const validBookmarkCount = useMemo(() => {
    if (!jobs || jobs.length === 0) return 0;
    return jobs.filter((j) => isBookmarked(j.id)).length;
  }, [jobs, isBookmarked]);

  // Automatically prune ghost or deleted job IDs from localStorage
  useEffect(() => {
    if (jobs && jobs.length > 0 && bookmarks.length > 0) {
      const activeJobIds = new Set(jobs.map((j) => String(j.id)));
      const hasOrphans = bookmarks.some((id) => !activeJobIds.has(String(id)));
      if (hasOrphans) {
        const cleaned = bookmarks.filter((id) => activeJobIds.has(String(id)));
        try {
          localStorage.setItem("readytogov_bookmarks", JSON.stringify(cleaned));
          window.dispatchEvent(new CustomEvent("readytogov_bookmarks_updated"));
        } catch (e) {
          console.error("Error pruning ghost bookmarks", e);
        }
      }
    }
  }, [jobs, bookmarks]);
  const regionDropdownRef = useRef(null);
  const ITEMS_PER_PAGE = 9;

  const closeRegionDropdown = () => {
    setIsRegionDropdownOpen(false);
    setProvinceSearchQuery("");
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(e.target)) {
        closeRegionDropdown();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredRegions = provinceSearchQuery.trim()
    ? regions.map(r => {
        const q = provinceSearchQuery.trim().toLowerCase();
        const pMatch = r.provinces.filter(p => p.toLowerCase().includes(q));
        const rMatch = r.name.toLowerCase().includes(q);
        if (rMatch) return r;
        if (pMatch.length > 0) return { ...r, provinces: pMatch };
        return null;
      }).filter(Boolean)
    : regions;

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
    
    // Bookmarks Filter
    if (showBookmarksOnly) {
      result = result.filter((j) => isBookmarked(j.id));
    }

    // Quick Filters
    if (filterNoOCSC) {
      result = result.filter((j) => j.isNoOCSC);
    }
    if (filterOCSC) {
      result = result.filter((j) => j.isOCSC);
    }

    // Province / Region filter
    if (selectedProvince) {
      const regionMatch = regions.find((r) => r.name === selectedProvince);
      if (regionMatch) {
        result = result.filter((j) => {
          const jobProvinces = getProvinces(j);
          return jobProvinces.includes(regionMatch.name) || jobProvinces.some((p) => regionMatch.provinces.includes(p) || p === "ทุกจังหวัด" || p === "ทั่วประเทศ");
        });
      } else {
        result = result.filter((j) => {
          const jobProvinces = getProvinces(j);
          return jobProvinces.includes(selectedProvince) || jobProvinces.includes("ทุกจังหวัด") || jobProvinces.includes("ทั่วประเทศ");
        });
      }
    }

    // Deep filter for Education and Search Query
    if (userEducation || searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      
      result = result.reduce((acc, j) => {
        // Check if the agency/department itself matches the query or if provinces match
        const agencyMatchesQuery = q && (
          j.department.toLowerCase().includes(q) || 
          getProvinces(j).some((p) => p.toLowerCase().includes(q))
        );

        // Filter positions and their units based on education and search query
        const filteredPositions = [];
        let hasAnyEduMatch = false; // To track if this job passes the userEducation filter

        for (const p of (j.positionList || [])) {
          // 1. Check if this position matches userEducation (for the Job-level filter)
          const pEdus = Array.isArray(p.education) ? p.education : (p.education ? [p.education] : []);
          let pMatchesEdu = !userEducation || pEdus.includes("ไม่จำกัดวุฒิ") || pEdus.includes(userEducation);

          if (p.units && p.units.length > 0) {
            const anyUnitMatches = p.units.some(u => {
              const uEdus = Array.isArray(u.education) ? u.education : (u.education ? [u.education] : []);
              return !userEducation || uEdus.includes("ไม่จำกัดวุฒิ") || uEdus.includes(userEducation);
            });
            pMatchesEdu = anyUnitMatches;
          }
          if (pMatchesEdu) hasAnyEduMatch = true;

          // If there is NO search query, we keep ALL positions intact!
          // We DO NOT filter out positions or units that failed the education check.
          // This allows JobCard to render them with a red dot.
          if (!q) {
            filteredPositions.push(p);
            continue;
          }

          // 2. Query check: If there IS a search query, we deep-filter positions/units
          const titleMatches = p.title && p.title.toLowerCase().includes(q);
          const finalUnits = p.units || [];
          
          let queryMatchedUnits = [];
          if (finalUnits.length > 0) {
            queryMatchedUnits = finalUnits.filter(u => 
              (u.name && u.name.toLowerCase().includes(q)) ||
              (u.major && u.major.toLowerCase().includes(q)) ||
              (u.details && u.details.toLowerCase().includes(q))
            );
          }

          if (queryMatchedUnits.length > 0) {
            // Specific units matched the query -> keep only those units
            const newCount = queryMatchedUnits.reduce((s, u) => s + (Number(u.count) || 1), 0);
            filteredPositions.push({ ...p, units: queryMatchedUnits, count: newCount });
          } else if (titleMatches || agencyMatchesQuery) {
            // No specific units matched, but the position title or agency matched -> keep all units
            filteredPositions.push(p);
          }
        }

        // Job is kept if it passes the education check AND has any matching positions left (or edge case match)
        const passesEdu = !userEducation || hasAnyEduMatch;
        const hasPositionsLeft = filteredPositions && filteredPositions.length > 0;
        const edgeCaseAgencyMatch = agencyMatchesQuery && (!j.positionList || j.positionList.length === 0);

        if (passesEdu && (hasPositionsLeft || edgeCaseAgencyMatch)) {
          acc.push({ ...j, positionList: filteredPositions });
        }


        return acc;
      }, []);
    }

    // Sort
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
    } else if (sortBy === "deadline") {
      result.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    } else if (sortBy === "positions") {
      result.sort((a, b) => {
        const countA = getTotalJobPositions(a);
        const countB = getTotalJobPositions(b);
        return countB - countA;
      });
    }

    return result;
  }, [jobs, categoryFilter, selectedProvince, userEducation, searchQuery, sortBy, showBookmarksOnly, isBookmarked, filterNoOCSC, filterOCSC]);

  // Stats
  const totalPositions = filtered.reduce(
    (sum, j) => sum + getTotalJobPositions(j),
    0
  );

  // Reset page when filters change
  const prevFiltersRef = useRef({
    categoryFilter, selectedProvince, userEducation, searchQuery, sortBy, showBookmarksOnly, filterNoOCSC, filterOCSC
  });
  
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (
      prev.categoryFilter !== categoryFilter ||
      prev.selectedProvince !== selectedProvince ||
      prev.userEducation !== userEducation ||
      prev.searchQuery !== searchQuery ||
      prev.sortBy !== sortBy ||
      prev.showBookmarksOnly !== showBookmarksOnly ||
      prev.filterNoOCSC !== filterNoOCSC ||
      prev.filterOCSC !== filterOCSC
    ) {
      setCurrentPage(1);
      prevFiltersRef.current = {
        categoryFilter, selectedProvince, userEducation, searchQuery, sortBy, showBookmarksOnly, filterNoOCSC, filterOCSC
      };
    }
  }, [categoryFilter, selectedProvince, userEducation, searchQuery, sortBy, showBookmarksOnly, filterNoOCSC, filterOCSC]);

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
          <div className="hero-edu-card">
            <div className="hero-edu-card-top">
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span className="hero-edu-card-title">
                  🎓 กรองงานตามวุฒิการศึกษา
                </span>
                {userEducation && (
                  <span className="hero-edu-badge">
                    ✓ {userEducation}
                  </span>
                )}
              </div>
              {userEducation && (
                <button
                  type="button"
                  onClick={() => onChangeUserEducation(null)}
                  className="hero-edu-clear-btn"
                  title="ล้างการเลือกวุฒิ"
                >
                  ✕ ล้างวุฒิ
                </button>
              )}
            </div>

            <div className="hero-edu-pills">
              {/* แถวที่ 1: ม.3, ม.6, ปวช., ปวส. */}
              <div className="hero-edu-row">
                {["ม.3", "ม.6", "ปวช.", "ปวส."].map((edu) => {
                  const isActive = userEducation === edu;
                  return (
                    <button
                      key={edu}
                      type="button"
                      onClick={() => onChangeUserEducation(isActive ? null : edu)}
                      className={`hero-edu-pill ${isActive ? "active" : ""}`}
                    >
                      {isActive ? "✓ " : ""}{edu}
                    </button>
                  );
                })}
              </div>

              {/* แถวที่ 2: ปริญญาตรี, ปริญญาโท, ปริญญาเอก */}
              <div className="hero-edu-row">
                {["ปริญญาตรี", "ปริญญาโท", "ปริญญาเอก"].map((edu) => {
                  const isActive = userEducation === edu;
                  return (
                    <button
                      key={edu}
                      type="button"
                      onClick={() => onChangeUserEducation(isActive ? null : edu)}
                      className={`hero-edu-pill ${isActive ? "active" : ""}`}
                    >
                      {isActive ? "✓ " : ""}{edu}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="hero-edu-subtitle">
              💡 เลือกระดับวุฒิเพื่อกรองเฉพาะตำแหน่งที่วุฒิตรงกัน
            </p>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="container">
          <div className="filter-bar-inner">
            {/* Main Controls Row (Search + Region + Sort) */}
            <div className="filter-main-row">
              {/* Search Box */}
              <div className="filter-search-wrap">
                <span className="filter-search-icon">🔍</span>
                <input
                  id="job-search-input"
                  type="text"
                  placeholder="ค้นหาตำแหน่ง หน่วยงาน หรือจังหวัด..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="filter-search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="filter-search-clear"
                    title="ล้างคำค้นหา"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Selects Row: Region + Sort */}
              <div className="filter-selects-row">
                {/* Region Dropdown */}
                <div className="custom-region-dropdown" ref={regionDropdownRef}>
                  <button
                    type="button"
                    className={`filter-select-btn ${selectedProvince ? "active" : ""}`}
                    onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                    title={selectedProvince ? `จังหวัด: ${selectedProvince}` : "เลือกจังหวัด/ภูมิภาค"}
                  >
                    <span className="filter-select-text">
                      {selectedProvince ? `📍 ${selectedProvince}` : "📍 ทุกภูมิภาค"}
                    </span>
                    <span className="filter-select-arrow">▼</span>
                  </button>

                  {isRegionDropdownOpen && (
                    <div className="region-dropdown-panel">
                      <div className="region-search-box">
                        <input
                          type="text"
                          placeholder="ค้นหาจังหวัด..."
                          value={provinceSearchQuery}
                          onChange={(e) => setProvinceSearchQuery(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div
                        onClick={() => { onSelectProvince(null); closeRegionDropdown(); }}
                        className={`region-option-all ${!selectedProvince ? "active" : ""}`}
                      >
                        📍 ทุกภูมิภาค
                      </div>
                      
                      {filteredRegions.length === 0 && (
                        <div className="region-empty-notice">
                          ไม่พบจังหวัดที่ค้นหา
                        </div>
                      )}

                      {filteredRegions.map(r => (
                        <div key={r.id}>
                          <div 
                            onClick={() => { onSelectProvince(r.name); closeRegionDropdown(); }}
                            className={`region-group-header ${selectedProvince === r.name ? "active" : ""}`}
                          >
                            <span>📍 {r.name} (ทั้งหมด)</span>
                            {selectedProvince === r.name && <span style={{ fontSize: "0.8rem" }}>✓</span>}
                          </div>
                          {r.provinces.map(p => {
                            const isSelected = selectedProvince === p;
                            return (
                              <div
                                key={p}
                                onClick={() => { onSelectProvince(p); closeRegionDropdown(); }}
                                className={`region-option-item ${isSelected ? "active" : ""}`}
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

                {/* Sort Dropdown */}
                <div className="filter-sort-wrap">
                  <select
                    id="job-sort-select"
                    className="filter-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">⚡ ล่าสุดก่อน</option>
                    <option value="deadline">⏳ ใกล้ปิดรับก่อน</option>
                    <option value="positions">👥 อัตราว่างมากก่อน</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Filter Chips & Count Row */}
            <div className="filter-chips-row">
              <div className="filter-chips-scroll">
                {/* Bookmarks Filter */}
                <button
                  type="button"
                  onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                  className={`filter-chip-btn ${showBookmarksOnly ? 'active-bookmark' : ''}`}
                >
                  <span className="chip-icon">{showBookmarksOnly ? "❤️" : "🤍"}</span>
                  <span>ที่บันทึกไว้</span>
                  {validBookmarkCount > 0 && (
                    <span className="chip-counter">{validBookmarkCount}</span>
                  )}
                </button>
                
                {/* OCSC Quick Filters */}
                <button
                  type="button"
                  onClick={() => { setFilterNoOCSC(!filterNoOCSC); setFilterOCSC(false); }}
                  className={`filter-chip-btn ${filterNoOCSC ? 'active-orange' : ''}`}
                >
                  <span className="chip-icon">✨</span>
                  <span>ไม่ต้องผ่าน ภาค ก</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setFilterOCSC(!filterOCSC); setFilterNoOCSC(false); }}
                  className={`filter-chip-btn ${filterOCSC ? 'active-blue' : ''}`}
                >
                  <span className="chip-icon">📝</span>
                  <span>ต้องผ่าน ภาค ก</span>
                </button>
              </div>

              {/* Result Count Badge */}
              <div className="filter-count-badge">
                พบ <strong>{filtered.length}</strong> ประกาศ
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job Grid */}
      <section className="jobs-section">
        <div className="container">

          <div className="jobs-grid">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <JobCardSkeleton key={i} />
              ))
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
                    style={{ animationDelay: `${i * 0.05}s` }}
                    isAdmin={isAdmin}
                    onEdit={onEditJob}
                    userEducation={userEducation}
                    isBookmarked={isBookmarked(job.id)}
                    onToggleBookmark={() => toggleBookmark(job.id)}
                  />
                ))}
              </>
            )}
          </div>

          {/* Pagination Controls */}
          {!isLoading && !isError && totalPages > 1 && (
            <div className="pagination-wrapper">
              <button
                className="pagination-btn"
                onClick={() => {
                  setCurrentPage(p => Math.max(1, p - 1));
                  window.scrollTo({ top: document.querySelector('.jobs-section').offsetTop - 140, behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
              >
                ก่อนหน้า
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                // Show first, last, current, and one adjacent
                if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                  const isActive = p === currentPage;
                  return (
                    <button
                      key={p}
                      className={`pagination-num-btn ${isActive ? "active" : ""}`}
                      onClick={() => {
                        setCurrentPage(p);
                        window.scrollTo({ top: document.querySelector('.jobs-section').offsetTop - 140, behavior: 'smooth' });
                      }}
                    >
                      {p}
                    </button>
                  );
                } else if (p === currentPage - 2 || p === currentPage + 2) {
                  return <span key={`dots-${p}`} className="pagination-dots">...</span>;
                }
                return null;
              })}

              <button
                className="pagination-btn"
                onClick={() => {
                  setCurrentPage(p => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: document.querySelector('.jobs-section').offsetTop - 140, behavior: 'smooth' });
                }}
                disabled={currentPage === totalPages}
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
