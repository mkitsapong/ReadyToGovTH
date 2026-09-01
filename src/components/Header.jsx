import { useState, useEffect } from "react";

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
          <a className="logo" onClick={(e) => { e.preventDefault(); onNavigate("home"); }} href="/" style={{ cursor: "pointer" }}>
            <img src="/favicon.svg" alt="Logo" style={{ width: "48px", height: "48px", objectFit: "contain", flexShrink: 0 }} />
            <div className="logo-text">
              <span>ReadyToGovTH</span>
              <span>งานราชการไทย</span>
            </div>
          </a>

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

          {/* Nav links */}
          <nav className="nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`nav-link${activePage === item.id ? " active" : ""}`}
                onClick={() => onNavigate(item.id)}
              >
                {activePage === item.id && <span className="nav-dot" />}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Auth or Live badge & Date */}
          <div className="header-actions" style={{ marginLeft: 16, display: "flex", alignItems: "center", gap: 10 }}>
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
