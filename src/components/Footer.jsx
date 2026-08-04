export default function Footer({ onNavigate, onLoginClick, user }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{
                width: 36, height: 36,
                background: "linear-gradient(135deg, var(--accent), var(--orange-300))",
                borderRadius: "var(--radius-md)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.1rem",
              }}>🏛️</div>
              <span style={{ color: "var(--white)", fontWeight: 700, fontSize: "1.1rem" }}>
                ReadyToGovTH
              </span>
            </div>
            <p>
              ศูนย์รวมประกาศรับสมัครงานภาครัฐไทย ข้าราชการ พนักงานราชการ
              และรัฐวิสาหกิจ อัปเดตข้อมูลตรงจากหน่วยงานภาครัฐ
            </p>
          </div>

          {/* Nav Categories */}
          <div className="footer-col">
            <h4>หมวดหมู่ งานราชการ</h4>
            <ul>
              <li><button onClick={() => onNavigate("civil")}>🏛️ ข้าราชการ</button></li>
              <li><button onClick={() => onNavigate("government")}>📋 พนักงานราชการ</button></li>
              <li><button onClick={() => onNavigate("state")}>🏢 รัฐวิสาหกิจ</button></li>
              <li><button onClick={() => onNavigate("home")}>🔍 ประกาศทั้งหมด</button></li>
            </ul>
          </div>

          {/* Social Media */}
          <div className="footer-col">
            <h4>ติดตามเราได้ที่</h4>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
              {/* Facebook Icon Button */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                title="Facebook Page"
                aria-label="Facebook Page"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#1877f2";
                  e.currentTarget.style.borderColor = "#1877f2";
                  e.currentTarget.style.transform = "translateY(-3px) scale(1.08)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(24,119,242,0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* TikTok Icon Button */}
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                title="TikTok Channel"
                aria-label="TikTok Channel"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#000000";
                  e.currentTarget.style.borderColor = "#fe2c55";
                  e.currentTarget.style.transform = "translateY(-3px) scale(1.08)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(254,44,85,0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-2.22V8.2a6.34 6.34 0 0 0-5.1 1.76A6.34 6.34 0 0 0 2.5 15.68a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.66a8.27 8.27 0 0 0 4.41 1.34V7.55a4.85 4.85 0 0 1-3.04-1.76l-.01.9z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <hr className="footer-divider" />
        <div className="footer-bottom">
          <p>© 2026 ReadyToGovTH · สงวนลิขสิทธิ์ · ข้อมูลอ้างอิงจากประกาศทางราชการ</p>
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
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
              >
                🔐 ระบบจัดการ (Admin)
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
