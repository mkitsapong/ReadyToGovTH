import { test, expect } from "@playwright/test";

test.describe("Job Detail View & Actions", () => {
  test("opens job detail page when clicking 'รายละเอียด'", async ({ page }) => {
    await page.goto("/");

    const firstDetailBtn = page.locator(".job-card .btn-detail-modern").first();
    await expect(firstDetailBtn).toBeVisible({ timeout: 15000 });

    await firstDetailBtn.click();

    // Verify URL transitioned to /job/...
    await expect(page).toHaveURL(/\/job\//);

    // Verify detail container and department name
    const detailDept = page.locator(".detail-dept-title, .job-dept-name-title").first();
    await expect(detailDept).toBeVisible();

    // Verify positions section (table on desktop, cards on mobile)
    const posSection = page.locator(".detail-position-list, .detail-pos-card, .detail-table-wrapper, .detail-smart-table");
    await expect(posSection.first()).toBeVisible({ timeout: 15000 });

    // Verify back navigation button
    const backBtn = page.locator(".btn-detail-back, button:has-text('กลับ')").first();
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await expect(page).toHaveURL("/");
  });
});
