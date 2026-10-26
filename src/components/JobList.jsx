import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import JobCard from "./JobCard.jsx";
import SocialPosterModal from "./SocialPosterModal.jsx";
import ShareModal from "./ShareModal.jsx";
import { useBookmarks } from "../hooks/useBookmarks.js";
import { useApplicationTracker } from "../hooks/useApplicationTracker.js";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts.js";
import { ExamPrepBanner } from "./ExamResources.jsx";
import { regions } from "../data/provinces.js";
import { getProvinces, getTotalJobPositions, daysLeft } from "../utils/helpers.js";
import { JobCardSkeleton } from "./LoadingSkeleton.jsx";
import { isFirebaseConfigured } from "../firebase.js";
import { searchJobsLocal } from "../services/searchService.js";
import { trackSearchQuery } from "../services/analyticsService.js";
import { EDUCATION_LEVELS } from "../utils/constants.js";
import { SECTOR_ITEMS, SECTOR_MAP, matchesSector, getJobSector } from "../utils/sectorHelper.js";

const CATEGORY_FILTER = {
  home: null,
  civil: "ข้าราชการ",
  government: "พนักงานราชการ",
  state: "รัฐวิสาหกิจ",
  temp: "ลูกจ้างชั่วคราว",
  agency: "พนักงานหน่วยงานของรัฐ",
};

export const CONTRACT_TYPES = [
  { id: "all", label: "รูปแบบทั้งหมด", shortLabel: "ทุกรูปแบบ", icon: "🌐" },
  { id: "civil", label: "ข้าราชการ", shortLabel: "ข้าราชการ", icon: "🏛️", value: "ข้าราชการ" },
  { id: "government", label: "พนักงานราชการ", shortLabel: "พนักงานราชการ", icon: "📋", value: "พนักงานราชการ" },
  { id: "state", label: "รัฐวิสาหกิจ", shortLabel: "รัฐวิสาหกิจ", icon: "🏢", value: "รัฐวิสาหกิจ" },
  { id: "temp", label: "ลูกจ้างชั่วคราว", shortLabel: "ลูกจ้างชั่วคราว", icon: "📝", value: "ลูกจ้างชั่วคราว" },
];

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

// Jobs shown per page / per "load more" click
const PAGE_SIZE = 12;

function jobMatchesCategory(job, categoryFilter) {
  if (!categoryFilter) return true;
  const cats = job.categories && job.categories.length > 0 ? job.categories : (job.category ? [job.category] : []);
  return cats.includes(categoryFilter);
}

function jobMatchesProvince(job, selectedProvince) {
  if (!selectedProvince) return true;
  const jobProvinces = getProvinces(job);
  if (jobProvinces.includes("ทุกจังหวัด") || jobProvinces.includes("ทั่วประเทศ")) return true;
  const regionMatch = regions.find((r) => r.name === selectedProvince);
  if (regionMatch) {
    return jobProvinces.includes(regionMatch.name) || jobProvinces.some((p) => regionMatch.provinces.includes(p));
  }
  return jobProvinces.includes(selectedProvince);
}

