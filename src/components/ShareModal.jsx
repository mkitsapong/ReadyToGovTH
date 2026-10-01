import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  getJobOgImageUrl,
  getJobDeepLink,
  buildShareSummaryText,
  getSocialShareLinks,
} from "../utils/shareHelper.js";
import { getTotalJobPositions, formatDate } from "../utils/helpers.js";
import { trackJobShare } from "../services/analyticsService.js";

export default function ShareModal({ job, onClose, onToast }) {
  const [activeTab, setActiveTab] = useState("preview"); // 'preview' | 'line' | 'qrcode'
  const [includeUtm, setIncludeUtm] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isCopiedSummary, setIsCopiedSummary] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [isImageLoading, setIsImageLoading] = useState(true);

  if (!job) return null;

  const deepLink = getJobDeepLink(job, {
    utmSource: includeUtm ? "share_button" : undefined,
    utmMedium: includeUtm ? "social_deep_link" : undefined,
  });

  const ogImageUrl = getJobOgImageUrl(job);
  const socialLinks = getSocialShareLinks(job, deepLink);
  const summaryText = buildShareSummaryText(job, deepLink);
  const totalCount = getTotalJobPositions(job);

  // Generate QR Code
  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(
      deepLink,
      {
        width: 320,
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
      className="modal-overlay"
      style={{ zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal animate-fade-up share-modal-container"
        style={{
          maxWidth: 680,
          width: "100%",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "24px",
          overflow: "hidden",
          background: "var(--card-bg, #ffffff)",
          boxShadow: "0 25px 60px -10px rgba(15, 23, 42, 0.4)",
          border: "1px solid var(--border-color, rgba(226, 232, 240, 0.8))",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "18px 24px",
            background: "linear-gradient(135deg, #090e1a 0%, #0f172a 60%, #1e293b 100%)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "14px",
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.3rem",
                boxShadow: "0 4px 14px rgba(249, 115, 22, 0.4)",
              }}
            >
              🔗
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: 8 }}>
                แชร์ประกาศงาน (Deep Link & Dynamic OG)
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>
                แชร์ลิงก์ตรงไปยังตำแหน่งนี้ พร้อมการ์ดภาพพรีวิวอัตโนมัติบน LINE และ Facebook
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "none",
              color: "#cbd5e1",
              width: 34,
              height: 34,
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)"; e.currentTarget.style.color = "#ffffff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"; e.currentTarget.style.color = "#cbd5e1"; }}
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* Target Department Quick Pill */}
          <div
            style={{
              padding: "10px 16px",
              background: "var(--gray-50, #f8fafc)",
              borderRadius: "14px",
              border: "1px solid var(--border-color, #e2e8f0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>🏛️</span>
              <div style={{ minWidth: 0 }}>
                <strong style={{ fontSize: "0.92rem", color: "var(--navy-900, #0f172a)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {job.department}
                </strong>
                <div style={{ fontSize: "0.76rem", color: "var(--navy-500, #64748b)" }}>
                  รวม {totalCount} อัตรา • ปิดรับ {job.deadline ? formatDate(job.deadline) : "ไม่ระบุ"}
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: "0.74rem",
                padding: "3px 10px",
                borderRadius: "999px",
                background: "var(--orange-100, #ffedd5)",
                color: "var(--orange-800, #9a3412)",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {job.categories?.[0] || job.category || "งานราชการ"}
            </span>
          </div>

          {/* Preview View Tabs */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--navy-800, #0f172a)" }}>
                ภาพพรีวิวการแชร์ (Dynamic Open Graph):
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "8px",
                    fontSize: "0.76rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "1px solid",
                    background: activeTab === "preview" ? "var(--navy-700, #1e293b)" : "transparent",
                    color: activeTab === "preview" ? "#ffffff" : "var(--navy-600, #475569)",
                    borderColor: activeTab === "preview" ? "var(--navy-700, #1e293b)" : "var(--border-color, #cbd5e1)",
                  }}
                >
                  🖼️ การ์ด OG (1200×630)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("line")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "8px",
                    fontSize: "0.76rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "1px solid",
                    background: activeTab === "line" ? "var(--navy-700, #1e293b)" : "transparent",
                    color: activeTab === "line" ? "#ffffff" : "var(--navy-600, #475569)",
                    borderColor: activeTab === "line" ? "var(--navy-700, #1e293b)" : "var(--border-color, #cbd5e1)",
                  }}
                >
                  💬 พรีวิวในแชท LINE
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("qrcode")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "8px",
                    fontSize: "0.76rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "1px solid",
                    background: activeTab === "qrcode" ? "var(--navy-700, #1e293b)" : "transparent",
                    color: activeTab === "qrcode" ? "#ffffff" : "var(--navy-600, #475569)",
                    borderColor: activeTab === "qrcode" ? "var(--navy-700, #1e293b)" : "var(--border-color, #cbd5e1)",
                  }}
                >
                  🔳 QR Code
                </button>
              </div>
            </div>

            {/* TAB 1: OG Card Full Preview */}
            {activeTab === "preview" && (
              <div
                style={{
                  position: "relative",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid var(--border-color, #cbd5e1)",
                  background: "#0a0f1d",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                  aspectRatio: "1200 / 630",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isImageLoading && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      color: "#94a3b8",
                      fontSize: "0.85rem",
                      background: "rgba(10, 15, 29, 0.9)",
                      zIndex: 2,
                    }}
                  >
                    <div style={{ fontSize: "1.8rem", animation: "spin 1s linear infinite" }}>⚡</div>
                    <span>กำลังสร้างภาพ Dynamic OG Image...</span>
                  </div>
                )}
                <img
                  src={ogImageUrl}
                  alt={`Open Graph preview for ${job.department}`}
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => setIsImageLoading(false)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <a
                  href={ogImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    position: "absolute",
                    bottom: 12,
                    right: 12,
                    padding: "6px 14px",
                    borderRadius: "8px",
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    backdropFilter: "blur(8px)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    zIndex: 3,
                  }}
                >
                  <span>🔍 ดูภาพขนาดเต็ม HD (1200×630)</span>
                </a>
              </div>
            )}

            {/* TAB 2: LINE / Social Chat Bubble Simulation */}
            {activeTab === "line" && (
              <div
                style={{
                  padding: "16px",
                  background: "#79c294", // LINE green ambient
                  borderRadius: "16px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    maxWidth: 380,
                    width: "100%",
                    borderRadius: "16px",
                    overflow: "hidden",
                    background: "#ffffff",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <img
                    src={ogImageUrl}
                    alt="Social Card Preview"
                    style={{ width: "100%", aspectRatio: "1200 / 630", objectFit: "cover", display: "block" }}
                  />
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                      readytogov.th
                    </div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a", marginTop: 2, lineHeight: 1.3 }}>
                      รับสมัครงาน {job.department}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      เปิดรับสมัครรวม {totalCount} อัตรา ดูคุณสมบัติ หลักสูตรวิชาสอบ และวิธีสมัครออนไลน์คลิกที่นี่
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: QR Code Generator */}
            {activeTab === "qrcode" && (
              <div
                style={{
                  padding: "24px",
                  background: "var(--gray-50, #f8fafc)",
                  borderRadius: "16px",
                  border: "1px solid var(--border-color, #e2e8f0)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 14,
                }}
              >
                {qrCodeDataUrl ? (
                  <div
                    style={{
                      padding: 12,
                      background: "#ffffff",
                      borderRadius: 16,
                      boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <img src={qrCodeDataUrl} alt="QR Code Deep Link" style={{ width: 180, height: 180, display: "block" }} />
                  </div>
                ) : (
                  <div style={{ width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    กำลังสร้าง QR Code...
                  </div>
                )}
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--navy-900, #0f172a)" }}>
                    สแกนเพื่อเปิดประกาศงานนี้ทันทีบนมือถือ
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--navy-400, #94a3b8)", marginTop: 2 }}>
                    เหมาะสำหรับนำไปฉายบนสไลด์ นามบัตร หรือพิมพ์ติดบอร์ดประชาสัมพันธ์
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "10px",
                    background: "var(--navy-800, #0f172a)",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>💾</span>
                  <span>บันทึกรูป QR Code (PNG)</span>
                </button>
              </div>
            )}
          </div>

          {/* Deep Link URL Box */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--navy-800, #0f172a)" }}>
                Deep Link URL ตรง:
              </label>
              <label style={{ fontSize: "0.76rem", color: "var(--navy-500, #64748b)", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={includeUtm}
                  onChange={(e) => setIncludeUtm(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                <span>ใส่แท็กวิเคราะห์สถิติ (UTM Tracking)</span>
              </label>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "var(--gray-50, #f8fafc)",
                border: "1px solid var(--border-color, #cbd5e1)",
                borderRadius: "14px",
                padding: "6px 8px 6px 14px",
                gap: 8,
              }}
            >
              <span style={{ color: "var(--navy-400, #94a3b8)", fontSize: "0.9rem" }}>🔗</span>
              <input
                type="text"
                readOnly
                value={deepLink}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: "0.85rem",
                  fontFamily: "monospace",
                  color: "var(--navy-800, #0f172a)",
                }}
                onClick={(e) => e.target.select()}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: isCopiedLink ? "var(--green-600, #16a34a)" : "var(--primary-600, #f97316)",
                  color: "#ffffff",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.2s",
                  flexShrink: 0,
                  boxShadow: isCopiedLink ? "0 4px 12px rgba(22, 163, 74, 0.4)" : "0 4px 12px rgba(249, 115, 22, 0.35)",
                }}
              >
                <span>{isCopiedLink ? "✅" : "📋"}</span>
                <span>{isCopiedLink ? "คัดลอกแล้ว!" : "คัดลอกลิงก์"}</span>
              </button>
            </div>
          </div>

          {/* 1-Click Social Sharing Intent Buttons */}
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--navy-800, #0f172a)", display: "block", marginBottom: 10 }}>
              แชร์ด่วน 1 คลิก ไปยังโซเชียลมีเดีย:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
              
              {/* LINE */}
              <a
                href={socialLinks.line}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "10px 14px",
                  borderRadius: "12px",
                  background: "#06C755",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontSize: "0.84rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 12px rgba(6, 199, 85, 0.3)",
                  transition: "transform 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
              >
                <span>💬</span>
                <span>ส่งเข้า LINE</span>
              </a>

              {/* Facebook */}
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "10px 14px",
                  borderRadius: "12px",
                  background: "#1877F2",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontSize: "0.84rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 12px rgba(24, 119, 242, 0.3)",
                  transition: "transform 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
              >
                <span>📘</span>
                <span>Facebook</span>
              </a>

              {/* X / Twitter */}
              <a
                href={socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "10px 14px",
                  borderRadius: "12px",
                  background: "#0f172a",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontSize: "0.84rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.3)",
                  transition: "transform 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
              >
                <span>𝕏</span>
                <span>ทวีตบน X</span>
              </a>

              {/* Native Web Share */}
              <button
                type="button"
                onClick={handleNativeShare}
                style={{
                  padding: "10px 14px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "0.84rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                  transition: "transform 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
              >
                <span>📲</span>
                <span>แชร์ผ่านระบบ</span>
              </button>
            </div>
          </div>

          {/* Quick Summary Text Caption Box */}
          <div
            style={{
              padding: "14px 16px",
              background: "var(--gray-50, #f8fafc)",
              borderRadius: "14px",
              border: "1px solid var(--border-color, #e2e8f0)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--navy-800, #0f172a)" }}>
                📝 ข้อความสรุปสำหรับส่งในแชท / กลุ่ม:
              </span>
              <button
                type="button"
                onClick={handleCopySummary}
                style={{
                  background: "none",
                  border: "none",
                  color: isCopiedSummary ? "var(--green-600, #16a34a)" : "var(--primary-600, #ea580c)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span>{isCopiedSummary ? "✅" : "📋"}</span>
                <span>{isCopiedSummary ? "คัดลอกข้อความแล้ว" : "คัดลอกข้อความ + ลิงก์"}</span>
              </button>
            </div>
            <pre
              style={{
                margin: 0,
                fontSize: "0.78rem",
                color: "var(--navy-600, #475569)",
                whiteSpace: "pre-wrap",
                fontFamily: "inherit",
                lineHeight: 1.5,
              }}
            >
              {summaryText}
            </pre>
          </div>

        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "14px 24px",
            background: "var(--gray-50, #f8fafc)",
            borderTop: "1px solid var(--border-color, #e2e8f0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "0.76rem", color: "var(--navy-400, #94a3b8)" }}>
            ⚡ รองรับการพรีวิวอัตโนมัติบนทุกแพลตฟอร์ม
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: "8px 20px", fontSize: "0.85rem", borderRadius: "10px" }}
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
