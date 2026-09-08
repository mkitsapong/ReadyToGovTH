import { useState, useRef, useEffect } from "react";
import SocialShareCover from "./SocialShareCover.jsx";
import { getTotalJobPositions, getDisplayProvinces } from "../utils/helpers.js";

/**
 * Generate formatted social captions for various platforms
 */
export function buildSocialCaption(job, format = "standard") {
  if (!job) return "";
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://readytogov.th";
  const jobUrl = `${siteUrl}/job/${job.id}`;

  const positions = job.positionList || [];
  const totalCount = getTotalJobPositions(job);

  // Derive display position title
  const mainTitle = positions.length === 1
    ? positions[0].title
    : positions.length > 1
      ? `${positions[0].title} และอื่นๆ รวม ${positions.length} ตำแหน่ง`
      : "หลายตำแหน่ง";

  // Derive salary text
  const salaries = positions.map((p) => p.salary?.trim()).filter(Boolean);
  let salaryText = "ตามระเบียบกำหนด";
  if (salaries.length > 0) {
    const nums = salaries
      .flatMap((s) => s.match(/[\d,]+/g) || [])
      .map((n) => parseInt(n.replace(/,/g, ""), 10))
      .filter((n) => n >= 3000);
    if (nums.length > 0) {
      const minSalary = Math.min(...nums);
      const maxSalary = Math.max(...nums);
      salaryText = minSalary === maxSalary
        ? `${minSalary.toLocaleString()} บาท`
        : `${minSalary.toLocaleString()} – ${maxSalary.toLocaleString()} บาท`;
    } else {
      salaryText = salaries[0];
    }
  } else if (job.salary) {
    salaryText = job.salary;
  }

  // Format date helper
  const formatDateTh = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const deadlineText = formatDateTh(job.deadline) || "ดูรายละเอียดในประกาศ";
  const startDateText = formatDateTh(job.startDate || job.postedDate);

  // Education list
  const uniqueEdus = [
    ...new Set(
      positions.flatMap((p) =>
        Array.isArray(p.education) ? p.education : p.education ? [p.education] : []
      )
    ),
  ].filter(Boolean);
  const eduText = uniqueEdus.length > 0 ? uniqueEdus.join(", ") : "ไม่ระบุวุฒิ";

  // Provinces
  const provs = getDisplayProvinces(job);
  const provText = provs.length > 0 ? provs.join(", ") : "ทั่วประเทศ";

  // Category
  const category = (job.categories && job.categories[0]) || job.category || "งานราชการ";

  // OCSC condition
  const ocscText = job.isNoOCSC
    ? "✨ ไม่ต้องผ่าน ภาค ก. (ก.พ.) ก็สมัครได้!"
    : job.isOCSC
    ? "📝 ต้องมีหนังสือรับรองผ่าน ภาค ก. (ก.พ.)"
    : "";

  // Hashtags
  const deptClean = job.department ? `#${job.department.replace(/[\s()_.-]+/g, "")}` : "";
  const defaultTags = `#งานราชการ #สอบกพ #รับสมัครงาน #${category.replace(/\s+/g, "")} #ReadyToGovTH ${deptClean}`.trim();

  // 1. Short / X / Twitter / Threads Style
  if (format === "short") {
    return `🔥 เปิดรับสมัครแล้ว! ${job.department}
📌 ตำแหน่ง: ${mainTitle} (${totalCount} อัตรา)
💰 เงินเดือน: ${salaryText}
📅 ปิดรับสมัคร: ${deadlineText}
${ocscText ? `${ocscText}\n` : ""}
👉 รายละเอียดและลิงก์สมัคร:
${jobUrl}

${defaultTags}`;
  }

  // 2. Full Position Breakdown Style
  if (format === "detailed") {
    const posLines = positions
      .map((p, idx) => {
        const pCount = p.count ? `${p.count} อัตรา` : "1 อัตรา";
        const pSal = p.salary ? ` (เงินเดือน ${p.salary})` : "";
        return `  ${idx + 1}. ${p.title} - ${pCount}${pSal}`;
      })
      .join("\n");

    return `📢 เปิดรับสมัครงาน ${category}!
🏛️ ${job.department}
👥 รวมทั้งสิ้น ${totalCount} อัตรา

📋 รายชื่อตำแหน่งที่เปิดรับสมัคร:
${posLines || `  1. ${mainTitle}`}

🎓 วุฒิการศึกษา: ${eduText}
💰 อัตราเงินเดือน: ${salaryText}
📍 สถานที่ปฏิบัติงาน: ${provText}
${startDateText ? `🗓️ วันที่เปิดรับสมัคร: ${startDateText} – ${deadlineText}` : `📅 รับสมัครถึง: ${deadlineText}`}
${ocscText ? `\n${ocscText}\n` : ""}
📌 อ่านประกาศฉบับเต็มและวิธีสมัครออนไลน์:
👉 ${jobUrl}

${defaultTags}`;
  }

  // 3. Standard Facebook Page Style (Default recommended)
  return `📢 เปิดรับสมัครแล้ว! ${mainTitle}
🏛️ ${job.department} | จำนวน ${totalCount} อัตรา
💰 เงินเดือน: ${salaryText}
🎓 วุฒิการศึกษา: ${eduText}
📅 รับสมัครถึง: ${deadlineText}
📍 สถานที่ปฏิบัติงาน: ${provText}
${ocscText ? `✨ เงื่อนไข: ${ocscText}\n` : ""}
📌 รายละเอียดและลิงก์สมัคร:
👉 ${jobUrl}

${defaultTags}`;
}

