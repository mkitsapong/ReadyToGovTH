import { useState, useEffect } from "react";
import QRCode from "qrcode";
import "./ShareModal.css";
import {
  getJobOgImageUrl,
  getJobDeepLink,
  buildShareSummaryText,
  getSocialShareLinks,
} from "../utils/shareHelper.js";
import { getTotalJobPositions, formatDate } from "../utils/helpers.js";
import { trackJobShare } from "../services/analyticsService.js";

// Clean Vector SVGs for crisp, modern rendering
const SvgShare = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const SvgLine = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.365 9.864c0-4.04-4.2-7.327-9.365-7.327S.635 5.824.635 9.864c0 3.618 3.22 6.643 7.575 7.185.295.064.697.195.798.448.092.23.06.59.03.823l-.13 1.056c-.04.32-.2 1.25.9 0 .88-1 4.74-5.59 6.47-7.58 1.95-2.22 3.087-.93 3.087-1.932zm-12.7 1.554h-1.63a.47.47 0 0 1-.47-.47V7.63c0-.26.21-.47.47-.47h1.63c.26 0 .47.21.47.47v.47a.47.47 0 0 1-.47.47h-1.16v.63h1.16c.26 0 .47.21.47.47v.47a.47.47 0 0 1-.47.47zm2.74 0h-.63a.47.47 0 0 1-.47-.47V7.63c0-.26.21-.47.47-.47h.63c.26 0 .47.21.47.47v3.318a.47.47 0 0 1-.47.47zm3.84 0h-.63a.47.47 0 0 1-.47-.47l-1.63-2.31v2.31a.47.47 0 0 1-.47.47h-.63a.47.47 0 0 1-.47-.47V7.63c0-.26.21-.47.47-.47h.63c.26 0 .47.21.47.47l1.63 2.32V7.63c0-.26.21-.47.47-.47h.63c.26 0 .47.21.47.47v3.318a.47.47 0 0 1-.47.47zm3.32-2.388h-1.39v.47h1.39c.26 0 .47.21.47.47v.47a.47.47 0 0 1-.47.47h-2.02a.47.47 0 0 1-.47-.47V7.63c0-.26.21-.47.47-.47h2.02c.26 0 .47.21.47.47v.47a.47.47 0 0 1-.47.47h-1.39v.47h1.39c.26 0 .47.21.47.47v.47a.47.47 0 0 1-.47.47z" />
  </svg>
);

