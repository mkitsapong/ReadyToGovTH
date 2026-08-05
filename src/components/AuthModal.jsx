import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.js";

export default function AuthModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
    } catch (err) {
      console.error(err);
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-up" style={{ maxWidth: 420 }} role="dialog" aria-modal="true">
        <div className="modal-header" style={{ padding: "24px 24px 16px", borderBottom: "1px solid rgba(226, 232, 240, 0.6)", background: "linear-gradient(135deg, var(--gray-50), var(--white))" }}>
          <h2 className="modal-title" style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--navy-800)" }}>🔐 เข้าสู่ระบบผู้ดูแลระบบ</h2>
          <button className="modal-close" onClick={onClose} style={{ top: 20, right: 20 }}>✕</button>
        </div>

        <div className="modal-body" style={{ padding: "24px" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--navy-300)", marginBottom: 24, lineHeight: 1.5 }}>
            เข้าสู่ระบบเพื่อจัดการประกาศงานราชการและหนังสือติวสอบ
          </p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">อีเมล Admin</label>
              <input
                id="auth-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
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
                padding: "8px 12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "var(--radius-md)",
                color: "#dc2626",
                fontSize: "0.82rem",
                marginBottom: 16,
              }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ marginTop: 32 }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: "1rem" }} 
                disabled={loading}
              >
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
