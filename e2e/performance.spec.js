import { test, expect } from "@playwright/test";

test.describe("ReadyToGovTH Performance Suite", () => {
  test("Home Page Core Web Vitals and Resource Footprint", async ({ page }) => {
    // Collect network resource stats
    const networkResources = [];
    page.on("response", async (res) => {
      try {
        const url = res.url();
        const headers = res.headers();
        const contentLength = headers["content-length"]
          ? parseInt(headers["content-length"], 10)
          : 0;
        networkResources.push({
          url,
          status: res.status(),
          type: res.request().resourceType(),
          size: contentLength,
        });
      } catch {
        // ignore closed requests
      }
    });

    // Injected script to capture CWV (FCP, LCP, CLS, Long Tasks)
    await page.addInitScript(() => {
      window.__perfMetrics = {
        fcp: null,
        lcp: null,
        cls: 0,
        longTasks: [],
        totalBlockingTime: 0,
      };

      try {
        // Observer for Paint (FCP)
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === "first-contentful-paint") {
              window.__perfMetrics.fcp = entry.startTime;
            }
          }
        });
        paintObserver.observe({ type: "paint", buffered: true });

        // Observer for LCP
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            window.__perfMetrics.lcp = entries[entries.length - 1].startTime;
          }
        });
        lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

        // Observer for CLS
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              window.__perfMetrics.cls += entry.value;
            }
          }
        });
        clsObserver.observe({ type: "layout-shift", buffered: true });

        // Observer for Long Tasks
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.__perfMetrics.longTasks.push({
              startTime: entry.startTime,
              duration: entry.duration,
            });
            if (entry.duration > 50) {
              window.__perfMetrics.totalBlockingTime += (entry.duration - 50);
            }
          }
        });
        longTaskObserver.observe({ type: "longtask", buffered: true });
      } catch (err) {
        console.error("Perf observer error:", err);
      }
    });

    const startNav = Date.now();
    await page.goto("/", { waitUntil: "networkidle" });
    const navDuration = Date.now() - startNav;

    // Ensure real jobs rendered (not skeleton)
    const realCard = page.locator(".job-card:not(.skeleton-card)").first();
    await expect(realCard).toBeVisible({ timeout: 15000 });

    // Collect metrics from browser
    const metrics = await page.evaluate(() => {
      const navEntry = performance.getEntriesByType("navigation")[0] || {};
      const domNodes = document.querySelectorAll("*").length;
      const memory = performance.memory
        ? {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
          }
        : null;

      return {
        cwv: window.__perfMetrics,
        navigation: {
          dns: navEntry.domainLookupEnd - navEntry.domainLookupStart,
          tcp: navEntry.connectEnd - navEntry.connectStart,
          ttfb: navEntry.responseStart - navEntry.requestStart,
          download: navEntry.responseEnd - navEntry.responseStart,
          domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.startTime,
          domInteractive: navEntry.domInteractive - navEntry.startTime,
          loadComplete: navEntry.loadEventEnd - navEntry.startTime,
        },
        domNodes,
        memory,
      };
    });

    console.log("=== [Home Page Web Vitals & Navigation Metrics] ===");
    console.log(`Navigation Total Duration: ${navDuration}ms`);
    console.log(`TTFB (Time to First Byte): ${metrics.navigation.ttfb?.toFixed(2)}ms`);
    console.log(`FCP (First Contentful Paint): ${metrics.cwv.fcp ? metrics.cwv.fcp.toFixed(2) + "ms" : "N/A"}`);
    console.log(`LCP (Largest Contentful Paint): ${metrics.cwv.lcp ? metrics.cwv.lcp.toFixed(2) + "ms" : "N/A"}`);
    console.log(`CLS (Cumulative Layout Shift): ${metrics.cwv.cls?.toFixed(4)}`);
    console.log(`Total Blocking Time (TBT): ${metrics.cwv.totalBlockingTime?.toFixed(2)}ms`);
    console.log(`Long Tasks Count: ${metrics.cwv.longTasks.length}`);
    console.log(`DOM ContentLoaded: ${metrics.navigation.domContentLoaded?.toFixed(2)}ms`);
    console.log(`Page Load Complete: ${metrics.navigation.loadComplete?.toFixed(2)}ms`);
    console.log(`DOM Node Count: ${metrics.domNodes}`);
    if (metrics.memory) {
      console.log(`JS Heap Used: ${(metrics.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`JS Heap Total: ${(metrics.memory.totalJSHeapSize / (1024 * 1024)).toFixed(2)} MB`);
    }

    // Resource Breakdown
    const breakdown = networkResources.reduce((acc, r) => {
      const type = r.type || "other";
      acc[type] = acc[type] || { count: 0, size: 0 };
      acc[type].count += 1;
      acc[type].size += r.size;
      return acc;
    }, {});
    console.log("=== [Resource Breakdown] ===", JSON.stringify(breakdown, null, 2));

    expect(metrics.cwv.cls).toBeLessThan(0.25);
    expect(metrics.domNodes).toBeLessThan(3500);
  });

  test("Client-Side Interactive Latency (Search & Filter responsiveness)", async ({ page }) => {
    await page.goto("/");
    const realCard = page.locator(".job-card:not(.skeleton-card)").first();
    await expect(realCard).toBeVisible({ timeout: 15000 });

    const searchInput = page.locator("#job-search-input");
    await expect(searchInput).toBeVisible();

    // 1. Instant Search Filter Latency
    const t0 = Date.now();
    await searchInput.fill("ชลประทาน");
    await page.waitForTimeout(300); // debounce
    const t1 = Date.now();
    console.log(`Search Input response latency: ${t1 - t0}ms`);
    expect(t1 - t0).toBeLessThan(1200);

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(300);

    // 2. Category Filter Switch Latency
    const civilFilter = page.locator(".category-pill, .filter-chip, button, a").filter({ hasText: /ข้าราชการ/i }).first();
    if (await civilFilter.isVisible()) {
      const c0 = Date.now();
      await civilFilter.click();
      await page.waitForTimeout(200);
      const c1 = Date.now();
      console.log(`Category Filter switch latency: ${c1 - c0}ms`);
      expect(c1 - c0).toBeLessThan(2000);
    }

    // 3. Job Detail View Transition Latency
    const detailBtn = page.locator(".job-card:not(.skeleton-card) .btn-detail-modern").first();
    await expect(detailBtn).toBeVisible({ timeout: 10000 });
    const m0 = Date.now();
    await detailBtn.click();
    await expect(page).toHaveURL(/\/job\//);
    const detailContainer = page.locator(".detail-position-list, .detail-pos-card, .job-dept-name-title").first();
    await expect(detailContainer).toBeVisible({ timeout: 10000 });
    const m1 = Date.now();
    console.log(`Job Detail View transition latency: ${m1 - m0}ms`);
    expect(m1 - m0).toBeLessThan(2500);

    // 4. Back Navigation Latency
    const backBtn = page.locator(".btn-detail-back, button:has-text('กลับ')").first();
    if (await backBtn.isVisible()) {
      const b0 = Date.now();
      await backBtn.click();
      await expect(page).toHaveURL("/");
      const b1 = Date.now();
      console.log(`Back Navigation latency: ${b1 - b0}ms`);
      expect(b1 - b0).toBeLessThan(1000);
    }
  });

  test("Scroll Smoothness & Long Task Detection", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".job-card:not(.skeleton-card)").first()).toBeVisible({ timeout: 15000 });

    // Track long tasks during intensive scroll
    const scrollPerf = await page.evaluate(async () => {
      let longTasksDuringScroll = 0;
      let totalDuration = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          longTasksDuringScroll++;
          totalDuration += entry.duration;
        }
      });
      observer.observe({ type: "longtask", buffered: false });

      // Smooth scroll down and up
      const scrollStep = 300;
      for (let i = 0; i < 6; i++) {
        window.scrollBy({ top: scrollStep, behavior: "smooth" });
        await new Promise((r) => setTimeout(r, 100));
      }
      for (let i = 0; i < 6; i++) {
        window.scrollBy({ top: -scrollStep, behavior: "smooth" });
        await new Promise((r) => setTimeout(r, 100));
      }

      await new Promise((r) => setTimeout(r, 200));
      observer.disconnect();

      return { longTasksDuringScroll, totalDuration };
    });

    console.log(`Scroll Test - Long Tasks Count: ${scrollPerf.longTasksDuringScroll}`);
    console.log(`Scroll Test - Long Tasks Total Duration: ${scrollPerf.totalDuration.toFixed(2)}ms`);
    expect(scrollPerf.longTasksDuringScroll).toBeLessThan(15);
  });

  test("API Endpoints Throughput & Latency", async ({ request }) => {
    // 1. OG Image SVG Generation
    const ogT0 = Date.now();
    const ogRes = await request.get("/api/og?dept=กรมชลประทาน&pos=วิศวกรชลประทาน&count=2&salary=15000&cat=ข้าราชการ");
    const ogLatency = Date.now() - ogT0;
    expect(ogRes.status()).toBe(200);
    const ogContentType = ogRes.headers()["content-type"];
    console.log(`[API /api/og] Status: ${ogRes.status()}, Latency: ${ogLatency}ms, Content-Type: ${ogContentType}`);
    expect(ogLatency).toBeLessThan(1000);

    // 2. Sitemap Generation
    const smT0 = Date.now();
    const smRes = await request.get("/api/sitemap.xml");
    const smLatency = Date.now() - smT0;
    expect(smRes.status()).toBe(200);
    console.log(`[API /api/sitemap.xml] Status: ${smRes.status()}, Latency: ${smLatency}ms`);
    expect(smLatency).toBeLessThan(500);

    // 3. Share redirect
    const shT0 = Date.now();
    const shRes = await request.get("/api/share?id=sample-123");
    const shLatency = Date.now() - shT0;
    console.log(`[API /api/share] Status: ${shRes.status()}, Latency: ${shLatency}ms`);
    expect(shLatency).toBeLessThan(500);
  });
});
