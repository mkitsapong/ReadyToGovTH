import { useState } from "react";
import { Link } from "react-router-dom";

function getConsentStatus() {
  try {
    return localStorage.getItem("cookieConsent");
  } catch {
    return null;
  }
}

function setConsentStatus(value) {
  try {
    localStorage.setItem("cookieConsent", value);
  } catch {
    // Ignore storage errors (e.g. private browsing, quota exceeded)
  }
}

export default function ConsentNotice() {
  const [isVisible, setIsVisible] = useState(() => !getConsentStatus());

  const handleAccept = () => {
    setConsentStatus("accepted");
    setIsVisible(false);
  };

  const handleReject = () => {
    setConsentStatus("rejected");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-consent-banner" role="region" aria-label="การตั้งค่าคุกกี้">
      <div className="cookie-consent-content">
        <h4 className="cookie-consent-title">
          <span>🍪</span> นโยบายคุกกี้
        </h4>
        <p className="cookie-consent-text">
          เราใช้คุกกี้เพื่อพัฒนาประสิทธิภาพ และประสบการณ์ที่ดีในการใช้เว็บไซต์ของคุณ คุณสามารถศึกษารายละเอียดได้ที่{" "}
          <Link to="/policy/cookies" className="cookie-consent-link">
            นโยบายการใช้คุกกี้
          </Link>
        </p>
      </div>
      <div className="cookie-consent-actions">
        <button 
          type="button"
          onClick={handleReject}
          className="cookie-consent-btn cookie-consent-btn-reject"
        >
          ปฏิเสธ
        </button>
        <button 
          type="button"
          onClick={handleAccept}
          className="cookie-consent-btn cookie-consent-btn-accept"
        >
          ยอมรับทั้งหมด
        </button>
      </div>
    </div>
  );
}
