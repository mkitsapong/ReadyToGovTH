import { test, expect } from "@playwright/test";

test.describe("Admin Analytics Dashboard (100% Real Data)", () => {
  test("navigates to /admin/analytics and verifies live KPI metrics", async ({ page }) => {
    await page.goto("/admin/analytics");

    // Verify modal dialog or dashboard page renders
    const dashboard = page.locator(".analytics-modal");
    await expect(dashboard).toBeVisible({ timeout: 15000 });

    // Verify 100% REAL DATA badge
    const badge = page.locator(".analytics-live-tag");
    await expect(badge).toBeVisible();
    await expect(badge).toContainText(/REAL DATA/i);

    // Verify KPI grid cards
    const kpiCards = page.locator(".analytics-kpi-card");
    await expect(kpiCards).toHaveCount(4);

    // Verify KPI card labels
    await expect(page.locator("text=ยอดเปิดดูหน้ารวม (Pageviews)").first()).toBeVisible();
    await expect(page.locator("text=การคลิกสมัครงาน (Conversions)").first()).toBeVisible();

    // Verify Timeline Chart section
    await expect(page.locator(".analytics-chart-section")).toBeVisible();

    // Verify Popular Jobs section
    await expect(page.locator(".analytics-popular-section")).toBeVisible();
    await expect(page.locator(".popular-table")).toBeVisible();
  });
});
