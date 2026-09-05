// Modern dual-ring spinner with central glowing dot
export function LoadingSpinner({ size = 38, color = "var(--accent)" }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {/* Outer subtle ring track */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "3px solid rgba(249, 115, 22, 0.15)",
        }}
      />
      {/* Spinning gradient arc */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "3px solid transparent",
          borderTopColor: color,
          borderRightColor: "var(--orange-400)",
          animation: "spin 0.85s cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite",
        }}
      />
      {/* Center glowing dot */}
      <div
        style={{
          width: Math.max(6, Math.round(size * 0.26)),
          height: Math.max(6, Math.round(size * 0.26)),
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent), var(--orange-600))",
          boxShadow: "0 0 10px rgba(249, 115, 22, 0.6)",
          animation: "pulse-glow 1.5s ease-in-out infinite",
        }}
      />
    </div>
  );
}

// Sleek loading card with title, subtitle, spinner, and progress line
export function LoadingBanner({
  title = "กำลังโหลดข้อมูลประกาศงาน...",
  subtitle = "ระบบกำลังดึงข้อมูลตำแหน่ง คุณสมบัติ และเอกสารล่าสุด",
  compact = false,
}) {
  return (
    <div className="loading-banner-card">
      <div className="loading-banner-content">
        <LoadingSpinner size={compact ? 28 : 38} />
        <div className="loading-banner-text">
          <div className="loading-banner-title">
            <span>{title}</span>
            <span className="loading-dots">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </div>
          {subtitle && <p className="loading-banner-sub">{subtitle}</p>}
        </div>
      </div>
      {/* Animated indeterminate progress bar at bottom */}
      <div className="loading-progress-track">
        <div className="loading-progress-bar" />
      </div>
    </div>
  );
}

