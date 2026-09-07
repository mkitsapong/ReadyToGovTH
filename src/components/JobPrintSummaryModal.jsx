import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { formatDate, daysLeft, getTotalJobPositions, getDisplayProvinces } from "../utils/helpers.js";
import { CATEGORY_MAP, EDU_COLORS } from "../utils/constants.js";

export default function JobPrintSummaryModal({ job, onClose }) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [scale, setScale] = useState(1);
  const printSheetRef = useRef(null);
  const previewContainerRef = useRef(null);

  if (!job) return null;

  const totalCount = getTotalJobPositions(job);
  const provinces = getDisplayProvinces(job);
  const categories = job.categories && job.categories.length > 0 ? job.categories : (job.category ? [job.category] : ["งานราชการ"]);
  const mainCat = categories[0] || "งานราชการ";
  const catMeta = CATEGORY_MAP[mainCat] || { badge: "badge-civil", icon: "🏛️" };
  const days = daysLeft(job.deadline);

  const displayStartDate = job.startDate || job.postedDate;
  const periodText = (displayStartDate && job.deadline)
    ? `${formatDate(displayStartDate)} – ${formatDate(job.deadline)}`
    : job.deadline
      ? `ปิดรับสมัคร ${formatDate(job.deadline)}`
      : "เปิดรับสมัครด่วน";

  // Derive salary
  const rawSalaries = job.positionList?.map(p => p.salary?.trim()).filter(Boolean) || [];
  let displaySalary = null;
  if (rawSalaries.length > 0) {
    const nums = rawSalaries
      .flatMap(s => s.match(/[\d,]+/g) || [])
      .map(n => parseInt(n.replace(/,/g, ''), 10))
      .filter(n => n >= 3000);
    if (nums.length > 0) {
      const minSalary = Math.min(...nums);
      const maxSalary = Math.max(...nums);
      displaySalary = minSalary === maxSalary 
        ? `${minSalary.toLocaleString()} บาท`
        : `${minSalary.toLocaleString()} – ${maxSalary.toLocaleString()} บาท`;
    } else {
      displaySalary = rawSalaries[0];
    }
  } else if (job.salary) {
    displaySalary = job.salary;
  }

  // Application URL & Job link
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "https://readytogov.th";
  const jobDetailUrl = `${currentOrigin}/job/${job.id}`;

  // Smart detection of application channel
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  let detectedEmail = "";
  if (job.applyUrl) {
    if (job.applyUrl.startsWith("mailto:")) {
      const match = job.applyUrl.replace(/^mailto:/i, "").match(emailRegex);
      if (match) detectedEmail = match[1];
    } else if (job.applyUrl.includes("@") && !job.applyUrl.startsWith("http")) {
      const match = job.applyUrl.match(emailRegex);
      if (match) detectedEmail = match[1];
    }
  }
  if (!detectedEmail && job.description) {
    const match = job.description.match(emailRegex);
    if (match) detectedEmail = match[1];
  }

  const isEmail = Boolean(detectedEmail);
  const isOnline = Boolean(job.applyUrl && job.applyUrl.startsWith("http") && !isEmail);
  const isInPerson = !isEmail && !isOnline;

  const pdfUrl = job.announcementUrl ? job.announcementUrl.split(/[\s,]+/)[0] : "";
  const targetQrUrl = isOnline ? job.applyUrl : (pdfUrl || jobDetailUrl);

  // Generate QR Code on mount
  useEffect(() => {
    QRCode.toDataURL(targetQrUrl, {
      width: 140,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      }
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.warn("QR code generation error:", err));
  }, [targetQrUrl]);

  // Adjust preview scaling to fit screen width on mobile
  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.clientWidth - 32; // padding
        const sheetWidth = 794; // A4 standard width at 96 DPI
        if (containerWidth < sheetWidth) {
          setScale(Math.max(0.38, containerWidth / sheetWidth));
        } else {
          setScale(1);
        }
      }
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  // 🖨️ Handle Print via hidden iframe (Pure Vector, 1-Page A4, Zero Glitch)
  const handlePrint = () => {
    try {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      const sheetHtml = printSheetRef.current ? printSheetRef.current.outerHTML : "";

      // Extract all active stylesheets and inline styles from the parent document
      const styleElements = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
        .map((el) => el.outerHTML)
        .join("\n");

      const printHtml = `
        <!DOCTYPE html>
        <html lang="th">
        <head>
          <meta charset="utf-8">
          <title>สรุปประกาศรับสมัครงาน - ${job.department}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet">
          ${styleElements}
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff !important;
              color: #0f172a !important;
              font-family: 'IBM Plex Sans Thai', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              font-size: 13px;
              line-height: 1.4;
            }
            .a4-print-sheet {
              width: 100% !important;
              max-width: 100% !important;
              min-height: auto !important;
              max-height: none !important;
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
              background: #ffffff !important;
            }
          </style>
        </head>
        <body>
          ${sheetHtml}
        </body>
        </html>
      `;

      iframe.contentDocument.open();
      iframe.contentDocument.write(printHtml);
      iframe.contentDocument.close();

      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1500);
        }, 300);
      };
    } catch (e) {
      console.error("Print error:", e);
      window.print();
    }
  };

  // 📥 Handle Download Image (PNG) via html2canvas
  const handleDownloadImage = async () => {
    if (!printSheetRef.current || isGeneratingImg) return;
    setIsGeneratingImg(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(printSheetRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const image = canvas.toDataURL("image/png");
      const fileName = `readytogov-summary-${job.department.replace(/\s+/g, "-")}.png`;

      // Mobile Web Share API support
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile && navigator.canShare) {
        try {
          const response = await fetch(image);
          const blob = await response.blob();
          const file = new File([blob], fileName, { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `สรุปงาน ${job.department}`,
            });
            setIsGeneratingImg(false);
            return;
          }
        } catch (err) {
          if (err.name === 'AbortError') {
            setIsGeneratingImg(false);
            return;
          }
        }
      }

      // Desktop Download Fallback
      const link = document.createElement("a");
      link.href = image;
      link.download = fileName;
      link.click();
    } catch (err) {
      console.error("Image generation error:", err);
      alert("เกิดข้อผิดพลาดในการดาวน์โหลดรูปภาพ");
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const now = new Date();
  const timeThai = now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  const todayThai = `${now.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })} เวลา ${timeThai} น.`;

  const positions = job.positionList && job.positionList.length > 0 ? job.positionList : [];
  // Limit to first 4-5 positions so the single-page A4 never overflows
  const maxTableRows = 4;
  const displayPositions = positions.slice(0, maxTableRows);
  const remainingPositionsCount = positions.length - displayPositions.length;

  return (
    <div className="print-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="print-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* ── Top Modal Control Header ── */}
        <div className="print-modal-header">
          <div className="print-modal-header-left">
            <span className="print-header-icon">🖨️</span>
            <div>
              <h3 className="print-modal-title">สรุปประกาศรับสมัครงาน 1 หน้า (A4 Executive Summary)</h3>
              <p className="print-modal-subtitle">
                จัดสัดส่วนหน้ากระดาษ A4 หน้าเดียวพอดี ครบทั้งรายละเอียดงาน เกณฑ์สอบ แผนเตรียมตัว และเช็คลิสต์
              </p>
            </div>
          </div>

          <div className="print-modal-header-actions">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-print-action btn-print-primary"
              title="สั่งพิมพ์หรือบันทึกเป็น PDF ผ่านเบราว์เซอร์"
            >
              <span>🖨️ สั่งพิมพ์ / บันทึก PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isGeneratingImg}
              className="btn-print-action btn-print-secondary"
              title="ดาวน์โหลดเป็นไฟล์รูปภาพ PNG ความละเอียดสูง"
            >
              <span>{isGeneratingImg ? "⏳ กำลังสร้างรูป..." : "📥 เซฟเป็นรูปภาพ (PNG)"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn-print-close"
              aria-label="ปิด"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Scrollable Preview Canvas ── */}
        <div className="print-modal-body" ref={previewContainerRef}>
          <div
            className="print-sheet-scaler"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top center",
              height: scale < 1 ? `calc(1123px * ${scale} + 20px)` : "auto",
            }}
          >
            {/* ── Standard A4 Single-Page Document ── */}
            <article
              ref={printSheetRef}
              className="a4-print-sheet"
              id="printable-a4-summary"
            >
              {/* Top Watermark & Category Bar */}
              <div className="a4-top-meta-bar">
                <div className="a4-brand-group">
                  <span className="a4-brand-logo-text">READY TO GOV TH</span>
                  <span className="a4-meta-divider">|</span>
                  <span className="a4-meta-type">เอกสารสรุปประกาศรับสมัครงานราชการ (One-Page Dossier)</span>
                </div>
                <div className="a4-id-tag">
                  รหัสประกาศ: <strong>#{job.id}</strong>
                </div>
              </div>

              {/* ── Executive Header Banner ── */}
              <div className="a4-exec-header">
                <div className="a4-logo-column">
                  {job.logoUrl ? (
                    <img
                      src={job.logoUrl}
                      alt={job.department}
                      crossOrigin="anonymous"
                      className="a4-exec-logo-img"
                    />
                  ) : (
                    <div className="a4-exec-logo-fallback">{catMeta.icon}</div>
                  )}
                </div>

                <div className="a4-exec-info">
                  <div className="a4-doc-label">ประกาศรับสมัครบุคคลเพื่อเลือกสรรและบรรจุแต่งตั้ง</div>
                  <h1 className="a4-exec-dept-name">{job.department}</h1>
                  
                  <div className="a4-exec-badges">
                    <span className="a4-badge a4-badge-navy">
                      🏛️ {mainCat}
                    </span>
                    {job.isNoOCSC ? (
                      <span className="a4-badge a4-badge-amber">
                        ✨ ไม่ต้องผ่าน ภาค ก
                      </span>
                    ) : job.isOCSC ? (
                      <span className="a4-badge a4-badge-blue">
                        📝 ต้องผ่าน ภาค ก
                      </span>
                    ) : null}
                    <span className={`a4-badge ${days < 0 ? "a4-badge-gray" : days <= 5 ? "a4-badge-red" : "a4-badge-green"}`}>
                      {days < 0 ? "⚠️ ปิดรับสมัครแล้ว" : days === 0 ? "🔥 ปิดรับวันนี้!" : `⏳ เหลืออีก ${days} วัน`}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── 4-Highlight Metrics Grid (Executive Matrix) ── */}
              <div className="a4-metrics-matrix">
                {/* 1. Quota */}
                <div className="a4-matrix-card card-quota">
                  <div className="a4-matrix-icon-wrap">👥</div>
                  <div className="a4-matrix-content">
                    <span className="a4-matrix-label">จำนวนที่เปิดรับ</span>
                    <span className="a4-matrix-value font-quota">
                      <strong>{totalCount}</strong> <small>อัตรา</small>
                    </span>
                  </div>
                </div>

                {/* 2. Salary */}
                <div className="a4-matrix-card card-salary">
                  <div className="a4-matrix-icon-wrap">💰</div>
                  <div className="a4-matrix-content">
                    <span className="a4-matrix-label">อัตราเงินเดือนแรกบรรจุ</span>
                    <span className="a4-matrix-value font-salary">
                      {displaySalary || "ตามระเบียบทางราชการ"}
                    </span>
                  </div>
                </div>

                {/* 3. Schedule */}
                <div className="a4-matrix-card card-period">
                  <div className="a4-matrix-icon-wrap">📅</div>
                  <div className="a4-matrix-content">
                    <span className="a4-matrix-label">กำหนดการรับสมัคร</span>
                    <span className="a4-matrix-value font-period">
                      {periodText}
                    </span>
                  </div>
                </div>

                {/* 4. Location */}
                <div className="a4-matrix-card card-loc">
                  <div className="a4-matrix-icon-wrap">📍</div>
                  <div className="a4-matrix-content">
                    <span className="a4-matrix-label">พื้นที่ปฏิบัติงาน</span>
                    <span className="a4-matrix-value font-loc">
                      {provinces.length > 0 ? provinces.join(", ") : "ตามที่ระบุในประกาศ"}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Section 1: Positions & Requirements Table ── */}
              <div className="a4-section-block">
                <div className="a4-block-header">
                  <div className="a4-block-title">
                    <span className="a4-title-icon">📋</span>
                    <span>ตำแหน่งงานและคุณสมบัติเฉพาะที่เปิดรับ</span>
                  </div>
                  <span className="a4-block-tag">รวม {positions.length || 1} ตำแหน่ง</span>
                </div>

                <table className="a4-pos-table">
                  <thead>
                    <tr>
                      <th style={{ width: "42px", textAlign: "center" }}>ลำดับ</th>
                      <th style={{ width: "36%" }}>ตำแหน่งที่เปิดรับ</th>
                      <th style={{ width: "70px", textAlign: "center" }}>จำนวน</th>
                      <th style={{ width: "23%" }}>อัตราเงินเดือน</th>
                      <th>วุฒิการศึกษาที่กำหนด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayPositions.length > 0 ? (
                      displayPositions.map((pos, idx) => {
                        const posEdus = Array.isArray(pos.education) ? pos.education : (pos.education ? [pos.education] : []);
                        return (
                          <tr key={idx}>
                            <td style={{ textAlign: "center", fontWeight: "700", color: "#64748b" }}>
                              {idx + 1}
                            </td>
                            <td>
                              <div className="a4-pos-title-main">{pos.title}</div>
                              {pos.units && pos.units.length > 0 && (
                                <div className="a4-pos-subtext">({pos.units.length} หน่วยงานย่อย)</div>
                              )}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span className="a4-quota-badge">{pos.count || 1} อัตรา</span>
                            </td>
                            <td style={{ fontWeight: "700", color: "#047857" }}>
                              {pos.salary || displaySalary || "ตามระเบียบ"}
                            </td>
                            <td>
                              {posEdus.length > 0 ? (
                                <div className="a4-edu-tags">
                                  {posEdus.map((edu, eIdx) => {
                                    const eduColor = EDU_COLORS[edu] || { bg: "#f1f5f9", color: "#334155" };
                                    return (
                                      <span
                                        key={eIdx}
                                        className="a4-edu-tag"
                                        style={{ background: eduColor.bg, color: eduColor.color }}
                                      >
                                        {edu}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span style={{ color: "#64748b", fontSize: "10.5px" }}>ดูรายละเอียดในประกาศ</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td style={{ textAlign: "center", fontWeight: "700" }}>1</td>
                        <td>
                          <div className="a4-pos-title-main">{job.department}</div>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="a4-quota-badge">{totalCount} อัตรา</span>
                        </td>
                        <td style={{ fontWeight: "700", color: "#047857" }}>
                          {displaySalary || "ตามระเบียบ"}
                        </td>
                        <td>
                          <span style={{ color: "#64748b", fontSize: "10.5px" }}>ดูรายละเอียดในเอกสารประกาศฉบับเต็ม</span>
                        </td>
                      </tr>
                    )}
                    {remainingPositionsCount > 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center", background: "#f8fafc", color: "#475569", fontSize: "10.5px", padding: "4px" }}>
                          ...และมีตำแหน่งอื่นเปิดรับอีก <strong>{remainingPositionsCount}</strong> ตำแหน่ง (กรุณาดูรายละเอียดทั้งหมดในประกาศฉบับเต็ม)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Section 2: Exam Structure & Candidate Action Planner ── */}
              <div className="a4-prep-grid">
                {/* Left Box: Selection Criteria & Exam Stages */}
                <div className="a4-prep-card">
                  <div className="a4-prep-header">
                    <span className="a4-prep-title">🎯 เกณฑ์และขั้นตอนการคัดเลือก</span>
                  </div>
                  <div className="a4-exam-stages">
                    <div className="a4-stage-item">
                      <span className="a4-stage-tag tag-stage-a">ภาค ก</span>
                      <div className="a4-stage-detail">
                        <strong className="a4-stage-name">ความรู้ความสามารถทั่วไป</strong>
                        <span className="a4-stage-desc">
                          {job.isNoOCSC
                            ? "ไม่ต้องใช้หนังสือรับรอง ภาค ก. (สอบเกณฑ์หน่วยงาน)"
                            : job.isOCSC
                              ? "ต้องผ่านการวัดความรู้ความสามารถทั่วไปของ ก.พ."
                              : "ตรวจสอบเงื่อนไข ภาค ก. ในประกาศทางการ"}
                        </span>
                      </div>
                    </div>
                    <div className="a4-stage-item">
                      <span className="a4-stage-tag tag-stage-b">ภาค ข</span>
                      <div className="a4-stage-detail">
                        <strong className="a4-stage-name">ความรู้ความสามารถเฉพาะตำแหน่ง</strong>
                        <span className="a4-stage-desc">
                          สอบข้อเขียน ปรนัย/อัตนัย และข้อสอบความรู้เฉพาะวิชาชีพ
                        </span>
                      </div>
                    </div>
                    <div className="a4-stage-item">
                      <span className="a4-stage-tag tag-stage-c">ภาค ค</span>
                      <div className="a4-stage-detail">
                        <strong className="a4-stage-name">ความเหมาะสมกับตำแหน่ง</strong>
                        <span className="a4-stage-desc">
                          ประเมินสมรรถนะ สัมภาษณ์ หรือทดสอบความพร้อมทางร่างกาย
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Box: Candidate's Personal Exam Notes (Fillable On Paper) */}
                <div className="a4-prep-card a4-planner-card">
                  <div className="a4-prep-header">
                    <span className="a4-prep-title">✍️ บันทึกช่วยจำของผู้สมัคร (กรอกด้วยปากกา)</span>
                  </div>
                  <div className="a4-writein-fields">
                    <div className="a4-writein-row">
                      <span className="a4-field-lbl">ตำแหน่งที่สมัคร:</span>
                      <span className="a4-field-line"></span>
                    </div>
                    <div className="a4-writein-row">
                      <span className="a4-field-lbl">เลขประจำตัวสอบ:</span>
                      <span className="a4-field-line" style={{ maxWidth: "120px" }}></span>
                      <span className="a4-field-lbl" style={{ marginLeft: "8px" }}>ค่าสมัคร:</span>
                      <span className="a4-field-line" style={{ maxWidth: "60px" }}></span>
                      <span style={{ fontSize: "10px", color: "#64748b" }}>บาท</span>
                    </div>
                    <div className="a4-writein-row">
                      <span className="a4-field-lbl">วัน/เวลาสอบ:</span>
                      <span className="a4-field-line"></span>
                    </div>
                    <div className="a4-writein-row">
                      <span className="a4-field-lbl">สถานที่สอบ:</span>
                      <span className="a4-field-line"></span>
                    </div>
                    <div className="a4-writein-row">
                      <span className="a4-field-lbl">เป้าหมายคะแนน / บันทึก:</span>
                      <span className="a4-field-line"></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section 3: Pre-Exam Document Checklist ── */}
              <div className="a4-checklist-box">
                <div className="a4-checklist-top">
                  <span className="a4-checklist-title">
                    ✅ รายการเอกสารที่ต้องใช้สมัครสอบ (ตรวจเช็กและติ๊กยืนยันก่อนยื่น)
                  </span>
                  <span className="a4-checklist-sub">เตรียมเอกสารต้นฉบับพร้อมสำเนาเซ็นรับรอง</span>
                </div>

                <div className="a4-checklist-grid">
                  <div className="a4-check-item">
                    <span className="a4-check-square"></span>
                    <span>1. <strong>ใบสมัคร</strong> พร้อมลงลายมือชื่อตัวจริงถูกต้องครบถ้วน</span>
                  </div>
                  <div className="a4-check-item">
                    <span className="a4-check-square"></span>
                    <span>2. <strong>รูปถ่ายหน้าตรง</strong> 1 หรือ 1.5 นิ้ว (ถ่ายไม่เกิน 6 เดือน)</span>
                  </div>
                  <div className="a4-check-item">
                    <span className="a4-check-square"></span>
                    <span>3. <strong>ปริญญาบัตร / ทรานสคริปต์</strong> ระบุวันอนุมัติสำเร็จการศึกษา</span>
                  </div>
                  <div className="a4-check-item">
                    <span className="a4-check-square"></span>
                    <span>4. <strong>สำเนาผลสอบ ภาค ก.</strong> ของ ก.พ. (กรณีตำแหน่งกำหนด)</span>
                  </div>
                  <div className="a4-check-item">
                    <span className="a4-check-square"></span>
                    <span>5. <strong>สำเนาบัตรประชาชน</strong> และ <strong>สำเนาทะเบียนบ้าน</strong></span>
                  </div>
                  <div className="a4-check-item">
                    <span className="a4-check-square"></span>
                    <span>6. <strong>ใบรับรองแพทย์</strong> แสดงว่าไม่เป็นโรคต้องห้าม (ไม่เกิน 1 เดือน)</span>
                  </div>
                  <div className="a4-check-item">
                    <span className="a4-check-square"></span>
                    <span>7. <strong>หลักฐานทางทหาร</strong> (สด.8, สด.43 หรือหนังสือยกเว้น)</span>
                  </div>
                  <div className="a4-check-item">
                    <span className="a4-check-square"></span>
                    <span>8. <strong>หลักฐานอื่นๆ</strong> เช่น ใบเปลี่ยนชื่อ-สกุล, ทะเบียนสมรส (ถ้ามี)</span>
                  </div>
                </div>
              </div>

              {/* ── Section 4: Action / QR Code Card ── */}
              <div className="a4-action-card">
                <div className="a4-action-text-side">
                  <div className="a4-action-heading">
                    <span className="a4-action-icon">{isOnline ? "🌐" : isEmail ? "📧" : "📍"}</span>
                    <span>
                      {isOnline
                        ? "ช่องทางการรับสมัครออนไลน์ทางอินเทอร์เน็ต"
                        : isEmail
                          ? "ช่องทางการยื่นใบสมัครทางอีเมล"
                          : "ช่องทางการยื่นใบสมัครด้วยตนเอง ณ หน่วยงาน"}
                    </span>
                  </div>
                  <p className="a4-action-desc">
                    {isOnline ? (
                      <>สมัครออนไลน์ผ่านระบบรับสมัครที่: <strong>{job.applyUrl}</strong></>
                    ) : isEmail ? (
                      <>ส่งใบสมัครพร้อมเอกสารหลักฐานไปที่อีเมล: <strong>{detectedEmail}</strong></>
                    ) : (
                      <>ยื่นใบสมัครและหลักฐานด้วยตนเอง ณ <strong>{job.department}</strong> {provinces.length > 0 ? `(${provinces.join(", ")})` : ""} ในวันและเวลาราชการ</>
                    )}
                  </p>
                  <div className="a4-action-links">
                    {pdfUrl && (
                      <span style={{ marginRight: "12px" }}>
                        <strong>📄 ประกาศฉบับเต็ม:</strong> {pdfUrl}
                      </span>
                    )}
                    <span><strong>📱 ดูสรุปใน ReadyToGovTH:</strong> {jobDetailUrl}</span>
                  </div>
                  <div className="a4-action-tip">
                    💡 <strong>คำแนะนำ:</strong> {isInPerson 
                      ? "กรุณาตรวจสอบห้องรับสมัคร เอกสารที่ต้องใช้ และเวลาทำการจากประกาศฉบับเต็มก่อนเดินทางไปยื่นใบสมัคร" 
                      : "กรุณาตรวจสอบระเบียบการ คุณสมบัติเฉพาะตำแหน่ง และกำหนดการที่แน่นอนจากประกาศฉบับเต็มอีกครั้งก่อนยื่นใบสมัคร"}
                  </div>
                </div>

                {qrCodeUrl && (
                  <div className="a4-action-qr-side">
                    <div className="a4-qr-frame">
                      <img src={qrCodeUrl} alt="QR Code สมัครงาน" className="a4-qr-code-img" />
                    </div>
                    <span className="a4-qr-hint">
                      {isOnline 
                        ? <>สแกนด้วยกล้องมือถือ<br/>เพื่อเปิดหน้าสมัครทันที</> 
                        : <>สแกนเปิดประกาศฉบับเต็ม<br/>และดาวน์โหลดแบบฟอร์ม</>}
                    </span>
                  </div>
                )}
              </div>

              {/* ── Section 5: Official Footer & Timestamp ── */}
              <div className="a4-doc-footer">
                <span>สรุปข้อมูลโดย <strong>ReadyToGovTH</strong> (ระบบค้นหาและเตรียมสอบงานราชการไทย • readyto-gov.th)</span>
                <span>พิมพ์/ส่งออกเมื่อ: {todayThai}</span>
              </div>

            </article>
          </div>
        </div>

      </div>
    </div>
  );
}
