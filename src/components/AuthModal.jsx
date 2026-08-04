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
      <div className="modal animate-fade-up" style={{ maxWidth: 400 }} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title" style={{ fontSize: "1rem" }}>🔐 เข้าสู่ระบบผู้ดูแลระบบ (Admin)</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: "0.82rem", color: "var(--gray-500)", marginBottom: 16 }}>
            เข้าสู่ระบบเพื่อเพิ่ม แก้ไข หรือลบประกาศงานราชการและหนังสือติวสอบ
          </p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">อีเมล Admin</label>
              <input
                id="auth-email"
                type="email"
                className="form-input"
                placeholder="admin@readytogovth.com"
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

            <div className="modal-footer" style={{ padding: "0", paddingTop: 10 }}>
              <button type="button" className="btn btn-outline" onClick={onClose}>ยกเลิก</button>
              <button id="auth-submit-btn" type="submit" className="btn btn-accent" disabled={loading}>
                {loading ? "⏳ กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ Admin →"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
