import { useState } from "react";
import { Link } from "react-router-dom";
import SEO from "./SEO.jsx";
import "./ContactPage.css";

export default function ContactPage() {
  const [copied, setCopied] = useState(false);
  const email = "readytogovth@gmail.com";
  const facebookUrl = "https://www.facebook.com/ReadyToGov/";

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText(email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <>
      <SEO
        title="ติดต่อเรา (Contact Us) | ReadyToGovTH"
        description="ช่องทางการติดต่อ ReadyToGovTH ศูนย์รวมประกาศรับสมัครงานภาครัฐไทย ติดต่อผ่าน Facebook Page หรือ Email"
      />

      <div className="contact-page-container container">
        {/* Breadcrumb / Back button */}
        <Link to="/" className="contact-back-link">
          <span className="back-arrow" aria-hidden="true">←</span>
          <span>กลับหน้าแรก</span>
        </Link>

        {/* Page Header */}
        <div className="contact-header">
          <div className="contact-header-badge">📬 ติดต่อสอบถาม</div>
          <h1 className="contact-title">ติดต่อเรา</h1>
          <p className="contact-subtitle">
            มีคำถาม ข้อเสนอแนะ หรือต้องการติดต่อทีมงาน <strong>ReadyToGovTH</strong> สามารถติดต่อเราได้ผ่านช่องทางด้านล่างนี้
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="contact-cards-grid">
          {/* 1. Facebook Card */}
          <div className="contact-card facebook-card">
            <div className="contact-card-icon facebook-icon-box" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <div className="contact-card-body">
              <div className="contact-card-tag">Official Page</div>
              <h2 className="contact-card-title">Facebook Page</h2>
              <p className="contact-card-desc">
                ติดตามข่าวสารงานราชการล่าสุด อัปเดตประกาศรับสมัครงานรายวัน หรือส่งข้อความพูดคุยกับทีมงานผ่าน Messenger
              </p>
              <div className="contact-card-value">facebook.com/ReadyToGov</div>
            </div>
            <div className="contact-card-actions">
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-contact-action btn-facebook"
              >
                <span>ไปยัง Facebook Page</span>
                <span aria-hidden="true">↗</span>
              </a>
              <a
                href="https://m.me/ReadyToGov"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-contact-secondary"
              >
                💬 ส่งข้อความ Messenger
              </a>
            </div>
          </div>

          {/* 2. Email Card */}
          <div className="contact-card email-card">
            <div className="contact-card-icon email-icon-box" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <div className="contact-card-body">
              <div className="contact-card-tag">Direct Email</div>
              <h2 className="contact-card-title">อีเมลติดต่อ</h2>
              <p className="contact-card-desc">
                สำหรับการติดต่ออย่างเป็นทางการ แจ้งปัญหาการใช้งานเว็บไซต์ หรือส่งข้อเสนอแนะเชิงเทคนิค
              </p>
              <div className="contact-card-value">{email}</div>
            </div>
            <div className="contact-card-actions">
              <a
                href={`mailto:${email}`}
                className="btn-contact-action btn-email"
              >
                <span>ส่งอีเมลถึงเรา</span>
                <span aria-hidden="true">✉️</span>
              </a>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="btn-contact-secondary"
              >
                {copied ? "คัดลอกเรียบร้อย! ✅" : "📋 คัดลอกที่อยู่อีเมล"}
              </button>
            </div>
          </div>
        </div>

        {/* Important Notice Box */}
        <div className="contact-notice-box">
          <div className="contact-notice-icon">ℹ️</div>
          <div className="contact-notice-content">
            <h3>คำชี้แจงเกี่ยวกับการสมัครงาน</h3>
            <p>
              <strong>ReadyToGovTH</strong> เป็นแพลตฟอร์มรวบรวมและประชาสัมพันธ์ประกาศรับสมัครงานภาครัฐเพื่ออำนวยความสะดวกแก่ประชาชน 
              ไม่ได้เป็นหน่วยงานรับสมัครโดยตรง หากท่านต้องการสมัครงาน กรุณาตรวจสอบรายละเอียดและดำเนินการตามระเบียบการของหน่วยงานต้นสังกัดที่ระบุไว้ในเอกสารประกาศ
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
