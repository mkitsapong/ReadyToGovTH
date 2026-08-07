export default function Footer({ onNavigate, onLoginClick, user }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-compact">
          {/* Brand */}
          <div className="footer-brand-compact">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src="/favicon.svg" alt="Logo" style={{ width: "24px", height: "24px", objectFit: "contain", flexShrink: 0 }} />
              <span style={{ color: "var(--white)", fontWeight: 700, fontSize: "0.95rem" }}>
                ReadyToGovTH
              </span>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", color: "var(--navy-400)", lineHeight: 1.5 }}>
              รวมประกาศรับสมัครงานภาครัฐ อัปเดตข้อมูลตรงจากหน่วยงาน
            </p>
          </div>

          {/* Nav / Policies */}
          <div className="footer-links-compact">
            <button onClick={() => onNavigate("home")}>ค้นหางาน</button>
            <span className="dot">•</span>
            <button onClick={() => onNavigate("policy/privacy")}>นโยบายความเป็นส่วนตัว</button>
            <span className="dot">•</span>
            <button onClick={() => onNavigate("policy/terms")}>เงื่อนไขการให้บริการ</button>
            <span className="dot">•</span>
            <button onClick={() => onNavigate("policy/cookies")}>นโยบายการใช้คุกกี้</button>
            <span className="dot">•</span>
            <button onClick={() => window.location.href = "mailto:readytogovth@gmail.com"} title="ส่งอีเมลติดต่อเรา: readytogovth@gmail.com">ติดต่อเรา</button>
          </div>
        </div>

        <hr className="footer-divider" style={{ margin: "20px 0 16px" }} />

        <div className="footer-bottom">
          <p>© 2026 ReadyToGovTH</p>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <p style={{ display: "flex", gap: 6, alignItems: "center", margin: 0 }}>
              <span style={{ color: "var(--accent)" }}>🇹🇭</span>
              <span>Made for Thai Civil Servants</span>
            </p>
            {!user && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLoginClick();
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--navy-400)",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                  opacity: 0.6,
                  transition: "opacity 0.2s",
                  padding: 0
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
              >
                🔐 ระบบจัดการ
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
