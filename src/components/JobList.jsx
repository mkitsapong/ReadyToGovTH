import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import JobCard from "./JobCard.jsx";
import SocialPosterModal from "./SocialPosterModal.jsx";
import ShareModal from "./ShareModal.jsx";
import { useBookmarks } from "../hooks/useBookmarks.js";
import { ExamPrepBanner } from "./ExamResources.jsx";
import { regions } from "../data/provinces.js";
import { getProvinces, getTotalJobPositions, daysLeft } from "../utils/helpers.js";
import { JobCardSkeleton } from "./LoadingSkeleton.jsx";
import { isFirebaseConfigured } from "../firebase.js";
import { searchJobsLocal, getSearchEngineType } from "../services/searchService.js";
import { trackSearchQuery } from "../services/analyticsService.js";

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


function safeGetSession(key, defaultValue = "") {
  try {
    const val = sessionStorage.getItem(key);
    return val !== null ? val : defaultValue;
  } catch {
    return defaultValue;
  }
}

function safeSetSession(key, val) {
  try {
    sessionStorage.setItem(key, String(val));
  } catch {
    // ignore storage quota/security error
  }
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
  onToast,
}) {
  const [searchQuery, setSearchQuery] = useState(() => safeGetSession("searchQuery", ""));
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 120);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [sortBy, setSortBy] = useState(() => safeGetSession("sortBy", "deadline"));
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = safeGetSession("currentPage");
    return saved ? parseInt(saved, 10) : 1;
  });
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(() => safeGetSession("showBookmarksOnly") === "true");
  const [showExpired, setShowExpired] = useState(() => safeGetSession("showExpired") === "true");
  const [filterNoOCSC, setFilterNoOCSC] = useState(() => safeGetSession("filterNoOCSC") === "true");
  const [filterOCSC, setFilterOCSC] = useState(() => safeGetSession("filterOCSC") === "true");
  const [provinceSearchQuery, setProvinceSearchQuery] = useState("");
  const [posterJob, setPosterJob] = useState(null);
  const [shareJob, setShareJob] = useState(null);

  useEffect(() => {
    safeSetSession("searchQuery", searchQuery);
    safeSetSession("sortBy", sortBy);
    safeSetSession("currentPage", currentPage);
    safeSetSession("showBookmarksOnly", showBookmarksOnly);
    safeSetSession("showExpired", showExpired);
    safeSetSession("filterNoOCSC", filterNoOCSC);
    safeSetSession("filterOCSC", filterOCSC);
  }, [searchQuery, sortBy, currentPage, showBookmarksOnly, showExpired, filterNoOCSC, filterOCSC]);
  
  const { bookmarks = [], toggleBookmark, isBookmarked } = useBookmarks();

  // Count only bookmarks that correspond to real jobs currently available
  const validBookmarkCount = useMemo(() => {
    if (!jobs || jobs.length === 0) return 0;
    return jobs.filter((j) => isBookmarked(j.id)).length;
  }, [jobs, isBookmarked]);

  // Count active vs expired jobs
  const expiredCount = useMemo(() => {
    if (!jobs || jobs.length === 0) return 0;
    return jobs.filter((j) => j.deadline && daysLeft(j.deadline) < 0).length;
  }, [jobs]);

  // Prune ghost or deleted job IDs from localStorage once when active jobs are first loaded
  const hasPrunedGhostRef = useRef(false);
  useEffect(() => {
    if (!hasPrunedGhostRef.current && jobs && jobs.length > 0 && bookmarks.length > 0) {
      hasPrunedGhostRef.current = true;
      const activeJobIds = new Set(jobs.map((j) => String(j.id)));
      const hasOrphans = bookmarks.some((id) => !activeJobIds.has(String(id)));
      if (hasOrphans) {
        const cleaned = bookmarks.filter((id) => activeJobIds.has(String(id)));
        try {
          localStorage.setItem("readytogov_bookmarks", JSON.stringify(cleaned));
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("readytogov_bookmarks_updated"));
          }, 0);
        } catch (e) {
          console.error("Error pruning ghost bookmarks", e);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);
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

  const searchData = useMemo(() => {
    let result = [...jobs];

    // Category filter
    if (categoryFilter) {
      result = result.filter((j) => {
        const cats = j.categories && j.categories.length > 0 ? j.categories : (j.category ? [j.category] : []);
        return cats.includes(categoryFilter);
      });
    }

    // Expired vs Active filter
    if (showExpired) {
      result = result.filter((j) => j.deadline && daysLeft(j.deadline) < 0);
    } else if (!showBookmarksOnly) {
      // Default view: Show only currently active jobs
      result = result.filter((j) => !j.deadline || daysLeft(j.deadline) >= 0);
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

    // Smart Full-text & Fuzzy Search (Thai tokenization + Typo tolerance + Gov Synonyms)
    const searchRes = searchJobsLocal(result, debouncedSearchQuery, { userEducation });
    let finalJobs = [...searchRes.results];

    // Sort
    if (debouncedSearchQuery.trim() && sortBy === "relevance") {
      finalJobs.sort((a, b) => (b._searchScore || 0) - (a._searchScore || 0));
    } else if (sortBy === "newest") {
      finalJobs.sort((a, b) => {
        const timeA = a.postedDate ? new Date(a.postedDate).getTime() : 0;
        const timeB = b.postedDate ? new Date(b.postedDate).getTime() : 0;
        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
      });
    } else if (sortBy === "deadline") {
      finalJobs.sort((a, b) => {
        const timeA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const timeB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return (isNaN(timeA) ? Infinity : timeA) - (isNaN(timeB) ? Infinity : timeB);
      });
    } else if (sortBy === "positions") {
      finalJobs.sort((a, b) => {
        const countA = getTotalJobPositions(a);
        const countB = getTotalJobPositions(b);
        return countB - countA;
      });
    } else if (debouncedSearchQuery.trim()) {
      // Default to relevance ranking when search query is active
      finalJobs.sort((a, b) => (b._searchScore || 0) - (a._searchScore || 0));
    }

    return {
      jobs: finalJobs,
      hasTypoCorrection: searchRes.hasTypoCorrection,
      suggestions: searchRes.suggestions,
    };
  }, [jobs, categoryFilter, selectedProvince, userEducation, debouncedSearchQuery, sortBy, showBookmarksOnly, showExpired, isBookmarked, filterNoOCSC, filterOCSC]);

  const filtered = searchData.jobs;
  const hasTypoCorrection = searchData.hasTypoCorrection;
  const typoSuggestions = searchData.suggestions;

  // Track search queries for Firebase Analytics & Admin Dashboard
  useEffect(() => {
    if (debouncedSearchQuery && debouncedSearchQuery.trim().length >= 2) {
      trackSearchQuery(debouncedSearchQuery.trim(), filtered.length);
    }
  }, [debouncedSearchQuery, filtered.length]);

  // Stats
  const totalPositions = filtered.reduce(
    (sum, j) => sum + getTotalJobPositions(j),
    0
  );

  // Reset page when filters change
  const prevFiltersRef = useRef({
    categoryFilter, selectedProvince, userEducation, searchQuery, sortBy, showBookmarksOnly, showExpired, filterNoOCSC, filterOCSC
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
      prev.showExpired !== showExpired ||
      prev.filterNoOCSC !== filterNoOCSC ||
      prev.filterOCSC !== filterOCSC
    ) {
      setCurrentPage(1);
      prevFiltersRef.current = {
        categoryFilter, selectedProvince, userEducation, searchQuery, sortBy, showBookmarksOnly, showExpired, filterNoOCSC, filterOCSC
      };
    }
  }, [categoryFilter, selectedProvince, userEducation, searchQuery, sortBy, showBookmarksOnly, showExpired, filterNoOCSC, filterOCSC]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentJobs = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      {/* Hero */}
      <section className="page-hero">
        <div className="container hero-content">
          {/* Left Column: Title & Stats */}
          <div className="hero-left-col">
            <h1 className="hero-title">
              <span>{hero.title}</span>
            </h1>
            <p className="hero-subtitle">{hero.subtitle}</p>
            <div className="hero-stats-wrapper">
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

              <Link
                to="/stats"
                className="hero-stats-btn"
                title="คลิกเพื่อดู Dashboard สถิติตลาดงานราชการภาพรวม"
              >
                <div className="hero-stats-btn-icon-wrap">
                  📊
                </div>
                <div className="hero-stats-btn-text">
                  <span className="hero-stats-btn-main">Dashboard สถิติ</span>
                  <span className="hero-stats-btn-sub">ดูกราฟ & แนวโน้มงาน</span>
                </div>
                <span className="hero-stats-btn-arrow">→</span>
              </Link>
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
                  placeholder="ค้นหาตำแหน่ง หน่วยงาน หรือจังหวัด... (รองรับคำพิมพ์ผิด/คำเหมือน)"
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
                    {searchQuery.trim() && (
                      <option value="relevance">🎯 ตรงที่สุดก่อน (Relevance)</option>
                    )}
                    <option value="deadline">⏳ ใกล้ปิดรับก่อน</option>
                    <option value="newest">⚡ ล่าสุดก่อน</option>
                    <option value="positions">👥 อัตราว่างมากก่อน</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Typo Correction / Fuzzy Suggestion Banner */}
            {hasTypoCorrection && typoSuggestions.length > 0 && searchQuery.trim() && (
              <div className="search-typo-notice">
                <span className="search-typo-icon">💡</span>
                <span className="search-typo-text">ผลการค้นหาใกล้เคียง (Fuzzy Match):</span>
                <div className="search-typo-badges">
                  {typoSuggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSearchQuery(sug)}
                      className="search-typo-badge"
                      title={`คลิกเพื่อเปลี่ยนคำค้นหาเป็น "${sug}"`}
                    >
                      "{sug}"
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Filter Chips & Count Row */}
            <div className="filter-chips-row">
              <div className="filter-chips-scroll">
                {/* Bookmarks Filter */}
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !showBookmarksOnly;
                    setShowBookmarksOnly(nextVal);
                    if (nextVal) setShowExpired(false);
                  }}
                  className={`filter-chip-btn ${showBookmarksOnly ? 'active-bookmark' : ''}`}
                >
                  <span className="chip-icon">{showBookmarksOnly ? "❤️" : "🤍"}</span>
                  <span>ที่บันทึกไว้</span>
                  {validBookmarkCount > 0 && (
                    <span className="chip-counter">{validBookmarkCount}</span>
                  )}
                </button>

                {/* Expired Jobs Filter */}
                <button
                  type="button"
                  id="filter-chip-expired"
                  onClick={() => {
                    const nextVal = !showExpired;
                    setShowExpired(nextVal);
                    if (nextVal) setShowBookmarksOnly(false);
                  }}
                  className={`filter-chip-btn ${showExpired ? 'active-expired' : ''}`}
                  title={showExpired ? "คลิกเพื่อกลับไปดูงานที่เปิดรับสมัครอยู่" : "ดูประกาศงานราชการที่ปิดรับสมัครแล้ว"}
                >
                  <span className="chip-icon">⌛</span>
                  <span>ปิดรับสมัครแล้ว</span>
                  {expiredCount > 0 && (
                    <span className="chip-counter chip-counter-expired">{expiredCount}</span>
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
                พบ <strong>{filtered.length}</strong> ประกาศ{showExpired ? " (ปิดรับสมัครแล้ว)" : ""}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job Grid */}
      <section className="jobs-section">
        <div className="container">
          {!isFirebaseConfigured && (
            <div style={{
              background: "#fffbeb",
              border: "1.5px solid #fde68a",
              borderRadius: "14px",
              padding: "12px 18px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 2px 8px rgba(245, 158, 11, 0.08)",
            }}>
              <span style={{ fontSize: "1.3rem" }}>💡</span>
              <div style={{ fontSize: "0.85rem", color: "#92400e", lineHeight: 1.5 }}>
                <strong>กำลังแสดงข้อมูลตัวอย่าง (Local Demo Mode):</strong> ยังไม่พบการตั้งค่าในไฟล์ <code>.env</code> ระบบจึงแสดงข้อมูลจำลองเพื่อความสะดวกในการทดสอบฟิลเตอร์ ค้นหางาน และสร้างภาพ AI แบนเนอร์
              </div>
            </div>
          )}

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
                <div className="empty-state-icon">{showExpired ? "⌛" : "📭"}</div>
                <h3>{showExpired ? "ยังไม่มีประกาศที่ปิดรับสมัครแล้ว" : "ไม่พบรายการที่ตรงกับเงื่อนไข"}</h3>
                <p>{showExpired ? "ประกาศงานทั้งหมดในขณะนี้ยังคงเปิดรับสมัครอยู่" : "ลองเปลี่ยนคำค้นหาหรือเลือกจังหวัดใหม่"}</p>
              </div>
            ) : (
              <>
                {currentJobs.map((job, i) => (
                  <JobCard
                    key={job.id ? `${job.id}-${i}` : i}
                    job={job}
                    style={{ animationDelay: `${i * 0.05}s` }}
                    isAdmin={isAdmin}
                    onEdit={onEditJob}
                    onOpenPoster={setPosterJob}
                    onOpenShare={setShareJob}
                    userEducation={userEducation}
                    isBookmarked={isBookmarked(job.id)}
                    onToggleBookmark={() => {
                      const isNowBookmarked = toggleBookmark(job.id, job);
                      if (onToast) {
                        onToast(
                          isNowBookmarked
                            ? `บันทึก "${job.department}" แล้ว ❤️ (ดูได้ที่ปุ่ม "ที่บันทึกไว้")`
                            : `ยกเลิกการบันทึก "${job.department}" แล้ว`,
                          isNowBookmarked ? "success" : "info"
                        );
                      }
                    }}
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
                  window.scrollTo({ top: (document.querySelector('.jobs-section')?.offsetTop ?? 0) - 140, behavior: 'smooth' });
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
                        window.scrollTo({ top: (document.querySelector('.jobs-section')?.offsetTop ?? 0) - 140, behavior: 'smooth' });
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
                  window.scrollTo({ top: (document.querySelector('.jobs-section')?.offsetTop ?? 0) - 140, behavior: 'smooth' });
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

      {/* Social Poster Modal */}
      {posterJob && (
        <SocialPosterModal
          job={posterJob}
          onClose={() => setPosterJob(null)}
          onToast={onToast}
        />
      )}

      {/* Deep Link Share Modal */}
      {shareJob && (
        <ShareModal
          job={shareJob}
          onClose={() => setShareJob(null)}
          onToast={onToast}
        />
      )}
    </>
  );
}