const SvgFacebook = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const SvgX = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const SvgSystemShare = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const SvgCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SvgCopy = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export default function ShareModal({ job, onClose, onToast }) {
  const [activeTab, setActiveTab] = useState("preview"); // 'preview' | 'line' | 'qrcode'
  const [includeUtm, setIncludeUtm] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isCopiedSummary, setIsCopiedSummary] = useState(false);
  const [isCaptionOpen, setIsCaptionOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [isImageLoading, setIsImageLoading] = useState(true);

  const deepLink = job ? getJobDeepLink(job, {
    utmSource: includeUtm ? "share_button" : undefined,
    utmMedium: includeUtm ? "social_deep_link" : undefined,
  }) : "";

  const ogImageUrl = job ? getJobOgImageUrl(job) : "";
  const socialLinks = job ? getSocialShareLinks(job, deepLink) : [];
  const summaryText = job ? buildShareSummaryText(job, deepLink) : "";
  const totalCount = job ? getTotalJobPositions(job) : 0;

  // Generate QR Code with high resolution & custom color
  useEffect(() => {
    if (!deepLink) return;
    let isMounted = true;
    QRCode.toDataURL(
      deepLink,
      {
        width: 360,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      },
      (err, url) => {
        if (!err && isMounted) {
          setQrCodeDataUrl(url);
        }
      }
    );
    return () => {
      isMounted = false;
    };
  }, [deepLink]);

  if (!job) return null;

  // Copy Deep Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(deepLink);
      setIsCopiedLink(true);
      trackJobShare(job, "copy_link");
      if (onToast) onToast("คัดลอก Deep Link สำเร็จแล้ว 🔗 พร้อมส่งต่อ!", "success");
      setTimeout(() => setIsCopiedLink(false), 2500);
    } catch {
      alert("ไม่สามารถคัดลอกได้อัตโนมัติ กรุณากดเลือกข้อความและคัดลอกด้วยตนเอง");
    }
  };

  // Copy Summary text
  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setIsCopiedSummary(true);
      trackJobShare(job, "copy_summary");
      if (onToast) onToast("คัดลอกข้อความสรุปพร้อมลิงก์แล้ว 📋 วางลงแชทได้ทันที!", "success");
      setTimeout(() => setIsCopiedSummary(false), 2500);
    } catch {
      alert("ไม่สามารถคัดลอกได้อัตโนมัติ กรุณากดเลือกข้อความและคัดลอกด้วยตนเอง");
    }
  };

  // Native Web Share
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `เปิดรับสมัครงาน: ${job.department}`,
          text: `เปิดรับสมัครงาน ${job.department} รวม ${totalCount} อัตรา ปิดรับ ${job.deadline ? formatDate(job.deadline) : "เร็วๆ นี้"}`,
          url: deepLink,
        });
        trackJobShare(job, "native_share");
        if (onToast) onToast("แชร์สำเร็จแล้ว ✅", "success");
      } catch (err) {
        if (err.name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  // Download QR Code
  const handleDownloadQr = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement("a");
    a.href = qrCodeDataUrl;
    a.download = `readytogov-qr-${job.department.replace(/\s+/g, "-")}.png`;
    a.click();
    if (onToast) onToast("ดาวน์โหลด QR Code เรียบร้อยแล้ว 📷", "success");
  };

  return (
    <div
      className="share-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="share-modal-container">
        
        {/* Modal Header */}
        <div className="share-modal-header">
          <div className="share-header-left">
            <div className="share-header-icon-badge">
              <SvgShare />
            </div>
            <div className="share-header-title-wrap">
              <div className="share-header-title-row">
                <h2 className="share-header-title">แชร์ประกาศงาน</h2>
                <span className="share-header-badge">✨ Dynamic Preview</span>
              </div>
              <p className="share-header-subtitle">
                สร้างลิงก์ตรงและภาพพรีวิวความคมชัดสูง ส่งต่อบน LINE, Facebook หรือ QR Code
              </p>
            </div>
          </div>
          <button
            type="button"
            className="share-modal-close-btn"
            onClick={onClose}
            title="ปิดหน้าต่าง (Esc)"
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="share-modal-body">
          
          {/* Target Department Hero Card */}
          <div className="share-dept-hero-card">
            <div className="share-dept-hero-left">
              <div className="share-dept-avatar">🏛️</div>
              <div className="share-dept-info">
                <div className="share-dept-name" title={job.department}>
                  {job.department}
                </div>
                <div className="share-dept-meta-row">
                  <span>รวม {totalCount} อัตรา</span>
                  <span>•</span>
                  <span>ปิดรับ {job.deadline ? formatDate(job.deadline) : "ไม่ระบุ"}</span>
                </div>
              </div>
            </div>
            <span className="share-dept-badge">
              {job.categories?.[0] || job.category || "งานราชการ"}
            </span>
          </div>

          {/* Segmented Control Bar */}
          <div>
            <div className="share-preview-header">
              <label className="share-preview-label">
                <span>ภาพพรีวิวการแชร์ (Dynamic Preview)</span>
              </label>
              <div className="share-segmented-tabs">
                <button
                  type="button"
                  className={`share-segmented-tab ${activeTab === "preview" ? "active" : ""}`}
                  onClick={() => setActiveTab("preview")}
                >
                  <span>🖼️</span>
                  <span>การ์ด OG HD</span>
                </button>
                <button
                  type="button"
                  className={`share-segmented-tab ${activeTab === "line" ? "active" : ""}`}
                  onClick={() => setActiveTab("line")}
                >
                  <span>💬</span>
                  <span>แชท LINE</span>
                </button>
                <button
                  type="button"
                  className={`share-segmented-tab ${activeTab === "qrcode" ? "active" : ""}`}
                  onClick={() => setActiveTab("qrcode")}
                >
                  <span>📱</span>
                  <span>QR Code</span>
                </button>
              </div>
            </div>

            {/* TAB 1: OG Card Full Preview */}
            {activeTab === "preview" && (
              <div className="share-og-preview-card">
                {isImageLoading && (
                  <div className="share-og-loading-overlay">
                    <div className="share-spinner-glow" />
                    <span>กำลังประมวลผลการ์ดภาพคมชัดระดับ HD...</span>
                  </div>
                )}
                <img
                  src={ogImageUrl}
                  alt={`Open Graph preview for ${job.department}`}
                  className="share-og-preview-img"
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => setIsImageLoading(false)}
                />
                <a
                  href={ogImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-og-hd-btn"
                >
                  <span>🔍 ดูภาพขนาดเต็ม HD (1200×630)</span>
                </a>
              </div>
            )}

            {/* TAB 2: LINE / Social Chat Bubble Simulation */}
            {activeTab === "line" && (
              <div className="share-line-chat-canvas">
                <div className="share-line-chat-bubble">
                  <div className="share-line-sender-bar">
                    <div className="share-line-sender-info">
                      <div className="share-line-avatar">RG</div>
                      <span className="share-line-sender-name">
                        ReadyToGov.th
                        <span className="share-line-verified" title="Official Verified">✓</span>
                      </span>
                    </div>
                    <span className="share-line-time">12:20 น.</span>
                  </div>
                  <img
                    src={ogImageUrl}
                    alt="Social Card Preview"
                    style={{ width: "100%", aspectRatio: "1200 / 630", objectFit: "cover", display: "block" }}
                  />
                  <div className="share-line-card-content">
                    <div className="share-line-domain">readytogov.th</div>
                    <div className="share-line-title">
                      รับสมัครงาน: {job.department}
                    </div>
                    <div className="share-line-desc">
                      เปิดรับสมัครรวม {totalCount} อัตรา ดูคุณสมบัติ หลักสูตรวิชาสอบ และวิธีสมัครออนไลน์
                    </div>
                    <div className="share-line-action-btn">
                      <span>เปิดดูประกาศฉบับเต็ม</span>
                      <span>›</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: QR Code Generator */}
            {activeTab === "qrcode" && (
              <div className="share-qr-canvas">
                <div className="share-qr-frame">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="QR Code Deep Link" className="share-qr-img" />
                  ) : (
                    <div style={{ width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div className="share-spinner-glow" />
                    </div>
                  )}
                </div>
                <div className="share-qr-text-wrap">
                  <div className="share-qr-title">สแกนเพื่อเปิดบนมือถือได้ทันที</div>
                  <div className="share-qr-subtitle">
                    เหมาะสำหรับฉายบนจอโปรเจกเตอร์ หรือพรินต์ใส่ใบประกาศประชาสัมพันธ์
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="share-qr-download-btn"
                >
                  <span>💾</span>
                  <span>บันทึกรูป QR Code (PNG)</span>
                </button>
              </div>
            )}
          </div>

          {/* Deep Link URL Box */}
          <div>
            <div className="share-link-header">
              <label className="share-link-label">
                <span>🔗 Deep Link URL ตรง</span>
              </label>
              <label
                className={`share-utm-toggle ${includeUtm ? "active" : ""}`}
                title="เพิ่มพารามิเตอร์ UTM เพื่อวัดผลการเปิดอ่านผ่านเครื่องมือวิเคราะห์สถิติ"
              >
                <input
                  type="checkbox"
                  checked={includeUtm}
                  onChange={(e) => setIncludeUtm(e.target.checked)}
                />
                <span className="share-utm-switch-dot" />
                <span>แท็กสถิติ UTM</span>
              </label>
            </div>

            <div className="share-link-box">
              <span className="share-link-icon">🔗</span>
              <input
                type="text"
                readOnly
                value={deepLink}
                className="share-link-input"
                onClick={(e) => e.target.select()}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`share-copy-btn ${isCopiedLink ? "copied" : ""}`}
              >
                {isCopiedLink ? <SvgCheck /> : <SvgCopy />}
                <span>{isCopiedLink ? "คัดลอกแล้ว!" : "คัดลอกลิงก์"}</span>
              </button>
            </div>
          </div>

          {/* 1-Click Social Sharing Intent Buttons */}
          <div>
            <label className="share-link-label" style={{ marginBottom: 10 }}>
              <span>🚀 แชร์ด่วน 1 คลิก ไปยังโซเชียลมีเดีย</span>
            </label>
            <div className="share-social-grid">
              
              {/* LINE */}
              <a
                href={socialLinks.line}
                target="_blank"
                rel="noopener noreferrer"
                className="share-social-btn share-social-btn-line"
                title="ส่งต่อไปยังแชทหรือกลุ่ม LINE"
              >
                <SvgLine />
                <span>ส่งเข้า LINE</span>
              </a>

              {/* Facebook */}
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="share-social-btn share-social-btn-fb"
                title="แชร์ลง Facebook หน้าฟีดหรือกลุ่ม"
              >
                <SvgFacebook />
                <span>Facebook</span>
              </a>

              {/* X / Twitter */}
              <a
                href={socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="share-social-btn share-social-btn-x"
                title="โพสต์ทวีตบน X"
              >
                <SvgX />
                <span>ทวีตบน X</span>
              </a>

              {/* Native Web Share */}
              <button
                type="button"
                onClick={handleNativeShare}
                className="share-social-btn share-social-btn-native"
                title="แชร์ผ่านระบบปฏิบัติการมือถือ/คอมพิวเตอร์"
              >
                <SvgSystemShare />
                <span>แชร์อื่นๆ</span>
              </button>
            </div>
          </div>

          {/* Quick Summary Text Caption Box (Collapsible) */}
          <div className="share-caption-card">
            <div
              className="share-caption-header"
              onClick={() => setIsCaptionOpen((prev) => !prev)}
            >
              <span className="share-caption-title">
                <span>📝</span>
                <span>ข้อความสรุปสำหรับส่งในกลุ่มแชท</span>
              </span>
              <div className="share-caption-actions">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopySummary();
                  }}
                  className={`share-caption-copy-btn ${isCopiedSummary ? "copied" : ""}`}
                >
                  {isCopiedSummary ? <SvgCheck /> : <SvgCopy />}
                  <span>{isCopiedSummary ? "คัดลอกแล้ว" : "คัดลอกข้อความ"}</span>
                </button>
                <span className={`share-caption-chevron ${isCaptionOpen ? "expanded" : ""}`}>
                  ▼
                </span>
              </div>
            </div>
            {isCaptionOpen && (
              <div className="share-caption-content">
                <pre className="share-caption-pre">
                  {summaryText}
                </pre>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="share-modal-footer">
          <div className="share-footer-status">
            <span className="share-footer-dot" />
            <span>รองรับการ์ดพรีวิวอัตโนมัติบนทุกแพลตฟอร์ม</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="share-footer-close-btn"
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
}