// High fidelity Job Card Skeleton for the Grid
export function JobCardSkeleton() {
  return (
    <div className="job-card skeleton-card">
      {/* Top Banner (Navy Dark Header) */}
      <div className="job-card-skeleton-header" style={{ padding: "14px 18px", height: 144, boxSizing: "border-box", display: "flex", alignItems: "center" }}>
        {/* Logo box */}
        <div
          className="skeleton-box skeleton-shimmer-dark"
          style={{
            width: 76,
            height: 76,
            borderRadius: "50%",
            flexShrink: 0,
            marginRight: 14,
            border: "2px solid rgba(255,255,255,0.1)",
          }}
        />

        {/* Text lines in header */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="skeleton-box skeleton-shimmer-dark" style={{ height: 18, width: "85%", borderRadius: 6 }} />
          <div className="skeleton-box skeleton-shimmer-dark" style={{ height: 14, width: "55%", borderRadius: 6 }} />
          <div style={{ display: "flex", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
            <div className="skeleton-box skeleton-shimmer-dark" style={{ height: 18, width: 68, borderRadius: 999 }} />
            <div className="skeleton-box skeleton-shimmer-dark" style={{ height: 18, width: 80, borderRadius: 999 }} />
          </div>
        </div>
      </div>

      {/* Countdown strip skeleton */}
      <div style={{ padding: "9px 18px", borderBottom: "1px solid var(--border-light, var(--gray-100))", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-card-subtle, var(--gray-50))" }}>
        <div className="skeleton-box skeleton-shimmer" style={{ height: 14, width: 140, borderRadius: 6 }} />
        <div className="skeleton-box skeleton-shimmer" style={{ height: 20, width: 80, borderRadius: 999 }} />
      </div>

      {/* Card Body (Clean Minimalist) */}
      <div style={{ padding: "14px 18px 12px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {/* Salary & Quota summary bar skeleton */}
        <div style={{ padding: "8px 12px", background: "var(--bg-card-hover, #f8fafc)", border: "1px solid var(--border-card, #e2e8f0)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="skeleton-box skeleton-shimmer" style={{ height: 16, width: 110, borderRadius: 6 }} />
          <div className="skeleton-box skeleton-shimmer" style={{ height: 14, width: 70, borderRadius: 6 }} />
        </div>

        {/* Clean Position item 1 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 2px", borderBottom: "1px solid #f1f5f9" }}>
          <div className="skeleton-box skeleton-shimmer" style={{ height: 15, width: "65%", borderRadius: 6 }} />
          <div className="skeleton-box skeleton-shimmer" style={{ height: 18, width: 50, borderRadius: 999 }} />
        </div>

        {/* Clean Position item 2 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 2px" }}>
          <div className="skeleton-box skeleton-shimmer" style={{ height: 15, width: "55%", borderRadius: 6 }} />
          <div className="skeleton-box skeleton-shimmer" style={{ height: 18, width: 50, borderRadius: 999 }} />
        </div>
      </div>

      {/* Card Footer */}
      <div
        style={{
          padding: "12px 18px",
          background: "#ffffff",
          borderTop: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "auto",
        }}
      >
        <div className="skeleton-box skeleton-shimmer" style={{ height: 16, width: 80, borderRadius: 6 }} />
        <div className="skeleton-box skeleton-shimmer" style={{ height: 32, width: 95, borderRadius: 10 }} />
      </div>
    </div>
  );
}

// Comprehensive Job Detail Page Skeleton
export function JobDetailSkeleton({ onBack }) {
  return (
    <div className="container" style={{ paddingTop: "24px", paddingBottom: "48px" }}>
      {/* Back button skeleton */}
      <div style={{ marginBottom: "20px", display: "inline-flex", alignItems: "center", gap: 8 }}>
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            if (onBack) onBack(e);
            else window.history.back();
          }}
          style={{
            color: "var(--navy-600)",
            fontWeight: "600",
            textDecoration: "none",
            fontSize: "0.95rem",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          ← กลับหน้าหลัก
        </a>
      </div>

      {/* Floating Modern Loading Notice Banner */}
      <LoadingBanner
        title="กำลังโหลดข้อมูลประกาศงาน"
        subtitle="ระบบกำลังเตรียมรายละเอียดตำแหน่ง คุณสมบัติเฉพาะ และเอกสารแนบฉบับเต็ม"
      />

      {/* Detail Page Container Skeleton */}
      <article className="job-detail-page skeleton-page-wrapper">
        <div className="modal-sheet-inner">
          {/* Header Banner */}
          <div
            className="modal-header-banner"
            style={{
              background: "linear-gradient(135deg, var(--navy-900) 0%, #0c1527 100%)",
              position: "relative",
              overflow: "hidden",
              padding: "24px 28px",
            }}
          >
            {/* Ambient light glow */}
            <div
              style={{
                position: "absolute",
                top: -50,
                right: -50,
                width: 240,
                height: 240,
                background: "radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            {/* Main Header Content */}
            <div style={{ display: "flex", alignItems: "center", gap: "clamp(16px, 4vw, 24px)" }}>
              {/* Logo Skeleton */}
              <div
                className="skeleton-box skeleton-shimmer-dark"
                style={{
                  width: "clamp(92px, 18vw, 130px)",
                  height: "clamp(92px, 18vw, 130px)",
                  borderRadius: "50%",
                  flexShrink: 0,
                  border: "3px solid rgba(255,255,255,0.15)",
                }}
              />

              {/* Header Text Skeleton */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <div className="skeleton-box skeleton-shimmer-dark" style={{ height: 24, width: 90, borderRadius: 999 }} />
                    <div className="skeleton-box skeleton-shimmer-dark" style={{ height: 24, width: 115, borderRadius: 999 }} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div className="skeleton-box skeleton-shimmer-dark" style={{ width: 60, height: 28, borderRadius: 8 }} />
                    <div className="skeleton-box skeleton-shimmer-dark" style={{ width: 32, height: 32, borderRadius: "50%" }} />
                  </div>
                </div>
                <div className="skeleton-box skeleton-shimmer-dark" style={{ height: 28, width: "65%", borderRadius: 6 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <div className="skeleton-box skeleton-shimmer-dark" style={{ height: 22, width: 120, borderRadius: 999 }} />
                  <div className="skeleton-box skeleton-shimmer-dark" style={{ height: 22, width: 95, borderRadius: 999 }} />
                  <div className="skeleton-box skeleton-shimmer-dark" style={{ height: 22, width: 85, borderRadius: 999 }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Meta Strip */}
          <div
            style={{
              padding: "16px 28px",
              background: "var(--white)",
              borderBottom: "1px solid var(--gray-100)",
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div className="skeleton-box skeleton-shimmer" style={{ height: 26, width: 100, borderRadius: 999 }} />
            <div className="skeleton-box skeleton-shimmer" style={{ height: 26, width: 130, borderRadius: 999 }} />
            <div className="skeleton-box skeleton-shimmer" style={{ height: 26, width: 90, borderRadius: 999 }} />
          </div>

          {/* Body Content */}
          <div className="modal-body" style={{ padding: "28px" }}>
            {/* Meta Grid (4 items) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
                marginBottom: 28,
              }}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    padding: "16px",
                    background: "var(--navy-50)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--navy-100)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div className="skeleton-box skeleton-shimmer" style={{ width: 42, height: 42, borderRadius: "var(--radius-md)" }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div className="skeleton-box skeleton-shimmer" style={{ height: 12, width: "50%", borderRadius: 4 }} />
                    <div className="skeleton-box skeleton-shimmer" style={{ height: 18, width: "80%", borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Position Section Heading */}
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <div className="skeleton-box skeleton-shimmer" style={{ height: 22, width: 180, borderRadius: 6 }} />
            </div>

            {/* Position Cards (2 items) */}
            {Array.from({ length: 2 }).map((_, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: 18,
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--gray-200)",
                  overflow: "hidden",
                  background: "var(--white)",
                }}
              >
                <div
                  style={{
                    padding: "14px 18px",
                    background: "var(--navy-50)",
                    borderBottom: "1px solid var(--gray-100)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div className="skeleton-box skeleton-shimmer" style={{ height: 18, width: "45%", borderRadius: 6 }} />
                  <div className="skeleton-box skeleton-shimmer" style={{ height: 24, width: 70, borderRadius: 999 }} />
                </div>
                <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <div className="skeleton-box skeleton-shimmer" style={{ height: 24, width: 110, borderRadius: 999 }} />
                    <div className="skeleton-box skeleton-shimmer" style={{ height: 24, width: 130, borderRadius: 999 }} />
                  </div>
                  <div
                    style={{
                      padding: "14px",
                      background: "var(--gray-50)",
                      borderRadius: "var(--radius-md)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div className="skeleton-box skeleton-shimmer" style={{ height: 12, width: "25%", borderRadius: 4 }} />
                    <div className="skeleton-box skeleton-shimmer" style={{ height: 14, width: "95%", borderRadius: 4 }} />
                    <div className="skeleton-box skeleton-shimmer" style={{ height: 14, width: "80%", borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            ))}

            {/* Description Box Skeleton */}
            <div
              style={{
                padding: "20px",
                background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid #bae6fd",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 24,
              }}
            >
              <div className="skeleton-box skeleton-shimmer" style={{ height: 18, width: 150, borderRadius: 6 }} />
              <div className="skeleton-box skeleton-shimmer" style={{ height: 14, width: "100%", borderRadius: 4 }} />
              <div className="skeleton-box skeleton-shimmer" style={{ height: 14, width: "90%", borderRadius: 4 }} />
              <div className="skeleton-box skeleton-shimmer" style={{ height: 14, width: "70%", borderRadius: 4 }} />
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
