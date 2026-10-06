import { describe, it, expect, beforeEach } from "vitest";
import {
  getTodayKey,
  getPast7Days,
  getRealMetrics,
  resetRealAnalytics,
  trackPageView,
  trackJobView,
  trackJobApply,
  trackJobShare,
  trackJobBookmark,
  trackDocView,
  trackSearchQuery,
  getAdminAnalyticsData,
} from "./analyticsService.js";

describe("analyticsService.js (100% Real Tracking)", () => {
  beforeEach(() => {
    resetRealAnalytics();
    localStorage.clear();
  });

  describe("getTodayKey & getPast7Days", () => {
    it("returns formatted YYYY-MM-DD date key", () => {
      const today = getTodayKey();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("generates exactly 7 consecutive days ending today with Thai labels", () => {
      const past7 = getPast7Days();
      expect(past7).toHaveLength(7);
      expect(past7[6].key).toBe(getTodayKey());
      expect(past7[0].label).toBeTruthy();
    });
  });

  describe("getRealMetrics & resetRealAnalytics", () => {
    it("starts from zero clean state without mockups", () => {
      const metrics = getRealMetrics();
      expect(metrics.totalPageviews).toBe(0);
      expect(metrics.todayPageviews).toBe(0);
      expect(metrics.engagement.totalApplies).toBe(0);
      expect(Object.keys(metrics.jobStats)).toHaveLength(0);
    });

    it("resets all metrics cleanly when reset is called", () => {
      trackPageView("/test");
      expect(getRealMetrics().totalPageviews).toBe(1);

      resetRealAnalytics();
      expect(getRealMetrics().totalPageviews).toBe(0);
    });
  });

  describe("Event tracking functions", () => {
    it("tracks pageviews and updates topPages", () => {
      trackPageView("/", "หน้าแรก");
      trackPageView("/category/civil", "งานข้าราชการ");
      trackPageView("/", "หน้าแรก");

      const metrics = getRealMetrics();
      expect(metrics.totalPageviews).toBe(3);
      expect(metrics.todayPageviews).toBe(3);
      expect(metrics.topPages["/"].views).toBe(2);
      expect(metrics.topPages["/category/civil"].views).toBe(1);
    });

    it("tracks job views per job ID without synthetic addition", () => {
      const sampleJob = { id: "job-101", department: "กรมสรรพากร" };
      trackJobView(sampleJob);

      const metrics = getRealMetrics();
      expect(metrics.jobStats["job-101"].views).toBe(1);
    });

    it("tracks job apply conversion clicks", () => {
      const sampleJob = { id: "job-101", department: "กรมสรรพากร" };
      trackJobApply(sampleJob);

      const metrics = getRealMetrics();
      expect(metrics.engagement.totalApplies).toBe(1);
      expect(metrics.jobStats["job-101"].applies).toBe(1);
    });

    it("tracks job share actions", () => {
      const sampleJob = { id: "job-101", department: "กรมสรรพากร" };
      trackJobShare(sampleJob, "facebook");

      const metrics = getRealMetrics();
      expect(metrics.engagement.totalShares).toBe(1);
      expect(metrics.jobStats["job-101"].shares).toBe(1);
    });

    it("tracks bookmarks increment and decrement", () => {
      const sampleJob = { id: "job-101", department: "กรมสรรพากร" };
      trackJobBookmark(sampleJob, true);
      expect(getRealMetrics().engagement.totalBookmarks).toBe(1);
      expect(getRealMetrics().jobStats["job-101"].bookmarks).toBe(1);

      trackJobBookmark(sampleJob, false);
      expect(getRealMetrics().engagement.totalBookmarks).toBe(0);
      expect(getRealMetrics().jobStats["job-101"].bookmarks).toBe(0);
    });

    it("tracks document PDF views", () => {
      const sampleJob = { id: "job-101", department: "กรมสรรพากร" };
      trackDocView(sampleJob, 0);

      const metrics = getRealMetrics();
      expect(metrics.engagement.totalPdfViews).toBe(1);
      expect(metrics.jobStats["job-101"].pdfViews).toBe(1);
    });

    it("tracks search queries correctly", () => {
      trackSearchQuery("ธุรการ", 10);
      trackSearchQuery("ธุรการ", 10);
      trackSearchQuery("นิติกร", 5);

      const metrics = getRealMetrics();
      expect(metrics.searches["ธุรการ"]).toBe(2);
      expect(metrics.searches["นิติกร"]).toBe(1);
    });
  });

  describe("getAdminAnalyticsData", () => {
    it("returns authentic aggregated data with zero mockups", () => {
      const jobs = [
        { id: "j1", department: "กรมเจ้าท่า", positionList: [{ title: "นายช่าง" }] },
        { id: "j2", department: "กรมศุลกากร", positionList: [{ title: "นิติกร" }] },
      ];

      // Initially no activity
      const initial = getAdminAnalyticsData(jobs);
      expect(initial.overview.totalPageviews).toBe(0);
      expect(initial.popularJobs[0].views).toBe(0);
      expect(initial.popularJobs[1].views).toBe(0);
      expect(initial.overview.overallConversion).toBe("0.0");

      // Track 1 view and 1 apply on j1
      trackPageView("/");
      trackJobView(jobs[0]);
      trackJobApply(jobs[0]);

      const updated = getAdminAnalyticsData(jobs);
      expect(updated.overview.totalPageviews).toBe(1);
      expect(updated.popularJobs[0].id).toBe("j1");
      expect(updated.popularJobs[0].views).toBe(1);
      expect(updated.popularJobs[0].applies).toBe(1);
      expect(updated.popularJobs[0].conversionRate).toBe(100.0);
      expect(updated.firebaseStatus.isRealData).toBe(true);
    });
  });
});