function isJobActive(job) {
  return !job.deadline || daysLeft(job.deadline) >= 0;
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
  const [urlParams, setUrlParams] = useSearchParams();

  // ── Shareable Filter URL helpers ─────────────────────────────────────────
  // Read initial values from URL if present, fallback to session/default
  function getParam(key, fallback = "") {
    const v = urlParams.get(key);
    return v !== null ? v : fallback;
  }

  const [searchQuery, setSearchQuery] = useState(() => {
    const fromUrl = urlParams.get("q");
    return fromUrl !== null ? fromUrl : safeGetSession("searchQuery", "");
  });
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 120);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [sortBy, setSortBy] = useState(() => {
    return getParam("sort", safeGetSession("sortBy", "deadline"));
  });
  // Visible page range [startPage, currentPage]. "Load more" extends currentPage,
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = parseInt(safeGetSession("currentPage"), 10);
    return saved > 0 ? saved : 1;
  });
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(() => safeGetSession("showBookmarksOnly") === "true");
  const [showExpired, setShowExpired] = useState(() => {
    const fromUrl = urlParams.get("expired");
    return fromUrl !== null ? fromUrl === "1" : safeGetSession("showExpired") === "true";
  });
  const [filterNoOCSC, setFilterNoOCSC] = useState(() => {
    const fromUrl = urlParams.get("noocsc");
    return fromUrl !== null ? fromUrl === "1" : safeGetSession("filterNoOCSC") === "true";
  });
  const [filterOCSC, setFilterOCSC] = useState(() => {
    // "No OCSC" and "OCSC" are mutually exclusive — if both arrive (e.g. ?ocsc=1&noocsc=1), "no" wins
    const noFromUrl = urlParams.get("noocsc");
    const noActive = noFromUrl !== null ? noFromUrl === "1" : safeGetSession("filterNoOCSC") === "true";
    if (noActive) return false;
    const fromUrl = urlParams.get("ocsc");
    return fromUrl !== null ? fromUrl === "1" : safeGetSession("filterOCSC") === "true";
  });
  const [selectedContract, setSelectedContract] = useState(() => {
    const fromUrl = urlParams.get("contract") || urlParams.get("cat");
    if (fromUrl && CONTRACT_TYPES.some((c) => c.id === fromUrl)) return fromUrl;
    if (activePage && activePage !== "home" && CATEGORY_FILTER[activePage]) {
      return activePage;
    }
    const fromSession = safeGetSession("selectedContract", "all");
    return CONTRACT_TYPES.some((c) => c.id === fromSession) ? fromSession : "all";
  });
  const [selectedSector, setSelectedSector] = useState(() => {
    const fromUrl = urlParams.get("sector");
    return fromUrl !== null ? fromUrl : safeGetSession("selectedSector", "all");
  });
  const [provinceSearchQuery, setProvinceSearchQuery] = useState("");
  const [posterJob, setPosterJob] = useState(null);
  const [shareJob, setShareJob] = useState(null);
  const [isMobileScreen, setIsMobileScreen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );

  const [viewMode, setViewMode] = useState(() => {
    try {
      const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
      const key = isMobile ? "readytogov_view_mode_mobile" : "readytogov_view_mode_desktop";
      const saved = localStorage.getItem(key);
      if (saved) return saved;
      return isMobile ? "grid" : "list";
    } catch {
      return typeof window !== "undefined" && window.innerWidth <= 768 ? "grid" : "list";
    }
  });

  // Track screen resize and switch default viewMode accordingly if not overridden for that screen size
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      setIsMobileScreen(isMobile);
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // When crossing mobile/desktop breakpoint, load the appropriate view mode preference
  const prevIsMobileRef = useRef(isMobileScreen);
  useEffect(() => {
    if (prevIsMobileRef.current !== isMobileScreen) {
      prevIsMobileRef.current = isMobileScreen;
      try {
        const key = isMobileScreen ? "readytogov_view_mode_mobile" : "readytogov_view_mode_desktop";
        const saved = localStorage.getItem(key);
        setViewMode(saved || (isMobileScreen ? "grid" : "list"));
      } catch {
        setViewMode(isMobileScreen ? "grid" : "list");
      }
    }
  }, [isMobileScreen]);

  // Sync selectedContract when route /category/:id changes
  useEffect(() => {
    if (activePage && activePage !== "home" && CATEGORY_FILTER[activePage]) {
      setSelectedContract(activePage);
    }
  }, [activePage]);

  // ── Sync filters → URL + sessionStorage ─────────────────────────────────
  useEffect(() => {
    safeSetSession("searchQuery", searchQuery);
    safeSetSession("sortBy", sortBy);
    safeSetSession("currentPage", currentPage);
    safeSetSession("showBookmarksOnly", showBookmarksOnly);
    safeSetSession("showExpired", showExpired);
    safeSetSession("filterNoOCSC", filterNoOCSC);
    safeSetSession("filterOCSC", filterOCSC);
    safeSetSession("selectedSector", selectedSector);
    safeSetSession("selectedContract", selectedContract);
    // Sync shareable params into URL
    setUrlParams(prev => {
      const next = new URLSearchParams(prev);
      // keep ?province= intact
      searchQuery ? next.set("q", searchQuery) : next.delete("q");
      sortBy !== "deadline" && sortBy !== "relevance" ? next.set("sort", sortBy) : next.delete("sort");
      userEducation ? next.set("edu", userEducation) : next.delete("edu");
      showExpired ? next.set("expired", "1") : next.delete("expired");
      filterNoOCSC ? next.set("noocsc", "1") : next.delete("noocsc");
      filterOCSC ? next.set("ocsc", "1") : next.delete("ocsc");
      selectedSector && selectedSector !== "all" ? next.set("sector", selectedSector) : next.delete("sector");
      selectedContract && selectedContract !== "all" ? next.set("contract", selectedContract) : next.delete("contract");
      return next;
    }, { replace: true });
  }, [searchQuery, sortBy, currentPage, userEducation, showBookmarksOnly, showExpired, filterNoOCSC, filterOCSC, selectedSector, selectedContract, setUrlParams]);

  // ── Auto relevance sort while searching ──────────────────────────────────────
  // When the user starts typing, switch the default sort (deadline) to relevance.
  // When the query is cleared, fall back to deadline. Explicit choices are kept.
  const hasSearchQuery = searchQuery.trim().length > 0;
  const prevHasSearchQueryRef = useRef(false);
  useEffect(() => {
    if (!hasSearchQuery) {
      setSortBy((s) => (s === "relevance" ? "deadline" : s));
    } else if (!prevHasSearchQueryRef.current) {
      setSortBy((s) => (s === "deadline" ? "relevance" : s));
    }
    prevHasSearchQueryRef.current = hasSearchQuery;
  }, [hasSearchQuery]);

  // ── Keyboard Shortcuts ─────────────────────────────────────────────────
  useKeyboardShortcuts({ searchInputId: "job-search-input" });

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedProvince ||
    userEducation ||
    filterOCSC ||
    filterNoOCSC ||
    showBookmarksOnly ||
    showExpired ||
    (selectedSector && selectedSector !== "all") ||
    (selectedContract && selectedContract !== "all")
  );

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    onSelectProvince?.(null);
    onChangeUserEducation?.(null);
    setFilterOCSC(false);
    setFilterNoOCSC(false);
    setShowBookmarksOnly(false);
    setShowExpired(false);
    setSelectedSector("all");
    setSelectedContract("all");
    setCurrentPage(1);
  }, [onSelectProvince, onChangeUserEducation]);
  
  const { bookmarks = [], toggleBookmark, isBookmarked } = useBookmarks();
  const { getJobTracking, updateJobTracking } = useApplicationTracker(jobs);

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

  // Count active jobs by contract type
  const contractCounts = useMemo(() => {
    if (!jobs || jobs.length === 0) return {};
    const activeJobs = jobs.filter(isJobActive);
    const counts = { all: activeJobs.length };
    CONTRACT_TYPES.forEach((c) => {
      if (c.id === "all") return;
      counts[c.id] = activeJobs.filter((j) => jobMatchesCategory(j, c.value)).length;
    });
    return counts;
  }, [jobs]);

  // Count active jobs by sector
  const sectorCounts = useMemo(() => {
    if (!jobs || jobs.length === 0) return {};
    const activeJobs = jobs.filter(isJobActive);
    const counts = { all: activeJobs.length };
    activeJobs.forEach((job) => {
      const s = getJobSector(job);
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
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
  const sectorDropdownRef = useRef(null);
  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false);

  const closeRegionDropdown = () => {
    setIsRegionDropdownOpen(false);
    setProvinceSearchQuery("");
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(e.target)) {
        closeRegionDropdown();
      }
      if (sectorDropdownRef.current && !sectorDropdownRef.current.contains(e.target)) {
        setIsSectorDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
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

    // Contract / Employment Type filter (ข้าราชการ, พนักงานราชการ, รัฐวิสาหกิจ ฯลฯ)
    const effectiveContract = selectedContract && selectedContract !== "all" 
      ? selectedContract 
      : null;

    if (effectiveContract && CATEGORY_FILTER[effectiveContract]) {
      const targetCategory = CATEGORY_FILTER[effectiveContract];
      result = result.filter((j) => jobMatchesCategory(j, targetCategory));
    }

    // Expired vs Active filter
    if (showExpired) {
      result = result.filter((j) => !isJobActive(j));
    } else if (!showBookmarksOnly) {
      // Default view: Show only currently active jobs
      result = result.filter(isJobActive);
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
      result = result.filter((j) => jobMatchesProvince(j, selectedProvince));
    }

    // Workplace Sector filter (โรงพยาบาล, สถานศึกษา, ท้องถิ่น ฯลฯ)
    if (selectedSector && selectedSector !== "all") {
      result = result.filter((j) => matchesSector(j, selectedSector));
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
  }, [jobs, selectedContract, categoryFilter, selectedProvince, userEducation, selectedSector, debouncedSearchQuery, sortBy, showBookmarksOnly, showExpired, isBookmarked, filterNoOCSC, filterOCSC]);

  const filtered = searchData.jobs;
  const hasTypoCorrection = searchData.hasTypoCorrection;
  const typoSuggestions = searchData.suggestions;

  // Track search queries for Firebase Analytics & Admin Dashboard
  useEffect(() => {
    if (debouncedSearchQuery && debouncedSearchQuery.trim().length >= 2) {
      trackSearchQuery(debouncedSearchQuery.trim(), filtered.length);
    }
  }, [debouncedSearchQuery, filtered.length]);

  // Stats (result-level, shown next to the filter count)
  const totalPositions = filtered.reduce(
    (sum, j) => sum + getTotalJobPositions(j),
    0
  );

  // Hero stats: overall open jobs for this category/province (not affected by search/chips)
  const heroStats = useMemo(() => {
    const base = (jobs || []).filter(
      (j) => jobMatchesCategory(j, categoryFilter) && isJobActive(j) && jobMatchesProvince(j, selectedProvince)
    );
    return {
      count: base.length,
      positions: base.reduce((sum, j) => sum + getTotalJobPositions(j), 0),
    };
  }, [jobs, categoryFilter, selectedProvince]);

  // Reset page when filters change
  const prevFiltersRef = useRef({
    selectedContract, selectedSector, categoryFilter, selectedProvince, userEducation, searchQuery, sortBy, showBookmarksOnly, showExpired, filterNoOCSC, filterOCSC
  });
  
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (
      prev.selectedContract !== selectedContract ||
      prev.selectedSector !== selectedSector ||
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
        selectedContract, selectedSector, categoryFilter, selectedProvince, userEducation, searchQuery, sortBy, showBookmarksOnly, showExpired, filterNoOCSC, filterOCSC
      };
    }
  }, [selectedContract, selectedSector, categoryFilter, selectedProvince, userEducation, searchQuery, sortBy, showBookmarksOnly, showExpired, filterNoOCSC, filterOCSC]);

  // ── Pagination (Clean Classic) ──────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const currentJobs = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const rangeFrom = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(safePage * PAGE_SIZE, filtered.length);

  // Persist clamped values once data is loaded
  useEffect(() => {
    if (isLoading || !jobs || jobs.length === 0) return;
    if (currentPage !== safePage) setCurrentPage(safePage);
  }, [isLoading, jobs, currentPage, safePage]);

  const scrollToJobs = () => {
    const jobsEl = document.querySelector(".jobs-section");
    window.scrollTo({ top: (jobsEl?.offsetTop ?? 0) - 140, behavior: "smooth" });
  };

  const goToPage = (p) => {
    const page = Math.min(Math.max(1, p), totalPages);
    setCurrentPage(page);
    scrollToJobs();
  };

  // OCSC (ภาค ก) tri-state: all / no / yes
  const ocscMode = filterNoOCSC ? "no" : filterOCSC ? "yes" : "all";
  const setOcscMode = (mode) => {
    setFilterNoOCSC(mode === "no");
    setFilterOCSC(mode === "yes");
  };

  return (
    <>
      {/* Hero */}
      <section className="page-hero">
        <div className="hero-glow-1" />
        <div className="hero-glow-2" />
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
                  <span className="hero-stat-number">{isLoading ? "–" : heroStats.count.toLocaleString()}</span>
                  <span className="hero-stat-label">ประกาศที่เปิดรับอยู่</span>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat-number">{isLoading ? "–" : heroStats.positions.toLocaleString()}</span>
                  <span className="hero-stat-label">อัตราว่างรวม</span>
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
                  กรองงานตามวุฒิการศึกษา
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
                {EDUCATION_LEVELS.slice(0, 4).map((edu) => {
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
                {EDUCATION_LEVELS.slice(4).map((edu) => {
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
              เลือกระดับวุฒิเพื่อกรองเฉพาะตำแหน่งที่วุฒิตรงกัน
            </p>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="container">
          <div className="filter-card-modern">
            {/* Tier 1: Search & Controls Hub */}
            <div className="filter-hub-row">
              {/* Search Box */}
              <div className="hub-search-field">
                <span className="hub-search-icon">🔍</span>
                <input
                  id="job-search-input"
                  type="text"
                  placeholder={isMobileScreen ? "ค้นหาตำแหน่ง, หน่วยงาน..." : "ค้นหาตำแหน่ง หน่วยงาน หรือจังหวัด... (รองรับคำพิมพ์ผิด/คำเหมือน)"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="hub-search-input"
                  aria-label="ค้นหาตำแหน่ง หน่วยงาน หรือจังหวัด"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="hub-clear-btn"
                    title="ล้างคำค้นหา (Esc)"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Quick Select Controls: 4 Unified Selectors (Region + Sector + Edu on mobile + Sort) */}
              <div className="hub-controls-group">
                {/* 1. Region Dropdown */}
                <div className="custom-region-dropdown" ref={regionDropdownRef}>
                  <button
                    type="button"
                    className={`hub-select-btn ${selectedProvince ? "active" : ""}`}
                    onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                    title={selectedProvince ? `จังหวัด: ${selectedProvince}` : "เลือกจังหวัด/ภูมิภาค"}
                  >
                    <span className="hub-btn-icon">📍</span>
                    <span className="hub-btn-text">
                      {selectedProvince ? selectedProvince : "ทุกภูมิภาค"}
                    </span>
                    <span className="hub-btn-arrow">▼</span>
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
                        ทุกภูมิภาค
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
                            <span>{r.name} (ทั้งหมด)</span>
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

                {/* 2. Sector Dropdown Menu Button */}
                <div className="sector-filter-dropdown" ref={sectorDropdownRef}>
                  <button
                    type="button"
                    id="filter-sector-dropdown-btn"
                    className={`hub-select-btn ${selectedSector && selectedSector !== "all" ? "active-sector" : ""}`}
                    onClick={() => setIsSectorDropdownOpen(!isSectorDropdownOpen)}
                    title="กรองตามแวดวงสถานที่ปฏิบัติงาน"
                  >
                    <span className="hub-btn-icon">🏛️</span>
                    <span className="hub-btn-text">
                      {selectedSector && selectedSector !== "all" 
                        ? (SECTOR_MAP[selectedSector]?.shortLabel || "แวดวงงาน")
                        : "ทุกแวดวงงาน"}
                    </span>
                    <span className="hub-btn-arrow">▼</span>
                  </button>

                  {isSectorDropdownOpen && (
                    <div className="sector-dropdown-card">
                      <div className="sector-dropdown-title">
                        <span>เลือกแวดวงหน่วยงาน</span>
                        {selectedSector && selectedSector !== "all" && (
                          <button
                            type="button"
                            className="sector-reset-inline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSector("all");
                              setIsSectorDropdownOpen(false);
                            }}
                          >
                            ล้างค่า
                          </button>
                        )}
                      </div>
                      <div className="sector-dropdown-list">
                        {SECTOR_ITEMS.map((sec) => {
                          const count = sectorCounts[sec.id] || 0;
                          const isSecActive = (selectedSector || "all") === sec.id;
                          return (
                            <button
                              key={sec.id}
                              type="button"
                              className={`sector-dropdown-item ${isSecActive ? "active" : ""}`}
                              onClick={() => {
                                setSelectedSector(sec.id);
                                setIsSectorDropdownOpen(false);
                                setCurrentPage(1);
                              }}
                            >
                              <span className="sec-item-icon">{sec.icon}</span>
                              <span className="sec-item-label">{sec.label}</span>
                              {count > 0 && <span className="sec-item-count">{count}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Education select (mobile only — desktop uses hero card) */}
                <div className="filter-edu-wrap">
                  <select
                    id="job-edu-select"
                    className={`hub-select-btn filter-edu-select ${userEducation ? "active-edu" : ""}`}
                    value={userEducation || ""}
                    onChange={(e) => onChangeUserEducation(e.target.value || null)}
                    aria-label="กรองตามวุฒิการศึกษา"
                  >
                    <option value="">ทุกวุฒิการศึกษา</option>
                    {EDUCATION_LEVELS.map((edu) => (
                      <option key={edu} value={edu}>{edu}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Sort Dropdown */}
                <div className="hub-sort-wrap">
                  <select
                    id="job-sort-select"
                    className="hub-select-btn hub-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label="เรียงลำดับประกาศ"
                  >
                    {(searchQuery.trim() || sortBy === "relevance") && (
                      <option value="relevance">ตรงที่สุดก่อน</option>
                    )}
                    <option value="deadline">ใกล้ปิดรับก่อน</option>
                    <option value="newest">ล่าสุดก่อน</option>
                    <option value="positions">อัตราว่างมากก่อน</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tier 2: Primary Employment Type Segmented Bar (Full Width Modern Tabs) */}
            <div className="filter-segmented-bar" role="tablist" aria-label="เลือกรูปแบบสัญญาจ้าง">
              {CONTRACT_TYPES.map((ct) => {
                const isActive = (selectedContract || "all") === ct.id;
                const count = contractCounts[ct.id] || 0;
                return (
                  <button
                    key={ct.id}
                    type="button"
                    id={`filter-contract-${ct.id}`}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      setSelectedContract(isActive && ct.id !== "all" ? "all" : ct.id);
                      setCurrentPage(1);
                    }}
                    className={`segmented-tab-btn ${isActive ? "active" : ""}`}
                    title={ct.label}
                  >
                    <span className="seg-icon">{ct.icon}</span>
                    <span className="seg-label">{ct.shortLabel || ct.label}</span>
                    {count > 0 && <span className="seg-badge">{count}</span>}
                  </button>
                );
              })}
            </div>

            {/* Tier 3: Sleek Secondary Refinement Toolbar */}
            <div className="filter-refinement-toolbar">
              <div className="toolbar-left-chips">

                {/* OCSC (ภาค ก) Segmented Switcher */}
                <div className="ocsc-segmented-pill" role="group" aria-label="เงื่อนไข ภาค ก">
                  <span className="ocsc-pill-label">ภาค ก:</span>
                  {[
                    { mode: "all", label: "ทั้งหมด" },
                    { mode: "no",  label: "✨ ไม่ต้องผ่าน" },
                    { mode: "yes", label: "📝 ต้องผ่าน" },
                  ].map(({ mode, label }) => (
                    <button
                      key={mode}
                      type="button"
                      id={`filter-ocsc-${mode}`}
                      onClick={() => setOcscMode(mode)}
                      className={`ocsc-sub-btn ${ocscMode === mode ? "active" : ""} ${mode === "no" ? "is-no" : ""}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Bookmark Toggle Chip */}
                <button
                  type="button"
                  id="filter-quick-bookmarks"
                  onClick={() => {
                    const nextVal = !showBookmarksOnly;
                    setShowBookmarksOnly(nextVal);
                    if (nextVal) setShowExpired(false);
                  }}
                  className={`toolbar-pill-btn bookmark-chip ${showBookmarksOnly ? "active" : ""}`}
                  title={showBookmarksOnly ? "คลิกเพื่อดูประกาศทั้งหมด" : "ดูประกาศงานที่บันทึกไว้"}
                >
                  <span className="pill-icon">{showBookmarksOnly ? "❤️" : "🤍"}</span>
                  <span className="pill-text">ที่บันทึกไว้</span>
                  {validBookmarkCount > 0 && (
                    <span className="pill-badge-red">{validBookmarkCount}</span>
                  )}
                </button>

                {/* Expired Toggle Chip */}
                <button
                  type="button"
                  id="filter-chip-expired"
                  onClick={() => {
                    const nextVal = !showExpired;
                    setShowExpired(nextVal);
                    if (nextVal) setShowBookmarksOnly(false);
                  }}
                  className={`toolbar-pill-btn expired-chip ${showExpired ? "active" : ""}`}
                  title={showExpired ? "คลิกเพื่อกลับไปดูงานที่เปิดรับสมัครอยู่" : "ดูประกาศงานราชการที่ปิดรับสมัครแล้ว"}
                >
                  <span className="pill-icon">⌛</span>
                  <span className="pill-text">ปิดรับสมัครแล้ว</span>
                  {expiredCount > 0 && (
                    <span className="pill-badge-gray">{expiredCount}</span>
                  )}
                </button>

              </div>

              {/* Right: Results Count Badge & View Mode Switcher */}
              <div className="toolbar-right-meta">
                <div className="toolbar-results-count" aria-live="polite">
                  <span className="results-indicator" />
                  <span>
                    พบ <strong>{filtered.length.toLocaleString()}</strong> ประกาศ
                    {filtered.length > 0 && (
                      <span className="results-positions"> · <strong>{totalPositions.toLocaleString()}</strong> อัตรา</span>
                    )}
                  </span>
                </div>

                <div className="toolbar-view-switcher" role="group" aria-label="รูปแบบการแสดงผล">
                  <button
                    type="button"
                    id="btn-view-list"
                    className={`view-mode-pill ${viewMode === "list" ? "active" : ""}`}
                    onClick={() => {
                      setViewMode("list");
                      try {
                        const key = isMobileScreen ? "readytogov_view_mode_mobile" : "readytogov_view_mode_desktop";
                        localStorage.setItem(key, "list");
                      } catch {}
                    }}
                    title="แสดงแบบแนวนอน (List View)"
                  >
                    ☰ แนวนอน
                  </button>
                  <button
                    type="button"
                    id="btn-view-grid"
                    className={`view-mode-pill ${viewMode === "grid" ? "active" : ""}`}
                    onClick={() => {
                      setViewMode("grid");
                      try {
                        const key = isMobileScreen ? "readytogov_view_mode_mobile" : "readytogov_view_mode_desktop";
                        localStorage.setItem(key, "grid");
                      } catch {}
                    }}
                    title="แสดงแบบตารางการ์ด (Grid View)"
                  >
                    ⊞ ตาราง
                  </button>
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
          </div>
        </div>
      </div>

      {/* Job Grid */}
      <section className="jobs-section">
        <div className="container">
          {!isFirebaseConfigured && (
            <div className="demo-mode-notice">
              <span className="demo-mode-notice-icon">💡</span>
              <div className="demo-mode-notice-text">
                <strong>กำลังแสดงข้อมูลตัวอย่าง (Local Demo Mode):</strong> ยังไม่พบการตั้งค่าในไฟล์ <code>.env</code> ระบบจึงแสดงข้อมูลจำลองเพื่อความสะดวกในการทดสอบฟิลเตอร์ ค้นหางาน และสร้างภาพ AI แบนเนอร์
              </div>
            </div>
          )}

          {/* Bookmarks Tracker Notice Banner */}
          {showBookmarksOnly && (
            <div className="bookmarks-tracker-banner">
              <div className="banner-info">
                <span className="banner-icon">❤️</span>
                <div className="banner-text">
                  <strong>กำลังแสดงงานที่คุณบันทึกไว้ ({validBookmarkCount} รายการ)</strong>
                  <span>คุณสามารถตั้งสถานะการสมัคร กำหนดวันสอบ หรือจดโน้ตได้ที่ระบบติดตามงาน</span>
                </div>
              </div>
              <Link to="/tracker" className="banner-tracker-btn" title="เปิดหน้าติดตามการสมัครงานราชการ (Application Tracker)">
                <span>เปิดหน้าติดตามงาน (Tracker)</span>
                <span className="banner-arrow">➔</span>
              </Link>
            </div>
          )}

          <div className={viewMode === "list" ? "jobs-list" : "jobs-grid"}>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <JobCardSkeleton key={i} layout={viewMode} />
              ))
            ) : isError ? (
              <div className="empty-state empty-state-error">
                <div className="empty-state-icon">⚠️</div>
                <h3>เกิดข้อผิดพลาดในการโหลดข้อมูล</h3>
                <p>โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่อีกครั้ง</p>
                <button
                  type="button"
                  className="btn-primary empty-retry-btn"
                  onClick={() => window.location.reload()}
                >
                  โหลดใหม่
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">{showExpired ? "⌛" : "📭"}</div>
                <h3>{showExpired ? "ยังไม่มีประกาศที่ปิดรับสมัครแล้ว" : "ไม่พบรายการที่ตรงกับเงื่อนไข"}</h3>
                <p>
                  {showExpired
                    ? "ประกาศงานทั้งหมดในขณะนี้ยังคงเปิดรับสมัครอยู่"
                    : "ลองเปลี่ยนคำค้นหา ปรับระดับวุฒิ หรือเลือกภูมิภาคใหม่"}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="empty-reset-btn"
                  >
                    <span>🔄</span> {showExpired ? "กลับไปดูงานที่เปิดรับอยู่" : "ล้างคำค้นหาและตัวกรองทั้งหมด"}
                  </button>
                )}
              </div>
            ) : (
              <>
                {currentJobs.map((job, i) => (
                  <JobCard
                    key={job.id ?? `idx-${i}`}
                    job={job}
                    layout={viewMode}
                    style={{ animationDelay: `${(i % PAGE_SIZE) * 0.05}s` }}
                    isAdmin={isAdmin}
                    onEdit={onEditJob}
                    onOpenPoster={setPosterJob}
                    onOpenShare={setShareJob}
                    userEducation={userEducation}
                    isBookmarked={isBookmarked(job.id)}
                    tracking={getJobTracking(job.id)}
                    onUpdateTracking={(updates) => updateJobTracking(job.id, updates, job)}
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

          {/* Clean Classic Pagination Controls */}
          {!isLoading && !isError && totalPages > 1 && (
            <nav className="pagination-wrapper" aria-label="การแบ่งหน้าประกาศ">
              <div className="pagination-info-badge">
                <span className="pagination-info-dot" />
                <span>
                  แสดง <strong>{rangeFrom.toLocaleString()}–{rangeTo.toLocaleString()}</strong> จาก <strong>{filtered.length.toLocaleString()}</strong> ประกาศ
                </span>
                <span className="pagination-info-sep">•</span>
                <span className="pagination-info-page">
                  หน้า <strong>{safePage}</strong> / {totalPages}
                </span>
              </div>

              <div className="pagination-nav-capsule">
                <button
                  type="button"
                  id="pagination-prev-btn"
                  className="pagination-btn pagination-btn-prev"
                  onClick={() => goToPage(safePage - 1)}
                  disabled={safePage === 1}
                  aria-label="ไปยังหน้าก่อนหน้า"
                >
                  <span className="pagination-arrow" aria-hidden="true">←</span>
                  <span className="pagination-btn-text">ก่อนหน้า</span>
                </button>

                <div className="pagination-numbers-group">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const p = i + 1;
                    if (p === 1 || p === totalPages || (p >= safePage - 1 && p <= safePage + 1)) {
                      const isActive = p === safePage;
                      return (
                        <button
                          type="button"
                          key={p}
                          className={`pagination-num-btn ${isActive ? "active" : ""}`}
                          aria-current={isActive ? "page" : undefined}
                          onClick={() => goToPage(p)}
                        >
                          {p}
                        </button>
                      );
                    } else if (p === safePage - 2 || p === safePage + 2) {
                      return <span key={`dots-${p}`} className="pagination-dots">…</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  type="button"
                  id="pagination-next-btn"
                  className="pagination-btn pagination-btn-next"
                  onClick={() => goToPage(safePage + 1)}
                  disabled={safePage === totalPages}
                  aria-label="ไปยังหน้าถัดไป"
                >
                  <span className="pagination-btn-text">ถัดไป</span>
                  <span className="pagination-arrow" aria-hidden="true">→</span>
                </button>
              </div>
            </nav>
          )}

          {/* Banner แนะนำหนังสือ & คอร์สเตรียมสอบ */}
          <div className="exam-prep-wrap">
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
