import { useState, useMemo, useEffect, useCallback } from "react";
import {
  getAdminAnalyticsData,
  fetchLiveAdminAnalyticsData,
  resetRealAnalytics,
} from "../services/analyticsService.js";
import "./AdminAnalyticsDashboard.css";

export default function AdminAnalyticsDashboard({ jobs = [], onClose, onSelectJob }) {
  const [popularTab, setPopularTab] = useState("views"); // views | applies | bookmarks | shares
  const [analyticsData, setAnalyticsData] = useState(() => getAdminAnalyticsData(jobs));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeBarIndex, setActiveBarIndex] = useState(null);

  // Load live Firestore metrics or local real metrics
  const loadData = useCallback(async () => {
    try {
      const live = await fetchLiveAdminAnalyticsData(jobs);
      setAnalyticsData(live);
    } catch {
      setAnalyticsData(getAdminAnalyticsData(jobs));
    }
  }, [jobs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh metrics on demand
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  // Reset real metrics if admin wants to clear test data
  const handleResetData = () => {
    if (window.confirm("ยืนยันต้องการล้างข้อมูลสถิติที่บันทึกไว้ทั้งหมดเพื่อเริ่มต้นนับใหม่หรือไม่?")) {
      resetRealAnalytics();
      setAnalyticsData(getAdminAnalyticsData(jobs));
    }
  };

  const { overview, dailyStats, topPages, popularJobs, engagement, topSearches, firebaseStatus } = analyticsData;

  // Sorted Popular Jobs according to active tab
  const sortedPopularJobs = useMemo(() => {
    const list = [...popularJobs];
    if (popularTab === "applies") {
      list.sort((a, b) => b.applies - a.applies);
    } else if (popularTab === "bookmarks") {
      list.sort((a, b) => b.bookmarks - a.bookmarks);
    } else if (popularTab === "shares") {
      list.sort((a, b) => b.shares - a.shares);
    } else {
      list.sort((a, b) => b.views - a.views);
    }
    return list;
  }, [popularJobs, popularTab]);

  // Max value for daily chart scaling (dynamic based on actual values)
  const maxDailyViews = useMemo(() => {
    const maxVal = Math.max(...dailyStats.map((d) => d.pageviews), 0);
    return Math.max(maxVal, 5); // Minimum scale of 5 for proportional rendering
  }, [dailyStats]);

  const totalChartViews = useMemo(() => {
    return dailyStats.reduce((s, d) => s + d.pageviews, 0);
  }, [dailyStats]);

  return (
    <div className="analytics-modal-overlay">
      <div className="analytics-modal" role="dialog" aria-label="Admin Analytics Dashboard">
        {/* ── 1. Header ── */}
        <div className="analytics-header">
          <div className="analytics-header-left">
            <div className="analytics-badge-row">
              <span className="analytics-live-tag">
                <span className="analytics-pulse-dot" />
                100% REAL DATA
              </span>
              <span className="analytics-fb-tag" title="Connected to Google Analytics 4">
                🟢 Firebase Analytics: {firebaseStatus.measurementId}
              </span>
            </div>
            <h2 className="analytics-title">
              📈 Analytics & User Engagement Dashboard
            </h2>
            <p className="analytics-subtitle">
              สถิติภาพรวมการเข้าชมหน้าระบบ (Pageviews), การเปิดดูประกาศงาน และพฤติกรรมจริงของผู้ใช้งาน
            </p>
          </div>

          <div className="analytics-header-actions">
            <a
              href="https://analytics.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="analytics-btn-external"
              title="เปิด Google Analytics 4 Console เพื่อดูข้อมูล Realtime และ Geographic เพิ่มเติม"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              GA4 Console ↗
            </a>

            <button
              type="button"
              onClick={handleRefresh}
              className={`analytics-btn-refresh ${isRefreshing ? "spinning" : ""}`}
              title="รีเฟรชข้อมูลสถิติล่าสุด"
            >
              🔄
            </button>

            <button
              type="button"
              onClick={handleResetData}
              className="analytics-btn-reset"
              title="ล้างสถิติที่บันทึกไว้ในอุปกรณ์นี้ เพื่อเริ่มนับ 0 ใหม่"
            >
              🗑️ ล้างสถิติ
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="analytics-close-btn"
                aria-label="ปิดแดชบอร์ด"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ── 2. Body ── */}
        <div className="analytics-body">
          {/* KPI Summary Cards */}
          <div className="analytics-kpi-grid">
            {/* Total Pageviews */}
            <div className="analytics-kpi-card kpi-blue">
              <div className="kpi-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </div>
              <div className="kpi-content">
                <span className="kpi-label">ยอดเปิดดูหน้ารวม (Pageviews)</span>
                <div className="kpi-value-row">
                  <span className="kpi-value">{overview.totalPageviews.toLocaleString()}</span>
                  <span className="kpi-trend positive">Live Tracking</span>
                </div>
                <span className="kpi-sub">วันนี้: {overview.todayPageviews.toLocaleString()} ครั้ง</span>
              </div>
            </div>

            {/* Unique Visitors */}
            <div className="analytics-kpi-card kpi-purple">
              <div className="kpi-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div className="kpi-content">
                <span className="kpi-label">ผู้เข้าชมโดยประมาณ (Visitors)</span>
                <div className="kpi-value-row">
                  <span className="kpi-value">{overview.totalUniqueVisitors.toLocaleString()}</span>
                  <span className="kpi-trend positive">Unique Clients</span>
                </div>
                <span className="kpi-sub">ผู้ใช้งานไม่ซ้ำ (นับตามวัน)</span>
              </div>
            </div>

            {/* Apply Clicks / Conversions */}
            <div className="analytics-kpi-card kpi-emerald">
              <div className="kpi-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
              </div>
              <div className="kpi-content">
                <span className="kpi-label">การคลิกสมัครงาน (Conversions)</span>
                <div className="kpi-value-row">
                  <span className="kpi-value">{engagement.totalApplies.toLocaleString()}</span>
                  <span className="kpi-trend highlight">Rate {overview.overallConversion}%</span>
                </div>
                <span className="kpi-sub">ส่งต่อไปเว็บรับสมัครทางการ</span>
              </div>
            </div>

            {/* Total Engagement Signals */}
            <div className="analytics-kpi-card kpi-amber">
              <div className="kpi-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </div>
              <div className="kpi-content">
                <span className="kpi-label">การมีส่วนร่วมรวม (Engagement)</span>
                <div className="kpi-value-row">
                  <span className="kpi-value">
                    {(engagement.totalBookmarks + engagement.totalShares + engagement.totalPdfViews).toLocaleString()}
                  </span>
                  <span className="kpi-trend positive">Real Actions</span>
                </div>
                <span className="kpi-sub">
                  บันทึก {engagement.totalBookmarks} | แชร์ {engagement.totalShares} | อ่าน PDF {engagement.totalPdfViews}
                </span>
              </div>
            </div>
          </div>

          {/* ── 3. Pageviews & Visitors Timeline Chart ── */}
          <div className="analytics-chart-section">
            <div className="analytics-section-header">
              <div className="section-title-wrap">
                <h3 className="section-title">📊 แนวโน้มการเข้าชมหน้าระบบ (Pageviews Timeline)</h3>
                <span className="section-desc">สถิติจำนวนครั้งเปิดหน้าเว็บและผู้เข้าชม 7 วันย้อนหลังจากเหตุการณ์จริง</span>
              </div>
              <div className="chart-legend">
                <span className="legend-item"><span className="legend-box pageviews" /> Pageviews</span>
                <span className="legend-item"><span className="legend-box visitors" /> Visitors</span>
                <span className="legend-item"><span className="legend-box applies" /> Apply Clicks</span>
              </div>
            </div>

            {totalChartViews === 0 && (
              <div className="analytics-empty-hint">
                💡 สถิติการเปิดดูหน้ารายวันจะขยับขึ้นทันทีเมื่อมีผู้เข้าชมใช้งานระบบ
              </div>
            )}

            <div className="analytics-timeline-chart">
              <div className="chart-bars-container">
                {dailyStats.map((item, idx) => {
                  const pvHeightPercent = maxDailyViews > 0
                    ? Math.min(100, Math.round((item.pageviews / maxDailyViews) * 100))
                    : 0;
                  const visHeightPercent = maxDailyViews > 0
                    ? Math.min(100, Math.round((item.visitors / maxDailyViews) * 100))
                    : 0;
                  const isHovered = activeBarIndex === idx;

                  return (
                    <div
                      key={item.dateKey || item.date}
                      className={`chart-bar-col ${isHovered ? "hovered" : ""}`}
                      onMouseEnter={() => setActiveBarIndex(idx)}
                      onMouseLeave={() => setActiveBarIndex(null)}
                    >
                      {/* Tooltip on hover */}
                      {isHovered && (
                        <div className="chart-tooltip">
                          <div className="tooltip-date">{item.date}</div>
                          <div className="tooltip-row">
                            <span className="dot dot-pv" /> Pageviews: <strong>{item.pageviews.toLocaleString()}</strong>
                          </div>
                          <div className="tooltip-row">
                            <span className="dot dot-vis" /> Visitors: <strong>{item.visitors.toLocaleString()}</strong>
                          </div>
                          <div className="tooltip-row">
                            <span className="dot dot-app" /> Applies: <strong>{item.applies.toLocaleString()}</strong>
                          </div>
                        </div>
                      )}

                      <div className="bars-pair">
                        <div
                          className="bar bar-pageview"
                          style={{ height: `${pvHeightPercent}%`, minHeight: item.pageviews > 0 ? "6px" : "0px" }}
                        />
                        <div
                          className="bar bar-visitor"
                          style={{ height: `${visHeightPercent}%`, minHeight: item.visitors > 0 ? "6px" : "0px" }}
                        />
                      </div>
                      <span className="bar-label">{item.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── 4. Popular Jobs Table ── */}
          <div className="analytics-popular-section">
            <div className="analytics-section-header">
              <div className="section-title-wrap">
                <h3 className="section-title">🔥 ประกาศรับสมัครงานยอดนิยม (Popular Jobs)</h3>
                <span className="section-desc">ตำแหน่งงานที่ได้รับความสนใจ มีผู้เปิดดู และคลิกสมัครตามเหตุการณ์จริง</span>
              </div>

              {/* Tabs for Popular Jobs */}
              <div className="popular-tabs">
                <button
                  type="button"
                  onClick={() => setPopularTab("views")}
                  className={`popular-tab-btn ${popularTab === "views" ? "active" : ""}`}
                >
                  👁️ ดูมากที่สุด
                </button>
                <button
                  type="button"
                  onClick={() => setPopularTab("applies")}
                  className={`popular-tab-btn ${popularTab === "applies" ? "active" : ""}`}
                >
                  🚀 สมัครมากที่สุด
                </button>
                <button
                  type="button"
                  onClick={() => setPopularTab("bookmarks")}
                  className={`popular-tab-btn ${popularTab === "bookmarks" ? "active" : ""}`}
                >
                  ❤️ บันทึกโปรด
                </button>
                <button
                  type="button"
                  onClick={() => setPopularTab("shares")}
                  className={`popular-tab-btn ${popularTab === "shares" ? "active" : ""}`}
                >
                  🔗 แชร์มากที่สุด
                </button>
              </div>
            </div>

            <div className="popular-table-wrap">
              <table className="popular-table">
                <thead>
                  <tr>
                    <th style={{ width: "60px" }}>อันดับ</th>
                    <th>หน่วยงาน / ตำแหน่งงาน</th>
                    <th style={{ textAlign: "center" }}>หมวดหมู่</th>
                    <th style={{ textAlign: "right" }}>ยอดดู (Views)</th>
                    <th style={{ textAlign: "right" }}>คลิกสมัคร</th>
                    <th style={{ textAlign: "right" }}>บันทึก/แชร์</th>
                    <th style={{ textAlign: "center" }}>Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPopularJobs.map((job, idx) => {
                    const rankMedal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
                    return (
                      <tr
                        key={job.id}
                        className={`popular-row ${onSelectJob ? "clickable" : ""}`}
                        onClick={() => onSelectJob?.(job)}
                        style={{ cursor: onSelectJob ? "pointer" : "default" }}
                      >
                        <td className="rank-cell">
                          <span className={`rank-badge ${idx < 3 ? "top-three" : ""}`}>{rankMedal}</span>
                        </td>
                        <td className="job-info-cell">
                          <div className="job-dept-name">{job.department}</div>
                          <div className="job-meta-line">
                            <span>ID: {job.id}</span>
                            <span>• {job.positionsCount} ตำแหน่งเปิดรับ</span>
                            {job.deadline && <span>• ปิดรับ: {job.deadline}</span>}
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="job-category-tag">
                            {job.categories[0] || "งานราชการ"}
                          </span>
                        </td>
                        <td className="metric-cell" style={{ textAlign: "right" }}>
                          <strong>{job.views.toLocaleString()}</strong>
                        </td>
                        <td className="metric-cell" style={{ textAlign: "right", color: "var(--emerald-600, #059669)" }}>
                          <strong>{job.applies.toLocaleString()}</strong>
                        </td>
                        <td className="metric-cell" style={{ textAlign: "right" }}>
                          <span title="บันทึก">❤️ {job.bookmarks}</span>{" "}
                          <span title="แชร์" style={{ opacity: 0.7 }}>• 🔗 {job.shares}</span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <div className="conversion-pill">
                            <div className="conversion-bar-bg">
                              <div
                                className="conversion-bar-fill"
                                style={{ width: `${Math.min(100, job.conversionRate * 5)}%` }}
                              />
                            </div>
                            <span className="conversion-text">{job.conversionRate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── 5. User Engagement & Top Pages Grid ── */}
          <div className="analytics-dual-grid">
            {/* Top Pages */}
            <div className="analytics-card-panel">
              <h4 className="panel-title">📄 หน้าที่มีการเข้าชมสูงสุด (Top Pages)</h4>
              <div className="top-pages-list">
                {topPages.map((page, idx) => {
                  const maxPageViews = topPages[0]?.views || 1;
                  const percent = Math.round((page.views / maxPageViews) * 100);
                  return (
                    <div key={page.path} className="top-page-row">
                      <div className="page-row-left">
                        <span className="page-idx">#{idx + 1}</span>
                        <div className="page-details">
                          <span className="page-name">{page.name}</span>
                          <span className="page-path">{page.path}</span>
                        </div>
                      </div>
                      <div className="page-row-right">
                        <span className="page-views-num">{page.views.toLocaleString()}</span>
                        <div className="page-bar-track">
                          <div className="page-bar-fill" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Search Queries */}
            <div className="analytics-card-panel">
              <h4 className="panel-title">🔍 คำค้นหายอดนิยม (Top Search Keywords)</h4>
              <p className="panel-subtitle">คำค้นหาที่ผู้หางานพิมพ์ค้นหาจริงในระบบ</p>
              {topSearches.length > 0 ? (
                <div className="search-tags-cloud">
                  {topSearches.map((s, idx) => (
                    <div key={s.query} className={`search-query-tag ${idx < 3 ? "hot" : ""}`}>
                      <span className="query-text">{s.query}</span>
                      <span className="query-count">{s.count} ครั้ง</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="analytics-empty-hint" style={{ margin: "16px 0" }}>
                  ยังไม่มีประวัติการค้นหา — คำค้นหาจริงจะปรากฏที่นี่เมื่อมีผู้ใช้งานพิมพ์ค้นหา
                </div>
              )}

              {/* Engagement Channels Breakdown */}
              <div className="engagement-summary-box">
                <h5 className="sub-box-title">สัดส่วนพฤติกรรมผู้ใช้งานจริง (Real Engagement Breakdown)</h5>
                <div className="engagement-mini-grid">
                  <div className="mini-eng-item">
                    <span className="mini-icon">🚀</span>
                    <span className="mini-val">{engagement.totalApplies.toLocaleString()}</span>
                    <span className="mini-label">คลิกสมัครงาน</span>
                  </div>
                  <div className="mini-eng-item">
                    <span className="mini-icon">📄</span>
                    <span className="mini-val">{engagement.totalPdfViews.toLocaleString()}</span>
                    <span className="mini-label">เปิดอ่านเอกสาร PDF</span>
                  </div>
                  <div className="mini-eng-item">
                    <span className="mini-icon">❤️</span>
                    <span className="mini-val">{engagement.totalBookmarks.toLocaleString()}</span>
                    <span className="mini-label">กดบันทึกงานโปรด</span>
                  </div>
                  <div className="mini-eng-item">
                    <span className="mini-icon">🔗</span>
                    <span className="mini-val">{engagement.totalShares.toLocaleString()}</span>
                    <span className="mini-label">แชร์ประกาศงาน</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 6. Firebase Analytics Event Specifications ── */}
          <div className="analytics-footer-status">
            <div className="fb-status-left">
              <span className="fb-indicator-dot" />
              <div>
                <strong style={{ color: "var(--navy-900, #0f172a)" }}>
                  Firebase Analytics (GA4) Tracking Active — ข้อมูลจริงจากระบบ
                </strong>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "var(--navy-500, #64748b)" }}>
                  Measurement ID: <code>{firebaseStatus.measurementId}</code> • ส่ง Event: <code>page_view</code>, <code>view_item</code>, <code>select_content (apply)</code>, <code>share</code>, <code>add_to_wishlist</code>, <code>view_document</code>, <code>search</code>
                </p>
              </div>
            </div>
            <div className="fb-status-right">
              <span className="last-sync-text">อัปเดตล่าสุด: {firebaseStatus.lastEventTime} น.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
