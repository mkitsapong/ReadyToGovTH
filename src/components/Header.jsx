import { useState, useRef, useEffect } from "react";
import { regions } from "../data/provinces.js";

const NAV_ITEMS = [
  { id: "home",       label: "หน้าแรก" },
  { id: "civil",      label: "ข้าราชการ" },
  { id: "government", label: "พนักงานราชการ" },
  { id: "state",      label: "รัฐวิสาหกิจ" },
];

export default function Header({
  activePage,
  onNavigate,
  selectedProvince,
  onSelectProvince,
  user,
  onLoginClick,
  onLogout,
}) {
  const [activeRegion, setActiveRegion] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveRegion(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleRegionClick(regionId) {
    setActiveRegion(activeRegion === regionId ? null : regionId);
  }

  function handleProvinceClick(province) {
    onSelectProvince(province === selectedProvince ? null : province);
    setActiveRegion(null);
  }

  return (
    <header className="header">
      <div className="container">
        {/* Main nav row */}
        <div className="header-inner">
          {/* Logo */}
          <a className="logo" onClick={() => onNavigate("home")} href="#" style={{ cursor: "pointer" }}>
            <div className="logo-icon">🏛️</div>
            <div className="logo-text">
              <span>ReadyToGovTH</span>
              <span>งานราชการไทย</span>
            </div>
          </a>

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
            <div style={{
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

            {user ? (
              <>
                <div className={`header-role-badge ${user.role}`}>
                  <span>👑</span>
                  <span>{user.name} (Admin)</span>
                </div>
                <button className="header-btn header-btn-logout" onClick={onLogout}>
                  ออกจากระบบ
                </button>
              </>
            ) : (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "999px",
                fontSize: "0.76rem",
                color: "var(--navy-200)",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
                อัปเดตประกาศทุกวัน
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Region / Province search bar */}
      <div className="region-search-bar">
        <div className="container">
          <div className="region-search-inner" ref={dropdownRef}>
            <span className="region-label">📍 ค้นหาตามภาค:</span>

            <div className="region-pills">
              {regions.map((region) => (
                <div key={region.id} className="province-dropdown" style={{ position: "relative" }}>
                  <button
                    className={`region-pill${activeRegion === region.id ? " active" : ""}`}
                    onClick={() => handleRegionClick(region.id)}
                  >
                    {region.name}
                    <span style={{ marginLeft: 4, opacity: 0.7 }}>
                      {activeRegion === region.id ? "▲" : "▼"}
                    </span>
                  </button>

                  {activeRegion === region.id && (
                    <div className="province-dropdown-menu">
                      <div className="province-dropdown-header">{region.name}</div>
                      <div className="province-dropdown-list">
                        {region.provinces.map((prov) => (
                          <button
                            key={prov}
                            className={`province-item${selectedProvince === prov ? " selected" : ""}`}
                            onClick={() => handleProvinceClick(prov)}
                          >
                            {selectedProvince === prov ? "✓ " : ""}
                            {prov}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Active province tag */}
            {selectedProvince && (
              <div className="active-province-tag">
                <span>🏙 {selectedProvince}</span>
                <button onClick={() => onSelectProvince(null)} title="ล้างการเลือก">✕</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
