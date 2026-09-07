import { forwardRef, useState } from 'react';
import iconImage from '../assets/icon.png';
import { getTotalJobPositions, getPositionCount, getDisplayProvinces } from '../utils/helpers.js';

const SocialShareCover = forwardRef(({ job, aspectRatio = "4:5" }, ref) => {
  const [imgError, setImgError] = useState(false);

  if (!job) return null;

  const isStory = aspectRatio === "9:16";
  const totalCount = getTotalJobPositions(job);
  const provinces = getDisplayProvinces(job);

  const formatShortDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  };

  const dateText = (job.startDate && job.deadline)
    ? `เปิดรับสมัคร ${formatShortDate(job.startDate)} - ${formatShortDate(job.deadline)}`
    : job.deadline
      ? `ปิดรับสมัคร ${formatShortDate(job.deadline)}`
      : "เปิดรับสมัครด่วน";

  return (
    <div
      ref={ref}
      style={{
        width: 1080,
        height: isStory ? 1920 : 1350,
        minHeight: isStory ? 1920 : 1350,
        maxHeight: isStory ? 1920 : 1350,
        background: isStory 
          ? "linear-gradient(165deg, #090d1a 0%, #0f172a 35%, #1e3a8a 100%)"
          : "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
        position: "relative",
        fontFamily: "'Outfit', 'Noto Sans Thai', 'IBM Plex Sans Thai', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isStory ? "70px 50px" : "60px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Decorative Background Glows */}
      <div style={{ position: "absolute", top: -120, right: -120, width: isStory ? 750 : 600, height: isStory ? 750 : 600, background: "radial-gradient(circle, rgba(234,88,12,0.32) 0%, transparent 70%)", borderRadius: "50%" }} />
      <div style={{ position: "absolute", bottom: -160, left: -140, width: isStory ? 900 : 800, height: isStory ? 900 : 800, background: "radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)", borderRadius: "50%" }} />
      {isStory && (
        <div style={{ position: "absolute", top: "45%", right: -100, width: 500, height: 500, background: "radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)", borderRadius: "50%" }} />
      )}

      {/* Main Card */}
      <div style={{
        background: "#ffffff",
        borderRadius: isStory ? "48px" : "40px",
        padding: isStory ? "56px 50px 110px" : "60px 50px 100px",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: isStory ? "space-between" : "flex-start",
        boxShadow: "0 28px 65px rgba(0,0,0,0.45)",
        zIndex: 10,
        boxSizing: "border-box",
        position: "relative"
      }}>

        {/* Content Top Section */}
        <div style={{ width: "100%" }}>
          {/* Story Badge for 9:16 */}
          {isStory && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
              <div style={{
                background: "linear-gradient(135deg, rgba(234, 88, 12, 0.12), rgba(249, 115, 22, 0.2))",
                border: "2px solid rgba(234, 88, 12, 0.35)",
                padding: "8px 26px",
                borderRadius: "100px",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "#c2410c",
                letterSpacing: "0.2px"
              }}>
                <span>🏛️</span>
                <span>ประกาศรับสมัครงานราชการไทย • อัปเดตล่าสุด</span>
              </div>
            </div>
          )}

          {/* Top Header */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: isStory ? "32px" : "40px", marginTop: "0px" }}>

            {/* Logo */}
            <div style={{
              width: isStory ? 230 : 220,
              height: isStory ? 230 : 220,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: isStory ? "16px" : "20px",
            }}>
              {(job.logoUrl && !imgError)
                ? <img
                  src={job.logoUrl}
                  alt="Logo"
                  style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", objectFit: "contain", filter: "drop-shadow(0 12px 20px rgba(0,0,0,0.08))" }}
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                />
                : <div style={{ width: 180, height: 180, borderRadius: "50%", background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
                  <span style={{ fontSize: "5rem" }}>🏛️</span>
                </div>
              }
            </div>

            {/* Department Name */}
            <h1 style={{
              margin: 0,
              fontSize: job.department
                ? job.department.length > 45 ? (isStory ? "2.2rem" : "2.0rem")
                  : job.department.length > 35 ? (isStory ? "2.6rem" : "2.4rem")
                    : job.department.length > 25 ? (isStory ? "3.0rem" : "2.8rem")
                      : (isStory ? "3.6rem" : "3.4rem")
                : "3.4rem",
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1.3,
              marginBottom: isStory ? "16px" : "20px",
              textAlign: "center",
              wordBreak: "break-word",
              overflowWrap: "break-word",
              width: "100%",
              padding: "0 10px",
              boxSizing: "border-box",
              letterSpacing: "-1px"
            }}>
              {job.department}
            </h1>

            {/* Pills Subheader (Location, No OCSC) */}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", marginBottom: "16px" }}>
              {job.isNoOCSC && (
                <span style={{ background: "#ecfdf5", border: "1.5px solid #a7f3d0", color: "#047857", padding: "6px 18px", borderRadius: "100px", fontSize: "1.25rem", fontWeight: 800 }}>
                  ✨ ไม่ต้องผ่าน ภาค ก
                </span>
              )}
              {job.isOCSC && (
                <span style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", color: "#1d4ed8", padding: "6px 18px", borderRadius: "100px", fontSize: "1.25rem", fontWeight: 800 }}>
                  📘 ต้องผ่าน ภาค ก
                </span>
              )}
              {provinces.length > 0 && (
                <span style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#475569", padding: "6px 18px", borderRadius: "100px", fontSize: "1.25rem", fontWeight: 700 }}>
                  📍 {provinces.slice(0, 3).join(", ")}{provinces.length > 3 ? ` +${provinces.length - 3}` : ""}
                </span>
              )}
            </div>

            {/* Date Range Box */}
            <div style={{
              fontSize: isStory ? "1.9rem" : "1.8rem",
              fontWeight: 800,
              color: "#ea580c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#fff7ed",
              padding: "10px 24px",
              borderRadius: "100px",
              border: "1.5px solid #ffedd5"
            }}>
              🗓️ {dateText}
            </div>
          </div>

          {/* Positions List Section */}
          <div style={{ marginTop: isStory ? "10px" : "0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: isStory ? "20px" : "24px" }}>
              <div style={{ height: "2px", flex: 1, background: "linear-gradient(90deg, transparent, #e2e8f0)" }} />
              <h2 style={{ fontSize: isStory ? "2.1rem" : "2rem", color: "#64748b", margin: 0, fontWeight: 700, textAlign: "center" }}>
                เปิดรับสมัคร {totalCount > 0 ? <span style={{ color: "#0f172a", fontWeight: 800 }}>รวม {totalCount} อัตรา</span> : "หลายอัตรา"}
              </h2>
              <div style={{ height: "2px", flex: 1, background: "linear-gradient(90deg, #e2e8f0, transparent)" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: isStory ? "16px" : "14px" }}>
              {job.positionList?.slice(0, isStory ? 5 : 4).map((pos, i) => {
                const edus = Array.isArray(pos.education) ? [...pos.education] : (pos.education ? [pos.education] : []);
                if (pos.units && pos.units.length > 0) {
                  pos.units.forEach(u => {
                    const uEdus = Array.isArray(u.education) ? u.education : (u.education ? [u.education] : []);
                    edus.push(...uEdus);
                  });
                }
                const uniqueEdus = [...new Set(edus)];
                const posCount = getPositionCount(pos);

                return (
                  <div key={i} style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "18px",
                    padding: isStory ? "10px 20px" : "6px 24px",
                    background: isStory ? "rgba(248, 250, 252, 0.8)" : "transparent",
                    borderRadius: "16px",
                    border: isStory ? "1px solid #f1f5f9" : "none"
                  }}>
                    <span style={{ fontSize: "1.8rem", display: "flex", alignItems: "center", marginTop: "2px" }}>🎯</span>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: isStory ? "1.9rem" : "1.8rem", fontWeight: 700, color: "#1e293b", lineHeight: 1.35, wordBreak: "break-word" }}>
                        {pos.title}
                      </span>
                      {uniqueEdus.length > 0 && (
                        <span style={{ fontSize: "1.45rem", fontWeight: 600, color: "#64748b" }}>
                          🎓 {uniqueEdus.join(", ")}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                      {pos.salary && (
                        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", fontWeight: 800, color: "#15803d", whiteSpace: "nowrap" }}>
                          {pos.salary}
                        </span>
                      )}
                      {posCount > 0 && (
                        <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#334155", whiteSpace: "nowrap" }}>
                          {posCount} อัตรา
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {job.positionList && job.positionList.length > (isStory ? 5 : 4) && (
                <div style={{ textAlign: "center", color: "#64748b", fontSize: "1.4rem", fontWeight: 700, padding: "8px 0" }}>
                  และตำแหน่งอื่นๆ อีก {job.positionList.length - (isStory ? 5 : 4)} ตำแหน่ง...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Story Bottom Call-To-Action (Only for 9:16 Story) */}
        {isStory && (
          <div style={{
            marginTop: "30px",
            background: "linear-gradient(135deg, #f8fafc, #edf2f7)",
            borderRadius: "24px",
            padding: "20px 24px",
            border: "1.5px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 6px 16px rgba(0,0,0,0.03)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img src={iconImage} alt="ReadyToGov" style={{ width: 56, height: 56, objectFit: "contain" }} />
              <div>
                <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>
                  ReadyToGov<span style={{ color: "#ea580c" }}>.th</span>
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#64748b", marginTop: 4 }}>
                  ศูนย์รวมประกาศงานราชการไทย
                </div>
              </div>
            </div>
            <div style={{
              background: "linear-gradient(135deg, #ea580c, #f97316)",
              color: "#ffffff",
              padding: "12px 24px",
              borderRadius: "100px",
              fontSize: "1.25rem",
              fontWeight: 800,
              boxShadow: "0 6px 16px rgba(234, 88, 12, 0.35)"
            }}>
              📲 สแกน / อ่านประกาศเต็ม
            </div>
          </div>
        )}

        {/* Bottom Left Branding for standard 4:5 */}
        {!isStory && (
          <div style={{ position: "absolute", bottom: 35, left: 50, display: "flex", alignItems: "center", gap: 14, opacity: 0.9 }}>
            <div style={{ position: "relative", top: "8px" }}>
              <img src={iconImage} alt="ReadyToGov" style={{ width: 56, height: 56, objectFit: "contain" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.5px", lineHeight: 1 }}>
                ReadyToGov<span style={{ color: "#ea580c" }}>.th</span>
              </span>
              <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "#64748b", lineHeight: 1 }}>
                รวมงานราชการไทย
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
});

SocialShareCover.displayName = "SocialShareCover";

export default SocialShareCover;
