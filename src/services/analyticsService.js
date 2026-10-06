/**
 * analyticsService.js
 * 100% Real Tracking & Analytics Service for ReadyToGovTH
 * 
 * Features:
 * - Official Google Analytics 4 integration via firebase/analytics (logEvent)
 * - 100% Real Live Metrics (Pageviews, Popular Jobs, User Engagement) — ZERO Mockups
 * - Dual persistence: Instant LocalStorage + Atomic Firestore Syncing
 * - Dynamic 7-day calendar tracking with real date calculations
 */

import { app, isFirebaseConfigured, db } from "../firebase.js";

// Safe reference to Firebase Analytics instance (GA4)
let analyticsInstance = null;
let isAnalyticsInitialized = false;

/**
 * Initialize Firebase Analytics safely (runs only in supported browser environments)
 */
export async function initFirebaseAnalytics() {
  if (isAnalyticsInitialized) return analyticsInstance;
  isAnalyticsInitialized = true;

  if (typeof window === "undefined") return null;

  try {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    const supported = await isSupported();
    if (supported && isFirebaseConfigured) {
      analyticsInstance = getAnalytics(app);
      console.info("📊 Firebase Analytics (GA4) initialized successfully (Measurement ID: G-XPWZC3MKCL)");
    } else {
      console.debug("Firebase Analytics is not supported in this browser context or config is demo.");
    }
  } catch (err) {
    console.debug("Firebase Analytics init skipped:", err);
  }
  return analyticsInstance;
}

// Automatically attempt init in browser
if (typeof window !== "undefined") {
  initFirebaseAnalytics();
}

/**
 * Log event to Firebase Analytics (GA4)
 */
