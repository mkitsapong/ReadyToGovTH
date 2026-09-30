import { useState } from "react";
import { loginAdmin } from "../services/authService.js";
import { isFirebaseConfigured } from "../firebase.js";

export default function AuthModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState(!isFirebaseConfigured ? "admin@readytogov.th" : "");
  const [password, setPassword] = useState(!isFirebaseConfigured ? "admin1234" : "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    setError("");

    if (isFirebaseConfigured && (!email || !password)) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    setLoading(true);
    try {
      const user = await loginAdmin(email || "admin@readytogov.th", password || "admin1234");
      if (onSuccess) onSuccess(user);
      onClose();
    } catch (err) {
      console.error("Login failed:", err);
      let errMsg = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
      if (err?.code === "auth/invalid-credential" || err?.code === "auth/wrong-password") {
        errMsg = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
      } else if (err?.code === "auth/user-not-found") {
        errMsg = "ไม่พบบัญชีผู้ใช้นี้ในระบบ Firebase";
      } else if (err?.code === "auth/too-many-requests") {
        errMsg = "พยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง";
      } else if (err?.code === "auth/invalid-api-key") {
        errMsg = "Firebase API Key ในไฟล์ .env ไม่ถูกต้อง กรุณาตรวจสอบ";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-up" style={{ maxWidth: 440 }} role="dialog" aria-modal="true">
        <div className="modal-header" style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(226, 232, 240, 0.6)", background: "linear-gradient(135deg, var(--gray-50), var(--white))" }}>
          <h2 className="modal-title" style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--navy-800)", display: "flex", alignItems: "center", gap: 8 }}>
            <span>🔐</span> เข้าสู่ระบบผู้ดูแลระบบ (Admin)
          </h2>
          <button className="modal-close" onClick={onClose} style={{ top: 18, right: 18 }}>✕</button>
        </div>

        <div className="modal-body" style={{ padding: "20px 24px" }}>
          {!isFirebaseConfigured ? (
            <div style={{
              background: "#fffbeb",
              border: "1.5px solid #fde68a",
              borderRadius: "var(--radius-lg)",
              padding: "12px 14px",
              marginBottom: "18px",
              fontSize: "0.82rem",
              color: "#92400e",
              lineHeight: 1.5,
            }}>
              <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span>💡</span> กำลังทำงานในโหมดทดสอบ (Local Dev)
              </div>
              ยังไม่พบการตั้งค่าในไฟล์ <code>.env</code> คุณสามารถกดปุ่ม <strong>"เข้าสู่ระบบ Admin ทันที"</strong> เพื่อเปิดใช้งานหน้า Admin Panel และทดสอบฟังก์ชันจัดการงานได้เลยครับ
            </div>
          ) : (
            <p style={{ fontSize: "0.85rem", color: "var(--navy-300)", marginBottom: 20, lineHeight: 1.5 }}>
              เข้าสู่ระบบผ่าน Firebase Auth เพื่อจัดการประกาศงานราชการและหนังสือติวสอบ
            </p>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">อีเมล Admin</label>
              <input
                id="auth-email"
                type="email"
                className="form-input"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus={isFirebaseConfigured}
              />
            </div>

            <div className="form-group">
              <label className="form-label">รหัสผ่าน Admin</label>
              <input
                id="auth-password"
                type="password"
                className="form-input"
                placeholder="กรอกรหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div style={{
                padding: "10px 14px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "var(--radius-md)",
                color: "#dc2626",
                fontSize: "0.84rem",
                marginBottom: 16,
              }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "0.95rem", fontWeight: 700 }} 
                disabled={loading}
              >
                {loading
                  ? "กำลังเข้าสู่ระบบ..."
                  : !isFirebaseConfigured
                    ? "🔑 เข้าสู่ระบบ Admin (โหมดทดสอบ)"
                    : "เข้าสู่ระบบ"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
