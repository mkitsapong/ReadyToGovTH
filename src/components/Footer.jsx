export default function Footer({ onNavigate, onLoginClick, user }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <img src="/favicon.svg" alt="Logo" style={{ width: "36px", height: "36px", objectFit: "contain", flexShrink: 0 }} />
              <span style={{ color: "var(--white)", fontWeight: 700, fontSize: "1.1rem" }}>
                ReadyToGovTH
              </span>
            </div>
            <p>
              ศูนย์รวมประกาศรับสมัครงานภาครัฐไทย ข้าราชการ พนักงานราชการ
              รัฐวิสาหกิจ และลูกจ้างชั่วคราว
              <br />
              อัปเดตข้อมูลตรงจากหน่วยงานภาครัฐ
            </p>
          </div>

          {/* Nav Categories */}
          <div className="footer-col">
            <h4>หมวดหมู่ งานราชการ</h4>
            <ul>
              <li><button onClick={() => onNavigate("civil")}>🏛️ ข้าราชการ</button></li>
              <li><button onClick={() => onNavigate("government")}>📋 พนักงานราชการ</button></li>
              <li><button onClick={() => onNavigate("state")}>🏢 รัฐวิสาหกิจ</button></li>
              <li><button onClick={() => onNavigate("temp")}>📝 ลูกจ้างชั่วคราว</button></li>
              <li><button onClick={() => onNavigate("home")}>🔍 ประกาศทั้งหมด</button></li>
            </ul>
          </div>

          {/* Policies */}
          <div className="footer-col">
            <h4>นโยบายของเว็บไซต์</h4>
            <ul>
              <li><button onClick={() => onNavigate("policy/privacy")}>🔒 นโยบายความเป็นส่วนตัว</button></li>
              <li><button onClick={() => onNavigate("policy/terms")}>📄 เงื่อนไขการให้บริการ</button></li>
              <li><button onClick={() => onNavigate("policy/cookies")}>🍪 นโยบายการใช้คุกกี้</button></li>
            </ul>
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
