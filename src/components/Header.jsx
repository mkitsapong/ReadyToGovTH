import { useState, useEffect } from "react";
import { useTheme } from "../hooks/useTheme.js";

const NAV_ITEMS = [
  { id: "home",       label: "หน้าแรก" },
  { id: "civil",      label: "ข้าราชการ" },
  { id: "government", label: "พนักงานราชการ" },
  { id: "state",      label: "รัฐวิสาหกิจ" },
  { id: "temp",       label: "ลูกจ้างชั่วคราว" },
  { id: "agency",     label: "พนักงานหน่วยงานของรัฐ" },
];

export default function Header({
  activePage,
  onNavigate,
  user,
  onLogout,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
    <header className={`header ${isMobileMenuOpen ? "menu-open" : ""} ${isScrolled ? "scrolled" : ""}`}>
      <div className="container">
        {/* Main nav row */}
        <div className="header-inner">
          {/* Logo */}
          <a className="logo" onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); onNavigate("home"); }} href="/" style={{ cursor: "pointer" }}>
            <img src="/favicon.svg" alt="Logo" style={{ width: "48px", height: "48px", objectFit: "contain", flexShrink: 0 }} />
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
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`nav-link${activePage === item.id ? " active" : ""}`}
                onClick={() => {
                  onNavigate(item.id);
                  setIsMobileMenuOpen(false);
                }}
              >
                {activePage === item.id && <span className="nav-dot" />}
                {item.label}
              </button>
            ))}

            {/* Mobile Drawer Theme Switcher */}
            <div className="mobile-drawer-theme-wrapper">
              <div className="drawer-theme-row">
                <span className="drawer-theme-label">
                  {isDark ? "🌙 โหมดมืด (Dark Mode)" : "☀️ โหมดสว่าง (Light Mode)"}
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

          {/* Auth or Live badge & Date */}
          <div className="header-actions" style={{ marginLeft: 16, display: "flex", alignItems: "center", gap: 10 }}>
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

            {/* Today Thai Date */}
            <div className="header-date-badge" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "999px",
              fontSize: "0.76rem",
              color: "var(--white)",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}>
              <span style={{ color: "var(--accent)" }}>📅</span>
              <span>
                {new Date().toLocaleDateString("th-TH", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            {user && (
              <>
                <div className={`header-role-badge ${user.role}`} style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                  <span>👑</span>
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
    </>
  );
}
