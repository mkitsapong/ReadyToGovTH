import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookieConsent", "rejected");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      width: "calc(100% - 48px)",
      maxWidth: 800,
      background: "var(--white)",
      boxShadow: "0 10px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
      borderRadius: "var(--radius-xl)",
      padding: "20px 24px",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      <div>
        <h4 style={{ margin: "0 0 8px 0", color: "var(--navy-800)", display: "flex", alignItems: "center", gap: 8 }}>
          <span>🍪</span> นโยบายคุกกี้
        </h4>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--navy-600)", lineHeight: 1.5 }}>
          เราใช้คุกกี้เพื่อพัฒนาประสิทธิภาพ และประสบการณ์ที่ดีในการใช้เว็บไซต์ของคุณ คุณสามารถศึกษารายละเอียดได้ที่ <Link to="/policy/cookies" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>นโยบายการใช้คุกกี้</Link>
        </p>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button 
          onClick={handleReject}
          style={{
            padding: "8px 20px",
            background: "transparent",
            border: "1px solid var(--gray-300)",
            borderRadius: "var(--radius-md)",
            color: "var(--navy-600)",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--gray-100)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          ปฏิเสธ
        </button>
        <button 
          onClick={handleAccept}
          style={{
            padding: "8px 20px",
            background: "var(--accent)",
            border: "none",
            borderRadius: "var(--radius-md)",
            color: "white",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(234, 88, 12, 0.3)",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(234, 88, 12, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(234, 88, 12, 0.3)";
          }}
        >
          ยอมรับทั้งหมด
        </button>
      </div>
    </div>
  );
}
