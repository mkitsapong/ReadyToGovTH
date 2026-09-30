import { Link } from "react-router-dom";
import SEO from "./SEO.jsx";

export default function NotFoundPage() {
  return (
    <>
      <SEO title="ไม่พบหน้าที่ค้นหา (404)" description="ไม่พบหน้าที่คุณค้นหา — กลับไปหน้าหลัก ReadyToGovTH" />
      <div className="container" style={{ paddingTop: "80px", paddingBottom: "80px", textAlign: "center" }}>
        <div
          style={{
            maxWidth: 520,
            margin: "0 auto",
            padding: "56px 32px",
            background: "var(--white)",
            borderRadius: "var(--radius-2xl)",
            border: "1px solid var(--gray-200)",
            boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div style={{ fontSize: "4.5rem", marginBottom: 16, lineHeight: 1 }}>🔍</div>
          <h1
            style={{
              fontSize: "3rem",
              fontWeight: 800,
              color: "var(--navy-800)",
              marginBottom: 8,
              letterSpacing: "-0.02em",
            }}
          >
            404
          </h1>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--navy-700)",
              marginBottom: 12,
            }}
          >
            ไม่พบหน้าที่คุณค้นหา
          </h2>
          <p
            style={{
              color: "var(--navy-400)",
              fontSize: "0.92rem",
              lineHeight: 1.6,
              marginBottom: 28,
              maxWidth: 380,
              margin: "0 auto 28px",
            }}
          >
            ขออภัย ไม่พบหน้าที่คุณต้องการ
            อาจมีการเปลี่ยนแปลง URL หรือหน้านี้ถูกลบออกจากระบบแล้ว
          </p>
          <Link
            to="/"
            className="btn btn-primary"
            style={{
              padding: "12px 28px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: "0.95rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            ← กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </>
  );
}
