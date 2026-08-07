import React, { forwardRef, useState } from 'react';

const CATEGORY_MAP = {
  ข้าราชการ:    { bg: "#e0f2fe", color: "#0369a1" },
  พนักงานราชการ: { bg: "#f3f4f6", color: "#374151" },
  รัฐวิสาหกิจ:  { bg: "#ffedd5", color: "#c2410c" },
  ลูกจ้างชั่วคราว: { bg: "#fef9c3", color: "#a16207" },
  พนักงานหน่วยงานของรัฐ: { bg: "#fce7f3", color: "#be185d" },
};

const SocialShareCover = forwardRef(({ job }, ref) => {
  const [imgError, setImgError] = useState(false);

  if (!job) return null;
  const categories = job.categories && job.categories.length > 0 ? job.categories : (job.category ? [job.category] : []);
  const mainCat = categories[0] || "งานราชการ";
  const catStyle = CATEGORY_MAP[mainCat] || { bg: "#f8fafc", color: "#475569" };

  const totalCount = job.positionList?.reduce((s, p) => s + (Number(p.count) || 0), 0) ?? 0;
  
  const formatShortDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  };
  
  let dateText = "";
  if (job.startDate && job.deadline) {
    dateText = `เปิดรับสมัคร ${formatShortDate(job.startDate)} - ${formatShortDate(job.deadline)}`;
  } else if (job.deadline) {
    dateText = `ปิดรับสมัคร ${formatShortDate(job.deadline)}`;
  } else {
    dateText = "เปิดรับสมัครด่วน";
  }

  return (
    <div
      ref={ref}
      style={{
        width: 1080,
        minHeight: 1350,
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
        position: "relative",
        fontFamily: "'Outfit', 'Noto Sans Thai', 'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px",
        boxSizing: "border-box",
      }}
    >
      {/* Decorative Orbs */}
      <div style={{ position: "absolute", top: -150, right: -150, width: 600, height: 600, background: "radial-gradient(circle, rgba(234,88,12,0.3) 0%, transparent 70%)", borderRadius: "50%" }} />
      <div style={{ position: "absolute", bottom: -200, left: -150, width: 800, height: 800, background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)", borderRadius: "50%" }} />

      {/* Main Card */}
      <div style={{
        background: "#ffffff",
        borderRadius: "40px",
        padding: "60px 50px 50px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 24px 50px rgba(0,0,0,0.4)",
        zIndex: 10,
        boxSizing: "border-box"
      }}>
        {/* Top Header - Vertical Stack for 4:5 ratio */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "40px" }}>
          
          {/* Logo (Floating, no box) */}
          <div style={{
            width: 220, height: 220,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "20px",
          }}>
            {(job.logoUrl && !imgError) 
              ? <img 
                  src={job.logoUrl} 
                  alt="Logo" 
                  style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", objectFit: "contain", filter: "drop-shadow(0 12px 20px rgba(0,0,0,0.08))" }} 
                  crossOrigin="anonymous" 
                  onError={() => setImgError(true)} 
                />
              : <div style={{ width: 180, height: 180, borderRadius: "50%", background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
                  <span style={{ fontSize: "5rem" }}>🏛️</span>
                </div>
            }
          </div>

          {/* Badges */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap", justifyContent: "center" }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", color: catStyle.color, fontSize: "1.4rem", fontWeight: 700 }}>
              {mainCat}
            </span>
            {job.isNoOCSC && (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#c2410c", fontSize: "1.4rem", fontWeight: 700 }}>
                ✨ ไม่ต้องผ่าน ภาค ก
              </span>
            )}
            {job.isOCSC && (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#0369a1", fontSize: "1.4rem", fontWeight: 700 }}>
                📝 ต้องผ่าน ภาค ก
              </span>
            )}
          </div>
          
          {/* Dept Name */}
          <h1 style={{ 
            margin: 0, 
            fontSize: job.department && job.department.length > 35 ? "2.8rem" : "3.4rem", 
            fontWeight: 800, 
            color: "#0f172a", 
            lineHeight: 1.3, 
            marginBottom: "20px", 
            textAlign: "center",
            wordBreak: "keep-all",
            letterSpacing: "-1px"
          }}>
            {job.department}
          </h1>
          
          {/* Date Range */}
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center" }}>
            🗓️ {dateText}
          </div>
        </div>

        {/* Positions List */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "24px" }}>
            <div style={{ height: "2px", flex: 1, background: "linear-gradient(90deg, transparent, #e2e8f0)" }} />
            <h2 style={{ fontSize: "2rem", color: "#64748b", margin: 0, fontWeight: 700, textAlign: "center" }}>
              เปิดรับสมัคร {totalCount > 0 ? <span style={{ color: "#334155" }}>รวม {totalCount} อัตรา</span> : "หลายอัตรา"}
            </h2>
            <div style={{ height: "2px", flex: 1, background: "linear-gradient(90deg, #e2e8f0, transparent)" }} />
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "10px" }}>
            {job.positionList?.map((pos, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "16px", padding: "6px 24px" }}>
                <span style={{ fontSize: "1.8rem", display: "flex", alignItems: "center", marginTop: "2px" }}>🎯</span>
                <span style={{ fontSize: "1.8rem", fontWeight: 700, color: "#1e293b", flex: 1, lineHeight: 1.4, wordBreak: "break-word" }}>
                  {pos.title}
                </span>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                  {pos.salary && (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", fontWeight: 800, color: "#15803d", whiteSpace: "nowrap" }}>
                      {pos.salary}
                    </span>
                  )}
                  {pos.count && Number(pos.count) > 0 && (
                    <span style={{ fontSize: "1.4rem", fontWeight: 600, color: "#94a3b8", whiteSpace: "nowrap" }}>
                      {pos.count} อัตรา
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ReadyToGov Footer Branding */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", marginTop: "50px" }}>
          <div style={{ fontSize: "3.5rem", fontWeight: 900, color: "#ea580c", letterSpacing: "-1px" }}>
            ReadyToGov<span style={{ color: "#c2410c" }}>.th</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SocialShareCover;
