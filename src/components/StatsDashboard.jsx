import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import SEO from "./SEO.jsx";
import "./StatsDashboard.css";
import {
  calculateWeeklyTrends,
  calculateCategoryStats,
  calculateProvinceStats,
  calculateOverviewKPIs,
} from "../utils/statsHelpers.js";

export default function StatsDashboard({ jobs = [], onNavigateCategory, onSelectProvince }) {
  const navigate = useNavigate();

  // Filters & State
  const [timeframe, setTimeframe] = useState("8"); // "8", "12", "all"
  const [metricType, setMetricType] = useState("jobs"); // "jobs" | "positions"
  const [activeOnly, setActiveOnly] = useState(false);
  const [hoveredWeekIdx, setHoveredWeekIdx] = useState(null);
  const [hoveredCat, setHoveredCat] = useState(null);

  // Filter jobs by active status if toggled
  const filteredJobs = useMemo(() => {
    if (!activeOnly) return jobs;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return jobs.filter((j) => {
      if (!j.deadline) return true;
      const d = new Date(j.deadline);
      return isNaN(d.getTime()) || d >= now;
    });
  }, [jobs, activeOnly]);

  // Computed Statistics
  const limitWeeks = timeframe === "all" ? 0 : parseInt(timeframe, 10);
  const weeklyTrends = useMemo(
    () => calculateWeeklyTrends(filteredJobs, limitWeeks),
    [filteredJobs, limitWeeks]
  );
  const categoryStats = useMemo(
    () => calculateCategoryStats(filteredJobs),
    [filteredJobs]
  );
  const { topProvinces, regionStats, totalNationwide } = useMemo(
    () => calculateProvinceStats(filteredJobs, 10),
    [filteredJobs]
  );
  const overviewKPIs = useMemo(
    () => calculateOverviewKPIs(filteredJobs),
    [filteredJobs]
  );

  // Summary computations for weekly trend
  const weeklySummary = useMemo(() => {
    if (weeklyTrends.length === 0) return { avg: 0, peak: null, latest: 0 };
    const values = weeklyTrends.map((w) =>
      metricType === "jobs" ? w.jobCount : w.positionCount
    );
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / values.length);
    const maxVal = Math.max(...values);
    const peakWeek = weeklyTrends.find((w) =>
      (metricType === "jobs" ? w.jobCount : w.positionCount) === maxVal
    );
    const latest = values[values.length - 1] || 0;
    return { avg, peak: peakWeek, maxVal, latest };
  }, [weeklyTrends, metricType]);

  // SVG Chart Geometry for Weekly Trend
  const chartWidth = 840;
  const chartHeight = 260;
  const padLeft = 52;
  const padRight = 35;
  const padTop = 30;
  const padBottom = 42;
  const plotWidth = chartWidth - padLeft - padRight;
  const plotHeight = chartHeight - padTop - padBottom;

  const maxValComputed = useMemo(() => {
    if (weeklyTrends.length === 0) return 10;
    const values = weeklyTrends.map((w) =>
      metricType === "jobs" ? w.jobCount : w.positionCount
    );
    const m = Math.max(...values, 4);
    // Round up to nearest nice number
    if (m <= 10) return 10;
    if (m <= 25) return 25;
    if (m <= 50) return 50;
    if (m <= 100) return 100;
    return Math.ceil(m / 50) * 50;
  }, [weeklyTrends, metricType]);

  const chartDataPoints = useMemo(() => {
    if (weeklyTrends.length === 0) return [];
    const minVal = 0;

    return weeklyTrends.map((w, i) => {
      const val = metricType === "jobs" ? w.jobCount : w.positionCount;
      const x =
        weeklyTrends.length > 1
          ? padLeft + (i / (weeklyTrends.length - 1)) * plotWidth
          : padLeft + plotWidth / 2;
      const y = padTop + (1 - (val - minVal) / (maxValComputed - minVal)) * plotHeight;
      return { x, y, val, week: w, index: i };
    });
  }, [weeklyTrends, metricType, maxValComputed, plotWidth, plotHeight]);

  // Construct smooth SVG Spline Curve Path
  const { linePath, areaPath } = useMemo(() => {
    if (chartDataPoints.length === 0) return { linePath: "", areaPath: "" };
    if (chartDataPoints.length === 1) {
      const pt = chartDataPoints[0];
      return {
        linePath: `M ${pt.x - 25},${pt.y} L ${pt.x + 25},${pt.y}`,
        areaPath: `M ${pt.x - 25},${chartHeight - padBottom} L ${pt.x - 25},${pt.y} L ${pt.x + 25},${pt.y} L ${pt.x + 25},${chartHeight - padBottom} Z`,
      };
    }

    let d = `M ${chartDataPoints[0].x},${chartDataPoints[0].y}`;
    for (let i = 0; i < chartDataPoints.length - 1; i++) {
      const curr = chartDataPoints[i];
      const next = chartDataPoints[i + 1];
      const midX = (curr.x + next.x) / 2;
      d += ` C ${midX},${curr.y} ${midX},${next.y} ${next.x},${next.y}`;
    }

    const firstPt = chartDataPoints[0];
    const lastPt = chartDataPoints[chartDataPoints.length - 1];
    const baseY = chartHeight - padBottom;
    const aPath = `${d} L ${lastPt.x},${baseY} L ${firstPt.x},${baseY} Z`;

    return { linePath: d, areaPath: aPath };
  }, [chartDataPoints, chartHeight, padBottom]);

  // Donut Chart calculations for categories
  const donutCircumference = 2 * Math.PI * 65; // ~408.4
  const donutSlices = useMemo(() => {
    const totalJobsInCats = categoryStats.reduce((sum, c) => sum + c.jobCount, 0);
    if (totalJobsInCats === 0) return [];

    let offset = 0;
    return categoryStats.map((cat) => {
      const ratio = cat.jobCount / totalJobsInCats;
      const strokeDash = ratio * donutCircumference;
      const currentOffset = offset;
      offset += strokeDash;

      return {
        ...cat,
        strokeDasharray: `${strokeDash} ${donutCircumference - strokeDash}`,
        strokeDashoffset: -currentOffset,
      };
    });
  }, [categoryStats, donutCircumference]);

  const activeCategoryItem = useMemo(() => {
    if (!hoveredCat) return null;
    return categoryStats.find((c) => c.name === hoveredCat);
  }, [hoveredCat, categoryStats]);

  const handlePrint = () => {
    window.print();
  };

  const handleSelectProvinceClick = (province) => {
    if (onSelectProvince) {
      onSelectProvince(province);
    } else {
      navigate(`/?province=${encodeURIComponent(province)}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectCategoryClick = (catId) => {
    if (onNavigateCategory) {
      onNavigateCategory(catId);
    } else {
      navigate(`/category/${catId}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hoveredPoint = hoveredWeekIdx !== null ? chartDataPoints[hoveredWeekIdx] : null;

  return (
    <>
      <SEO
        title="สถิติและแนวโน้มตลาดงานราชการไทย | ReadyToGovTH"
        description="ศูนย์รวมข้อมูลสถิติตลาดงานภาครัฐ กราฟแสดงจำนวนประกาศรายสัปดาห์ หมวดหมู่งานยอดนิยม และจังหวัดที่เปิดรับสมัครมากที่สุด อัปเดตล่าสุด"
        url="https://readytogov.th/stats"
      />

      <div className="stats-page">
        <div className="stats-container">
          {/* Breadcrumb Back Link */}
          <div className="stats-top-nav">
            <Link to="/" className="stats-back-btn">
              <span className="stats-back-arrow">←</span>
              <span>กลับสู่หน้ารายการประกาศงาน</span>
            </Link>

            <div className="stats-top-badges">
              <span className="stats-micro-chip">
                <span className="stats-live-dot" />
                อัปเดตแบบเรียลไทม์
              </span>
              <span className="stats-micro-chip">
                🇹🇭 ครอบคลุม 77 จังหวัด
              </span>
            </div>
          </div>

          {/* ── 1. Hero Section ── */}
          <div className="stats-hero">
            <div className="stats-hero-glow-1" />
            <div className="stats-hero-glow-2" />
            <div className="stats-hero-grid-pattern" />

            <div className="stats-hero-inner">
              <div className="stats-hero-main">
                <div className="stats-badge-pill">
                  <span className="stats-badge-pulse" />
                  <span>ReadyToGov TH Data & Market Intelligence</span>
                </div>
                <h1 className="stats-hero-title">
                  📊 Dashboard สถิติตลาดงานภาครัฐ
                </h1>
                <p className="stats-hero-subtitle">
                  ระบบวิเคราะห์ข้อมูลประกาศรับสมัครงานภาครัฐ เจาะลึกแนวโน้มการเปิดรับแต่ละสัปดาห์
                  สัดส่วนประเภทตำแหน่งงานยอดนิยม และพื้นที่ที่มีการเปิดรับสมัครอัตรากำลังสูงสุด
                </p>

                {/* Hero Stats Mini Chips */}
                <div className="stats-hero-chips">
                  <div className="stats-hero-chip">
                    <span className="stats-chip-label">รวมประกาศ:</span>
                    <strong className="stats-chip-val">{overviewKPIs.totalJobs} รายการ</strong>
                  </div>
                  <div className="stats-hero-chip">
                    <span className="stats-chip-label">อัตรากำลัง:</span>
                    <strong className="stats-chip-val">{overviewKPIs.totalPositions.toLocaleString()} อัตรา</strong>
                  </div>
                  <div className="stats-hero-chip">
                    <span className="stats-chip-label">ไม่ต้องผ่าน ก.พ.:</span>
                    <strong className="stats-chip-val" style={{ color: "var(--orange-300)" }}>
                      {overviewKPIs.noOcscPercent}%
                    </strong>
                  </div>
                </div>
              </div>

              <div className="stats-hero-actions">
                <Link to="/" className="stats-btn-action stats-btn-primary">
                  <span>🔍 ค้นหางานตามสถิติ</span>
                  <span className="stats-btn-icon-right">→</span>
                </Link>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="stats-btn-action stats-btn-glass"
                  title="พิมพ์หรือบันทึกรายงานสถิติเป็น PDF"
                >
                  <span>🖨️ พิมพ์รายงาน</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── 2. Filter & Controls Bar ── */}
          <div className="stats-filter-bar">
            <div className="stats-filter-group">
              <span className="stats-filter-label">สถานะประกาศ:</span>
              <div className="stats-pill-toggle">
                <button
                  type="button"
                  className={`stats-pill-btn ${!activeOnly ? "active" : ""}`}
                  onClick={() => setActiveOnly(false)}
                >
                  ทั้งหมด ({overviewKPIs.totalJobs})
                </button>
                <button
                  type="button"
                  className={`stats-pill-btn ${activeOnly ? "active" : ""}`}
                  onClick={() => setActiveOnly(true)}
                >
                  🟢 กำลังเปิดรับ ({overviewKPIs.activeJobs})
                </button>
              </div>
            </div>

            <div className="stats-filter-group">
              <span className="stats-filter-label">ข้อมูลระบบอัปเดต:</span>
              <span className="stats-date-chip">
                <span>📅</span>
                <span>
                  {new Date().toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </span>
            </div>
          </div>

          {/* ── 3. High-level KPI Metric Cards ── */}
          <div className="stats-kpi-grid">
            {/* Total Announcements */}
            <div className="stats-kpi-card stats-kpi-blue">
              <div className="stats-kpi-glow" />
              <div className="stats-kpi-top">
                <div className="stats-kpi-icon">📢</div>
                <span className="stats-kpi-tag">
                  ประกาศ
                </span>
              </div>
              <div className="stats-kpi-middle">
                <div className="stats-kpi-num">{overviewKPIs.totalJobs}</div>
                <div className="stats-kpi-title">ประกาศรับสมัครในระบบ</div>
              </div>
              <div className="stats-kpi-footer">
                <span>🟢 เปิดรับอยู่: <strong>{overviewKPIs.activeJobs}</strong> รายการ</span>
              </div>
            </div>

            {/* Total Positions */}
            <div className="stats-kpi-card stats-kpi-emerald">
              <div className="stats-kpi-glow" />
              <div className="stats-kpi-top">
                <div className="stats-kpi-icon">👥</div>
                <span className="stats-kpi-tag">
                  อัตรากำลัง
                </span>
              </div>
              <div className="stats-kpi-middle">
                <div className="stats-kpi-num">
                  {overviewKPIs.totalPositions.toLocaleString()}
                </div>
                <div className="stats-kpi-title">จำนวนอัตรา/ตำแหน่งเปิดรับ</div>
              </div>
              <div className="stats-kpi-footer">
                <span>เฉลี่ย ~{(overviewKPIs.totalPositions / Math.max(1, overviewKPIs.totalJobs)).toFixed(1)} อัตรา/ประกาศ</span>
              </div>
            </div>

            {/* No OCSC Ratio */}
            <div className="stats-kpi-card stats-kpi-orange">
              <div className="stats-kpi-glow" />
              <div className="stats-kpi-top">
                <div className="stats-kpi-icon">✨</div>
                <span className="stats-kpi-tag">
                  ไม่ต้องสอบ ก.พ.
                </span>
              </div>
              <div className="stats-kpi-middle">
                <div className="stats-kpi-num">{overviewKPIs.noOcscPercent}%</div>
                <div className="stats-kpi-title">ไม่ต้องผ่าน ภาค ก</div>
              </div>
              <div className="stats-kpi-footer">
                <span>สมัครได้ทันที <strong>{overviewKPIs.noOcscCount}</strong> ประกาศ</span>
              </div>
            </div>

            {/* Top Education Requirement */}
            <div className="stats-kpi-card stats-kpi-purple">
              <div className="stats-kpi-glow" />
              <div className="stats-kpi-top">
                <div className="stats-kpi-icon">🎓</div>
                <span className="stats-kpi-tag">
                  วุฒิยอดนิยม
                </span>
              </div>
              <div className="stats-kpi-middle">
                <div className="stats-kpi-num" style={{ fontSize: "1.75rem" }}>
                  {overviewKPIs.topEducation}
                </div>
                <div className="stats-kpi-title">วุฒิการศึกษาที่เปิดรับมากสุด</div>
              </div>
              <div className="stats-kpi-footer">
                <span>⏳ ใกล้หมดเขตใน 7 วัน: <strong>{overviewKPIs.urgentJobs}</strong> งาน</span>
              </div>
            </div>
          </div>

          {/* ── 4. Weekly Announcements Trend Chart (กราฟแสดงจำนวนประกาศแต่ละสัปดาห์) ── */}
          <div className="stats-chart-card stats-chart-featured">
            <div className="stats-card-header">
              <div className="stats-card-title-group">
                <div className="stats-card-badge-row">
                  <span className="stats-section-pill">WEEKLY TRENDS</span>
                  {weeklySummary.peak && (
                    <span className="stats-peak-badge">
                      🏆 สัปดาห์สูงสุด: {weeklySummary.peak.shortLabel} ({weeklySummary.maxVal} {metricType === "jobs" ? "ประกาศ" : "อัตรา"})
                    </span>
                  )}
                </div>
                <h2 className="stats-card-title">
                  <span>📈</span>
                  <span>กราฟแสดงจำนวนประกาศแต่ละสัปดาห์</span>
                </h2>
                <p className="stats-card-subtitle">
                  ติดตามความเคลื่อนไหวการเปิดรับสมัครงานภาครัฐในแต่ละสัปดาห์ ชี้ชัดช่วงพีคของการเปิดรับสมัครงาน
                </p>
              </div>

              {/* View options */}
              <div className="stats-chart-controls">
                <div className="stats-pill-toggle">
                  <button
                    type="button"
                    className={`stats-pill-btn ${metricType === "jobs" ? "active" : ""}`}
                    onClick={() => setMetricType("jobs")}
                  >
                    จำนวนประกาศ
                  </button>
                  <button
                    type="button"
                    className={`stats-pill-btn ${metricType === "positions" ? "active" : ""}`}
                    onClick={() => setMetricType("positions")}
                  >
                    จำนวนอัตรากำลัง
                  </button>
                </div>

                <div className="stats-pill-toggle">
                  <button
                    type="button"
                    className={`stats-pill-btn ${timeframe === "8" ? "active" : ""}`}
                    onClick={() => setTimeframe("8")}
                  >
                    8 สัปดาห์
                  </button>
                  <button
                    type="button"
                    className={`stats-pill-btn ${timeframe === "12" ? "active" : ""}`}
                    onClick={() => setTimeframe("12")}
                  >
                    12 สัปดาห์
                  </button>
                  <button
                    type="button"
                    className={`stats-pill-btn ${timeframe === "all" ? "active" : ""}`}
                    onClick={() => setTimeframe("all")}
                  >
                    ทั้งหมด
                  </button>
                </div>
              </div>
            </div>

            {/* SVG Weekly Area/Spline Chart */}
            <div className="stats-weekly-wrapper">
              {hoveredPoint && (
                <div
                  className="stats-chart-tooltip"
                  style={{
                    left: `${Math.min(chartWidth - 220, Math.max(20, hoveredPoint.x - 100))}px`,
                    top: `${Math.max(10, hoveredPoint.y - 85)}px`,
                  }}
                >
                  <span className="stats-tooltip-week">
                    📅 สัปดาห์: {hoveredPoint.week.label}
                  </span>
                  <span className="stats-tooltip-value">
                    {metricType === "jobs"
                      ? `${hoveredPoint.val} ประกาศ`
                      : `${hoveredPoint.val.toLocaleString()} อัตรา`}
                  </span>
                  <div className="stats-tooltip-meta">
                    <span>👥 รวม {hoveredPoint.week.positionCount} อัตรา</span>
                    <span>🟢 เปิดรับ {hoveredPoint.week.activeCount}</span>
                  </div>
                </div>
              )}

              <div className="stats-svg-container">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="stats-trend-svg"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.45" />
                      <stop offset="70%" stopColor="var(--accent)" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                    </linearGradient>
                    <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="rgba(249, 115, 22, 0.45)" />
                    </filter>
                  </defs>

                  {/* Horizontal Grid lines & Y-Axis values */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                    const y = padTop + pct * plotHeight;
                    const yValue = Math.round(maxValComputed * (1 - pct));
                    return (
                      <g key={idx}>
                        <line
                          x1={padLeft}
                          y1={y}
                          x2={chartWidth - padRight}
                          y2={y}
                          className="stats-svg-grid-line"
                        />
                        <text
                          x={padLeft - 8}
                          y={y + 4}
                          textAnchor="end"
                          className="stats-svg-y-text"
                        >
                          {yValue}
                        </text>
                      </g>
                    );
                  })}

                  {/* Vertical Crosshair Line when hovered */}
                  {hoveredPoint && (
                    <line
                      x1={hoveredPoint.x}
                      y1={padTop}
                      x2={hoveredPoint.x}
                      y2={chartHeight - padBottom}
                      className="stats-svg-crosshair"
                    />
                  )}

                  {/* Gradient Area Fill */}
                  {areaPath && (
                    <path d={areaPath} fill="url(#areaGradient)" />
                  )}

                  {/* Spline Line */}
                  {linePath && (
                    <path d={linePath} className="stats-svg-line" filter="url(#glowEffect)" />
                  )}

                  {/* Data Points */}
                  {chartDataPoints.map((pt, idx) => {
                    const isHovered = hoveredWeekIdx === idx;
                    const isPeak = weeklySummary.peak?.index === idx;

                    return (
                      <g
                        key={idx}
                        onMouseEnter={() => setHoveredWeekIdx(idx)}
                        onMouseLeave={() => setHoveredWeekIdx(null)}
                        style={{ cursor: "pointer" }}
                      >
                        {/* Peak Pulse Halo */}
                        {isPeak && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="12"
                            fill="var(--accent)"
                            className="stats-peak-pulse-circle"
                          />
                        )}

                        {/* Interactive Invisible Touch/Click Area */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="18"
                          fill="transparent"
                        />

                        {/* Outer Ring on Hover */}
                        {isHovered && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="9"
                            fill="none"
                            stroke="var(--accent)"
                            strokeWidth="2"
                            opacity="0.8"
                          />
                        )}

                        {/* Point Core */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 6.5 : isPeak ? 5.5 : 4}
                          fill={isHovered || isPeak ? "var(--accent)" : "var(--bg-card)"}
                          stroke="var(--accent)"
                          strokeWidth={isHovered ? 3 : 2}
                          className={`stats-svg-dot ${isHovered ? "active" : ""}`}
                        />

                        {/* X-axis Thai date label */}
                        <text
                          x={pt.x}
                          y={chartHeight - 14}
                          textAnchor="middle"
                          className={`stats-svg-axis-text ${isHovered ? "active-text" : ""}`}
                        >
                          {pt.week.shortLabel}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Bottom Quick Metric Highlights */}
              <div className="stats-weekly-summary">
                <div className="stats-weekly-item">
                  <div className="stats-weekly-icon-wrap" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
                    ⚡
                  </div>
                  <div className="stats-weekly-item-content">
                    <span className="stats-weekly-item-val">{weeklySummary.latest} {metricType === "jobs" ? "ประกาศ" : "อัตรา"}</span>
                    <span className="stats-weekly-item-desc">ประกาศสัปดาห์ล่าสุด</span>
                  </div>
                </div>

                <div className="stats-weekly-item">
                  <div className="stats-weekly-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                    📊
                  </div>
                  <div className="stats-weekly-item-content">
                    <span className="stats-weekly-item-val">{weeklySummary.avg} {metricType === "jobs" ? "ประกาศ" : "อัตรา"}</span>
                    <span className="stats-weekly-item-desc">ค่าเฉลี่ยต่อสัปดาห์</span>
                  </div>
                </div>

                <div className="stats-weekly-item">
                  <div className="stats-weekly-icon-wrap" style={{ background: "rgba(249, 115, 22, 0.15)", color: "var(--accent)" }}>
                    🏆
                  </div>
                  <div className="stats-weekly-item-content">
                    <span className="stats-weekly-item-val" style={{ color: "var(--accent)" }}>
                      {weeklySummary.peak ? `${weeklySummary.maxVal} ${metricType === "jobs" ? "ประกาศ" : "อัตรา"}` : "-"}
                    </span>
                    <span className="stats-weekly-item-desc">
                      {weeklySummary.peak ? `พีคสุดช่วง ${weeklySummary.peak.shortLabel}` : "สัปดาห์สูงสุด"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 5. Two Columns: Categories & Provinces ── */}
          <div className="stats-two-columns">
            {/* Category ยอดนิยม */}
            <div className="stats-chart-card">
              <div className="stats-card-header">
                <div className="stats-card-title-group">
                  <span className="stats-section-pill">CATEGORY INSIGHTS</span>
                  <h2 className="stats-card-title">
                    <span>🏷️</span>
                    <span>Category ยอดนิยม</span>
                  </h2>
                  <p className="stats-card-subtitle">
                    สัดส่วนจำนวนประกาศตามประเภทงานราชการ รัฐวิสาหกิจ และพนักงานหน่วยงานรัฐ
                  </p>
                </div>
              </div>

              <div className="stats-donut-container">
                {/* SVG Donut Chart with Center Insight */}
                <div className="stats-donut-svg-wrapper">
                  <svg viewBox="0 0 160 160" className="stats-donut-svg">
                    <circle
                      cx="80"
                      cy="80"
                      r="65"
                      fill="none"
                      stroke="var(--border-light)"
                      strokeWidth="20"
                    />
                    {donutSlices.map((slice, i) => (
                      <circle
                        key={i}
                        cx="80"
                        cy="80"
                        r="65"
                        fill="none"
                        stroke={slice.meta.color}
                        strokeWidth={hoveredCat === slice.name ? "24" : "20"}
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        className="stats-donut-slice"
                        style={{
                          opacity: hoveredCat && hoveredCat !== slice.name ? 0.35 : 1,
                        }}
                        onMouseEnter={() => setHoveredCat(slice.name)}
                        onMouseLeave={() => setHoveredCat(null)}
                        onClick={() => handleSelectCategoryClick(slice.meta.id)}
                      />
                    ))}
                  </svg>
                  <div className="stats-donut-center">
                    {activeCategoryItem ? (
                      <div className="stats-donut-center-active">
                        <span className="stats-donut-active-icon">{activeCategoryItem.meta.icon}</span>
                        <div className="stats-donut-center-num" style={{ color: activeCategoryItem.meta.color }}>
                          {activeCategoryItem.jobCount}
                        </div>
                        <div className="stats-donut-center-label">
                          {activeCategoryItem.name} ({activeCategoryItem.percentage}%)
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="stats-donut-center-num">
                          {overviewKPIs.totalJobs}
                        </div>
                        <div className="stats-donut-center-label">ประกาศทั้งหมด</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Categories List with Links */}
                <div className="stats-category-list">
                  {categoryStats.map((cat, idx) => {
                    const isHovered = hoveredCat === cat.name;
                    return (
                      <div
                        key={idx}
                        className={`stats-cat-row ${isHovered ? "active" : ""}`}
                        onMouseEnter={() => setHoveredCat(cat.name)}
                        onMouseLeave={() => setHoveredCat(null)}
                        onClick={() => handleSelectCategoryClick(cat.meta.id)}
                        title={`คลิกเพื่อดูประกาศหมวดหมู่ ${cat.name}`}
                      >
                        <div className="stats-cat-row-top">
                          <div className="stats-cat-row-left">
                            <div
                              className="stats-cat-color-dot"
                              style={{ backgroundColor: cat.meta.color, boxShadow: `0 0 8px ${cat.meta.color}66` }}
                            />
                            <span className="stats-cat-name">
                              {cat.meta.icon} {cat.name}
                            </span>
                          </div>

                          <div className="stats-cat-row-right">
                            <span className="stats-cat-count">
                              {cat.jobCount} ประกาศ
                            </span>
                            <span className="stats-cat-percent-badge" style={{ color: cat.meta.color, background: `${cat.meta.color}18` }}>
                              {cat.percentage}%
                            </span>
                            <span className="stats-cat-arrow">→</span>
                          </div>
                        </div>

                        {/* Mini Proportion Bar */}
                        <div className="stats-cat-bar-track">
                          <div
                            className="stats-cat-bar-fill"
                            style={{
                              width: `${cat.percentage}%`,
                              backgroundColor: cat.meta.color,
                            }}
                          />
                        </div>

                        <div className="stats-cat-sub-info">
                          <span>👥 {cat.positionCount.toLocaleString()} อัตรา</span>
                          <span>•</span>
                          <span>🟢 เปิดรับอยู่ {cat.activeCount} งาน</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* จังหวัดที่เปิดรับเยอะ (Top Provinces) */}
            <div className="stats-chart-card">
              <div className="stats-card-header">
                <div className="stats-card-title-group">
                  <span className="stats-section-pill">LOCATION RANKINGS</span>
                  <h2 className="stats-card-title">
                    <span>📍</span>
                    <span>จังหวัดที่เปิดรับเยอะ (Top 10)</span>
                  </h2>
                  <p className="stats-card-subtitle">
                    อันดับพื้นที่ที่มีประกาศและตำแหน่งงานเปิดรับสูงสุดทั่วประเทศ (คลิกเพื่อกรองงาน)
                  </p>
                </div>
              </div>

              {topProvinces.length === 0 ? (
                <div className="stats-empty-state">
                  <div className="stats-empty-icon">📍</div>
                  <div className="stats-empty-title">ไม่พบข้อมูลจังหวัด</div>
                  <p className="stats-empty-desc">
                    ยังไม่มีข้อมูลจังหวัดที่ระบุในประกาศรับสมัครงาน
                  </p>
                </div>
              ) : (
                <div className="stats-province-list">
                  {topProvinces.map((prov) => {
                    const isRank1 = prov.rank === 1;
                    const isRank2 = prov.rank === 2;
                    const isRank3 = prov.rank === 3;

                    return (
                      <div
                        key={prov.name}
                        className={`stats-province-item ${isRank1 ? "rank-gold" : isRank2 ? "rank-silver" : isRank3 ? "rank-bronze" : ""}`}
                        onClick={() => handleSelectProvinceClick(prov.name)}
                        title={`คลิกเพื่อกรองงานเฉพาะจังหวัด ${prov.name}`}
                      >
                        <div className="stats-province-meta">
                          <div className="stats-province-name-wrap">
                            <span
                              className={`stats-rank-badge ${
                                isRank1
                                  ? "stats-rank-1"
                                  : isRank2
                                  ? "stats-rank-2"
                                  : isRank3
                                  ? "stats-rank-3"
                                  : ""
                              }`}
                            >
                              {isRank1 ? "🥇" : isRank2 ? "🥈" : isRank3 ? "🥉" : `#${prov.rank}`}
                            </span>
                            <span className="stats-province-name">{prov.name}</span>
                            <span className="stats-province-region">{prov.region}</span>
                          </div>

                          <div className="stats-province-counts">
                            <span className="stats-province-highlight">
                              {prov.jobCount}
                            </span>{" "}
                            ประกาศ
                            <span style={{ opacity: 0.4 }}>•</span>
                            <span className="stats-province-pos">{prov.positionCount.toLocaleString()} อัตรา</span>
                            <span className="stats-province-cta">กรองงาน ↗</span>
                          </div>
                        </div>

                        {/* Progress bar track */}
                        <div className="stats-bar-track">
                          <div
                            className={`stats-bar-fill ${isRank1 ? "fill-gold" : isRank2 ? "fill-silver" : isRank3 ? "fill-bronze" : ""}`}
                            style={{ width: `${prov.ratioPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {totalNationwide > 0 && (
                    <div
                      className="stats-nationwide-banner"
                      onClick={() => handleSelectProvinceClick("ทั่วประเทศ")}
                      title="คลิกดูกลุ่มงานที่เปิดรับทั่วประเทศ / ส่วนกลาง"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: "1.2rem" }}>🌐</span>
                        <div>
                          <strong style={{ color: "var(--text-main)", fontSize: "0.88rem" }}>
                            เปิดรับทุกจังหวัด / ทั่วประเทศ / ส่วนกลาง
                          </strong>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            ตำแหน่งที่เปิดรับครอบคลุมทุกพื้นที่และหน่วยงานส่วนกลาง
                          </div>
                        </div>
                      </div>
                      <div className="stats-nationwide-badge">
                        <span>{totalNationwide} ประกาศ</span>
                        <span>↗</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── 6. Regional Distribution & Education Breakdown ── */}
          <div className="stats-sub-analytics">
            {/* Regional Distribution */}
            <div className="stats-chart-card" style={{ marginBottom: 0 }}>
              <div className="stats-card-title-group" style={{ marginBottom: 16 }}>
                <span className="stats-section-pill">GEOGRAPHIC SHARE</span>
                <h3 className="stats-card-title" style={{ fontSize: "1.15rem" }}>
                  <span>🗺️</span>
                  <span>การกระจายตัวตามภูมิภาค</span>
                </h3>
                <p className="stats-card-subtitle">
                  สัดส่วนการเปิดรับตำแหน่งงานราชการจำแนกตามภาคของประเทศไทย
                </p>
              </div>

              <div className="stats-region-grid">
                {regionStats.map((r, i) => (
                  <div key={i} className="stats-region-card">
                    <span className="stats-region-title">{r.name}</span>
                    <span className="stats-region-num">
                      {r.jobCount}{" "}
                      <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-muted)" }}>
                        ประกาศ
                      </span>
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {r.positionCount.toLocaleString()} อัตรากำลัง
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Education Breakdown */}
            <div className="stats-chart-card" style={{ marginBottom: 0 }}>
              <div className="stats-card-title-group" style={{ marginBottom: 16 }}>
                <span className="stats-section-pill">EDUCATION DEMAND</span>
                <h3 className="stats-card-title" style={{ fontSize: "1.15rem" }}>
                  <span>🎓</span>
                  <span>วุฒิการศึกษาที่เป็นที่ต้องการ</span>
                </h3>
                <p className="stats-card-subtitle">
                  ระดับการศึกษาที่หน่วยงานภาครัฐระบุเปิดรับสมัครบ่อยที่สุด
                </p>
              </div>

              <div className="stats-edu-list">
                {(overviewKPIs.educationBreakdown || []).map((item, idx) => (
                  <div key={idx} className="stats-edu-row">
                    <div className="stats-edu-info">
                      <span className="stats-edu-label">{item.edu}</span>
                      <span className="stats-edu-count">{item.count} ตำแหน่ง ({item.percent}%)</span>
                    </div>
                    <div className="stats-edu-bar-track">
                      <div
                        className="stats-edu-bar-fill"
                        style={{ width: `${Math.min(100, item.percent * 1.6)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