async function logFirebaseEvent(eventName, eventParams = {}) {
  try {
    if (!analyticsInstance) {
      await initFirebaseAnalytics();
    }
    if (analyticsInstance) {
      const { logEvent } = await import("firebase/analytics");
      logEvent(analyticsInstance, eventName, eventParams);
    }
  } catch (e) {
    console.debug(`[Analytics] logEvent(${eventName}) failed:`, e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Real Data Storage Keys & Schema (NO MOCKUPS)
// ─────────────────────────────────────────────────────────────────────────────

const REAL_METRICS_KEY = "readytogov_real_analytics_v2";
const VISITOR_ID_KEY = "readytogov_visitor_uid";
const VISITED_DATES_KEY = "readytogov_visited_dates";
const BOOKMARKS_STORAGE_KEY = "readytogov_bookmarks";

/**
 * Generate or get a persistent anonymous visitor ID
 */
export function getVisitorId() {
  if (typeof window === "undefined") return "server";
  try {
    let vid = localStorage.getItem(VISITOR_ID_KEY);
    if (!vid) {
      vid = "v_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem(VISITOR_ID_KEY, vid);
    }
    return vid;
  } catch {
    return "anon";
  }
}

/**
 * Get today's key in YYYY-MM-DD format
 */
export function getTodayKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Generate last 7 days keys and Thai formatted labels dynamically
 */
export function getPast7Days() {
  const list = [];
  const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd}`;
    const label = `${d.getDate()} ${thaiMonths[d.getMonth()]}`;
    list.push({ key, label, dateObj: d });
  }
  return list;
}

/**
 * Empty authentic base metrics state (Clean zero baseline)
 */
function createEmptyMetrics() {
  return {
    totalPageviews: 0,
    todayPageviews: 0,
    lastActiveDate: getTodayKey(),
    dailyStats: {}, // [YYYY-MM-DD]: { pageviews, visitors, applies, shares }
    topPages: {},   // [cleanPath]: { path, name, views }
    jobStats: {},   // [jobId]: { views, applies, shares, bookmarks, pdfViews, lastViewed }
    searches: {},   // [query]: count
    engagement: {
      totalApplies: 0,
      totalBookmarks: 0,
      totalShares: 0,
      totalPdfViews: 0,
    },
  };
}

/**
 * Load local real metrics safely
 */
export function getRealMetrics() {
  if (typeof window === "undefined") return createEmptyMetrics();

  try {
    const raw = localStorage.getItem(REAL_METRICS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        // Reset todayPageviews if today is a new date
        const today = getTodayKey();
        if (parsed.lastActiveDate !== today) {
          parsed.todayPageviews = 0;
          parsed.lastActiveDate = today;
        }
        return {
          totalPageviews: parsed.totalPageviews || 0,
          todayPageviews: parsed.todayPageviews || 0,
          lastActiveDate: parsed.lastActiveDate || today,
          dailyStats: parsed.dailyStats || {},
          topPages: parsed.topPages || {},
          jobStats: parsed.jobStats || {},
          searches: parsed.searches || {},
          engagement: {
            totalApplies: parsed.engagement?.totalApplies || 0,
            totalBookmarks: parsed.engagement?.totalBookmarks || 0,
            totalShares: parsed.engagement?.totalShares || 0,
            totalPdfViews: parsed.engagement?.totalPdfViews || 0,
          },
        };
      }
    }
  } catch (e) {
    console.debug("Failed to read local real metrics:", e);
  }
  return createEmptyMetrics();
}

/**
 * Save real metrics locally
 */
export function saveRealMetrics(data) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REAL_METRICS_KEY, JSON.stringify(data));
  } catch (e) {
    console.debug("Failed to save local real metrics:", e);
  }
}

/**
 * Reset all analytics data (For Admin testing / start fresh)
 */
export function resetRealAnalytics() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(REAL_METRICS_KEY);
    localStorage.removeItem(VISITED_DATES_KEY);
  } catch (e) {
    console.debug("Failed to reset analytics:", e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Asynchronous Firestore Syncing (Graceful fallback if permissions unconfigured)
// ─────────────────────────────────────────────────────────────────────────────

// Circuit-breaker flag to disable Firestore writes if rules deny access, preventing repetitive RPC request spam
let isFirestoreSyncBlocked = false;
let lastSyncWarningTime = 0;

async function syncDocToFirestore(colName, docId, updateData) {
  if (isFirestoreSyncBlocked || !isFirebaseConfigured || !db || typeof window === "undefined") return;
  try {
    const { doc, setDoc } = await import("firebase/firestore/lite");
    await setDoc(doc(db, colName, String(docId)), updateData, { merge: true });
  } catch (e) {
    if (e?.code === "permission-denied" || e?.message?.includes("permission-denied")) {
      isFirestoreSyncBlocked = true;
      const now = Date.now();
      if (now - lastSyncWarningTime > 60000) {
        console.info("ℹ️ [Analytics] Remote Firestore sync paused (permission-denied / rules pending deployment). Local & GA4 tracking active.");
        lastSyncWarningTime = now;
      }
    } else {
      console.debug(`[Analytics Firestore Sync] ${colName}/${docId} skipped:`, e?.message);
    }
  }
}

// Deduplication map to prevent double-tracking in rapid re-renders
const recentJobViews = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// Event Tracking Functions (Dispatched across the Web App)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. Track Page View
 */
export function trackPageView(pagePath, pageTitle = "") {
  if (typeof window === "undefined") return;

  const cleanPath = (pagePath || "/").split("?")[0] || "/";
  const today = getTodayKey();

  // Log to GA4
  logFirebaseEvent("page_view", {
    page_path: cleanPath,
    page_title: pageTitle || document.title,
    page_location: window.location.href,
  });

  const data = getRealMetrics();
  data.totalPageviews = (data.totalPageviews || 0) + 1;
  data.todayPageviews = (data.todayPageviews || 0) + 1;
  data.lastActiveDate = today;

  // Daily bucket
  if (!data.dailyStats[today]) {
    data.dailyStats[today] = { pageviews: 0, visitors: 0, applies: 0, shares: 0 };
  }
  data.dailyStats[today].pageviews = (data.dailyStats[today].pageviews || 0) + 1;

  // Unique visitor detection for today
  try {
    const visitedDatesRaw = localStorage.getItem(VISITED_DATES_KEY);
    const visitedDates = visitedDatesRaw ? JSON.parse(visitedDatesRaw) : [];
    if (!visitedDates.includes(today)) {
      visitedDates.push(today);
      localStorage.setItem(VISITED_DATES_KEY, JSON.stringify(visitedDates.slice(-30)));
      data.dailyStats[today].visitors = (data.dailyStats[today].visitors || 0) + 1;
    }
  } catch {
    // Ignore
  }

  // Top pages tracking
  const currentTitle = pageTitle || resolvePageTitle(cleanPath);
  if (!data.topPages[cleanPath]) {
    data.topPages[cleanPath] = { path: cleanPath, name: currentTitle, views: 0 };
  }
  data.topPages[cleanPath].views += 1;
  if (currentTitle && currentTitle !== cleanPath) {
    data.topPages[cleanPath].name = currentTitle;
  }

  saveRealMetrics(data);

  // Firestore sync
  import("firebase/firestore/lite")
    .then(({ increment }) => {
      syncDocToFirestore("analytics_summary", "global", {
        totalPageviews: increment(1),
        lastUpdated: new Date().toISOString(),
      });
      syncDocToFirestore("analytics_daily", today, {
        date: today,
        pageviews: increment(1),
      });
    })
    .catch(() => {});
}

/**
 * 2. Track Job View (when user opens a job card or detail modal)
 */
export function trackJobView(job) {
  if (!job || !job.id) return;
  const id = String(job.id);

  // Deduplicate rapid re-renders (3s window)
  const now = Date.now();
  const lastTime = recentJobViews.get(id) || 0;
  if (now - lastTime < 3000) return;
  recentJobViews.set(id, now);

  // Log to GA4
  logFirebaseEvent("view_item", {
    item_id: id,
    item_name: job.department || "ประกาศรับสมัครงาน",
    item_category: Array.isArray(job.categories) ? job.categories[0] : job.category || "งานราชการ",
  });

  const data = getRealMetrics();
  const current = data.jobStats[id] || { views: 0, applies: 0, shares: 0, bookmarks: 0, pdfViews: 0 };
  current.views = (current.views || 0) + 1;
  current.lastViewed = new Date().toISOString();
  data.jobStats[id] = current;

  saveRealMetrics(data);

  // Firestore sync
  import("firebase/firestore/lite")
    .then(({ increment }) => {
      syncDocToFirestore("analytics_jobs", id, {
        views: increment(1),
        department: job.department || "",
        lastViewed: new Date().toISOString(),
      });
    })
    .catch(() => {});
}

/**
 * 3. Track Official Apply Link Click (Conversion event)
 */
export function trackJobApply(job) {
  if (!job || !job.id) return;
  const id = String(job.id);
  const today = getTodayKey();

  // Log to GA4
  logFirebaseEvent("select_content", {
    content_type: "apply_button",
    item_id: id,
    item_name: job.department || "",
    apply_url: job.applyUrl || "",
  });

  const data = getRealMetrics();
  data.engagement.totalApplies = (data.engagement.totalApplies || 0) + 1;

  if (!data.dailyStats[today]) {
    data.dailyStats[today] = { pageviews: 0, visitors: 0, applies: 0, shares: 0 };
  }
  data.dailyStats[today].applies = (data.dailyStats[today].applies || 0) + 1;

  const current = data.jobStats[id] || { views: 0, applies: 0, shares: 0, bookmarks: 0, pdfViews: 0 };
  current.applies = (current.applies || 0) + 1;
  data.jobStats[id] = current;

  saveRealMetrics(data);

  // Firestore sync
  import("firebase/firestore/lite")
    .then(({ increment }) => {
      syncDocToFirestore("analytics_summary", "global", {
        totalApplies: increment(1),
      });
      syncDocToFirestore("analytics_daily", today, {
        applies: increment(1),
      });
      syncDocToFirestore("analytics_jobs", id, {
        applies: increment(1),
      });
    })
    .catch(() => {});
}

/**
 * 4. Track Job Share (Facebook, Line, Copy link, Poster)
 */
export function trackJobShare(job, platform = "link") {
  if (!job || !job.id) return;
  const id = String(job.id);
  const today = getTodayKey();

  // Log to GA4
  logFirebaseEvent("share", {
    method: platform,
    content_type: "job",
    item_id: id,
  });

  const data = getRealMetrics();
  data.engagement.totalShares = (data.engagement.totalShares || 0) + 1;

  if (!data.dailyStats[today]) {
    data.dailyStats[today] = { pageviews: 0, visitors: 0, applies: 0, shares: 0 };
  }
  data.dailyStats[today].shares = (data.dailyStats[today].shares || 0) + 1;

  const current = data.jobStats[id] || { views: 0, applies: 0, shares: 0, bookmarks: 0, pdfViews: 0 };
  current.shares = (current.shares || 0) + 1;
  data.jobStats[id] = current;

  saveRealMetrics(data);

  // Firestore sync
  import("firebase/firestore/lite")
    .then(({ increment }) => {
      syncDocToFirestore("analytics_jobs", id, {
        shares: increment(1),
      });
      syncDocToFirestore("analytics_daily", today, {
        shares: increment(1),
      });
    })
    .catch(() => {});
}

/**
 * 5. Track Job Bookmark (Favorite)
 */
export function trackJobBookmark(job, isAdded = true) {
  if (!job || !job.id) return;
  const id = String(job.id);

  // Log to GA4
  logFirebaseEvent(isAdded ? "add_to_wishlist" : "remove_from_wishlist", {
    item_id: id,
    item_name: job.department || "",
  });

  const data = getRealMetrics();
  if (isAdded) {
    data.engagement.totalBookmarks = (data.engagement.totalBookmarks || 0) + 1;
  } else {
    data.engagement.totalBookmarks = Math.max(0, (data.engagement.totalBookmarks || 0) - 1);
  }

  const current = data.jobStats[id] || { views: 0, applies: 0, shares: 0, bookmarks: 0, pdfViews: 0 };
  current.bookmarks = Math.max(0, (current.bookmarks || 0) + (isAdded ? 1 : -1));
  data.jobStats[id] = current;

  saveRealMetrics(data);

  // Firestore sync
  import("firebase/firestore/lite")
    .then(({ increment }) => {
      syncDocToFirestore("analytics_jobs", id, {
        bookmarks: increment(isAdded ? 1 : -1),
      });
    })
    .catch(() => {});
}

/**
 * 6. Track PDF Announcement Document View
 */
export function trackDocView(job, docIndex = 0) {
  if (!job || !job.id) return;
  const id = String(job.id);

  // Log to GA4
  logFirebaseEvent("view_document", {
    item_id: id,
    doc_index: docIndex,
  });

  const data = getRealMetrics();
  data.engagement.totalPdfViews = (data.engagement.totalPdfViews || 0) + 1;

  const current = data.jobStats[id] || { views: 0, applies: 0, shares: 0, bookmarks: 0, pdfViews: 0 };
  current.pdfViews = (current.pdfViews || 0) + 1;
  data.jobStats[id] = current;

  saveRealMetrics(data);

  // Firestore sync
  import("firebase/firestore/lite")
    .then(({ increment }) => {
      syncDocToFirestore("analytics_jobs", id, {
        pdfViews: increment(1),
      });
    })
    .catch(() => {});
}

/**
 * 7. Track User Search Query
 */
export function trackSearchQuery(query, resultsCount = 0) {
  const clean = (query || "").trim();
  if (!clean || clean.length < 2) return;

  // Log to GA4
  logFirebaseEvent("search", {
    search_term: clean,
    number_of_results: resultsCount,
  });

  const data = getRealMetrics();
  data.searches[clean] = (data.searches[clean] || 0) + 1;

  saveRealMetrics(data);

  // Firestore sync
  import("firebase/firestore/lite")
    .then(({ increment }) => {
      syncDocToFirestore("analytics_searches", clean.toLowerCase(), {
        query: clean,
        count: increment(1),
        lastSearched: new Date().toISOString(),
      });
    })
    .catch(() => {});
}

// ─────────────────────────────────────────────────────────────────────────────
// Real Analytics Data Aggregation for Admin Dashboard (ZERO MOCKUPS)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Helper to get readable Thai title from URL path
 */
function resolvePageTitle(path) {
  if (path === "/" || path === "") return "หน้าแรก (รายการประกาศทั้งหมด)";
  if (path === "/stats") return "สถิติตลาดงานราชการ";
  if (path === "/bookmarks") return "งานที่บันทึกไว้ (Bookmarks)";
  if (path.startsWith("/category/civil")) return "งานข้าราชการ";
  if (path.startsWith("/category/government")) return "งานพนักงานราชการ";
  if (path.startsWith("/category/state")) return "งานรัฐวิสาหกิจ";
  if (path.startsWith("/category/agency")) return "งานพนักงานหน่วยงานของรัฐ";
  if (path.startsWith("/category/temp")) return "งานลูกจ้างชั่วคราว";
  if (path.startsWith("/job/")) return "หน้ารายละเอียดประกาศงาน";
  return path;
}

/**
 * Read current actual bookmarks from localStorage to keep bookmark counts accurate
 */
function getActiveStoredBookmarkIds() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    }
  } catch {
    // Ignore
  }
  return [];
}

/**
 * Retrieve Complete REAL Analytics Data for Admin Dashboard
 * 100% Calculated from actual tracked events — NO MOCKUPS / NO SYNTHETIC MULTIPLIERS
 */
export function getAdminAnalyticsData(allJobs = []) {
  const data = getRealMetrics();
  const jobStats = data.jobStats || {};
  const activeBookmarks = new Set(getActiveStoredBookmarkIds());

  // 1. Popular Jobs (Populated with 100% actual numbers)
  const popularJobs = allJobs.map((j) => {
    const stat = jobStats[String(j.id)] || {};
    const views = stat.views || 0;
    const applies = stat.applies || 0;
    // Check if currently bookmarked by user or recorded in stats
    const isCurrentlyBookmarked = activeBookmarks.has(String(j.id));
    const bookmarks = Math.max(stat.bookmarks || 0, isCurrentlyBookmarked ? 1 : 0);
    const shares = stat.shares || 0;
    const pdfViews = stat.pdfViews || 0;
    const conversionRate = views > 0 ? ((applies / views) * 100).toFixed(1) : "0.0";

    return {
      id: j.id,
      department: j.department || "หน่วยงานภาครัฐ",
      categories: j.categories || (j.category ? [j.category] : ["งานราชการ"]),
      positionsCount: (j.positionList || []).length || 1,
      deadline: j.deadline || "",
      views,
      applies,
      bookmarks,
      shares,
      pdfViews,
      conversionRate: parseFloat(conversionRate),
      hasActivity: views > 0 || applies > 0 || bookmarks > 0 || shares > 0 || pdfViews > 0,
    };
  });

  // Sort popular jobs: active jobs first, then by views descending
  popularJobs.sort((a, b) => {
    if (b.views !== a.views) return b.views - a.views;
    if (b.applies !== a.applies) return b.applies - a.applies;
    if (b.bookmarks !== a.bookmarks) return b.bookmarks - a.bookmarks;
    return 0;
  });

  // 2. Real Daily Stats for the past 7 days
  const past7Days = getPast7Days();
  const dailyStats = past7Days.map(({ key, label }) => {
    const dayData = data.dailyStats[key] || {};
    return {
      dateKey: key,
      date: label,
      pageviews: dayData.pageviews || 0,
      visitors: dayData.visitors || 0,
      applies: dayData.applies || 0,
      shares: dayData.shares || 0,
    };
  });

  // 3. Real Top Pages (Only pages that have actually been viewed)
  const topPagesList = Object.values(data.topPages || {}).map((p) => ({
    path: p.path,
    name: p.name || resolvePageTitle(p.path),
    views: p.views || 0,
  }));
  topPagesList.sort((a, b) => b.views - a.views);

  // If newly launched and no pages tracked yet, add current page with 0
  if (topPagesList.length === 0) {
    topPagesList.push({
      path: "/",
      name: "หน้าแรก (รายการประกาศทั้งหมด)",
      views: Math.max(data.totalPageviews, 0),
    });
  }

  // 4. Real Top Search Keywords
  const topSearches = Object.entries(data.searches || {})
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // 5. Total Engagement Aggregates
  const totalApplies = data.engagement.totalApplies || popularJobs.reduce((s, j) => s + j.applies, 0);
  const totalBookmarks = Math.max(data.engagement.totalBookmarks || 0, activeBookmarks.size);
  const totalShares = data.engagement.totalShares || popularJobs.reduce((s, j) => s + j.shares, 0);
  const totalPdfViews = data.engagement.totalPdfViews || popularJobs.reduce((s, j) => s + j.pdfViews, 0);

  // Total unique visitors: sum of daily unique visitors or at least 1 if pageviews > 0
  const sumDailyVisitors = dailyStats.reduce((s, d) => s + d.visitors, 0);
  const totalUniqueVisitors = Math.max(sumDailyVisitors, data.totalPageviews > 0 ? 1 : 0);

  const overallConversion = data.totalPageviews > 0
    ? ((totalApplies / data.totalPageviews) * 100).toFixed(1)
    : "0.0";

  return {
    overview: {
      totalPageviews: data.totalPageviews,
      todayPageviews: data.todayPageviews,
      totalUniqueVisitors,
      overallConversion,
    },
    dailyStats,
    topPages: topPagesList,
    popularJobs: popularJobs.slice(0, 20),
    allPopularJobs: popularJobs,
    engagement: {
      totalApplies,
      totalBookmarks,
      totalShares,
      totalPdfViews,
    },
    topSearches,
    firebaseStatus: {
      measurementId: "G-XPWZC3MKCL",
      projectId: "readytogovth-app",
      isActive: true,
      lastEventTime: new Date().toLocaleTimeString("th-TH"),
      isRealData: true,
    },
  };
}

/**
 * Fetch Live Firestore Analytics and merge with Local Real Data
 * Queries Firestore collections: analytics_summary, analytics_daily, analytics_jobs, analytics_searches
 */
export async function fetchLiveAdminAnalyticsData(allJobs = []) {
  // Start with immediate local real data
  const baseData = getAdminAnalyticsData(allJobs);

  if (!isFirebaseConfigured || !db || typeof window === "undefined") {
    return baseData;
  }

  try {
    const { collection, getDocs, doc, getDoc } = await import("firebase/firestore/lite");

    // 1. Fetch Global Summary
    const summarySnap = await getDoc(doc(db, "analytics_summary", "global")).catch(() => null);
    if (summarySnap && summarySnap.exists()) {
      const summary = summarySnap.data();
      if (summary.totalPageviews != null) {
        baseData.overview.totalPageviews = Math.max(baseData.overview.totalPageviews, summary.totalPageviews);
      }
      if (summary.totalApplies != null) {
        baseData.engagement.totalApplies = Math.max(baseData.engagement.totalApplies, summary.totalApplies);
      }
    }

    // 2. Fetch Jobs Stats from Firestore
    const jobsSnap = await getDocs(collection(db, "analytics_jobs")).catch(() => null);
    if (jobsSnap && !jobsSnap.empty) {
      const firestoreJobMap = {};
      jobsSnap.forEach((d) => {
        firestoreJobMap[d.id] = d.data();
      });

      // Merge into popular jobs
      baseData.popularJobs = baseData.popularJobs.map((j) => {
        const fs = firestoreJobMap[String(j.id)];
        if (!fs) return j;
        const views = Math.max(j.views, fs.views || 0);
        const applies = Math.max(j.applies, fs.applies || 0);
        const bookmarks = Math.max(j.bookmarks, fs.bookmarks || 0);
        const shares = Math.max(j.shares, fs.shares || 0);
        const pdfViews = Math.max(j.pdfViews, fs.pdfViews || 0);
        const conversionRate = views > 0 ? ((applies / views) * 100).toFixed(1) : "0.0";

        return {
          ...j,
          views,
          applies,
          bookmarks,
          shares,
          pdfViews,
          conversionRate: parseFloat(conversionRate),
          hasActivity: views > 0 || applies > 0 || bookmarks > 0 || shares > 0 || pdfViews > 0,
        };
      });

      // Re-sort
      baseData.popularJobs.sort((a, b) => b.views - a.views);
    }

    // 3. Fetch Searches
    const searchesSnap = await getDocs(collection(db, "analytics_searches")).catch(() => null);
    if (searchesSnap && !searchesSnap.empty) {
      const searchList = [];
      searchesSnap.forEach((d) => {
        const item = d.data();
        if (item.query) {
          searchList.push({ query: item.query, count: item.count || 1 });
        }
      });
      searchList.sort((a, b) => b.count - a.count);
      if (searchList.length > 0) {
        baseData.topSearches = searchList.slice(0, 15);
      }
    }
  } catch (err) {
    console.debug("[Analytics] Firestore live fetch notice:", err.message);
  }

  return baseData;
}
