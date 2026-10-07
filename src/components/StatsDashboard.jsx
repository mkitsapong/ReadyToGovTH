import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import SEO from "./SEO.jsx";
import "./StatsDashboard.css";
import {
  calculateCategoryStats,
  calculateProvinceStats,
  calculateOverviewKPIs,
} from "../utils/statsHelpers.js";

export default function StatsDashboard({ jobs = [], onNavigateCategory, onSelectProvince, isAdmin = false, onOpenAnalytics }) {
  const navigate = useNavigate();

  // Filters & State
  const [hoveredCat, setHoveredCat] = useState(null);

  // Filter jobs by active status (เฉพาะงานที่กำลังเปิดรับสมัครอยู่ 100%)
  const activeJobs = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return (jobs || []).filter((j) => {
      if (!j.deadline) return true;
      const d = new Date(j.deadline);
      return isNaN(d.getTime()) || d >= now;
    });
  }, [jobs]);

  // Computed Statistics (คำนวณจากงานที่เปิดรับอยู่)
  const categoryStats = useMemo(
    () => calculateCategoryStats(activeJobs),
    [activeJobs]
  );
  const { topProvinces, regionStats, totalNationwide } = useMemo(
    () => calculateProvinceStats(activeJobs, 10),
    [activeJobs]
  );
  const overviewKPIs = useMemo(
    () => calculateOverviewKPIs(activeJobs),
    [activeJobs]
  );

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

  const topCategory = useMemo(() => {
    return categoryStats.length > 0 ? categoryStats[0] : null;
  }, [categoryStats]);

  const handlePrint = () => {
    window.print();
  };

  const handleSelectProvinceClick = (province) => {
    if (onSelectProvince) {
      onSelectProvince(province);
    }
    if (province === "ทั่วประเทศ") {
      navigate("/?province=ทั่วประเทศ");
    } else {
      navigate(`/?province=${encodeURIComponent(province)}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectRegionClick = (regionName) => {
    if (onSelectProvince) {
      onSelectProvince(regionName);
    }
    navigate(`/?province=${encodeURIComponent(regionName)}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectEduClick = (eduName) => {
    navigate(`/?q=${encodeURIComponent(eduName)}`);
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

  return (
    <>
      <SEO
        title="สถิติและแนวโน้มตลาดงานราชการไทย | ReadyToGovTH"
        description="ศูนย์รวมข้อมูลสถิติตลาดงานภาครัฐ หมวดหมู่งานยอดนิยม สัดส่วนตามภูมิภาค และจังหวัดที่เปิดรับสมัครมากที่สุด อัปเดตล่าสุด"
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
                ครอบคลุม 77 จังหวัด
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
                  Dashboard สถิติตลาดงานภาครัฐ
                </h1>
                <p className="stats-hero-subtitle">
                  ระบบวิเคราะห์ข้อมูลประกาศรับสมัครงานภาครัฐ สัดส่วนประเภทตำแหน่งงานยอดนิยม
                  และการกระจายตัวของพื้นที่ที่มีการเปิดรับสมัครอัตรากำลังสูงสุดทั่วประเทศ
                </p>

                {/* Hero Stats Mini Chips */}
                <div className="stats-hero-chips">
                  <div className="stats-hero-chip">
                    <span className="stats-chip-label">เปิดรับสมัคร:</span>
                    <strong className="stats-chip-val">{overviewKPIs.totalJobs} ประกาศ</strong>
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
                {isAdmin && (
                  <button
                    type="button"
                    onClick={onOpenAnalytics}
                    className="stats-btn-action stats-btn-analytics"
                    style={{
                      background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                      color: "#ffffff",
                      border: "none",
                      boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
                    }}
                    title="เปิดดูสถิติ Pageviews, งานยอดนิยม และ User Engagement ใน Firebase Analytics"
                  >
                    <span>📈 Analytics (Admin)</span>
                  </button>
                )}
                <Link to="/" className="stats-btn-action stats-btn-primary">
                  <span>ค้นหางานตามสถิติ</span>
                  <span className="stats-btn-icon-right">→</span>
                </Link>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="stats-btn-action stats-btn-glass"
                  title="พิมพ์หรือบันทึกรายงานสถิติเป็น PDF"
                >
                  <span>พิมพ์รายงาน</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── 2. Information Bar ── */}
          <div className="stats-filter-bar">
            <div className="stats-filter-group">
              <span className="stats-filter-label">สถานะข้อมูล:</span>
              <span className="stats-active-status-tag">
                <span className="stats-live-dot" />
                <span>เฉพาะงานที่กำลังเปิดรับสมัคร ({overviewKPIs.totalJobs} ประกาศ)</span>
              </span>
            </div>

            <div className="stats-filter-group">
              <span className="stats-filter-label">ข้อมูลระบบอัปเดต:</span>
              <span className="stats-date-chip">
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
            <div
              className="stats-kpi-card stats-kpi-blue clickable"
              onClick={() => { navigate("/"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              title="คลิกเพื่อดูประกาศงานทั้งหมด"
            >
              <div className="stats-kpi-glow" />
              <div className="stats-kpi-top">
                <div className="stats-kpi-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <span className="stats-kpi-tag">
                  กำลังเปิดรับ ↗
                </span>
              </div>
              <div className="stats-kpi-middle">
                <div className="stats-kpi-num">{overviewKPIs.totalJobs}</div>
                <div className="stats-kpi-title">ประกาศที่เปิดรับสมัครอยู่</div>
              </div>
              <div className="stats-kpi-footer">
                <span><span className="stats-live-dot" style={{ display: "inline-block", marginRight: 6 }} />พร้อมให้ยื่นใบสมัครได้ทันที</span>
              </div>
            </div>

            {/* Total Positions */}
            <div
              className="stats-kpi-card stats-kpi-emerald clickable"
              onClick={() => { navigate("/"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              title="คลิกเพื่อดูประกาศงานทั้งหมด"
            >
              <div className="stats-kpi-glow" />
              <div className="stats-kpi-top">
                <div className="stats-kpi-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <span className="stats-kpi-tag">
                  อัตรากำลัง ↗
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
            <div
              className="stats-kpi-card stats-kpi-orange clickable"
              onClick={() => { navigate("/?noocsc=1"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              title="คลิกเพื่อกรองเฉพาะงานที่ไม่ต้องผ่าน ภาค ก"
            >
              <div className="stats-kpi-glow" />
              <div className="stats-kpi-top">
                <div className="stats-kpi-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <span className="stats-kpi-tag">
                  ไม่ต้องสอบ ก.พ. ↗
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
            <div
              className="stats-kpi-card stats-kpi-purple clickable"
              onClick={() => handleSelectEduClick(overviewKPIs.topEducation)}
              title={`คลิกเพื่อค้นหางานวุฒิ ${overviewKPIs.topEducation}`}
            >
              <div className="stats-kpi-glow" />
              <div className="stats-kpi-top">
                <div className="stats-kpi-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
                <span className="stats-kpi-tag">
                  วุฒิยอดนิยม ↗
                </span>
              </div>
              <div className="stats-kpi-middle">
                <div className="stats-kpi-num" style={{ fontSize: "1.75rem" }}>
                  {overviewKPIs.topEducation}
                </div>
                <div className="stats-kpi-title">วุฒิการศึกษาที่เปิดรับมากสุด</div>
              </div>
              <div className="stats-kpi-footer">
                <span>ใกล้หมดเขตใน 7 วัน: <strong>{overviewKPIs.urgentJobs}</strong> งาน</span>
              </div>
            </div>
          </div>

          {/* ── 4. Two Columns: Categories & Provinces ── */}
          <div className="stats-two-columns">
            {/* Category ยอดนิยม */}
            <div className="stats-chart-card stats-category-card">
              <div className="stats-card-header">
                <div className="stats-card-title-group">
                  <span className="stats-section-pill">CATEGORY INSIGHTS</span>
                  <h2 className="stats-card-title">
                    <span>Category ยอดนิยม</span>
                  </h2>
                  <p className="stats-card-subtitle">
                    สัดส่วนจำนวนประกาศตามประเภทงานราชการ รัฐวิสาหกิจ และพนักงานหน่วยงานรัฐ
                  </p>
                </div>
              </div>

              {/* 1. Top Donut Showcase + Summary Highlights (Spans across card) */}
              <div className="stats-cat-top-showcase">
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
                        <span
                          className="stats-cat-color-dot"
                          style={{
                            backgroundColor: activeCategoryItem.meta.color,
                            width: 10,
                            height: 10,
                            margin: "0 auto 4px auto",
                          }}
                        />
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
                        <div className="stats-donut-center-label">ประกาศเปิดรับอยู่</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Summary Metrics */}
                <div className="stats-cat-showcase-metrics">
                  <div className="stats-cat-metric-pill">
                    <span className="stats-cat-pill-title">หมวดหมู่อันดับ 1 (เปิดรับมากสุด)</span>
                    <strong className="stats-cat-pill-main" style={{ color: topCategory?.meta.color }}>
                      <span
                        className="stats-cat-color-dot"
                        style={{ backgroundColor: topCategory?.meta.color, width: 8, height: 8 }}
                      />
                      {topCategory?.name || "-"}
                    </strong>
                    <span className="stats-cat-pill-sub">
                      {topCategory?.jobCount} ประกาศ ({topCategory?.percentage}% ของประกาศทั้งหมด)
                    </span>
                  </div>

                  <div className="stats-cat-metric-pill">
                    <span className="stats-cat-pill-title">อัตรากำลังรวมทั้งหมด</span>
                    <strong className="stats-cat-pill-main">
                      {overviewKPIs.totalPositions.toLocaleString()} อัตรา
                    </strong>
                    <span className="stats-cat-pill-sub">
                      เฉลี่ย ~{(overviewKPIs.totalPositions / Math.max(1, overviewKPIs.totalJobs)).toFixed(1)} อัตรา/ประกาศ
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Full-Width Category Rows (Fills the center of the card) */}
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
                          <span
                            className="stats-cat-color-dot"
                            style={{ backgroundColor: cat.meta.color, boxShadow: `0 0 8px ${cat.meta.color}66` }}
                          />
                          <span className="stats-cat-name">{cat.name}</span>
                        </div>

                        <div className="stats-cat-row-right">
                          <span className="stats-cat-count">
                            <strong>{cat.jobCount}</strong> <span className="stats-cat-unit">ประกาศ</span>
                          </span>
                          <span className="stats-cat-percent-badge" style={{ color: cat.meta.color, background: `${cat.meta.color}18` }}>
                            {cat.percentage}%
                          </span>
                          <span className="stats-cat-arrow">→</span>
                        </div>
                      </div>

                      {/* Progress Bar Track */}
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
                        <span>{cat.positionCount.toLocaleString()} อัตรา</span>
                        {cat.jobCount > 0 && (
                          <>
                            <span className="stats-cat-bullet">•</span>
                            <span>เฉลี่ย ~{(cat.positionCount / cat.jobCount).toFixed(1)} อัตรา/งาน</span>
                          </>
                        )}
                        {cat.noOcscCount > 0 && (
                          <>
                            <span className="stats-cat-bullet">•</span>
                            <span className="stats-tag-no-ocsc">ไม่ต้องผ่าน ก.พ. {cat.noOcscCount} งาน</span>
                          </>
                        )}
                        <span className="stats-cat-cta-text">สำรวจกลุ่มนี้ ↗</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 3. Bottom Insight Footer (Anchored at bottom, no empty space!) */}
              {topCategory && (
                <div
                  className="stats-cat-bottom-banner"
                  onClick={() => handleSelectCategoryClick(topCategory.meta.id)}
                  title={`คลิกเพื่อดูประกาศหมวดหมู่ ${topCategory.name}`}
                >
                  <div className="stats-cat-bottom-left">
                    <span className="stats-cat-bottom-tag">INSIGHT</span>
                    <div className="stats-cat-bottom-info">
                      <strong className="stats-cat-bottom-title">
                        หมวดหมู่ที่เปิดรับมากที่สุด: {topCategory.name}
                      </strong>
                      <div className="stats-cat-bottom-desc">
                        ครองสัดส่วน {topCategory.percentage}% รวม {topCategory.positionCount.toLocaleString()} อัตรากำลัง
                      </div>
                    </div>
                  </div>
                  <div className="stats-cat-bottom-badge">
                    <span>ดู {topCategory.jobCount} ประกาศ</span>
                    <span>↗</span>
                  </div>
                </div>
              )}
            </div>

            {/* จังหวัดที่เปิดรับเยอะ (Top Provinces) */}
            <div className="stats-chart-card stats-provinces-card">
              <div className="stats-card-header">
                <div className="stats-card-title-group">
                  <span className="stats-section-pill">LOCATION RANKINGS</span>
                  <h2 className="stats-card-title">
                    <span>จังหวัดที่เปิดรับสมัครสูงสุด (Top 10)</span>
                  </h2>
                  <p className="stats-card-subtitle">
                    อันดับพื้นที่ที่มีประกาศและตำแหน่งงานเปิดรับสูงสุดทั่วประเทศ (คลิกเพื่อกรองงาน)
                  </p>
                </div>
              </div>

              {topProvinces.length === 0 ? (
                <div className="stats-empty-state">
                  <div className="stats-empty-icon">#</div>
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
                              {prov.rank <= 3 ? prov.rank : `#${prov.rank}`}
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
                      <div className="stats-nationwide-left">
                        <span className="stats-nationwide-icon-tag">ALL</span>
                        <div className="stats-nationwide-info">
                          <strong className="stats-nationwide-title">
                            เปิดรับทุกจังหวัด / ทั่วประเทศ / ส่วนกลาง
                          </strong>
                          <div className="stats-nationwide-desc">
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
                  <span>การกระจายตัวตามภูมิภาค</span>
                </h3>
                <p className="stats-card-subtitle">
                  สัดส่วนการเปิดรับตำแหน่งงานราชการจำแนกตามภาคของประเทศไทย
                </p>
              </div>

              <div className="stats-region-grid">
                {regionStats.map((r, i) => {
                  const isSpecial =
                    r.name.includes("ส่วนกลาง") ||
                    r.name.includes("ทั่วประเทศ") ||
                    (regionStats.length % 3 === 1 && i === regionStats.length - 1);

                  if (isSpecial) {
                    return (
                      <div
                        key={i}
                        className="stats-region-card stats-region-card-special clickable"
                        onClick={() => handleSelectRegionClick(r.name)}
                        title={`คลิกเพื่อดูประกาศงานใน ${r.name}`}
                      >
                        <div className="stats-region-special-left">
                          <div className="stats-region-special-icon-wrap">
                            <span className="stats-region-special-icon">🌐</span>
                          </div>
                          <div className="stats-region-special-info">
                            <div className="stats-region-special-title-row">
                              <span className="stats-region-special-title">{r.name}</span>
                              <span className="stats-region-special-tag">ส่วนกลาง / ทั่วประเทศ</span>
                            </div>
                            <span className="stats-region-special-sub">
                              ตำแหน่งที่เปิดรับครอบคลุมทุกพื้นที่และหน่วยงานส่วนกลาง
                            </span>
                          </div>
                        </div>

                        <div className="stats-region-special-right">
                          <div className="stats-region-special-metrics">
                            <span className="stats-region-num">
                              {r.jobCount}{" "}
                              <span className="stats-region-unit">ประกาศ</span>
                            </span>
                            <span className="stats-region-pos-tag">
                              {r.positionCount.toLocaleString()} อัตรากำลัง
                            </span>
                          </div>
                          <span className="stats-region-arrow">↗</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={i}
                      className="stats-region-card clickable"
                      onClick={() => handleSelectRegionClick(r.name)}
                      title={`คลิกเพื่อดูประกาศงานใน ${r.name}`}
                    >
                      <div className="stats-region-card-top">
                        <span className="stats-region-title">{r.name}</span>
                        <span className="stats-region-arrow">↗</span>
                      </div>
                      <span className="stats-region-num">
                        {r.jobCount}{" "}
                        <span className="stats-region-unit">
                          ประกาศ
                        </span>
                      </span>
                      <span className="stats-region-pos-text">
                        {r.positionCount.toLocaleString()} อัตรากำลัง
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Education Breakdown */}
            <div className="stats-chart-card" style={{ marginBottom: 0 }}>
              <div className="stats-card-title-group" style={{ marginBottom: 16 }}>
                <span className="stats-section-pill">EDUCATION DEMAND</span>
                <h3 className="stats-card-title" style={{ fontSize: "1.15rem" }}>
                  <span>วุฒิการศึกษาที่เป็นที่ต้องการ</span>
                </h3>
                <p className="stats-card-subtitle">
                  ระดับการศึกษาที่หน่วยงานภาครัฐระบุเปิดรับสมัครบ่อยที่สุด (คลิกเพื่อค้นหางาน)
                </p>
              </div>

              <div className="stats-edu-list">
                {(overviewKPIs.educationBreakdown || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="stats-edu-row clickable"
                    onClick={() => handleSelectEduClick(item.edu)}
                    title={`คลิกเพื่อค้นหางานวุฒิ ${item.edu}`}
                  >
                    <div className="stats-edu-info">
                      <span className="stats-edu-label">{item.edu}</span>
                      <span className="stats-edu-count">{item.count} ตำแหน่ง ({item.percent}%) ↗</span>
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
