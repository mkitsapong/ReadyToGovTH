import { useState, useEffect } from "react";
import { useTheme } from "../hooks/useTheme.js";
import { useApplicationTracker } from "../hooks/useApplicationTracker.js";

export default function Header({
  activePage,
  onNavigate,
  user,
  onLogout,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { isDark, toggleTheme } = useTheme();
  const { stats } = useApplicationTracker();
  const trackerCount = stats?.total || 0;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (pageId) => {
    onNavigate(pageId);
    setIsMobileMenuOpen(false);
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
            <img
              src="/logo.png"
              alt="ReadyToGovTH Logo"
              className="header-logo-img"
              width="40"
              height="40"
            />
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

            {/* 2. สถิติ */}
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
