import { useState, useEffect, useRef } from "react";
import { useTheme } from "../hooks/useTheme.js";
import { useApplicationTracker } from "../hooks/useApplicationTracker.js";

const CATEGORY_ITEMS = [
  { id: "civil",      label: "ข้าราชการ",             icon: "🏛️", desc: "สอบบรรจุรับราชการ ภาค ก-ข-ค" },
  { id: "government", label: "พนักงานราชการ",         icon: "📋", desc: "สัญญาจ้างตามกรอบ ไม่ต้องผ่าน ภาค ก" },
  { id: "state",      label: "รัฐวิสาหกิจ",            icon: "🏢", desc: "รัฐวิสาหกิจและองค์กรของรัฐ" },
  { id: "temp",       label: "ลูกจ้างชั่วคราว",         icon: "📝", desc: "ลูกจ้างตามภารกิจ / สัญญาจ้าง" },
  { id: "agency",     label: "พนักงานหน่วยงานของรัฐ",   icon: "🏫", desc: "องค์การมหาชน / หน่วยงานอิสระ" },
];

export default function Header({
  activePage,
  onNavigate,
  user,
  onLogout,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const categoryDropdownRef = useRef(null);

  const { isDark, toggleTheme } = useTheme();
  const { stats } = useApplicationTracker();
  const trackerCount = stats?.total || 0;

  const isCategoryActive = CATEGORY_ITEMS.some((cat) => cat.id === activePage);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close category dropdown on click outside or Escape
  useEffect(() => {
    if (!isCategoryOpen) return;
    const handleClickOutside = (e) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
        setIsCategoryOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsCategoryOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCategoryOpen]);

  const handleNavClick = (pageId) => {
    onNavigate(pageId);
    setIsMobileMenuOpen(false);
    setIsCategoryOpen(false);
  };

  return (
    <header className={`header ${isMobileMenuOpen ? "menu-open" : ""} ${isScrolled ? "scrolled" : ""}`}>
      <div className="container">
        {/* Main nav row */}
        <div className="header-inner">
          {/* Logo */}
          <a
            className="logo"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick("home");
            }}
            href="/"
            style={{ cursor: "pointer" }}
          >
            <img src="/favicon.svg" alt="Logo" style={{ width: "44px", height: "44px", objectFit: "contain", flexShrink: 0 }} />
            <div className="logo-text">
              <span>ReadyToGovTH</span>
              <span>งานราชการไทย</span>
            </div>
          </a>

          {/* Mobile Right Controls: Theme Toggle + Hamburger */}
          <div className="mobile-header-controls">
            <button
              type="button"
              className={`theme-pill-switch mobile-theme-switch ${isDark ? "dark" : "light"}`}
              onClick={toggleTheme}
              role="switch"
              aria-checked={isDark}
              title={isDark ? "สลับเป็นโหมดสว่าง (Light Mode)" : "สลับเป็นโหมดมืด (Dark Mode)"}
              aria-label={isDark ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"}
            >
              <span className="theme-switch-track">
                <span className="theme-switch-icon-sun" aria-hidden="true">☀️</span>
                <span className="theme-switch-icon-moon" aria-hidden="true">🌙</span>
                <span className="theme-switch-knob">
                  <span className="theme-knob-icon">{isDark ? "🌙" : "☀️"}</span>
                </span>
              </span>
            </button>

            {/* Hamburger button (visible on mobile) */}
            <button 
              className="mobile-menu-btn" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                {isMobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </>
                ) : (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </>
                )}
              </svg>
            </button>
          </div>

          {/* Nav links */}
          <nav className="nav">
            {/* 1. หน้าแรก */}
            <button
              key="home"
              className={`nav-link${activePage === "home" ? " active" : ""}`}
              onClick={() => handleNavClick("home")}
            >
              {activePage === "home" && <span className="nav-dot" />}
              หน้าแรก
            </button>

            {/* 2. หมวดหมู่ย่อย / ประเภทงาน Dropdown */}
            <div className="nav-dropdown-wrapper" ref={categoryDropdownRef}>
              <button
                type="button"
                className={`nav-link nav-dropdown-trigger${isCategoryActive ? " active" : ""}${isCategoryOpen ? " is-open" : ""}`}
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                aria-expanded={isCategoryOpen}
                aria-haspopup="true"
                title="เลือกประเภทงานราชการ"
              >
                {isCategoryActive && <span className="nav-dot" />}
                <span>ประเภทงาน</span>
                <span className={`dropdown-caret ${isCategoryOpen ? "rotated" : ""}`}>▾</span>
              </button>

              <div className={`nav-dropdown-menu ${isCategoryOpen ? "is-open" : ""}`}>
                {CATEGORY_ITEMS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`nav-dropdown-item ${activePage === cat.id ? "active" : ""}`}
                    onClick={() => handleNavClick(cat.id)}
                    title={cat.desc}
                  >
                    <span className="dropdown-item-icon">{cat.icon}</span>
                    {cat.label}
                    {activePage === cat.id && <span className="dropdown-item-check">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. สถิติ */}
            <button
              key="stats"
              className={`nav-link${activePage === "stats" ? " active" : ""}`}
              onClick={() => handleNavClick("stats")}
            >
              {activePage === "stats" && <span className="nav-dot" />}
              สถิติ
            </button>

            {/* 4. ติดตามงาน */}
            <button
              key="tracker"
              className={`nav-link${activePage === "tracker" ? " active" : ""}`}
              onClick={() => handleNavClick("tracker")}
            >
              {activePage === "tracker" && <span className="nav-dot" />}
              ติดตามงาน
              {trackerCount > 0 && (
                <span className="nav-counter-pill">{trackerCount}</span>
              )}
            </button>

            {/* Mobile Drawer Theme Switcher */}
            <div className="mobile-drawer-theme-wrapper">
              <div className="drawer-theme-row">
                <span className="drawer-theme-label">
                  {isDark ? "โหมดมืด (Dark Mode)" : "โหมดสว่าง (Light Mode)"}
                </span>
                <button
                  type="button"
                  className={`theme-pill-switch ${isDark ? "dark" : "light"}`}
                  onClick={() => {
                    toggleTheme();
                    setIsMobileMenuOpen(false);
                  }}
                  role="switch"
                  aria-checked={isDark}
                  aria-label={isDark ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"}
                >
                  <span className="theme-switch-track">
                    <span className="theme-switch-icon-sun" aria-hidden="true">☀️</span>
                    <span className="theme-switch-icon-moon" aria-hidden="true">🌙</span>
                    <span className="theme-switch-knob">
                      <span className="theme-knob-icon">{isDark ? "🌙" : "☀️"}</span>
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </nav>

          {/* Auth controls & Day/Night toggle switch */}
          <div className="header-actions">
            {/* Day / Night Pill Toggle Switch (Desktop) */}
            <button
              type="button"
              className={`theme-pill-switch desktop-theme-switch ${isDark ? "dark" : "light"}`}
              onClick={toggleTheme}
              role="switch"
              aria-checked={isDark}
              title={isDark ? "สลับเป็นโหมดสว่าง (Light Mode)" : "สลับเป็นโหมดมืด (Dark Mode)"}
              aria-label={isDark ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"}
            >
              <span className="theme-switch-track">
                <span className="theme-switch-icon-sun" aria-hidden="true">☀️</span>
                <span className="theme-switch-icon-moon" aria-hidden="true">🌙</span>
                <span className="theme-switch-knob">
                  <span className="theme-knob-icon">{isDark ? "🌙" : "☀️"}</span>
                </span>
              </span>
            </button>

            {user && (
              <>
                <div className={`header-role-badge ${user.role}`} style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                  <span>{user.name === "Admin" ? "ผู้ดูแลระบบ" : user.name}</span>
                </div>
                <button className="header-btn header-btn-logout" onClick={onLogout} style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                  ออกจากระบบ
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