export default function SocialPosterModal({ job, onClose, onToast }) {
  const [selectedFormat, setSelectedFormat] = useState("standard");
  const [captionText, setCaptionText] = useState(() => buildSocialCaption(job, "standard"));
  const [selectedRatio, setSelectedRatio] = useState("4:5");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [magicSuccess, setMagicSuccess] = useState(false);

  const bannerFeedRef = useRef(null);
  const bannerStoryRef = useRef(null);

  // Sync caption when format tab changes
  useEffect(() => {
    setCaptionText(buildSocialCaption(job, selectedFormat));
  }, [selectedFormat, job]);

  if (!job) return null;

  // Copy caption text
  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(captionText);
      setHasCopied(true);
      if (onToast) onToast("คัดลอกข้อความสำหรับโพสต์เรียบร้อยแล้ว 📋", "success");
      setTimeout(() => setHasCopied(false), 2500);
    } catch {
      alert("ไม่สามารถคัดลอกข้อความได้ กรุณากดเลือกข้อความและคัดลอกด้วยตนเอง");
    }
  };

  // Generate and download banner image
  const handleDownloadBanner = async (ratio = selectedRatio) => {
    const targetRef = ratio === "9:16" ? bannerStoryRef.current : bannerFeedRef.current;
    if (!targetRef) return null;

    try {
      setIsGenerating(true);
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(targetRef, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });

      const image = canvas.toDataURL("image/png");
      const ratioSuffix = ratio === "9:16" ? "story-9x16" : "feed-4x5";
      const fileName = `readytogov-${job.department.replace(/\s+/g, "-")}-${ratioSuffix}.png`;

      const link = document.createElement("a");
      link.href = image;
      link.download = fileName;
      link.click();

      if (onToast) onToast(`ดาวน์โหลดรูปแบนเนอร์ ${ratio} สำเร็จแล้ว 📷`, "success");
      return true;
    } catch (err) {
      console.error("Banner generation error:", err);
      if (onToast) onToast("เกิดข้อผิดพลาดในการสร้างรูปแบนเนอร์", "error");
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  // 1-Click Magic: Copy caption + Download Banner
  const handleOneClickMagic = async () => {
    try {
      setIsGenerating(true);
      // 1. Copy caption text
      await navigator.clipboard.writeText(captionText);
      setHasCopied(true);

      // 2. Generate and download banner
      await handleDownloadBanner(selectedRatio);

      // 3. Celebratory feedback
      setMagicSuccess(true);
      if (onToast) {
        onToast("🚀 คัดลอกข้อความ + ดาวน์โหลดแบนเนอร์แล้ว! พร้อมวางโพสต์ลงเพจได้ทันที (5 วิ)", "success");
      }
      setTimeout(() => {
        setMagicSuccess(false);
        setHasCopied(false);
      }, 4000);
    } catch (err) {
      console.error(err);
      if (onToast) onToast("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Hidden high-res banner elements for html2canvas */}
      <div style={{ position: "fixed", left: -9999, top: -9999, pointerEvents: "none", zIndex: -1 }}>
        <SocialShareCover ref={bannerFeedRef} job={job} aspectRatio="4:5" />
        <SocialShareCover ref={bannerStoryRef} job={job} aspectRatio="9:16" />
      </div>

      <div
        className="modal animate-fade-up social-poster-modal"
        style={{
          maxWidth: 820,
          width: "100%",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "var(--radius-2xl)",
          overflow: "hidden",
          background: "var(--white)",
          boxShadow: "0 25px 60px -10px rgba(15, 23, 42, 0.35)",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "16px 24px",
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
                width: 40,
                height: 40,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25rem",
                boxShadow: "0 4px 12px rgba(249, 115, 22, 0.35)",
              }}
            >
              📢
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: 8 }}>
                สร้างข้อความโพสต์โซเชียล & แบนเนอร์ (1-Click)
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#94a3b8" }}>
                ดึงข้อมูลงานอัตโนมัติ พร้อมรูปแบนเนอร์ HD คัดลอกไปโพสต์ลงเพจได้ทันที
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
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.18)"; e.currentTarget.style.color = "#ffffff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"; e.currentTarget.style.color = "#cbd5e1"; }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Target Department Pill */}
          <div
            style={{
              padding: "10px 16px",
              background: "var(--gray-50)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--gray-200)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "1.2rem" }}>🏛️</span>
              <div>
                <strong style={{ fontSize: "0.95rem", color: "var(--navy-900)" }}>{job.department}</strong>
                <div style={{ fontSize: "0.78rem", color: "var(--navy-500)" }}>
                  {job.positionList?.[0]?.title} {job.positionList?.length > 1 && `(+${job.positionList.length - 1} ตำแหน่ง)`} • รวม {getTotalJobPositions(job)} อัตรา
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: "0.74rem",
                padding: "3px 10px",
                borderRadius: "999px",
                background: "var(--orange-100)",
                color: "var(--orange-800)",
                fontWeight: 600,
              }}
            >
              ปิดรับ {new Date(job.deadline).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
            </span>
          </div>

          {/* Style Selector Tabs */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--navy-800)" }}>
                เลือกสไตล์ข้อความโพสต์:
              </label>
              <button
                type="button"
                onClick={() => setCaptionText(buildSocialCaption(job, selectedFormat))}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary-600)",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  fontWeight: 600,
                  textDecoration: "underline",
                }}
              >
                🔄 รีเซ็ตข้อความตามเทมเพลต
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setSelectedFormat("standard")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "999px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  border: "1px solid",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: selectedFormat === "standard" ? "var(--navy-700)" : "var(--white)",
                  color: selectedFormat === "standard" ? "#ffffff" : "var(--navy-700)",
                  borderColor: selectedFormat === "standard" ? "var(--navy-700)" : "var(--gray-300)",
                }}
              >
                🌟 มาตรฐาน (Facebook Page)
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat("detailed")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "999px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  border: "1px solid",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: selectedFormat === "detailed" ? "var(--navy-700)" : "var(--white)",
                  color: selectedFormat === "detailed" ? "#ffffff" : "var(--navy-700)",
                  borderColor: selectedFormat === "detailed" ? "var(--navy-700)" : "var(--gray-300)",
                }}
              >
                📋 ละเอียดทุกตำแหน่ง (ครบทุกอัตรา)
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat("short")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "999px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  border: "1px solid",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: selectedFormat === "short" ? "var(--navy-700)" : "var(--white)",
                  color: selectedFormat === "short" ? "#ffffff" : "var(--navy-700)",
                  borderColor: selectedFormat === "short" ? "var(--navy-700)" : "var(--gray-300)",
                }}
              >
                ⚡ กระชับ / ด่วน (X / Threads / LINE)
              </button>
            </div>
          </div>

          {/* Editable Caption Textarea */}
          <div style={{ position: "relative" }}>
            <textarea
              value={captionText}
              onChange={(e) => setCaptionText(e.target.value)}
              rows={9}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "var(--radius-lg)",
                border: "1.5px solid var(--gray-300)",
                fontSize: "0.88rem",
                lineHeight: 1.6,
                fontFamily: "inherit",
                color: "var(--navy-900)",
                resize: "vertical",
                boxSizing: "border-box",
                background: "#fafafa",
              }}
              placeholder="ข้อความแคปชั่นสำหรับโพสต์..."
            />
            <div
              style={{
                position: "absolute",
                right: 12,
                bottom: 12,
                fontSize: "0.72rem",
                color: "var(--gray-400)",
                background: "rgba(255, 255, 255, 0.9)",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              {captionText.length} ตัวอักษร
            </div>
          </div>

          {/* Banner Aspect Ratio Selector */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, paddingTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--navy-800)" }}>
                🖼️ สัดส่วนรูปแบนเนอร์:
              </span>
              <button
                type="button"
                onClick={() => setSelectedRatio("4:5")}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid",
                  background: selectedRatio === "4:5" ? "var(--orange-500)" : "var(--gray-100)",
                  color: selectedRatio === "4:5" ? "#ffffff" : "var(--gray-700)",
                  borderColor: selectedRatio === "4:5" ? "var(--orange-600)" : "var(--gray-300)",
                }}
              >
                4:5 (โพสต์ Facebook / IG)
              </button>
              <button
                type="button"
                onClick={() => setSelectedRatio("9:16")}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid",
                  background: selectedRatio === "9:16" ? "var(--orange-500)" : "var(--gray-100)",
                  color: selectedRatio === "9:16" ? "#ffffff" : "var(--gray-700)",
                  borderColor: selectedRatio === "9:16" ? "var(--orange-600)" : "var(--gray-300)",
                }}
              >
                9:16 (Story / Reels / TikTok)
              </button>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(captionText)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "0.75rem",
                  color: "#0284c7",
                  textDecoration: "none",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 8px",
                  borderRadius: "6px",
                  background: "#f0f9ff",
                }}
              >
                <span>🐦 เปิด X (Twitter) ↗</span>
              </a>
              <a
                href={`https://www.facebook.com`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "0.75rem",
                  color: "#1d4ed8",
                  textDecoration: "none",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 8px",
                  borderRadius: "6px",
                  background: "#eff6ff",
                }}
              >
                <span>📘 เปิด Facebook Page ↗</span>
              </a>
            </div>
          </div>

        </div>

        {/* Modal Footer / Action Buttons */}
        <div
          style={{
            padding: "16px 24px",
            background: "var(--gray-50)",
            borderTop: "1px solid var(--gray-200)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {/* Secondary Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={handleCopyCaption}
              style={{
                padding: "9px 16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--gray-300)",
                background: "var(--white)",
                color: "var(--navy-800)",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s",
              }}
            >
              {hasCopied ? "✅ คัดลอกแล้ว" : "📋 คัดลอกเฉพาะข้อความ"}
            </button>

            <button
              type="button"
              onClick={() => handleDownloadBanner(selectedRatio)}
              disabled={isGenerating}
              style={{
                padding: "9px 16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--gray-300)",
                background: "var(--white)",
                color: "var(--navy-800)",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s",
              }}
            >
              {isGenerating ? "⏳ กำลังสร้างรูป..." : `📷 ดาวน์โหลดเฉพาะรูป (${selectedRatio})`}
            </button>
          </div>

          {/* Primary 1-Click Magic Button */}
          <button
            type="button"
            onClick={handleOneClickMagic}
            disabled={isGenerating}
            style={{
              padding: "10px 22px",
              borderRadius: "999px",
              border: "none",
              background: magicSuccess
                ? "linear-gradient(135deg, #16a34a, #15803d)"
                : "linear-gradient(135deg, #f97316, #ea580c)",
              color: "#ffffff",
              fontSize: "0.92rem",
              fontWeight: 700,
              cursor: isGenerating ? "wait" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 16px rgba(249, 115, 22, 0.4)",
              transition: "all 0.2s",
            }}
          >
            {isGenerating ? (
              <span>⏳ กำลังประมวลผล...</span>
            ) : magicSuccess ? (
              <span>🎉 สำเร็จ! วางโพสต์ลงเพจได้ทันที (Ctrl+V)</span>
            ) : (
              <>
                <span style={{ fontSize: "1.1rem" }}>🚀</span>
                <span>คัดลอกข้อความ + ดาวน์โหลดรูป (5 วิ)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
